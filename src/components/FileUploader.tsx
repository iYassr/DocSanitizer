import { useState, useCallback } from 'react'
import { useDocumentStore } from '../stores/documentStore'
import { useConfigStore } from '../stores/configStore'
import { detectSensitiveInfo, calculateStats } from '../lib/detector'

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')

  const { setFile, setContent, setDetections, setStats, setView, setIsProcessing } = useDocumentStore()
  const { config } = useConfigStore()

  const processContent = useCallback((content: string, _fileName: string) => {
    setIsProcessing(true)
    const startTime = performance.now()

    try {
      const detections = detectSensitiveInfo(content, config)
      const stats = calculateStats(detections)
      stats.processingTimeMs = Math.round(performance.now() - startTime)

      setContent(content)
      setDetections(detections)
      setStats(stats)
      setView('review')
    } finally {
      setIsProcessing(false)
    }
  }, [config, setContent, setDetections, setStats, setView, setIsProcessing])

  const handleFile = useCallback(async (fileData: { fileName: string; extension: string; buffer: string }) => {
    // For Phase 1, we only support TXT and MD files
    const supportedExtensions = ['txt', 'md']

    if (!supportedExtensions.includes(fileData.extension)) {
      alert(`Currently only .txt and .md files are supported. Support for .${fileData.extension} coming soon!`)
      return
    }

    // Decode base64 content
    const content = atob(fileData.buffer)

    setFile({
      filePath: '',
      fileName: fileData.fileName,
      extension: fileData.extension,
      buffer: fileData.buffer,
      size: content.length,
      content
    })

    processContent(content, fileData.fileName)
  }, [setFile, processContent])

  const handleOpenFile = async () => {
    const result = await window.api.openFile()
    if (result) {
      handleFile(result)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    const file = files[0]
    const filePath = (file as File & { path?: string }).path

    if (filePath) {
      const result = await window.api.readFile(filePath)
      if (result) {
        handleFile(result)
      }
    } else {
      // Fallback: read file using FileReader
      const reader = new FileReader()
      reader.onload = () => {
        const content = reader.result as string
        const extension = file.name.split('.').pop()?.toLowerCase() || 'txt'

        setFile({
          filePath: '',
          fileName: file.name,
          extension,
          buffer: btoa(content),
          size: content.length,
          content
        })

        processContent(content, file.name)
      }
      reader.readAsText(file)
    }
  }

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return

    setFile({
      filePath: '',
      fileName: 'pasted-text.txt',
      extension: 'txt',
      buffer: btoa(pasteText),
      size: pasteText.length,
      content: pasteText
    })

    processContent(pasteText, 'pasted-text.txt')
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="w-full max-w-2xl">
        {!pasteMode ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleOpenFile}
            className={`
              relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
              transition-all duration-200 ease-in-out
              ${isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }
            `}
          >
            <div className="flex flex-col items-center gap-4">
              <div className={`
                w-16 h-16 rounded-full flex items-center justify-center transition-colors
                ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}
              `}>
                <svg
                  className={`w-8 h-8 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <div>
                <p className="text-lg font-medium text-slate-700">
                  Drop files here or click to upload
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Supported: TXT, MD (more formats coming soon)
                </p>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <span className="text-sm text-slate-400">or</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setPasteMode(true)
                  }}
                  className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Paste text directly
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-slate-800">Paste Text</h2>
              <button
                onClick={() => setPasteMode(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your text here..."
              className="w-full h-64 p-4 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setPasteMode(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteSubmit}
                disabled={!pasteText.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Scan for Sensitive Data
              </button>
            </div>
          </div>
        )}

        {/* Features list */}
        <div className="mt-8 grid grid-cols-3 gap-4">
          {[
            { icon: '🔒', title: '100% Local', desc: 'No data leaves your device' },
            { icon: '🎯', title: 'Smart Detection', desc: 'PII, emails, phones & more' },
            { icon: '⚡', title: 'Fast Processing', desc: 'Instant results' }
          ].map((feature) => (
            <div key={feature.title} className="text-center p-4">
              <div className="text-2xl mb-2">{feature.icon}</div>
              <h3 className="font-medium text-slate-700">{feature.title}</h3>
              <p className="text-sm text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
