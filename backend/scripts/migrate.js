'use strict';
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

main().catch((err) => {
  console.error('[migrate] FATAL — server will NOT start:', err.message);
  process.exit(1);
});
