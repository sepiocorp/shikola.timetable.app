function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return { r, g, b }
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const h = Math.round(Math.max(0, Math.min(255, x))).toString(16)
    return h.length === 1 ? '0' + h : h
  }).join('')
}

function mix(hex, withHex, weight) {
  const c1 = hexToRgb(hex)
  const c2 = hexToRgb(withHex)
  return rgbToHex(
    c1.r * (1 - weight) + c2.r * weight,
    c1.g * (1 - weight) + c2.g * weight,
    c1.b * (1 - weight) + c2.b * weight,
  )
}

export function generateColorScale(primary, accent) {
  return {
    50: mix(primary, '#ffffff', 0.95),
    100: mix(primary, '#ffffff', 0.90),
    200: mix(primary, '#ffffff', 0.75),
    300: mix(primary, '#ffffff', 0.60),
    400: mix(accent, '#ffffff', 0.20),
    500: accent,
    600: primary,
    700: mix(primary, '#000000', 0.15),
    800: mix(primary, '#000000', 0.30),
    900: mix(primary, '#000000', 0.45),
  }
}

export function applyColorScale(primary, accent) {
  const scale = generateColorScale(primary, accent)
  const root = document.documentElement
  Object.entries(scale).forEach(([shade, color]) => {
    root.style.setProperty(`--brand-${shade}`, color)
  })
}
