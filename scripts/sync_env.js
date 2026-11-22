const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT_DIR = path.resolve(__dirname, '..');
const configPath = path.join(ROOT_DIR, '.local_db_data/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const envPath = path.join(ROOT_DIR, '.env');
const examplePath = path.join(ROOT_DIR, '.env.example');

let envContent = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf8')
  : fs.readFileSync(examplePath, 'utf8');

const dbUrl = `postgresql://${config.user}:${config.password}@127.0.0.1:${config.port}/${config.database}?schema=public`;

// Replace or add DATABASE_URL
if (/^DATABASE_URL=.*$/m.test(envContent)) {
  envContent = envContent.replace(/^DATABASE_URL=.*$/m, `DATABASE_URL="${dbUrl}"`);
} else {
  envContent = `DATABASE_URL="${dbUrl}"\n` + envContent;
}

// Replace or add DIRECT_URL
if (/^DIRECT_URL=.*$/m.test(envContent)) {
  envContent = envContent.replace(/^DIRECT_URL=.*$/m, `DIRECT_URL="${dbUrl}"`);
} else {
  envContent = `DIRECT_URL="${dbUrl}"\n` + envContent;
}

// Ensure PIPELINE_SECRET is set to high-entropy hex string
const secretMatch = envContent.match(/^PIPELINE_SECRET="(.*)"$/m);
if (!secretMatch || secretMatch[1] === 'your_random_secret_key_here' || secretMatch[1].length < 32) {
  const secureSecret = crypto.randomBytes(32).toString('hex');
  if (secretMatch) {
    envContent = envContent.replace(/^PIPELINE_SECRET=".*"$/m, `PIPELINE_SECRET="${secureSecret}"`);
  } else {
    envContent += `\nPIPELINE_SECRET="${secureSecret}"\n`;
  }
}

fs.writeFileSync(envPath, envContent, { mode: 0o600 });
console.log('Successfully synchronized local .env configuration (safe local URLs configured).');
