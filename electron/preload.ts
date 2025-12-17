import { contextBridge, ipcRenderer } from 'electron'

export interface FileData {
  filePath: string
  fileName: string
  extension: string
  buffer: string // base64 encoded
  size: number
}

export interface Detection {
  id: string
  text: string
  category: 'pii' | 'company' | 'financial' | 'technical' | 'custom'
  subcategory: string
  confidence: number
  position: { start: number; end: number }
  suggestedPlaceholder: string
  context: string
  approved: boolean
}

export interface Config {
  companyInfo: {
    primaryName: string
    aliases: string[]
    domain: string
    internalDomains: string[]
  }
  customEntities: {
    clients: Array<{ name: string; aliases: string[] }>
    projects: Array<{ name: string; aliases: string[] }>
    products: Array<{ name: string; aliases: string[] }>
    keywords: string[]
  }
  detectionSettings: {
    minConfidence: number
    autoMaskHighConfidence: boolean
    categoriesEnabled: string[]
  }
  exportPreferences: {
    includeMappingFile: boolean
    defaultFormat: 'same' | 'txt' | 'md'
  }
}

const api = {
  // File operations
  openFile: (): Promise<FileData | null> => ipcRenderer.invoke('dialog:openFile'),
  saveFile: (data: string, defaultName: string): Promise<string | null> =>
    ipcRenderer.invoke('dialog:saveFile', data, defaultName),
  readFile: (filePath: string): Promise<FileData | null> =>
    ipcRenderer.invoke('file:read', filePath),

  // App info
  getVersion: (): Promise<string> => ipcRenderer.invoke('app:getVersion'),

  // Platform info
  platform: process.platform
}

contextBridge.exposeInMainWorld('api', api)

// Type definitions for renderer
declare global {
  interface Window {
    api: typeof api
  }
}
