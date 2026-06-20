const { Pool } = require('pg');

let pool;

if (process.env.DATABASE_URL && process.env.DATABASE_URL !== 'in-memory') {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });
} else {
  console.log('ℹ️ DATABASE_URL is not set or set to "in-memory". Initializing pg-mem in-memory database...');
  const { newDb } = require('pg-mem');
  const { randomUUID } = require('crypto');
  const fs = require('fs');
  const path = require('path');

  const db = newDb();
  
  // Register UUID functions
  db.public.registerFunction({
    name: 'uuid_generate_v4',
    returns: 'uuid',
    implementation: () => randomUUID(),
    impure: true
  });
  db.public.registerFunction({
    name: 'gen_random_uuid',
    returns: 'uuid',
    implementation: () => randomUUID(),
    impure: true
  });

  db.public.registerFunction({
    name: 'nullif',
    args: ['bigint', 'integer'],
    returns: 'bigint',
    implementation: (val1, val2) => {
      if (val1 === null || val1 === undefined) return null;
      return Number(val1) === Number(val2) ? null : val1;
    }
  });

  db.public.registerFunction({
    name: 'date',
    args: ['timestamp with time zone'],
    returns: 'date',
    implementation: (val) => {
      if (!val) return null;
      // Convert to date format yyyy-mm-dd
      return new Date(val).toISOString().split('T')[0];
    }
  });

  // Register ROUND function for different numeric argument signatures
  db.public.registerFunction({
    name: 'round',
    args: ['bigint', 'integer'],
    returns: 'numeric',
    implementation: (val, precision) => {
      if (val === null || val === undefined) return null;
      const p = precision || 0;
      return Number(Number(val).toFixed(p));
    }
  });

  db.public.registerFunction({
    name: 'round',
    args: ['numeric', 'integer'],
    returns: 'numeric',
    implementation: (val, precision) => {
      if (val === null || val === undefined) return null;
      const p = precision || 0;
      return Number(Number(val).toFixed(p));
    }
  });

  const { Pool: PgMemPool } = db.adapters.createPg();
  pool = new PgMemPool({
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  try {
    // Load schema
    const schemaPath = path.join(__dirname, '../../../database/schema.sql');
    let sql = fs.readFileSync(schemaPath, 'utf8');
    
    // Clean PostgreSQL-specific extensions/indexes not supported by pg-mem
    sql = sql.replace(/CREATE EXTENSION IF NOT EXISTS.*/gi, '')
             .replace(/CREATE INDEX .* USING GIN.*/gi, '');
    
    // Execute DDL on pg-mem database
    db.public.none(sql);
    console.log('✅ In-memory database initialized and seeded successfully.');
  } catch (err) {
    console.error('❌ Failed to initialize in-memory database:', err);
  }
}

const query = (text, params) => pool.query(text, params);

const getClient = () => pool.connect();

module.exports = { query, getClient, pool };
