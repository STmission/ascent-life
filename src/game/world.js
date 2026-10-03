import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { clone as cloneSkinned } from 'three/addons/utils/SkeletonUtils.js'
import { getLayout } from './layout.js'

// Two CC0 looks. Quaternius is the default. Kenney is the blockier set (?pack=kenney).
const PACKS = {
  quaternius: {
    scenes: 'scenes.glb',
    turn: Math.PI,
    cast: {
      child_m: 'cast/hoodie.gltf',
      youth_m: 'cast/casual2.gltf',
      parent_m: 'cast/suit-m.gltf',
      elder_m: 'cast/worker.gltf',
      child_f: 'cast/casual-f.gltf',
      youth_f: 'cast/casual-f.gltf',
      parent_f: 'cast/formal.gltf',
      elder_f: 'cast/formal.gltf',
    },
  },
  kenney: {
    scenes: 'kenney/scenes.glb',
    turn: Math.PI,
    cast: {
      child_m: 'kenney/cast/character-c.glb',
      youth_m: 'kenney/cast/character-b.glb',
      parent_m: 'kenney/cast/character-a.glb',
      elder_m: 'kenney/cast/character-i.glb',
      child_f: 'kenney/cast/character-e.glb',
      youth_f: 'kenney/cast/character-e.glb',
      parent_f: 'kenney/cast/character-n.glb',
      elder_f: 'kenney/cast/character-n.glb',
    },
  },
}

const CUTOUT = /short|long|bob|brow|lash|hair|eyebrow|eyelash/i
const NO_CAST = /wall|floor|ceil|glass|water|ground|trim|outside|sill|doorhead|head_/i

export function loadLifeModels(pack = 'quaternius') {
  const spec = PACKS[pack] || PACKS.quaternius
  const loader = new GLTFLoader()
  const base = import.meta.env.BASE_URL
  const load = (file) =>
    new Promise((resolve, reject) => {
      loader.load(`${base}models/${file}`, resolve, undefined, reject)
    })
  const files = [...new Set(Object.values(spec.cast))]
  return Promise.all([load(spec.scenes), ...files.map(load)]).then(([scenesGltf, ...casts]) => {
    const scenes = scenesGltf.scene
    prepareImported(scenes)
    const byFile = {}
    files.forEach((file, index) => {
      const gltf = casts[index]
      prepareImported(gltf.scene)
      // Both packs face +Z. Game forward at yaw 0 is -Z, so turn them around once.
      gltf.scene.rotation.y = spec.turn
      byFile[file] = { scene: gltf.scene, clips: gltf.animations }
    })
    const people = {}
    for (const [id, file] of Object.entries(spec.cast)) people[id] = byFile[file]
    return { scenes, people }
  })
}

function prepareImported(root) {
  root.traverse((node) => {
    if (!node.isMesh) return
    node.castShadow = !NO_CAST.test(node.name)
    node.receiveShadow = true
    const materials = Array.isArray(node.material) ? node.material : [node.material]
    materials.forEach((material) => {
      if (!material) return
      if (CUTOUT.test(node.name)) {
        material.side = THREE.DoubleSide
        material.alphaTest = Math.max(material.alphaTest || 0, 0.35)
        material.transparent = false
        material.depthWrite = true
      }
      if (/glass|water/i.test(node.name)) {
        material.transparent = true
        material.depthWrite = false
        material.opacity = material.opacity < 0.95 ? material.opacity : 0.45
      }
      if (/lamp/i.test(node.name)) {
        material.emissive = new THREE.Color(0xffc98a)
        material.emissiveIntensity = 0.55
      }
    })
  })
}

function appearanceOf(profile = {}) {
  const female = profile.gender === 'f'
  const age = Number(profile.age ?? 22)
  if (age < 11) return { id: female ? 'child_f' : 'child_m', scale: age < 7 ? 0.58 : 0.68 }
  if (age >= 65) return { id: female ? 'elder_f' : 'elder_m', scale: 1 }
  const scale = age < 14 ? 0.86 : age < 18 ? 0.93 : 1
  return { id: female ? 'youth_f' : 'youth_m', scale }
}

function npcIds(sceneId, profile) {
  const peer = profile?.gender === 'f' ? 'youth_m' : 'youth_f'
  if (sceneId === 'home' || sceneId === 'hospital' || sceneId === 'split') return ['parent_f']
  if (sceneId === 'school') return [peer]
  if (sceneId === 'work' || sceneId === 'wedding') return ['parent_m']
  if (sceneId === 'park') return ['youth_f', 'youth_m']
  return []
}

export const SHIRTS = {
  study: 0x243e68,
  craft: 0x7a4e2d,
  business: 0x1d5c4d,
  civic: 0x6d303c,
  art: 0x5c3d68,
  undecided: 0x3a4744,
}

const PALETTE = {
  home: pack(0xb9895d, 0xe7dccb, 0xd9cbb8, 0x8d5a34, 0x9c4a3c, 0x6d8a62, 1.15, 0.72),
  homePoor: pack(0x8d704c, 0xd9d0c4, 0xcfc3b2, 0x6e4a2e, 0x7d5344, 0x5d6e52, 0.85, 0.55),
  homeRich: pack(0xc79a64, 0xf3eadc, 0xe6d3bc, 0x8a4e2b, 0xa33b32, 0x6e8f68, 1.25, 0.8),
  school: pack(0xd7d1c6, 0xf4f1ea, 0xd5e2ea, 0xb08968, 0x355e86, 0x7f9784, 1.2, 0.78),
  schoolMid: pack(0xcfc6b8, 0xe7efe8, 0xd5e0da, 0x9a7048, 0x2f5d50, 0x6d8a72, 1.05, 0.7),
  schoolNight: pack(0x3e4654, 0x2a3140, 0x1c2433, 0x6b5138, 0x8f3d32, 0x31443a, 0.42, 0.38),
  campus: pack(0x8ea36a, 0xe7e2d4, 0xd7e4cf, 0x8d6844, 0xc45a4a, 0x4f7a45, 1.25, 0.8),
  work: pack(0xc8c2b8, 0xe6e1d8, 0xd5d8df, 0x8a6a45, 0x3d5c73, 0x66756a, 1.05, 0.66),
  hospital: pack(0xd5dde3, 0xf7f5f2, 0xd9e3ea, 0xc5ced6, 0xf2f6f8, 0x8aa0a8, 1.15, 0.85),
  split: pack(0xb7aea3, 0xe4ddd4, 0xd2cdc6, 0x7d6248, 0x6d5a6e, 0x6a7468, 0.75, 0.5),
  wedding: pack(0xe0ccad, 0xf7f1e6, 0xf0e2cf, 0xc6a15b, 0x8f2d2a, 0xd7c4a4, 1.3, 0.82),
  apartment: pack(0xcbb892, 0xefe6d8, 0xe4d5c4, 0x8d6240, 0x9a4038, 0x73856c, 1, 0.64),
  park: pack(0x6e8f62, 0xe4ecd9, 0xd5e4cf, 0x6d5132, 0x3e6b45, 0x87a06a, 1.2, 0.78),
  shore: pack(0xc2b59a, 0xe7e1d6, 0xd5dee6, 0x8a6848, 0x6f8f99, 0xb7c4c8, 0.9, 0.7),
}

function pack(floor, wall, fog, wood, cloth, leaf, sunIntensity, hemi) {
  return {
    floor,
    wall,
    fog,
    wood,
    cloth,
    leaf,
    metal: 0x8d8680,
    water: 0x7ea0ad,
    accent: 0x8f2d2a,
    ground: 0x6a6258,
    sun: 0xffe0b8,
    hemiSky: 0xfff3e4,
    hemiGround: 0x6d5a49,
    sunIntensity,
    hemi,
  }
}

const HEIGHT = {
  wall: 1.15,
  bed: 0.48,
  wardrobe: 1.7,
  table: 0.72,
  sofa: 0.62,
  desk: 0.74,
  podium: 1.02,
  bench: 0.46,
  board: 1.5,
  machine: 1.05,
  counter: 1.02,
  boxpile: 0.72,
  seat: 0.78,
  altar: 0.84,
  crib: 0.62,
  building: 3.3,
  post: 1.35,
}

export function createWorld(canvas, models = null) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.04
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(50, window.innerWidth / Math.max(window.innerHeight, 1), 0.08, 90)
  const root = new THREE.Group()
  scene.add(root)
  const player = new THREE.Group()
  player.userData.height = 1.7
  player.userData.fitScale = 1
  scene.add(player)

  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.42, 20),
    new THREE.MeshBasicMaterial({ map: blobTexture(), transparent: true, depthWrite: false }),
  )
  shadow.rotation.x = -Math.PI / 2
  shadow.position.y = 0.025
  scene.add(shadow)

  const marker = makeMarker()
  scene.add(marker)
  const beads = new THREE.Group()
  const beadMaterial = new THREE.MeshBasicMaterial({ color: 0x9c2f2f })
  const beadGeometry = new THREE.SphereGeometry(0.045, 8, 8)
  for (let index = 0; index < 10; index += 1) {
    beads.add(new THREE.Mesh(beadGeometry, beadMaterial))
  }
  scene.add(beads)

  const hemi = new THREE.HemisphereLight(0xfff2e0, 0x6b5344, 0.75)
  const sun = new THREE.DirectionalLight(0xffe0b8, 1.15)
  sun.position.set(8, 14, 6)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.near = 1
  sun.shadow.camera.far = 42
  sun.shadow.camera.left = -16
  sun.shadow.camera.right = 16
  sun.shadow.camera.top = 16
  sun.shadow.camera.bottom = -16
  scene.add(hemi, sun)

  let disposables = []

  function resize() {
    const width = window.innerWidth
    const height = Math.max(window.innerHeight, 1)
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  function clearRoot() {
    for (const item of disposables) item.dispose?.()
    disposables = []
    mixers.length = 0
    while (root.children.length) root.remove(root.children[0])
  }

  function setRoom(sceneId, dress, shirt, profile = {}) {
    clearRoot()
    const layout = getLayout(sceneId)
    const palette = PALETTE[dress] || PALETTE.home
    scene.background = new THREE.Color(palette.fog)
    scene.fog = new THREE.Fog(palette.fog, 9, 42)
    hemi.color.setHex(palette.hemiSky)
    hemi.groundColor.setHex(palette.hemiGround)
    hemi.intensity = palette.hemi
    sun.color.setHex(palette.sun)
    sun.intensity = palette.sunIntensity
    const source = models?.scenes?.getObjectByName(sceneId)
    if (source) {
      const room = source.clone(true)
      const poor = dress === 'homePoor'
      const rich = dress === 'homeRich'
      room.traverse((node) => {
        if (node.name.startsWith('Poor')) node.visible = poor
        if (node.name.startsWith('Rich')) node.visible = rich
      })
      root.add(room)
      for (const decor of layout.decor || []) {
        if (decor.kind !== 'lamp') continue
        const light = new THREE.PointLight(palette.sun, 0.7, 9, 1.4)
        light.position.set(decor.x, 2.05, decor.z)
        root.add(light)
      }
      placePeople(root, layout, sceneId, profile)
    } else {
      buildRoom(root, layout, palette, sceneId, disposables)
      wearFallback(shirt)
    }
    if (source) wearPlayer(profile, shirt)
    if (profile.companion) {
      const companion = spawnPerson('youth_f')
      if (companion) {
        companion.position.set(1.7, 0, 1.15)
        companion.rotation.y = Math.PI
        root.add(companion)
      }
    }
    api.floor = layout.floor
    return layout
  }

  function wearPlayer(profile, shirt) {
    while (player.children.length) player.remove(player.children[0])
    const look = appearanceOf(profile)
    const model = spawnPerson(look.id) || makePerson(shirt, true)
    model.scale.multiplyScalar(look.scale)
    player.add(model)
    player.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(model)
    const height = Math.max(0.9, box.max.y - Math.min(box.min.y, 0))
    player.userData.height = height
    player.userData.fitScale = 1
  }

  function wearFallback(shirt) {
    while (player.children.length) player.remove(player.children[0])
    const model = makePerson(shirt, true)
    player.add(model)
    player.userData.height = 1.7
    player.userData.fitScale = 1
  }

  const mixers = []

  function spawnPerson(id) {
    const source = models?.people?.[id]
    if (!source?.scene) return null
    const clone = cloneSkinned(source.scene)
    const mixer = new THREE.AnimationMixer(clone)
    const find = (name) => source.clips.find((clip) => clip.name === name)
    const actions = {
      idle: find('Idle_Neutral') || find('Idle') || find('idle'),
      walk: find('Walk') || find('walk'),
      run: find('Run') || find('sprint'),
    }
    const playable = {}
    for (const [name, clip] of Object.entries(actions)) {
      if (clip) playable[name] = mixer.clipAction(clip)
    }
    clone.userData.actions = playable
    clone.userData.mixer = mixer
    if (playable.idle) {
      playable.idle.play()
      clone.userData.clip = 'idle'
    }
    mixers.push(mixer)
    clone.traverse((node) => {
      if (node.isMesh) node.castShadow = true
    })
    return clone
  }

  function tick(dt, moving, running) {
    for (const mixer of mixers) mixer.update(dt)
    const actor = player.children[0]
    const actions = actor?.userData.actions
    if (!actions) return
    const next = moving ? (running && actions.run ? 'run' : 'walk') : 'idle'
    if (!actions[next] || actor.userData.clip === next) return
    const previous = actions[actor.userData.clip]
    if (previous) previous.fadeOut(0.18)
    actions[next].reset().fadeIn(0.18).play()
    actor.userData.clip = next
  }

  function placePeople(room, layout, sceneId, profile) {
    const ids = npcIds(sceneId, profile)
    let index = 0
    for (const block of layout.blocks) {
      if (block.kind !== 'person') continue
      const person = spawnPerson(ids[index] || ids[0] || 'parent_m')
      index += 1
      if (!person) continue
      const cx = (block.minX + block.maxX) / 2
      const cz = (block.minZ + block.maxZ) / 2
      person.position.set(cx, 0, cz)
      person.rotation.y = Math.PI
      room.add(person)
    }
  }

  const api = { renderer, scene, camera, player, shadow, marker, beads, resize, setRoom, tick, floor: null }
  return api
}

function buildRoom(root, layout, palette, sceneId, disposables) {
  const mats = makeMaterials(palette)
  Object.values(mats).forEach((material) => disposables.push(material))
  const { minX, maxX, minZ, maxZ } = layout.floor
  const ground = new THREE.Mesh(new THREE.CircleGeometry(30, 40), mats.ground)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.12
  ground.receiveShadow = true
  root.add(ground)
  disposables.push(ground.geometry)

  const floor = new THREE.Mesh(new THREE.BoxGeometry(maxX - minX, 0.2, maxZ - minZ), mats.floor)
  floor.position.set((minX + maxX) / 2, -0.1, (minZ + maxZ) / 2)
  floor.receiveShadow = true
  root.add(floor)
  disposables.push(floor.geometry)

  if (sceneId === 'shore') {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(maxX - minX, 4.2), mats.water)
    water.rotation.x = -Math.PI / 2
    water.position.set(0, 0.02, -4.6)
    root.add(water)
    disposables.push(water.geometry)
  }

  for (const block of layout.blocks) addBlock(root, mats, disposables, block, palette)
  for (const decor of layout.decor || []) addDecor(root, mats, disposables, decor, palette)
  addDust(root, disposables, layout.floor, palette)
}

function makeMaterials(palette) {
  const standard = (color, roughness, extra = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness: 0, ...extra })
  return {
    floor: standard(palette.floor, 0.92),
    wall: standard(palette.wall, 0.94),
    wood: standard(palette.wood, 0.78),
    cloth: standard(palette.cloth, 0.9),
    metal: standard(palette.metal, 0.42, { metalness: 0.25 }),
    leaf: standard(palette.leaf, 0.82),
    water: standard(palette.water, 0.18, { transparent: true, opacity: 0.88 }),
    accent: standard(palette.accent, 0.5),
    ground: standard(palette.ground, 1),
    window: new THREE.MeshStandardMaterial({
      color: 0xfff4e2,
      emissive: 0xffd7a1,
      emissiveIntensity: palette.sunIntensity < 0.6 ? 0.95 : 0.45,
      roughness: 0.28,
    }),
    chalk: standard(0xf7f3ea, 0.9),
    board: standard(0x243028, 0.72),
    skin: standard(0xd7a57a, 0.64),
    hair: standard(0x2a211c, 0.72),
  }
}

function addBlock(root, mats, disposables, block, palette) {
  const cx = (block.minX + block.maxX) / 2
  const cz = (block.minZ + block.maxZ) / 2
  const w = block.maxX - block.minX
  const d = block.maxZ - block.minZ
  if (block.kind === 'person') {
    const person = makePerson(block.shirt || 0x44515c, false)
    person.position.set(cx, 0, cz)
    root.add(person)
    collect(disposables, person)
    return
  }
  if (block.kind === 'tree') {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 0.8, 7), mats.wood)
    trunk.position.set(cx, 0.4, cz)
    trunk.castShadow = true
    const crown = new THREE.Mesh(new THREE.SphereGeometry(Math.max(w, d) * 0.55, 12, 8), mats.leaf)
    crown.position.set(cx, 1.2, cz)
    crown.castShadow = true
    root.add(trunk, crown)
    disposables.push(trunk.geometry, crown.geometry)
    return
  }
  if (block.kind === 'pond') {
    const pond = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.08, 24), mats.water)
    pond.position.set(cx, 0.04, cz)
    root.add(pond)
    disposables.push(pond.geometry)
    return
  }
  if (block.kind === 'boat') {
    const hull = new THREE.Mesh(new THREE.BoxGeometry(w, 0.28, d), mats.wood)
    hull.position.set(cx, 0.24, cz)
    hull.castShadow = true
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 0.32, d * 0.4), mats.accent)
    cabin.position.set(cx, 0.48, cz + d * 0.08)
    root.add(hull, cabin)
    disposables.push(hull.geometry, cabin.geometry)
    return
  }
  const material = materialFor(block.kind, mats)
  const height = HEIGHT[block.kind] || 1
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, height, d), material)
  mesh.position.set(cx, height / 2, cz)
  mesh.castShadow = block.kind !== 'wall'
  mesh.receiveShadow = true
  root.add(mesh)
  disposables.push(mesh.geometry)
  if (block.kind === 'bed') {
    const pillow = new THREE.Mesh(new THREE.BoxGeometry(w * 0.42, 0.12, d * 0.28), mats.chalk)
    pillow.position.set(cx, height + 0.05, cz - d * 0.22)
    root.add(pillow)
    disposables.push(pillow.geometry)
  }
  if (block.kind === 'altar') {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 8, 16), mats.accent)
    ring.rotation.x = Math.PI / 2
    ring.position.set(cx, height + 0.08, cz)
    root.add(ring)
    disposables.push(ring.geometry)
  }
  if (block.kind === 'building') {
    const band = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.12, 0.08), mats.accent)
    band.position.set(cx, 1.4, block.maxZ + 0.02)
    root.add(band)
    disposables.push(band.geometry)
  }
}

function materialFor(kind, mats) {
  if (['bed', 'sofa', 'seat', 'crib'].includes(kind)) return mats.cloth
  if (['desk', 'table', 'wardrobe', 'podium', 'boxpile', 'altar', 'post', 'bench'].includes(kind)) return mats.wood
  if (['machine', 'counter'].includes(kind)) return mats.metal
  if (kind === 'board') return mats.board
  return mats.wall
}

function addDecor(root, mats, disposables, decor, palette) {
  if (decor.kind === 'window' || decor.kind === 'board') {
    const width = decor.kind === 'board' ? 2.4 : 1.35
    const height = decor.kind === 'board' ? 1.15 : 1.05
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), decor.kind === 'board' ? mats.board : mats.window)
    const rot = decor.rot || 0
    mesh.position.set(decor.x, decor.kind === 'board' ? 1.55 : 1.45, decor.z)
    mesh.rotation.y = rot
    mesh.position.x += Math.sin(rot) * 0.07
    mesh.position.z += Math.cos(rot) * 0.07
    root.add(mesh)
    disposables.push(mesh.geometry)
    if (decor.kind === 'board') {
      const chalk = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.86, height * 0.72), mats.chalk)
      chalk.position.copy(mesh.position)
      chalk.rotation.y = rot
      chalk.position.x += Math.sin(rot) * 0.02
      chalk.position.z += Math.cos(rot) * 0.02
      root.add(chalk)
      disposables.push(chalk.geometry)
    }
    return
  }
  if (decor.kind === 'rug') {
    const rug = new THREE.Mesh(new THREE.BoxGeometry(decor.w, 0.03, decor.d), mats.accent)
    rug.position.set(decor.x, 0.02, decor.z)
    rug.receiveShadow = true
    root.add(rug)
    disposables.push(rug.geometry)
    return
  }
  if (decor.kind === 'lamp') {
    const bulb = new THREE.Mesh(
      new THREE.SphereGeometry(0.08, 10, 10),
      new THREE.MeshStandardMaterial({ color: 0xfff1d2, emissive: 0xffc98a, emissiveIntensity: 0.8, roughness: 0.4 }),
    )
    bulb.position.set(decor.x, 2.25, decor.z)
    const light = new THREE.PointLight(palette.sun, 0.45, 7)
    light.position.copy(bulb.position)
    root.add(bulb, light)
    disposables.push(bulb.geometry, bulb.material)
  }
}

function addDust(root, disposables, floor, palette) {
  const count = 32
  const positions = new Float32Array(count * 3)
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = floor.minX + Math.random() * (floor.maxX - floor.minX)
    positions[index * 3 + 1] = 0.5 + Math.random() * 1.8
    positions[index * 3 + 2] = floor.minZ + Math.random() * (floor.maxZ - floor.minZ)
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const points = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color: palette.sun, size: 0.035, transparent: true, opacity: 0.28, depthWrite: false }),
  )
  root.add(points)
  disposables.push(geometry, points.material)
}

function collect(disposables, object) {
  object.traverse((node) => {
    if (node.geometry) disposables.push(node.geometry)
    if (node.material) {
      const list = Array.isArray(node.material) ? node.material : [node.material]
      list.forEach((material) => disposables.push(material))
    }
  })
}

export function makePerson(shirt, collar) {
  const group = new THREE.Group()
  const cloth = new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.82 })
  const skin = new THREE.MeshStandardMaterial({ color: 0xd7a57a, roughness: 0.62 })
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x2a211c, roughness: 0.7 })
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.28, 0.72, 12), cloth)
  body.position.y = 0.82
  body.castShadow = true
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), skin)
  head.position.y = 1.42
  head.castShadow = true
  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.21, 16, 10, 0, Math.PI * 2, 0, 1.15), hairMat)
  hair.position.y = 1.5
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.045, 8, 8), skin)
  nose.position.set(0, 1.4, -0.18)
  group.add(body, head, hair, nose)
  if (collar) {
    const scarf = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.18, 0.08, 10),
      new THREE.MeshStandardMaterial({ color: 0x8f2d2a, roughness: 0.55 }),
    )
    scarf.position.y = 1.16
    group.add(scarf)
  }
  group.userData.cloth = cloth
  return group
}

function makeMarker() {
  const group = new THREE.Group()
  const gem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.13, 0),
    new THREE.MeshStandardMaterial({ color: 0x9c2f2f, emissive: 0x9c2f2f, emissiveIntensity: 0.85, roughness: 0.35 }),
  )
  gem.position.y = 1.15
  gem.name = 'gem'
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.34, 0.48, 28),
    new THREE.MeshBasicMaterial({ color: 0x9c2f2f, transparent: true, opacity: 0.9, side: THREE.DoubleSide }),
  )
  ring.rotation.x = -Math.PI / 2
  ring.position.y = 0.035
  group.add(gem, ring)
  return group
}

function blobTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const draw = canvas.getContext('2d')
  const gradient = draw.createRadialGradient(32, 32, 4, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(0,0,0,0.35)')
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  draw.fillStyle = gradient
  draw.fillRect(0, 0, 64, 64)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}
