export const ACHIEVEMENTS = [
  {
    id: 'FIRST_BREATH',
    name: '第一口呼吸',
    description: '开始一次人生',
    test: (_state, ctx) => ctx.type === 'begin',
  },
  {
    id: 'MIDDLE',
    name: '中层',
    description: '生活站上中层',
    test: (state) => state.tier === '中层' || state.tier === '精英' || state.tier === '财富自由',
  },
  {
    id: 'ELITE',
    name: '精英',
    description: '走进精英层',
    test: (state) => state.tier === '精英' || state.tier === '财富自由',
  },
  {
    id: 'FREE',
    name: '财富自由',
    description: '钱不再规定你的早晨',
    test: (state) => state.tier === '财富自由',
  },
  {
    id: 'MARRIED',
    name: '结盟',
    description: '结婚',
    test: (state) => !!state.flags.married,
  },
  {
    id: 'UNMARRIED',
    name: '自成一户',
    description: '选择不结婚',
    test: (state) => !!state.flags.unmarried,
  },
  {
    id: 'DIVORCED',
    name: '分开',
    description: '经历离婚',
    test: (state) => !!state.flags.divorced,
  },
  {
    id: 'PARENT',
    name: '下一代',
    description: '抚养孩子',
    test: (state) => !!state.flags.parent,
  },
  {
    id: 'UNIVERSITY',
    name: '入学',
    description: '走上求学的路',
    test: (state) => !!state.flags.university,
  },
  {
    id: 'EARLY_WORK',
    name: '先上班',
    description: '很早进入工作',
    test: (state) => !!state.flags.earlyWork,
  },
  {
    id: 'RAGS',
    name: '往上走',
    description: '从拮据起步，走到精英或财富自由',
    test: (state) => state.startWealth <= 24 && (state.tier === '精英' || state.tier === '财富自由'),
  },
  {
    id: 'FILIAL',
    name: '病床边',
    description: '把时间和钱花在父母身上',
    test: (state) => !!state.flags.filial,
  },
  {
    id: 'SPLIT_HOME',
    name: '两扇门',
    description: '经历父母分开',
    test: (state) => !!state.flags.parentsDivorced,
  },
  {
    id: 'LONG_LIFE',
    name: '还康健',
    description: '带着较好的身体走到终点',
    test: (state, ctx) => ctx.type === 'death' && state.health >= 52,
  },
  {
    id: 'FULL_LIFE',
    name: '走完',
    description: '从出生走到死亡',
    test: (_state, ctx) => ctx.type === 'death',
  },
]

export function freshUnlocks(state, ctx) {
  return ACHIEVEMENTS.filter((item) => !state.unlocked.includes(item.id) && item.test(state, ctx)).map(
    (item) => item.id,
  )
}

export function achievementName(id) {
  return ACHIEVEMENTS.find((item) => item.id === id)?.name || id
}
