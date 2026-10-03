import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
const require = createRequire(import.meta.url)
const { createAssetServer } = require('../electron/server.cjs')
test('desktop serves game and model assets over HTTP, rejects traversal', async () => {
  const server = createAssetServer(new URL('../public', import.meta.url).pathname)
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const origin = `http://127.0.0.1:${server.address().port}`
  try {
    const model = await fetch(origin + '/models/scenes.glb')
    assert.equal(model.status, 200)
    assert.equal(model.headers.get('content-type'), 'model/gltf-binary')
    assert.ok((await model.arrayBuffer()).byteLength > 100)
    assert.equal((await fetch(origin + '/models/%2e%2e%2f%2e%2e%2fpackage.json')).status, 403)
    assert.equal((await fetch(origin + '/not-present')).status, 404)
    assert.equal((await fetch(origin + '/', {method: 'POST'})).status, 405)
  } finally { await new Promise(resolve => server.close(resolve)) }
})
