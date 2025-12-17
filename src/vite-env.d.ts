/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Electron API types
interface FileData {
  filePath: string
  fileName: string
  extension: string
  buffer: string
  size: number
}

interface Window {
  api: {
    openFile: () => Promise<FileData | null>
    saveFile: (data: string, defaultName: string) => Promise<string | null>
    readFile: (filePath: string) => Promise<FileData | null>
    getVersion: () => Promise<string>
    platform: NodeJS.Platform
  }
}
