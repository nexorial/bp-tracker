import { parseBPInput } from '../lib/parser';

describe('parseBPInput', () => {
  describe('valid inputs', () => {
    it('should parse 120/80/72 format correctly', () => {
      const result = parseBPInput('120/80/72');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systolic).toBe(120);
        expect(result.data.diastolic).toBe(80);
        expect(result.data.heartRate).toBe(72);
      }
    });
    
    it('should parse 120/80 format (without heart rate)', () => {
      const result = parseBPInput('120/80');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systolic).toBe(120);
        expect(result.data.diastolic).toBe(80);
        expect(result.data.heartRate).toBeNull();
      }
    });
    
    it('should handle whitespace around values', () => {
      const result = parseBPInput('  120  /  80  /  72  ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systolic).toBe(120);
        expect(result.data.diastolic).toBe(80);
        expect(result.data.heartRate).toBe(72);
      }
    });
    
    it('should handle edge case minimum values', () => {
      const result = parseBPInput('60/40/40');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systolic).toBe(60);
        expect(result.data.diastolic).toBe(40);
        expect(result.data.heartRate).toBe(40);
      }
    });
    
    it('should handle edge case maximum values', () => {
      const result = parseBPInput('250/150/200');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systolic).toBe(250);
        expect(result.data.diastolic).toBe(150);
        expect(result.data.heartRate).toBe(200);
      }
    });
  });
  
  describe('invalid formats', () => {
    it('should reject empty string', () => {
      const result = parseBPInput('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Input is empty');
      }
    });
    
    it('should reject whitespace-only string', () => {
      const result = parseBPInput('   ');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Input is empty');
      }
    });
    
    it('should reject single value', () => {
      const result = parseBPInput('120');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]).toMatch(/Invalid format/);
      }
    });
    
    it('should reject too many values', () => {
      const result = parseBPInput('120/80/72/60');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors[0]).toMatch(/Invalid format/);
      }
    });
    
    it('should reject non-numeric values', () => {
      const result = parseBPInput('abc/def/ghi');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Systolic must be a valid number');
        expect(result.errors).toContain('Diastolic must be a valid number');
        expect(result.errors).toContain('Heart rate must be a valid number');
      }
    });
    
    it('should reject mixed numeric and non-numeric', () => {
      const result = parseBPInput('120/abc/72');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Diastolic must be a valid number');
      }
    });
  });
  
  describe('range validation', () => {
    it('should reject systolic below 60', () => {
      const result = parseBPInput('59/80/72');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Systolic must be between 60 and 250');
      }
    });
    
    it('should reject systolic above 250', () => {
      const result = parseBPInput('251/80/72');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Systolic must be between 60 and 250');
      }
    });
    
    it('should reject diastolic below 40', () => {
      const result = parseBPInput('120/39/72');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Diastolic must be between 40 and 150');
      }
    });
    
    it('should reject diastolic above 150', () => {
      const result = parseBPInput('120/151/72');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Diastolic must be between 40 and 150');
      }
    });
    
    it('should reject heart rate below 40', () => {
      const result = parseBPInput('120/80/39');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Heart rate must be between 40 and 200');
      }
    });
    
    it('should reject heart rate above 200', () => {
      const result = parseBPInput('120/80/201');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Heart rate must be between 40 and 200');
      }
    });
    
    it('should report multiple validation errors', () => {
      const result = parseBPInput('10/20/30');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors).toContain('Systolic must be between 60 and 250');
        expect(result.errors).toContain('Diastolic must be between 40 and 150');
        expect(result.errors).toContain('Heart rate must be between 40 and 200');
      }
    });
  });
  
  describe('edge cases', () => {
    it('should handle zero as invalid (systolic)', () => {
      const result = parseBPInput('0/80/72');
      expect(result.success).toBe(false);
    });
    
    it('should handle negative numbers', () => {
      const result = parseBPInput('-10/-20/-30');
      expect(result.success).toBe(false);
    });
    
    it('should handle decimal numbers by truncating', () => {
      const result = parseBPInput('120.5/80.7/72.3');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.systolic).toBe(120);
        expect(result.data.diastolic).toBe(80);
        expect(result.data.heartRate).toBe(72);
      }
    });
  });
});
