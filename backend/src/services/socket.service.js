let ioInstance;

const init = (server) => {
  const { Server } = require('socket.io');
  const jwt = require('jsonwebtoken');

  ioInstance = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance.on('connection', (socket) => {
    // Authenticate socket handshake using JWT token
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const secret = process.env.JWT_SECRET || 'fallback-secret-key-123';
        const decoded = jwt.verify(token, secret);
        
        socket.userId = decoded.id;
        socket.join(decoded.id);
        
        console.log(`[Socket] User ${decoded.id} authenticated and joined room.`);
      } catch (err) {
        console.error('[Socket] Connection authentication failed:', err.message);
        socket.disconnect();
        return;
      }
    } else {
      console.log('[Socket] Unauthenticated client connection.');
    }

    socket.on('disconnect', () => {
      if (socket.userId) {
        console.log(`[Socket] User ${socket.userId} disconnected.`);
      } else {
        console.log('[Socket] Client disconnected.');
      }
    });
  });

  return ioInstance;
};

const getIo = () => ioInstance;

const sendToUser = (userId, eventName, payload) => {
  if (ioInstance && userId) {
    ioInstance.to(userId).emit(eventName, payload);
  }
};

const broadcast = (eventName, payload) => {
  if (ioInstance) {
    ioInstance.emit(eventName, payload);
  }
};

module.exports = { init, getIo, sendToUser, broadcast };
