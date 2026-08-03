// License keys are loaded from licenses-data.js (gitignored — not tracked in version control)
// To set up: copy licenses-data.example.js to licenses-data.js and fill in real keys.
const { LICENSES } = require('./licenses-data')

// Build a lookup map for fast validation
const licenseMap = new Map(LICENSES.map(l => [l.key, l]))

// Track which keys have been activated (single-use enforcement)
// This is an in-memory set — persisted via the cache file in main.js
const activatedKeys = new Set()

function validateEmbeddedLicense(key) {
  const entry = licenseMap.get(key)
  if (!entry) return { valid: false, error: 'Invalid license key. Please check and try again.' }

  // Check if already activated on another installation
  if (activatedKeys.has(key)) {
    return { valid: false, error: 'This license key has already been used and cannot be activated again.' }
  }

  // Check expiry
  if (entry.expiresAt) {
    const expiry = new Date(entry.expiresAt)
    if (expiry < new Date()) {
      return { valid: false, error: `This license key expired on ${entry.expiresAt}. Please contact Sepio Corp to renew.` }
    }
  }

  // Mark as activated (single-use)
  activatedKeys.add(key)

  return {
    valid: true,
    key: entry.key,
    plan: entry.plan,
    expiresAt: entry.expiresAt,
    schoolName: entry.schoolName,
    validatedAt: new Date().toISOString(),
  }
}

module.exports = { LICENSES, validateEmbeddedLicense, activatedKeys }
