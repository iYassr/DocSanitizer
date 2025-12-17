import { create } from 'zustand'
import type { FileData, Detection, EntityMapping, AppView, ScanStats, DetectionCategory } from '../types'

interface DocumentState {
  // Current view
  view: AppView
  setView: (view: AppView) => void

  // File data
  file: FileData | null
  setFile: (file: FileData | null) => void

  // Document content
  content: string
  setContent: (content: string) => void

  // Detections
  detections: Detection[]
  setDetections: (detections: Detection[]) => void
  toggleDetection: (id: string) => void
  approveAll: () => void
  rejectAll: () => void
  approveCategory: (category: DetectionCategory) => void
  rejectCategory: (category: DetectionCategory) => void

  // Masked content
  maskedContent: string
  setMaskedContent: (content: string) => void

  // Entity mappings
  mappings: EntityMapping[]
  setMappings: (mappings: EntityMapping[]) => void

  // Stats
  stats: ScanStats | null
  setStats: (stats: ScanStats | null) => void

  // Processing state
  isProcessing: boolean
  setIsProcessing: (processing: boolean) => void

  // Reset
  reset: () => void
}

const initialState = {
  view: 'upload' as AppView,
  file: null,
  content: '',
  detections: [],
  maskedContent: '',
  mappings: [],
  stats: null,
  isProcessing: false
}

export const useDocumentStore = create<DocumentState>((set) => ({
  ...initialState,

  setView: (view) => set({ view }),

  setFile: (file) => set({ file }),

  setContent: (content) => set({ content }),

  setDetections: (detections) => set({ detections }),

  toggleDetection: (id) =>
    set((state) => ({
      detections: state.detections.map((d) =>
        d.id === id ? { ...d, approved: !d.approved } : d
      )
    })),

  approveAll: () =>
    set((state) => ({
      detections: state.detections.map((d) => ({ ...d, approved: true }))
    })),

  rejectAll: () =>
    set((state) => ({
      detections: state.detections.map((d) => ({ ...d, approved: false }))
    })),

  approveCategory: (category) =>
    set((state) => ({
      detections: state.detections.map((d) =>
        d.category === category ? { ...d, approved: true } : d
      )
    })),

  rejectCategory: (category) =>
    set((state) => ({
      detections: state.detections.map((d) =>
        d.category === category ? { ...d, approved: false } : d
      )
    })),

  setMaskedContent: (maskedContent) => set({ maskedContent }),

  setMappings: (mappings) => set({ mappings }),

  setStats: (stats) => set({ stats }),

  setIsProcessing: (isProcessing) => set({ isProcessing }),

  reset: () => set(initialState)
}))
