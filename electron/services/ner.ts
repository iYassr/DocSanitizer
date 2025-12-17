import nlp from 'compromise'

export interface NEREntity {
  text: string
  type: 'person' | 'organization' | 'place' | 'date' | 'money' | 'phone' | 'email'
  start: number
  end: number
}

export function extractEntities(text: string): NEREntity[] {
  const doc = nlp(text)
  const entities: NEREntity[] = []

  // Extract people names
  const people = doc.people()
  people.forEach((person: ReturnType<typeof nlp>) => {
    const personText = person.text()
    const indices = findAllIndices(text, personText)
    indices.forEach((start) => {
      entities.push({
        text: personText,
        type: 'person',
        start,
        end: start + personText.length
      })
    })
  })

  // Extract organizations
  const orgs = doc.organizations()
  orgs.forEach((org: ReturnType<typeof nlp>) => {
    const orgText = org.text()
    const indices = findAllIndices(text, orgText)
    indices.forEach((start) => {
      entities.push({
        text: orgText,
        type: 'organization',
        start,
        end: start + orgText.length
      })
    })
  })

  // Extract places
  const places = doc.places()
  places.forEach((place: ReturnType<typeof nlp>) => {
    const placeText = place.text()
    const indices = findAllIndices(text, placeText)
    indices.forEach((start) => {
      entities.push({
        text: placeText,
        type: 'place',
        start,
        end: start + placeText.length
      })
    })
  })

  // Extract money/currency mentions
  const money = doc.money()
  money.forEach((m: ReturnType<typeof nlp>) => {
    const moneyText = m.text()
    const indices = findAllIndices(text, moneyText)
    indices.forEach((start) => {
      entities.push({
        text: moneyText,
        type: 'money',
        start,
        end: start + moneyText.length
      })
    })
  })

  // Extract dates
  const dates = doc.dates()
  dates.forEach((d: ReturnType<typeof nlp>) => {
    const dateText = d.text()
    const indices = findAllIndices(text, dateText)
    indices.forEach((start) => {
      entities.push({
        text: dateText,
        type: 'date',
        start,
        end: start + dateText.length
      })
    })
  })

  // Deduplicate entities (same position)
  const seen = new Set<string>()
  const uniqueEntities = entities.filter((e) => {
    const key = `${e.start}-${e.end}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return uniqueEntities.sort((a, b) => a.start - b.start)
}

function findAllIndices(text: string, search: string): number[] {
  const indices: number[] = []
  let idx = text.indexOf(search)
  while (idx !== -1) {
    indices.push(idx)
    idx = text.indexOf(search, idx + 1)
  }
  return indices
}

// Additional NER-based detection for specific entity types
export function detectPersonNames(text: string): Array<{ text: string; start: number; end: number }> {
  const doc = nlp(text)
  const results: Array<{ text: string; start: number; end: number }> = []

  const people = doc.people()
  people.forEach((person: ReturnType<typeof nlp>) => {
    const personText = person.text()
    if (personText.length >= 2) {
      // Filter out single letters
      const indices = findAllIndices(text, personText)
      indices.forEach((start) => {
        results.push({
          text: personText,
          start,
          end: start + personText.length
        })
      })
    }
  })

  return results
}

export function detectOrganizations(text: string): Array<{ text: string; start: number; end: number }> {
  const doc = nlp(text)
  const results: Array<{ text: string; start: number; end: number }> = []

  const orgs = doc.organizations()
  orgs.forEach((org: ReturnType<typeof nlp>) => {
    const orgText = org.text()
    if (orgText.length >= 2) {
      const indices = findAllIndices(text, orgText)
      indices.forEach((start) => {
        results.push({
          text: orgText,
          start,
          end: start + orgText.length
        })
      })
    }
  })

  return results
}

export function detectAddresses(text: string): Array<{ text: string; start: number; end: number }> {
  // Use NLP to find potential address patterns
  // This is a simplified version - real address detection would need more sophisticated patterns
  const addressPatterns = [
    // US style addresses
    /\d+\s+[A-Za-z]+(?:\s+[A-Za-z]+)*(?:\s+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|Court|Ct|Place|Pl|Circle|Cir))\b\.?(?:\s*,?\s*(?:Suite|Ste|Apt|Apartment|Unit|#)\s*\d+)?/gi,
    // PO Box
    /P\.?O\.?\s*Box\s*\d+/gi,
    // City, State ZIP
    /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s*,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?/g
  ]

  const results: Array<{ text: string; start: number; end: number }> = []
  const seen = new Set<string>()

  for (const pattern of addressPatterns) {
    let match: RegExpExecArray | null
    pattern.lastIndex = 0
    while ((match = pattern.exec(text)) !== null) {
      const key = `${match.index}-${match.index + match[0].length}`
      if (!seen.has(key)) {
        seen.add(key)
        results.push({
          text: match[0],
          start: match.index,
          end: match.index + match[0].length
        })
      }
    }
  }

  return results
}
