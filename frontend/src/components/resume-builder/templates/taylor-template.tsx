import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Taylor Foster template - Professional two-column resume
// - Clean centered name header at top spanning full width
// - Left column (35%): contact info, achievements summary, skills
// - Right column (65%): experience and education
// - Modern sans-serif font, ATS-friendly design
// - Achievement numbers displayed prominently
// - Skills shown as tags
const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      flexDirection: 'column',
      fontSize: 9,
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
    },
    // Full-width header
    header: {
      paddingTop: 30,
      paddingHorizontal: 30,
      paddingBottom: 20,
      alignItems: 'center',
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
    },
    name: {
      fontSize: 26,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
      letterSpacing: 1,
      marginBottom: 4,
    },
    headline: {
      fontSize: 11,
      color: primaryColor,
      marginBottom: 8,
      letterSpacing: 0.5,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      textAlign: 'center',
      maxWidth: '80%',
    },
    // Two-column body
    body: {
      flexDirection: 'row',
      flex: 1,
    },
    // Left column (35%)
    leftColumn: {
      width: '35%',
      padding: 20,
      backgroundColor: '#f9fafb',
    },
    // Right column (65%)
    rightColumn: {
      width: '65%',
      padding: 20,
      paddingLeft: 25,
    },
    // Section styles
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      marginBottom: 10,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: primaryColor,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    section: {
      marginBottom: 18,
    },
    // Contact styles
    contactItem: {
      fontSize: 8,
      color: '#374151',
      marginBottom: 5,
      lineHeight: 1.4,
    },
    contactLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'none',
      marginBottom: 5,
    },
    // Achievement summary (left column highlight)
    achievementSummaryBox: {
      backgroundColor: '#ffffff',
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
      padding: 10,
      marginBottom: 15,
    },
    achievementSummaryTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
      marginBottom: 8,
    },
    achievementStatRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    achievementNumber: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      marginRight: 8,
      minWidth: 35,
    },
    achievementLabel: {
      fontSize: 8,
      color: '#4b5563',
      flex: 1,
    },
    // Skills as tags
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    skillTag: {
      fontSize: 8,
      color: '#374151',
      backgroundColor: '#ffffff',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 3,
      borderWidth: 1,
      borderColor: '#e5e7eb',
      marginBottom: 4,
      marginRight: 4,
    },
    skillTagExpert: {
      fontSize: 8,
      color: '#ffffff',
      backgroundColor: primaryColor,
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 3,
      marginBottom: 4,
      marginRight: 4,
    },
    // Languages
    languageItem: {
      marginBottom: 8,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
    },
    languageLevel: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 1,
    },
    // Certifications
    certItem: {
      marginBottom: 10,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
      lineHeight: 1.3,
    },
    certOrg: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 2,
    },
    certDate: {
      fontSize: 7,
      color: primaryColor,
      marginTop: 1,
    },
    // Experience styles
    experienceItem: {
      marginBottom: 14,
    },
    experienceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    experienceTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
      flex: 1,
    },
    experienceDates: {
      fontSize: 8,
      color: primaryColor,
      textAlign: 'right',
    },
    experienceCompany: {
      fontSize: 9,
      color: '#6b7280',
      marginBottom: 4,
    },
    experienceDescription: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 4,
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 3,
    },
    // Education styles
    educationItem: {
      marginBottom: 12,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
    },
    eduField: {
      fontSize: 9,
      color: '#374151',
      marginTop: 1,
    },
    eduInstitution: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 1,
    },
    eduDate: {
      fontSize: 8,
      color: primaryColor,
      marginTop: 2,
    },
    eduGrade: {
      fontSize: 8,
      color: '#4b5563',
      marginTop: 2,
    },
    // Project styles
    projectItem: {
      marginBottom: 12,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 3,
    },
    techLine: {
      fontSize: 8,
      color: primaryColor,
      marginTop: 4,
      fontStyle: 'italic',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'underline',
    },
  })

interface TaylorTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function TaylorTemplate({ data, settings }: TaylorTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Extract key achievement numbers from experience for the summary box
  const extractAchievementStats = () => {
    const stats: { number: string; label: string }[] = []

    // Look for numbers in achievements
    experience.forEach((exp) => {
      if (exp.achievements) {
        exp.achievements.forEach((achievement) => {
          // Match patterns like "60%", "$1M+", "2M+", "500+", etc.
          const percentMatch = achievement.match(/(\d+)%/)
          const moneyMatch = achievement.match(/\$[\d.]+[MKB]?\+?/)
          const numberMatch = achievement.match(/(\d+[MKB]?\+?)/)

          if (percentMatch && stats.length < 4) {
            stats.push({ number: percentMatch[0], label: achievement.substring(0, 30) + '...' })
          } else if (moneyMatch && stats.length < 4) {
            stats.push({ number: moneyMatch[0], label: achievement.substring(0, 30) + '...' })
          }
        })
      }
    })

    // Add years of experience if we have experience data
    if (experience.length > 0 && stats.length < 4) {
      const earliestDate = experience.reduce((earliest, exp) => {
        const expDate = new Date(exp.startDate)
        return expDate < earliest ? expDate : earliest
      }, new Date())
      const years = Math.floor((new Date().getTime() - earliestDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (years > 0) {
        stats.unshift({ number: `${years}+`, label: 'Years Experience' })
      }
    }

    return stats.slice(0, 4)
  }

  const achievementStats = extractAchievementStats()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Full-width centered header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          {personalInfo.summary && (
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          )}
        </View>

        {/* Two-column body */}
        <View style={styles.body}>
          {/* Left Column - 35% */}
          <View style={styles.leftColumn}>
            {/* Contact */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              {personalInfo.email && (
                <Text style={styles.contactItem}>{personalInfo.email}</Text>
              )}
              {personalInfo.phone && (
                <Text style={styles.contactItem}>{personalInfo.phone}</Text>
              )}
              {personalInfo.location && (
                <Text style={styles.contactItem}>{personalInfo.location}</Text>
              )}
              {personalInfo.linkedinUrl && (
                <Link src={personalInfo.linkedinUrl} style={styles.contactLink}>
                  LinkedIn
                </Link>
              )}
              {personalInfo.githubUrl && (
                <Link src={personalInfo.githubUrl} style={styles.contactLink}>
                  GitHub
                </Link>
              )}
              {personalInfo.portfolioUrl && (
                <Link src={personalInfo.portfolioUrl} style={styles.contactLink}>
                  Portfolio
                </Link>
              )}
              {personalInfo.websiteUrl && (
                <Link src={personalInfo.websiteUrl} style={styles.contactLink}>
                  Website
                </Link>
              )}
            </View>

            {/* Achievement Summary with prominent numbers */}
            {achievementStats.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Metrics</Text>
                <View style={styles.achievementSummaryBox}>
                  {achievementStats.map((stat, idx) => (
                    <View key={idx} style={styles.achievementStatRow}>
                      <Text style={styles.achievementNumber}>{stat.number}</Text>
                      <Text style={styles.achievementLabel}>{stat.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Skills as tags */}
            {skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <View style={styles.skillsContainer}>
                  {skills.map((skill) => (
                    <Text
                      key={skill.id}
                      style={skill.level === 'EXPERT' ? styles.skillTagExpert : styles.skillTag}
                    >
                      {skill.name}
                    </Text>
                  ))}
                </View>
              </View>
            )}

            {/* Languages */}
            {languages && languages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Languages</Text>
                {languages.map((lang) => (
                  <View key={lang.id} style={styles.languageItem}>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    {lang.proficiency && (
                      <Text style={styles.languageLevel}>
                        {lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Certifications */}
            {certifications.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                {certifications.map((cert) => (
                  <View key={cert.id} style={styles.certItem}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                    <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Right Column - 65% */}
          <View style={styles.rightColumn}>
            {/* Experience */}
            {experience.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
                {experience.map((exp) => (
                  <View key={exp.id} style={styles.experienceItem}>
                    <View style={styles.experienceHeader}>
                      <Text style={styles.experienceTitle}>{exp.title}</Text>
                      <Text style={styles.experienceDates}>
                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                      </Text>
                    </View>
                    <Text style={styles.experienceCompany}>
                      {exp.companyName}
                      {exp.location ? ` | ${exp.location}` : ''}
                    </Text>
                    {exp.description && (
                      <RichTextRenderer text={exp.description} style={styles.experienceDescription} />
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <View style={styles.bulletList}>
                        {exp.achievements.map((achievement, idx) => (
                          <Text key={idx} style={styles.bulletItem}>
                            • {achievement}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* Education */}
            {education.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Education</Text>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.educationItem}>
                    <Text style={styles.eduDegree}>{edu.degree}</Text>
                    <Text style={styles.eduField}>{edu.fieldOfStudy}</Text>
                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                    <Text style={styles.eduDate}>
                      {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                    </Text>
                    {edu.grade && <Text style={styles.eduGrade}>GPA: {edu.grade}</Text>}
                  </View>
                ))}
              </View>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Projects</Text>
                {projects.map((project) => (
                  <View key={project.id} style={styles.projectItem}>
                    <Text style={styles.projectTitle}>{project.title}</Text>
                    <RichTextRenderer text={project.description} style={styles.projectDesc} />
                    {project.technologies && project.technologies.length > 0 && (
                      <Text style={styles.techLine}>
                        Tech: {project.technologies.join(' | ')}
                      </Text>
                    )}
                    {(project.projectUrl || project.sourceCodeUrl) && (
                      <View style={styles.projectLinks}>
                        {project.projectUrl && (
                          <Link src={project.projectUrl} style={styles.projectLink}>
                            Demo
                          </Link>
                        )}
                        {project.sourceCodeUrl && (
                          <Link src={project.sourceCodeUrl} style={styles.projectLink}>
                            Code
                          </Link>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}
