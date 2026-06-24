const { app, BrowserWindow, Menu, ipcMain, crashReporter } = require('electron')
const path = require('path')
const fs = require('fs')
const telemetry = require('./telemetry')

const isDev = process.env.VITE_DEV === 'true'

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

app.whenReady().then(() => {
  buildMenu()
  createWindow()

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
