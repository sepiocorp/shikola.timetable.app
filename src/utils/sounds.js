let audioCtx = null
let soundEnabled = true

export function setSoundEnabled(enabled) {
  soundEnabled = enabled
}

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioCtx
}

function playTone(freq, duration, type = 'sine', volume = 0.15) {
  if (!soundEnabled) return
  const ctx = getCtx()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(volume, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + duration)
}

export const sounds = {
  click: () => playTone(800, 0.05, 'sine', 0.08),
  add: () => {
    playTone(523, 0.08, 'sine', 0.12)
    setTimeout(() => playTone(659, 0.08, 'sine', 0.12), 60)
  },
  delete: () => {
    playTone(400, 0.08, 'sawtooth', 0.1)
    setTimeout(() => playTone(300, 0.1, 'sawtooth', 0.1), 60)
  },
  success: () => {
    playTone(523, 0.1, 'sine', 0.12)
    setTimeout(() => playTone(659, 0.1, 'sine', 0.12), 80)
    setTimeout(() => playTone(784, 0.15, 'sine', 0.12), 160)
  },
  error: () => {
    playTone(200, 0.15, 'square', 0.1)
    setTimeout(() => playTone(150, 0.2, 'square', 0.1), 100)
  },
  navigate: () => playTone(600, 0.04, 'sine', 0.06),
  export: () => {
    playTone(659, 0.08, 'sine', 0.1)
    setTimeout(() => playTone(784, 0.08, 'sine', 0.1), 60)
    setTimeout(() => playTone(988, 0.12, 'sine', 0.1), 120)
  },
  save: () => playTone(700, 0.06, 'sine', 0.1),
  conflict: () => {
    playTone(300, 0.1, 'square', 0.08)
    setTimeout(() => playTone(250, 0.15, 'square', 0.08), 80)
  },
  generate: () => {
    playTone(523, 0.06, 'sine', 0.1)
    setTimeout(() => playTone(659, 0.06, 'sine', 0.1), 50)
    setTimeout(() => playTone(784, 0.06, 'sine', 0.1), 100)
    setTimeout(() => playTone(1047, 0.15, 'sine', 0.12), 150)
  },
}
