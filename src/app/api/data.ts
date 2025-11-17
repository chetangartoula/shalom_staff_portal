
import type { Trek, Service, Guide, Porter } from '@/lib/types';
import { initialTreks, services as staticServices, initialGuides, initialPorters } from '@/lib/mock-data';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'db.json');

const readDB = () => {
    try {
        if (fs.existsSync(dbPath)) {
            const fileContent = fs.readFileSync(dbPath, 'utf-8');
            return JSON.parse(fileContent);
        }
    } catch (error) {
        console.error("Error reading db.json:", error);
    }
    // Return default structure if file doesn't exist or is empty/corrupt
    return {
        treks: [...initialTreks],
        services: staticServices.map(s => ({ ...s, id: crypto.randomUUID() })),
        guides: initialGuides.map(g => ({ ...g, id: crypto.randomUUID() })),
        porters: initialPorters.map(p => ({ ...p, id: crypto.randomUUID() })),
        reports: [],
        travelers: [],
        assignments: [],
    };
};

const writeDB = (data: any) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error("Error writing to db.json:", error);
    }
};

let db = readDB();

// Functions to manipulate the data

// Treks
export const getTreks = () => {
    db = readDB();
    return { treks: db.treks };
}
export const addTrek = (newTrek: Omit<Trek, 'id'>) => {
    db = readDB();
    const trekWithId = { ...newTrek, id: crypto.randomUUID() };
    db.treks.push(trekWithId);
    writeDB(db);
    return trekWithId;
};

// Guides
export const getGuides = () => {
    db = readDB();
    return { guides: db.guides };
}

// Porters
export const getPorters = () => {
    db = readDB();
    return { porters: db.porters };
}


// Reports
export const getPaginatedReports = (page: number, limit: number) => {
    db = readDB();
    const reversedReports = [...db.reports].reverse();
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReports = reversedReports.slice(startIndex, endIndex);

    const augmentedReports = paginatedReports.map(report => {
        const travelerGroup = db.travelers.find((t: any) => t.groupId === report.groupId);
        const joinedTravelers = travelerGroup ? travelerGroup.travelers.length : 0;
        const pendingTravelers = report.groupSize - joinedTravelers;
        return {
            ...report,
            joined: joinedTravelers,
            pending: pendingTravelers,
        };
    });

    return {
        reports: augmentedReports,
        total: db.reports.length,
        hasMore: endIndex < db.reports.length,
    };
}
export const getReportByGroupId = (groupId: string) => {
    db = readDB();
    const report = db.reports.find((r: any) => r.groupId === groupId);
    return report || null;
}
export const addReport = (report: any) => {
    db = readDB();
    db.reports.push(report);
    writeDB(db);
    return report;
}
export const updateReport = (groupId: string, body: any) => {
    db = readDB();
    const reportIndex = db.reports.findIndex((r: any) => r.groupId === groupId);
    if (reportIndex > -1) {
        db.reports[reportIndex] = { ...db.reports[reportIndex], ...body };
        writeDB(db);
        return db.reports[reportIndex];
    }
    return null;
}

// Travelers
export async function getAllTravelers() {
    db = readDB();
    const reportMap = new Map(db.reports.map((r: any) => [r.groupId, r]));
    const allTravelers = db.travelers.flatMap((group: any) => {
        const report = reportMap.get(group.groupId);
        return group.travelers.map((traveler: any) => ({
            ...traveler,
            groupId: group.groupId,
            trekName: report ? report.trekName : 'N/A',
            groupName: report ? report.groupName : 'N/A',
        }));
    });
    return { travelers: allTravelers };
}
export const getTravelerGroup = (groupId: string) => {
    db = readDB();
    return db.travelers.find((t: any) => t.groupId === groupId);
}
export const updateTravelerGroup = (groupId: string, submittedTraveler: any) => {
    db = readDB();
    const groupIndex = db.travelers.findIndex((t: any) => t.groupId === groupId);
    if (groupIndex > -1) {
        const existingGroup = db.travelers[groupIndex];
        const travelerIndex = existingGroup.travelers.findIndex((t: any) => t.id === submittedTraveler.id);

        if (travelerIndex > -1) {
            existingGroup.travelers[travelerIndex] = { ...existingGroup.travelers[travelerIndex], ...submittedTraveler };
        } else {
            existingGroup.travelers.push(submittedTraveler);
        }
        db.travelers[groupIndex] = existingGroup;
    } else {
        const newTravelerGroup = { groupId, travelers: [submittedTraveler] };
        db.travelers.push(newTravelerGroup);
    }
    writeDB(db);
    return db.travelers.find((t: any) => t.groupId === groupId);
}

// Assignments
export const getAssignmentsByGroupId = (groupId: string) => {
    db = readDB();
    return db.assignments.find((a: any) => a.groupId === groupId) || null;
}

export const updateAssignments = (groupId: string, guideIds: string[], porterIds: string[]) => {
    db = readDB();
    const assignmentIndex = db.assignments.findIndex((a: any) => a.groupId === groupId);

    const newAssignment = { groupId, guideIds, porterIds };

    if (assignmentIndex > -1) {
        db.assignments[assignmentIndex] = newAssignment;
    } else {
        db.assignments.push(newAssignment);
    }
    writeDB(db);
    return newAssignment;
}

export const getAllAssignmentsWithDetails = () => {
    db = readDB();
    const reportMap = new Map(db.reports.map((r: any) => [r.groupId, r]));
    const guideMap = new Map(db.guides.map((g: any) => [g.id, g]));
    const porterMap = new Map(db.porters.map((p: any) => [p.id, p]));

    return db.assignments.map((assignment: any) => {
        const report = reportMap.get(assignment.groupId);
        return {
            ...assignment,
            trekName: report?.trekName || 'N/A',
            groupName: report?.groupName || 'N/A',
            startDate: report?.startDate || null,
            guides: assignment.guideIds.map((id: string) => guideMap.get(id)).filter(Boolean),
            porters: assignment.porterIds.map((id: string) => porterMap.get(id)).filter(Boolean),
        };
    });
}


// Stats
export const getStats = () => {
    db = readDB();
    return {
        reports: db.reports.length,
        travelers: db.travelers.reduce((acc: number, group: any) => acc + group.travelers.length, 0),
        treks: db.treks.length,
        guides: db.guides.length,
        porters: db.porters.length,
    };
}
