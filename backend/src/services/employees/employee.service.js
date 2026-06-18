const prisma = require('../../config/database');
const AppError = require('../../utils/AppError');
const { getPagination, getSort } = require('../../utils/pagination');

const getEmployees = async (query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { isDeleted: false };

  if (query.search) where.OR = [
    { firstName: { contains: query.search, mode: 'insensitive' } },
    { lastName: { contains: query.search, mode: 'insensitive' } },
    { employeeNumber: { contains: query.search, mode: 'insensitive' } },
    { position: { contains: query.search, mode: 'insensitive' } },
  ];
  if (query.departmentId) where.departmentId = query.departmentId;
  if (query.status) where.status = query.status;
  if (query.gender) where.gender = query.gender;

  const [data, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      include: { department: { select: { id: true, name: true, code: true } } },
      orderBy: getSort(query, ['firstName', 'lastName', 'hireDate', 'employeeNumber']),
      skip,
      take: limit,
    }),
    prisma.employee.count({ where }),
  ]);

  return { data, total, page, limit };
};

const getEmployee = async (id) => {
  const employee = await prisma.employee.findFirst({
    where: { id, isDeleted: false },
    include: {
      department: true,
      user: { select: { id: true, email: true, username: true, isActive: true } },
    },
  });
  if (!employee) throw new AppError('Xodim topilmadi', 404);
  return employee;
};

const createEmployee = async (body) => {
  const nextNum = await prisma.employee.count() + 1;
  const employeeNumber = body.employeeNumber || `EMP-${String(nextNum).padStart(5, '0')}`;

  return prisma.employee.create({
    data: {
      employeeNumber,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      gender: body.gender,
      phone: body.phone,
      address: body.address,
      position: body.position,
      hireDate: new Date(body.hireDate),
      salary: body.salary,
      departmentId: body.departmentId,
    },
    include: { department: true },
  });
};

const recordAttendance = async (body) => {
  return prisma.employeeAttendance.upsert({
    where: { employeeId_date: { employeeId: body.employeeId, date: new Date(body.date) } },
    create: {
      employeeId: body.employeeId,
      date: new Date(body.date),
      checkIn: body.checkIn ? new Date(body.checkIn) : undefined,
      checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
      status: body.status || 'PRESENT',
      shiftId: body.shiftId,
      notes: body.notes,
    },
    update: {
      checkOut: body.checkOut ? new Date(body.checkOut) : undefined,
      status: body.status,
      notes: body.notes,
    },
  });
};

const getAttendance = async (employeeId, query) => {
  const { page, limit, skip } = getPagination(query);
  const where = { employeeId };

  if (query.dateFrom) where.date = { gte: new Date(query.dateFrom) };
  if (query.dateTo) where.date = { ...(where.date || {}), lte: new Date(query.dateTo) };

  const [data, total] = await Promise.all([
    prisma.employeeAttendance.findMany({ where, orderBy: { date: 'desc' }, skip, take: limit }),
    prisma.employeeAttendance.count({ where }),
  ]);

  return { data, total, page, limit };
};

const updateEmployee = async (id, body) => {
  const emp = await prisma.employee.findFirst({ where: { id, isDeleted: false } });
  if (!emp) throw new AppError('Xodim topilmadi', 404);

  return prisma.employee.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName,
      birthDate: body.birthDate ? new Date(body.birthDate) : undefined,
      gender: body.gender,
      phone: body.phone,
      address: body.address,
      position: body.position,
      salary: body.salary,
      status: body.status,
      departmentId: body.departmentId,
    },
    include: { department: true },
  });
};

const deleteEmployee = async (id) => {
  const emp = await prisma.employee.findFirst({ where: { id, isDeleted: false } });
  if (!emp) throw new AppError('Xodim topilmadi', 404);
  return prisma.employee.update({ where: { id }, data: { isDeleted: true, deletedAt: new Date() } });
};

const getDepartments = async () => {
  return prisma.department.findMany({ where: { isActive: true }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true } });
};

module.exports = { getEmployees, getEmployee, createEmployee, updateEmployee, deleteEmployee, recordAttendance, getAttendance, getDepartments };
