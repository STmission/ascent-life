import { FLOW, STAT_KEYS, COUNTRIES, BIRTHPLACES, GENDERS, FAMILIES, VOCATIONS, SKILLS } from './content.js'
export function parseSave(raw) {
  if (!raw) return null
  try {
    const s = typeof raw === 'string' ? JSON.parse(raw) : raw
    if (s?.version !== 1 || s.finished || !FLOW.includes(s.chapterId)) return null
    for (const [key, options] of Object.entries({country:COUNTRIES,birthplace:BIRTHPLACES,gender:GENDERS,family:FAMILIES,vocation:VOCATIONS})) {
      if (!options.some(o => o.id === s[key])) return null
    }
    if (!STAT_KEYS.every(k => Number.isFinite(s[k]) && s[k] >= 0 && s[k] <= 100)) return null
    if (!s.flags || !s.done || !s.people || !Array.isArray(s.log) || !Array.isArray(s.unlocked)) return null
    if (!Array.isArray(s.skills) || s.skills.length > 2 || !s.skills.every(k => SKILLS.some(o => o.id === k))) return null
    if (!Number.isFinite(s.seed) || typeof s.name !== 'string') return null
    if (s.pos && !['x','z','yaw'].every(k => Number.isFinite(s.pos[k]))) s.pos = null
    return s
  } catch { return null }
}
