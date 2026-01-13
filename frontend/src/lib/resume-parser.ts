import type { ResumeData } from '@/types/resume-builder'

// Pattern matchers for common resume fields
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const PHONE_PATTERN = /(?:\+?[0-9]{1,3}[-.\s]?)?(?:\([0-9]{2,4}\)|[0-9]{2,4})[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}/g
const LINKEDIN_PATTERN = /(?:linkedin\.com\/in\/|linkedin\.com\/pub\/)([a-zA-Z0-9-]+)/gi
const GITHUB_PATTERN = /(?:github\.com\/)([a-zA-Z0-9-]+)/gi
const URL_PATTERN = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g

// Common section headers for parsing
const SECTION_HEADERS = {
  experience: /^(?:experience|work\s*(?:experience|history)|employment\s*(?:history)?|professional\s*experience)/i,
  education: /^(?:education|academic\s*(?:background|history)?|qualifications?)/i,
  skills: /^(?:skills?|technical\s*skills?|core\s*(?:competencies|skills)|expertise|proficiencies)/i,
  summary: /^(?:summary|professional\s*summary|profile|objective|about\s*me|career\s*objective)/i,
  certifications: /^(?:certifications?|licenses?|credentials?|professional\s*(?:certifications?|development))/i,
  projects: /^(?:projects?|portfolio|personal\s*projects?|key\s*projects?)/i,
  languages: /^(?:languages?|language\s*(?:skills|proficiency))/i,
}

// Date pattern to extract dates
const DATE_PATTERN = /(?:(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s*\d{4}|\d{1,2}\/\d{4}|\d{4})/gi

interface ParsedSection {
  type: string
  content: string[]
  startIndex: number
}

function detectSections(lines: string[]): ParsedSection[] {
  const sections: ParsedSection[] = []
  let currentSection: ParsedSection | null = null

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Check if this line is a section header
    let matchedSection: string | null = null
    for (const [sectionType, pattern] of Object.entries(SECTION_HEADERS)) {
      if (pattern.test(line)) {
        matchedSection = sectionType
        break
      }
    }

    if (matchedSection) {
      if (currentSection) {
        sections.push(currentSection)
      }
      currentSection = {
        type: matchedSection,
        content: [],
        startIndex: i,
      }
    } else if (currentSection) {
      currentSection.content.push(line)
    } else {
      // Lines before any section header go to 'header' section
      if (!sections.find((s) => s.type === 'header')) {
        sections.push({
          type: 'header',
          content: [line],
          startIndex: 0,
        })
      } else {
        const headerSection = sections.find((s) => s.type === 'header')
        if (headerSection) {
          headerSection.content.push(line)
        }
      }
    }
  }

  if (currentSection) {
    sections.push(currentSection)
  }

  return sections
}

function parsePersonalInfo(headerContent: string[], fullText: string): ResumeData['personalInfo'] {
  const emails = fullText.match(EMAIL_PATTERN) || []
  const phones = fullText.match(PHONE_PATTERN) || []
  const linkedinMatches = fullText.match(LINKEDIN_PATTERN)
  const githubMatches = fullText.match(GITHUB_PATTERN)

  // Extract name - usually the first substantial line
  let firstName = ''
  let lastName = ''
  if (headerContent.length > 0) {
    const nameLine = headerContent[0]
    const nameParts = nameLine.split(/\s+/).filter((p) => p.length > 1 && !/[0-9@.]/.test(p))
    if (nameParts.length >= 2) {
      firstName = nameParts[0]
      lastName = nameParts.slice(1).join(' ')
    } else if (nameParts.length === 1) {
      firstName = nameParts[0]
    }
  }

  // Try to find headline (usually after name)
  let headline = ''
  if (headerContent.length > 1) {
    // Look for a line that looks like a title/headline
    for (let i = 1; i < Math.min(headerContent.length, 4); i++) {
      const line = headerContent[i]
      // Skip lines with email, phone, or URL
      if (!EMAIL_PATTERN.test(line) && !PHONE_PATTERN.test(line) && !URL_PATTERN.test(line)) {
        if (line.length > 5 && line.length < 100) {
          headline = line
          break
        }
      }
    }
  }

  // Try to extract location from header
  let location = ''
  const locationPatterns = [
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*([A-Z]{2})\s*(\d{5})?/,
    /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?),?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  ]
  for (const line of headerContent) {
    for (const pattern of locationPatterns) {
      const match = line.match(pattern)
      if (match && !EMAIL_PATTERN.test(line) && !URL_PATTERN.test(line)) {
        location = match[0]
        break
      }
    }
    if (location) break
  }

  return {
    firstName,
    lastName,
    email: emails[0] || '',
    phone: phones[0] || '',
    location,
    headline,
    summary: '',
    linkedinUrl: linkedinMatches ? `https://linkedin.com/in/${linkedinMatches[0].replace(/linkedin\.com\/in\//i, '')}` : '',
    githubUrl: githubMatches ? `https://github.com/${githubMatches[0].replace(/github\.com\//i, '')}` : '',
    portfolioUrl: '',
  }
}

function parseSummary(content: string[]): string {
  return content.join(' ').trim()
}

function parseExperience(content: string[]): ResumeData['experience'] {
  const experiences: ResumeData['experience'] = []
  let currentExp: Partial<ResumeData['experience'][0]> | null = null
  let descriptionLines: string[] = []

  for (let i = 0; i < content.length; i++) {
    const line = content[i].trim()
    if (!line) continue

    // Check if this looks like a new job entry (company name or title)
    const dates = line.match(DATE_PATTERN)
    const isNewEntry = dates && dates.length >= 1 && line.length < 150

    // Check for bullet points
    const isBullet = /^[•\-\*\u2022\u2023\u25E6\u2043]/.test(line) || /^\d+\./.test(line)

    if (isNewEntry || (i === 0 && !isBullet)) {
      // Save previous experience
      if (currentExp?.title || currentExp?.companyName) {
        currentExp.description = descriptionLines.join('\n')
        experiences.push({
          id: crypto.randomUUID(),
          companyName: currentExp.companyName || '',
          title: currentExp.title || '',
          location: currentExp.location || '',
          startDate: currentExp.startDate || '',
          endDate: currentExp.endDate || '',
          isCurrent: currentExp.isCurrent || false,
          description: currentExp.description || '',
          achievements: [],
        })
      }

      // Parse dates from line
      let startDate = ''
      let endDate = ''
      let isCurrent = false

      if (dates) {
        if (dates.length >= 2) {
          startDate = formatDateForInput(dates[0])
          if (/present|current|now/i.test(line)) {
            isCurrent = true
          } else {
            endDate = formatDateForInput(dates[1])
          }
        } else if (dates.length === 1) {
          startDate = formatDateForInput(dates[0])
          if (/present|current|now/i.test(line)) {
            isCurrent = true
          }
        }
      }

      // Try to extract title and company
      const lineWithoutDates = line.replace(DATE_PATTERN, '').replace(/present|current|now/gi, '').trim()
      const parts = lineWithoutDates.split(/[,|–-]/).map((p) => p.trim()).filter(Boolean)

      currentExp = {
        title: parts[0] || '',
        companyName: parts[1] || '',
        location: parts.length > 2 ? parts[2] : '',
        startDate,
        endDate,
        isCurrent,
      }
      descriptionLines = []
    } else if (currentExp) {
      // Add to description
      if (isBullet) {
        descriptionLines.push(line.replace(/^[•\-\*\u2022\u2023\u25E6\u2043]\s*/, '• '))
      } else {
        descriptionLines.push(line)
      }
    }
  }

  // Don't forget the last experience
  if (currentExp?.title || currentExp?.companyName) {
    currentExp.description = descriptionLines.join('\n')
    experiences.push({
      id: crypto.randomUUID(),
      companyName: currentExp.companyName || '',
      title: currentExp.title || '',
      location: currentExp.location || '',
      startDate: currentExp.startDate || '',
      endDate: currentExp.endDate || '',
      isCurrent: currentExp.isCurrent || false,
      description: currentExp.description || '',
      achievements: [],
    })
  }

  return experiences
}

function parseEducation(content: string[]): ResumeData['education'] {
  const education: ResumeData['education'] = []
  let currentEdu: Partial<ResumeData['education'][0]> | null = null

  for (let i = 0; i < content.length; i++) {
    const line = content[i].trim()
    if (!line) continue

    const dates = line.match(DATE_PATTERN)
    const isNewEntry = dates && dates.length >= 1

    // Check for degree indicators
    const degreeKeywords = /bachelor|master|phd|doctorate|associate|diploma|certificate|b\.?s\.?|b\.?a\.?|m\.?s\.?|m\.?a\.?|m\.?b\.?a\.?/i

    if (isNewEntry || degreeKeywords.test(line)) {
      if (currentEdu?.institution || currentEdu?.degree) {
        education.push({
          id: crypto.randomUUID(),
          institution: currentEdu.institution || '',
          degree: currentEdu.degree || '',
          fieldOfStudy: currentEdu.fieldOfStudy || '',
          startDate: currentEdu.startDate || '',
          endDate: currentEdu.endDate || '',
          isCurrent: currentEdu.isCurrent || false,
          grade: currentEdu.grade || '',
          description: currentEdu.description || '',
        })
      }

      let startDate = ''
      let endDate = ''
      let isCurrent = false

      if (dates) {
        if (dates.length >= 2) {
          startDate = formatDateForInput(dates[0])
          if (/present|current|now/i.test(line)) {
            isCurrent = true
          } else {
            endDate = formatDateForInput(dates[1])
          }
        } else if (dates.length === 1) {
          // For education, single date is usually graduation date
          endDate = formatDateForInput(dates[0])
        }
      }

      const lineWithoutDates = line.replace(DATE_PATTERN, '').replace(/present|current|now/gi, '').trim()
      const parts = lineWithoutDates.split(/[,|–-]/).map((p) => p.trim()).filter(Boolean)

      // Try to identify degree vs institution
      let degree = ''
      let institution = ''
      let fieldOfStudy = ''

      for (const part of parts) {
        if (degreeKeywords.test(part)) {
          degree = part
        } else if (/university|college|institute|school/i.test(part)) {
          institution = part
        } else if (!institution) {
          institution = part
        } else if (!fieldOfStudy) {
          fieldOfStudy = part
        }
      }

      currentEdu = {
        institution,
        degree,
        fieldOfStudy,
        startDate,
        endDate,
        isCurrent,
      }
    } else if (currentEdu) {
      // Additional info for current education entry
      if (!currentEdu.fieldOfStudy && !currentEdu.degree) {
        currentEdu.fieldOfStudy = line
      } else if (!currentEdu.description) {
        currentEdu.description = line
      }
    }
  }

  if (currentEdu?.institution || currentEdu?.degree) {
    education.push({
      id: crypto.randomUUID(),
      institution: currentEdu.institution || '',
      degree: currentEdu.degree || '',
      fieldOfStudy: currentEdu.fieldOfStudy || '',
      startDate: currentEdu.startDate || '',
      endDate: currentEdu.endDate || '',
      isCurrent: currentEdu.isCurrent || false,
      grade: currentEdu.grade || '',
      description: currentEdu.description || '',
    })
  }

  return education
}

function parseSkills(content: string[]): ResumeData['skills'] {
  const skills: ResumeData['skills'] = []
  const seen = new Set<string>()

  for (const line of content) {
    // Split by common delimiters
    const skillItems = line.split(/[,;|•\-\*\u2022\u2023\u25E6\u2043]/)

    for (const item of skillItems) {
      const skill = item.trim()
      // Filter out empty, too short, or too long items
      if (skill && skill.length > 1 && skill.length < 50 && !seen.has(skill.toLowerCase())) {
        seen.add(skill.toLowerCase())
        skills.push({
          id: crypto.randomUUID(),
          name: skill,
          level: 'INTERMEDIATE',
        })
      }
    }
  }

  return skills.slice(0, 30) // Limit to 30 skills
}

function parseCertifications(content: string[]): ResumeData['certifications'] {
  const certifications: ResumeData['certifications'] = []

  for (const line of content) {
    const dates = line.match(DATE_PATTERN)
    const lineWithoutDates = line.replace(DATE_PATTERN, '').trim()

    if (lineWithoutDates.length > 3) {
      const parts = lineWithoutDates.split(/[,|–-]/).map((p) => p.trim()).filter(Boolean)

      certifications.push({
        id: crypto.randomUUID(),
        name: parts[0] || lineWithoutDates,
        issuingOrganization: parts[1] || '',
        issueDate: dates && dates[0] ? formatDateForInput(dates[0]) : '',
        expiryDate: dates && dates[1] ? formatDateForInput(dates[1]) : '',
        credentialId: '',
        credentialUrl: '',
      })
    }
  }

  return certifications
}

function parseLanguages(content: string[]): ResumeData['languages'] {
  const languages: ResumeData['languages'] = []
  const proficiencyMap: Record<string, ResumeData['languages'][0]['proficiency']> = {
    native: 'NATIVE',
    fluent: 'FLUENT',
    advanced: 'PROFESSIONAL',
    professional: 'PROFESSIONAL',
    intermediate: 'CONVERSATIONAL',
    conversational: 'CONVERSATIONAL',
    basic: 'BASIC',
    elementary: 'BASIC',
    beginner: 'BASIC',
  }

  for (const line of content) {
    const items = line.split(/[,;|•\-\*]/)

    for (const item of items) {
      const trimmed = item.trim()
      if (trimmed.length < 2 || trimmed.length > 50) continue

      // Try to extract proficiency
      let proficiency: ResumeData['languages'][0]['proficiency'] = 'CONVERSATIONAL'
      let language = trimmed

      for (const [key, value] of Object.entries(proficiencyMap)) {
        if (trimmed.toLowerCase().includes(key)) {
          proficiency = value
          language = trimmed.replace(new RegExp(key, 'gi'), '').replace(/[()]/g, '').trim()
          break
        }
      }

      if (language && language.length > 1) {
        languages.push({
          id: crypto.randomUUID(),
          name: language,
          proficiency,
        })
      }
    }
  }

  return languages.slice(0, 10)
}

function formatDateForInput(dateStr: string): string {
  // Try to convert date string to YYYY-MM format
  const monthMap: Record<string, string> = {
    jan: '01', january: '01',
    feb: '02', february: '02',
    mar: '03', march: '03',
    apr: '04', april: '04',
    may: '05',
    jun: '06', june: '06',
    jul: '07', july: '07',
    aug: '08', august: '08',
    sep: '09', september: '09',
    oct: '10', october: '10',
    nov: '11', november: '11',
    dec: '12', december: '12',
  }

  const lower = dateStr.toLowerCase()

  // Check for month year format (e.g., "January 2020")
  for (const [month, num] of Object.entries(monthMap)) {
    if (lower.includes(month)) {
      const yearMatch = dateStr.match(/\d{4}/)
      if (yearMatch) {
        return `${yearMatch[0]}-${num}`
      }
    }
  }

  // Check for MM/YYYY format
  const mmyyyyMatch = dateStr.match(/(\d{1,2})\/(\d{4})/)
  if (mmyyyyMatch) {
    return `${mmyyyyMatch[2]}-${mmyyyyMatch[1].padStart(2, '0')}`
  }

  // Just year
  const yearMatch = dateStr.match(/\d{4}/)
  if (yearMatch) {
    return `${yearMatch[0]}-01`
  }

  return ''
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()

  // Import pdfjs-dist
  const pdfjsLib = await import('pdfjs-dist')

  // Get the version and set worker from CDN
  const version = pdfjsLib.version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`

  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise
    const textParts: string[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ')
      textParts.push(pageText)
    }

    return textParts.join('\n')
  } catch (error) {
    console.error('PDF parsing error:', error)
    throw new Error('Failed to parse PDF. Please try a different file.')
  }
}

export function parseResumeText(text: string): ResumeData {
  const lines = text.split(/\n/).map((line) => line.trim())
  const sections = detectSections(lines)

  // Find header section (content before first recognized section)
  const headerSection = sections.find((s) => s.type === 'header')

  // Parse personal info from header
  const personalInfo = parsePersonalInfo(headerSection?.content || lines.slice(0, 10), text)

  // Parse other sections
  const summarySection = sections.find((s) => s.type === 'summary')
  if (summarySection) {
    personalInfo.summary = parseSummary(summarySection.content)
  }

  const experienceSection = sections.find((s) => s.type === 'experience')
  const experience = experienceSection ? parseExperience(experienceSection.content) : []

  const educationSection = sections.find((s) => s.type === 'education')
  const education = educationSection ? parseEducation(educationSection.content) : []

  const skillsSection = sections.find((s) => s.type === 'skills')
  const skills = skillsSection ? parseSkills(skillsSection.content) : []

  const certificationsSection = sections.find((s) => s.type === 'certifications')
  const certifications = certificationsSection ? parseCertifications(certificationsSection.content) : []

  const languagesSection = sections.find((s) => s.type === 'languages')
  const languages = languagesSection ? parseLanguages(languagesSection.content) : []

  return {
    personalInfo,
    experience,
    education,
    skills,
    languages,
    certifications,
    projects: [],
  }
}

export async function parseResumeFile(file: File): Promise<ResumeData> {
  if (file.type === 'application/pdf') {
    const text = await extractTextFromPDF(file)
    return parseResumeText(text)
  }

  throw new Error('Unsupported file type. Please upload a PDF file.')
}
