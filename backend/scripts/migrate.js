'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { PrismaClient } = require('@prisma/client');

// Idempotent SQL migrations — safe to run on every deploy.
const MIGRATIONS = [
  // production_plan: ensure product_model_id and shift_id are nullable
  `ALTER TABLE production_plan ADD COLUMN IF NOT EXISTS product_model_id TEXT`,
  `ALTER TABLE production_plan ALTER COLUMN product_model_id DROP NOT NULL`,
  `ALTER TABLE production_plan ADD COLUMN IF NOT EXISTS shift_id TEXT`,
  `ALTER TABLE production_plan ALTER COLUMN shift_id DROP NOT NULL`,

  // production_fact: ensure product_model_id and shift_id are nullable
  `ALTER TABLE production_fact ADD COLUMN IF NOT EXISTS product_model_id TEXT`,
  `ALTER TABLE production_fact ALTER COLUMN product_model_id DROP NOT NULL`,
  `ALTER TABLE production_fact ADD COLUMN IF NOT EXISTS shift_id TEXT`,
  `ALTER TABLE production_fact ALTER COLUMN shift_id DROP NOT NULL`,

  // plan_type: PU vs TEP separation
  `ALTER TABLE production_plan ADD COLUMN IF NOT EXISTS plan_type VARCHAR(10) NOT NULL DEFAULT 'TEP'`,
  `UPDATE production_plan SET plan_type='PU' FROM production_lines WHERE production_plan.production_line_id=production_lines.id AND production_lines.name ILIKE 'PU%'`,

  // daily_work_schedule: per-date total work hours for downtime efficiency
  `CREATE TABLE IF NOT EXISTS daily_work_schedule (id TEXT NOT NULL, date DATE NOT NULL, total_hours NUMERIC(5,2) NOT NULL DEFAULT 8, notes TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), CONSTRAINT daily_work_schedule_pkey PRIMARY KEY (id), CONSTRAINT daily_work_schedule_date_key UNIQUE (date))`,

  // paint_records: planned qty + production line FK (added in v2 schema)
  `ALTER TABLE paint_records ADD COLUMN IF NOT EXISTS planned DOUBLE PRECISION`,
  `ALTER TABLE paint_records ADD COLUMN IF NOT EXISTS line_id TEXT`,
  `ALTER TABLE paint_records ALTER COLUMN department_id DROP NOT NULL`,
  `ALTER TABLE paint_records ALTER COLUMN paint_name SET DEFAULT ''`,

  // materials: make warehouse_id nullable + add record_date for daily log entries
  `ALTER TABLE materials ALTER COLUMN warehouse_id DROP NOT NULL`,
  `ALTER TABLE materials ADD COLUMN IF NOT EXISTS record_date DATE`,

  // kesish_records: cutting department log
  `CREATE TABLE IF NOT EXISTS kesish_records (id TEXT NOT NULL, date DATE NOT NULL, planned_qty INTEGER, produced_qty INTEGER, brak_qty INTEGER DEFAULT 0, notes TEXT, is_deleted BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), production_line_id TEXT NOT NULL, employee_id TEXT, CONSTRAINT kesish_records_pkey PRIMARY KEY (id))`,
  `CREATE INDEX IF NOT EXISTS kesish_records_date_idx ON kesish_records(date)`,
  `CREATE INDEX IF NOT EXISTS kesish_records_line_idx ON kesish_records(production_line_id)`,

  // charxlash_records: grinding/sharpening department log
  `CREATE TABLE IF NOT EXISTS charxlash_records (id TEXT NOT NULL, date DATE NOT NULL, planned_qty INTEGER, produced_qty INTEGER, brak_qty INTEGER DEFAULT 0, notes TEXT, is_deleted BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), production_line_id TEXT NOT NULL, employee_id TEXT, CONSTRAINT charxlash_records_pkey PRIMARY KEY (id))`,
  `CREATE INDEX IF NOT EXISTS charxlash_records_date_idx ON charxlash_records(date)`,
  `CREATE INDEX IF NOT EXISTS charxlash_records_line_idx ON charxlash_records(production_line_id)`,

  // employee_daily_performance: per-employee daily output tracking
  `CREATE TABLE IF NOT EXISTS employee_daily_performance (id TEXT NOT NULL, date DATE NOT NULL, planned_qty INTEGER, produced_qty INTEGER, brak_qty INTEGER NOT NULL DEFAULT 0, efficiency DOUBLE PRECISION, notes TEXT, is_deleted BOOLEAN NOT NULL DEFAULT false, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), employee_id TEXT NOT NULL, department_id TEXT NOT NULL, CONSTRAINT employee_daily_performance_pkey PRIMARY KEY (id))`,
  `CREATE INDEX IF NOT EXISTS edp_date_idx ON employee_daily_performance(date)`,
  `CREATE INDEX IF NOT EXISTS edp_employee_idx ON employee_daily_performance(employee_id)`,
  `CREATE INDEX IF NOT EXISTS edp_department_idx ON employee_daily_performance(department_id)`,
];

async function main() {
  console.log('[migrate] ==========================================');
  console.log('[migrate] DB migration starting...');
  console.log('[migrate] DATABASE_URL host:', (process.env.DATABASE_URL || '').replace(/:[^:@]+@/, ':***@').split('@')[1]?.split('/')[0] || 'unknown');

  const prisma = new PrismaClient();
  try {
    for (let i = 0; i < MIGRATIONS.length; i++) {
      const sql = MIGRATIONS[i];
      const label = sql.replace(/\s+/g, ' ').trim().slice(0, 80);
      try {
        await prisma.$executeRawUnsafe(sql);
        console.log(`[migrate] [${i + 1}/${MIGRATIONS.length}] OK: ${label}`);
      } catch (err) {
        console.error(`[migrate] [${i + 1}/${MIGRATIONS.length}] FAIL: ${label}`);
        console.error('[migrate] Error:', err.message);
        throw err;
      }
    }
    console.log('[migrate] All migrations applied successfully.');
    console.log('[migrate] ==========================================');
  } finally {
    await prisma.$disconnect();
  }
}

// Export for require() from server.js; also runnable as standalone script.
module.exports = main;

if (require.main === module) {
  main().catch((err) => {
    console.error('[migrate] FATAL — server will NOT start:', err.message);
    process.exit(1);
  });
}
