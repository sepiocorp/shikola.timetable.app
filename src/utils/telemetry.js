// Telemetry utility for the renderer process
// All calls are gated by user consent stored in AppContext

export function trackEvent(eventName, eventData) {
  if (window.electronAPI?.telemetry?.trackEvent) {
    window.electronAPI.telemetry.trackEvent(eventName, eventData).catch(() => {})
  }
}

export function reportCrash(errorData) {
  if (window.electronAPI?.telemetry?.reportCrash) {
    window.electronAPI.telemetry.reportCrash(errorData).catch(() => {})
  }
}

export function sendRegistration(schoolData) {
  if (window.electronAPI?.telemetry?.register) {
    return window.electronAPI.telemetry.register(schoolData)
  }
  return Promise.resolve({ success: false, error: 'Telemetry API not available' })
}

export function sendLaunchEvent() {
  if (window.electronAPI?.telemetry?.onLaunch) {
    window.electronAPI.telemetry.onLaunch().catch(() => {})
  }
}

export function setupGlobalErrorHandler(enabled) {
  if (!enabled) return

  window.addEventListener('error', (event) => {
    reportCrash({
      type: 'javascript-error',
      message: event.message,
      stack: event.error?.stack || '',
      url: event.filename || '',
      line: event.lineno || 0,
      column: event.colno || 0,
      timestamp: new Date().toISOString(),
    })
  })

  window.addEventListener('unhandledrejection', (event) => {
    reportCrash({
      type: 'unhandled-promise-rejection',
      message: event.reason?.message || String(event.reason),
      stack: event.reason?.stack || '',
      timestamp: new Date().toISOString(),
    })
  })
}
