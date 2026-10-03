import test from 'node:test'
import assert from 'node:assert/strict'
import { createGame, randomInput, playToEnd } from '../src/game/sim.js'
import { parseSave } from '../src/game/save.js'
test('saves round trip; malformed, incompatible, and completed saves are rejected', () => {
  const state = createGame(randomInput(21))
  assert.deepEqual(parseSave(JSON.stringify(state)), state)
  for (const s of [null, '{}', '{', {...state, version:2}, {...state, wealth:'many'}, {...state, done:null}, {...state, finished:true}]) assert.equal(parseSave(s), null)
})
test('diverse origins and branching choices reach finite death outcomes', () => {
  for (let seed=1; seed<=200; seed++) {
    let choice = seed
    const state = playToEnd(randomInput(seed), (_,beat) => {
      choice = (Math.imul(choice,1664525)+1013904223) >>> 0
      return choice % beat.choices.length
    })
    assert.equal(state.finished, true, `seed ${seed}`)
    assert.ok(state.epitaph)
    for (const key of ['health','wealth','status','insight','bonds','stress']) assert.ok(Number.isFinite(state[key]) && state[key]>=0 && state[key]<=100)
  }
})
