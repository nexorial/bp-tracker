import { NextRequest, NextResponse } from 'next/server';
import { getBPTrackerDatabase, BPRecord } from '@/lib/db';

export interface ErrorResponse {
  error: string;
}

/**
 * Escape a CSV field to handle commas, quotes, and newlines
 */
function escapeCSVField(field: string | number | null): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  const str = String(field);
  // If the field contains commas, quotes, or newlines, wrap it in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Double up any quotes inside the field
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Convert BP records to CSV format
 */
function recordsToCSV(records: BPRecord[]): string {
  const headers = ['Date', 'Systolic', 'Diastolic', 'Heart Rate', 'Notes'];
  const lines: string[] = [headers.join(',')];
  
  for (const record of records) {
    const line = [
      escapeCSVField(record.recorded_at),
      escapeCSVField(record.systolic),
      escapeCSVField(record.diastolic),
      escapeCSVField(record.heart_rate),
      escapeCSVField(record.notes)
    ].join(',');
    lines.push(line);
  }
  
  return lines.join('\n');
}

/**
 * Generate filename with current date
 */
function generateFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `bp-records-${year}-${month}-${day}.csv`;
}

/**
 * Validate date string format (YYYY-MM-DD)
 */
function isValidDateString(dateStr: string): boolean {
  // Check format YYYY-MM-DD
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) {
    return false;
  }
  
  // Check it's a valid date
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Verify the date components match (handles cases like 2024-02-30)
  const [year, month, day] = dateStr.split('-').map(Number);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() + 1 === month &&
    date.getUTCDate() === day
  );
}

export async function GET(
  request: NextRequest
): Promise<NextResponse | Response> {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse date range parameters
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    // Validate from date if provided
    let from: string | undefined;
    if (fromParam !== null) {
      if (!isValidDateString(fromParam)) {
        return NextResponse.json(
          { error: 'Invalid from date format. Expected: YYYY-MM-DD' },
          { status: 400 }
        );
      }
      from = fromParam;
    }

    // Validate to date if provided
    let to: string | undefined;
    if (toParam !== null) {
      if (!isValidDateString(toParam)) {
        return NextResponse.json(
          { error: 'Invalid to date format. Expected: YYYY-MM-DD' },
          { status: 400 }
        );
      }
      to = toParam;
    }

    // Fetch records from database
    const db = getBPTrackerDatabase();
    const records = db.getRecordsForExport({ from, to });

    // Generate CSV content
    const csvContent = recordsToCSV(records);

    // Create response with proper headers
    const filename = generateFilename();
    const headers = new Headers();
    headers.set('Content-Type', 'text/csv; charset=utf-8');
    headers.set('Content-Disposition', `attachment; filename="${filename}"`);

    return new Response(csvContent, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error exporting BP records:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
