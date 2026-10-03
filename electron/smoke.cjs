const fs = require('node:fs')
const path = require('node:path')
const pause = ms => new Promise(resolve => setTimeout(resolve, ms))
async function runSmoke(win, app) {
  const output = process.env.ASCENT_SMOKE_OUTPUT || path.resolve('artifacts')
  fs.mkdirSync(output, { recursive: true })
  const errors = []
  win.webContents.on('console-message', (_e, level, message) => { if (level === 3) errors.push(message) })
  try {
    for (let i=0;i<40;i++) {
      if (await win.webContents.executeJavaScript("!!document.querySelector('[data-act=quick]')")) break
      await pause(500)
    }
    if (!(await win.webContents.executeJavaScript("!!document.querySelector('[data-act=quick]')"))) throw new Error('Title never became ready')
    await win.webContents.executeJavaScript("document.querySelector('[data-act=quick]').click()")
    await win.webContents.executeJavaScript("document.querySelector('[data-act=enter]').click()")
    await pause(1500)
    const text = await win.webContents.executeJavaScript('document.body.innerText')
    if (!text.includes('5岁')) throw new Error('First playable scene did not open')
    win.webContents.sendInputEvent({type:'keyDown',keyCode:'W'})
    await pause(800)
    win.webContents.sendInputEvent({type:'keyUp',keyCode:'W'})
    await pause(3000)
    const save = await win.webContents.executeJavaScript("JSON.parse(localStorage.getItem('ascent.save.v1'))")
    if (!save?.pos || !Number.isFinite(save.pos.z)) throw new Error('Movement/save verification failed')
    const shot = await win.webContents.capturePage()
    fs.writeFileSync(path.join(output, 'desktop-gameplay.png'), shot.toPNG())
    const resources = await win.webContents.executeJavaScript("performance.getEntriesByType('resource').filter(x=>x.name.includes('/models/')).map(x=>({name:x.name,bytes:x.transferSize}))")
    if (resources.length < 7) throw new Error('3D models were not requested')
    if (errors.length) throw new Error(errors.join('\n'))
    fs.writeFileSync(path.join(output, 'desktop-smoke.json'), JSON.stringify({pass:true,position:save.pos,resources},null,2))
    console.log('PASS desktop: title, 3D scene, keyboard movement, save, screenshot')
    app.exit(0)
  } catch(error) {
    fs.writeFileSync(path.join(output,'desktop-smoke.json'),JSON.stringify({pass:false,error:error.message,errors},null,2))
    console.error(error)
    app.exit(1)
  }
}
module.exports = { runSmoke }
