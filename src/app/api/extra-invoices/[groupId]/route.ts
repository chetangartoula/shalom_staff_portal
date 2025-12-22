import { NextResponse } from 'next/server';
import { fetchExtraInvoicesByGroupId } from '@/lib/api-service';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    try {
        const { groupId } = await params;

        // Fetch extra invoices from the real API
        try {
            const extraInvoices = await fetchExtraInvoicesByGroupId(groupId);
            return NextResponse.json(extraInvoices);
        } catch (apiError) {
            console.error('Error fetching extra invoices from API:', apiError);
            return NextResponse.json({ message: 'Failed to fetch extra invoices from API' }, { status: 500 });
        }
    } catch (error) {
        return NextResponse.json({ message: 'Error fetching extra invoices', error: (error as Error).message }, { status: 500 });
    }
}
