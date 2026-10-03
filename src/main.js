import { parseSave } from './game/save.js'
import { achievementName } from './game/achievements.js'
import { chapterAge, prepareChapter } from './game/content.js'
import { isBlocked } from './game/layout.js'
import { createAudio } from './game/audio.js'
import {
  activeBeat,
  advance,
  canExit,
  choose,
  createGame,
  describeOrigin,
  getChapterView,
  randomInput,
} from './game/sim.js'
import { FLOW } from './game/content.js'
import {
  CREATE_STEPS,
  advanceHTML,
  choiceHTML,
  createHTML,
  epitaphHTML,
  hudHTML,
  intertitleHTML,
  journalHTML,
  playtestHTML,
  resultHTML,
  titleHTML,
} from './ui.js'
import { SHIRTS, createWorld, loadLifeModels } from './game/world.js'

const SAVE_KEY = 'ascent.save.v1'
const ARCHIVE_KEY = 'ascent.archive.v1'
const SETTINGS_KEY = 'ascent.settings.v1'
const INTERACT = 2.6

const screen = document.querySelector('#screen')
const hud = document.querySelector('#hud')
const modal = document.querySelector('#modal')
const toasts = document.querySelector('#toasts')
const prompt = document.querySelector('#prompt')
const hint = document.querySelector('#hint')
const fade = document.querySelector('#fade')
const canvas = document.querySelector('#view')
const act = document.querySelector('#act')

const settings = loadSettings()
const audio = createAudio()
audio.setMuted(settings.muted)

const runtime = {
  world: null,
  webgl: true,
  mode: 'title',
  textMode: false,
  state: null,
  draft: null,
  view: null,
  colliders: [],
  yaw: 0,
  locked: false,
  choice: null,
  resultOpen: false,
  journal: false,
  joy: { x: 0, z: 0 },
  keys: new Set(),
  snap: true,
  hudSig: '',
  promptText: '',
  reduced: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  gamepadEdge: false,
  saveClock: 0,
  moving: false,
  archived: false,
}

screen.classList.remove('hidden')
screen.innerHTML = '<section class="panel"><p class="kicker">浮生</p><h1>正在把生活布置好</h1><p>房间和人物第一次打开会稍等一会儿。</p></section>'

let last = performance.now()

const modelPack = new URLSearchParams(window.location.search).get('pack') === 'kenney' ? 'kenney' : 'quaternius'
loadLifeModels(modelPack)
  .catch((error) => {
    console.warn(error)
    return null
  })
  .then((models) => {
    try {
      runtime.world = createWorld(canvas, models)
    } catch (error) {
      runtime.webgl = false
      runtime.textMode = true
      document.body.classList.add('text-mode')
    }
    bindInput()
    showTitle()
    requestAnimationFrame(frame)
  })

function frame(now) {
  const dt = Math.min(0.033, (now - last) / 1000)
  last = now
  if (runtime.mode === 'title') runtime.yaw += dt * 0.12
  if (runtime.mode === 'play' && runtime.state && !runtime.textMode && !runtime.locked) move(dt)
  updateCamera(dt)
  updateMarker(now)
  if (runtime.moving) audio.step(now)
  if (runtime.world) {
    const running = runtime.keys.has('ShiftLeft') || runtime.keys.has('ShiftRight')
    runtime.world.tick?.(dt, runtime.moving, running)
    runtime.world.renderer.render(runtime.world.scene, runtime.world.camera)
  }
  if (runtime.mode === 'play' && runtime.state && !runtime.state.finished) {
    runtime.saveClock += dt
    if (runtime.saveClock > 2.5) {
      runtime.saveClock = 0
      persist()
    }
  }
  requestAnimationFrame(frame)
}

function move(dt) {
  const world = runtime.world
  let forward = 0
  let strafe = 0
  if (runtime.keys.has('KeyW') || runtime.keys.has('ArrowUp')) forward += 1
  if (runtime.keys.has('KeyS') || runtime.keys.has('ArrowDown')) forward -= 1
  if (runtime.keys.has('KeyD') || runtime.keys.has('ArrowRight')) strafe += 1
  if (runtime.keys.has('KeyA') || runtime.keys.has('ArrowLeft')) strafe -= 1
  forward += runtime.joy.z
  strafe += runtime.joy.x
  const pad = readGamepad()
  if (pad) {
    forward += pad.forward
    strafe += pad.strafe
    runtime.yaw -= pad.look * dt * 1.8
    if (pad.interact && !runtime.gamepadEdge) interact()
    runtime.gamepadEdge = pad.interact
  }
  if (runtime.keys.has('KeyQ')) runtime.yaw += dt * 1.5
  if (runtime.keys.has('KeyR')) runtime.yaw -= dt * 1.5
  const length = Math.hypot(forward, strafe)
  runtime.moving = length > 0.08
  if (!runtime.moving) {
    updatePrompt()
    return
  }
  const scale = runtime.view?.playerScale || 1
  const speed = (runtime.keys.has('ShiftLeft') || runtime.keys.has('ShiftRight') || pad?.run ? 5.5 : 3.5) * (0.82 + scale * 0.18)
  const nx = forward / length
  const nz = strafe / length
  const sin = Math.sin(runtime.yaw)
  const cos = Math.cos(runtime.yaw)
  const dx = (-sin * nx + cos * nz) * speed * dt
  const dz = (-cos * nx - sin * nz) * speed * dt
  const player = world.player.position
  if (!isBlocked(runtime.colliders, player.x + dx, player.z)) player.x += dx
  if (!isBlocked(runtime.colliders, player.x, player.z + dz)) player.z += dz
  if (!runtime.moved) {
    runtime.moved = true
    hint.classList.add('hidden')
  }
  updatePrompt()
}

function readGamepad() {
  const pads = navigator.getGamepads?.() || []
  const pad = pads[0]
  if (!pad) return null
  const dead = 0.18
  const axis = (value) => (Math.abs(value) < dead ? 0 : value)
  return {
    strafe: axis(pad.axes[0] || 0),
    forward: -axis(pad.axes[1] || 0),
    look: axis(pad.axes[2] || 0),
    interact: !!pad.buttons[0]?.pressed,
    run: !!pad.buttons[7]?.pressed,
  }
}

function updateCamera(dt) {
  const world = runtime.world
  if (!world) return
  const player = world.player
  player.rotation.y = runtime.yaw
  const fit = player.userData.fitScale || 1
  player.scale.setScalar(fit)
  const height = player.userData.height || 1.7
  const eye = height * 0.86
  let dist = 2.7 + height * 0.45
  const floor = world.floor
  const sin = Math.sin(runtime.yaw)
  const cos = Math.cos(runtime.yaw)
  if (floor) {
    for (let step = 0; step < 7; step += 1) {
      const x = player.position.x + sin * dist
      const z = player.position.z + cos * dist
      const inside =
        x > floor.minX + 0.3 && x < floor.maxX - 0.3 && z > floor.minZ + 0.3 && z < floor.maxZ - 0.3
      const blocked = (runtime.colliders || []).some(
        (block) =>
          block.kind !== 'wall' &&
          x > block.minX - 0.15 &&
          x < block.maxX + 0.15 &&
          z > block.minZ - 0.15 &&
          z < block.maxZ + 0.15,
      )
      if (inside && !blocked) break
      dist *= 0.72
    }
  }
  const bob = runtime.mode === 'play' && runtime.moving && !runtime.reduced ? Math.sin(performance.now() / 150) * 0.02 : 0
  player.position.y = bob
  const desiredX = player.position.x + sin * dist
  const desiredY = eye + Math.min(0.42, dist * 0.2)
  const desiredZ = player.position.z + cos * dist
  const blend = runtime.snap || runtime.reduced ? 1 : 1 - Math.pow(0.0015, dt)
  world.camera.position.x += (desiredX - world.camera.position.x) * blend
  world.camera.position.y += (desiredY - world.camera.position.y) * blend
  world.camera.position.z += (desiredZ - world.camera.position.z) * blend
  world.camera.lookAt(player.position.x, eye * 0.9, player.position.z)
  world.shadow.position.set(player.position.x, 0.03, player.position.z)
  world.shadow.scale.setScalar(Math.max(0.8, height / 1.7))
  runtime.snap = false
}

function updateMarker(now) {
  const world = runtime.world
  if (!world) return
  const target = runtime.mode === 'play' && !runtime.textMode ? currentTarget() : null
  world.marker.visible = !!target
  world.beads.visible = !!target
  if (!target) return
  world.marker.position.set(target.x, 0, target.z)
  const gem = world.marker.getObjectByName('gem')
  if (gem) gem.position.y = 1.15 + (runtime.reduced ? 0 : Math.sin(now / 280) * 0.07)
  const px = world.player.position.x
  const pz = world.player.position.z
  world.beads.children.forEach((bead, index) => {
    const t = (index + 1) / (world.beads.children.length + 1)
    bead.position.set(px + (target.x - px) * t, 0.12, pz + (target.z - pz) * t)
  })
}

function currentTarget() {
  if (!runtime.state) return null
  const beat = activeBeat(runtime.state)
  if (beat) return { x: beat.x, z: beat.z, label: beat.goal, type: 'beat' }
  if (canExit(runtime.state) && runtime.view?.exit) {
    return { x: runtime.view.exit.x, z: runtime.view.exit.z, label: runtime.view.exit.label, type: 'exit' }
  }
  return null
}

function updatePrompt() {
  const target = currentTarget()
  let text = ''
  if (target && runtime.world) {
    const player = runtime.world.player.position
    const distance = Math.hypot(player.x - target.x, player.z - target.z)
    if (distance <= INTERACT) text = `E  ·  ${target.label}`
  }
  if (text !== runtime.promptText) {
    runtime.promptText = text
    prompt.textContent = text
    act.textContent = text ? '查看' : '查看'
  }
}

function interact() {
  if (runtime.mode !== 'play' || runtime.locked || runtime.textMode || !runtime.state || !runtime.world) return
  const target = currentTarget()
  if (!target) return
  const player = runtime.world.player.position
  if (Math.hypot(player.x - target.x, player.z - target.z) > INTERACT) return
  if (target.type === 'beat') openChoice(activeBeat(runtime.state))
  else goNext()
}

function bindInput() {
  window.addEventListener('keydown', (event) => {
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return
    if (event.repeat) return
    runtime.keys.add(event.code)
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code) && modal.classList.contains('hidden')) {
      event.preventDefault()
    }
    if (event.code === 'KeyE' || ((event.code === 'Enter' || event.code === 'Space') && modal.classList.contains('hidden'))) interact()
    if (event.code === 'KeyJ' && runtime.mode === 'play') openJournal()
    if (event.code === 'Escape') onEscape()
    if (/^Digit[1-9]$/.test(event.code)) onDigit(Number(event.code.slice(5)))
    if (import.meta.env.DEV && event.shiftKey && event.code === 'KeyL') openPlaytest()
  })
  window.addEventListener('keyup', (event) => runtime.keys.delete(event.code))
  window.addEventListener('blur', () => {
    runtime.keys.clear()
    runtime.joy = { x: 0, z: 0 }
    runtime.moving = false
    persist()
  })
  window.addEventListener('resize', () => runtime.world?.resize())
  document.querySelector('#ui').addEventListener('click', onAction)
  document.querySelector('#ui').addEventListener('input', (event) => {
    if (event.target.id === 'name-input' && runtime.draft) runtime.draft.name = event.target.value
  })
  act.addEventListener('click', () => {
    audio.unlock()
    interact()
  })
  bindStick()
  bindDrag()
}

function onDigit(number) {
  if (runtime.mode === 'create' && runtime.draft && runtime.draft.step < CREATE_STEPS) {
    const button = screen.querySelectorAll('[data-act="option"]')[number - 1]
    button?.click()
    return
  }
  if (runtime.choice && !runtime.resultOpen && runtime.choice.choices[number - 1]) pickChoice(number - 1)
}

function onEscape() {
  if (runtime.resultOpen) {
    afterResult()
    return
  }
  if (runtime.textMode && runtime.choice) return
  if (!modal.classList.contains('hidden')) closeModal()
}

function onAction(event) {
  const button = event.target.closest('[data-act]')
  if (!button || button.disabled) return
  audio.unlock()
  const actName = button.dataset.act
  if (actName === 'new') beginCreate(false)
  else if (actName === 'text') beginCreate(true)
  else if (actName === 'quick') quickStart()
  else if (actName === 'continue') continueGame()
  else if (actName === 'option') chooseOption(button.dataset.key, button.dataset.id, button.dataset.multi === '1')
  else if (actName === 'next') nextStep()
  else if (actName === 'back') previousStep()
  else if (actName === 'confirm') confirmLife()
  else if (actName === 'enter') enterScene()
  else if (actName === 'pick') pickChoice(Number(button.dataset.index))
  else if (actName === 'close-result') afterResult()
  else if (actName === 'advance') goNext()
  else if (actName === 'journal') openJournal()
  else if (actName === 'mute') toggleMute()
  else if (actName === 'close') closeModal()
  else if (actName === 'again') showTitle()
  else if (actName === 'jump') jumpTo(button.dataset.id)
}

function chooseOption(key, id, multi) {
  const draft = runtime.draft
  if (multi) {
    const has = draft.skills.includes(id)
    if (has) draft.skills = draft.skills.filter((skill) => skill !== id)
    else if (draft.skills.length < 2) draft.skills = [...draft.skills, id]
    else {
      toast('先取消一个，再选第二个本事')
      return
    }
  } else draft[key] = id
  renderCreate()
}

function beginCreate(textMode) {
  runtime.textMode = textMode || !runtime.webgl
  document.body.classList.toggle('text-mode', runtime.textMode || !runtime.webgl)
  runtime.draft = {
    step: 0,
    country: 'cn',
    birthplace: 'town',
    gender: 'f',
    family: 'wage',
    skills: [],
    vocation: 'undecided',
    name: '',
    seed: (Math.random() * 1e9) >>> 0,
    preview: null,
  }
  runtime.mode = 'create'
  hud.classList.add('hidden')
  closeModal()
  renderCreate()
}

function renderCreate() {
  if (runtime.draft.step === CREATE_STEPS) {
    runtime.draft.preview = describeOrigin(draftInput())
  }
  runtime.mode = 'create'
  screen.classList.remove('hidden')
  screen.innerHTML = createHTML(runtime.draft)
  screen.querySelector('button')?.focus()
}

function nextStep() {
  const draft = runtime.draft
  if (draft.step === 4 && draft.skills.length !== 2) {
    toast('选两样本事')
    return
  }
  draft.preview = null
  draft.step = Math.min(CREATE_STEPS, draft.step + 1)
  renderCreate()
}

function previousStep() {
  runtime.draft.preview = null
  runtime.draft.step = Math.max(0, runtime.draft.step - 1)
  renderCreate()
}

function draftInput() {
  const draft = runtime.draft
  return {
    country: draft.country,
    birthplace: draft.birthplace,
    gender: draft.gender,
    family: draft.family,
    skills: draft.skills,
    vocation: draft.vocation,
    name: draft.name,
    seed: draft.seed,
  }
}

function confirmLife() {
  startLife(createGame(draftInput()))
}

function quickStart() {
  runtime.textMode = false
  document.body.classList.toggle('text-mode', !runtime.webgl)
  startLife(createGame(randomInput((Math.random() * 1e9) >>> 0)))
}

function startLife(state) {
  runtime.state = state
  runtime.archived = false
  runtime.draft = null
  closeModal()
  announceUnlocks(state.unlocked)
  showIntertitle()
  persist()
}

function showIntertitle() {
  runtime.view = getChapterView(runtime.state)
  runtime.mode = 'intertitle'
  runtime.locked = true
  hud.classList.add('hidden')
  prompt.textContent = ''
  screen.classList.remove('hidden')
  screen.innerHTML = intertitleHTML(runtime.view)
  screen.querySelector('button')?.focus()
}

function enterScene() {
  withFade(() => {
    runtime.view = getChapterView(runtime.state)
    runtime.mode = 'play'
    runtime.hudSig = ''
    if (runtime.world) {
      const layout = runtime.world.setRoom(
        runtime.view.sceneId,
        runtime.view.dress,
        SHIRTS[runtime.state.vocation] || SHIRTS.undecided,
        { gender: runtime.state.gender, age: runtime.view.age },
      )
      runtime.colliders = layout.blocks
      const spawn = runtime.state.pos || runtime.view.spawn
      runtime.world.player.position.set(spawn.x, 0, spawn.z)
      runtime.yaw = spawn.yaw ?? runtime.view.spawn.yaw ?? 0
      runtime.snap = true
    }
    screen.innerHTML = ''
    screen.classList.add('hidden')
    hud.classList.remove('hidden')
    syncHud()
    audio.setMood(runtime.view.dress)
    presence(`${runtime.view.title} · ${runtime.view.age}岁`)
    if (runtime.textMode || !runtime.webgl) openTextStep()
    else runtime.locked = false
  })
}

function openTextStep() {
  const beat = activeBeat(runtime.state)
  if (beat) {
    openChoice(beat)
    return
  }
  if (runtime.state.finished) {
    showEpitaph()
    return
  }
  if (canExit(runtime.state)) {
    runtime.locked = true
    modal.classList.remove('hidden')
    modal.innerHTML = advanceHTML()
    modal.querySelector('button')?.focus()
  }
}

function openChoice(beat) {
  if (!beat) return
  runtime.choice = beat
  runtime.resultOpen = false
  runtime.journal = false
  runtime.locked = true
  modal.classList.remove('hidden')
  modal.innerHTML = choiceHTML(beat)
  modal.querySelector('button')?.focus()
}

function pickChoice(index) {
  const beat = runtime.choice
  if (!beat) return
  let result
  try {
    result = choose(runtime.state, beat.id, index)
  } catch (error) {
    toast(error.message)
    return
  }
  audio.blip()
  runtime.choice = null
  announce(result)
  persist()
  if (result.endsLife) {
    closeModal()
    showEpitaph()
    return
  }
  if (result.resultText) {
    runtime.resultOpen = true
    runtime.locked = true
    modal.classList.remove('hidden')
    modal.innerHTML = resultHTML(result.resultText)
    modal.querySelector('button')?.focus()
    return
  }
  toast(result.log)
  closeModal()
  refreshPlay()
}

function afterResult() {
  runtime.resultOpen = false
  closeModal()
  refreshPlay()
}

function refreshPlay() {
  if (!runtime.state || runtime.mode !== 'play') return
  runtime.view = getChapterView(runtime.state)
  runtime.hudSig = ''
  syncHud()
  if (runtime.textMode || !runtime.webgl) openTextStep()
}

function goNext() {
  let result
  try {
    result = advance(runtime.state)
  } catch (error) {
    toast(error.message)
    return
  }
  announce(result)
  runtime.state.pos = null
  persist()
  closeModal()
  showIntertitle()
}

function announce(result) {
  for (const id of result.unlocks || []) toast(`成就 · ${achievementName(id)}`)
  if (result.tierBefore && result.tierBefore !== result.tierAfter) {
    toast(`阶层 · ${result.tierBefore} → ${result.tierAfter}`)
  }
  unlockSteam(result.unlocks || [])
}

function announceUnlocks(ids) {
  for (const id of ids || []) toast(`成就 · ${achievementName(id)}`)
  unlockSteam(ids || [])
}

function syncHud() {
  if (!runtime.state) return
  const beat = activeBeat(runtime.state)
  const objective = beat?.goal || (canExit(runtime.state) ? runtime.view?.exit?.label : '') || ''
  const signature = `${runtime.state.chapterId}|${runtime.state.tier}|${runtime.state.age}|${objective}|${STAT_LIST.map((key) => runtime.state[key]).join(',')}|${settings.muted}`
  if (signature === runtime.hudSig) return
  runtime.hudSig = signature
  hud.innerHTML = hudHTML(runtime.state, objective, settings.muted)
}

const STAT_LIST = ['health', 'wealth', 'status', 'insight', 'bonds', 'stress']

function openJournal() {
  if (!runtime.state || runtime.mode !== 'play') return
  runtime.journal = true
  runtime.choice = null
  runtime.locked = true
  modal.classList.remove('hidden')
  modal.innerHTML = journalHTML(runtime.state)
}

function closeModal() {
  const reopenText = runtime.journal && runtime.mode === 'play' && (runtime.textMode || !runtime.webgl)
  modal.classList.add('hidden')
  modal.innerHTML = ''
  runtime.choice = null
  runtime.journal = false
  runtime.resultOpen = false
  runtime.locked = runtime.mode !== 'play' || runtime.textMode || !runtime.webgl
  if (runtime.mode === 'play' && runtime.webgl && !runtime.textMode) runtime.locked = false
  if (reopenText) openTextStep()
}

function showEpitaph() {
  const epitaph = runtime.state.epitaph
  if (!epitaph) return
  if (!runtime.archived) {
    archiveLife(runtime.state)
    runtime.archived = true
  }
  localStorage.removeItem(SAVE_KEY)
  runtime.state.savedAt = Date.now()
  window.ascentDesktop?.cloudWrite(JSON.stringify(runtime.state))?.catch(() => {})
  runtime.mode = 'epitaph'
  runtime.locked = true
  hud.classList.add('hidden')
  closeModal()
  screen.classList.remove('hidden')
  screen.innerHTML = epitaphHTML(epitaph)
  presence('人生结束')
}

function showTitle() {
  runtime.mode = 'title'
  runtime.state = null
  runtime.locked = true
  runtime.moved = false
  hint.classList.remove('hidden')
  hud.classList.add('hidden')
  closeModal()
  prompt.textContent = ''
  if (runtime.world) {
    const layout = runtime.world.setRoom('shore', 'shore', SHIRTS.undecided, { gender: 'm', age: 22, companion: true })
    runtime.colliders = layout.blocks
    runtime.world.player.position.set(layout.spawn.x, 0, layout.spawn.z)
    runtime.yaw = layout.spawn.yaw || 0
    runtime.snap = true
    audio.setMood('shore')
  }
  const save = readLocalSave()
  const archive = readArchive()
  screen.classList.remove('hidden')
  screen.innerHTML = titleHTML({
    hasContinue: !!save,
    archive,
    note: runtime.webgl ? '' : '这台设备没有打开 WebGL，已改用文字版。',
  })
  screen.querySelector('button')?.focus()
  if (window.ascentDesktop && !runtime.cloudChecked) {
    runtime.cloudChecked = true
    window.ascentDesktop.status().then((status) => {
      if (status?.ok && runtime.mode === 'title') toast(`Steam 已连接 · ${status.name || status.appId}`)
    }).catch(() => {})
    window.ascentDesktop.cloudRead().then((cloud) => {
      if (runtime.mode !== 'title') return
      const parsed = parseSave(cloud)
      if (!parsed) return
      const local = readLocalSave()
      if (local && (local.savedAt || 0) >= (parsed.savedAt || 0)) return
      localStorage.setItem(SAVE_KEY, JSON.stringify(parsed))
      screen.innerHTML = titleHTML({
        hasContinue: true,
        archive: readArchive(),
        note: runtime.webgl ? '' : '这台设备没有打开 WebGL，已改用文字版。',
      })
    }).catch(() => {})
  }
}

function continueGame() {
  const save = readLocalSave()
  if (!save) return
  runtime.state = save
  runtime.archived = false
  runtime.textMode = save.playMode === 'text' || !runtime.webgl
  document.body.classList.toggle('text-mode', runtime.textMode)
  showIntertitle()
}

function jumpTo(id) {
  if (!runtime.state) runtime.state = createGame(randomInput(99))
  runtime.state.chapterId = id
  runtime.state.finished = false
  runtime.state.epitaph = null
  runtime.state.done = {}
  runtime.state.pos = null
  runtime.state.deathAge = 0
  if (id === 'commitment' || id === 'rift' || id === 'romance') {
    runtime.state.partner = runtime.state.people.suitors[0]
    runtime.state.flags.partnered = true
  }
  if (id === 'rift') runtime.state.flags.married = true
  if (id === 'child') runtime.state.flags.parent = false
  prepareChapter(runtime.state)
  runtime.state.age = chapterAge(runtime.state)
  closeModal()
  showIntertitle()
}

function openPlaytest() {
  runtime.locked = true
  modal.classList.remove('hidden')
  modal.innerHTML = playtestHTML()
}

function toggleMute() {
  settings.muted = !settings.muted
  audio.setMuted(settings.muted)
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  runtime.hudSig = ''
  syncHud()
}

function toast(text) {
  if (!text) return
  const item = document.createElement('div')
  item.className = 'toast'
  item.textContent = text
  toasts.appendChild(item)
  setTimeout(() => item.remove(), 3200)
}

function withFade(fn) {
  fade.classList.add('on')
  runtime.locked = true
  window.setTimeout(() => {
    fn()
    window.requestAnimationFrame(() => {
      fade.classList.remove('on')
      runtime.locked = runtime.mode !== 'play' || !!runtime.choice || runtime.resultOpen || runtime.journal
    })
  }, runtime.reduced ? 0 : 280)
}

function persist() {
  if (!runtime.state || runtime.state.finished) return
  if (runtime.world && runtime.mode === 'play') {
    runtime.state.pos = {
      x: runtime.world.player.position.x,
      z: runtime.world.player.position.z,
      yaw: runtime.yaw,
    }
  }
  runtime.state.savedAt = Date.now()
  runtime.state.playMode = runtime.textMode ? 'text' : '3d'
  const json = JSON.stringify(runtime.state)
  localStorage.setItem(SAVE_KEY, json)
  window.ascentDesktop?.cloudWrite(json)?.catch(() => {})
}

function readLocalSave() {
  return parseSave(localStorage.getItem(SAVE_KEY))
}


function readArchive() {
  try {
    return JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]')
  } catch {
    return []
  }
}

function archiveLife(state) {
  const list = readArchive()
  list.unshift({ name: state.name, tier: state.tier, age: state.deathAge || state.age, tone: state.epitaph?.tone, at: Date.now() })
  localStorage.setItem(ARCHIVE_KEY, JSON.stringify(list.slice(0, 6)))
}

function loadSettings() {
  try {
    return { muted: false, textMode: false, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch {
    return { muted: false, textMode: false }
  }
}

function presence(text) {
  window.ascentDesktop?.presence(text)?.catch(() => {})
}

function unlockSteam(ids) {
  for (const id of ids) window.ascentDesktop?.unlock(id)?.catch(() => {})
}

function bindDrag() {
  let drag = null
  canvas.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return
    drag = { id: event.pointerId, x: event.clientX }
    canvas.setPointerCapture(event.pointerId)
  })
  canvas.addEventListener('pointermove', (event) => {
    if (!drag || drag.id !== event.pointerId) return
    const dx = event.clientX - drag.x
    drag.x = event.clientX
    runtime.yaw -= dx * 0.005
  })
  const end = (event) => {
    if (drag?.id === event.pointerId) drag = null
  }
  canvas.addEventListener('pointerup', end)
  canvas.addEventListener('pointercancel', end)
}

function bindStick() {
  const stick = document.querySelector('#stick')
  const knob = document.querySelector('#knob')
  let pointerId = null
  let origin = { x: 0, y: 0 }
  const place = (event) => {
    const dx = event.clientX - origin.x
    const dy = event.clientY - origin.y
    const max = 34
    const mag = Math.hypot(dx, dy) || 1
    const scale = Math.min(max, mag) / mag
    knob.style.transform = `translate(${dx * scale}px, ${dy * scale}px)`
    runtime.joy.x = (dx * scale) / max
    runtime.joy.z = -(dy * scale) / max
  }
  stick.addEventListener('pointerdown', (event) => {
    pointerId = event.pointerId
    stick.setPointerCapture(event.pointerId)
    const rect = stick.getBoundingClientRect()
    origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    place(event)
  })
  stick.addEventListener('pointermove', (event) => {
    if (event.pointerId === pointerId) place(event)
  })
  const end = (event) => {
    if (event.pointerId !== pointerId) return
    pointerId = null
    runtime.joy.x = 0
    runtime.joy.z = 0
    knob.style.transform = 'translate(0,0)'
  }
  stick.addEventListener('pointerup', end)
  stick.addEventListener('pointercancel', end)
}
