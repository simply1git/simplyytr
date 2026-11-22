#!/usr/bin/env node
/**
 * SIMPLYYTR 2.0 — Local PostgreSQL Database Manager
 * Uses self-contained native PostgreSQL binaries to initialize, start, and stop
 * an isolated local PostgreSQL instance for development and automated testing.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync, spawnSync, spawn } = require('child_process');
const net = require('net');
const { Client } = require('pg');

const ROOT_DIR = path.resolve(__dirname, '..');
const NATIVE_BIN = path.join(ROOT_DIR, 'node_modules', '@embedded-postgres', 'windows-x64', 'native', 'bin');
const INITDB_BIN = path.join(NATIVE_BIN, 'initdb.exe');
const PG_CTL_BIN = path.join(NATIVE_BIN, 'pg_ctl.exe');

const DATA_ROOT = path.join(ROOT_DIR, '.local_db_data');
const PG_DATA_DIR = path.join(DATA_ROOT, 'pgdata');
const LOG_FILE = path.join(DATA_ROOT, 'postgres.log');
const CONFIG_FILE = path.join(DATA_ROOT, 'config.json');

const DB_PORT = 5432;
const DB_USER = 'postgres';
const DB_NAME = 'simplyytr_dev';

function ensureDataDirs() {
  if (!fs.existsSync(DATA_ROOT)) {
    fs.mkdirSync(DATA_ROOT, { recursive: true });
  }
}

function getOrGenerateConfig() {
  ensureDataDirs();
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (data.password) return data;
    } catch {
      // Fall through to re-generate if invalid JSON
    }
  }
  const password = crypto.randomBytes(16).toString('hex');
  const config = {
    port: DB_PORT,
    user: DB_USER,
    database: DB_NAME,
    password
  };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
  return config;
}

function checkPortOpen(port, timeoutMs = 2000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finalize = (isOpen) => {
      if (!settled) {
        settled = true;
        socket.destroy();
        resolve(isOpen);
      }
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finalize(true));
    socket.once('timeout', () => finalize(false));
    socket.once('error', () => finalize(false));
    socket.connect(port, '127.0.0.1');
  });
}

async function waitForServer(port, maxAttempts = 20, delayMs = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    const open = await checkPortOpen(port, 400);
    if (open) return true;
    await new Promise((r) => setTimeout(r, delayMs));
  }
  return false;
}

function initCluster(config) {
  if (fs.existsSync(path.join(PG_DATA_DIR, 'PG_VERSION'))) {
    return; // Already initialized
  }

  console.log('[LocalDB] Initializing new PostgreSQL cluster...');
  ensureDataDirs();

  const pwFile = path.join(DATA_ROOT, '.init_pw');
  fs.writeFileSync(pwFile, config.password, { mode: 0o600 });

  try {
    execFileSync(INITDB_BIN, [
      '-D', PG_DATA_DIR,
      '-U', config.user,
      '-A', 'scram-sha-256',
      `--pwfile=${pwFile}`,
      '--encoding=UTF8'
    ], { stdio: 'pipe' });
    console.log('[LocalDB] PostgreSQL cluster initialized.');
  } finally {
    if (fs.existsSync(pwFile)) {
      fs.unlinkSync(pwFile);
    }
  }
}

async function startServer(options = {}) {
  const skipEnvSync = Boolean(options.skipEnvSync);
  const config = getOrGenerateConfig();

  if (!fs.existsSync(path.join(PG_DATA_DIR, 'PG_VERSION'))) {
    initCluster(config);
  }

  const alreadyOpen = await checkPortOpen(config.port, 500);
  if (alreadyOpen) {
    console.log(`[LocalDB] PostgreSQL is already listening on port ${config.port}.`);
  } else {
    console.log(`[LocalDB] Starting PostgreSQL on port ${config.port}...`);
    const child = spawn(PG_CTL_BIN, [
      '-D', PG_DATA_DIR,
      '-l', LOG_FILE,
      '-o', `-p ${config.port}`,
      'start'
    ], { detached: true, stdio: 'ignore' });
    child.unref();

    const ready = await waitForServer(config.port, 20, 500);
    if (!ready) {
      console.error('[LocalDB] Server did not become ready within timeout. Check log:', LOG_FILE);
      process.exit(1);
    }
    console.log('[LocalDB] PostgreSQL server started.');
  }

  // Ensure application database exists
  await ensureDatabaseExists(config);

  // Sync to local .env file unless explicitly skipped
  if (skipEnvSync) {
    console.log('[LocalDB] Environment synchronization skipped (--skip-env-sync).');
  } else {
    syncLocalEnv(config);
  }
}

async function ensureDatabaseExists(config) {
  let adminClient;
  let connected = false;
  for (let attempt = 1; attempt <= 15; attempt++) {
    try {
      adminClient = new Client({
        host: '127.0.0.1',
        port: config.port,
        user: config.user,
        password: config.password,
        database: 'postgres'
      });
      await adminClient.connect();
      connected = true;
      break;
    } catch (err) {
      const isTransient = err.message && (
        err.message.includes('starting up') ||
        err.message.includes('not yet accepting connections') ||
        err.message.includes('recovery state') ||
        err.message.includes('ECONNREFUSED')
      );
      if (isTransient) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      throw err;
    }
  }

  if (!connected) {
    throw new Error('Database server did not finish starting up within timeout');
  }

  try {
    const res = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [config.database]
    );
    if (res.rowCount === 0) {
      console.log(`[LocalDB] Creating database '${config.database}'...`);
      await adminClient.query(`CREATE DATABASE "${config.database}"`);
      console.log(`[LocalDB] Database '${config.database}' created.`);
    } else {
      console.log(`[LocalDB] Database '${config.database}' exists.`);
    }
  } catch (err) {
    console.error('[LocalDB] Failed to verify/create database:', err.message);
    throw err;
  } finally {
    if (adminClient) {
      await adminClient.end().catch(() => {});
    }
  }
}

function syncLocalEnv(config) {
  const envPath = path.join(ROOT_DIR, '.env');
  const examplePath = path.join(ROOT_DIR, '.env.example');
  const localDbUrl = `postgresql://${config.user}:${config.password}@127.0.0.1:${config.port}/${config.database}?schema=public`;

  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  } else if (fs.existsSync(examplePath)) {
    envContent = fs.readFileSync(examplePath, 'utf8');
    // Generate a fresh random pipeline secret if creating fresh .env
    const randomSecret = crypto.randomBytes(32).toString('hex');
    envContent = envContent.replace(
      /PIPELINE_SECRET=".*"/,
      `PIPELINE_SECRET="${randomSecret}"`
    );
  }

  // Update or set DATABASE_URL
  if (/^DATABASE_URL=.*$/m.test(envContent)) {
    envContent = envContent.replace(
      /^DATABASE_URL=.*$/m,
      `DATABASE_URL="${localDbUrl}"`
    );
  } else {
    envContent = `DATABASE_URL="${localDbUrl}"\n` + envContent;
  }

  fs.writeFileSync(envPath, envContent, { mode: 0o600 });
  console.log('[LocalDB] Local .env configured with safe local database URL.');
}

async function stopServer() {
  const config = getOrGenerateConfig();
  const result = spawnSync(PG_CTL_BIN, [
    '-D', PG_DATA_DIR,
    '-m', 'fast',
    'stop'
  ], { stdio: 'ignore' });

  if (result.status === 0) {
    console.log('[LocalDB] PostgreSQL server stopped.');
  } else {
    // Check if it was already stopped
    const open = await checkPortOpen(config.port, 300);
    if (!open) {
      console.log('[LocalDB] PostgreSQL is not running.');
    } else {
      console.error('[LocalDB] Failed to stop PostgreSQL cleanly:', result.stderr || result.stdout);
      process.exit(1);
    }
  }
}

async function checkStatus() {
  const config = getOrGenerateConfig();
  const open = await checkPortOpen(config.port, 500);
  if (!open) {
    console.log('[LocalDB] Status: STOPPED (Port 5432 closed)');
    return;
  }

  let client;
  let connected = false;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      client = new Client({
        host: '127.0.0.1',
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database
      });
      await client.connect();
      connected = true;
      break;
    } catch (err) {
      const isTransient = err.message && (
        err.message.includes('starting up') ||
        err.message.includes('not yet accepting connections') ||
        err.message.includes('recovery state') ||
        err.message.includes('ECONNREFUSED')
      );
      if (isTransient) {
        await new Promise((r) => setTimeout(r, 600));
        continue;
      }
      console.log(`[LocalDB] Status: Port open but database connection failed (${err.message})`);
      return;
    }
  }

  if (!connected) {
    console.log('[LocalDB] Status: Port open but database is still starting up');
    return;
  }

  try {
    const ver = await client.query('SELECT version();');
    console.log(`[LocalDB] Status: RUNNING on port ${config.port}`);
    console.log(`[LocalDB] Database: ${config.database}`);
    console.log(`[LocalDB] Engine: ${ver.rows[0].version}`);
  } catch (err) {
    console.log(`[LocalDB] Status: Query failed (${err.message})`);
  } finally {
    if (client) {
      await client.end().catch(() => {});
    }
  }
}

function parseArgs(argv = process.argv.slice(2)) {
  let command = null;
  let skipEnvSync = false;
  let help = false;

  for (const arg of argv) {
    if (arg === '--skip-env-sync') {
      skipEnvSync = true;
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (!arg.startsWith('--') && !command) {
      command = arg;
    }
  }

  return {
    command: command || 'start',
    skipEnvSync,
    help
  };
}

async function main() {
  const { command, skipEnvSync, help } = parseArgs(process.argv.slice(2));

  if (help) {
    console.log('Usage: node scripts/local_db.js [start|stop|status] [--skip-env-sync]');
    console.log('');
    console.log('Commands:');
    console.log('  start            Start local PostgreSQL server (default)');
    console.log('  stop             Stop local PostgreSQL server');
    console.log('  status           Check status of local PostgreSQL server');
    console.log('');
    console.log('Options:');
    console.log('  --skip-env-sync  Skip writing/updating DATABASE_URL in .env on startup');
    console.log('  -h, --help       Show this help message');
    return;
  }

  if (!fs.existsSync(INITDB_BIN) || !fs.existsSync(PG_CTL_BIN)) {
    console.error('[LocalDB] Error: Native PostgreSQL binaries not found at:', NATIVE_BIN);
    process.exit(1);
  }

  if (command === 'start') {
    await startServer({ skipEnvSync });
  } else if (command === 'stop') {
    await stopServer();
  } else if (command === 'status') {
    await checkStatus();
  } else {
    console.log('Usage: node scripts/local_db.js [start|stop|status] [--skip-env-sync]');
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[LocalDB] Fatal error:', err.message);
    process.exit(1);
  });
}

module.exports = {
  parseArgs,
  startServer,
  stopServer,
  checkStatus,
  syncLocalEnv,
  getOrGenerateConfig
};
