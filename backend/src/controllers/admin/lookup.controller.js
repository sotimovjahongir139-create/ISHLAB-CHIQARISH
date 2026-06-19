const prisma = require('../../config/database');
const { success } = require('../../utils/response');

const DEFAULTS = {
  material_categories: ['RAW_MATERIAL', 'COMPONENT', 'PACKAGING', 'CONSUMABLE', 'SPARE_PART', 'OTHER'],
};

const getLookup = async (req, res) => {
  const { type } = req.params;
  const key = `lookup.${type}`;
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  const items = row ? JSON.parse(row.value) : (DEFAULTS[type] || []);
  success(res, items);
};

const setLookup = async (req, res) => {
  const { type } = req.params;
  const key = `lookup.${type}`;
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  await prisma.systemSetting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(items), type: 'json', group: 'lookup' },
    update: { value: JSON.stringify(items) },
  });
  success(res, items, 'Saqlandi');
};

module.exports = { getLookup, setLookup };
