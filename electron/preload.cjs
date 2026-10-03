const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('ascentDesktop', {
  status: () => ipcRenderer.invoke('steam:status'),
  unlock: (id) => ipcRenderer.invoke('steam:unlock', id),
  presence: (text) => ipcRenderer.invoke('steam:presence', text),
  cloudWrite: (json) => ipcRenderer.invoke('steam:cloud-write', json),
  cloudRead: () => ipcRenderer.invoke('steam:cloud-read'),
})
