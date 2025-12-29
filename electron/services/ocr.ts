import Tesseract from 'tesseract.js'
import { createRequire } from 'module'
import { logDebug, logInfo, logError, logWarn } from './logger.js'
const require = createRequire(import.meta.url)

// Sharp is optional - native module may not be available on all platforms
let sharp: typeof import('sharp') | null = null
try {
  sharp = require('sharp')
  logInfo('Sharp image processing library loaded')
} catch (err) {
  logWarn('Sharp not available - image preprocessing will be skipped', { error: err })
}

export interface OCRResult {
  text: string
  confidence: number
  imageIndex: number
  words?: Array<{
    text: string
    confidence: number
    bbox: { x0: number; y0: number; x1: number; y1: number }
  }>
}

export interface ProcessedImage {
  buffer: Buffer
  width: number
  height: number
  format: string
}

// Preprocess image for better OCR results
async function preprocessImage(imageBuffer: Buffer): Promise<Buffer> {
  if (!sharp) {
    return imageBuffer
  }

  try {
    // Convert to grayscale, increase contrast, and normalize
    const processed = await sharp(imageBuffer)
      .grayscale()
      .normalize()
      .sharpen()
      .toBuffer()

    return processed
  } catch {
    // If preprocessing fails, return original
    return imageBuffer
  }
}

// Extract text from a single image
export async function extractTextFromImage(
  imageBuffer: Buffer,
  language: string = 'eng'
): Promise<OCRResult> {
  logInfo('Starting OCR text extraction', { bufferSize: imageBuffer.length, language })

  const processedBuffer = await preprocessImage(imageBuffer)
  logDebug('Image preprocessed for OCR', { originalSize: imageBuffer.length, processedSize: processedBuffer.length })

  const result = await Tesseract.recognize(processedBuffer, language, {
    logger: () => {} // Suppress logging
  })

  // Validate result structure
  if (!result || !result.data) {
    logError('OCR returned invalid result', { result: typeof result })
    return {
      text: '',
      confidence: 0,
      imageIndex: 0,
      words: []
    }
  }

  const text = result.data.text || ''
  const confidence = typeof result.data.confidence === 'number' ? result.data.confidence : 0
  const words = Array.isArray(result.data.words) ? result.data.words : []

  logInfo('OCR extraction complete', {
    textLength: text.length,
    confidence,
    wordCount: words.length
  })

  return {
    text,
    confidence,
    imageIndex: 0,
    words: words.map(word => ({
      text: word?.text || '',
      confidence: typeof word?.confidence === 'number' ? word.confidence : 0,
      bbox: word?.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 }
    }))
  }
}

// Extract text from multiple images
export async function extractTextFromImages(
  imageBuffers: Buffer[],
  language: string = 'eng',
  onProgress?: (current: number, total: number) => void
): Promise<OCRResult[]> {
  logInfo('Starting batch OCR', { imageCount: imageBuffers.length, language })
  const results: OCRResult[] = []
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < imageBuffers.length; i++) {
    if (onProgress) {
      onProgress(i + 1, imageBuffers.length)
    }

    try {
      logDebug('Processing image in batch', { index: i, total: imageBuffers.length })
      const result = await extractTextFromImage(imageBuffers[i], language)
      result.imageIndex = i
      results.push(result)
      successCount++
    } catch (error) {
      logError('OCR error for image in batch', {
        imageIndex: i,
        error: error instanceof Error ? error.message : String(error),
        bufferSize: imageBuffers[i]?.length
      })
      results.push({
        text: '',
        confidence: 0,
        imageIndex: i,
        words: []
      })
      failCount++
    }
  }

  logInfo('Batch OCR complete', {
    total: imageBuffers.length,
    success: successCount,
    failed: failCount
  })

  return results
}

// Combine OCR results into a single text block
export function combineOCRResults(results: OCRResult[]): string {
  return results
    .filter(r => r.text.trim().length > 0)
    .map((r, i) => `[Image ${i + 1}]\n${r.text.trim()}`)
    .join('\n\n')
}

// Get image info from buffer
export async function getImageInfo(buffer: Buffer): Promise<ProcessedImage | null> {
  if (!sharp) {
    // Without sharp, we can't get metadata but assume it's valid
    return {
      buffer,
      width: 0,
      height: 0,
      format: 'unknown'
    }
  }

  try {
    const metadata = await sharp(buffer).metadata()
    return {
      buffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown'
    }
  } catch {
    return null
  }
}

// Check if buffer is a valid image
export async function isValidImage(buffer: Buffer): Promise<boolean> {
  if (!sharp) {
    // Without sharp, check for common image magic bytes
    if (buffer.length < 4) return false

    // PNG
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return true
    // JPEG
    if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return true
    // GIF
    if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return true
    // BMP
    if (buffer[0] === 0x42 && buffer[1] === 0x4D) return true
    // WebP
    if (buffer.length >= 12 && buffer.slice(0, 4).toString() === 'RIFF' && buffer.slice(8, 12).toString() === 'WEBP') return true

    return false
  }

  try {
    await sharp(buffer).metadata()
    return true
  } catch {
    return false
  }
}
