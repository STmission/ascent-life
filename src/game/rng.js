export function rand(state) {
  state.seed = (Math.imul(state.seed >>> 0, 1664525) + 1013904223) >>> 0
  return state.seed / 4294967296
}

export function hashString(value) {
  let h = 2166136261
  const text = String(value)
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function pick(state, list) {
  return list[Math.floor(rand(state) * list.length)]
}

export function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}
