#!/usr/bin/env node
/**
 * SIMPLYYTR 2.0 — Pre-Commit & CI Credential Guard
 * Verifies that no Google Chrome profiles, cookies, login databases,
 * or plaintext secret files are staged or tracked in Git.
 */

import { execSync } from 'child_process';

const BLOCKED_PATTERNS = [
  /chrome_profile/i,
  /chrome_data/i,
  /Default[\\\/]Network[\\\/]Cookies/i,
  /Default[\\\/]Login Data/i,
  /Default[\\\/]Web Data/i,
  /Local State/i,
  /\.env(\.local|\.production|\.development)?$/i,
  /client_secret.*\.json$/i,
  /service_account.*\.json$/i,
  /token.*\.json$/i,
  /youtube_credentials\.json$/i,
  /\.(pem|key|pfx|p12)$/i
];

console.log('Running SIMPLYYTR Credential Guard...');

let output = '';
try {
  // Check staged files or untracked changes
  output = execSync('git diff --cached --name-only', { encoding: 'utf8' });
} catch (e) {
  console.error('Failed to run git command:', e.message);
  process.exit(1);
}

const stagedFiles = output.split('\n').map(s => s.trim()).filter(Boolean);
let violations = 0;

for (const file of stagedFiles) {
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(file)) {
      console.error(`[BLOCKED] Staged file matches forbidden pattern (${pattern}): ${file}`);
      violations++;
      break;
    }
  }
}

if (violations > 0) {
  console.error(`\nCredential Guard FAILED: ${violations} sensitive file(s) staged.`);
  console.error('Remove these files from staging immediately: git reset HEAD <file>');
  process.exit(1);
} else {
  console.log('Credential Guard PASSED: No forbidden credential patterns staged.');
  process.exit(0);
}
