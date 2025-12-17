import { useState, useCallback } from 'react'
import { useDocumentStore } from '../stores/documentStore'
import { useConfigStore } from '../stores/configStore'
import { detectSensitiveInfo, calculateStats } from '../lib/detector'

const SUPPORTED_FORMATS = ['txt', 'md', 'docx', 'xlsx', 'csv', 'pdf', 'json', 'html', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff']
const IMAGE_FORMATS = ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'tiff']

export function FileUploader() {
  const [isDragging, setIsDragging] = useState(false)
  const [pasteMode, setPasteMode] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { setFile, setContent, setDetections, setStats, setView, setIsProcessing, isProcessing } = useDocumentStore()
  const { config } = useConfigStore()

  const processContent = useCallback(async (content: string, _fileName: string) => {
    setIsProcessing(true)
    const startTime = performance.now()

    try {
      const detections = await detectSensitiveInfo(content, config)
      const stats = calculateStats(detections)
      stats.processingTimeMs = Math.round(performance.now() - startTime)

      setContent(content)
      setDetections(detections)
      setStats(stats)
      setView('review')
      setError(null)
    } catch (err) {
      console.error('Processing error:', err)
      setError('Failed to process document. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }, [config, setContent, setDetections, setStats, setView, setIsProcessing])

  const handleFile = useCallback(async (fileData: {
    filePath: string
    fileName: string
    extension: string
    buffer: string
  }) => {
    setError(null)

    if (!SUPPORTED_FORMATS.includes(fileData.extension)) {
      setError(`Unsupported file format: .${fileData.extension}. Supported formats: ${SUPPORTED_FORMATS.join(', ')}`)
      return
    }

    setIsProcessing(true)

    try {
      // Handle image files with OCR
      if (IMAGE_FORMATS.includes(fileData.extension)) {
        const ocrResult = await window.api.ocrExtractText(fileData.buffer)

        if (!ocrResult.success) {
          setError(ocrResult.error || 'Failed to extract text from image')
          setIsProcessing(false)
          return
        }

        const content = ocrResult.text || ''
        const confidence = ocrResult.confidence || 0

        setFile({
          filePath: fileData.filePath,
          fileName: fileData.fileName,
          extension: fileData.extension,
          buffer: fileData.buffer,
          size: atob(fileData.buffer).length,
          content: `[OCR extracted text - Confidence: ${confidence.toFixed(1)}%]\n\n${content}`
        })

        await processContent(content, fileData.fileName)
      }
      // Use the document parser API for complex formats
      else if (['docx', 'xlsx', 'pdf'].includes(fileData.extension)) {
        const parsed = await window.api.parseDocument(fileData.filePath || fileData.fileName, fileData.buffer)

        if (!parsed.success) {
          setError(parsed.error || 'Failed to parse document')
          setIsProcessing(false)
          return
        }

        setFile({
          filePath: fileData.filePath,
          fileName: fileData.fileName,
          extension: fileData.extension,
          buffer: fileData.buffer,
          size: atob(fileData.buffer).length,
          content: parsed.content
        })

        await processContent(parsed.content!, fileData.fileName)
      } else {
        // For text-based formats, decode directly
        const content = atob(fileData.buffer)

        setFile({
          filePath: fileData.filePath,
          fileName: fileData.fileName,
          extension: fileData.extension,
          buffer: fileData.buffer,
          size: content.length,
          content
        })

        await processContent(content, fileData.fileName)
      }
    } catch (err) {
      console.error('File handling error:', err)
      setError('Failed to process file. Please try again.')
      setIsProcessing(false)
    }
  }, [setFile, processContent, setIsProcessing])

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
      reader.onload = async () => {
        const arrayBuffer = reader.result as ArrayBuffer
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
        )
        const extension = file.name.split('.').pop()?.toLowerCase() || 'txt'

        handleFile({
          filePath: '',
          fileName: file.name,
          extension,
          buffer: base64
        })
      }
      reader.readAsArrayBuffer(file)
    }
  }

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return

    setFile({
      filePath: '',
      fileName: 'pasted-text.txt',
      extension: 'txt',
      buffer: btoa(pasteText),
      size: pasteText.length,
      content: pasteText
    })

    await processContent(pasteText, 'pasted-text.txt')
  }

  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="w-full max-w-3xl animate-fade-in">
        {error && (
          <div className="mb-6 p-4 bg-[var(--color-danger-dim)] border border-[var(--color-danger)] rounded-xl text-[var(--color-danger)] text-sm font-mono flex items-center gap-3 animate-slide-up">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {!pasteMode ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={isProcessing ? undefined : handleOpenFile}
            className={`
              relative rounded-2xl p-12 text-center transition-all duration-300 ease-out overflow-hidden
              ${isProcessing
                ? 'glass cursor-wait'
                : isDragging
                  ? 'glass border-2 border-[var(--accent-primary)] cursor-pointer animate-glow-pulse'
                  : 'glass border-2 border-transparent hover:border-[var(--accent-primary)] cursor-pointer group'
              }
            `}
          >
            {/* Animated background gradient on hover */}
            <div className={`
              absolute inset-0 opacity-0 transition-opacity duration-500
              bg-gradient-to-br from-[var(--accent-primary-dim)] via-transparent to-[var(--accent-secondary-dim)]
              ${isDragging ? 'opacity-100' : 'group-hover:opacity-50'}
            `} />

            {/* Scan line effect when dragging */}
            {isDragging && (
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--accent-primary)] to-transparent animate-[scan-line_1.5s_ease-in-out_infinite]" />
              </div>
            )}

            <div className="relative z-10">
              {isProcessing ? (
                <div className="flex flex-col items-center gap-6">
                  {/* Animated processing indicator */}
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-4 border-[var(--border-primary)]" />
                    <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--accent-primary)] animate-spin" />
                    <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[var(--accent-secondary)] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <p className="text-xl font-display font-semibold text-[var(--text-primary)]">
                      Analyzing Document
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] font-mono">
                      Scanning for sensitive information...
                    </p>
                  </div>
                  {/* Progress dots */}
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-6">
                  {/* Upload icon with animated glow */}
                  <div className={`
                    relative w-24 h-24 rounded-2xl flex items-center justify-center transition-all duration-300
                    ${isDragging
                      ? 'bg-[var(--accent-primary-dim)] scale-110'
                      : 'bg-[var(--bg-elevated)] group-hover:bg-[var(--accent-primary-dim)] group-hover:scale-105'
                    }
                  `}>
                    <div className={`
                      absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-300
                      bg-[var(--accent-primary)]
                      ${isDragging ? 'opacity-30' : 'group-hover:opacity-20'}
                    `} />
                    <svg
                      className={`
                        relative w-12 h-12 transition-all duration-300
                        ${isDragging
                          ? 'text-[var(--accent-primary)] scale-110'
                          : 'text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)]'
                        }
                      `}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-xl font-display font-semibold text-[var(--text-primary)]">
                      {isDragging ? 'Release to scan' : 'Drop files here or click to upload'}
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-tertiary)] font-mono">
                      Supported: DOCX, PDF, XLSX, TXT, Images & more
                    </p>
                  </div>

                  <div className="flex items-center gap-4 mt-2">
                    <div className="h-px w-12 bg-[var(--border-primary)]" />
                    <span className="text-sm text-[var(--text-muted)] uppercase tracking-wider">or</span>
                    <div className="h-px w-12 bg-[var(--border-primary)]" />
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setPasteMode(true)
                    }}
                    className="btn-secondary px-6 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Paste text directly
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="glass rounded-2xl p-6 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--accent-secondary-dim)] flex items-center justify-center">
                  <svg className="w-5 h-5 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-display font-semibold text-[var(--text-primary)]">Paste Text</h2>
                  <p className="text-xs text-[var(--text-tertiary)]">Enter or paste content to analyze</p>
                </div>
              </div>
              <button
                onClick={() => setPasteMode(false)}
                className="btn-ghost p-2 rounded-lg"
                disabled={isProcessing}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="Paste your text here to scan for sensitive information..."
              className="input-field w-full h-64 p-4 rounded-xl resize-none text-sm"
              autoFocus
              disabled={isProcessing}
            />

            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-[var(--text-muted)] font-mono">
                {pasteText.length.toLocaleString()} characters
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setPasteMode(false)}
                  className="btn-ghost px-4 py-2 rounded-lg text-sm font-medium"
                  disabled={isProcessing}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim() || isProcessing}
                  className="btn-primary px-6 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                >
                  {isProcessing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      Scan Document
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Features list */}
        <div className="mt-10 grid grid-cols-3 gap-6">
          {[
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
              title: '100% Local',
              desc: 'All processing happens on your device',
              color: 'var(--color-success)'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
              title: 'Smart Detection',
              desc: 'NER-powered PII identification',
              color: 'var(--accent-primary)'
            },
            {
              icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              ),
              title: 'Multi-Format',
              desc: 'DOCX, PDF, XLSX, images & more',
              color: 'var(--accent-secondary)'
            }
          ].map((feature, index) => (
            <div
              key={feature.title}
              className={`
                card-elevated p-5 text-center transition-all duration-300 hover:scale-105
                animate-slide-up stagger-${index + 1}
              `}
            >
              <div
                className="w-12 h-12 mx-auto mb-4 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `color-mix(in srgb, ${feature.color} 15%, transparent)`,
                  color: feature.color
                }}
              >
                {feature.icon}
              </div>
              <h3 className="font-display font-semibold text-[var(--text-primary)]">{feature.title}</h3>
              <p className="text-sm text-[var(--text-tertiary)] mt-1">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
