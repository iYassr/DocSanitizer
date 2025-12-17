import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Config, DetectionCategory } from '../types'

const defaultConfig: Config = {
  companyInfo: {
    primaryName: '',
    aliases: [],
    domain: '',
    internalDomains: []
  },
  customEntities: {
    clients: [],
    projects: [],
    products: [],
    keywords: []
  },
  detectionSettings: {
    minConfidence: 70,
    autoMaskHighConfidence: true,
    categoriesEnabled: ['pii', 'company', 'financial', 'technical', 'custom']
  },
  exportPreferences: {
    includeMappingFile: true,
    defaultFormat: 'same'
  }
}

interface ConfigState {
  config: Config
  setConfig: (config: Config) => void
  updateCompanyInfo: (info: Partial<Config['companyInfo']>) => void
  updateDetectionSettings: (settings: Partial<Config['detectionSettings']>) => void
  updateExportPreferences: (prefs: Partial<Config['exportPreferences']>) => void
  addKeyword: (keyword: string) => void
  removeKeyword: (keyword: string) => void
  addAlias: (alias: string) => void
  removeAlias: (alias: string) => void
  toggleCategory: (category: DetectionCategory) => void
  resetConfig: () => void
}

export const useConfigStore = create<ConfigState>()(
  persist(
    (set) => ({
      config: defaultConfig,

      setConfig: (config) => set({ config }),

      updateCompanyInfo: (info) =>
        set((state) => ({
          config: {
            ...state.config,
            companyInfo: { ...state.config.companyInfo, ...info }
          }
        })),

      updateDetectionSettings: (settings) =>
        set((state) => ({
          config: {
            ...state.config,
            detectionSettings: { ...state.config.detectionSettings, ...settings }
          }
        })),

      updateExportPreferences: (prefs) =>
        set((state) => ({
          config: {
            ...state.config,
            exportPreferences: { ...state.config.exportPreferences, ...prefs }
          }
        })),

      addKeyword: (keyword) =>
        set((state) => ({
          config: {
            ...state.config,
            customEntities: {
              ...state.config.customEntities,
              keywords: [...state.config.customEntities.keywords, keyword]
            }
          }
        })),

      removeKeyword: (keyword) =>
        set((state) => ({
          config: {
            ...state.config,
            customEntities: {
              ...state.config.customEntities,
              keywords: state.config.customEntities.keywords.filter((k) => k !== keyword)
            }
          }
        })),

      addAlias: (alias) =>
        set((state) => ({
          config: {
            ...state.config,
            companyInfo: {
              ...state.config.companyInfo,
              aliases: [...state.config.companyInfo.aliases, alias]
            }
          }
        })),

      removeAlias: (alias) =>
        set((state) => ({
          config: {
            ...state.config,
            companyInfo: {
              ...state.config.companyInfo,
              aliases: state.config.companyInfo.aliases.filter((a) => a !== alias)
            }
          }
        })),

      toggleCategory: (category) =>
        set((state) => {
          const categories = state.config.detectionSettings.categoriesEnabled
          const newCategories = categories.includes(category)
            ? categories.filter((c) => c !== category)
            : [...categories, category]
          return {
            config: {
              ...state.config,
              detectionSettings: {
                ...state.config.detectionSettings,
                categoriesEnabled: newCategories
              }
            }
          }
        }),

      resetConfig: () => set({ config: defaultConfig })
    }),
    {
      name: 'docsanitizer-config'
    }
  )
)
