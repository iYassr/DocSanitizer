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

interface ParsedDocument {
  success: boolean
  content?: string
  format?: string
  metadata?: {
    title?: string
    author?: string
    pages?: number
    sheets?: string[]
  }
  hasImages?: boolean
  error?: string
}

interface NERResult {
  success: boolean
  entities?: Array<{
    text: string
    type: string
    start: number
    end: number
  }>
  persons?: Array<{ text: string; start: number; end: number }>
  organizations?: Array<{ text: string; start: number; end: number }>
  error?: string
}

interface MaskedDocumentResult {
  success: boolean
  buffer?: string
  error?: string
}

interface Window {
  api: {
    openFile: () => Promise<FileData | null>
    saveFile: (data: string, defaultName: string, format?: string) => Promise<string | null>
    readFile: (filePath: string) => Promise<FileData | null>
    parseDocument: (filePath: string, bufferBase64: string) => Promise<ParsedDocument>
    createMaskedDocument: (originalBufferBase64: string, maskedContent: string, format: string) => Promise<MaskedDocumentResult>
    extractEntities: (text: string) => Promise<NERResult>
    getVersion: () => Promise<string>
    platform: NodeJS.Platform
  }
}
