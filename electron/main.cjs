const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { createAssetServer } = require('./server.cjs')
let assetServer = null
let assetOrigin = ''
if (process.env.ASCENT_SMOKE === '1') app.setPath('userData', path.join(app.getPath('temp'), 'ascent-smoke'))
if (!app.requestSingleInstanceLock()) app.quit()
app.on('second-instance', () => {
  const win = BrowserWindow.getAllWindows()[0]
  if (win) { if (win.isMinimized()) win.restore(); win.focus() }
})

const SPACEWAR = {
  FIRST_BREATH: 'ACH_WIN_ONE_GAME',
  MIDDLE: 'ACH_WIN_100_GAMES',
  ELITE: 'ACH_TRAVEL_FAR_SINGLE',
  FREE: 'ACH_TRAVEL_FAR_ACCUM',
}

let steam = null
let appId = 480
let steamStatus = { ok: false, reason: 'disabled' }

function readAppId() {
  const configured = Number(process.env.SteamAppId || process.env.STEAM_APP_ID)
  if (Number.isSafeInteger(configured) && configured > 0) return configured
  if (app.isPackaged) return null
  try {
    const file = path.join(__dirname, '..', 'steam', 'steam_appid.txt')
    const value = Number(fs.readFileSync(file, 'utf8').trim())
    if (Number.isFinite(value) && value > 0) return value
  } catch {
    /* use Spacewar during local development */
  }
  return 480
}

function initSteam() {
  if (process.env.STEAM_ENABLED !== '1' && !process.env.SteamAppId) {
    steamStatus = { ok: false, reason: 'disabled' }
    return
  }
  try {
    const steamworks = require('steamworks.js')
    appId = readAppId()
    if (!appId) throw new Error('Set STEAM_APP_ID to your official application ID')
    steam = steamworks.init(appId)
    let name = ''
    try {
      name = steam.localplayer?.getName?.() || ''
    } catch {
      name = ''
    }
    steamStatus = { ok: true, appId, name }
    steamworks.electronEnableSteamOverlay()
  } catch (error) {
    steam = null
    steamStatus = { ok: false, reason: String(error && error.message ? error.message : error) }
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#1c1915',
    title: '浮生 Ascent',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(assetOrigin + '/')) event.preventDefault()
  })
  win.loadURL(assetOrigin).then(() => {
    if (process.env.ASCENT_SMOKE === '1') require('./smoke.cjs').runSmoke(win, app)
  })
}

app.whenReady().then(async () => {
  assetServer = createAssetServer(path.join(__dirname, '..', 'dist'))
  const preferredPort = Number(process.env.ASCENT_PORT || 17843)
  await new Promise((resolve, reject) => {
    assetServer.once('error', reject)
    assetServer.listen(preferredPort, '127.0.0.1', resolve)
  })
  assetOrigin = `http://127.0.0.1:${assetServer.address().port}`
  initSteam()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
}).catch((error) => {
  dialog.showErrorBox('浮生启动失败', `无法启动本地资源服务：${error.message}。请关闭已运行的游戏后重试。`)
  app.quit()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => assetServer?.close())

ipcMain.handle('steam:status', () => steamStatus)

ipcMain.handle('steam:unlock', (_event, id) => {
  if (!steam?.achievement?.activate) return false
  const apiName = appId === 480 ? SPACEWAR[id] : id
  if (!apiName) return false
  try {
    return steam.achievement.activate(apiName)
  } catch {
    return false
  }
})

ipcMain.handle('steam:presence', (_event, text) => {
  try {
    steam?.localplayer?.setRichPresence?.('status', String(text || '').slice(0, 255))
    return true
  } catch {
    return false
  }
})

ipcMain.handle('steam:cloud-write', (_event, json) => {
  if (!steam?.cloud?.writeFile) return false
  try {
    if (typeof json !== 'string' || Buffer.byteLength(json) > 1024 * 1024) return false
    return steam.cloud.writeFile('ascent-save.json', json)
  } catch {
    return false
  }
})

ipcMain.handle('steam:cloud-read', () => {
  if (!steam?.cloud?.readFile) return ''
  try {
    return steam.cloud.readFile('ascent-save.json') || ''
  } catch {
    return ''
  }
})
