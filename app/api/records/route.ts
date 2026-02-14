import { NextRequest, NextResponse } from 'next/server';
import { parseBPInput } from '@/lib/parser';
import { getBPTrackerDatabase, CreateBPRecordInput, BPRecord } from '@/lib/db';

export interface CreateRecordRequest {
  input?: string;
  systolic?: number;
  diastolic?: number;
  heartRate?: number;
  notes?: string;
}

export interface CreateRecordResponse {
  id: number;
  systolic: number;
  diastolic: number;
  heart_rate: number;
  recorded_at: string;
  notes: string | null;
}

export interface GetRecordsResponse {
  records: BPRecord[];
  total: number;
  limit: number;
  offset: number;
}

export interface ErrorResponse {
  error: string;
  details?: string[];
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<GetRecordsResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const daysParam = searchParams.get('days');

    // Validate and parse limit
    let limit = 50;
    if (limitParam !== null) {
      const parsedLimit = parseInt(limitParam, 10);
      if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 1000) {
        return NextResponse.json(
          { error: 'Invalid limit parameter. Must be between 1 and 1000' },
          { status: 400 }
        );
      }
      limit = parsedLimit;
    }

    // Validate and parse offset
    let offset = 0;
    if (offsetParam !== null) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: 'Invalid offset parameter. Must be a non-negative integer' },
          { status: 400 }
        );
      }
      offset = parsedOffset;
    }

    // Validate and parse days
    let days: number | undefined;
    if (daysParam !== null) {
      const parsedDays = parseInt(daysParam, 10);
      if (isNaN(parsedDays) || parsedDays < 1) {
        return NextResponse.json(
          { error: 'Invalid days parameter. Must be a positive integer' },
          { status: 400 }
        );
      }
      days = parsedDays;
    }

    // Fetch records from database
    const db = getBPTrackerDatabase();
    const result = db.getRecords({ limit, offset, days });

    return NextResponse.json({
      records: result.records,
      total: result.total,
      limit,
      offset
    });
  } catch (error) {
    console.error('Error fetching BP records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<CreateRecordResponse | ErrorResponse>> {
  try {
    const body: CreateRecordRequest = await request.json();

    // Validate request body is an object
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: [
            'Expected either "input" field (string format: "120/80/72")',
            'or "systolic", "diastolic", and "heartRate" fields'
          ]
        },
        { status: 400 }
      );
    }

    // Validate request body
    let createInput: CreateBPRecordInput;

    if (body.input !== undefined) {
      // Parse string format: "120/80/72"
      const parseResult = parseBPInput(body.input);
      if (!parseResult.success) {
        return NextResponse.json(
          { error: 'Invalid input format', details: parseResult.errors },
          { status: 400 }
        );
      }
      createInput = {
        systolic: parseResult.data.systolic,
        diastolic: parseResult.data.diastolic,
        heartRate: parseResult.data.heartRate ?? 0,
        notes: body.notes
      };
    } else if (
      body.systolic !== undefined &&
      body.diastolic !== undefined &&
      body.heartRate !== undefined
    ) {
      // Use object format directly
      // Validate ranges manually for object format
      const errors: string[] = [];
      if (body.systolic < 60 || body.systolic > 250) {
        errors.push('Systolic must be between 60 and 250');
      }
      if (body.diastolic < 40 || body.diastolic > 150) {
        errors.push('Diastolic must be between 40 and 150');
      }
      if (body.heartRate < 40 || body.heartRate > 200) {
        errors.push('Heart rate must be between 40 and 200');
      }
      if (errors.length > 0) {
        return NextResponse.json(
          { error: 'Invalid data', details: errors },
          { status: 400 }
        );
      }
      createInput = {
        systolic: body.systolic,
        diastolic: body.diastolic,
        heartRate: body.heartRate,
        notes: body.notes
      };
    } else {
      return NextResponse.json(
        {
          error: 'Invalid request body',
          details: [
            'Expected either "input" field (string format: "120/80/72")',
            'or "systolic", "diastolic", and "heartRate" fields'
          ]
        },
        { status: 400 }
      );
    }

    // Create record in database
    const db = getBPTrackerDatabase();
    const record = db.createRecord(createInput);

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('Error creating BP record:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
