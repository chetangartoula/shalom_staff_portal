
import type { Trek, Service, Guide, Porter, SectionState, Report, Transaction, PaymentStatus } from '@/lib/types';
import { initialTreks, services as staticServices, initialGuides, initialPorters } from '@/lib/mock-data';
import fs from 'fs';
import path from 'path';
import { parseISO, isWithinInterval, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns';

const dbPath = path.join(process.cwd(), 'db.json');

let cachedDb: any = null;

const readDB = () => {
    if (cachedDb && process.env.NODE_ENV !== 'development') {
        return cachedDb;
    }

    try {
        if (fs.existsSync(dbPath)) {
            const fileContent = fs.readFileSync(dbPath, 'utf-8');
            const data = JSON.parse(fileContent);
            cachedDb = {
                treks: data.treks || [],
                services: data.services || [],
                guides: data.guides || [],
                porters: data.porters || [],
                reports: data.reports || [],
                travelers: data.travelers || [],
                assignments: data.assignments || [],
                transactions: data.transactions || [],
            };
            return cachedDb;
        }
    } catch (error) {
        console.error("Error reading db.json:", error);
    }
    
    // Return default structure if file doesn't exist or is empty/corrupt
    const defaultData = {
        treks: [...initialTreks],
        services: staticServices.map(s => ({ ...s, id: crypto.randomUUID() })),
        guides: initialGuides.map(g => ({ ...g, id: crypto.randomUUID() })),
        porters: initialPorters.map(p => ({ ...p, id: crypto.randomUUID() })),
        reports: [],
        travelers: [],
        assignments: [],
        transactions: [],
    };
    cachedDb = defaultData;
    return cachedDb;
};

const writeDB = (data: any) => {
    try {
        fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
        cachedDb = null; // Invalidate cache
    } catch (error) {
        console.error("Error writing to db.json:", error);
    }
};

const getDB = () => {
    return readDB();
}

// --- Helper Functions ---

const calculateSectionTotal = (section: SectionState): number => {
    const subtotal = section.rows.reduce((acc, row) => acc + row.total, 0);
    const discountAmount = section.discountType === 'percentage'
        ? (subtotal * (section.discountValue / 100))
        : section.discountValue;
    return subtotal - discountAmount;
};

export const calculateReportTotalCost = (report: Report): number => {
    const sections = [report.permits, report.services, report.extraDetails, ...report.customSections];
    const total = sections.reduce((acc, section) => acc + calculateSectionTotal(section), 0);
    const totalWithService = total * (1 + report.serviceCharge / 100);
    return totalWithService;
};

export const getPaymentDetails = (groupId: string, totalCost: number) => {
    const db = getDB();
    const groupTransactions = db.transactions.filter((t: Transaction) => t.groupId === groupId);
    const totalPaid = groupTransactions.reduce((acc: number, t: Transaction) => {
        return t.type === 'payment' ? acc + t.amount : acc - t.amount;
    }, 0);
    const balance = totalCost - totalPaid;

    let paymentStatus: PaymentStatus = 'unpaid';
    const epsilon = 0.01; // Tolerance for floating point inaccuracies (1 cent)

    if (totalPaid > 0) {
        if (Math.abs(balance) <= epsilon || balance < 0) {
            paymentStatus = totalPaid > totalCost ? 'overpaid' : 'fully paid';
        } else {
            paymentStatus = 'partially paid';
        }
    }

    return { totalCost, totalPaid, balance, paymentStatus };
};

// --- API Functions ---

// Treks
export const getTreks = () => {
    const db = getDB();
    return { treks: db.treks };
}
export const addTrek = (newTrek: Omit<Trek, 'id'>) => {
    const db = getDB();
    const trekWithId = { ...newTrek, id: crypto.randomUUID() };
    db.treks.push(trekWithId);
    writeDB(db);
    return trekWithId;
};

// Guides
export const getGuides = () => {
    const db = getDB();
    return { guides: db.guides };
}

// Porters
export const getPorters = () => {
    const db = getDB();
    return { porters: db.porters };
}

// Reports
export const getAllReports = () => {
    const db = getDB();
    return db.reports as Report[];
};

export const getPaginatedReports = (page: number, limit: number) => {
    const db = getDB();
    const reversedReports = [...db.reports].reverse();
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedReports = reversedReports.slice(startIndex, endIndex);

    const augmentedReports = paginatedReports.map((report: Report) => {
        const travelerGroup = db.travelers.find((t: any) => t.groupId === report.groupId);
        const joinedTravelers = travelerGroup ? travelerGroup.travelers.length : 0;
        const pendingTravelers = report.groupSize - joinedTravelers;

        const totalCost = calculateReportTotalCost(report);
        const paymentDetails = getPaymentDetails(report.groupId, totalCost);

        return {
            ...report,
            joined: joinedTravelers,
            pending: pendingTravelers,
            paymentDetails: paymentDetails,
        };
    });

    return {
        reports: augmentedReports,
        total: db.reports.length,
        hasMore: endIndex < db.reports.length,
    };
}
export const getReportByGroupId = (groupId: string) => {
    const db = getDB();
    const report = db.reports.find((r: any) => r.groupId === groupId);
    if (!report) return null;

    const totalCost = calculateReportTotalCost(report);
    const paymentDetails = getPaymentDetails(report.groupId, totalCost);

    return { ...report, paymentDetails };
}
export const addReport = (report: any) => {
    const db = getDB();
    const reportWithStatus = { ...report };
    db.reports.push(reportWithStatus);
    writeDB(db);
    return reportWithStatus;
}
export const updateReport = (groupId: string, body: any) => {
    const db = getDB();
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
    const db = getDB();
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
    const db = getDB();
    return db.travelers.find((t: any) => t.groupId === groupId);
}
export const updateTravelerGroup = (groupId: string, submittedTraveler: any) => {
    const db = getDB();
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
    const db = getDB();
    return db.assignments.find((a: any) => a.groupId === groupId) || null;
}

export const updateAssignments = (groupId: string, guideIds: string[], porterIds: string[]) => {
    const db = getDB();
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
    const db = getDB();
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

// Transactions
export const getTransactionsByGroupId = (groupId: string) => {
    const db = getDB();
    return db.transactions.filter((t: Transaction) => t.groupId === groupId).sort((a: Transaction, b: Transaction) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const addTransaction = (groupId: string, transactionData: Omit<Transaction, 'id' | 'groupId'>) => {
    const db = getDB();
    const newTransaction: Transaction = {
        ...transactionData,
        id: crypto.randomUUID(),
        groupId,
    };
    db.transactions.push(newTransaction);
    writeDB(db);
    return newTransaction;
}

export const getAllTransactions = () => {
    const db = getDB();
    return db.transactions;
};


export const getPaginatedTransactions = (page: number, limit: number, filters: { from?: string, to?: string, type?: 'payment' | 'refund' | 'all' }) => {
    const db = getDB();
    const reportMap = new Map(db.reports.map((r: Report) => [r.groupId, { trekName: r.trekName, groupName: r.groupName }]));
    
    // Start with all transactions, sorted
    let allTransactions = [...db.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Apply filters
    const { from, to, type } = filters;
    let filteredTransactions = allTransactions;

    if (type && type !== 'all') {
        filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }

    if (from && to) {
        const interval = { start: startOfDay(parseISO(from)), end: endOfDay(parseISO(to)) };
        filteredTransactions = filteredTransactions.filter(t => isWithinInterval(parseISO(t.date), interval));
    }
    
    // Calculate totals on the filtered data *before* pagination
    const totalPayments = filteredTransactions
        .filter(t => t.type === 'payment')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalRefunds = filteredTransactions
        .filter(t => t.type === 'refund')
        .reduce((sum, t) => sum + t.amount, 0);

    const netTotal = totalPayments - totalRefunds;

    // Apply pagination to the filtered data
    const total = filteredTransactions.length;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    // Augment the paginated data with report info
    const augmentedTransactions = paginatedTransactions.map((transaction: Transaction) => {
        const reportInfo = reportMap.get(transaction.groupId);
        return {
            ...transaction,
            trekName: reportInfo?.trekName || 'N/A',
            groupName: reportInfo?.groupName || 'N/A',
        };
    });

    return {
        transactions: augmentedTransactions,
        total,
        hasMore: endIndex < total,
        summary: {
            totalPayments,
            totalRefunds,
            netTotal,
        }
    };
};


// Stats
export const getStats = () => {
    const db = getDB();
    return {
        reports: db.reports.length,
        travelers: db.travelers.reduce((acc: number, group: any) => acc + group.travelers.length, 0),
        treks: db.treks.length,
        guides: db.guides.length,
        porters: db.porters.length,
    };
}
