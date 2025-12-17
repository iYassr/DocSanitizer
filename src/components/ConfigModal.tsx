import { useState, type ReactNode } from 'react'
import { useConfigStore } from '../stores/configStore'
import type { DetectionCategory } from '../types'

interface ConfigModalProps {
  onClose: () => void
}

type Tab = 'company' | 'detection' | 'export'

const categoryConfig: Record<DetectionCategory, { label: string; description: string }> = {
  pii: { label: 'Personal Information', description: 'Names, emails, phones, SSN, addresses' },
  company: { label: 'Company Information', description: 'Organization names, locations, domains' },
  financial: { label: 'Financial Data', description: 'Credit cards, bank accounts, amounts' },
  technical: { label: 'Technical Information', description: 'IP addresses, API keys, credentials' },
  custom: { label: 'Custom Keywords', description: 'Your specified terms and phrases' }
}

export function ConfigModal({ onClose }: ConfigModalProps) {
  const [activeTab, setActiveTab] = useState<Tab>('company')
  const [newAlias, setNewAlias] = useState('')
  const [newKeyword, setNewKeyword] = useState('')

  const {
    config,
    updateCompanyInfo,
    updateDetectionSettings,
    updateExportPreferences,
    addAlias,
    removeAlias,
    addKeyword,
    removeKeyword,
    toggleCategory,
    resetConfig
  } = useConfigStore()

  const handleAddAlias = () => {
    if (newAlias.trim()) {
      addAlias(newAlias.trim())
      setNewAlias('')
    }
  }

  const handleAddKeyword = () => {
    if (newKeyword.trim()) {
      addKeyword(newKeyword.trim())
      setNewKeyword('')
    }
  }

  const tabs: { id: Tab; label: string; icon: ReactNode }[] = [
    {
      id: 'company',
      label: 'Company Profile',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      id: 'detection',
      label: 'Detection',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    {
      id: 'export',
      label: 'Export',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    }
  ]

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-scale-in border border-[var(--border-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--bg-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">Settings</h2>
              <p className="text-xs text-[var(--text-tertiary)]">Configure detection and export preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost p-2 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 py-3 border-b border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-primary-dim)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'company' && (
            <div className="space-y-6 animate-fade-in">
              {/* Company Name */}
              <div className="card p-5">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-3">
                  <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Company Name
                </label>
                <input
                  type="text"
                  value={config.companyInfo.primaryName}
                  onChange={(e) => updateCompanyInfo({ primaryName: e.target.value })}
                  placeholder="Enter your company name"
                  className="input-field w-full px-4 py-3 rounded-xl text-sm"
                />
                <p className="mt-2 text-xs text-[var(--text-tertiary)] flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Will be masked as <code className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded text-[var(--accent-primary)]">&lt;COMPANY_NAME&gt;</code>
                </p>
              </div>

              {/* Aliases */}
              <div className="card p-5">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-3">
                  <svg className="w-4 h-4 text-[var(--color-company)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Company Aliases
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAlias()}
                    placeholder="Add alias (e.g., acronym, abbreviation)"
                    className="input-field flex-1 px-4 py-2.5 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleAddAlias}
                    className="btn-primary px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.companyInfo.aliases.length === 0 ? (
                    <span className="text-sm text-[var(--text-muted)]">No aliases added yet</span>
                  ) : (
                    config.companyInfo.aliases.map((alias) => (
                      <span
                        key={alias}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-company-dim)] text-[var(--color-company)] text-sm rounded-lg border border-[var(--color-company)] font-mono"
                      >
                        {alias}
                        <button
                          onClick={() => removeAlias(alias)}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Custom Keywords */}
              <div className="card p-5">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-3">
                  <svg className="w-4 h-4 text-[var(--color-custom)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Custom Keywords to Detect
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="Add keyword (e.g., project name, client)"
                    className="input-field flex-1 px-4 py-2.5 rounded-lg text-sm"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="btn-primary px-4 py-2.5 rounded-lg text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.customEntities.keywords.length === 0 ? (
                    <span className="text-sm text-[var(--text-muted)]">No keywords added yet</span>
                  ) : (
                    config.customEntities.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-custom-dim)] text-[var(--color-custom)] text-sm rounded-lg border border-[var(--color-custom)] font-mono"
                      >
                        {keyword}
                        <button
                          onClick={() => removeKeyword(keyword)}
                          className="opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'detection' && (
            <div className="space-y-6 animate-fade-in">
              {/* Categories */}
              <div className="card p-5">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-4">
                  <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Detection Categories
                </label>
                <div className="space-y-2">
                  {(Object.keys(categoryConfig) as DetectionCategory[]).map((category) => {
                    const isEnabled = config.detectionSettings.categoriesEnabled.includes(category)
                    return (
                      <label
                        key={category}
                        className={`
                          flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all duration-200 border
                          ${isEnabled
                            ? 'bg-[var(--bg-elevated)] border-[var(--accent-primary)]'
                            : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] hover:border-[var(--text-tertiary)]'
                          }
                        `}
                      >
                        <input
                          type="checkbox"
                          checked={isEnabled}
                          onChange={() => toggleCategory(category)}
                        />
                        <div className="flex-1">
                          <span className={`text-sm font-medium ${isEnabled ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                            {categoryConfig[category].label}
                          </span>
                          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                            {categoryConfig[category].description}
                          </p>
                        </div>
                        <span className={`badge badge-${category}`}>
                          {category.toUpperCase()}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Confidence Threshold */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)]">
                    <svg className="w-4 h-4 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Minimum Confidence
                  </label>
                  <span className="text-2xl font-display font-bold text-[var(--accent-primary)]">
                    {config.detectionSettings.minConfidence}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={config.detectionSettings.minConfidence}
                  onChange={(e) => updateDetectionSettings({ minConfidence: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-[var(--text-tertiary)] mt-2">
                  <span>50% (More detections)</span>
                  <span>100% (Higher accuracy)</span>
                </div>
              </div>

              {/* Auto-mask */}
              <div className="card p-5">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.detectionSettings.autoMaskHighConfidence}
                    onChange={(e) => updateDetectionSettings({ autoMaskHighConfidence: e.target.checked })}
                  />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-[var(--text-primary)]">Auto-select high confidence items</span>
                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                      Automatically select detections with 90%+ confidence for masking
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6 animate-fade-in">
              {/* Include mapping file */}
              <div className="card p-5">
                <label className="flex items-center gap-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.exportPreferences.includeMappingFile}
                    onChange={(e) => updateExportPreferences({ includeMappingFile: e.target.checked })}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-sm font-medium text-[var(--text-primary)]">Show mapping export option</span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1 ml-6">
                      Export a JSON file mapping placeholders to original values for later reference
                    </p>
                  </div>
                </label>
              </div>

              {/* Default format */}
              <div className="card p-5">
                <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-primary)] mb-3">
                  <svg className="w-4 h-4 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Default Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'same', label: 'Same as Input', icon: '=' },
                    { value: 'txt', label: 'Plain Text', icon: '.txt' },
                    { value: 'md', label: 'Markdown', icon: '.md' }
                  ].map((format) => (
                    <button
                      key={format.value}
                      onClick={() => updateExportPreferences({ defaultFormat: format.value as 'same' | 'txt' | 'md' })}
                      className={`
                        p-4 rounded-xl text-center transition-all duration-200 border
                        ${config.exportPreferences.defaultFormat === format.value
                          ? 'bg-[var(--accent-primary-dim)] border-[var(--accent-primary)] text-[var(--accent-primary)]'
                          : 'bg-[var(--bg-tertiary)] border-[var(--border-primary)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                        }
                      `}
                    >
                      <div className="text-lg font-mono mb-1">{format.icon}</div>
                      <div className="text-xs">{format.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Security note */}
              <div className="card p-5 border-[var(--color-info)]">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-info-dim)] flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-[var(--color-info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">Privacy First</p>
                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                      All processing happens locally on your device. No data is ever sent to external servers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)]">
          <button
            onClick={resetConfig}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger-dim)] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="btn-primary px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save & Close
          </button>
        </div>
      </div>
    </div>
  )
}
