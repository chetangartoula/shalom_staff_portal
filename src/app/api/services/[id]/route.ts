
import { NextResponse } from 'next/server';
import { updateService, deleteService } from '../../data';

interface Params {
  params: {
    id: string;
  };
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const body = await request.json();
    const updated = updateService(id, body);
    if (updated) {
      return NextResponse.json({ message: 'Service updated successfully', service: updated }, { status: 200 });
    }
    return NextResponse.json({ message: 'Service not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: 'Error updating service', error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = params;
    const deleted = deleteService(id);
    if (deleted) {
      return NextResponse.json({ message: 'Service deleted successfully', service: deleted }, { status: 200 });
    }
    return NextResponse.json({ message: 'Service not found' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ message: 'Error deleting service', error: (error as Error).message }, { status: 500 });
  }
}
