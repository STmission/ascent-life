import assert from 'node:assert/strict'
import test from 'node:test'
import { ACHIEVEMENTS } from '../src/game/achievements.js'
import { FLOW, canUniversity, careerOptions, computeTier } from '../src/game/content.js'
import { SCENES, getLayout, isBlocked, pointInside } from '../src/game/layout.js'
import { advance, choose, createGame, getChapterView, nextChapterId, playToEnd } from '../src/game/sim.js'

const poor = {
  country: 'cn',
  birthplace: 'rural',
  gender: 'f',
  family: 'hard',
  skills: ['craft', 'care'],
  vocation: 'craft',
  name: '阿禾',
  seed: 7,
}

const rich = {
  country: 'us',
  birthplace: 'metro',
  gender: 'm',
  family: 'biz',
  skills: ['social', 'nerve'],
  vocation: 'business',
  name: 'Owen',
  seed: 11,
}

test('every room can be walked at its markers', () => {
  for (const [sceneId, scene] of Object.entries(SCENES)) {
    assert.equal(isBlocked(scene.blocks, scene.spawn.x, scene.spawn.z), false, `${sceneId} spawn`)
    assert.ok(pointInside(scene.floor, scene.spawn.x, scene.spawn.z), `${sceneId} spawn inside`)
    for (const [name, point] of Object.entries(scene.points)) {
      assert.equal(isBlocked(scene.blocks, point.x, point.z), false, `${sceneId}.${name}`)
      assert.ok(pointInside(scene.floor, point.x, point.z), `${sceneId}.${name} inside`)
    }
  }
})

test('every chapter exposes two separated, walkable choices', () => {
  const variants = [
    { label: 'default', patch: (state) => state },
    {
      label: 'hospital',
      patch: (state) => {
        state.flags.familyScene = 'hospital'
        state.flags.exam = 'low'
        state.skills = ['craft', 'art']
        state.family = 'hard'
        state.wealth = 8
        state.partner = null
      },
    },
    {
      label: 'split-married',
      patch: (state) => {
        state.flags.familyScene = 'split'
        state.flags.parentsDivorced = true
        state.flags.exam = 'high'
        state.partner = state.people.suitors[0]
        state.flags.partnered = true
        state.flags.married = true
        state.flags.parent = true
        state.people.child = '小禾'
      },
    },
  ]
  for (const variant of variants) {
    for (const chapterId of FLOW) {
      const state = createGame({ ...poor, seed: 21 })
      variant.patch(state)
      state.chapterId = chapterId
      if (chapterId === 'death') state.deathAge = 86
      const view = getChapterView(state)
      assert.ok(view.beats.length >= 2, `${variant.label} ${chapterId}`)
      const layout = getLayout(view.sceneId)
      for (const beat of view.beats) {
        assert.ok(beat.choices.length >= 2, `${chapterId}.${beat.id}`)
        assert.equal(isBlocked(layout.blocks, beat.x, beat.z), false, `${view.sceneId}.${beat.id}`)
        for (const option of beat.choices) assert.ok(option.text && option.id)
      }
      const [first, second] = view.beats
      const gap = Math.hypot(first.x - second.x, first.z - second.z)
      assert.ok(gap > 0.8, `${chapterId} beats overlap`)
    }
  }
})

test('origin sets the starting tier without handing out freedom', () => {
  const hardLife = createGame(poor)
  const easyLife = createGame(rich)
  assert.equal(hardLife.tier, '平民')
  assert.equal(hardLife.startWealth <= 24, true)
  assert.equal(easyLife.tier, '中层')
  assert.notEqual(easyLife.tier, '财富自由')
  assert.ok(easyLife.unlocked.includes('MIDDLE'))
  assert.equal(hardLife.unlocked.includes('ELITE'), false)
})

test('medicine stays locked until grades and study are both there', () => {
  const locked = createGame({ ...poor, skills: ['craft', 'art'], vocation: 'craft', seed: 3 })
  locked.flags.exam = 'low'
  locked.wealth = 10
  assert.equal(canUniversity(locked), false)
  assert.equal(careerOptions(locked).some((item) => item.id === 'doctor'), false)
  const open = createGame({ ...poor, skills: ['study', 'care'], vocation: 'study', family: 'scholar', seed: 4 })
  open.flags.exam = 'high'
  assert.equal(canUniversity(open), true)
  assert.equal(careerOptions(open).some((item) => item.id === 'doctor'), true)
})

test('a hospital bill cannot push wealth below zero', () => {
  const state = createGame(poor)
  state.chapterId = 'family'
  state.flags.familyScene = 'hospital'
  state.wealth = 10
  choose(state, 'bedside', 0)
  choose(state, 'bill', 'pay')
  assert.equal(state.wealth, 0)
  assert.equal(state.flags.filial, true)
})

test('marriage inserts the rift chapter and a single life skips it', () => {
  const coupled = createGame(poor)
  coupled.flags.married = true
  assert.equal(nextChapterId(coupled, 'child'), 'rift')
  const single = createGame({ ...poor, seed: 8 })
  assert.equal(nextChapterId(single, 'child'), 'midlife')
})

test('the second beat stays locked until the first is done', () => {
  const state = createGame(poor)
  assert.throws(() => choose(state, 'window', 0), /还没走到这里/)
})

test('playing every first choice reaches a death epitaph', () => {
  const state = playToEnd({ ...poor, seed: 42 })
  assert.equal(state.finished, true)
  assert.equal(state.epitaph.paragraphs.length, 4)
  assert.equal(state.flags.married, true)
  assert.equal(state.flags.parent, true)
  assert.ok(state.unlocked.includes('FULL_LIFE'))
  assert.ok(state.unlocked.includes('MARRIED'))
  assert.ok(state.unlocked.includes('PARENT'))
  assert.ok(state.deathAge >= 64 && state.deathAge <= 99)
})

test('refusing romance never marries and still ends', () => {
  const state = playToEnd({ ...rich, seed: 18 }, (_game, beat) => {
    const preferred = ['leave', 'solo', 'no', 'pass', 'water', 'tried']
    const index = beat.choices.findIndex((item) => preferred.includes(item.id))
    return index >= 0 ? index : 0
  })
  assert.equal(state.finished, true)
  assert.equal(state.flags.married, undefined)
  assert.equal(state.flags.unmarried, true)
  assert.equal(state.log.some((line) => line.text.includes('裂痕')), false)
})

test('achievements have unique ids', () => {
  const ids = ACHIEVEMENTS.map((item) => item.id)
  assert.equal(new Set(ids).size, ids.length)
})

test('tier boundaries', () => {
  assert.equal(computeTier({ wealth: 10, status: 10, stress: 10 }), '平民')
  assert.equal(computeTier({ wealth: 60, status: 40, stress: 20 }), '中层')
  assert.equal(computeTier({ wealth: 80, status: 80, stress: 20 }), '精英')
  assert.equal(computeTier({ wealth: 90, status: 80, stress: 20 }), '财富自由')
  assert.equal(computeTier({ wealth: 90, status: 80, stress: 90 }), '精英')
})

test('advance refuses to skip unfinished business', () => {
  const state = createGame(poor)
  assert.throws(() => advance(state), /还没走完/)
})
