const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const config = require('./config');
const logger = require('../utils/logger');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: config.frontendUrl, credentials: true },
    pingTimeout: 60000,
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Token taqdim etilmagan'));
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error('Yaroqsiz token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id} (user: ${socket.userId})`);
    socket.join(`user:${socket.userId}`);

    socket.on('join:factory', (factoryId) => socket.join(`factory:${factoryId}`));
    socket.on('join:line', (lineId) => socket.join(`line:${lineId}`));

    socket.on('disconnect', () => logger.debug(`Socket disconnected: ${socket.id}`));
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

const emit = {
  toFactory: (factoryId, event, data) => getIO().to(`factory:${factoryId}`).emit(event, data),
  toLine: (lineId, event, data) => getIO().to(`line:${lineId}`).emit(event, data),
  toUser: (userId, event, data) => getIO().to(`user:${userId}`).emit(event, data),
  broadcast: (event, data) => getIO().emit(event, data),
};

module.exports = { initSocket, getIO, emit };
