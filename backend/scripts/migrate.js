'use strict';
const { PrismaClient } = require('@prisma/client');

// Idempotent SQL migrations — safe to run on every deploy.
// Each statement must be safe to run multiple times without error.
const MIGRATIONS = [
  // Ensure product_model_id exists and is nullable on production_plan
  `ALTER TABLE production_plan ADD COLUMN IF NOT EXISTS product_model_id TEXT`,
  `ALTER TABLE production_plan ALTER COLUMN product_model_id DROP NOT NULL`,

  // Ensure shift_id exists and is nullable on production_plan
  `ALTER TABLE production_plan ADD COLUMN IF NOT EXISTS shift_id TEXT`,
  `ALTER TABLE production_plan ALTER COLUMN shift_id DROP NOT NULL`,

  // Add plan_type column (PU vs TEP split) — the main missing column
  `ALTER TABLE production_plan ADD COLUMN IF NOT EXISTS plan_type VARCHAR(10) NOT NULL DEFAULT 'TEP'`,

  // Ensure product_model_id exists and is nullable on production_fact
  `ALTER TABLE production_fact ADD COLUMN IF NOT EXISTS product_model_id TEXT`,
  `ALTER TABLE production_fact ALTER COLUMN product_model_id DROP NOT NULL`,

  // Ensure shift_id exists and is nullable on production_fact
  `ALTER TABLE production_fact ADD COLUMN IF NOT EXISTS shift_id TEXT`,
  `ALTER TABLE production_fact ALTER COLUMN shift_id DROP NOT NULL`,
];

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log('[migrate] Running DB migrations...');
    for (const sql of MIGRATIONS) {
      await prisma.$executeRawUnsafe(sql);
      console.log('[migrate] OK:', sql.replace(/\s+/g, ' ').trim());
    }
    console.log('[migrate] All migrations applied successfully.');
  } catch (err) {
    console.error('[migrate] FATAL — migration failed:', err.message);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(() => process.exit(1));
