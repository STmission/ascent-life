import { getLayout } from './layout.js'
import { clamp, pick, rand } from './rng.js'

export const STAT_KEYS = ['health', 'wealth', 'status', 'insight', 'bonds', 'stress']

export const STAT_LABELS = {
  health: '健康',
  wealth: '财富',
  status: '地位',
  insight: '见识',
  bonds: '关系',
  stress: '压力',
}

export const TIER_COPY = {
  平民: '日子主要由账单和别人的安排决定',
  中层: '你开始有一点选择的余地',
  精英: '资源和头衔会来找你，时间却更少',
  财富自由: '钱不再规定你的早晨',
}

export const COUNTRIES = [
  { id: 'cn', name: '中国', mods: { insight: 6, stress: 6, status: 4 } },
  { id: 'us', name: '美国', mods: { wealth: 12, stress: 4, bonds: -2, status: 2 } },
  { id: 'jp', name: '日本', mods: { status: 6, stress: 8, insight: 4 } },
  { id: 'in', name: '印度', mods: { bonds: 8, insight: 4, wealth: -4, stress: 2 } },
  { id: 'br', name: '巴西', mods: { bonds: 8, health: 4, stress: -4 } },
  { id: 'de', name: '德国', mods: { wealth: 6, insight: 4, stress: 2, status: 2 } },
  { id: 'ng', name: '尼日利亚', mods: { bonds: 10, wealth: -6, stress: 4, health: 2 } },
  { id: 'kr', name: '韩国', mods: { status: 8, insight: 6, stress: 10 } },
]

export const BIRTHPLACES = [
  { id: 'rural', name: '乡村', mods: { wealth: -12, bonds: 8, status: -8, stress: -2 } },
  { id: 'town', name: '城镇', mods: { wealth: -2, bonds: 4 } },
  { id: 'metro', name: '都市', mods: { wealth: 8, status: 8, stress: 6, bonds: -4 } },
  { id: 'global', name: '国际都市', mods: { wealth: 12, status: 10, stress: 8, insight: 6, bonds: -6 } },
]

export const GENDERS = [
  { id: 'f', name: '女性' },
  { id: 'm', name: '男性' },
  { id: 'x', name: '非二元' },
]

export const FAMILIES = [
  { id: 'wage', name: '工薪双亲', mods: { wealth: 2, bonds: 4 } },
  { id: 'single', name: '单亲', mods: { bonds: -4, stress: 8, wealth: -6, insight: 2 } },
  { id: 'biz', name: '经商之家', mods: { wealth: 18, status: 10, bonds: -6, stress: 4 } },
  { id: 'scholar', name: '书香门第', mods: { insight: 12, status: 6, stress: 4 } },
  { id: 'hard', name: '困境之家', mods: { wealth: -16, status: -4, health: -6, stress: 12, bonds: 2 } },
]

export const SKILLS = [
  { id: 'study', name: '学识', blurb: '把难的东西拆开。', mods: { insight: 6 } },
  { id: 'social', name: '交际', blurb: '让人愿意把话交给你。', mods: { bonds: 6 } },
  { id: 'craft', name: '手艺', blurb: '手上的活会留下。', mods: { wealth: 4 } },
  { id: 'nerve', name: '胆识', blurb: '在没有保证时还能往前。', mods: { stress: -4, status: 2 } },
  { id: 'care', name: '共情', blurb: '你能听见别人没说完的部分。', mods: { bonds: 5, stress: 2 } },
  { id: 'art', name: '审美', blurb: '你知道什么东西是活的。', mods: { insight: 4, stress: 2 } },
]

export const VOCATIONS = [
  { id: 'study', name: '学问', blurb: '把事情弄明白，再往上走。' },
  { id: 'craft', name: '手艺', blurb: '做一个离了你就不一样的东西。' },
  { id: 'business', name: '生意', blurb: '让资源和机会在你手里转起来。' },
  { id: 'civic', name: '公共', blurb: '在别人的生活里把事情办成。' },
  { id: 'art', name: '创作', blurb: '留下能被看见的东西。' },
  { id: 'undecided', name: '还没定', blurb: '先活下去，答案可以晚一点。' },
]

const PLACE_LINE = {
  cn: {
    rural: '村路被晒得发白，夜里只剩小卖部的灯。',
    town: '小城的事传得很快，楼却不高。',
    metro: '楼把天空切成细条，电梯比远亲更常见。',
    global: '一栋楼里有好几种厨房的味道。',
  },
  us: {
    rural: '房子和房子之间隔着草坪，还有一辆总在修的车。',
    town: '主街不长，周五的灯会亮得稍微正式一点。',
    metro: '街区之间像不同的国家，你先学会看路牌。',
    global: '同学的假期飞往不同的大陆。',
  },
  jp: {
    rural: '车站很小，末班车的时间大家都记得。',
    town: '商店街的卷帘门一到晚上就齐齐拉下。',
    metro: '电车把门开得很准时，人也把话放得很轻。',
    global: '你在两种礼貌之间换来换去。',
  },
  in: {
    rural: '尘土、集市和很响的喇叭一起构成早晨。',
    town: '巷子里有人认识你的家人。',
    metro: '新的楼和旧的街贴在一起，谁也不让谁。',
    global: '你习惯在好几种语言里挑一句最有用的。',
  },
  br: {
    rural: '雨来得很突然，院子里总在晒着什么。',
    town: '广场比客厅更像家里的中心。',
    metro: '高楼的影子里有球场，也有很陡的坡。',
    global: '海风有时会把城里的声音吹得远一点。',
  },
  de: {
    rural: '森林比邻居更近，周日安静得能听见自己。',
    town: '规矩清楚，面包的时间也清楚。',
    metro: '列车把城市连起来，人们按点生活。',
    global: '你的口音会先被听见，然后才是你的话。',
  },
  ng: {
    rural: '发电机和虫声会轮流接管夜晚。',
    town: '市场的声音从早上一直排到晚饭。',
    metro: '车道很挤，人的办法比车道更多。',
    global: '你同时活在家里的期望和外面的速度里。',
  },
  kr: {
    rural: '田和补习班的广告牌会出现在同一条路上。',
    town: '谁家的灯亮到几点，街上都知道。',
    metro: '高楼、考试和熬夜的便利店绑在一起。',
    global: '你在标准答案和另一套生活之间看了一眼。',
  },
}

const FAMILY_LINE = {
  wage: '父母都上班。晚饭有时热，有时是留下的字条。',
  single: '家里做决定的大人通常只有一位，疲倦是这位大人的另一种声音。',
  biz: '家里的话题经常绕着账、面子和下一单。',
  scholar: '书架比玩具先进入你的记忆，问题会被认真地回答。',
  hard: '钱是每天都要重新计算的东西。爱还在，只是常常很赶。',
}

export const FLOW = [
  'birth',
  'primary',
  'middle',
  'high',
  'crossroads',
  'family',
  'romance',
  'commitment',
  'child',
  'rift',
  'midlife',
  'elder',
  'death',
]

export const CHAPTER_AGE = {
  birth: 5,
  primary: 8,
  middle: 13,
  high: 17,
  crossroads: 19,
  family: 27,
  romance: 29,
  commitment: 31,
  child: 34,
  rift: 41,
  midlife: 48,
  elder: 72,
  death: 80,
}

const TITLES = {
  birth: '最初的记忆',
  primary: '小学',
  middle: '中学',
  high: '高中',
  crossroads: '岔路',
  family: '家里的事',
  romance: '遇见',
  commitment: '承诺',
  child: '下一间房',
  rift: '裂痕',
  midlife: '中年',
  elder: '老年',
  death: '离开',
}

const SCALES = {
  birth: 0.62,
  primary: 0.74,
  middle: 0.88,
  high: 1,
}

function byId(list, id) {
  return list.find((item) => item.id === id)
}

export function countryName(id) {
  return byId(COUNTRIES, id)?.name || id
}

export function placeName(id) {
  return byId(BIRTHPLACES, id)?.name || id
}

export function familyName(id) {
  return byId(FAMILIES, id)?.name || id
}

export function genderName(id) {
  return byId(GENDERS, id)?.name || id
}

export function vocationName(id) {
  return byId(VOCATIONS, id)?.name || '还没定'
}

export function skillName(id) {
  return byId(SKILLS, id)?.name || id
}

function placeLine(state) {
  return PLACE_LINE[state.country]?.[state.birthplace] || ''
}

function expectation(state) {
  if (state.gender === 'f') return '有人默认你会先把家里的缝补好，再考虑自己的路。'
  if (state.gender === 'm') return '有人默认你会先把收入扛住，再谈心里想要什么。'
  return '表格上的格子总是差一点。你已经学会先把名字写正。'
}

export function canUniversity(state) {
  if (state.flags.exam === 'high') return true
  if (state.flags.exam === 'low') return state.wealth >= 72 || state.family === 'scholar'
  return state.family === 'scholar' || state.wealth >= 60 || state.skills.includes('study')
}

export function careerOptions(state) {
  const uni = canUniversity(state)
  const skills = state.skills
  const vocation = state.vocation
  const options = []
  const add = (career) => {
    if (!options.some((item) => item.id === career.id)) options.push(career)
  }
  add({
    id: 'service',
    name: '服务与班次',
    school: false,
    blurb: '先把一个月的生活稳住。',
  })
  if (skills.includes('craft') || vocation === 'craft') {
    add({ id: 'craft', name: '手艺', school: false, blurb: '用手上的本事换一份不容易被替换的工作。' })
  }
  if (skills.includes('care') || vocation === 'civic') {
    add({ id: 'care', name: '照护', school: false, blurb: '医院、课堂或别人家里，那些不能停的事。' })
  }
  if (uni && (skills.includes('study') || vocation === 'study' || state.flags.exam === 'high')) {
    add({ id: 'teacher', name: '教师', school: true, blurb: '把复杂的东西讲到别人能用。' })
  }
  if (uni && state.flags.exam === 'high' && (skills.includes('study') || vocation === 'study')) {
    add({ id: 'engineer', name: '工程', school: true, blurb: '系统和机器，以及它们犯的错。' })
  }
  if (uni && state.flags.exam === 'high' && skills.includes('study') && (skills.includes('care') || vocation === 'study')) {
    add({ id: 'doctor', name: '医学', school: true, blurb: '很长的训练，很具体的责任。' })
  }
  if (uni && (skills.includes('nerve') || vocation === 'business' || state.family === 'biz' || state.flags.motive === 'money')) {
    add({ id: 'finance', name: '金融', school: true, blurb: '数字会放大你的判断，也会放大你的失误。' })
  }
  if (skills.includes('art') || vocation === 'art') {
    add({
      id: 'artist',
      name: '创作',
      school: uni && skills.includes('art'),
      blurb: '不稳定，但作品上有你的名字。',
    })
  }
  if (skills.includes('social') || skills.includes('nerve') || vocation === 'business' || state.family === 'biz') {
    add({ id: 'founder', name: '自己干', school: false, blurb: '没有人给你发工资，也没有人替你收场。' })
  }
  if (skills.includes('social') || vocation === 'civic' || state.flags.motive === 'family') {
    add({
      id: 'civil',
      name: '公共事务',
      school: uni,
      blurb: '在规则里面给人找一条能走的路。',
    })
  }
  if (options.length < 3) add({ id: 'trade', name: '技术工种', school: false, blurb: '城市靠这些手运转。' })
  return options
}

export function applyCareer(state, career) {
  state.career = { id: career.id, name: career.name }
  state.flags.university = !!career.school
  state.flags.earlyWork = !career.school
}

export function originStats(input) {
  const stats = { health: 64, wealth: 30, status: 24, insight: 28, bonds: 50, stress: 26 }
  const add = (mods = {}) => {
    for (const key of Object.keys(mods)) stats[key] += mods[key]
  }
  add(byId(COUNTRIES, input.country)?.mods)
  add(byId(BIRTHPLACES, input.birthplace)?.mods)
  add(byId(FAMILIES, input.family)?.mods)
  for (const skillId of input.skills || []) add(byId(SKILLS, skillId)?.mods)
  for (const key of STAT_KEYS) stats[key] = clamp(stats[key])
  return stats
}

export function originParagraph(state) {
  return `${state.name}生在${countryName(state.country)}的${placeName(state.birthplace)}。${placeLine(state)}${FAMILY_LINE[state.family] || ''}`
}

function bandWord(value, words) {
  const index = value >= 80 ? 4 : value >= 60 ? 3 : value >= 40 ? 2 : value >= 20 ? 1 : 0
  return words[index]
}

export function statWord(key, value) {
  const words = {
    health: ['很弱', '吃力', '还行', '结实', '充沛'],
    wealth: ['所剩无几', '紧巴', '够用', '宽裕', '很厚'],
    status: ['无人问', '普通', '被看见', '有分量', '举足轻重'],
    insight: ['窄', '常识', '明白', '通透', '很深'],
    bonds: ['疏', '淡', '有人', '扎实', '很密'],
    stress: ['松', '可控', '压着', '很紧', '过载'],
  }
  return bandWord(value, words[key])
}

function childName(state) {
  const table = {
    cn: ['小禾', '安宁', '予安', '晚星'],
    jp: ['阳菜', '莲', '结衣', '苍'],
    kr: ['하린', '서윤', '도윤', '지우'],
    us: ['Noah', 'Iris', 'Leo', 'Ada'],
    de: ['Mara', 'Jonas', 'Lina', 'Emil'],
    in: ['Asha', 'Kabir', 'Meera', 'Dev'],
    br: ['Luna', 'Miguel', 'Ana', 'Caio'],
    ng: ['Zainab', 'Tobi', 'Amaka', 'Seyi'],
  }
  return pick(state, table[state.country] || table.cn)
}

export function makePeople(state) {
  const given = {
    cn: {
      sur: ['林', '周', '陈', '苏', '许', '何'],
      parent: ['志远', '晚宁', '序年', '小禾', '国梁', '春迟'],
      young: ['小满', '阿南', '朵朵', '子安'],
      steady: ['沈予安', '周衡', '陈知夏'],
      spark: ['梁野', '苏亮', '何晚舟'],
    },
    jp: {
      sur: ['佐藤', '高橋', '小林'],
      parent: ['蓮', '凛', '陽菜'],
      young: ['美咲', '蒼'],
      steady: ['佐藤 凛', '高橋 蓮'],
      spark: ['小林 陽菜', '佐藤 蒼'],
    },
    kr: {
      sur: ['김', '박', '최'],
      parent: ['민재', '서연'],
      young: ['하늘', '다은'],
      steady: ['김서연', '박민재'],
      spark: ['최하늘', '김다은'],
    },
  }
  const western = {
    us: {
      parent: ['Elena Brooks', 'Daniel Nguyen', 'Ruth Ellis'],
      young: ['Sam', 'Maya', 'Chris'],
      steady: ['Maya Chen', 'Owen Brooks'],
      spark: ['Jonah Ellis', 'Lila Rivera'],
    },
    de: {
      parent: ['Greta Vogel', 'Jonas Keller', 'Mara Weiss'],
      young: ['Lina', 'Erik'],
      steady: ['Erik Keller', 'Greta Vogel'],
      spark: ['Mara Weiss', 'Jonas Klein'],
    },
    in: {
      parent: ['Asha Iyer', 'Kabir Shah', 'Meera Nair'],
      young: ['Dev', 'Anu'],
      steady: ['Meera Nair', 'Kabir Shah'],
      spark: ['Anu Iyer', 'Dev Shah'],
    },
    br: {
      parent: ['Lucia Ferreira', 'Miguel Santos', 'Ana Costa'],
      young: ['Caio', 'Luna'],
      steady: ['Ana Costa', 'Miguel Santos'],
      spark: ['Luna Ferreira', 'Caio Mendes'],
    },
    ng: {
      parent: ['Amaka Okafor', 'Tobi Adeyemi', 'Zainab Bello'],
      young: ['Seyi', 'Chioma'],
      steady: ['Zainab Bello', 'Tobi Adeyemi'],
      spark: ['Chioma Okafor', 'Seyi Adeyemi'],
    },
  }
  if (given[state.country]) {
    const bag = given[state.country]
    const sur = pick(state, bag.sur)
    return {
      father: `${sur}${pick(state, bag.parent)}`,
      mother: `${pick(state, bag.sur)}${pick(state, bag.parent)}`,
      friend: pick(state, bag.young),
      suitors: [
        { id: 'steady', name: pick(state, bag.steady), temperament: '说话不多，但把日子过得很稳' },
        { id: 'spark', name: pick(state, bag.spark), temperament: '像一扇被推开的窗，亮，也灌风' },
      ],
      child: null,
      exName: null,
    }
  }
  const bag = western[state.country] || western.us
  return {
    father: pick(state, bag.parent),
    mother: pick(state, bag.parent),
    friend: pick(state, bag.young),
    suitors: [
      { id: 'steady', name: pick(state, bag.steady), temperament: '说话不多，但把日子过得很稳' },
      { id: 'spark', name: pick(state, bag.spark), temperament: '像一扇被推开的窗，亮，也灌风' },
    ],
    child: null,
    exName: null,
  }
}

export function defaultPlayerName(state) {
  const names = {
    f: ['林夏', '周晚', '陈禾', '苏宁', 'Elena', 'Mara', 'Asha', 'Luna'],
    m: ['林深', '周予', '陈越', '苏衡', 'Jonah', 'Emil', 'Kabir', 'Caio'],
    x: ['林可', '周安', '陈宁', '苏白', 'Sam', 'Noor', 'Ari', 'Ren'],
  }
  return pick(state, names[state.gender] || names.x)
}

function choice(partial) {
  return partial
}

function endLove(state) {
  if (state.partner) state.people.exName = state.partner.name
  state.partner = null
  state.flags.partnered = false
}

const BUILDERS = {
  birth(state) {
    return {
      intro: `${originParagraph(state)}你的名字写在一张薄纸上。很多年后你才明白，那张纸不是故事的全部，只是它的门口。这是你最早能记住的一个夜晚。`,
      beats: [
        {
          id: 'night',
          goal: '最早的夜晚',
          text: '你大概五岁。黑暗里有电器的嗡嗡声，有人在隔壁把一天的疲倦放下。你醒了。',
          choices: [
            choice({
              id: 'reach',
              text: '摸黑去找大人的手',
              hint: '关系变厚，压力松开一点',
              log: '你在黑夜里摸到一只还没睡热的手。',
              effects: { bonds: 8, stress: -4 },
            }),
            choice({
              id: 'quiet',
              text: '把自己按回枕头里',
              hint: '见识增长，人更会忍',
              log: '你学会在黑夜里不出声。',
              effects: { insight: 6, stress: 3 },
            }),
            choice({
              id: 'cry',
              text: '哭出声，让整间屋子亮起来',
              hint: '有人过来，第二天会更累',
              log: '灯亮了。代价是第二天有人更累。',
              effects: { bonds: 4, stress: 6 },
            }),
          ],
        },
        {
          id: 'window',
          goal: '窗边',
          requires: ['night'],
          text: `窗外面就是你对世界的第一张画。${placeLine(state)}`,
          choices: [
            choice({
              id: 'watch',
              text: '趴在窗边看很久',
              hint: '见识变深',
              log: '你把窗外的路看成了自己的第一课。',
              effects: { insight: 8 },
            }),
            choice({
              id: 'ask',
              text: '拉着大人问外面是什么',
              hint: '关系和见识一起长',
              log: '你问了很多，大人回答到自己也不确定。',
              effects: { bonds: 6, insight: 3 },
            }),
            choice({
              id: 'turn',
              text: '转身回去，守着自己那一小块地',
              hint: '压力下降',
              log: '你暂时不需要整个世界。',
              effects: { stress: -5, bonds: 2 },
            }),
          ],
        },
      ],
    }
  },
  primary(state) {
    return {
      intro: `八岁。教室有粉笔灰的味道。${state.people.friend}总是一个人坐着。分数开始变成家里饭桌上的天气。`,
      beats: [
        {
          id: 'paper',
          goal: '发下来的卷子',
          text: '试卷发下来。分数写在右上角，像一枚小小的章。你能感到后排有人在看你。',
          choices: [
            choice({
              id: 'ask',
              text: '把错题一道道问完',
              hint: '见识上升，压力也上升',
              log: '你把错题留在了桌上，直到它们不再可怕。',
              effects: { insight: 8, stress: 4 },
              apply: (game) => {
                game.flags.diligent = true
              },
            }),
            choice({
              id: 'fold',
              text: '折起来，塞进书包',
              hint: '先让这一天过去',
              log: '卷子在书包里睡了一整个学期。',
              effects: { stress: -2, status: -2 },
            }),
            choice({
              id: 'lie',
              text: '告诉家里一个更好看的数字',
              hint: '关系出现裂缝',
              log: '你说了一个更好看的数字。它比分数更难改。',
              effects: { stress: 6, bonds: -6 },
              apply: (game) => {
                game.flags.lied = true
              },
            }),
          ],
        },
        {
          id: 'classmate',
          goal: `${state.people.friend}的位子`,
          requires: ['paper'],
          text: `${state.people.friend}总是自己坐着，午饭也是。你从自己的位子上看见这件事已经好几天。`,
          choices: [
            choice({
              id: 'sit',
              text: '把椅子拉过去',
              hint: '关系变厚',
              log: `你把椅子拉到了${state.people.friend}旁边。`,
              effects: { bonds: 8, status: -1 },
              apply: (game) => {
                game.flags.friendClose = true
              },
            }),
            choice({
              id: 'share',
              text: '把自己的午饭推过去一半',
              hint: '一份很小的慷慨',
              log: '午饭少了一半，桌子上多了一个人。',
              effects: { bonds: 6 },
              apply: (game) => {
                game.flags.friendClose = true
              },
            }),
            choice({
              id: 'ignore',
              text: '假装没看见',
              hint: '少惹事，也少了一个人',
              log: '你低下头。那张空椅子还在。',
              effects: { status: 3, bonds: -6 },
            }),
          ],
        },
      ],
    }
  },
  middle(state) {
    return {
      intro: '十三岁。身体先于身份长高。家里的声音开始有了缝，学校的操场和作业本在抢同一段下午。',
      beats: [
        {
          id: 'yard',
          goal: '放学的路口',
          text: '球在一边，作业在另一边。家里的期待已经有了声音。你站在路口，书包带勒着肩膀。',
          choices: [
            choice({
              id: 'play',
              text: '留下来打球',
              hint: '身体和朋友，功课先放一放',
              log: '你把下午交给了球场。',
              effects: { health: 6, bonds: 4, stress: -4, insight: -2 },
            }),
            choice({
              id: 'study',
              text: '回教室把题做完',
              hint: '见识上升，人更紧',
              log: '教室里只剩你和还没干的墨水。',
              effects: { insight: 6, stress: 5 },
            }),
            choice({
              id: 'help',
              text: '先去家里帮忙',
              hint: '钱和家，都会记住这件事',
              log: '你先回了家。账本比课本更早合上。',
              effects: { wealth: 4, bonds: 3, stress: 3 },
              apply: (game) => {
                game.flags.helpedHome = true
              },
            }),
          ],
        },
        {
          id: 'argument',
          goal: '门背后的声音',
          requires: ['yard'],
          text: `${state.people.father}和${state.people.mother}的声音压得很低，反而更清楚。你站在门这边。`,
          choices: [
            choice({
              id: 'enter',
              text: '推门进去，站在中间',
              hint: '家里会看见你，压力变大',
              log: '你推开门，站到了两个人中间。',
              effects: { bonds: 4, stress: 8 },
              apply: (game) => {
                game.flags.heard_fight = true
                game.flags.intervened = true
              },
            }),
            choice({
              id: 'listen',
              text: '在门口听完，再离开',
              hint: '你听懂了，也更沉',
              log: '你听完了。有些句子后来很多年还在。',
              effects: { insight: 6, stress: 6 },
              apply: (game) => {
                game.flags.heard_fight = true
              },
            }),
            choice({
              id: 'shut',
              text: '把声音关在门外',
              hint: '这一晚轻一点，家远一点',
              log: '你把那扇门留在身后。',
              effects: { stress: -3, bonds: -5 },
            }),
          ],
        },
      ],
    }
  },
  high(state) {
    return {
      intro: `十七岁。${expectation(state)}职业的倾向你早先选过「${vocationName(state.vocation)}」，可夜晚只认灯和明天的卷子。`,
      beats: [
        {
          id: 'nightstudy',
          goal: '考试前的灯',
          text: '离大考很近的夜晚。灯管有一点响。桌上的范围已经窄成明天会考的那几页。',
          choices: [
            choice({
              id: 'allnight',
              text: '读到天亮',
              hint: '分数会上去，身体先下去',
              log: '你读到了天亮。分数记住了你，睡眠没有。',
              effects: { insight: 8, stress: 10, health: -6 },
              apply: (game) => {
                game.flags.exam = 'high'
              },
            }),
            choice({
              id: 'sleep',
              text: '睡够，把会的题做稳',
              hint: '一条中间的路',
              log: '你睡了。第二天的手没有抖。',
              effects: { insight: 4, stress: 2, health: 2 },
              apply: (game) => {
                game.flags.exam = 'mid'
              },
            }),
            choice({
              id: 'shift',
              text: '夜里去顶班，分数以后再说',
              hint: '家里的账会松一点',
              log: '你把夜晚换成了工钱。',
              effects: { wealth: 8, stress: 6, health: -4 },
              apply: (game) => {
                game.flags.exam = 'low'
                game.flags.helpedHome = true
              },
            }),
          ],
        },
        {
          id: 'want',
          goal: '别人问起以后',
          requires: ['nightstudy'],
          text: '有人问你，以后到底想成为什么样的人。走廊的灯把每个人的脸照得差不多。',
          choices: [
            choice({
              id: 'desire',
              text: '照自己喜欢的说',
              hint: '把欲望说出口',
              log: '你说了自己喜欢的那一个，声音不大。',
              effects: { insight: 6, stress: 2 },
              apply: (game) => {
                game.flags.motive = 'desire'
              },
            }),
            choice({
              id: 'family',
              text: '照家里能安心的说',
              hint: '关系稳住，自己先弯一弯',
              log: '你说了家里听得进去的答案。',
              effects: { bonds: 6, stress: 4 },
              apply: (game) => {
                game.flags.motive = 'family'
              },
            }),
            choice({
              id: 'money',
              text: '照更可能赚钱的说',
              hint: '地位和钱会听见这句话',
              log: '你把以后说成了一条更能换钱的路。',
              effects: { wealth: 4, status: 4 },
              apply: (game) => {
                game.flags.motive = 'money'
              },
            }),
          ],
        },
      ],
    }
  },
  crossroads(state) {
    const uni = canUniversity(state)
    const careers = careerOptions(state).map((career) =>
      choice({
        id: career.id,
        text: career.name,
        hint: career.blurb,
        log: `你把前路放在「${career.name}」上。`,
        effects:
          career.id === 'founder'
            ? { stress: 6, status: 4, wealth: 2 }
            : career.id === 'doctor'
              ? { status: 8, stress: 6, insight: 4 }
              : career.id === 'finance'
                ? { wealth: 6, status: 6, stress: 4 }
                : { status: 4, wealth: 2 },
        apply: (game) => applyCareer(game, career),
      }),
    )
    return {
      intro: uni
        ? '十九岁。门是开着的：你可以继续读书，也可以现在就去挣钱。公告栏上的字比劝你的人更冷静。'
        : '十九岁。大学的门没有为你开，或者开得很窄。招聘启事、夜校和家里的电话在同一面墙上。',
      beats: [
        {
          id: 'career',
          goal: uni ? '公告栏' : '招聘启事',
          text: uni
            ? '你可以走上求学的路，也可以把学历先放一放。选一个接下来许多年都会用来介绍自己的名字。'
            : '这里没有典礼。选择更具体：下一班车去上班，还是给自己留一条晚上还能学的缝。',
          choices: careers,
        },
        {
          id: 'road',
          goal: '路往哪边',
          requires: ['career'],
          text: '工作或学校定了大致的形状。剩下的是你要把这副形状放在哪里生活。',
          choices: [
            choice({
              id: 'metro',
              text: '留在机会更密的地方',
              hint: '地位和钱更多，人也更紧',
              log: '你留在了机会更密的地方。',
              effects: { status: 6, stress: 6, wealth: 4, bonds: -2 },
              apply: (game) => {
                game.flags.sceneLean = 'metro'
              },
            }),
            choice({
              id: 'home',
              text: '回到熟悉的口音里',
              hint: '关系回来，速度放慢',
              log: '你回到了熟悉的口音里。',
              effects: { bonds: 8, stress: -4, status: -2 },
              apply: (game) => {
                game.flags.sceneLean = 'home'
              },
            }),
            choice({
              id: 'abroad',
              text: '去一个谁也不认识你的地方',
              hint: '见识大开，旧关系变远',
              log: '你去了谁也不认识你的地方。',
              effects: { insight: 8, bonds: -4, stress: 6, status: 3 },
              apply: (game) => {
                game.flags.sceneLean = 'abroad'
              },
            }),
          ],
        },
      ],
    }
  },
  family(state) {
    if (state.flags.familyScene === 'split') {
      return {
        intro: `二十七岁。纸箱比家具先占据房间。${state.people.father}和${state.people.mother}的日子要分成两半。${state.family === 'single' ? '这件事你其实从小就在等一个正式的名字。' : '你曾经听过他们吵架，现在吵架有了地址。'}`,
        beats: [
          {
            id: 'boxes',
            goal: '纸箱',
            text: '胶带的声音比谈话更忙。有人问你东西放哪一边，好像你的手能决定一个家。',
            choices: [
              choice({
                id: 'fair',
                text: '帮他们分开，不站队',
                hint: '你保持清楚，心会很累',
                log: '你帮他们把东西分开，自己站在胶带中间。',
                effects: { insight: 6, bonds: 2, stress: 6 },
              }),
              choice({
                id: 'side',
                text: '明确跟其中一边走',
                hint: '一边的关系变厚，压力更大',
                log: '你选了一边。另一边的灯你还会看见。',
                effects: { bonds: 6, stress: 8 },
                apply: (game) => {
                  game.flags.tookSide = true
                },
              }),
              choice({
                id: 'friend',
                text: `躲去${state.people.friend}那里，直到搬完`,
                hint: '这一阵轻一点',
                log: `你躲去了${state.people.friend}那里。纸箱在没有你的时候封口。`,
                effects: { stress: -2, bonds: -2 },
                apply: (game) => {
                  game.flags.friendClose = true
                },
              }),
            ],
          },
          {
            id: 'choice',
            goal: '两扇门',
            requires: ['boxes'],
            text: '以后的节日、生病和电话，都要经过两扇门。你得决定自己怎么走。',
            choices: [
              choice({
                id: 'both',
                text: '节日来回跑',
                hint: '两边都在，人也更累',
                log: '你开始在两扇门之间跑。',
                effects: { bonds: 6, stress: 6 },
              }),
              choice({
                id: 'one',
                text: '把重心放在一个人身上',
                hint: '生活简单一点',
                log: '你把重心放在了一个人身上。',
                effects: { bonds: 4, stress: 2 },
              }),
              choice({
                id: 'earn',
                text: '更早地赚钱，让场面不要太难看',
                hint: '钱增加，关系变薄',
                log: '你用钱把场面撑住，话却更少了。',
                effects: { wealth: 6, stress: 8, bonds: -3 },
              }),
            ],
          },
        ],
      }
    }
    return {
      intro: `二十七岁。医院的灯把所有人照得差不多苍白。${state.people.father}和${state.people.mother}的名字出现在同一张单子上，或其中一位先坐下。走廊很长。`,
      beats: [
        {
          id: 'bedside',
          goal: '床边',
          text: '仪器的声音很有礼貌，一下，又一下。还有能说话的时间，但没有人知道还有多少。',
          choices: [
            choice({
              id: 'stay',
              text: '请假留下来',
              hint: '人在床边，工作和钱会受影响',
              log: '你请了假，把椅子拉到床边。',
              effects: { bonds: 10, wealth: -6, stress: 6 },
              apply: (game) => {
                game.flags.filial = true
              },
            }),
            choice({
              id: 'call',
              text: '每天打电话，人留在岗位上',
              hint: '工作不断，有些话会晚',
              log: '你打了电话。有些话在忙音里没说完。',
              effects: { wealth: 4, bonds: -2, stress: 4 },
            }),
            choice({
              id: 'speak',
              text: '把话趁还能说的时候说完',
              hint: '关系被补上一块',
              log: '你把一直没说的话说完了。',
              effects: { bonds: 8, insight: 4, stress: 4 },
              apply: (game) => {
                game.flags.filial = true
              },
            }),
          ],
        },
        {
          id: 'bill',
          goal: '费用',
          requires: ['bedside'],
          text: '更好的治疗在另一张单子上。数字很冷静。亲戚在走廊里等你先开口。',
          choices: [
            choice({
              id: 'pay',
              text: '换更好的治疗，哪怕把积蓄掏空',
              hint: '财富大幅下降，关系上升',
              log: '你把积蓄换成了更好的治疗。',
              effects: { wealth: -28, bonds: 10, status: 2 },
              apply: (game) => {
                game.flags.filial = true
              },
            }),
            choice({
              id: 'enough',
              text: '按家里承受得起的来',
              hint: '一条不英雄的界线',
              log: '你按承受得起的范围做了决定。',
              effects: { bonds: 2, stress: 3 },
            }),
            choice({
              id: 'share',
              text: '让亲戚一起分担',
              hint: '钱的压力散开，面子也会',
              log: '你把单子摊开给亲戚看。',
              effects: { bonds: 4, wealth: -6, status: -2 },
              apply: (game) => {
                game.flags.filial = true
              },
            }),
          ],
        },
      ],
    }
  },
  romance(state) {
    const [steady, spark] = state.people.suitors
    return {
      intro: `二十九岁。你在${leanPlace(state)}遇见人。遇见的不只是脸，是一种你没过过的日子。`,
      beats: [
        {
          id: 'meet',
          goal: '两个人',
          text: `${steady.name}${steady.temperament}。${spark.name}${spark.temperament}。公园的长椅只够你先走向一个方向。`,
          choices: [
            choice({
              id: 'steady',
              text: `走向${steady.name}`,
              hint: '一段更稳的关系',
              log: `你走向了${steady.name}。`,
              effects: { bonds: 8, stress: 1 },
              apply: (game) => {
                game.partner = game.people.suitors[0]
                game.flags.partnered = true
              },
            }),
            choice({
              id: 'spark',
              text: `走向${spark.name}`,
              hint: '更亮，也更耗神',
              log: `你走向了${spark.name}。`,
              effects: { bonds: 6, insight: 4, stress: 4 },
              apply: (game) => {
                game.partner = game.people.suitors[1]
                game.flags.partnered = true
              },
            }),
            choice({
              id: 'leave',
              text: '把名字记住，人先离开',
              hint: '保持自己的形状',
              log: '你把名字记住了，人先离开。',
              effects: { insight: 4, stress: -2 },
              apply: (game) => {
                game.flags.declinedLove = true
              },
            }),
          ],
        },
        {
          id: 'distance',
          goal: '晚上怎么过',
          requires: ['meet'],
          text: state.partner
            ? `${state.partner.name}开始占用真实的晚上。关系一旦落地，就要决定钥匙、房间和以后的电话。`
            : '你一个人走在公园边上。城市很吵，你的生活轮廓却很清楚。',
          choices: state.partner
            ? [
                choice({
                  id: 'key',
                  text: '把钥匙给对方一份',
                  hint: '关系更深',
                  log: '你多配了一把钥匙。',
                  effects: { bonds: 8, stress: 2 },
                  apply: (game) => {
                    game.flags.committedLean = true
                  },
                }),
                choice({
                  id: 'rooms',
                  text: '保持各自的房间',
                  hint: '靠近，但不合并',
                  log: '你们靠近着，房间还是各自的。',
                  effects: { insight: 4, bonds: 2 },
                  apply: (game) => {
                    game.flags.slowLove = true
                  },
                }),
                choice({
                  id: 'stepback',
                  text: '把刚刚的靠近收回来',
                  hint: '关系中断',
                  log: '你把刚刚的靠近收回来了。',
                  effects: { bonds: -6, stress: 4 },
                  apply: (game) => endLove(game),
                }),
              ]
            : [
                choice({
                  id: 'clear',
                  text: '享受这种清楚',
                  hint: '压力下降',
                  log: '你允许生活就这样清楚着。',
                  effects: { stress: -6, insight: 4 },
                }),
                choice({
                  id: 'text',
                  text: `给${state.people.friend}发消息`,
                  hint: '旧的关系还在',
                  log: `你给${state.people.friend}发了消息。对方秒回。`,
                  effects: { bonds: 6 },
                  apply: (game) => {
                    game.flags.friendClose = true
                  },
                }),
                choice({
                  id: 'work',
                  text: '把晚上全部交给工作',
                  hint: '钱和地位上升',
                  log: '你把晚上交给了工作。',
                  effects: { wealth: 6, status: 4, bonds: -4, stress: 4 },
                }),
              ],
        },
      ],
    }
  },
  commitment(state) {
    if (state.partner) {
      return {
        intro: `三十一岁。${state.partner.name}在场。仪式可大可小，问题只有一个：你们要不要用婚姻这个字。`,
        beats: [
          {
            id: 'vow',
            goal: '要不要说出口',
            text: `${state.partner.name}看着你。亲友的位置还空着，话已经到了嘴里。`,
            choices: [
              choice({
                id: 'marry',
                text: '结婚',
                hint: '关系与地位上升，要花钱',
                log: `你和${state.partner.name}结了婚。`,
                effects: { bonds: 10, wealth: -8, status: 4, stress: 2 },
                apply: (game) => {
                  game.flags.married = true
                  game.flags.unmarried = false
                  game.flags.cohabit = false
                },
              }),
              choice({
                id: 'cohabit',
                text: '不结婚，但生活在一起',
                hint: '在一起，不办那个仪式',
                log: `你和${state.partner.name}生活在一起，没有结婚。`,
                effects: { bonds: 6, stress: -1 },
                apply: (game) => {
                  game.flags.cohabit = true
                  game.flags.unmarried = true
                  game.flags.married = false
                },
              }),
              choice({
                id: 'stop',
                text: '在最后一步停下',
                hint: '关系结束',
                log: '你在最后一步停下了。',
                effects: { bonds: -8, stress: 6, insight: 3 },
                apply: (game) => {
                  endLove(game)
                  game.flags.unmarried = true
                },
              }),
            ],
          },
          {
            id: 'witness',
            goal: '谁知道这件事',
            requires: ['vow'],
            text: state.flags.married || state.flags.cohabit
              ? '这件事要告诉谁。前排的位子比誓词更像生活。'
              : '你已经停下了。接下来是怎么把这个决定告诉还在等消息的人。',
            choices: [
              choice({
                id: 'parents',
                text: '先告诉父母',
                hint: '家会进来',
                log: '你先告诉了父母。',
                effects: { bonds: 5, stress: 4 },
              }),
              choice({
                id: 'friends',
                text: `告诉${state.people.friend}`,
                hint: '让朋友做证人',
                log: `${state.people.friend}知道了。`,
                effects: { bonds: 4 },
              }),
              choice({
                id: 'alone',
                text: '先只留给自己',
                hint: '安静，也孤立',
                log: '你把这件事先留给了自己。',
                effects: { insight: 2, stress: -2, bonds: -2 },
              }),
            ],
          },
        ],
      }
    }
    return {
      intro: '三十一岁。没有婚礼要去。城市的晚上照常亮着，你要决定这一户怎么算。',
      beats: [
        {
          id: 'vow',
          goal: '这一户',
          text: '家里可能在问，朋友可能在介绍。你自己的房子里只有你的杯子。',
          choices: [
            choice({
              id: 'brief',
              text: '接受一段知道会结束的陪伴',
              hint: '短暂的热，然后还是自己',
              log: '你接受了一段知道会结束的陪伴。',
              effects: { bonds: 3, stress: 2, insight: 2 },
              apply: (game) => {
                game.flags.unmarried = true
              },
            }),
            choice({
              id: 'solo',
              text: '把自己的生活过完整',
              hint: '不结婚，压力下降',
              log: '你决定不结婚，先把自己的生活过完整。',
              effects: { stress: -4, insight: 4, status: 2 },
              apply: (game) => {
                game.flags.unmarried = true
                game.flags.soloForever = true
              },
            }),
            choice({
              id: 'familyplan',
              text: '答应家里的安排，见一个人',
              hint: '关系上升，自己要弯一弯',
              log: '你答应家里去见一个人。',
              effects: { bonds: 5, stress: 5 },
              apply: (game) => {
                game.partner = game.people.suitors[0]
                game.flags.partnered = true
                game.flags.cohabit = true
                game.flags.unmarried = true
              },
            }),
          ],
        },
        {
          id: 'witness',
          goal: '怎么告诉家里',
          requires: ['vow'],
          text: '家里的电话总会打来。你要给他们一个能转述给亲戚的句子。',
          choices: [
            choice({
              id: 'plain',
              text: '照实说',
              hint: '清楚，可能有一阵沉默',
              log: '你照实说了。电话那头沉默了一会儿。',
              effects: { bonds: 2, stress: 3, insight: 2 },
            }),
            choice({
              id: 'later',
              text: '说以后再说',
              hint: '这一阵安稳',
              log: '你说了以后再说。',
              effects: { stress: -2, bonds: -2 },
            }),
            choice({
              id: 'work',
              text: '把成就报上去，私事带过',
              hint: '地位能让家里安心一点',
              log: '你报了成就，把私事带了过去。',
              effects: { status: 3, stress: 2 },
            }),
          ],
        },
      ],
    }
  },
  child(state) {
    const withWhom = state.partner ? `和${state.partner.name}` : '你一个人'
    return {
      intro: `三十四岁。${withWhom}看着多出来的那间房。它可以是婴儿床，也可以是别的东西。`,
      beats: [
        {
          id: 'question',
          goal: '那间房',
          text: state.partner
            ? `${state.partner.name}问你：我们要不要一个孩子。问题不大，它会占据后面很多年。`
            : '没有人催你回答。可那间空房每天都在问同一件事。',
          choices: [
            choice({
              id: 'yes',
              text: state.partner ? '我们要一个孩子' : '我自己抚养一个孩子',
              hint: '健康和钱都会付出，关系变厚',
              log: '你决定抚养一个孩子。',
              effects: state.partner
                ? { health: -8, wealth: -10, bonds: 8, stress: 4 }
                : { health: -8, wealth: -12, bonds: 4, stress: 8 },
              apply: (game) => {
                game.flags.parent = true
                game.people.child = childName(game)
                if (!game.partner) game.flags.soloParent = true
              },
            }),
            choice({
              id: 'no',
              text: '不要孩子',
              hint: '把生活留在这一代',
              log: '你决定不要孩子。',
              effects: { insight: 2, stress: -3 },
              apply: (game) => {
                game.flags.childfree = true
              },
            }),
            choice({
              id: 'later',
              text: '再等几年',
              hint: '把问题往后放',
              log: '你说再等几年。',
              effects: { stress: 2 },
              apply: (game) => {
                game.flags.childLater = true
              },
            }),
          ],
        },
        {
          id: 'name',
          goal: state.flags.parent ? '名字' : '空房间',
          requires: ['question'],
          text: state.flags.parent
            ? `${state.people.child}需要一个名字。姓氏是一种很旧的绳子。`
            : '房间空着。空着也是一种决定。',
          choices: state.flags.parent
            ? [
                choice({
                  id: 'yours',
                  text: '随你的姓',
                  hint: '把血缘写进名字',
                  log: `${state.people.child}随了你的姓。`,
                  effects: { bonds: 3, status: 1 },
                }),
                choice({
                  id: 'other',
                  text: state.partner ? `随${state.partner.name}的姓` : '取一个不随任何人的名字',
                  hint: '绳子可以换一边系',
                  log: state.partner ? `${state.people.child}随了伴侣的姓。` : `${state.people.child}的名字不随任何人。`,
                  effects: { bonds: 3, insight: 2 },
                }),
                choice({
                  id: 'free',
                  text: '告诉孩子，以后可以自己改',
                  hint: '把选择留给下一辈',
                  log: '你把改名的权利留给了孩子。',
                  effects: { insight: 4, bonds: 2 },
                }),
              ]
            : [
                choice({
                  id: 'studio',
                  text: '把那间房做成自己的工作室',
                  hint: '见识和作品会回来',
                  log: '空房间变成了你的工作室。',
                  effects: { insight: 6, stress: -2 },
                }),
                choice({
                  id: 'parents',
                  text: '让父母来住一阵',
                  hint: '家回来，安静减少',
                  log: '父母的声音在那间房里住了一阵。',
                  effects: { bonds: 6, stress: 4 },
                }),
                choice({
                  id: 'empty',
                  text: '空着也没关系',
                  hint: '压力下降',
                  log: '你允许那间房空着。',
                  effects: { stress: -4 },
                }),
              ],
        },
      ],
    }
  },
  rift(state) {
    const who = state.partner?.name || state.people.exName || '那个人'
    return {
      intro: `四十一岁。和${who}的对话开始绕开一些句子。绕开本身变成了家里最大的家具。`,
      beats: [
        {
          id: 'talk',
          goal: '没说完的话',
          text: `晚饭还是热的。${who}问你今天怎么样，你们都知道这不是真正的问题。`,
          choices: [
            choice({
              id: 'repair',
              text: '坐下来把绕开的东西说完',
              hint: '关系可能被补上',
              log: '你们把绕开的东西说完了。',
              effects: { bonds: 8, stress: -4 },
              apply: (game) => {
                game.flags.repaired = true
              },
            }),
            choice({
              id: 'leave',
              text: '提出分开',
              hint: '婚姻或同居结束，钱会分薄',
              log: `你提出和${who}分开。`,
              effects: { wealth: -12, bonds: -8, stress: 8, status: -2 },
              apply: (game) => {
                game.flags.divorced = true
                game.flags.married = false
                game.flags.cohabit = false
                if (game.flags.parent) game.flags.sharedCustody = true
                endLove(game)
              },
            }),
            choice({
              id: 'busy',
              text: '装作这只是忙',
              hint: '表面不动，压力堆积',
              log: '你说只是忙。忙成了一面墙。',
              effects: { stress: 10, bonds: -4 },
            }),
          ],
        },
        {
          id: 'papers',
          goal: state.flags.divorced ? '签字' : '之后的日子',
          requires: ['talk'],
          text: state.flags.divorced
            ? `纸要签字。${state.flags.parent ? `${state.people.child}的时间也在纸上。` : '没有孩子的名字，只有两个人的地址要分开。'}`
            : '话说开了，或者没说开。生活还要继续到明天早上。',
          choices: state.flags.divorced
            ? [
                choice({
                  id: 'clean',
                  text: '签得干净',
                  hint: '少争一点，早一点结束',
                  log: '你把字签得很干净。',
                  effects: { wealth: -4, stress: -2 },
                }),
                choice({
                  id: 'custody',
                  text: state.flags.parent ? '为孩子争更多时间' : '把共同的东西一件件分开',
                  hint: '还会再耗一阵',
                  log: state.flags.parent ? '你为孩子争了更多时间。' : '你们把东西一件件分开了。',
                  effects: state.flags.parent ? { bonds: 4, stress: 6, wealth: -4 } : { stress: 3, insight: 2 },
                }),
                choice({
                  id: 'soup',
                  text: '签完去喝一碗很烫的汤',
                  hint: '让身体先回来',
                  log: '你签完字，去喝了一碗很烫的汤。',
                  effects: { stress: -4, health: 2 },
                }),
              ]
            : [
                choice({
                  id: 'trip',
                  text: '一起去旅行一次，不谈工作',
                  hint: '花钱，关系回暖',
                  log: '你们去旅行了一次，工作留在家里。',
                  effects: { bonds: 6, wealth: -6, stress: -6 },
                }),
                choice({
                  id: 'split-chores',
                  text: '把账单和家务重新摊开',
                  hint: '生活变得公平一点',
                  log: '你们把账单和家务重新摊开。',
                  effects: { stress: -4, bonds: 4 },
                }),
                choice({
                  id: 'withhold',
                  text: '留着一点不说的话',
                  hint: '你还是保留了自己',
                  log: '你留着一点不说的话。',
                  effects: { stress: 4, insight: 2 },
                }),
              ],
        },
      ],
    }
  },
  midlife(state) {
    const job = state.career?.name || '谋生'
    return {
      intro: `四十八岁。你做的是${job}，人站在「${state.tier}」。${leanSentence(state)}${expectation(state)}一个机会来了，它认得你的履历，不认得你的睡眠。`,
      beats: [
        {
          id: 'peak',
          goal: '那个机会',
          text: '它能把阶层再推一把。代价是晚上、身体，以及还愿意等你的人。',
          choices: [
            choice({
              id: 'take',
              text: '接住它',
              hint: '地位和钱上升，健康下降',
              log: '你接住了那个机会，也交出了晚上。',
              effects: { status: 14, stress: 12, health: -8, wealth: 10 },
            }),
            choice({
              id: 'pass',
              text: '把机会让给还能熬夜的人',
              hint: '压力下降，地位停一停',
              log: '你把机会让了出去。',
              effects: { stress: -6, bonds: 4, insight: 4, status: -2 },
            }),
            choice({
              id: 'bet',
              text: '用它换一件属于自己的小事',
              hint: '有可能翻身，也可能亏一截',
              log: '你把机会换成了自己的一注。',
              resolve(game) {
                const chance =
                  0.42 +
                  (game.skills.includes('nerve') ? 0.12 : 0) +
                  (game.insight > 60 ? 0.1 : 0) +
                  (game.skills.includes('craft') && game.career?.id === 'craft' ? 0.08 : 0)
                const ok = rand(game) < Math.min(0.84, chance)
                if (ok) {
                  return {
                    effects: { wealth: 26, status: 12, stress: 10, health: -4 },
                    log: '你押上的那一次，成了。',
                    resultText: '没有人保证过。但这次账是对的。你站得比上个月高，睡眠比上个月差。',
                  }
                }
                return {
                  effects: { wealth: -18, status: -6, stress: 14, insight: 6 },
                  log: '你押上的那一次，没有成。',
                  resultText: '事情没有按你讲给自己听的那样发生。钱薄了一截，眼睛却更准了。',
                }
              },
            }),
          ],
        },
        {
          id: 'cost',
          goal: '来收账的人',
          requires: ['peak'],
          text: '身体或者关系来收账了。你不能再假装这只是忙季。',
          choices: [
            choice({
              id: 'clinic',
              text: '去检查，按医嘱过日子',
              hint: '健康回来一些，要花钱',
              log: '你去检查了，并按医嘱把日子放慢。',
              effects: { health: 10, wealth: -6, stress: -4 },
            }),
            choice({
              id: 'push',
              text: '继续扛，等到这阵忙完',
              hint: '钱还在进，身体在透支',
              log: '你说等忙完。忙完的日期没有写在任何地方。',
              effects: { health: -8, wealth: 6, stress: 6 },
            }),
            choice({
              id: 'dinner',
              text: '回家把饭吃完，再谈别的',
              hint: '关系回一点',
              log: '你先回家把饭吃完。',
              effects: { bonds: 8, stress: -4, health: 2 },
            }),
          ],
        },
      ],
    }
  },
  elder(state) {
    const childLine = state.flags.parent ? `${state.people.child}有时会来，有时只是一条消息。` : '没有孩子来敲门。'
    return {
      intro: `七十二岁。${childLine}长椅上的风没有目的。你的阶层是「${state.tier}」，可风不管这个。`,
      beats: [
        {
          id: 'bench',
          goal: '长椅',
          text: '一个年轻人问你：值得吗。你的膝盖比回答更慢。',
          choices: [
            choice({
              id: 'people',
              text: '值得，因为有人在',
              hint: '如果真的有人，这句话会站住',
              log: '你说值得，因为有人在。',
              resolve(game) {
                if (game.bonds >= 45 || game.flags.parent || game.partner) {
                  return {
                    effects: { bonds: 4, stress: -3 },
                    log: '你说值得，因为有人在。这句话站得住。',
                    resultText: '年轻人点了点头。你知道自己没有说得比生活更满。',
                  }
                }
                return {
                  effects: { insight: 3, stress: 2 },
                  log: '你说值得，因为有人在。风把这句话吹得很轻。',
                  resultText: '说完你自己听见了空的地方。年轻人没有追问，这是礼貌，也是放过。',
                }
              },
            }),
            choice({
              id: 'self',
              text: '值得，因为你终于能自己做主',
              hint: '把答案放在自己这边',
              log: '你说值得，因为后来的决定是自己做的。',
              effects: { insight: 4, stress: -2 },
            }),
            choice({
              id: 'withhold',
              text: '不把答案交给对方',
              hint: '有些账不必公开',
              log: '你笑了一下，没有把答案交出去。',
              effects: { stress: -2, insight: 2 },
            }),
          ],
        },
        {
          id: 'letter',
          goal: '一封旧信',
          requires: ['bench'],
          text: state.flags.lied
            ? '口袋里有一封没寄出的信。里面有你小时候说过的那个更好看的数字。'
            : state.flags.friendClose
              ? `${state.people.friend}的字迹还在一张旧纸上。纸边已经软了。`
              : '你给自己留过一张纸条，字迹年轻得几乎不礼貌。',
          choices: [
            choice({
              id: 'write',
              text: '写回去',
              hint: '把关系再续上一句',
              log: '你写了回去。',
              effects: { bonds: 4, insight: 4 },
            }),
            choice({
              id: 'pocket',
              text: '放进口袋，不打开',
              hint: '让它继续当一块石头',
              log: '你把信放回口袋，没有打开。',
              effects: { stress: 2 },
            }),
            choice({
              id: 'tear',
              text: '读完，轻轻撕掉',
              hint: '放下一点旧账',
              log: '你读完，把纸轻轻撕了。',
              effects: { stress: -6, insight: 2 },
            }),
          ],
        },
      ],
    }
  },
  death(state) {
    return {
      intro: `${state.deathAge || state.age}岁。水很平。没有人要求你解释病情。你只需要决定回头看什么，以及留下哪一句。`,
      beats: [
        {
          id: 'back',
          goal: '要不要回头',
          text: '码头还在。后面是你来的方向：人、工作、房间和那些没说完的晚饭。',
          choices: [
            choice({
              id: 'people',
              text: '回头看人',
              hint: '把最后一眼交给关系',
              log: '你回头看了人。',
              effects: { bonds: 2 },
              apply: (game) => {
                game.flags.lastLook = 'people'
              },
            }),
            choice({
              id: 'work',
              text: '回头看自己做成的事',
              hint: '把最后一眼交给作品和地位',
              log: '你回头看了自己做成的事。',
              effects: { status: 1, insight: 1 },
              apply: (game) => {
                game.flags.lastLook = 'work'
              },
            }),
            choice({
              id: 'water',
              text: '不回头，看水面',
              hint: '让最后一刻保持安静',
              log: '你没有回头。',
              effects: { stress: -4 },
              apply: (game) => {
                game.flags.lastLook = 'water'
              },
            }),
          ],
        },
        {
          id: 'boat',
          goal: '留下的一句',
          requires: ['back'],
          text: '这句话会写在别人记得住的地方。它不必完整，但得是你的。',
          choices: [
            choice({
              id: 'tried',
              text: '我试过了',
              hint: '结束这次人生',
              log: '你留下的一句是：我试过了。',
              endsLife: true,
              apply: (game) => {
                game.flags.epitaphTone = 'tried'
              },
            }),
            choice({
              id: 'loved',
              text: '我爱过一些人',
              hint: '结束这次人生',
              log: '你留下的一句是：我爱过一些人。',
              endsLife: true,
              apply: (game) => {
                game.flags.epitaphTone = 'loved'
              },
            }),
            choice({
              id: 'free',
              text: '我自由过，哪怕只有一会儿',
              hint: '结束这次人生',
              log: '你留下的一句是：我自由过，哪怕只有一会儿。',
              endsLife: true,
              apply: (game) => {
                game.flags.epitaphTone = 'free'
              },
            }),
          ],
        },
      ],
    }
  },
}

function leanPlace(state) {
  if (state.flags.sceneLean === 'home') return '故乡'
  if (state.flags.sceneLean === 'abroad') return '异乡'
  if (state.flags.sceneLean === 'metro') return '大城里'
  return '生活正在发生的地方'
}

function leanSentence(state) {
  if (state.flags.sceneLean === 'metro') return '人留在机会更密的地方。'
  if (state.flags.sceneLean === 'home') return '人回到了熟悉的口音里。'
  if (state.flags.sceneLean === 'abroad') return '人在谁也不认识自己的地方生活了很多年。'
  return ''
}

export function nextChapterId(state, from = state.chapterId) {
  const index = FLOW.indexOf(from)
  for (let cursor = index + 1; cursor < FLOW.length; cursor += 1) {
    const id = FLOW[cursor]
    if (id === 'rift' && !(state.flags.married || state.flags.cohabit)) continue
    return id
  }
  return null
}

export function prepareChapter(state) {
  if (state.chapterId === 'family' && !state.flags.familyScene) {
    const split =
      state.family === 'single' ||
      (state.family === 'hard' && rand(state) < 0.58) ||
      (!!state.flags.heard_fight && rand(state) < 0.7)
    state.flags.familyScene = split ? 'split' : 'hospital'
    if (split) state.flags.parentsDivorced = true
  }
  if (state.chapterId === 'elder' && !state.flags.elderPrepared) {
    state.health = clamp(state.health - 7)
    state.stress = clamp(state.stress - 8)
    state.flags.elderPrepared = true
  }
  if (state.chapterId === 'death' && !state.deathAge) {
    state.deathAge = clamp(76 + Math.round((state.health - 50) / 3), 64, 99)
  }
}

export function chapterAge(state) {
  if (state.chapterId === 'death') return state.deathAge || CHAPTER_AGE.death
  return CHAPTER_AGE[state.chapterId]
}

export function getChapterView(state) {
  const id = state.chapterId
  const sceneId = sceneFor(state)
  const built = BUILDERS[id](state)
  const layout = getLayout(sceneId)
  return {
    id,
    title: TITLES[id],
    age: chapterAge(state),
    sceneId,
    playerScale: SCALES[id] || 1,
    dress: dressFor(state),
    terminal: id === 'death',
    intro: built.intro,
    spawn: layout.spawn,
    exit: id === 'death' ? null : { ...layout.points.exit, label: '把这段日子带出门' },
    beats: built.beats.map((beat) => {
      const point = layout.points[beat.id]
      if (!point) throw new Error(`场景 ${sceneId} 缺少点位 ${beat.id}`)
      return { ...beat, x: point.x, z: point.z }
    }),
  }
}

function sceneFor(state) {
  const id = state.chapterId
  if (id === 'crossroads') return canUniversity(state) ? 'campus' : 'work'
  if (id === 'family') return state.flags.familyScene === 'split' ? 'split' : 'hospital'
  if (id === 'commitment') return state.partner ? 'wedding' : 'apartment'
  if (id === 'child' || id === 'rift') return 'apartment'
  if (id === 'midlife') return 'work'
  if (id === 'romance' || id === 'elder') return 'park'
  if (id === 'death') return 'shore'
  if (id === 'birth') return 'home'
  return 'school'
}

function dressFor(state) {
  const id = state.chapterId
  if (id === 'high') return 'schoolNight'
  if (id === 'middle') return 'schoolMid'
  if (id === 'primary') return 'school'
  if (id === 'birth') return state.wealth < 28 ? 'homePoor' : state.wealth > 62 ? 'homeRich' : 'home'
  if (id === 'family') return state.flags.familyScene === 'split' ? 'split' : 'hospital'
  if (id === 'romance') return 'park'
  if (id === 'commitment') return state.partner ? 'wedding' : 'apartment'
  if (id === 'rift') return 'split'
  if (id === 'child') return 'apartment'
  if (id === 'midlife') return 'work'
  if (id === 'elder') return 'park'
  if (id === 'death') return 'shore'
  if (id === 'crossroads') return canUniversity(state) ? 'campus' : 'work'
  return 'home'
}

const TONE_LINE = {
  tried: '留下的那句是：我试过了。',
  loved: '留下的那句是：我爱过一些人。',
  free: '留下的那句是：我自由过，哪怕只有一会儿。',
}

export function makeEpitaph(state) {
  const school = state.flags.university
    ? `后来读了书，以「${state.career?.name || '求学'}」谋生。`
    : `后来很早开始工作，以「${state.career?.name || '谋生'}」度日。`
  const family = state.flags.parentsDivorced
    ? '父母的家分成了两半。'
    : '父母的病把家里的人叫回了同一盏灯下。'
  let love
  if (state.flags.divorced) love = `和${state.people.exName || '伴侣'}结过婚，也分开过。`
  else if (state.flags.married) love = `和${state.partner?.name || '伴侣'}结了婚。`
  else if (state.flags.cohabit) love = `和${state.partner?.name || '一个人'}生活在一起，没有结婚。`
  else love = '婚姻没有发生。日子仍然发生了。'
  let child
  if (state.flags.parent) child = `抚养了${state.people.child}。`
  else if (state.flags.childfree) child = '没有把人生交给下一代。'
  else child = '孩子这件事被往后放，直到它不再被提起。'
  const look =
    state.flags.lastLook === 'people' ? '最后回头看了人。' : state.flags.lastLook === 'work' ? '最后回头看了做成的事。' : '最后没有回头。'
  return {
    name: state.name,
    age: state.deathAge || state.age,
    tier: state.tier,
    tierLine: TIER_COPY[state.tier] || '',
    tone: state.flags.epitaphTone || 'tried',
    paragraphs: [
      `${originParagraph(state)}起步时，生活站在「${state.startTier}」。`,
      `${school}${leanSentence(state)}${family}`,
      `${love}${child}`,
      `在${state.deathAge || state.age}岁离开，最后站在「${state.tier}」。${look}${TONE_LINE[state.flags.epitaphTone] || ''}`,
    ],
    timeline: state.log,
  }
}

export function computeTier(state) {
  const power = state.wealth * 0.55 + state.status * 0.45
  if (state.wealth >= 84 && state.stress <= 70 && power >= 72) return '财富自由'
  if (power >= 74 && state.wealth >= 55) return '精英'
  if (power >= 46) return '中层'
  return '平民'
}
