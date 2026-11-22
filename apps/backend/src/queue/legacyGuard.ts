/**
 * Fail-Closed Legacy Scraper & Editor Guard (SIMPLYYTR 2.0)
 * 
 * Prevents legacy 1.0 YouTube scraping, downloading, and re-editing queues
 * from executing during normal SIMPLYYTR 2.0 operation.
 * 
 * Safety Principles:
 * 1. Disabled by default: When the explicit opt-in is absent, all legacy scraping/editing is blocked.
 * 2. Fail closed on malformed values: Only strict 'true' (case-insensitive, trimmed) is accepted.
 *    Values such as '1', 'yes', 'enabled', or arbitrary strings evaluate to false (disabled).
 * 3. autoPilotEnabled isolation: Setting autoPilotEnabled=true in system settings NEVER
 *    implicitly enables legacy scraping or editing.
 * 4. autoPublishOnline independence: autoPublishOnline is an independent publishing safeguard,
 *    not the legacy queue execution guard.
 */

export const LEGACY_SCRAPER_OPT_IN_ENV = 'ENABLE_LEGACY_SCRAPER_PIPELINE';

export function isLegacyScraperPipelineEnabled(): boolean {
  const raw = process.env[LEGACY_SCRAPER_OPT_IN_ENV];
  if (!raw) {
    return false;
  }
  const normalized = raw.trim().toLowerCase();
  return normalized === 'true';
}

export function assertLegacyScraperPipelineAllowed(operation: string): void {
  if (!isLegacyScraperPipelineEnabled()) {
    const message = `[Legacy Guard] Execution blocked: '${operation}' is disabled by default in SIMPLYYTR 2.0. Set ${LEGACY_SCRAPER_OPT_IN_ENV}="true" to explicitly enable.`;
    console.warn(message);
    throw new Error(message);
  }
}
