const MOODS = {
  home: [220, 277],
  homePoor: [196, 246],
  homeRich: [247, 311],
  school: [294, 370],
  schoolMid: [277, 349],
  schoolNight: [165, 220],
  campus: [262, 330],
  work: [233, 294],
  hospital: [185, 233],
  split: [174, 220],
  wedding: [294, 392],
  apartment: [247, 311],
  park: [233, 349],
  shore: [146, 196],
}

export function createAudio() {
  let ctx = null
  let master = null
  let tones = []
  let muted = false
  let pending = 'home'
  let lastStep = 0

  function ensure() {
    if (!ctx) {
      const Context = window.AudioContext || window.webkitAudioContext
      if (!Context) return null
      ctx = new Context()
      master = ctx.createGain()
      master.gain.value = muted ? 0 : 0.8
      master.connect(ctx.destination)
    }
    if (ctx.state === 'suspended') ctx.resume()
    return ctx
  }

  function clearTones() {
    for (const tone of tones) {
      try {
        tone.stop()
      } catch {
        /* already stopped */
      }
    }
    tones = []
  }

  function setMood(name) {
    pending = name || 'home'
    if (!ctx) return
    clearTones()
    const pair = MOODS[pending] || MOODS.home
    pair.forEach((freq, index) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()
      osc.type = 'sine'
      osc.frequency.value = freq
      filter.type = 'lowpass'
      filter.frequency.value = 480
      gain.gain.value = index === 0 ? 0.018 : 0.01
      osc.connect(filter)
      filter.connect(gain)
      gain.connect(master)
      osc.start()
      tones.push(osc)
    })
  }

  function blip() {
    if (!ensure() || muted) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = 520
    gain.gain.setValueAtTime(0.03, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
    osc.connect(gain)
    gain.connect(master)
    osc.start()
    osc.stop(ctx.currentTime + 0.13)
  }

  function step(now) {
    if (!ctx || muted || now - lastStep < 360) return
    lastStep = now
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 90
    gain.gain.setValueAtTime(0.02, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
    osc.connect(gain)
    gain.connect(master)
    osc.start()
    osc.stop(ctx.currentTime + 0.06)
  }

  function setMuted(next) {
    muted = next
    if (master) master.gain.value = muted ? 0 : 0.8
  }

  function unlock() {
    if (ensure()) setMood(pending)
  }

  return { unlock, setMood, blip, step, setMuted, get muted() { return muted } }
}
