'use strict';
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const { PERMISSIONS } = require('../src/utils/permissions');

const DEPARTMENT_PASSWORD = 'arkon1234';
const DEPARTMENT_ROLE_NAME = 'department';
const EMAIL_DOMAIN = 'arkon.local';

// Uzbek Latin apostrophe variants (o', g', ' , etc.) collapse to nothing;
// everything else non-alphanumeric becomes a separator.
const slugify = (name) => {
  const noSuffix = name
    .replace(/bo['‘’ʼ]?limi\b/gi, '')
    .replace(/bo['‘’ʼ]?lim\b/gi, '');
  return noSuffix
    .replace(/['‘’ʼ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'bolim';
};

async function main() {
  console.log('[seed-department-accounts] ==========================================');
  console.log('[seed-department-accounts] Syncing department login accounts...');

  const prisma = new PrismaClient();
  try {
    const role = await prisma.role.upsert({
      where: { name: DEPARTMENT_ROLE_NAME },
      update: {},
      create: {
        name: DEPARTMENT_ROLE_NAME,
        displayName: "Bo'lim foydalanuvchisi",
        description: "Faqat o'z bo'limining Xodimlar samaradorligi sahifasini ko'radi",
        isSystem: true,
      },
    });

    const perm = await prisma.permission.upsert({
      where: { name: PERMISSIONS.EMPLOYEES_READ },
      update: {},
      create: {
        name: PERMISSIONS.EMPLOYEES_READ,
        displayName: 'Employees: Read',
        module: 'employees',
        action: 'read',
      },
    });

    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
      update: {},
      create: { roleId: role.id, permissionId: perm.id },
    });

    const departments = await prisma.department.findMany({ where: { isDeleted: false } });
    const passwordHash = await bcrypt.hash(DEPARTMENT_PASSWORD, 12);

    const usedSlugs = new Set();
    for (const dept of departments) {
      let slug = slugify(dept.name);
      // Disambiguate departments that would collide on the same slug.
      if (usedSlugs.has(slug)) {
        let i = 2;
        while (usedSlugs.has(`${slug}_${i}`)) i++;
        slug = `${slug}_${i}`;
      }
      usedSlugs.add(slug);

      const email = `${slug}@${EMAIL_DOMAIN}`;

      const existingByEmail = await prisma.user.findUnique({ where: { email } });
      if (existingByEmail) {
        await prisma.user.update({
          where: { id: existingByEmail.id },
          data: { roleId: role.id, departmentId: dept.id, factoryId: dept.factoryId, isActive: true },
        });
        console.log(`[seed-department-accounts] updated: ${email} -> ${dept.name}`);
        continue;
      }

      await prisma.user.create({
        data: {
          email,
          username: slug,
          passwordHash,
          firstName: dept.name,
          lastName: "bo'limi",
          roleId: role.id,
          departmentId: dept.id,
          factoryId: dept.factoryId,
        },
      });
      console.log(`[seed-department-accounts] created: ${email} / ${DEPARTMENT_PASSWORD} -> ${dept.name}`);
    }

    console.log(`[seed-department-accounts] Done. ${departments.length} department account(s) synced.`);
    console.log('[seed-department-accounts] ==========================================');
  } finally {
    await prisma.$disconnect();
  }
}

module.exports = main;

if (require.main === module) {
  main().catch((err) => {
    console.error('[seed-department-accounts] FATAL:', err.message);
    process.exit(1);
  });
}
