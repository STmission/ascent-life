import { freshUnlocks } from './achievements.js'
import {
  BIRTHPLACES,
  CHAPTER_AGE,
  COUNTRIES,
  FAMILIES,
  GENDERS,
  SKILLS,
  STAT_KEYS,
  VOCATIONS,
  chapterAge,
  computeTier,
  defaultPlayerName,
  getChapterView,
  makeEpitaph,
  makePeople,
  nextChapterId,
  originParagraph,
  originStats,
  prepareChapter,
} from './content.js'
import { hashString, pick } from './rng.js'

export { computeTier, getChapterView, nextChapterId, CHAPTER_AGE }

export function createGame(input) {
  const seed = (input.seed ?? hashString(JSON.stringify({ ...input, seed: undefined }))) >>> 0
  const state = {
    version: 1,
    seed,
    name: cleanName(input.name),
    country: input.country,
    birthplace: input.birthplace,
    gender: input.gender,
    family: input.family,
    skills: [...(input.skills || [])].slice(0, 2),
    vocation: input.vocation || 'undecided',
    people: null,
    partner: null,
    career: null,
    health: 0,
    wealth: 0,
    status: 0,
    insight: 0,
    bonds: 0,
    stress: 0,
    age: CHAPTER_AGE.birth,
    tier: '平民',
    startTier: '平民',
    startWealth: 0,
    chapterId: 'birth',
    flags: {},
    done: {},
    log: [],
    unlocked: [],
    finished: false,
    deathAge: 0,
    epitaph: null,
    pos: null,
  }
  Object.assign(state, originStats(input))
  if (!state.name) state.name = defaultPlayerName(state)
  state.people = makePeople(state)
  state.tier = computeTier(state)
  state.startTier = state.tier
  state.startWealth = state.wealth
  state.log.push({ age: state.age, text: `${state.name}的人生从这里开始。` })
  grant(state, { type: 'begin' })
  return state
}

function cleanName(value) {
  return String(value || '')
    .replace(/[\u0000-\u001F]/g, '')
    .trim()
    .slice(0, 16)
}

export function randomInput(seed) {
  const rng = { seed: (seed ^ 0xa5a5a5a5) >>> 0 }
  const pool = [...SKILLS]
  const skills = []
  while (skills.length < 2) {
    const skill = pick(rng, pool)
    pool.splice(pool.indexOf(skill), 1)
    skills.push(skill.id)
  }
  return {
    country: pick(rng, COUNTRIES).id,
    birthplace: pick(rng, BIRTHPLACES).id,
    gender: pick(rng, GENDERS).id,
    family: pick(rng, FAMILIES).id,
    vocation: pick(rng, VOCATIONS).id,
    skills,
    name: '',
    seed: seed >>> 0,
  }
}

export function activeBeat(state) {
  const view = getChapterView(state)
  return view.beats.find((beat) => !state.done[beat.id] && (beat.requires || []).every((id) => state.done[id])) || null
}

export function canExit(state) {
  const view = getChapterView(state)
  return !view.terminal && view.beats.every((beat) => state.done[beat.id])
}

export function choose(state, beatId, choiceKey) {
  if (state.finished) throw new Error('人生已经结束')
  const view = getChapterView(state)
  const beat = view.beats.find((item) => item.id === beatId)
  if (!beat) throw new Error(`没有这个场景：${beatId}`)
  if (state.done[beatId]) throw new Error('这个时刻已经过去')
  if ((beat.requires || []).some((id) => !state.done[id])) throw new Error('还没走到这里')
  const choice = typeof choiceKey === 'number' ? beat.choices[choiceKey] : beat.choices.find((item) => item.id === choiceKey)
  if (!choice) throw new Error('没有这个选择')
  const tierBefore = state.tier
  const resolved = choice.resolve ? choice.resolve(state) : {}
  const effects = resolved.effects || choice.effects || {}
  for (const key of STAT_KEYS) {
    if (typeof effects[key] === 'number') state[key] = clampStat(state[key] + effects[key])
  }
  if (choice.apply) choice.apply(state)
  state.done[beatId] = true
  const line = resolved.log || choice.log || choice.text
  state.log.push({ age: state.age, text: line })
  state.tier = computeTier(state)
  let unlocks = grant(state, { type: 'choice' })
  const endsLife = !!(choice.endsLife || resolved.endsLife)
  if (endsLife) unlocks = unlocks.concat(finishLife(state).unlocks)
  return {
    log: line,
    resultText: resolved.resultText || '',
    tierBefore,
    tierAfter: state.tier,
    unlocks,
    endsLife: state.finished,
  }
}

function clampStat(value) {
  return Math.max(0, Math.min(100, value))
}

export function advance(state) {
  if (state.finished) throw new Error('人生已经结束')
  const view = getChapterView(state)
  if (view.beats.some((beat) => !state.done[beat.id])) throw new Error('这段日子还没走完')
  if (view.terminal) throw new Error('没有下一段了')
  const next = nextChapterId(state)
  if (!next) throw new Error('没有下一段了')
  const tierBefore = state.tier
  state.chapterId = next
  state.pos = null
  prepareChapter(state)
  state.age = chapterAge(state)
  state.tier = computeTier(state)
  return { tierBefore, tierAfter: state.tier, unlocks: grant(state, { type: 'enter' }), chapter: getChapterView(state) }
}

export function finishLife(state) {
  if (state.finished) return { epitaph: state.epitaph, unlocks: [] }
  if (!state.deathAge) {
    state.chapterId = 'death'
    prepareChapter(state)
    state.age = state.deathAge
  }
  state.tier = computeTier(state)
  const unlocks = grant(state, { type: 'death' })
  state.finished = true
  state.epitaph = makeEpitaph(state)
  state.epitaph.unlocked = [...state.unlocked]
  return { epitaph: state.epitaph, unlocks }
}

function grant(state, ctx) {
  const unlocked = freshUnlocks(state, ctx)
  state.unlocked.push(...unlocked)
  return unlocked
}

export function describeOrigin(input) {
  const preview = createGame(input)
  return {
    paragraph: originParagraph(preview),
    tier: preview.tier,
    name: preview.name,
    health: preview.health,
    wealth: preview.wealth,
    status: preview.status,
    insight: preview.insight,
    bonds: preview.bonds,
    stress: preview.stress,
  }
}

export function playToEnd(input, chooser = () => 0) {
  const state = createGame(input)
  let guard = 0
  while (!state.finished && guard < 80) {
    guard += 1
    const beat = activeBeat(state)
    if (beat) {
      choose(state, beat.id, chooser(state, beat))
      continue
    }
    if (canExit(state)) {
      advance(state)
      continue
    }
    break
  }
  return state
}
