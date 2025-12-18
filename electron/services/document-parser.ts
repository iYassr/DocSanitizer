import mammoth from 'mammoth'
import ExcelJS from 'exceljs'
import { PDFDocument } from 'pdf-lib'
import path from 'path'
import JSZip from 'jszip'

export interface ParsedDocument {
  content: string
  format: string
  metadata?: {
    title?: string
    author?: string
    pages?: number
    sheets?: string[]
  }
  images?: {
    id: string
    data: Buffer
    contentType: string
  }[]
}

export type SupportedFormat = 'txt' | 'md' | 'docx' | 'xlsx' | 'csv' | 'pdf' | 'json' | 'html' | 'png' | 'jpg' | 'jpeg' | 'gif' | 'bmp' | 'webp' | 'tiff'

export async function parseDocument(filePath: string, buffer: Buffer): Promise<ParsedDocument> {
  const ext = path.extname(filePath).toLowerCase().slice(1) as SupportedFormat

  switch (ext) {
    case 'txt':
    case 'md':
      return parseTextFile(buffer, ext)
    case 'docx':
      return parseDocx(buffer)
    case 'xlsx':
      return parseXlsx(buffer)
    case 'csv':
      return parseCsv(buffer)
    case 'pdf':
      return parsePdf(buffer)
    case 'json':
      return parseJson(buffer)
    case 'html':
      return parseHtml(buffer)
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'bmp':
    case 'webp':
    case 'tiff':
      return parseImage(buffer, ext)
    default:
      throw new Error(`Unsupported file format: ${ext}`)
  }
}

async function parseTextFile(buffer: Buffer, format: string): Promise<ParsedDocument> {
  const content = buffer.toString('utf-8')
  return { content, format }
}

async function parseImage(buffer: Buffer, format: string): Promise<ParsedDocument> {
  // Return the image buffer for OCR processing - content will be filled by OCR
  const contentType = format === 'jpg' ? 'image/jpeg' : `image/${format}`
  return {
    content: '', // Will be populated by OCR
    format: format,
    images: [
      {
        id: 'img_1',
        data: buffer,
        contentType
      }
    ]
  }
}

async function parseDocx(buffer: Buffer): Promise<ParsedDocument> {
  const result = await mammoth.extractRawText({ buffer })
  const images: ParsedDocument['images'] = []

  // Extract images directly from DOCX zip structure (word/media folder)
  try {
    const zip = await JSZip.loadAsync(buffer)

    // Find all files in word/media folder
    const mediaFiles = Object.keys(zip.files).filter(name =>
      name.startsWith('word/media/') && !zip.files[name].dir
    )

    for (const filePath of mediaFiles) {
      const file = zip.files[filePath]
      const imageBuffer = await file.async('nodebuffer')
      const fileName = filePath.split('/').pop() || ''
      const ext = fileName.split('.').pop()?.toLowerCase() || ''

      // Determine content type
      let contentType = 'image/png'
      if (ext === 'jpg' || ext === 'jpeg') contentType = 'image/jpeg'
      else if (ext === 'gif') contentType = 'image/gif'
      else if (ext === 'webp') contentType = 'image/webp'
      else if (ext === 'bmp') contentType = 'image/bmp'
      else if (ext === 'emf' || ext === 'wmf') continue // Skip Windows metafiles

      const imageId = `img_${images.length + 1}`

      images.push({
        id: imageId,
        data: imageBuffer,
        contentType
      })
    }
  } catch {
    // Image extraction failed, continue without images
  }

  return {
    content: result.value,
    format: 'docx',
    images: images.length > 0 ? images : undefined
  }
}

async function parseXlsx(buffer: Buffer): Promise<ParsedDocument> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(buffer)

  const sheets: string[] = []
  const contentParts: string[] = []

  workbook.eachSheet((worksheet, _sheetId) => {
    sheets.push(worksheet.name)
    contentParts.push(`--- Sheet: ${worksheet.name} ---\n`)

    worksheet.eachRow({ includeEmpty: false }, (row, _rowNumber) => {
      const values = row.values as (string | number | boolean | Date | null | undefined)[]
      // Excel rows are 1-indexed, values array is 1-indexed as well
      const rowValues = values.slice(1).map((cell) => {
        if (cell === null || cell === undefined) return ''
        if (cell instanceof Date) return cell.toISOString()
        return String(cell)
      })
      contentParts.push(rowValues.join('\t'))
    })

    contentParts.push('\n')
  })

  return {
    content: contentParts.join('\n'),
    format: 'xlsx',
    metadata: { sheets }
  }
}

async function parseCsv(buffer: Buffer): Promise<ParsedDocument> {
  const content = buffer.toString('utf-8')
  return { content, format: 'csv' }
}

async function parsePdf(buffer: Buffer): Promise<ParsedDocument> {
  // Use unpdf for lightweight PDF text extraction
  try {
    const { extractText } = await import('unpdf')

    // Convert Buffer to Uint8Array for unpdf
    const uint8Array = new Uint8Array(buffer)

    // Extract text from PDF
    const { text, totalPages } = await extractText(uint8Array)

    // Try to get metadata using pdf-lib
    let title: string | undefined
    let author: string | undefined
    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      title = pdfDoc.getTitle() || undefined
      author = pdfDoc.getAuthor() || undefined
    } catch {
      // Ignore metadata extraction errors
    }

    return {
      content: text,
      format: 'pdf',
      metadata: {
        pages: totalPages,
        title,
        author
      }
    }
  } catch (error) {
    // Fallback: try to extract what we can from the PDF using pdf-lib
    console.error('PDF parsing error:', error)

    try {
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true })
      const pages = pdfDoc.getPages()

      return {
        content: `[PDF document with ${pages.length} pages - text extraction failed]`,
        format: 'pdf',
        metadata: {
          pages: pages.length,
          title: pdfDoc.getTitle() || undefined,
          author: pdfDoc.getAuthor() || undefined
        }
      }
    } catch {
      return {
        content: '[PDF document - text extraction failed]',
        format: 'pdf'
      }
    }
  }
}

async function parseJson(buffer: Buffer): Promise<ParsedDocument> {
  const content = buffer.toString('utf-8')
  try {
    // Pretty print JSON for better readability
    const parsed = JSON.parse(content)
    return {
      content: JSON.stringify(parsed, null, 2),
      format: 'json'
    }
  } catch {
    return { content, format: 'json' }
  }
}

async function parseHtml(buffer: Buffer): Promise<ParsedDocument> {
  const content = buffer.toString('utf-8')

  // Strip HTML tags and scripts for text extraction
  const textContent = content
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return {
    content: textContent,
    format: 'html'
  }
}

// Export functions for rebuilding documents
export async function createMaskedDocx(
  originalBuffer: Buffer,
  maskedContent: string
): Promise<Buffer> {
  // For now, we'll create a simple text-based docx
  // In future, we could preserve formatting
  const { Document, Packer, Paragraph, TextRun } = await import('docx')

  const paragraphs = maskedContent.split('\n').map(
    (line) =>
      new Paragraph({
        children: [new TextRun(line)]
      })
  )

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs
      }
    ]
  })

  return await Packer.toBuffer(doc)
}

export async function createMaskedXlsx(
  originalBuffer: Buffer,
  maskedContent: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sanitized')

  const lines = maskedContent.split('\n')

  for (const line of lines) {
    if (line.startsWith('--- Sheet:')) {
      // Skip sheet header lines
      continue
    }

    if (line.trim()) {
      const values = line.split('\t')
      worksheet.addRow(values)
    }
  }

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

export async function createMaskedPdf(
  originalBuffer: Buffer,
  maskedContent: string
): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib')

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  // Ensure maskedContent is a valid string
  const safeContent = typeof maskedContent === 'string' ? maskedContent : String(maskedContent || '')
  const lines = safeContent.split('\n')
  const fontSize = 10
  const lineHeight = fontSize * 1.5
  const margin = 50
  const pageWidth = 595 // A4
  const pageHeight = 842 // A4
  const maxLinesPerPage = Math.floor((pageHeight - margin * 2) / lineHeight)

  let currentPage = pdfDoc.addPage([pageWidth, pageHeight])
  let currentY = pageHeight - margin
  let lineCount = 0

  for (const line of lines) {
    if (lineCount >= maxLinesPerPage) {
      currentPage = pdfDoc.addPage([pageWidth, pageHeight])
      currentY = pageHeight - margin
      lineCount = 0
    }

    currentPage.drawText(line.slice(0, 100), {
      // Truncate long lines
      x: margin,
      y: currentY,
      size: fontSize,
      font,
      color: rgb(0, 0, 0)
    })

    currentY -= lineHeight
    lineCount++
  }

  return Buffer.from(await pdfDoc.save())
}
