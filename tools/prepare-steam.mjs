import fs from 'node:fs'
import path from 'node:path'
const [appId, depotId, platform] = process.argv.slice(2)
if (!/^\d+$/.test(appId || '') || !/^\d+$/.test(depotId || '') || Number(appId) === 480 || !['win', 'mac', 'linux'].includes(platform)) {
  console.error('Usage: node tools/prepare-steam.mjs <official AppID> <DepotID> <win|mac|linux>')
  process.exit(1)
}
const root = path.resolve(import.meta.dirname, '..')
const folder = { win: 'win-unpacked', mac: 'mac-arm64', linux: 'linux-unpacked' }[platform]
const content = path.join(root, 'steam/build', folder)
if (!fs.existsSync(content)) throw new Error(`Build first: ${content}`)
const out = path.join(root, 'steam/scripts', platform)
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, 'app_build.vdf'), `"AppBuild"\n{\n "AppID" "${appId}"\n "Desc" "Ascent ${platform}"\n "ContentRoot" "${content}"\n "BuildOutput" "${path.join(root, 'steam/output')}"\n "Depots" { "${depotId}" "depot_build.vdf" }\n}\n`)
fs.writeFileSync(path.join(out, 'depot_build.vdf'), `"DepotBuild"\n{\n "DepotID" "${depotId}"\n "FileMapping" { "LocalPath" "*" "DepotPath" "." "recursive" "1" }\n "FileExclusion" "steam_appid.txt"\n "FileExclusion" "*.pdb"\n}\n`)
console.log(`SteamPipe scripts ready: ${out}`)
