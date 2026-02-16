#!/usr/bin/env node
/**
 * BP Logger CLI
 * Usage: node scripts/log-bp.js "120/80/72" "optional notes"
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db', 'bp.db');

function parseBPInput(input) {
  const trimmedInput = input.trim();
  
  if (!trimmedInput) {
    return { success: false, errors: ['Input is empty'] };
  }
  
  const parts = trimmedInput.split('/');
  
  if (parts.length < 2 || parts.length > 3) {
    return { 
      success: false, 
      errors: ['Invalid format. Expected: systolic/diastolic or systolic/diastolic/heartRate (e.g., 120/80/70)']
    };
  }
  
  const systolicStr = parts[0].trim();
  const diastolicStr = parts[1].trim();
  const heartRateStr = parts[2]?.trim() ?? null;
  
  const systolic = parseInt(systolicStr, 10);
  const diastolic = parseInt(diastolicStr, 10);
  const heartRate = heartRateStr ? parseInt(heartRateStr, 10) : null;
  
  const errors = [];
  
  if (isNaN(systolic) || systolic < 60 || systolic > 250) {
    errors.push('Systolic must be between 60 and 250');
  }
  
  if (isNaN(diastolic) || diastolic < 40 || diastolic > 150) {
    errors.push('Diastolic must be between 40 and 150');
  }
  
  if (heartRateStr !== null && (isNaN(heartRate) || heartRate < 40 || heartRate > 200)) {
    errors.push('Heart rate must be between 40 and 200');
  }
  
  if (errors.length > 0) {
    return { success: false, errors };
  }
  
  return {
    success: true,
    data: { systolic, diastolic, heartRate }
  };
}

function classifyBP(systolic, diastolic) {
  if (systolic >= 180 || diastolic >= 120) {
    return { category: 'Crisis', emoji: '🚨' };
  }
  if (systolic >= 140 || diastolic >= 90) {
    return { category: 'High Stage 2', emoji: '🔴' };
  }
  if (systolic >= 130 || diastolic >= 80) {
    return { category: 'High Stage 1', emoji: '🟠' };
  }
  if (systolic >= 120 && diastolic < 80) {
    return { category: 'Elevated', emoji: '🟡' };
  }
  return { category: 'Normal', emoji: '🟢' };
}

function logBPReading(systolic, diastolic, heartRate, notes) {
  const db = new Database(DB_PATH);
  
  const insert = db.prepare(
    `INSERT INTO bp_records (systolic, diastolic, heart_rate, notes)
     VALUES (?, ?, ?, ?)`
  );
  
  const result = insert.run(systolic, diastolic, heartRate ?? 0, notes ?? null);
  
  const record = db.prepare('SELECT * FROM bp_records WHERE id = ?').get(result.lastInsertRowid);
  db.close();
  
  return record;
}

// Main
const input = process.argv[2];
const notes = process.argv[3];

if (!input) {
  console.error('Usage: node log-bp.js "120/80/72" "optional notes"');
  process.exit(1);
}

const result = parseBPInput(input);

if (!result.success) {
  console.error('❌ Error:', result.errors.join(', '));
  process.exit(1);
}

const { systolic, diastolic, heartRate } = result.data;
const record = logBPReading(systolic, diastolic, heartRate, notes);
const classification = classifyBP(systolic, diastolic);

console.log(`✅ BP Recorded: ${systolic}/${diastolic}/${heartRate ?? 'N/A'} ${classification.emoji} ${classification.category}`);
console.log(`   ID: ${record.id} | Time: ${record.recorded_at}`);
