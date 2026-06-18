const svc = require('../../services/admin/audit.service');
const { success, paginated } = require('../../utils/response');

const getAuditLogs = async (req, res) => {
  const { data, total, page, limit } = await svc.getAuditLogs(req.query);
  paginated(res, data, total, page, limit);
};

const getActivityStats = async (req, res) => {
  const data = await svc.getActivityStats(parseInt(req.query.days) || 7);
  success(res, data);
};

module.exports = { getAuditLogs, getActivityStats };
