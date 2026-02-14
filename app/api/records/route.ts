import { NextRequest, NextResponse } from 'next/server';
import { parseBPInput } from '@/lib/parser';
import { getBPTrackerDatabase, CreateBPRecordInput } from '@/lib/db';

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

export interface ErrorResponse {
  error: string;
  details?: string[];
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
