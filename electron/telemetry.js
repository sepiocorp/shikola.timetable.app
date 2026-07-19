const https = require('https')
const os = require('os')
const { app } = require('electron')

// ====================================================================
// TELEMETRY CONFIGURATION
// --------------------------------------------------------------------
// Data is sent via Formspree, which forwards it to sepiopixel@gmail.com
// Formspree project ID: 3031226910165172087
// ====================================================================

const FORMSPREE_PROJECT_ID = '3031226910165172087'
const TELEMETRY_HOST = 'formspree.io'
const TELEMETRY_PATH = `/f/${FORMSPREE_PROJECT_ID}`
const REPORTING_EMAIL = 'mmushibi@gmail.com'

const APP_VERSION = app.getVersion()
const APP_NAME = 'Shikola Timetable Creator'

let cachedIP = null
let sessionId = null

function generateSessionId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
}

function getSessionId() {
  if (!sessionId) {
    sessionId = generateSessionId()
  }
  return sessionId
}

function getPublicIP() {
  return new Promise((resolve) => {
    if (cachedIP) {
      resolve(cachedIP)
      return
    }
    const req = https.get('https://api.ipify.org?format=json', (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data)
          cachedIP = parsed.ip || 'unknown'
        } catch {
          cachedIP = 'unknown'
        }
        resolve(cachedIP)
      })
    })
    req.on('error', () => { resolve('unknown') })
    req.setTimeout(5000, () => { req.destroy(); resolve('unknown') })
  })
}

function getSystemInfo() {
  return {
    platform: process.platform,
    arch: process.arch,
    osVersion: os.release(),
    osName: os.type(),
    hostname: os.hostname(),
    cpuCount: os.cpus().length,
    totalMemory: Math.round(os.totalmem() / (1024 * 1024 * 1024)) + 'GB',
    appVersion: APP_VERSION,
    appName: APP_NAME,
    electronVersion: process.versions.electron,
    nodeVersion: process.versions.node,
  }
}

function sendData(payload) {
  return new Promise((resolve) => {
    // Format payload for Formspree - flatten into readable email fields
    const formPayload = {
      _subject: `[Shikola Telemetry] ${payload.type.toUpperCase()} - ${payload.timestamp}`,
      dataType: payload.type,
      timestamp: payload.timestamp,
      sessionId: payload.sessionId,
      ip: payload.ip || 'N/A',
      ...payload.data,
      systemInfo: JSON.stringify(payload.system, null, 2),
    }

    const postData = JSON.stringify(formPayload)

    const options = {
      hostname: TELEMETRY_HOST,
      port: 443,
      path: TELEMETRY_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': `${APP_NAME}/${APP_VERSION}`,
        'Accept': 'application/json',
      },
      timeout: 10000,
    }

    const req = https.request(options, (res) => {
      let data = ''
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        resolve({ success: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode })
      })
    })

    req.on('error', (err) => {
      console.error('[Telemetry] Failed to send data:', err.message)
      resolve({ success: false, error: err.message })
    })

    req.on('timeout', () => {
      req.destroy()
      console.error('[Telemetry] Request timed out')
      resolve({ success: false, error: 'timeout' })
    })

    req.write(postData)
    req.end()
  })
}

// ====================================================================
// REGISTRATION - sends school contact info to Sepio Corp
// Only called when user explicitly opts in during setup wizard
// ====================================================================

async function sendRegistration(schoolData, consentGiven) {
  if (!consentGiven) return { success: false, error: 'No consent' }

  const ip = await getPublicIP()

  const payload = {
    type: 'registration',
    toEmail: REPORTING_EMAIL,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    ip: ip,
    system: getSystemInfo(),
    data: {
      schoolName: schoolData.name || '',
      schoolPhone: schoolData.phone || '',
      schoolEmail: schoolData.email || '',
      schoolAddress: schoolData.address || '',
      schoolWebsite: schoolData.website || '',
      academicYear: schoolData.academicYear || '',
      term: schoolData.term || '',
      consentGiven: true,
      consentTimestamp: new Date().toISOString(),
    },
  }

  return sendData(payload)
}

// ====================================================================
// ANALYTICS - sends anonymous usage events
// Only called when user has enabled analytics in Settings
// No personal data is included
// ====================================================================

async function sendAnalyticsEvent(eventName, eventData) {
  const payload = {
    type: 'analytics',
    toEmail: REPORTING_EMAIL,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    system: getSystemInfo(),
    data: {
      event: eventName,
      eventDetails: eventData || {},
    },
  }

  return sendData(payload)
}

// ====================================================================
// CRASH REPORTING - sends error details when the app crashes
// Only called when user has enabled crash reporting in Settings
// ====================================================================

async function sendCrashReport(errorData) {
  const ip = await getPublicIP()

  const payload = {
    type: 'crash',
    toEmail: REPORTING_EMAIL,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    ip: ip,
    system: getSystemInfo(),
    data: {
      errorType: errorData.type || 'unknown',
      errorMessage: errorData.message || '',
      errorStack: errorData.stack || '',
      errorUrl: errorData.url || '',
      errorLine: errorData.line || 0,
      errorColumn: errorData.column || 0,
      errorTimestamp: errorData.timestamp || new Date().toISOString(),
    },
  }

  return sendData(payload)
}

// ====================================================================
// APP LAUNCH EVENT - sent on startup if analytics is enabled
// ====================================================================

async function sendAppLaunch() {
  return sendAnalyticsEvent('app_launched', {
    launchTime: new Date().toISOString(),
  })
}

module.exports = {
  sendRegistration,
  sendAnalyticsEvent,
  sendCrashReport,
  sendAppLaunch,
  getPublicIP,
  getSystemInfo,
  getSessionId,
}
