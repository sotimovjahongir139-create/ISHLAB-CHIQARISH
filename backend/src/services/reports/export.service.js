const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const prisma = require('../../config/database');
const { startOfDay, endOfDay } = require('date-fns');

const STYLES = {
  headerFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1565C0' } },
  headerFont: { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 },
  border: {
    top: { style: 'thin' }, left: { style: 'thin' },
    bottom: { style: 'thin' }, right: { style: 'thin' },
  },
};

const applyHeader = (ws, columns) => {
  ws.getRow(1).values = columns.map((c) => c.header);
  ws.getRow(1).eachCell((cell) => {
    cell.fill = STYLES.headerFill;
    cell.font = STYLES.headerFont;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = STYLES.border;
  });
  ws.getRow(1).height = 22;
  ws.columns = columns;
};

const exportProductionExcel = async ({ dateFrom, dateTo, lineId }) => {
  const where = {};
  if (dateFrom) where.factDate = { gte: new Date(dateFrom) };
  if (dateTo) where.factDate = { ...(where.factDate || {}), lte: new Date(dateTo) };
  if (lineId) where.productionLineId = lineId;

  const facts = await prisma.productionFact.findMany({
    where,
    include: {
      productionLine: { select: { name: true } },
      productModel: { select: { name: true, unit: true } },
      shift: { select: { name: true } },
    },
    orderBy: { factDate: 'asc' },
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = 'ARKON';
  wb.created = new Date();

  const ws = wb.addWorksheet('Ishlab chiqarish');

  applyHeader(ws, [
    { header: 'Sana', key: 'date', width: 14 },
    { header: 'Liniya', key: 'line', width: 16 },
    { header: 'Model', key: 'model', width: 18 },
    { header: 'Smena', key: 'shift', width: 12 },
    { header: 'Ishlab chiqarilgan', key: 'produced', width: 20 },
    { header: 'Yaroqli', key: 'good', width: 12 },
    { header: 'Nuqsonlar', key: 'defects', width: 12 },
    { header: 'Samaradorlik %', key: 'efficiency', width: 16 },
    { header: 'OEE %', key: 'oee', width: 10 },
  ]);

  facts.forEach((f, i) => {
    const row = ws.addRow({
      date: f.factDate.toLocaleDateString('uz'),
      line: f.productionLine?.name,
      model: f.productModel?.name,
      shift: f.shift?.name,
      produced: f.producedQty,
      good: f.goodQty,
      defects: f.defectQty,
      efficiency: f.efficiency?.toFixed(2),
      oee: f.oee?.toFixed(2),
    });
    if (i % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
      });
    }
    row.eachCell((cell) => { cell.border = STYLES.border; });
  });

  // Summary row
  const total = ws.addRow({
    date: 'JAMI',
    produced: facts.reduce((s, f) => s + f.producedQty, 0),
    good: facts.reduce((s, f) => s + f.goodQty, 0),
    defects: facts.reduce((s, f) => s + f.defectQty, 0),
  });
  total.font = { bold: true };
  total.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE3F2FD' } };

  return wb;
};

const exportDowntimeExcel = async ({ dateFrom, dateTo }) => {
  const where = {};
  if (dateFrom) where.startTime = { gte: new Date(dateFrom) };
  if (dateTo) where.startTime = { ...(where.startTime || {}), lte: new Date(dateTo) };

  const downtimes = await prisma.downtime.findMany({
    where,
    include: {
      productionLine: { select: { name: true } },
      reason: { select: { name: true, category: true } },
    },
    orderBy: { startTime: 'asc' },
  });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Toshlanishlar');

  applyHeader(ws, [
    { header: 'Boshlangan', key: 'start', width: 20 },
    { header: 'Tugagan', key: 'end', width: 20 },
    { header: 'Liniya', key: 'line', width: 16 },
    { header: 'Sabab', key: 'reason', width: 24 },
    { header: 'Kategoriya', key: 'category', width: 18 },
    { header: 'Davomiyligi (daqiqa)', key: 'duration', width: 22 },
    { header: 'Holat', key: 'status', width: 14 },
  ]);

  downtimes.forEach((d) => {
    const row = ws.addRow({
      start: d.startTime.toLocaleString('uz'),
      end: d.endTime?.toLocaleString('uz') || '—',
      line: d.productionLine?.name,
      reason: d.reason?.name,
      category: d.reason?.category,
      duration: d.durationMinutes?.toFixed(1) || '—',
      status: d.status,
    });
    row.eachCell((cell) => { cell.border = STYLES.border; });
  });

  return wb;
};

module.exports = { exportProductionExcel, exportDowntimeExcel };
