import type { Detection, DetectionCategory, Config, ScanStats } from '../types'

interface DetectionRule {
  id: string
  name: string
  category: DetectionCategory
  subcategory: string
  pattern: RegExp
  confidence: number
  placeholderTemplate: string
  validator?: (match: string) => boolean
}

// Luhn algorithm for credit card validation
function isValidLuhn(num: string): boolean {
  const digits = num.replace(/\D/g, '')
  if (digits.length < 13 || digits.length > 19) return false

  let sum = 0
  let isEven = false

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10)

    if (isEven) {
      digit *= 2
      if (digit > 9) digit -= 9
    }

    sum += digit
    isEven = !isEven
  }

  return sum % 10 === 0
}

// IBAN validation (basic structure check)
function isValidIBAN(iban: string): boolean {
  const cleanIban = iban.replace(/\s/g, '').toUpperCase()
  if (cleanIban.length < 15 || cleanIban.length > 34) return false
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleanIban)) return false
  return true
}

// Email validation (more comprehensive)
function isValidEmail(email: string): boolean {
  // Avoid matching filenames or URLs that happen to contain @
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) return false
  const parts = email.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (local.length > 64 || domain.length > 253) return false
  if (!/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain)) return false
  return true
}

// Check if a string looks like a valid IPv4 address (not just matching the pattern)
function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.')
  if (parts.length !== 4) return false
  for (const part of parts) {
    const num = parseInt(part, 10)
    if (isNaN(num) || num < 0 || num > 255) return false
    // Avoid version numbers like 1.0.0.0 or 2.3.4.5 in context
    if (part !== String(num)) return false // Leading zeros check
  }
  return true
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
    placeholderTemplate: '<EMAIL_{n}>',
    validator: isValidEmail
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
  // PII - Saudi Phone
  {
    id: 'pii-saudi-phone',
    name: 'Saudi Phone Number',
    category: 'pii',
    subcategory: 'phone',
    pattern: /(?:\+?966|00966|0)?5[0-9]{8}/g,
    confidence: 90,
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
  // PII - Iqama (Resident ID)
  {
    id: 'pii-iqama',
    name: 'Iqama Number',
    category: 'pii',
    subcategory: 'national_id',
    pattern: /\b2\d{9}\b/g,
    confidence: 80,
    placeholderTemplate: '<IQAMA_{n}>'
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
  // PII - IBAN (General)
  {
    id: 'pii-iban',
    name: 'IBAN',
    category: 'pii',
    subcategory: 'iban',
    pattern: /\b[A-Z]{2}\d{2}[A-Z0-9]{4,30}\b/g,
    confidence: 90,
    placeholderTemplate: '<IBAN_{n}>',
    validator: isValidIBAN
  },
  // PII - Saudi IBAN
  {
    id: 'pii-saudi-iban',
    name: 'Saudi IBAN',
    category: 'pii',
    subcategory: 'iban',
    pattern: /\bSA\d{2}[A-Z0-9]{20}\b/g,
    confidence: 95,
    placeholderTemplate: '<IBAN_{n}>',
    validator: isValidIBAN
  },
  // PII - Credit Card
  {
    id: 'pii-credit-card',
    name: 'Credit Card Number',
    category: 'pii',
    subcategory: 'credit_card',
    pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
    confidence: 85,
    placeholderTemplate: '<CARD_NUMBER_{n}>',
    validator: isValidLuhn
  },
  // PII - Passport
  {
    id: 'pii-passport',
    name: 'Passport Number',
    category: 'pii',
    subcategory: 'passport',
    pattern: /\b[A-Z]{1,2}\d{6,9}\b/g,
    confidence: 70,
    placeholderTemplate: '<PASSPORT_{n}>'
  },
  // Technical - IP Address (IPv4)
  {
    id: 'tech-ipv4',
    name: 'IPv4 Address',
    category: 'technical',
    subcategory: 'ip_address',
    pattern: /\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    confidence: 95,
    placeholderTemplate: '<IP_ADDRESS_{n}>',
    validator: isValidIPv4
  },
  // Technical - IPv6 Address
  {
    id: 'tech-ipv6',
    name: 'IPv6 Address',
    category: 'technical',
    subcategory: 'ip_address',
    pattern: /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
    confidence: 95,
    placeholderTemplate: '<IP_ADDRESS_{n}>'
  },
  // Technical - API Key patterns
  {
    id: 'tech-api-key',
    name: 'API Key',
    category: 'technical',
    subcategory: 'api_key',
    pattern: /(?:api[_-]?key|apikey|api[_-]?secret|secret[_-]?key|access[_-]?token|auth[_-]?token)[=:\s]+["']?([a-zA-Z0-9_-]{20,})["']?/gi,
    confidence: 90,
    placeholderTemplate: '<API_KEY_{n}>'
  },
  // Technical - AWS Keys
  {
    id: 'tech-aws-key',
    name: 'AWS Access Key',
    category: 'technical',
    subcategory: 'api_key',
    pattern: /\b(?:AKIA|ABIA|ACCA|ASIA)[A-Z0-9]{16}\b/g,
    confidence: 95,
    placeholderTemplate: '<AWS_KEY_{n}>'
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
  // Technical - Private Keys
  {
    id: 'tech-private-key',
    name: 'Private Key',
    category: 'technical',
    subcategory: 'credentials',
    pattern: /-----BEGIN (?:RSA |DSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    confidence: 100,
    placeholderTemplate: '<PRIVATE_KEY>'
  },
  // Financial - Currency amounts (various currencies)
  {
    id: 'fin-currency',
    name: 'Currency Amount',
    category: 'financial',
    subcategory: 'amount',
    pattern: /(?:[$€£¥₹]|SAR|USD|EUR|GBP|AED|KWD|BHD|OMR|QAR)\s*[\d,]+(?:\.\d{1,2})?|\b[\d,]+(?:\.\d{1,2})?\s*(?:dollars?|euros?|pounds?|riyals?|dirhams?|SAR|USD|EUR|GBP|AED)\b/gi,
    confidence: 80,
    placeholderTemplate: '<AMOUNT_{n}>'
  },
  // Financial - Large numbers (potential financial)
  {
    id: 'fin-large-number',
    name: 'Large Number',
    category: 'financial',
    subcategory: 'amount',
    pattern: /\b\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?\b/g,
    confidence: 60,
    placeholderTemplate: '<NUMBER_{n}>'
  },
  // Financial - Account numbers
  {
    id: 'fin-account',
    name: 'Account Number',
    category: 'financial',
    subcategory: 'account',
    pattern: /\b(?:account|acct|a\/c)[#:\s]*\d{6,20}\b/gi,
    confidence: 85,
    placeholderTemplate: '<ACCOUNT_{n}>'
  },
  // Financial - Percentages (potentially sensitive)
  {
    id: 'fin-percentage',
    name: 'Percentage',
    category: 'financial',
    subcategory: 'percentage',
    pattern: /\b\d+(?:\.\d+)?%\b/g,
    confidence: 50,
    placeholderTemplate: '<PERCENTAGE_{n}>'
  },
  // Dates (various formats)
  {
    id: 'pii-date-numeric',
    name: 'Date (Numeric)',
    category: 'pii',
    subcategory: 'date',
    pattern: /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/g,
    confidence: 70,
    placeholderTemplate: '<DATE_{n}>'
  },
  {
    id: 'pii-date-text',
    name: 'Date (Text)',
    category: 'pii',
    subcategory: 'date',
    pattern: /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.\s]+\d{1,2}(?:st|nd|rd|th)?[,\s]+\d{4}\b/gi,
    confidence: 75,
    placeholderTemplate: '<DATE_{n}>'
  },
  // Technical - GitHub Token
  {
    id: 'tech-github-token',
    name: 'GitHub Token',
    category: 'technical',
    subcategory: 'api_key',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[a-zA-Z0-9]{36,}\b/g,
    confidence: 98,
    placeholderTemplate: '<GITHUB_TOKEN_{n}>'
  },
  // Technical - JWT Token
  {
    id: 'tech-jwt',
    name: 'JWT Token',
    category: 'technical',
    subcategory: 'credentials',
    pattern: /\beyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+\b/g,
    confidence: 95,
    placeholderTemplate: '<JWT_TOKEN_{n}>'
  },
  // Technical - Slack Token
  {
    id: 'tech-slack-token',
    name: 'Slack Token',
    category: 'technical',
    subcategory: 'api_key',
    pattern: /\bxox[pbar]-[0-9]{10,}-[0-9]{10,}-[a-zA-Z0-9]{24,}\b/g,
    confidence: 98,
    placeholderTemplate: '<SLACK_TOKEN_{n}>'
  },
  // Technical - Google API Key
  {
    id: 'tech-google-api',
    name: 'Google API Key',
    category: 'technical',
    subcategory: 'api_key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}\b/g,
    confidence: 95,
    placeholderTemplate: '<GOOGLE_API_KEY_{n}>'
  },
  // Technical - AWS Secret Key
  {
    id: 'tech-aws-secret',
    name: 'AWS Secret Key',
    category: 'technical',
    subcategory: 'api_key',
    pattern: /\b[A-Za-z0-9/+=]{40}\b/g,
    confidence: 60,
    placeholderTemplate: '<AWS_SECRET_{n}>'
  },
  // PII - Street Address
  {
    id: 'pii-address',
    name: 'Street Address',
    category: 'pii',
    subcategory: 'address',
    pattern: /\b\d{1,5}\s+[\w\s]{1,30}(?:street|st|avenue|ave|road|rd|highway|hwy|square|sq|trail|trl|drive|dr|court|ct|parkway|pkwy|circle|cir|boulevard|blvd)\b/gi,
    confidence: 75,
    placeholderTemplate: '<ADDRESS_{n}>'
  },
  // PII - US ZIP Code
  {
    id: 'pii-zip-us',
    name: 'US ZIP Code',
    category: 'pii',
    subcategory: 'address',
    pattern: /\b\d{5}(?:-\d{4})?\b/g,
    confidence: 60,
    placeholderTemplate: '<ZIP_CODE_{n}>'
  },
  // PII - Driver License
  {
    id: 'pii-driver-license',
    name: 'Driver License',
    category: 'pii',
    subcategory: 'license',
    pattern: /\b(?:DL|driver'?s?\s*license)[#:\s]*[A-Z0-9]{6,15}\b/gi,
    confidence: 80,
    placeholderTemplate: '<DRIVER_LICENSE_{n}>'
  },
  // Technical - Database Connection String
  {
    id: 'tech-db-connection',
    name: 'Database Connection String',
    category: 'technical',
    subcategory: 'credentials',
    pattern: /(?:mongodb|mysql|postgresql|postgres|redis|mssql):\/\/[^\s"']+/gi,
    confidence: 95,
    placeholderTemplate: '<DB_CONNECTION_{n}>'
  },
  // Technical - Stripe Key
  {
    id: 'tech-stripe-key',
    name: 'Stripe API Key',
    category: 'technical',
    subcategory: 'api_key',
    pattern: /\b(?:sk|pk)_(?:test|live)_[0-9a-zA-Z]{24,}\b/g,
    confidence: 98,
    placeholderTemplate: '<STRIPE_KEY_{n}>'
  },
  // PII - MAC Address
  {
    id: 'tech-mac-address',
    name: 'MAC Address',
    category: 'technical',
    subcategory: 'device_id',
    pattern: /\b(?:[0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}\b/g,
    confidence: 90,
    placeholderTemplate: '<MAC_ADDRESS_{n}>'
  },
  // PII - UUID
  {
    id: 'tech-uuid',
    name: 'UUID',
    category: 'technical',
    subcategory: 'identifier',
    pattern: /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
    confidence: 85,
    placeholderTemplate: '<UUID_{n}>'
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

export async function detectSensitiveInfo(content: string, config: Config): Promise<Detection[]> {
  // Early exit for empty or very short content
  if (!content || content.length < 3) {
    return []
  }

  resetEntityCounters()
  const detections: Detection[] = []
  const seenPositions = new Set<string>()

  // Pre-compute enabled categories as a Set for O(1) lookup
  const enabledCategories = new Set(config.detectionSettings.categoriesEnabled)
  const minConfidence = config.detectionSettings.minConfidence
  const autoMaskHighConfidence = config.detectionSettings.autoMaskHighConfidence

  // Pre-filter rules for better performance
  const applicableRules = builtInRules.filter(rule =>
    enabledCategories.has(rule.category) && rule.confidence >= minConfidence
  )

  // Run built-in rules
  for (const rule of applicableRules) {
    // Reset regex lastIndex
    rule.pattern.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = rule.pattern.exec(content)) !== null) {
      const posKey = `${match.index}-${match.index + match[0].length}`

      // Skip if we've already detected something at this position
      if (seenPositions.has(posKey)) continue

      // Run validator if available
      if (rule.validator && !rule.validator(match[0])) {
        continue
      }

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
        approved: autoMaskHighConfidence && rule.confidence >= 90
      }

      detections.push(detection)
    }
  }

  // Use NER for person names and organizations (if available)
  if (config.detectionSettings.categoriesEnabled.includes('pii') && window.api?.extractEntities) {
    try {
      // Pass custom names from config to enhance NER detection
      const customNames = config.customEntities.names || []
      const nerResult = await window.api.extractEntities(content, customNames)

      if (nerResult.success) {
        // Add person names
        if (nerResult.persons) {
          for (const person of nerResult.persons) {
            const posKey = `${person.start}-${person.end}`
            if (seenPositions.has(posKey)) continue
            seenPositions.add(posKey)

            detections.push({
              id: `ner-person-${person.start}`,
              text: person.text,
              category: 'pii',
              subcategory: 'person_name',
              confidence: 75,
              position: { start: person.start, end: person.end },
              suggestedPlaceholder: getPlaceholder('<PERSON_{n}>', person.text),
              context: getContextSnippet(content, person.start, person.end),
              approved: false // NER results need manual review
            })
          }
        }

        // Add organizations
        if (nerResult.organizations) {
          for (const org of nerResult.organizations) {
            const posKey = `${org.start}-${org.end}`
            if (seenPositions.has(posKey)) continue
            seenPositions.add(posKey)

            detections.push({
              id: `ner-org-${org.start}`,
              text: org.text,
              category: 'company',
              subcategory: 'organization',
              confidence: 70,
              position: { start: org.start, end: org.end },
              suggestedPlaceholder: getPlaceholder('<ORGANIZATION_{n}>', org.text),
              context: getContextSnippet(content, org.start, org.end),
              approved: false
            })
          }
        }
      }
    } catch (error) {
      console.error('NER extraction failed:', error)
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

  // Detect internal domains
  if (config.companyInfo.internalDomains && config.detectionSettings.categoriesEnabled.includes('technical')) {
    for (const domain of config.companyInfo.internalDomains) {
      if (!domain) continue

      const escapedDomain = domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const pattern = new RegExp(`https?://[^\\s]*${escapedDomain}[^\\s]*|\\b[a-zA-Z0-9.-]*\\.${escapedDomain}\\b`, 'gi')

      let match: RegExpExecArray | null
      while ((match = pattern.exec(content)) !== null) {
        const posKey = `${match.index}-${match.index + match[0].length}`
        if (seenPositions.has(posKey)) continue
        seenPositions.add(posKey)

        detections.push({
          id: `internal-url-${match.index}`,
          text: match[0],
          category: 'technical',
          subcategory: 'internal_url',
          confidence: 95,
          position: { start: match.index, end: match.index + match[0].length },
          suggestedPlaceholder: getPlaceholder('<INTERNAL_URL_{n}>', match[0]),
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

    // Detect custom clients
    for (const client of config.customEntities.clients) {
      const names = [client.name, ...client.aliases].filter(Boolean)
      for (const name of names) {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const pattern = new RegExp(`\\b${escapedName}\\b`, 'gi')

        let match: RegExpExecArray | null
        while ((match = pattern.exec(content)) !== null) {
          const posKey = `${match.index}-${match.index + match[0].length}`
          if (seenPositions.has(posKey)) continue
          seenPositions.add(posKey)

          detections.push({
            id: `custom-client-${match.index}`,
            text: match[0],
            category: 'custom',
            subcategory: 'client',
            confidence: 100,
            position: { start: match.index, end: match.index + match[0].length },
            suggestedPlaceholder: getPlaceholder('<CLIENT_{n}>', client.name),
            context: getContextSnippet(content, match.index, match.index + match[0].length),
            approved: config.detectionSettings.autoMaskHighConfidence
          })
        }
      }
    }

    // Detect custom projects
    for (const project of config.customEntities.projects) {
      const names = [project.name, ...project.aliases].filter(Boolean)
      for (const name of names) {
        const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const pattern = new RegExp(`\\b${escapedName}\\b`, 'gi')

        let match: RegExpExecArray | null
        while ((match = pattern.exec(content)) !== null) {
          const posKey = `${match.index}-${match.index + match[0].length}`
          if (seenPositions.has(posKey)) continue
          seenPositions.add(posKey)

          detections.push({
            id: `custom-project-${match.index}`,
            text: match[0],
            category: 'custom',
            subcategory: 'project',
            confidence: 100,
            position: { start: match.index, end: match.index + match[0].length },
            suggestedPlaceholder: getPlaceholder('<PROJECT_{n}>', project.name),
            context: getContextSnippet(content, match.index, match.index + match[0].length),
            approved: config.detectionSettings.autoMaskHighConfidence
          })
        }
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
