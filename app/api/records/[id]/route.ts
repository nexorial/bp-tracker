import { NextRequest, NextResponse } from 'next/server';
import { getBPTrackerDatabase } from '@/lib/db';

export interface DeleteRecordResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  error: string;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<DeleteRecordResponse | ErrorResponse>> {
  try {
    const { id } = await params;
    const recordId = parseInt(id, 10);

    if (isNaN(recordId) || recordId < 1 || id.includes('.')) {
      return NextResponse.json(
        { error: 'Invalid record ID' },
        { status: 400 }
      );
    }

    const db = getBPTrackerDatabase();
    const deleted = db.deleteRecord(recordId);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting BP record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
