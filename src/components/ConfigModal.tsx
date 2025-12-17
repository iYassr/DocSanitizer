import { useState } from 'react'
import { useConfigStore } from '../stores/configStore'
import type { DetectionCategory } from '../types'

interface ConfigModalProps {
  onClose: () => void
}

type Tab = 'company' | 'detection' | 'export'

const categoryLabels: Record<DetectionCategory, string> = {
  pii: 'Personal Information (PII)',
  company: 'Company Information',
  financial: 'Financial Data',
  technical: 'Technical Information',
  custom: 'Custom Keywords'
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          {[
            { id: 'company' as Tab, label: 'Company Profile' },
            { id: 'detection' as Tab, label: 'Detection' },
            { id: 'export' as Tab, label: 'Export' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'company' && (
            <div className="space-y-6">
              {/* Company Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={config.companyInfo.primaryName}
                  onChange={(e) => updateCompanyInfo({ primaryName: e.target.value })}
                  placeholder="Enter your company name"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="mt-1 text-xs text-slate-500">
                  This will be detected and masked as &lt;COMPANY_NAME&gt;
                </p>
              </div>

              {/* Aliases */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Company Aliases
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newAlias}
                    onChange={(e) => setNewAlias(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddAlias()}
                    placeholder="Add an alias (e.g., acronym, abbreviation)"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddAlias}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.companyInfo.aliases.map((alias) => (
                    <span
                      key={alias}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-700 text-sm rounded-md"
                    >
                      {alias}
                      <button
                        onClick={() => removeAlias(alias)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Custom Keywords */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Custom Keywords to Detect
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                    placeholder="Add a keyword (e.g., project name, client name)"
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleAddKeyword}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {config.customEntities.keywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-sm rounded-md"
                    >
                      {keyword}
                      <button
                        onClick={() => removeKeyword(keyword)}
                        className="text-orange-400 hover:text-orange-600"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'detection' && (
            <div className="space-y-6">
              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Detection Categories
                </label>
                <div className="space-y-2">
                  {(Object.keys(categoryLabels) as DetectionCategory[]).map((category) => (
                    <label
                      key={category}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={config.detectionSettings.categoriesEnabled.includes(category)}
                        onChange={() => toggleCategory(category)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-slate-700">{categoryLabels[category]}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Confidence Threshold */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Minimum Confidence: {config.detectionSettings.minConfidence}%
                </label>
                <input
                  type="range"
                  min="50"
                  max="100"
                  value={config.detectionSettings.minConfidence}
                  onChange={(e) => updateDetectionSettings({ minConfidence: parseInt(e.target.value) })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-slate-500 mt-1">
                  <span>50% (More detections)</span>
                  <span>100% (Fewer, more accurate)</span>
                </div>
              </div>

              {/* Auto-mask */}
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.detectionSettings.autoMaskHighConfidence}
                  onChange={(e) => updateDetectionSettings({ autoMaskHighConfidence: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Auto-select high confidence items</span>
                  <p className="text-xs text-slate-500">Automatically select items with 90%+ confidence</p>
                </div>
              </label>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="space-y-6">
              {/* Include mapping file */}
              <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.exportPreferences.includeMappingFile}
                  onChange={(e) => updateExportPreferences({ includeMappingFile: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">Show mapping export option</span>
                  <p className="text-xs text-slate-500">Export a JSON file mapping placeholders to original values</p>
                </div>
              </label>

              {/* Default format */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Default Export Format
                </label>
                <select
                  value={config.exportPreferences.defaultFormat}
                  onChange={(e) => updateExportPreferences({ defaultFormat: e.target.value as 'same' | 'txt' | 'md' })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="same">Same as input</option>
                  <option value="txt">Plain Text (.txt)</option>
                  <option value="md">Markdown (.md)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <button
            onClick={resetConfig}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Reset to Defaults
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
