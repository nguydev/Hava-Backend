import './loadEnv'; // must be first — populates process.env before other imports
import http from 'http';
import app from './app';
import { connectDb } from './lib/db';
import { startScheduler } from './lib/scheduler';
import { initSocket } from './lib/socket';

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);
initSocket(server);

connectDb()
  .then(() => {
    console.log('Connected to MongoDB');
    startScheduler(); // deliver scheduled broadcasts when due
    server.listen(PORT, () => {
      console.log(`GOODR API & Socket.io running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1);
  });
