const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  appName: 'Shikola Timetable Creator',
  author: 'Sepio Corp',
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-timetable', (_e, action) => callback('timetable', action))
    ipcRenderer.on('menu-help', (_e, action) => callback('help', action))
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
