const svc = require('../services/materials/material.service');
const { success, created, paginated } = require('../utils/response');

const getMaterials = async (req, res) => {
  const { data, total, page, limit } = await svc.getMaterials(req.query);
  paginated(res, data, total, page, limit);
};

const createMaterial = async (req, res) => {
  const data = await svc.createMaterial(req.body);
  created(res, data, 'Xomashyo qo\'shildi');
};

const updateMaterial = async (req, res) => {
  const data = await svc.updateMaterial(req.params.id, req.body);
  success(res, data, 'Xomashyo yangilandi');
};

const addTransaction = async (req, res) => {
  const data = await svc.addTransaction(req.params.id, req.body, req.user.id);
  created(res, data, 'Harakat qayd etildi');
};

const getTransactions = async (req, res) => {
  const { data, total, page, limit } = await svc.getTransactions(req.params.id, req.query);
  paginated(res, data, total, page, limit);
};

module.exports = { getMaterials, createMaterial, updateMaterial, addTransaction, getTransactions };
