import { useMemo, useState } from 'react'
import { useDocumentStore } from '../stores/documentStore'
import { useConfigStore } from '../stores/configStore'
import { applyMasking } from '../lib/detector'
import type { Detection, DetectionCategory } from '../types'

const categoryColors: Record<DetectionCategory, { bg: string; border: string; text: string }> = {
  pii: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
  company: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  financial: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
  technical: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  custom: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' }
}

const categoryLabels: Record<DetectionCategory, string> = {
  pii: 'Personal Info',
  company: 'Company',
  financial: 'Financial',
  technical: 'Technical',
  custom: 'Custom'
}

export function ReviewPanel() {
  const { content, detections, stats, toggleDetection, approveAll, rejectAll, file } = useDocumentStore()
  const { config } = useConfigStore()
  const [showPreview, setShowPreview] = useState<'original' | 'masked'>('original')
  const [copied, setCopied] = useState(false)

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
      <div className="flex-1 flex flex-col border-r border-slate-200">
        {/* Preview header */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center gap-4">
            <h2 className="font-medium text-slate-700">Document Preview</h2>
            <div className="flex bg-slate-100 rounded-lg p-0.5">
              <button
                onClick={() => setShowPreview('original')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  showPreview === 'original'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Original
              </button>
              <button
                onClick={() => setShowPreview('masked')}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  showPreview === 'masked'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-600 hover:text-slate-800'
                }`}
              >
                Masked
              </button>
            </div>
          </div>

          {stats && (
            <div className="text-sm text-slate-500">
              Processed in {stats.processingTimeMs}ms
            </div>
          )}
        </div>

        {/* Preview content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-50">
          <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <pre
              className="whitespace-pre-wrap font-mono text-sm text-slate-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: highlightedContent }}
            />
          </div>
        </div>
      </div>

      {/* Right: Detection Panel */}
      <div className="w-96 flex flex-col bg-white">
        {/* Stats header */}
        <div className="px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-medium text-slate-700">Detected Items</h2>
            <span className="text-sm text-slate-500">
              {approvedCount}/{detections.length} selected
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={approveAll}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Select All
            </button>
            <button
              onClick={rejectAll}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
            >
              Deselect All
            </button>
          </div>
        </div>

        {/* Detection list */}
        <div className="flex-1 overflow-auto">
          {(Object.keys(groupedDetections) as DetectionCategory[]).map((category) => {
            const items = groupedDetections[category]
            if (items.length === 0) return null

            const colors = categoryColors[category]
            const approvedInCategory = items.filter(d => d.approved).length

            return (
              <div key={category} className="border-b border-slate-100">
                <div className={`px-4 py-2 ${colors.bg} flex items-center justify-between`}>
                  <span className={`font-medium text-sm ${colors.text}`}>
                    {categoryLabels[category]} ({items.length})
                  </span>
                  <span className="text-xs text-slate-500">
                    {approvedInCategory} selected
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {items.map((detection) => (
                    <label
                      key={detection.id}
                      className="flex items-start gap-3 px-4 py-2 hover:bg-slate-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={detection.approved}
                        onChange={() => toggleDetection(detection.id)}
                        className="mt-1 w-4 h-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm text-slate-800 truncate">
                            {detection.text}
                          </span>
                          <span className={`shrink-0 text-xs px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}>
                            {detection.confidence}%
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          → {detection.suggestedPlaceholder}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}

          {detections.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-slate-600 font-medium">No sensitive data detected</p>
              <p className="text-sm text-slate-500 mt-1">Your document appears to be clean</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 space-y-2">
          {config.exportPreferences.includeMappingFile && approvedCount > 0 && (
            <button
              onClick={handleExportMapping}
              className="w-full px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Export Mapping
            </button>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleCopyToClipboard}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
