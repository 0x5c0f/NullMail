import { Server, Socket } from 'socket.io';
import { mailEmitter } from './smtp.js';
import { config } from '../config.js';
import { isValidShortid, normalizeShortid } from './mailbox.js';

const onlines = new Map<string, Set<Socket>>();

function detachSocket(socket: Socket): void {
  const currentShortid = typeof socket.data.shortid === 'string' ? socket.data.shortid : undefined;
  if (!currentShortid) {
    return;
  }

  const listeners = onlines.get(currentShortid);
  if (listeners) {
    listeners.delete(socket);
    if (listeners.size === 0) {
      onlines.delete(currentShortid);
    }
  }

  delete socket.data.shortid;
}

export function setupSocketIO(io: Server) {
  // Listen for incoming mails from SMTP module
  mailEmitter.on('mail', ({ shortid, mail }) => {
    const sockets = onlines.get(shortid);
    if (sockets && sockets.size > 0) {
      for (const socket of sockets) {
        socket.emit('mail', mail);
      }
      console.log(`Mail pushed to shortid: ${shortid} (${sockets.size} sockets)`);
    }
  });

  io.on('connection', (socket: Socket) => {
    console.log('New client connected:', socket.id);

    socket.on('set shortid', (id: string) => {
      const cleanId = normalizeShortid(typeof id === 'string' ? id : '');

      if (!isValidShortid(cleanId)) {
        socket.emit('error', 'Invalid ID (3-20 chars, alphanumeric only).');
        return;
      }

      if (config.blacklist.includes(cleanId)) {
        socket.emit('error', 'This ID is forbidden.');
        return;
      }

      detachSocket(socket);

      const listeners = onlines.get(cleanId) ?? new Set<Socket>();
      listeners.add(socket);
      onlines.set(cleanId, listeners);
      socket.data.shortid = cleanId;
      socket.emit('shortid_ready', cleanId);
      console.log(`Socket ${socket.id} bound to shortid: ${cleanId} (${listeners.size} sockets)`);
    });

    socket.on('disconnect', () => {
      detachSocket(socket);
      console.log('Client disconnected:', socket.id);
    });
  });
}
