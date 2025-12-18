export interface FileData {
  filePath: string
  fileName: string
  extension: string
  buffer: string // base64 encoded
  size: number
  content?: string // decoded text content
}

export interface Detection {
  id: string
  text: string
  category: DetectionCategory
  subcategory: string
  confidence: number
  position: { start: number; end: number }
  suggestedPlaceholder: string
  context: string
  approved: boolean
  isImageDetection?: boolean
  imageId?: string
}

export interface LogoConfig {
  enabled: boolean
  imageData: string | null      // base64 thumbnail for preview
  imageHash: string | null      // perceptual hash for comparison
  similarityThreshold: number   // 0-100, default 85
  placeholderText: string       // default "[LOGO REMOVED]"
}

export type DetectionCategory = 'pii' | 'company' | 'financial' | 'technical' | 'custom'

export interface EntityMapping {
  placeholder: string
  originalValues: string[]
  category: DetectionCategory
  occurrences: number
}

export interface Config {
  companyInfo: {
    primaryName: string
    aliases: string[]
    domain: string
    internalDomains: string[]
  }
  customEntities: {
    clients: NamedEntity[]
    projects: NamedEntity[]
    products: NamedEntity[]
    keywords: string[]
    names: string[] // Custom person names to detect
  }
  detectionSettings: {
    minConfidence: number
    autoMaskHighConfidence: boolean
    categoriesEnabled: DetectionCategory[]
  }
  exportPreferences: {
    includeMappingFile: boolean
    defaultFormat: 'same' | 'txt' | 'md'
  }
  logoDetection: LogoConfig
}

export interface NamedEntity {
  name: string
  aliases: string[]
}

export interface ScanResult {
  documentId: string
  originalFileName: string
  content: string
  detections: Detection[]
  stats: ScanStats
}

export interface ScanStats {
  totalDetections: number
  byCategory: Record<DetectionCategory, number>
  byConfidence: { high: number; medium: number; low: number }
  processingTimeMs: number
}

export interface MaskedDocument {
  content: string
  mapping: EntityMapping[]
  stats: {
    totalMasked: number
    byCategory: Record<DetectionCategory, number>
  }
}

export type AppView = 'upload' | 'review' | 'config'
