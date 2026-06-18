const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { ALL_PERMISSIONS, ROLE_DEFAULTS } = require('../backend/src/utils/permissions');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ── Roles ──────────────────────────────────────────────────────────────
  const roleDefs = [
    { name: 'super_admin', displayName: 'Super Admin', description: 'Barcha huquqlarga ega', isSystem: true },
    { name: 'admin', displayName: 'Admin', description: 'Boshqaruv huquqlari', isSystem: true },
    { name: 'production_manager', displayName: 'Ishlab chiqarish menedjeri', description: 'Ishlab chiqarishni boshqarish', isSystem: true },
    { name: 'quality_inspector', displayName: 'Sifat nazoratchi', description: 'Sifat nazorati', isSystem: false },
    { name: 'operator', displayName: 'Operator', description: 'Ishlab chiqarish operatori', isSystem: false },
  ];

  const roles = {};
  for (const r of roleDefs) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { displayName: r.displayName, description: r.description },
      create: r,
    });
  }
  console.log(`Roles: ${Object.keys(roles).length} upserted`);

  // ── Permissions ────────────────────────────────────────────────────────
  const permMap = {};
  for (const p of ALL_PERMISSIONS) {
    const perm = await prisma.permission.upsert({
      where: { name: p.name },
      update: { displayName: p.displayName, module: p.module, action: p.action },
      create: p,
    });
    permMap[p.name] = perm;
  }
  console.log(`Permissions: ${ALL_PERMISSIONS.length} upserted`);

  // ── Role Permissions ───────────────────────────────────────────────────
  // super_admin → all permissions
  const allPermIds = Object.values(permMap).map((p) => p.id);
  await prisma.rolePermission.deleteMany({ where: { roleId: roles['super_admin'].id } });
  await prisma.rolePermission.createMany({
    data: allPermIds.map((permissionId) => ({ roleId: roles['super_admin'].id, permissionId })),
    skipDuplicates: true,
  });

  // Other roles → ROLE_DEFAULTS
  for (const [roleName, permNames] of Object.entries(ROLE_DEFAULTS)) {
    if (!roles[roleName]) continue;
    const ids = permNames.map((n) => permMap[n]?.id).filter(Boolean);
    await prisma.rolePermission.deleteMany({ where: { roleId: roles[roleName].id } });
    await prisma.rolePermission.createMany({
      data: ids.map((permissionId) => ({ roleId: roles[roleName].id, permissionId })),
      skipDuplicates: true,
    });
  }
  console.log('Role permissions assigned');

  // ── Factory ────────────────────────────────────────────────────────────
  const factory = await prisma.factory.upsert({
    where: { code: 'FAB-001' },
    update: {},
    create: {
      name: 'Asosiy Zavod',
      code: 'FAB-001',
      address: 'Toshkent shahri, Yunusobod tumani',
      city: 'Toshkent',
      country: 'Uzbekistan',
    },
  });

  // ── Departments ────────────────────────────────────────────────────────
  const deptDefs = [
    { name: 'Ishlab chiqarish bo\'limi', code: 'PROD-01' },
    { name: 'Sifat nazorat bo\'limi', code: 'QC-01' },
    { name: 'Ta\'mirlash bo\'limi', code: 'MAINT-01' },
    { name: 'Ombor bo\'limi', code: 'STORE-01' },
    { name: 'Kadrlar bo\'limi', code: 'HR-01' },
    { name: 'Muhandislik bo\'limi', code: 'ENG-01' },
  ];
  const depts = {};
  for (const d of deptDefs) {
    depts[d.code] = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: { ...d, factoryId: factory.id },
    });
  }
  console.log(`Departments: ${Object.keys(depts).length} upserted`);

  // ── Shifts ─────────────────────────────────────────────────────────────
  const shiftDefs = [
    { name: '1-Smena', code: 'SHIFT-1', startTime: '07:00', endTime: '15:00', durationHours: 8 },
    { name: '2-Smena', code: 'SHIFT-2', startTime: '15:00', endTime: '23:00', durationHours: 8 },
    { name: '3-Smena', code: 'SHIFT-3', startTime: '23:00', endTime: '07:00', durationHours: 8 },
  ];
  for (const s of shiftDefs) {
    await prisma.shift.upsert({ where: { code: s.code }, update: {}, create: s });
  }

  // ── Warehouses ─────────────────────────────────────────────────────────
  await prisma.warehouse.upsert({
    where: { code: 'WH-001' },
    update: {},
    create: { name: 'Asosiy Ombor', code: 'WH-001', type: 'RAW_MATERIAL', factoryId: factory.id },
  });
  await prisma.warehouse.upsert({
    where: { code: 'WH-002' },
    update: {},
    create: { name: 'Tayyor mahsulot ombori', code: 'WH-002', type: 'FINISHED_GOODS', factoryId: factory.id },
  });

  // ── Production Lines ───────────────────────────────────────────────────
  const lineDefs = [
    { name: 'A Liniya', code: 'LINE-A', capacity: 100 },
    { name: 'B Liniya', code: 'LINE-B', capacity: 80 },
    { name: 'C Liniya', code: 'LINE-C', capacity: 120 },
  ];
  for (const l of lineDefs) {
    await prisma.productionLine.upsert({ where: { code: l.code }, update: {}, create: { ...l, factoryId: factory.id } });
  }

  // ── Product Category & Models ──────────────────────────────────────────
  const category = await prisma.productCategory.upsert({
    where: { code: 'CAT-001' },
    update: {},
    create: { name: 'Asosiy mahsulotlar', code: 'CAT-001' },
  });
  await prisma.productModel.upsert({
    where: { code: 'PM-001' },
    update: {},
    create: { name: 'Model A', code: 'PM-001', categoryId: category.id, standardTime: 5, targetRate: 96 },
  });
  await prisma.productModel.upsert({
    where: { code: 'PM-002' },
    update: {},
    create: { name: 'Model B', code: 'PM-002', categoryId: category.id, standardTime: 7, targetRate: 68 },
  });

  // ── Defect Types ───────────────────────────────────────────────────────
  const defectDefs = [
    { name: 'Tirnalish', code: 'DEF-SCRATCH', severity: 'MINOR' },
    { name: 'Yoriq', code: 'DEF-CRACK', severity: 'MAJOR' },
    { name: 'Shakl xatosi', code: 'DEF-SHAPE', severity: 'CRITICAL' },
    { name: 'Rang farqi', code: 'DEF-COLOR', severity: 'MINOR' },
    { name: 'O\'lcham xatosi', code: 'DEF-SIZE', severity: 'MAJOR' },
  ];
  for (const d of defectDefs) {
    await prisma.defectType.upsert({ where: { code: d.code }, update: {}, create: d });
  }

  // ── Downtime Reasons ───────────────────────────────────────────────────
  const dtDefs = [
    { name: 'Uskunaning buzilishi', code: 'DT-BREAKDOWN', category: 'BREAKDOWN' },
    { name: 'Rejalashtirilgan texnik xizmat', code: 'DT-MAINT', category: 'MAINTENANCE' },
    { name: 'Xomashyo yetishmovchiligi', code: 'DT-MATERIAL', category: 'WAITING_MATERIAL' },
    { name: 'Model almashtirish', code: 'DT-CHANGEOVER', category: 'CHANGEOVER' },
    { name: 'Operatorning yo\'qligi', code: 'DT-OPERATOR', category: 'OPERATOR' },
    { name: 'Elektr uzilishi', code: 'DT-POWER', category: 'UNPLANNED' },
  ];
  for (const d of dtDefs) {
    await prisma.downtimeReason.upsert({ where: { code: d.code }, update: {}, create: d });
  }

  // ── System Settings ────────────────────────────────────────────────────
  const settings = [
    { key: 'app.name', value: 'ARKON', type: 'string', group: 'general', isPublic: true },
    { key: 'app.language', value: 'uz', type: 'string', group: 'general', isPublic: true },
    { key: 'app.timezone', value: 'Asia/Tashkent', type: 'string', group: 'general', isPublic: true },
    { key: 'app.currency', value: 'UZS', type: 'string', group: 'general', isPublic: true },
    { key: 'kpi.oee_target', value: '85', type: 'number', group: 'kpi', isPublic: false },
    { key: 'kpi.quality_target', value: '98', type: 'number', group: 'kpi', isPublic: false },
    { key: 'kpi.efficiency_target', value: '90', type: 'number', group: 'kpi', isPublic: false },
    { key: 'stock.low_alert_multiplier', value: '1.2', type: 'number', group: 'materials', isPublic: false },
  ];
  for (const s of settings) {
    await prisma.systemSetting.upsert({ where: { key: s.key }, update: {}, create: s });
  }

  // ── Users ──────────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@factory.uz' },
    update: {},
    create: {
      email: 'admin@factory.uz',
      username: 'superadmin',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      roleId: roles['super_admin'].id,
      factoryId: factory.id,
    },
  });

  const pmHash = await bcrypt.hash('Manager@123', 12);
  await prisma.user.upsert({
    where: { email: 'manager@factory.uz' },
    update: {},
    create: {
      email: 'manager@factory.uz',
      username: 'prod_manager',
      passwordHash: pmHash,
      firstName: 'Ishlab chiqarish',
      lastName: 'Menedjeri',
      roleId: roles['production_manager'].id,
      departmentId: depts['PROD-01'].id,
      factoryId: factory.id,
    },
  });

  const qiHash = await bcrypt.hash('Quality@123', 12);
  await prisma.user.upsert({
    where: { email: 'quality@factory.uz' },
    update: {},
    create: {
      email: 'quality@factory.uz',
      username: 'quality_inspector',
      passwordHash: qiHash,
      firstName: 'Sifat',
      lastName: 'Nazoratchi',
      roleId: roles['quality_inspector'].id,
      departmentId: depts['QC-01'].id,
      factoryId: factory.id,
    },
  });

  console.log('\nSeed completed successfully!');
  console.log('─────────────────────────────────');
  console.log('Login credentials:');
  console.log('  Super Admin : admin@factory.uz / Admin@123');
  console.log('  Manager     : manager@factory.uz / Manager@123');
  console.log('  QC Inspector: quality@factory.uz / Quality@123');
  console.log('─────────────────────────────────');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
