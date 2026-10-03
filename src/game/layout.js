export const PLAYER_RADIUS = 0.32

function box(kind, cx, cz, w, d, extra = {}) {
  return {
    kind,
    minX: cx - w / 2,
    maxX: cx + w / 2,
    minZ: cz - d / 2,
    maxZ: cz + d / 2,
    ...extra,
  }
}

function enclose(floor) {
  const t = 0.5
  const cx = (floor.minX + floor.maxX) / 2
  const cz = (floor.minZ + floor.maxZ) / 2
  const w = floor.maxX - floor.minX
  const d = floor.maxZ - floor.minZ
  return [
    box('wall', cx, floor.minZ - t / 2, w + t * 2, t),
    box('wall', cx, floor.maxZ + t / 2, w + t * 2, t),
    box('wall', floor.minX - t / 2, cz, t, d),
    box('wall', floor.maxX + t / 2, cz, t, d),
  ]
}

const homeFloor = { minX: -7, maxX: 7, minZ: -5, maxZ: 5 }
const schoolFloor = { minX: -8, maxX: 8, minZ: -6, maxZ: 6 }
const campusFloor = { minX: -9.5, maxX: 9.5, minZ: -7.5, maxZ: 7.5 }
const workFloor = { minX: -7.2, maxX: 7.2, minZ: -5.2, maxZ: 5.2 }
const hospitalFloor = { minX: -8.4, maxX: 8.4, minZ: -3.4, maxZ: 3.4 }
const splitFloor = { minX: -6.8, maxX: 6.8, minZ: -4.6, maxZ: 4.6 }
const weddingFloor = { minX: -8, maxX: 8, minZ: -6.2, maxZ: 6.2 }
const apartmentFloor = { minX: -6.2, maxX: 6.2, minZ: -4.6, maxZ: 4.6 }
const parkFloor = { minX: -10, maxX: 10, minZ: -8, maxZ: 8 }
const shoreFloor = { minX: -10, maxX: 10, minZ: -7, maxZ: 7 }

export const SCENES = {
  home: {
    floor: homeFloor,
    spawn: { x: 0.2, z: 2.6, yaw: 0 },
    blocks: [
      ...enclose(homeFloor),
      box('bed', -3.3, -3.55, 2.5, 1.45),
      box('wardrobe', -6.2, 0.4, 1.15, 2.3),
      box('table', 2.5, -0.9, 2, 1.05),
      box('sofa', 4.7, 2.55, 2.5, 1.15),
      box('person', -0.8, -1.8, 0.46, 0.46, { shirt: 0x4d5964 }),
    ],
    points: {
      night: { x: -3.3, z: -2.15 },
      window: { x: 4.7, z: -3.15 },
      exit: { x: 0, z: 4.15 },
    },
    decor: [
      { kind: 'window', x: 4.7, z: -5, rot: 0 },
      { kind: 'rug', x: 0.2, z: 0.2, w: 3.4, d: 2.2 },
      { kind: 'lamp', x: -0.2, z: 0.2 },
    ],
  },
  school: {
    floor: schoolFloor,
    spawn: { x: 1.4, z: 4.35, yaw: 0 },
    blocks: [
      ...enclose(schoolFloor),
      box('desk', -5.7, -0.5, 1.25, 0.75),
      box('desk', -5.7, 1.05, 1.25, 0.75),
      box('desk', -3.3, -0.5, 1.25, 0.75),
      box('desk', -3.3, 1.05, 1.25, 0.75),
      box('desk', -4.7, 3.7, 1.35, 0.75),
      box('podium', 4.3, -4.85, 2.3, 0.85),
      box('person', -6.45, -3.7, 0.46, 0.46, { shirt: 0x2f6a5c }),
    ],
    points: {
      paper: { x: -4.7, z: 2.55 },
      classmate: { x: -5.15, z: -3.55 },
      yard: { x: 5.5, z: 3.7 },
      argument: { x: 2.2, z: 4.15 },
      nightstudy: { x: -4.7, z: 2.55 },
      want: { x: 4.3, z: -3.55 },
      exit: { x: 6.55, z: 4.85 },
    },
    decor: [
      { kind: 'board', x: 4.2, z: -6, rot: 0 },
      { kind: 'window', x: -8, z: 1.2, rot: Math.PI / 2 },
      { kind: 'lamp', x: 0.2, z: 0.4 },
    ],
  },
  campus: {
    floor: campusFloor,
    spawn: { x: 0, z: 5.15, yaw: 0 },
    blocks: [
      ...enclose(campusFloor),
      box('building', 0, -0.6, 4, 3.6),
      box('bench', -6.7, 4.55, 1.7, 0.65),
      box('board', 6.5, -5.15, 1.7, 0.4),
      box('tree', -8.1, -5.6, 0.85, 0.85),
      box('tree', 8.1, 5.5, 0.85, 0.85),
      box('tree', 8, -5.7, 0.85, 0.85),
    ],
    points: {
      career: { x: 6.5, z: -3.7 },
      road: { x: -6.5, z: 3.35 },
      exit: { x: 0, z: 6.55 },
    },
    decor: [
      { kind: 'lamp', x: -4.2, z: 5.2 },
      { kind: 'lamp', x: 4.2, z: 5.2 },
    ],
  },
  work: {
    floor: workFloor,
    spawn: { x: 0, z: 3.45, yaw: 0 },
    blocks: [
      ...enclose(workFloor),
      box('desk', -2.5, -1.7, 2.2, 1),
      box('machine', 3.5, 1.7, 2.3, 1.15),
      box('person', 0.4, -3.55, 0.46, 0.46, { shirt: 0x5a4636 }),
    ],
    points: {
      career: { x: -2.5, z: -0.45 },
      road: { x: 3.4, z: 0.15 },
      peak: { x: -2.5, z: -0.45 },
      cost: { x: 4.8, z: -3.15 },
      exit: { x: 5.7, z: 4.2 },
    },
    decor: [
      { kind: 'window', x: 0.5, z: -5.2, rot: 0 },
      { kind: 'lamp', x: 0, z: 0.6 },
    ],
  },
  hospital: {
    floor: hospitalFloor,
    spawn: { x: 1.2, z: 2.15, yaw: Math.PI / 2 },
    blocks: [
      ...enclose(hospitalFloor),
      box('bed', -6.5, -1.45, 2.1, 1.05),
      box('bed', -6.5, 1.25, 2.1, 1.05),
      box('person', -4.55, -0.15, 0.46, 0.46, { shirt: 0x6d7680 }),
      box('counter', 5.7, -0.2, 1.5, 2.2),
    ],
    points: {
      bedside: { x: -4.15, z: -1.55 },
      bill: { x: 3.55, z: -0.2 },
      exit: { x: 6.7, z: 2.35 },
    },
    decor: [
      { kind: 'window', x: 8.4, z: 0, rot: Math.PI / 2 },
      { kind: 'lamp', x: 0.2, z: 0 },
    ],
  },
  split: {
    floor: splitFloor,
    spawn: { x: 0.2, z: 2.7, yaw: 0 },
    blocks: [
      ...enclose(splitFloor),
      box('boxpile', -4.35, -2.7, 1.35, 0.9),
      box('boxpile', 0.1, -0.35, 1.5, 1.15),
      box('sofa', 4, 2.15, 2.2, 1),
    ],
    points: {
      boxes: { x: -4.2, z: -1.25 },
      choice: { x: 3.7, z: 0.55 },
      exit: { x: 0, z: 3.75 },
    },
    decor: [
      { kind: 'window', x: -2.2, z: -4.6, rot: 0 },
      { kind: 'lamp', x: 1.5, z: 1.4 },
    ],
  },
  wedding: {
    floor: weddingFloor,
    spawn: { x: 0, z: 4.15, yaw: 0 },
    blocks: [
      ...enclose(weddingFloor),
      box('seat', -4.7, -0.2, 2.3, 3.1),
      box('seat', 4.7, -0.2, 2.3, 3.1),
      box('altar', 0, -4.7, 2.8, 0.9),
      box('person', -4.7, 3.15, 0.46, 0.46, { shirt: 0x2c3f55 }),
    ],
    points: {
      vow: { x: 0, z: -3.25 },
      witness: { x: -2.4, z: 3.35 },
      exit: { x: 5.9, z: 5.15 },
    },
    decor: [
      { kind: 'lamp', x: -1.4, z: -3.2 },
      { kind: 'lamp', x: 1.4, z: -3.2 },
      { kind: 'rug', x: 0, z: 0.6, w: 2.2, d: 6.2 },
    ],
  },
  apartment: {
    floor: apartmentFloor,
    spawn: { x: -1.8, z: 3.35, yaw: 0 },
    blocks: [
      ...enclose(apartmentFloor),
      box('crib', -4.45, -3, 1.35, 0.85),
      box('table', 2.25, -0.85, 1.7, 0.95),
      box('sofa', -0.8, 2.15, 2.1, 0.85),
    ],
    points: {
      vow: { x: -2.15, z: -1.45 },
      witness: { x: 2.25, z: 0.55 },
      question: { x: -2.15, z: -1.45 },
      name: { x: 2.25, z: 0.55 },
      talk: { x: -2.15, z: -1.45 },
      papers: { x: 2.25, z: 0.55 },
      exit: { x: 4.55, z: 3.65 },
    },
    decor: [
      { kind: 'window', x: 2.4, z: -4.6, rot: 0 },
      { kind: 'rug', x: -0.4, z: 0.1, w: 2.8, d: 1.8 },
      { kind: 'lamp', x: 0.2, z: -0.2 },
    ],
  },
  park: {
    floor: parkFloor,
    spawn: { x: 0, z: 5.5, yaw: 0 },
    blocks: [
      ...enclose(parkFloor),
      box('pond', 0.1, -0.5, 3.1, 3.1),
      box('bench', -6.4, 3.35, 1.8, 0.65),
      box('tree', -8.3, -5.8, 0.9, 0.9),
      box('tree', 8.2, -5.5, 0.9, 0.9),
      box('tree', 7.8, 5.8, 0.9, 0.9),
      box('tree', -8.4, 5.7, 0.9, 0.9),
      box('person', 3.55, 1.35, 0.46, 0.46, { shirt: 0x8d3b32 }),
      box('person', 5.15, 1.35, 0.46, 0.46, { shirt: 0x2d4d62 }),
    ],
    points: {
      meet: { x: 4.35, z: 2.85 },
      distance: { x: -6.3, z: 2.15 },
      bench: { x: -6.3, z: 2.15 },
      letter: { x: 6.2, z: -2.55 },
      exit: { x: 0, z: 7.05 },
    },
    decor: [
      { kind: 'lamp', x: -3.5, z: 6.2 },
      { kind: 'lamp', x: 3.5, z: 6.2 },
    ],
  },
  shore: {
    floor: shoreFloor,
    spawn: { x: 0.2, z: 4.1, yaw: 0 },
    blocks: [
      ...enclose(shoreFloor),
      box('boat', 0, -5.45, 1.7, 1.45),
      box('bench', -6.5, 2.15, 1.7, 0.65),
      box('post', 6.4, -0.8, 0.4, 0.4),
    ],
    points: {
      back: { x: -6.4, z: 1.05 },
      boat: { x: 0, z: -3.75 },
      exit: { x: 0, z: 5.9 },
    },
    decor: [
      { kind: 'lamp', x: -2.2, z: 3.4 },
      { kind: 'lamp', x: 2.2, z: 3.4 },
    ],
  },
}

export function getLayout(sceneId) {
  const scene = SCENES[sceneId]
  if (!scene) throw new Error(`未知场景 ${sceneId}`)
  return scene
}

export function isBlocked(blocks, x, z, radius = PLAYER_RADIUS) {
  return blocks.some(
    (block) =>
      x > block.minX - radius &&
      x < block.maxX + radius &&
      z > block.minZ - radius &&
      z < block.maxZ + radius,
  )
}

export function pointInside(floor, x, z, margin = 0.42) {
  return x > floor.minX + margin && x < floor.maxX - margin && z > floor.minZ + margin && z < floor.maxZ - margin
}
