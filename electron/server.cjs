const http = require('node:http')
const path = require('node:path')
const fs = require('node:fs')
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' }
function createAssetServer(root) {
  const directory = path.resolve(root)
  return http.createServer((req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); return res.end() }
    let filename
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
      filename = path.resolve(directory, '.' + (pathname === '/' ? '/index.html' : pathname))
      if (filename !== directory && !filename.startsWith(directory + path.sep)) { res.writeHead(403); return res.end() }
    } catch { res.writeHead(400); return res.end() }
    fs.stat(filename, (error, stat) => {
      if (error || !stat.isFile()) { res.writeHead(404); return res.end() }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filename)] || 'application/octet-stream', 'Content-Length': stat.size, 'X-Content-Type-Options': 'nosniff' })
      if (req.method === 'HEAD') return res.end()
      const stream = fs.createReadStream(filename)
      stream.on('error', () => res.destroy())
      stream.pipe(res)
    })
  })
}
module.exports = { createAssetServer }
