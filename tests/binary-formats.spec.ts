import { test, expect, _electron as electron, ElectronApplication, Page } from '@playwright/test'
import path from 'path'
import fs from 'fs/promises'
import os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let testDir: string

// Test content for binary formats
const TEST_DATA = {
  name: 'Ahmed Al-Rashid',
  email: 'ahmed.rashid@acme-corp.com',
  phone: '+966 55 123 4567',
  creditCard: '4532015112830366',
  iban: 'SA0380000000608010167519',
  ip: '192.168.1.100',
  ssn: '123-45-6789'
}

async function createTestFiles(dir: string) {
  // Create DOCX using the docx library
  const { Document, Paragraph, TextRun, Packer } = await import('docx')

  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Confidential Business Document', bold: true, size: 32 })]
        }),
        new Paragraph({ children: [new TextRun('')] }),
        new Paragraph({ children: [new TextRun('Contact Information:')] }),
        new Paragraph({ children: [new TextRun(`Name: ${TEST_DATA.name}`)] }),
        new Paragraph({ children: [new TextRun(`Email: ${TEST_DATA.email}`)] }),
        new Paragraph({ children: [new TextRun(`Phone: ${TEST_DATA.phone}`)] }),
        new Paragraph({ children: [new TextRun('')] }),
        new Paragraph({ children: [new TextRun('Financial Information:')] }),
        new Paragraph({ children: [new TextRun(`Credit Card: ${TEST_DATA.creditCard}`)] }),
        new Paragraph({ children: [new TextRun(`IBAN: ${TEST_DATA.iban}`)] }),
        new Paragraph({ children: [new TextRun(`SSN: ${TEST_DATA.ssn}`)] }),
        new Paragraph({ children: [new TextRun('')] }),
        new Paragraph({ children: [new TextRun('Technical Details:')] }),
        new Paragraph({ children: [new TextRun(`Server IP: ${TEST_DATA.ip}`)] }),
      ]
    }]
  })

  const buffer = await Packer.toBuffer(doc)
  await fs.writeFile(path.join(dir, 'test.docx'), buffer)
  console.log('Created test.docx')

  // Create XLSX using exceljs
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.default.Workbook()
  const worksheet = workbook.addWorksheet('Sensitive Data')

  worksheet.columns = [
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 35 },
    { header: 'Phone', key: 'phone', width: 20 },
    { header: 'Credit Card', key: 'creditCard', width: 20 },
    { header: 'IBAN', key: 'iban', width: 30 },
  ]

  worksheet.addRow({
    name: TEST_DATA.name,
    email: TEST_DATA.email,
    phone: TEST_DATA.phone,
    creditCard: TEST_DATA.creditCard,
    iban: TEST_DATA.iban
  })

  worksheet.addRow({
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '+1 555-987-6543',
    creditCard: '5425233430109903',
    iban: 'DE89370400440532013000'
  })

  await workbook.xlsx.writeFile(path.join(dir, 'test.xlsx'))
  console.log('Created test.xlsx')

  // Create PDF using pdf-lib
  const { PDFDocument, StandardFonts } = await import('pdf-lib')

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([600, 800])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let y = 750
  const lineHeight = 20

  page.drawText('Confidential Business Document', { x: 50, y, font: boldFont, size: 18 })
  y -= lineHeight * 2

  page.drawText('Contact Information:', { x: 50, y, font: boldFont, size: 12 })
  y -= lineHeight

  const lines = [
    `Name: ${TEST_DATA.name}`,
    `Email: ${TEST_DATA.email}`,
    `Phone: ${TEST_DATA.phone}`,
    '',
    'Financial Information:',
    `Credit Card: ${TEST_DATA.creditCard}`,
    `IBAN: ${TEST_DATA.iban}`,
    `SSN: ${TEST_DATA.ssn}`,
    '',
    'Technical Details:',
    `Server IP: ${TEST_DATA.ip}`,
  ]

  for (const line of lines) {
    if (line.includes('Information:') || line.includes('Details:')) {
      page.drawText(line, { x: 50, y, font: boldFont, size: 12 })
    } else {
      page.drawText(line, { x: 50, y, font, size: 11 })
    }
    y -= lineHeight
  }

  const pdfBytes = await pdfDoc.save()
  await fs.writeFile(path.join(dir, 'test.pdf'), pdfBytes)
  console.log('Created test.pdf')
}

test.beforeAll(async () => {
  // Create temp directory for test files
  testDir = path.join(os.tmpdir(), `maskr-binary-test-${Date.now()}`)
  await fs.mkdir(testDir, { recursive: true })
  console.log('Test directory:', testDir)

  // Create all binary test files
  await createTestFiles(testDir)
  console.log('Binary test files created')
})

test.afterAll(async () => {
  console.log('Test files preserved in:', testDir)
})

test.describe('maskr Binary Formats E2E Tests', () => {
  let electronApp: ElectronApplication
  let page: Page

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      args: [path.join(__dirname, '../dist-electron/main.js')],
      env: {
        ...process.env,
        NODE_ENV: 'test'
      }
    })
    page = await electronApp.firstWindow()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForTimeout(2000)

    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`[RENDERER ERROR]:`, msg.text())
      }
    })
    page.on('pageerror', error => {
      console.log('[PAGE ERROR]:', error.message)
    })
  })

  test.afterEach(async () => {
    await electronApp?.close()
  })

  async function testBinaryFormat(filename: string, expectedDetections: string[]) {
    const testFile = path.join(testDir, filename)
    const ext = path.extname(filename).toUpperCase()

    console.log(`\n=== Testing ${ext} format ===`)

    // Upload file
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFile)

    // Wait longer for binary files (they take more time to parse)
    await page.waitForTimeout(5000)

    // Take screenshot
    await page.screenshot({ path: path.join(testDir, `debug-${filename}.png`) })

    // Wait for review screen
    const reviewHeader = page.locator('text=Review Detections')
    await expect(reviewHeader).toBeVisible({ timeout: 90000 })
    console.log(`${ext}: Review screen loaded`)

    // Verify detections exist
    const table = page.locator('table')
    await expect(table).toBeVisible({ timeout: 10000 })

    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    console.log(`${ext}: Found ${count} detections`)
    expect(count).toBeGreaterThan(0)

    // Check for expected detections
    for (const expected of expectedDetections) {
      const cell = page.locator('table').getByText(expected, { exact: false })
      const isVisible = await cell.first().isVisible().catch(() => false)
      console.log(`${ext}: Detection "${expected.substring(0, 30)}...": ${isVisible ? 'FOUND' : 'NOT FOUND'}`)
    }

    // Continue to export
    const continueBtn = page.locator('button', { hasText: 'Continue' })
    await expect(continueBtn).toBeVisible({ timeout: 5000 })
    await continueBtn.click()

    // Verify export screen
    await page.waitForTimeout(2000)
    const exportSection = page.locator('text=Export Sanitized Document')
    await expect(exportSection).toBeVisible({ timeout: 10000 })
    console.log(`${ext}: Export screen loaded`)

    // Verify export button exists
    const exportBtn = page.locator('button', { hasText: 'Export' })
    await expect(exportBtn.first()).toBeVisible()

    console.log(`${ext}: Test PASSED`)
    return true
  }

  test('DOCX format - full workflow', async () => {
    await testBinaryFormat('test.docx', [
      TEST_DATA.email,
      TEST_DATA.creditCard,
      TEST_DATA.iban
    ])
  })

  test('XLSX format - full workflow', async () => {
    await testBinaryFormat('test.xlsx', [
      TEST_DATA.email,
      'sarah.j@example.com',
      TEST_DATA.creditCard
    ])
  })

  test('PDF format - full workflow', async () => {
    await testBinaryFormat('test.pdf', [
      TEST_DATA.email,
      TEST_DATA.creditCard,
      TEST_DATA.ip
    ])
  })

  test('DOCX detection accuracy', async () => {
    const testFile = path.join(testDir, 'test.docx')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFile)

    await page.locator('text=Review Detections').waitFor({ timeout: 90000 })

    // Check specific detections
    const email = page.locator('table').getByText(TEST_DATA.email)
    await expect(email.first()).toBeVisible({ timeout: 5000 })

    const creditCard = page.locator('table').getByText(TEST_DATA.creditCard)
    await expect(creditCard.first()).toBeVisible({ timeout: 5000 })

    const iban = page.locator('table').getByText(TEST_DATA.iban)
    await expect(iban.first()).toBeVisible({ timeout: 5000 })

    console.log('DOCX: All critical detections verified')
  })

  test('XLSX multi-row detection', async () => {
    const testFile = path.join(testDir, 'test.xlsx')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFile)

    await page.locator('text=Review Detections').waitFor({ timeout: 90000 })

    // Check detections from both rows
    const email1 = page.locator('table').getByText(TEST_DATA.email)
    const email2 = page.locator('table').getByText('sarah.j@example.com')

    await expect(email1.first()).toBeVisible({ timeout: 5000 })
    await expect(email2.first()).toBeVisible({ timeout: 5000 })

    console.log('XLSX: Multi-row detection verified')
  })

  test('PDF text extraction and detection', async () => {
    const testFile = path.join(testDir, 'test.pdf')

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(testFile)

    await page.locator('text=Review Detections').waitFor({ timeout: 90000 })

    // Verify table has detections
    const rows = page.locator('table tbody tr')
    const count = await rows.count()
    console.log(`PDF: Found ${count} detections from text extraction`)
    expect(count).toBeGreaterThan(0)

    // Check at least email is detected
    const tableContent = await page.locator('table').textContent() || ''
    expect(tableContent).toContain(TEST_DATA.email)

    console.log('PDF: Text extraction and detection verified')
  })
})
