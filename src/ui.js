import { achievementName } from './game/achievements.js'
import {
  BIRTHPLACES,
  COUNTRIES,
  FAMILIES,
  FLOW,
  GENDERS,
  SKILLS,
  STAT_KEYS,
  STAT_LABELS,
  TIER_COPY,
  VOCATIONS,
  countryName,
  familyName,
  genderName,
  placeName,
  skillName,
  statWord,
  vocationName,
} from './game/content.js'

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]))
}

export function titleHTML({ hasContinue, archive, note }) {
  const lives = (archive || [])
    .slice(0, 3)
    .map((life) => `<li>${esc(life.name)} · ${esc(life.age)}岁 · ${esc(life.tier)}</li>`)
    .join('')
  return `<div class="panel title-block">
    <div class="seal">生</div>
    <p class="kicker">ASCENT</p>
    <h1>浮生</h1>
    <p class="lede">从一张出生证明走到最后的名字。出身定起点，选择改方向，死亡来结账。</p>
    ${note ? `<p class="fine">${esc(note)}</p>` : ''}
    <div class="row">
      <button class="primary" data-act="new" type="button">开始人生</button>
      <button data-act="text" type="button">文字版</button>
      <button data-act="quick" type="button">随机出身</button>
      ${hasContinue ? '<button data-act="continue" type="button">继续</button>' : ''}
    </div>
    <p class="fine">↑前进 ↓后退 ←左 →右 · 拖动鼠标转身 · E 查看</p>
    ${lives ? `<ul class="archive">${lives}</ul>` : ''}
  </div>`
}

const STEPS = [
  { key: 'country', title: '你生在哪个国家', hint: '国家会改写起点的钱、压力和别人看你的方式。', options: COUNTRIES },
  { key: 'birthplace', title: '那是什么样的地方', hint: '乡村、城镇、都市，不是风景，是资源。', options: BIRTHPLACES },
  { key: 'gender', title: '别人会怎样称呼你', hint: '它不决定结局，但会改写别人默认你该承担什么。', options: GENDERS },
  { key: 'family', title: '你出生的那一家', hint: '家庭是第一笔看不见的本金。', options: FAMILIES },
  { key: 'skills', title: '挑选两样本事', hint: '这两样会跟着你走进后来的职业门口。', options: SKILLS, multi: true },
  { key: 'vocation', title: '你想把人生往哪边偏', hint: '这是倾向，不是判决。十九岁还会再选一次具体的职业。', options: VOCATIONS },
]

export function createHTML(draft) {
  if (draft.step >= STEPS.length) return summaryHTML(draft)
  const step = STEPS[draft.step]
  const cards = step.options
    .map((option, index) => {
      const selected = step.multi ? draft.skills.includes(option.id) : draft[step.key] === option.id
      return `<button class="card ${selected ? 'selected' : ''}" type="button" data-act="option" data-key="${step.key}" data-id="${option.id}" data-multi="${step.multi ? '1' : '0'}">
        <span class="index">${index + 1}</span>
        <strong>${esc(option.name)}</strong>
        ${option.blurb ? `<small>${esc(option.blurb)}</small>` : ''}
      </button>`
    })
    .join('')
  return `<div class="panel create-block">
    <p class="kicker">${draft.step + 1} / ${STEPS.length + 1}</p>
    <h2>${esc(step.title)}</h2>
    <p class="lede">${esc(step.hint)}</p>
    <div class="cards">${cards}</div>
    <div class="row">
      <button data-act="back" type="button" ${draft.step === 0 ? 'disabled' : ''}>上一步</button>
      <button class="primary" data-act="next" type="button">下一步</button>
    </div>
  </div>`
}

function summaryHTML(draft) {
  const preview = draft.preview
  const stats = STAT_KEYS.map(
    (key) => `<li><span>${STAT_LABELS[key]}</span><b>${esc(statWord(key, preview[key]))}</b></li>`,
  ).join('')
  return `<div class="panel create-block">
    <p class="kicker">出身</p>
    <h2>${esc(preview.name)}</h2>
    <p class="prose">${esc(preview.paragraph)}</p>
    <p class="tier">开局阶层 · ${esc(preview.tier)}</p>
    <p class="fine">${esc(TIER_COPY[preview.tier] || '')}</p>
    <ul class="stat-words">${stats}</ul>
    <ul class="meta">
      <li>${esc(countryName(draft.country))} · ${esc(placeName(draft.birthplace))}</li>
      <li>${esc(genderName(draft.gender))} · ${esc(familyName(draft.family))}</li>
      <li>本事 · ${esc(draft.skills.map(skillName).join('、'))}</li>
      <li>倾向 · ${esc(vocationName(draft.vocation))}</li>
    </ul>
    <label class="name-line">改个名字 <input id="name-input" maxlength="16" value="${esc(draft.name)}" placeholder="${esc(preview.name)}" /></label>
    <div class="row">
      <button data-act="back" type="button">上一步</button>
      <button class="primary" data-act="confirm" type="button">走进这辈子</button>
    </div>
  </div>`
}

export function intertitleHTML(view) {
  const index = Math.max(0, FLOW.indexOf(view.id))
  return `<div class="panel intertitle">
    <p class="kicker">第 ${index + 1} 段</p>
    <p class="age">${esc(view.age)}</p>
    <h2>${esc(view.title)}</h2>
    <p class="prose">${esc(view.intro)}</p>
    <button class="primary" data-act="enter" type="button">走进去</button>
  </div>`
}

export function hudHTML(state, objective, muted) {
  const stats = STAT_KEYS.map((key) => {
    const value = state[key]
    return `<div class="stat" data-key="${key}">
      <span>${STAT_LABELS[key]}</span>
      <div class="bar" title="${esc(statWord(key, value))}"><i style="width:${value}%"></i></div>
      <em>${esc(statWord(key, value))}</em>
    </div>`
  }).join('')
  return `<div class="who">
      <strong>${esc(state.name)}</strong>
      <span>${esc(state.age)}岁 · ${esc(state.career?.name || vocationName(state.vocation))}</span>
      <b class="badge">${esc(state.tier)}</b>
    </div>
    <p class="objective">${esc(objective || '')}</p>
    <div class="stats">${stats}</div>
    <div class="hud-actions">
      <button data-act="journal" type="button">生平 J</button>
      <button data-act="mute" type="button">${muted ? '声音关' : '声音开'}</button>
    </div>`
}

export function choiceHTML(beat) {
  const buttons = beat.choices
    .map(
      (choice, index) => `<button data-act="pick" data-index="${index}" type="button">
        <strong>${index + 1}. ${esc(choice.text)}</strong>
        ${choice.hint ? `<small>${esc(choice.hint)}</small>` : ''}
      </button>`,
    )
    .join('')
  return `<div class="paper">
    <p class="kicker">${esc(beat.goal)}</p>
    <p class="prose">${esc(beat.text)}</p>
    <div class="choices">${buttons}</div>
    <p class="fine">数字键选择 · Esc 返回场景</p>
  </div>`
}

export function resultHTML(text) {
  return `<div class="paper">
    <p class="kicker">结果</p>
    <p class="prose">${esc(text)}</p>
    <button class="primary" data-act="close-result" type="button">继续</button>
  </div>`
}

export function advanceHTML() {
  return `<div class="paper">
    <p class="prose">这段日子里能做的事，都做完了。</p>
    <button class="primary" data-act="advance" type="button">岁月向前</button>
  </div>`
}

export function journalHTML(state) {
  const lines = [...state.log].reverse().map((line) => `<li><span>${esc(line.age)}</span>${esc(line.text)}</li>`).join('')
  return `<div class="paper journal">
    <p class="kicker">生平</p>
    <h2>${esc(state.name)} · ${esc(state.tier)}</h2>
    <p class="fine">${esc(countryName(state.country))} ${esc(placeName(state.birthplace))} · ${esc(familyName(state.family))} · ${esc(state.career?.name || '职业未定')}</p>
    <ol>${lines}</ol>
    <button data-act="close" type="button">合上</button>
  </div>`
}

export function epitaphHTML(epitaph) {
  const paragraphs = epitaph.paragraphs.map((line) => `<p>${esc(line)}</p>`).join('')
  const timeline = epitaph.timeline.map((line) => `<li><span>${esc(line.age)}</span>${esc(line.text)}</li>`).join('')
  const badges = (epitaph.unlocked || []).map((id) => `<li>${esc(achievementName(id))}</li>`).join('')
  return `<div class="panel epitaph">
    <p class="kicker">终局</p>
    <p class="age">${esc(epitaph.age)}</p>
    <h2>${esc(epitaph.name)}</h2>
    <p class="tier">${esc(epitaph.tier)} · ${esc(epitaph.tierLine)}</p>
    <div class="prose">${paragraphs}</div>
    ${badges ? `<ul class="badges">${badges}</ul>` : ''}
    <details><summary>一生的选择</summary><ol class="timeline">${timeline}</ol></details>
    <div class="row">
      <button class="primary" data-act="again" type="button">再活一次</button>
    </div>
  </div>`
}

export function playtestHTML() {
  const buttons = FLOW.map((id) => `<button data-act="jump" data-id="${id}" type="button">${id}</button>`).join('')
  return `<div class="paper"><p class="kicker">试玩跳转</p><div class="row wrap">${buttons}</div><button data-act="close" type="button">关闭</button></div>`
}

export const CREATE_STEPS = STEPS.length
