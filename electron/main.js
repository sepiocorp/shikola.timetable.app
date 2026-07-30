const { app, BrowserWindow, Menu, ipcMain, crashReporter } = require('electron')
const path = require('path')
const fs = require('fs')
const telemetry = require('./telemetry')
const { validateEmbeddedLicense, activatedKeys } = require('./licenses')

const isDev = process.env.VITE_DEV === 'true'

// Auto-updater (production only)
let autoUpdater = null
if (!isDev) {
  try {
    autoUpdater = require('electron-updater').autoUpdater
  } catch (err) {
    console.error('[AutoUpdater] Failed to load:', err.message)
  }
}

// Persistent auto-update preferences shared between main and renderer
const defaultUpdateConfig = {
  enabled: true,
  autoInstall: false,
  installOnQuit: true,
  checkIntervalMinutes: 60,
}
let updateConfig = { ...defaultUpdateConfig }
let updateCheckInterval = null
let autoInstallTimeout = null

function getUpdateConfigPath() {
  return path.join(app.getPath('userData'), 'auto-update-config.json')
}

function loadUpdateConfig() {
  try {
    const configPath = getUpdateConfigPath()
    if (fs.existsSync(configPath)) {
      const data = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      updateConfig = { ...defaultUpdateConfig, ...data }
    }
  } catch (err) {
    console.error('[AutoUpdater] Failed to load config:', err.message)
  }
  return updateConfig
}

function saveUpdateConfig(config) {
  try {
    updateConfig = { ...updateConfig, ...config }
    fs.writeFileSync(getUpdateConfigPath(), JSON.stringify(updateConfig, null, 2))
    applyUpdateConfig()
  } catch (err) {
    console.error('[AutoUpdater] Failed to save config:', err.message)
  }
}

function applyUpdateConfig() {
  if (!autoUpdater) return
  autoUpdater.autoDownload = updateConfig.enabled !== false
  autoUpdater.autoInstallOnAppQuit = updateConfig.enabled !== false && updateConfig.installOnQuit !== false
}

// Track install/update info
let installInfo = null

function detectInstallInfo() {
  if (installInfo) return installInfo
  const userDataPath = app.getPath('userData')
  const versionFile = path.join(userDataPath, 'app-version.json')
  const currentVersion = app.getVersion()

  let previousVersion = null
  let isUpdate = false
  let isFirstInstall = true

  try {
    if (fs.existsSync(versionFile)) {
      const data = JSON.parse(fs.readFileSync(versionFile, 'utf-8'))
      previousVersion = data.version
      isFirstInstall = false
      if (previousVersion !== currentVersion) {
        isUpdate = true
      }
    }
  } catch (err) {
    console.error('[Install] Failed to read version file:', err.message)
  }

  // Write current version for future checks
  try {
    fs.writeFileSync(versionFile, JSON.stringify({ version: currentVersion, installedAt: new Date().toISOString() }))
  } catch (err) {
    console.error('[Install] Failed to write version file:', err.message)
  }

  installInfo = {
    currentVersion,
    previousVersion,
    isFirstInstall,
    isUpdate,
  }
  console.log('[Install]', installInfo)
  return installInfo
}

// Start crash reporter (actual transmission is gated by user consent in UI)
crashReporter.start({
  productName: 'Shikola Timetable Creator',
  companyName: 'Sepio Corp',
  submitURL: 'https://formspree.io/f/3031226910165172087',
  uploadToServer: false,
})

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll', label: 'Select All' },
      ],
    },
    {
      label: 'Timetable',
      submenu: [
        {
          label: 'Smart Generate',
          click: () => { BrowserWindow.getFocusedWindow()?.webContents.send('menu-timetable', 'smart-generate') },
        },
        {
          label: 'View Timetables',
          click: () => { BrowserWindow.getFocusedWindow()?.webContents.send('menu-timetable', 'view-timetables') },
        },
        {
          label: 'Manage Classes',
          click: () => { BrowserWindow.getFocusedWindow()?.webContents.send('menu-timetable', 'manage-classes') },
        },
        { type: 'separator' },
        {
          label: 'Timetable Editor',
          click: () => { BrowserWindow.getFocusedWindow()?.webContents.send('menu-timetable', 'timetable-editor') },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Shikola Timetable Creator',
          click: () => { BrowserWindow.getFocusedWindow()?.webContents.send('menu-help', 'about') },
        },
        {
          label: 'Documentation',
          click: () => { BrowserWindow.getFocusedWindow()?.webContents.send('menu-help', 'docs') },
        },
        { type: 'separator' },
        {
          label: 'Check for Updates',
          click: () => { BrowserWindow.getFocusedWindow()?.webContents.send('menu-help', 'check-updates') },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'Shikola Timetable Creator',
    icon: path.join(__dirname, '..', 'public', 'logo.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  win.setMenuBarVisibility(true)

  if (!isDev) {
    win.webContents.on('context-menu', (e) => {
      e.preventDefault()
    })
  }

  // Catch renderer process crashes and unresponsive states
  win.webContents.on('render-process-gone', (_e, details) => {
    telemetry.sendCrashReport({
      type: 'render-process-gone',
      message: `Renderer process gone: ${details.reason}`,
      stack: JSON.stringify(details),
      timestamp: new Date().toISOString(),
    })
  })

  win.on('unresponsive', () => {
    telemetry.sendCrashReport({
      type: 'unresponsive',
      message: 'Window became unresponsive',
      timestamp: new Date().toISOString(),
    })
  })
}

// Telemetry IPC handlers
ipcMain.handle('telemetry:register', async (_event, schoolData) => {
  try {
    const result = await telemetry.sendRegistration(schoolData, true)
    return result
  } catch (err) {
    console.error('[Telemetry] Registration failed:', err.message)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('telemetry:track', async (_event, { eventName, eventData }) => {
  try {
    const result = await telemetry.sendAnalyticsEvent(eventName, eventData)
    return result
  } catch (err) {
    console.error('[Telemetry] Analytics failed:', err.message)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('telemetry:crash', async (_event, errorData) => {
  try {
    const result = await telemetry.sendCrashReport(errorData)
    return result
  } catch (err) {
    console.error('[Telemetry] Crash report failed:', err.message)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('telemetry:launch', async () => {
  try {
    const result = await telemetry.sendAppLaunch()
    return result
  } catch (err) {
    console.error('[Telemetry] Launch event failed:', err.message)
    return { success: false, error: err.message }
  }
})

// Get install/update info for renderer
ipcMain.handle('app:getInstallInfo', async () => {
  return detectInstallInfo()
})

// Check for updates via GitHub Releases API (main process avoids CORS issues)
ipcMain.handle('app:checkForUpdates', async () => {
  try {
    const https = require('https')
    const options = {
      hostname: 'api.github.com',
      path: '/repos/sepiocorp/shikola.timetable.app/releases/latest',
      headers: {
        'User-Agent': 'Shikola-Timetable-Creator',
        'Accept': 'application/vnd.github+json',
      },
    }
    const data = await new Promise((resolve, reject) => {
      https.get(options, (res) => {
        let body = ''
        res.on('data', (chunk) => { body += chunk })
        res.on('end', () => {
          try { resolve(JSON.parse(body)) } catch { resolve(null) }
        })
      }).on('error', reject)
    })
    if (data && data.tag_name) {
      return { success: true, tag_name: data.tag_name, html_url: data.html_url, body: data.body }
    }
    return { success: false, error: 'Could not retrieve update information.' }
  } catch (err) {
    console.error('[Update] Check failed:', err.message)
    return { success: false, error: 'Failed to check for updates. Please check your internet connection.' }
  }
})

// Read telemetry consent from installer-written file
ipcMain.handle('telemetry:getConsent', async () => {
  try {
    const exeDir = path.dirname(app.getPath('exe'))
    const consentFile = path.join(exeDir, 'telemetry-consent.json')
    if (fs.existsSync(consentFile)) {
      const data = fs.readFileSync(consentFile, 'utf-8')
      return JSON.parse(data)
    }
  } catch (err) {
    console.error('[Telemetry] Failed to read consent file:', err.message)
  }
  return null
})

// Detect if Shikola Management System is installed
ipcMain.handle('app:checkShikolaManagementInstalled', async () => {
  try {
    const commonPaths = [
      path.join('C:', 'Program Files', 'Shikola', 'Shikola Management System'),
      path.join('C:', 'Program Files (x86)', 'Shikola', 'Shikola Management System'),
      path.join('C:', 'Program Files', 'Shikola Management System'),
      path.join('C:', 'Program Files (x86)', 'Shikola Management System'),
      path.join(app.getPath('home'), 'AppData', 'Local', 'Programs', 'Shikola Management System'),
      path.join(app.getPath('home'), 'AppData', 'Roaming', 'Shikola Management System'),
    ]

    for (const checkPath of commonPaths) {
      if (fs.existsSync(checkPath)) {
        return { installed: true, path: checkPath }
      }
    }

    // Also check for executable in common locations
    const exePaths = [
      path.join('C:', 'Program Files', 'Shikola', 'Shikola Management System', 'Shikola Management System.exe'),
      path.join('C:', 'Program Files (x86)', 'Shikola', 'Shikola Management System', 'Shikola Management System.exe'),
    ]

    for (const exePath of exePaths) {
      if (fs.existsSync(exePath)) {
        return { installed: true, path: path.dirname(exePath) }
      }
    }

    return { installed: false }
  } catch (err) {
    console.error('[App] Failed to check Shikola Management System installation:', err.message)
    return { installed: false }
  }
})

// --- License key validation (offline, embedded keys) ---

function getLicenseCachePath() {
  return path.join(app.getPath('userData'), 'license-cache.json')
}

function readLicenseCache() {
  try {
    const cachePath = getLicenseCachePath()
    if (fs.existsSync(cachePath)) {
      return JSON.parse(fs.readFileSync(cachePath, 'utf-8'))
    }
  } catch (err) {
    console.error('[License] Failed to read cache:', err.message)
  }
  return null
}

function writeLicenseCache(cache) {
  try {
    fs.writeFileSync(getLicenseCachePath(), JSON.stringify(cache, null, 2))
  } catch (err) {
    console.error('[License] Failed to write cache:', err.message)
  }
}

function clearLicenseCache() {
  try {
    const cachePath = getLicenseCachePath()
    if (fs.existsSync(cachePath)) {
      fs.unlinkSync(cachePath)
    }
  } catch (err) {
    console.error('[License] Failed to clear cache:', err.message)
  }
}

// Fuzzy school name matching — allows minor variations like "Kabanana Primary"
// vs "Kabanana Primary School" while still preventing cross-school misuse
function normalizeSchoolName(name) {
  if (!name) return ''
  return name
    .toLowerCase()
    .trim()
    .replace(/\bschool\b/g, '')
    .replace(/\bprimary\b/g, '')
    .replace(/\bsecondary\b/g, '')
    .replace(/\bcombined\b/g, '')
    .replace(/\bthe\b/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshteinDistance(a, b) {
  const m = a.length, n = b.length
  if (m === 0) return n
  if (n === 0) return m
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[m][n]
}

function isSchoolNameSimilar(configured, license) {
  if (!configured || !license) return true
  // Exact match
  if (configured === license) return true
  // Normalized match (ignores "school", "primary", "secondary", punctuation, etc.)
  const normConfigured = normalizeSchoolName(configured)
  const normLicense = normalizeSchoolName(license)
  if (normConfigured === normLicense) return true
  // Substring containment (e.g., "kabanana" contains / is contained in "kabanana")
  if (normConfigured && normLicense) {
    if (normConfigured.includes(normLicense) || normLicense.includes(normConfigured)) return true
  }
  // Levenshtein similarity ratio >= 0.6 (allows typos and minor word order differences)
  const maxLen = Math.max(normConfigured.length, normLicense.length)
  if (maxLen === 0) return true
  const distance = levenshteinDistance(normConfigured, normLicense)
  const similarity = 1 - distance / maxLen
  return similarity >= 0.6
}

ipcMain.handle('license:validate', async (_event, licenseKey, schoolName) => {
  if (!licenseKey || typeof licenseKey !== 'string') {
    return { valid: false, error: 'No license key provided.' }
  }

  const trimmedKey = licenseKey.trim()

  // Validate against embedded license list
  const result = validateEmbeddedLicense(trimmedKey)

  if (result.valid) {
    // Verify school name is similar — prevents School A from using School B's license
    // while allowing minor variations (e.g., "Kabanana Primary" vs "Kabanana Primary School")
    const configuredSchool = (schoolName || '').trim()
    const licenseSchool = (result.schoolName || '').trim()
    if (configuredSchool && licenseSchool && !isSchoolNameSimilar(configuredSchool.toLowerCase(), licenseSchool.toLowerCase())) {
      // Don't mark as activated since validation failed at school-name check
      activatedKeys.delete(trimmedKey)
      return {
        valid: false,
        error: `This license key is for "${result.schoolName}", but your school is configured as "${schoolName.trim()}". A license key can only be used by the school it was issued for. Please update your school name in Settings → School → Info to match, or contact Sepio Corp if you believe this is an error.`,
      }
    }

    const cacheEntry = {
      key: result.key,
      valid: true,
      validatedAt: result.validatedAt,
      plan: result.plan,
      expiresAt: result.expiresAt,
      schoolName: result.schoolName,
    }
    writeLicenseCache(cacheEntry)
    console.log(`[License] Validated successfully: ${result.schoolName}`)
    return { valid: true, ...cacheEntry, schoolNameMatched: !configuredSchool || isSchoolNameSimilar(configuredSchool.toLowerCase(), licenseSchool.toLowerCase()) }
  }

  // Invalid key — clear any stale cache
  clearLicenseCache()
  return { valid: false, error: result.error }
})

ipcMain.handle('license:getCached', async () => {
  const cached = readLicenseCache()
  if (!cached) return { valid: false }

  // Re-mark this key as activated (it's already been used on this machine)
  // This prevents it from being entered again on this same machine
  activatedKeys.add(cached.key)

  // Re-validate against embedded list to check expiry
  const result = validateEmbeddedLicense(cached.key)
  if (result.valid) {
    return { valid: true, ...cached, plan: result.plan, expiresAt: result.expiresAt, schoolName: result.schoolName }
  }

  // If the key was blocked because it's already activated, that's expected for a cached key
  // Check if the key exists in the embedded list and is not expired
  const { LICENSES } = require('./licenses')
  const entry = LICENSES.find(l => l.key === cached.key)
  if (entry) {
    const expiry = new Date(entry.expiresAt)
    if (expiry >= new Date()) {
      // Key is still valid — return cached info
      return { valid: true, ...cached, plan: entry.plan, expiresAt: entry.expiresAt, schoolName: entry.schoolName }
    }
  }

  // Cached key is no longer valid (expired or removed)
  clearLicenseCache()
  return { valid: false }
})

ipcMain.handle('license:clear', async () => {
  const cached = readLicenseCache()
  if (cached?.key) {
    activatedKeys.delete(cached.key)
  }
  clearLicenseCache()
  return { success: true }
})

// --- Auto-updater IPC handlers ---
ipcMain.handle('update:installNow', () => {
  if (autoUpdater) {
    if (autoInstallTimeout) {
      clearTimeout(autoInstallTimeout)
      autoInstallTimeout = null
    }
    autoUpdater.quitAndInstall(false, true)
  }
})

ipcMain.handle('update:downloadUpdate', async () => {
  if (!autoUpdater) return { success: false, error: 'Auto-updater not available' }
  try {
    await autoUpdater.checkForUpdates()
    return { success: true }
  } catch (err) {
    console.error('[AutoUpdater] Download trigger failed:', err.message)
    return { success: false, error: err.message }
  }
})

ipcMain.handle('update:installOnQuit', () => {
  if (autoUpdater) {
    if (autoInstallTimeout) {
      clearTimeout(autoInstallTimeout)
      autoInstallTimeout = null
    }
    autoUpdater.autoInstallOnAppQuit = true
  }
})

ipcMain.handle('update:setConfig', (_event, config) => {
  saveUpdateConfig(config)
})

ipcMain.handle('update:getConfig', async () => {
  return loadUpdateConfig()
})

// --- Auto-updater event forwarding to renderer ---
function setupAutoUpdater() {
  if (!autoUpdater) return

  autoUpdater.on('update-available', (info) => {
    console.log('[AutoUpdater] Update available:', info.version)
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('update:available', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate,
      })
    })
  })

  autoUpdater.on('update-not-available', () => {
    console.log('[AutoUpdater] No updates available')
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('update:not-available')
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('[AutoUpdater] Update downloaded:', info.version)
    if (updateConfig.autoInstall) {
      console.log('[AutoUpdater] Auto-install enabled; will restart in 60 seconds')
      BrowserWindow.getAllWindows().forEach((win) => {
        win.webContents.send('update:auto-install-pending', {
          version: info.version,
          releaseNotes: info.releaseNotes,
          secondsRemaining: 60,
        })
      })
      if (autoInstallTimeout) clearTimeout(autoInstallTimeout)
      autoInstallTimeout = setTimeout(() => {
        console.log('[AutoUpdater] Auto-installing update now')
        autoUpdater.quitAndInstall(false, true)
      }, 60000)
      return
    }
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('update:downloaded', {
        version: info.version,
        releaseNotes: info.releaseNotes,
      })
    })
  })

  autoUpdater.on('error', (err) => {
    console.error('[AutoUpdater] Error:', err.message)
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('update:error', { message: err.message })
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send('update:progress', {
        percent: Math.round(progress.percent),
        transferred: progress.transferred,
        total: progress.total,
      })
    })
  })
}

app.whenReady().then(() => {
  detectInstallInfo()
  buildMenu()
  createWindow()

  // Start auto-update checks (production only)
  if (autoUpdater) {
    loadUpdateConfig()
    applyUpdateConfig()
    setupAutoUpdater()

    const scheduleUpdateCheck = () => {
      if (!updateConfig.enabled) {
        console.log('[AutoUpdater] Auto-update disabled; skipping scheduled check')
        return
      }
      console.log('[AutoUpdater] Checking for updates...')
      autoUpdater.checkForUpdates().catch((err) => {
        console.error('[AutoUpdater] Check failed:', err.message)
      })
    }

    // Initial check shortly after startup
    setTimeout(scheduleUpdateCheck, 5000)

    // Recurring background checks while app is running
    if (updateCheckInterval) clearInterval(updateCheckInterval)
    updateCheckInterval = setInterval(() => {
      scheduleUpdateCheck()
    }, Math.max(15, updateConfig.checkIntervalMinutes || 60) * 60 * 1000)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
