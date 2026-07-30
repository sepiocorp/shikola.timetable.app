const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  appName: 'Shikola Timetable Creator',
  author: 'Sepio Corp',
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-timetable', (_e, action) => callback('timetable', action))
    ipcRenderer.on('menu-help', (_e, action) => callback('help', action))
  },
  getInstallInfo: () => ipcRenderer.invoke('app:getInstallInfo'),
  checkForUpdates: () => ipcRenderer.invoke('app:checkForUpdates'),
  checkShikolaManagementInstalled: () => ipcRenderer.invoke('app:checkShikolaManagementInstalled'),

  // License key APIs
  validateLicenseKey: (key, schoolName) => ipcRenderer.invoke('license:validate', key, schoolName),
  getCachedLicense: () => ipcRenderer.invoke('license:getCached'),
  clearLicense: () => ipcRenderer.invoke('license:clear'),

  // Auto-update APIs
  updater: {
    installNow: () => ipcRenderer.invoke('update:installNow'),
    installOnQuit: () => ipcRenderer.invoke('update:installOnQuit'),
    downloadUpdate: () => ipcRenderer.invoke('update:downloadUpdate'),
    getConfig: () => ipcRenderer.invoke('update:getConfig'),
    setConfig: (config) => ipcRenderer.invoke('update:setConfig', config),
    onAvailable: (cb) => ipcRenderer.on('update:available', (_e, info) => cb(info)),
    onNotAvailable: (cb) => ipcRenderer.on('update:not-available', () => cb()),
    onDownloaded: (cb) => ipcRenderer.on('update:downloaded', (_e, info) => cb(info)),
    onAutoInstallPending: (cb) => ipcRenderer.on('update:auto-install-pending', (_e, info) => cb(info)),
    onProgress: (cb) => ipcRenderer.on('update:progress', (_e, progress) => cb(progress)),
    onError: (cb) => ipcRenderer.on('update:error', (_e, err) => cb(err)),
  },

  // Telemetry APIs - all gated by user consent in the UI
  telemetry: {
    register: (schoolData) => ipcRenderer.invoke('telemetry:register', schoolData),
    trackEvent: (eventName, eventData) => ipcRenderer.invoke('telemetry:track', { eventName, eventData }),
    reportCrash: (errorData) => ipcRenderer.invoke('telemetry:crash', errorData),
    onLaunch: () => ipcRenderer.invoke('telemetry:launch'),
    getConsent: () => ipcRenderer.invoke('telemetry:getConsent'),
  },
})
