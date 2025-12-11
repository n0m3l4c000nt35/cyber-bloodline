require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const pool = require('./src/config/database');

const PORT = process.env.PORT || 3000;

// Create HTTP server
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
const shutdown = async () => {
  console.log('\n⏳ Shutting down gracefully...');

  server.close(async () => {
    console.log('✅ HTTP server closed');
    await pool.end();
    console.log('✅ Database pool closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);