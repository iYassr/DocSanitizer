import type { Detection, DetectionCategory, Config, ScanStats } from '../types'

interface DetectionRule {
  id: string
  name: string
  category: DetectionCategory
  subcategory: string
  pattern: RegExp
  confidence: number
  placeholderTemplate: string
}

// Built-in detection rules
const builtInRules: DetectionRule[] = [
  // PII - Email
  {
    id: 'pii-email',
    name: 'Email Address',
    category: 'pii',
    subcategory: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    confidence: 95,
    placeholderTemplate: '<EMAIL_{n}>'
  },
  // PII - Phone (International)
  {
    id: 'pii-phone-intl',
    name: 'Phone Number (International)',
    category: 'pii',
    subcategory: 'phone',
    pattern: /(?:\+?[1-9]\d{0,2}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
    confidence: 80,
    placeholderTemplate: '<PHONE_{n}>'
  },
  // PII - Saudi National ID
  {
    id: 'pii-saudi-id',
    name: 'Saudi National ID',
    category: 'pii',
    subcategory: 'national_id',
    pattern: /\b[12]\d{9}\b/g,
    confidence: 85,
    placeholderTemplate: '<NATIONAL_ID_{n}>'
  },
  // PII - SSN
  {
    id: 'pii-ssn',
    name: 'Social Security Number',
    category: 'pii',
    subcategory: 'ssn',
    pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
    confidence: 95,
    placeholderTemplate: '<SSN_{n}>'
  },
  // PII - IBAN
  {
    id: 'pii-iban',
    name: 'IBAN',
    category: 'pii',
    subcategory: 'iban',
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4,30}\b/g,
    confidence: 90,
    placeholderTemplate: '<IBAN_{n}>'
  },
  // PII - Credit Card
  {
    id: 'pii-credit-card',
    name: 'Credit Card Number',
    category: 'pii',
    subcategory: 'credit_card',
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    confidence: 85,
    placeholderTemplate: '<CARD_NUMBER_{n}>'
  },
  // Technical - IP Address (IPv4)
  {
    id: 'tech-ipv4',
    name: 'IPv4 Address',
    category: 'technical',
    subcategory: 'ip_address',
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    confidence: 95,
    placeholderTemplate: '<IP_ADDRESS_{n}>'
  },
  // Technical - API Key patterns
  {
    id: 'tech-api-key',
    name: 'API Key',
    category: 'technical',
    subcategory: 'api_key',
    pattern: /\b(?:api[_-]?key|apikey|api[_-]?secret|secret[_-]?key)[=:\s]+["']?([a-zA-Z0-9_-]{20,})["']?/gi,
    confidence: 90,
    placeholderTemplate: '<API_KEY_{n}>'
  },
  // Technical - URLs with credentials
  {
    id: 'tech-url-creds',
    name: 'URL with Credentials',
    category: 'technical',
    subcategory: 'credentials',
    pattern: /https?:\/\/[^:]+:[^@]+@[^\s]+/g,
    confidence: 95,
    placeholderTemplate: '<CREDENTIAL_URL_{n}>'
  },
  // Financial - Currency amounts
  {
    id: 'fin-currency',
    name: 'Currency Amount',
    category: 'financial',
    subcategory: 'amount',
    pattern: /(?:[$€£¥₹]|SAR|USD|EUR|GBP)\s*[\d,]+(?:\.\d{2})?|\b[\d,]+(?:\.\d{2})?\s*(?:dollars?|euros?|pounds?|riyals?|SAR|USD|EUR|GBP)\b/gi,
    confidence: 80,
    placeholderTemplate: '<AMOUNT_{n}>'
  },
  // Financial - Account numbers
  {
    id: 'fin-account',
    name: 'Account Number',
    category: 'financial',
    subcategory: 'account',
    pattern: /\b(?:account|acct)[#:\s]*\d{6,20}\b/gi,
    confidence: 85,
    placeholderTemplate: '<ACCOUNT_{n}>'
  },
  // Dates
  {
    id: 'pii-date',
    name: 'Date',
    category: 'pii',
    subcategory: 'date',
    pattern: /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2},?\s+\d{4})\b/gi,
    confidence: 70,
    placeholderTemplate: '<DATE_{n}>'
  }
]

// Entity counter for consistent placeholder numbering
const entityCounters: Map<string, Map<string, number>> = new Map()

function getPlaceholder(template: string, text: string): string {
  const baseTemplate = template.replace('_{n}', '')

  if (!entityCounters.has(baseTemplate)) {
    entityCounters.set(baseTemplate, new Map())
  }

  const templateMap = entityCounters.get(baseTemplate)!
  const normalizedText = text.toLowerCase().trim()

  if (!templateMap.has(normalizedText)) {
    templateMap.set(normalizedText, templateMap.size + 1)
  }

  const num = templateMap.get(normalizedText)!
  return template.replace('{n}', String(num))
}

function resetEntityCounters() {
  entityCounters.clear()
}

function getContextSnippet(content: string, start: number, end: number, contextLength = 50): string {
  const contextStart = Math.max(0, start - contextLength)
  const contextEnd = Math.min(content.length, end + contextLength)

  let context = content.slice(contextStart, contextEnd)

  if (contextStart > 0) context = '...' + context
  if (contextEnd < content.length) context = context + '...'

  return context
}

export function detectSensitiveInfo(content: string, config: Config): Detection[] {
  resetEntityCounters()
  const detections: Detection[] = []
  const seenPositions = new Set<string>()

  // Run built-in rules
  for (const rule of builtInRules) {
    // Skip if category is not enabled
    if (!config.detectionSettings.categoriesEnabled.includes(rule.category)) {
      continue
    }

    // Skip if confidence is below threshold
    if (rule.confidence < config.detectionSettings.minConfidence) {
      continue
    }

    // Reset regex lastIndex
    rule.pattern.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = rule.pattern.exec(content)) !== null) {
      const posKey = `${match.index}-${match.index + match[0].length}`

      // Skip if we've already detected something at this position
      if (seenPositions.has(posKey)) continue
      seenPositions.add(posKey)

      const detection: Detection = {
        id: `${rule.id}-${match.index}`,
        text: match[0],
        category: rule.category,
        subcategory: rule.subcategory,
        confidence: rule.confidence,
        position: { start: match.index, end: match.index + match[0].length },
        suggestedPlaceholder: getPlaceholder(rule.placeholderTemplate, match[0]),
        context: getContextSnippet(content, match.index, match.index + match[0].length),
        approved: config.detectionSettings.autoMaskHighConfidence && rule.confidence >= 90
      }

      detections.push(detection)
    }
  }

  // Detect company name and aliases
  if (config.companyInfo.primaryName && config.detectionSettings.categoriesEnabled.includes('company')) {
    const companyNames = [config.companyInfo.primaryName, ...config.companyInfo.aliases].filter(Boolean)

    for (const name of companyNames) {
      const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\b${escapedName}\\b`, 'gi')

      let match: RegExpExecArray | null
      while ((match = pattern.exec(content)) !== null) {
        const posKey = `${match.index}-${match.index + match[0].length}`
        if (seenPositions.has(posKey)) continue
        seenPositions.add(posKey)

        detections.push({
          id: `company-name-${match.index}`,
          text: match[0],
          category: 'company',
          subcategory: 'company_name',
          confidence: 100,
          position: { start: match.index, end: match.index + match[0].length },
          suggestedPlaceholder: '<COMPANY_NAME>',
          context: getContextSnippet(content, match.index, match.index + match[0].length),
          approved: config.detectionSettings.autoMaskHighConfidence
        })
      }
    }
  }

  // Detect custom keywords
  if (config.detectionSettings.categoriesEnabled.includes('custom')) {
    for (const keyword of config.customEntities.keywords) {
      if (!keyword) continue

      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`\\b${escapedKeyword}\\b`, 'gi')

      let match: RegExpExecArray | null
      while ((match = pattern.exec(content)) !== null) {
        const posKey = `${match.index}-${match.index + match[0].length}`
        if (seenPositions.has(posKey)) continue
        seenPositions.add(posKey)

        detections.push({
          id: `custom-keyword-${match.index}`,
          text: match[0],
          category: 'custom',
          subcategory: 'keyword',
          confidence: 100,
          position: { start: match.index, end: match.index + match[0].length },
          suggestedPlaceholder: getPlaceholder('<KEYWORD_{n}>', match[0]),
          context: getContextSnippet(content, match.index, match.index + match[0].length),
          approved: config.detectionSettings.autoMaskHighConfidence
        })
      }
    }
  }

  // Sort by position
  detections.sort((a, b) => a.position.start - b.position.start)

  return detections
}

export function calculateStats(detections: Detection[]): ScanStats {
  const byCategory: Record<DetectionCategory, number> = {
    pii: 0,
    company: 0,
    financial: 0,
    technical: 0,
    custom: 0
  }

  const byConfidence = { high: 0, medium: 0, low: 0 }

  for (const detection of detections) {
    byCategory[detection.category]++

    if (detection.confidence >= 90) byConfidence.high++
    else if (detection.confidence >= 70) byConfidence.medium++
    else byConfidence.low++
  }

  return {
    totalDetections: detections.length,
    byCategory,
    byConfidence,
    processingTimeMs: 0
  }
}

export function applyMasking(content: string, detections: Detection[]): { maskedContent: string; mappings: Map<string, string[]> } {
  const approvedDetections = detections.filter(d => d.approved)

  // Sort by position in reverse order to replace from end to start
  const sortedDetections = [...approvedDetections].sort((a, b) => b.position.start - a.position.start)

  let maskedContent = content
  const mappings = new Map<string, string[]>()

  for (const detection of sortedDetections) {
    const before = maskedContent.slice(0, detection.position.start)
    const after = maskedContent.slice(detection.position.end)
    maskedContent = before + detection.suggestedPlaceholder + after

    // Track mappings
    const existing = mappings.get(detection.suggestedPlaceholder) || []
    if (!existing.includes(detection.text)) {
      existing.push(detection.text)
    }
    mappings.set(detection.suggestedPlaceholder, existing)
  }

  return { maskedContent, mappings }
}
