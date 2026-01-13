import type { ResumeData } from '@/types/resume-builder'

export interface ATSCheck {
  id: string
  name: string
  description: string
  category: 'formatting' | 'content' | 'keywords' | 'structure'
  passed: boolean
  score: number
  maxScore: number
  feedback: string
  suggestions?: string[]
}

export interface ATSScoreResult {
  overallScore: number
  maxScore: number
  percentage: number
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  checks: ATSCheck[]
  summary: string
  topIssues: string[]
}

// Common ATS-friendly keywords by category
const POWER_VERBS = [
  'achieved', 'accomplished', 'accelerated', 'administered', 'analyzed',
  'built', 'collaborated', 'created', 'delivered', 'designed', 'developed',
  'drove', 'enhanced', 'established', 'executed', 'expanded', 'generated',
  'grew', 'improved', 'increased', 'initiated', 'launched', 'led',
  'managed', 'mentored', 'negotiated', 'optimized', 'orchestrated',
  'pioneered', 'planned', 'produced', 'reduced', 'resolved', 'scaled',
  'spearheaded', 'streamlined', 'strengthened', 'transformed', 'upgraded'
]

const MEASURABLE_INDICATORS = [
  '%', 'percent', 'increased', 'decreased', 'reduced', 'improved',
  'million', 'thousand', 'revenue', 'cost', 'saved', 'roi',
  'users', 'customers', 'clients', 'team', 'projects'
]

/**
 * Analyze resume data and calculate ATS compatibility score
 */
export function calculateATSScore(data: ResumeData): ATSScoreResult {
  const checks: ATSCheck[] = []

  // 1. Contact Information (15 points)
  checks.push(checkContactInfo(data))

  // 2. Professional Summary (10 points)
  checks.push(checkProfessionalSummary(data))

  // 3. Work Experience (25 points)
  checks.push(checkWorkExperience(data))

  // 4. Education (10 points)
  checks.push(checkEducation(data))

  // 5. Skills Section (15 points)
  checks.push(checkSkills(data))

  // 6. Keyword Optimization (10 points)
  checks.push(checkKeywords(data))

  // 7. Quantifiable Achievements (10 points)
  checks.push(checkQuantifiableAchievements(data))

  // 8. Content Length (5 points)
  checks.push(checkContentLength(data))

  // Calculate overall score
  const totalScore = checks.reduce((sum, check) => sum + check.score, 0)
  const maxScore = checks.reduce((sum, check) => sum + check.maxScore, 0)
  const percentage = Math.round((totalScore / maxScore) * 100)

  // Determine grade
  let grade: 'A' | 'B' | 'C' | 'D' | 'F'
  if (percentage >= 90) grade = 'A'
  else if (percentage >= 80) grade = 'B'
  else if (percentage >= 70) grade = 'C'
  else if (percentage >= 60) grade = 'D'
  else grade = 'F'

  // Get top issues (failed or low-scoring checks)
  const topIssues = checks
    .filter(check => !check.passed || check.score < check.maxScore * 0.7)
    .sort((a, b) => (b.maxScore - b.score) - (a.maxScore - a.score))
    .slice(0, 3)
    .map(check => check.feedback)

  // Generate summary
  const summary = generateSummary(percentage, grade)

  return {
    overallScore: totalScore,
    maxScore,
    percentage,
    grade,
    checks,
    summary,
    topIssues
  }
}

function checkContactInfo(data: ResumeData): ATSCheck {
  const { personalInfo } = data
  let score = 0
  const suggestions: string[] = []

  // Check each required field
  if (personalInfo.firstName && personalInfo.lastName) score += 3
  else suggestions.push('Add your full name')

  if (personalInfo.email) score += 3
  else suggestions.push('Add your email address')

  if (personalInfo.phone) score += 3
  else suggestions.push('Add your phone number')

  if (personalInfo.location) score += 3
  else suggestions.push('Add your location (city, state)')

  if (personalInfo.linkedinUrl) score += 3
  else suggestions.push('Consider adding your LinkedIn profile URL')

  const passed = score >= 12

  return {
    id: 'contact-info',
    name: 'Contact Information',
    description: 'Essential contact details for recruiters',
    category: 'content',
    passed,
    score,
    maxScore: 15,
    feedback: passed
      ? 'Contact information is complete and ATS-friendly'
      : 'Missing important contact information',
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}

function checkProfessionalSummary(data: ResumeData): ATSCheck {
  const summary = data.personalInfo.summary || ''
  let score = 0
  const suggestions: string[] = []

  // Check if summary exists
  if (summary.length > 0) {
    score += 3

    // Check length (ideal: 50-200 words)
    const wordCount = summary.split(/\s+/).length
    if (wordCount >= 30 && wordCount <= 200) {
      score += 3
    } else if (wordCount < 30) {
      suggestions.push('Expand your summary to 50-200 words for better impact')
    } else {
      suggestions.push('Consider shortening your summary to under 200 words')
    }

    // Check for power verbs
    const hasPowerVerbs = POWER_VERBS.some(verb =>
      summary.toLowerCase().includes(verb)
    )
    if (hasPowerVerbs) score += 2
    else suggestions.push('Use action verbs like "achieved", "led", "developed"')

    // Check for specific skills mention
    if (data.skills.length > 0) {
      const skillsMentioned = data.skills.some(skill =>
        summary.toLowerCase().includes(skill.name.toLowerCase())
      )
      if (skillsMentioned) score += 2
      else suggestions.push('Mention key skills in your summary')
    }
  } else {
    suggestions.push('Add a professional summary to introduce yourself')
  }

  const passed = score >= 7

  return {
    id: 'professional-summary',
    name: 'Professional Summary',
    description: 'Brief overview of your professional background',
    category: 'content',
    passed,
    score,
    maxScore: 10,
    feedback: passed
      ? 'Professional summary is well-written'
      : 'Professional summary needs improvement',
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}

function checkWorkExperience(data: ResumeData): ATSCheck {
  const { experience } = data
  let score = 0
  const suggestions: string[] = []

  if (experience.length === 0) {
    suggestions.push('Add work experience to strengthen your resume')
    return {
      id: 'work-experience',
      name: 'Work Experience',
      description: 'Professional work history',
      category: 'content',
      passed: false,
      score: 0,
      maxScore: 25,
      feedback: 'No work experience added',
      suggestions
    }
  }

  // Has at least one experience
  score += 5

  // Check each experience entry
  let completeEntries = 0
  let hasDescriptions = 0
  let hasDates = 0

  for (const exp of experience) {
    // Check completeness
    if (exp.title && exp.companyName) {
      completeEntries++
    }

    // Check for description
    if (exp.description && exp.description.length > 50) {
      hasDescriptions++
    }

    // Check for dates
    if (exp.startDate) {
      hasDates++
    }
  }

  // Score based on completeness
  if (completeEntries === experience.length) {
    score += 5
  } else {
    suggestions.push('Ensure all experience entries have job title and company name')
  }

  // Score based on descriptions
  if (hasDescriptions >= experience.length * 0.8) {
    score += 8
  } else if (hasDescriptions >= experience.length * 0.5) {
    score += 5
    suggestions.push('Add detailed descriptions to all work experiences')
  } else {
    suggestions.push('Add descriptions with accomplishments to each position')
  }

  // Score based on dates
  if (hasDates === experience.length) {
    score += 4
  } else {
    suggestions.push('Add start and end dates to all positions')
  }

  // Check for bullet points/achievements format
  const hasAchievements = experience.some(exp =>
    exp.achievements && exp.achievements.length > 0
  )
  if (hasAchievements) {
    score += 3
  } else {
    suggestions.push('Consider adding bullet-point achievements to each position')
  }

  const passed = score >= 18

  return {
    id: 'work-experience',
    name: 'Work Experience',
    description: 'Professional work history',
    category: 'content',
    passed,
    score,
    maxScore: 25,
    feedback: passed
      ? 'Work experience section is comprehensive'
      : 'Work experience section needs more detail',
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}

function checkEducation(data: ResumeData): ATSCheck {
  const { education } = data
  let score = 0
  const suggestions: string[] = []

  if (education.length === 0) {
    suggestions.push('Add your educational background')
    return {
      id: 'education',
      name: 'Education',
      description: 'Academic qualifications',
      category: 'content',
      passed: false,
      score: 0,
      maxScore: 10,
      feedback: 'No education information added',
      suggestions
    }
  }

  // Has education
  score += 4

  // Check completeness
  let complete = 0
  for (const edu of education) {
    if (edu.institution && edu.degree) {
      complete++
    }
  }

  if (complete === education.length) {
    score += 4
  } else {
    suggestions.push('Complete all education entries with institution and degree')
  }

  // Check for dates
  const hasDates = education.some(edu => edu.startDate || edu.endDate)
  if (hasDates) {
    score += 2
  } else {
    suggestions.push('Add graduation dates to your education')
  }

  const passed = score >= 7

  return {
    id: 'education',
    name: 'Education',
    description: 'Academic qualifications',
    category: 'content',
    passed,
    score,
    maxScore: 10,
    feedback: passed
      ? 'Education section is complete'
      : 'Education section needs more information',
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}

function checkSkills(data: ResumeData): ATSCheck {
  const { skills } = data
  let score = 0
  const suggestions: string[] = []

  if (skills.length === 0) {
    suggestions.push('Add relevant skills to your resume')
    return {
      id: 'skills',
      name: 'Skills Section',
      description: 'Technical and professional skills',
      category: 'content',
      passed: false,
      score: 0,
      maxScore: 15,
      feedback: 'No skills added',
      suggestions
    }
  }

  // Has skills
  score += 5

  // Check number of skills (ideal: 8-20)
  if (skills.length >= 8 && skills.length <= 25) {
    score += 5
  } else if (skills.length >= 5) {
    score += 3
    suggestions.push('Consider adding more relevant skills (8-20 is optimal)')
  } else {
    suggestions.push('Add more skills to demonstrate your capabilities')
  }

  // Check for skill levels
  const hasLevels = skills.some(skill => skill.level)
  if (hasLevels) {
    score += 3
  }

  // Check for variety (different skills, not duplicates)
  const uniqueSkills = new Set(skills.map(s => s.name.toLowerCase()))
  if (uniqueSkills.size === skills.length) {
    score += 2
  } else {
    suggestions.push('Remove duplicate skills')
  }

  const passed = score >= 10

  return {
    id: 'skills',
    name: 'Skills Section',
    description: 'Technical and professional skills',
    category: 'content',
    passed,
    score,
    maxScore: 15,
    feedback: passed
      ? 'Skills section is well-populated'
      : 'Skills section could be improved',
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}

function checkKeywords(data: ResumeData): ATSCheck {
  const suggestions: string[] = []
  let score = 0

  // Combine all text content
  const allText = [
    data.personalInfo.summary,
    data.personalInfo.headline,
    ...data.experience.map(e => `${e.title} ${e.description} ${e.achievements?.join(' ')}`),
    ...data.skills.map(s => s.name),
  ].join(' ').toLowerCase()

  // Check for power verbs
  const powerVerbCount = POWER_VERBS.filter(verb =>
    allText.includes(verb)
  ).length

  if (powerVerbCount >= 10) score += 5
  else if (powerVerbCount >= 5) score += 3
  else {
    score += 1
    suggestions.push('Use more action verbs like "achieved", "implemented", "managed"')
  }

  // Check for industry-standard terms
  const hasTechTerms = data.skills.length >= 5
  if (hasTechTerms) {
    score += 3
  } else {
    suggestions.push('Include industry-specific keywords and technologies')
  }

  // Check for job title relevance
  const hasRelevantTitle = data.personalInfo.headline && data.personalInfo.headline.length > 5
  if (hasRelevantTitle) {
    score += 2
  } else {
    suggestions.push('Add a professional headline with your target job title')
  }

  const passed = score >= 7

  return {
    id: 'keywords',
    name: 'Keyword Optimization',
    description: 'ATS-friendly keywords and terminology',
    category: 'keywords',
    passed,
    score,
    maxScore: 10,
    feedback: passed
      ? 'Good use of keywords throughout resume'
      : 'Improve keyword usage for better ATS matching',
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}

function checkQuantifiableAchievements(data: ResumeData): ATSCheck {
  const suggestions: string[] = []
  let score = 0

  // Combine experience text
  const expText = data.experience.map(e =>
    `${e.description} ${e.achievements?.join(' ')}`
  ).join(' ').toLowerCase()

  // Check for numbers and percentages
  const hasNumbers = /\d+/.test(expText)
  const hasPercentages = /%|percent/.test(expText)
  const hasCurrency = /\$|\£|\€|dollar|million|thousand/.test(expText)

  if (hasNumbers) score += 3
  if (hasPercentages) score += 3
  if (hasCurrency) score += 2

  // Check for measurable indicators
  const measureableCount = MEASURABLE_INDICATORS.filter(ind =>
    expText.includes(ind)
  ).length

  if (measureableCount >= 3) {
    score += 2
  } else {
    suggestions.push('Quantify achievements with numbers (e.g., "increased sales by 25%")')
  }

  if (score < 5) {
    suggestions.push('Add metrics and measurable results to your accomplishments')
  }

  const passed = score >= 6

  return {
    id: 'quantifiable',
    name: 'Quantifiable Achievements',
    description: 'Measurable results and metrics',
    category: 'content',
    passed,
    score,
    maxScore: 10,
    feedback: passed
      ? 'Good use of quantifiable achievements'
      : 'Add more measurable results to stand out',
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}

function checkContentLength(data: ResumeData): ATSCheck {
  const suggestions: string[] = []
  let score = 0

  // Calculate approximate word count
  const allText = [
    data.personalInfo.firstName,
    data.personalInfo.lastName,
    data.personalInfo.summary,
    data.personalInfo.headline,
    ...data.experience.map(e => `${e.title} ${e.companyName} ${e.description}`),
    ...data.education.map(e => `${e.institution} ${e.degree} ${e.fieldOfStudy}`),
    ...data.skills.map(s => s.name),
  ].join(' ')

  const wordCount = allText.split(/\s+/).filter(w => w.length > 0).length

  // Ideal resume: 400-800 words (1 page) or 800-1200 words (2 pages)
  if (wordCount >= 300 && wordCount <= 1200) {
    score += 5
  } else if (wordCount >= 200 && wordCount <= 1500) {
    score += 3
    if (wordCount < 300) {
      suggestions.push('Add more content to strengthen your resume')
    } else {
      suggestions.push('Consider condensing content for better readability')
    }
  } else if (wordCount < 200) {
    score += 1
    suggestions.push('Your resume seems too brief. Add more details about your experience')
  } else {
    score += 2
    suggestions.push('Your resume may be too long. Focus on the most relevant information')
  }

  const passed = score >= 3

  return {
    id: 'content-length',
    name: 'Content Length',
    description: 'Appropriate amount of content',
    category: 'formatting',
    passed,
    score,
    maxScore: 5,
    feedback: passed
      ? 'Resume length is appropriate'
      : 'Adjust resume length for better impact',
    suggestions: suggestions.length > 0 ? suggestions : undefined
  }
}

function generateSummary(percentage: number, grade: string): string {
  if (percentage >= 90) {
    return `Excellent! Your resume scores ${percentage}% on ATS compatibility. It's well-optimized for applicant tracking systems.`
  } else if (percentage >= 80) {
    return `Great job! Your resume scores ${percentage}% on ATS compatibility. With a few improvements, it could be even stronger.`
  } else if (percentage >= 70) {
    return `Good progress! Your resume scores ${percentage}% on ATS compatibility. Focus on the suggested improvements to increase your chances.`
  } else if (percentage >= 60) {
    return `Your resume needs work. It scores ${percentage}% on ATS compatibility. Review the suggestions below to improve.`
  } else {
    return `Your resume scores ${percentage}% on ATS compatibility. Significant improvements are needed for better results with applicant tracking systems.`
  }
}
