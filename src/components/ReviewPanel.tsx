import { useMemo, useState, type ReactNode } from 'react'
import { useDocumentStore } from '../stores/documentStore'
import { useConfigStore } from '../stores/configStore'
import { applyMasking } from '../lib/detector'
import type { Detection, DetectionCategory } from '../types'

const categoryConfig: Record<DetectionCategory, { label: string; icon: ReactNode }> = {
  pii: {
    label: 'Personal Info',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  company: {
    label: 'Company',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  financial: {
    label: 'Financial',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  },
  technical: {
    label: 'Technical',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    )
  },
  custom: {
    label: 'Custom',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    )
  }
}

export function ReviewPanel() {
  const { content, detections, stats, toggleDetection, approveAll, rejectAll, file } = useDocumentStore()
  const { config } = useConfigStore()
  const [showPreview, setShowPreview] = useState<'original' | 'masked'>('original')
  const [copied, setCopied] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<Set<DetectionCategory>>(new Set(['pii', 'company', 'financial', 'technical', 'custom']))

  // Group detections by category
  const groupedDetections = useMemo(() => {
    const groups: Record<DetectionCategory, Detection[]> = {
      pii: [],
      company: [],
      financial: [],
      technical: [],
      custom: []
    }

    for (const detection of detections) {
      groups[detection.category].push(detection)
    }

    return groups
  }, [detections])

  // Generate masked content
  const { maskedContent, mappings } = useMemo(() => {
    return applyMasking(content, detections)
  }, [content, detections])

  // Highlighted content for preview
  const highlightedContent = useMemo(() => {
    if (showPreview === 'masked') {
      return maskedContent
    }

    // Create highlighted version
    const sortedDetections = [...detections]
      .filter(d => d.approved)
      .sort((a, b) => b.position.start - a.position.start)

    let result = content
    for (const detection of sortedDetections) {
      const before = result.slice(0, detection.position.start)
      const text = result.slice(detection.position.start, detection.position.end)
      const after = result.slice(detection.position.end)
      result = `${before}<mark class="highlight-${detection.category}">${text}</mark>${after}`
    }

    return result
  }, [content, detections, showPreview, maskedContent])

  const approvedCount = detections.filter(d => d.approved).length

  const toggleCategory = (category: DetectionCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const handleDownload = () => {
    const blob = new Blob([maskedContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `sanitized_${file?.fileName || 'document.txt'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyToClipboard = async () => {
    await navigator.clipboard.writeText(maskedContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExportMapping = () => {
    const mappingObj: Record<string, string[]> = {}
    mappings.forEach((values, placeholder) => {
      mappingObj[placeholder] = values
    })

    const blob = new Blob([JSON.stringify(mappingObj, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `mapping_${file?.fileName || 'document'}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex h-full">
      {/* Left: Document Preview */}
      <div className="flex-1 flex flex-col border-r border-[var(--border-primary)]">
        {/* Preview header */}
        <div className="flex items-center justify-between px-6 py-4 glass border-b border-[var(--border-primary)]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-secondary-dim)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="font-display font-semibold text-[var(--text-primary)]">Document Preview</h2>
            </div>

            {/* Toggle buttons */}
            <div className="flex bg-[var(--bg-tertiary)] rounded-lg p-1 border border-[var(--border-primary)]">
              <button
                onClick={() => setShowPreview('original')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  showPreview === 'original'
                    ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-primary-dim)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setShowPreview('masked')}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  showPreview === 'masked'
                    ? 'bg-[var(--accent-primary)] text-[var(--bg-primary)] shadow-lg shadow-[var(--accent-primary-dim)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                Masked
              </button>
            </div>
          </div>

          {stats && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-primary)]">
              <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm font-mono text-[var(--text-secondary)]">{stats.processingTimeMs}ms</span>
            </div>
          )}
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-auto p-6 bg-[var(--bg-primary)]">
          <div className="max-w-4xl mx-auto card p-8 animate-fade-in">
            <pre
              className="whitespace-pre-wrap font-mono text-sm text-[var(--text-secondary)] leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
          </div>
        </div>
      </div>

      {/* Right: Detection Panel */}
      <div className="w-[400px] flex flex-col bg-[var(--bg-secondary)]">
        {/* Stats header */}
        <div className="px-5 py-4 border-b border-[var(--border-primary)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary-dim)] flex items-center justify-center">
                <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h2 className="font-display font-semibold text-[var(--text-primary)]">Detections</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-display font-bold text-[var(--accent-primary)]">{approvedCount}</span>
              <span className="text-sm text-[var(--text-tertiary)]">/ {detections.length}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] transition-all duration-300"
              style={{ width: detections.length > 0 ? `${(approvedCount / detections.length) * 100}%` : '0%' }}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={approveAll}
              className="flex-1 btn-secondary px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
              </svg>
              Select All
            </button>
            <button
              onClick={rejectAll}
              className="flex-1 btn-secondary px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Deselect All
            </button>
          </div>
        </div>

        {/* Detection list */}
        <div className="flex-1 overflow-auto">
          {(Object.keys(groupedDetections) as DetectionCategory[]).map((category) => {
            const items = groupedDetections[category]
            if (items.length === 0) return null

            const approvedInCategory = items.filter(d => d.approved).length
            const isExpanded = expandedCategories.has(category)
            const config = categoryConfig[category]

            return (
              <div key={category} className="border-b border-[var(--border-secondary)]">
                {/* Category header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-[var(--bg-tertiary)] transition-colors`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center badge-${category}`}>
                      {config.icon}
                    </div>
                    <div className="text-left">
                      <span className="font-medium text-sm text-[var(--text-primary)]">
                        {config.label}
                      </span>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {approvedInCategory} of {items.length} selected
                      </div>
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-[var(--text-tertiary)] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Detection items */}
                {isExpanded && (
                  <div className="bg-[var(--bg-primary)]">
                    {items.map((detection, index) => (
                      <label
                        key={detection.id}
                        className={`
                          flex items-start gap-3 px-4 py-3 cursor-pointer transition-all duration-200
                          hover:bg-[var(--bg-tertiary)] border-l-2
                          ${detection.approved ? `border-[var(--color-${category})]` : 'border-transparent'}
                          animate-fade-in
                        `}
                        style={{ animationDelay: `${index * 0.03}s` }}
                      >
                        <input
                          type="checkbox"
                          checked={detection.approved}
                          onChange={() => toggleDetection(detection.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-[var(--text-primary)] break-all">
                              {detection.text}
                            </span>
                            <span className={`badge badge-${category} shrink-0`}>
                              {detection.confidence}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[var(--text-tertiary)] font-mono">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="text-[var(--accent-primary)]">{detection.suggestedPlaceholder}</span>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })}

          {detections.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-success-dim)] flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <p className="font-display font-semibold text-[var(--text-primary)]">All Clear</p>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">No sensitive data detected in this document</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-tertiary)] space-y-3">
          {config.exportPreferences.includeMappingFile && approvedCount > 0 && (
            <button
              onClick={handleExportMapping}
              className="w-full btn-secondary px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Export Mapping File
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleCopyToClipboard}
              className="flex-1 btn-secondary px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 btn-primary px-4 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
