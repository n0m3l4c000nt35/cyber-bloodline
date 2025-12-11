const { Pool } = require('pg');

// Configuración del pool de conexiones
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                      // Máximo de conexiones en el pool
  idleTimeoutMillis: 30000,     // Cierra conexiones inactivas después de 30s
  connectionTimeoutMillis: 2000, // Timeout para obtener una conexión del pool
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

// Listener de errores - evita que la app crashee por errores de conexión inesperados
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

// Test de conexión al iniciar
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully at:', res.rows[0].now);
  }
});

// Graceful shutdown - cierra el pool cuando se detiene el servidor
process.on('SIGINT', async () => {
  console.log('\n⏳ Closing database connections...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏳ Closing database connections...');
  await pool.end();
  console.log('✅ Database pool closed');
  process.exit(0);
});

module.exports = pool;