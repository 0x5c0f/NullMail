import { Server, Socket } from 'socket.io';
import { mailEmitter } from './smtp.js';
import { config } from '../config.js';

const onlines = new Map<string, Socket>();

export function setupSocketIO(io: Server) {
  // Listen for incoming mails from SMTP module
  mailEmitter.on('mail', ({ shortid, mail }) => {
    const socket = onlines.get(shortid);
    if (socket) {
      socket.emit('mail', mail);
      console.log(`Mail pushed to shortid: ${shortid}`);
    }
  });

  io.on('connection', (socket: any) => {
    console.log('New client connected:', socket.id);

    socket.on('set shortid', (id: string) => {
      const cleanId = id.toLowerCase().trim();
      
      // Check blacklist
      if (config.blacklist.includes(cleanId)) {
        socket.emit('error', 'This ID is forbidden.');
        return;
      }

      // Remove old mapping if exists
      if (socket.shortid) {
        onlines.delete(socket.shortid);
      }

      socket.shortid = cleanId;
      onlines.set(cleanId, socket);
      socket.emit('shortid_ready', cleanId);
      console.log(`Socket ${socket.id} bound to shortid: ${cleanId}`);
    });

    socket.on('disconnect', () => {
      if (socket.shortid) {
        onlines.delete(socket.shortid);
      }
      console.log('Client disconnected:', socket.id);
    });
  });
}
