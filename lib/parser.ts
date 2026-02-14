export interface ParsedBPInput {
  systolic: number;
  diastolic: number;
  heartRate: number | null;
}

export type ParseBPResult =
  | { success: true; data: ParsedBPInput }
  | { success: false; errors: string[] };

export function parseBPInput(input: string): ParseBPResult {
  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    return { success: false, errors: ['Input is empty'] };
  }
  
  const parts = trimmedInput.split('/');
  
  if (parts.length < 2 || parts.length > 3) {
    return { 
      success: false, 
      errors: ['Invalid format. Expected: systolic/diastolic or systolic/diastolic/heartRate'] 
    };
  }
  
  const systolicStr = parts[0].trim();
  const diastolicStr = parts[1].trim();
  const heartRateStr = parts[2]?.trim() ?? null;
  
  const systolic = parseInt(systolicStr, 10);
  const diastolic = parseInt(diastolicStr, 10);
  const heartRate = heartRateStr ? parseInt(heartRateStr, 10) : null;
  
  const errors: string[] = [];
  
  if (isNaN(systolic)) {
    errors.push('Systolic must be a valid number');
  } else if (systolic < 60 || systolic > 250) {
    errors.push('Systolic must be between 60 and 250');
  }
  
  if (isNaN(diastolic)) {
    errors.push('Diastolic must be a valid number');
  } else if (diastolic < 40 || diastolic > 150) {
    errors.push('Diastolic must be between 40 and 150');
  }
  
  if (heartRateStr !== null) {
    if (isNaN(heartRate!)) {
      errors.push('Heart rate must be a valid number');
    } else if (heartRate! < 40 || heartRate! > 200) {
      errors.push('Heart rate must be between 40 and 200');
    }
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return {
    success: true,
    data: {
      systolic,
      diastolic,
      heartRate
    }
  };
}
