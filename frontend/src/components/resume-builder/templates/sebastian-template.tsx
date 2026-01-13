import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Sebastian Martin template - Two-column with Key Achievements sidebar
// Left main column (65%) for summary and experience
// Right sidebar (35%) with Key Achievements and skills
// Clean modern design with minimal borders, ATS-friendly
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      flexDirection: 'column',
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
      paddingTop: 30,
      paddingBottom: 30,
      paddingHorizontal: 30,
    },
    header: {
      marginBottom: 20,
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 4,
    },
    headline: {
      fontSize: 11,
      color: accentColor,
      marginBottom: 10,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    contactItem: {
      fontSize: 8,
      color: '#4b5563',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 6,
    },
    link: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'none',
    },
    columnsContainer: {
      flexDirection: 'row',
      gap: 20,
      flex: 1,
    },
    mainColumn: {
      width: '65%',
    },
    sidebar: {
      width: '35%',
    },
    section: {
      marginBottom: 14,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: accentColor,
    },
    sidebarSectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 8,
      paddingVertical: 6,
      paddingHorizontal: 8,
      backgroundColor: accentColor,
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#374151',
    },
    experienceItem: {
      marginBottom: 12,
    },
    jobHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    jobTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      flex: 1,
      paddingRight: 8,
    },
    dates: {
      fontSize: 8,
      color: accentColor,
      fontFamily: 'Helvetica-Bold',
      flexShrink: 0,
    },
    company: {
      fontSize: 9,
      color: '#4b5563',
      marginBottom: 4,
    },
    description: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 4,
    },
    bulletList: {
      marginTop: 2,
    },
    bulletItem: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#374151',
      marginBottom: 2,
    },
    educationItem: {
      marginBottom: 10,
    },
    degree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    institution: {
      fontSize: 9,
      color: '#4b5563',
      marginTop: 1,
    },
    grade: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 2,
    },
    // Key Achievements styles
    achievementCard: {
      backgroundColor: '#f9fafb',
      padding: 10,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    achievementMetric: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginBottom: 2,
    },
    achievementLabel: {
      fontSize: 8,
      color: '#4b5563',
      lineHeight: 1.3,
    },
    // Skills styles
    skillsContainer: {
      marginTop: 4,
    },
    skillCategory: {
      marginBottom: 8,
    },
    skillCategoryTitle: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#374151',
      marginBottom: 4,
    },
    skillsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    skillTag: {
      fontSize: 8,
      color: '#374151',
      backgroundColor: '#f3f4f6',
      paddingVertical: 3,
      paddingHorizontal: 6,
      borderRadius: 2,
    },
    // Languages styles
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    languageName: {
      fontSize: 9,
      color: '#374151',
    },
    languageLevel: {
      fontSize: 8,
      color: '#6b7280',
    },
    // Certifications styles
    certItem: {
      marginBottom: 8,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certDetails: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 1,
    },
    // Projects styles
    projectItem: {
      marginBottom: 10,
    },
    projectTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 8,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 2,
    },
    techLine: {
      fontSize: 7,
      color: accentColor,
      marginTop: 3,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 3,
    },
    projectLink: {
      fontSize: 7,
      color: accentColor,
      textDecoration: 'underline',
    },
  })

interface SebastianTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

// Helper function to extract achievement metrics from experience
function extractAchievementMetrics(experience: ResumeData['experience']): { metric: string; label: string }[] {
  const metrics: { metric: string; label: string }[] = []

  for (const exp of experience) {
    if (exp.achievements) {
      for (const achievement of exp.achievements) {
        // Extract numbers with % or $ or M/K suffixes
        const percentMatch = achievement.match(/(\d+)%/)
        const dollarMatch = achievement.match(/\$[\d.]+[MKB]?|\$[\d,]+/)
        const userMatch = achievement.match(/([\d.]+[MK]?\+?)\s*(users?|customers?|clients?)/i)
        const timeMatch = achievement.match(/(\d+)%?\s*(faster|reduction|reduced|decrease|improvement)/i)

        if (percentMatch && metrics.length < 4) {
          const label = achievement.length > 50 ? achievement.substring(0, 47) + '...' : achievement
          metrics.push({ metric: `${percentMatch[1]}%`, label: label.replace(/^\d+%\s*/, '') })
        } else if (dollarMatch && metrics.length < 4) {
          metrics.push({ metric: dollarMatch[0], label: achievement.replace(dollarMatch[0], '').trim().substring(0, 40) })
        } else if (userMatch && metrics.length < 4) {
          metrics.push({ metric: userMatch[1], label: `${userMatch[2]} served` })
        }
      }
    }
  }

  return metrics.slice(0, 4) // Maximum 4 key achievements
}

export function SebastianTemplate({ data, settings }: SebastianTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Extract key achievement metrics from experience
  const keyMetrics = extractAchievementMetrics(experience)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
            {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
            {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
            {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
          </View>
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linkRow}>
              {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>}
              {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>}
              {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>}
            </View>
          )}
        </View>

        {/* Two-Column Layout */}
        <View style={styles.columnsContainer}>
          {/* Main Column - Left (65%) */}
          <View style={styles.mainColumn}>
            {/* Summary */}
            {personalInfo.summary && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Professional Summary</Text>
                <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
              </View>
            )}

            {/* Experience */}
            {experience.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Experience</Text>
                {experience.map((exp) => (
                  <View key={exp.id} style={styles.experienceItem}>
                    <View style={styles.jobHeader}>
                      <Text style={styles.jobTitle}>{exp.title}</Text>
                      <Text style={styles.dates}>
                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                      </Text>
                    </View>
                    <Text style={styles.company}>
                      {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
                    </Text>
                    {exp.description && (
                      <RichTextRenderer text={exp.description} style={styles.description} />
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <View style={styles.bulletList}>
                        {exp.achievements.map((achievement, idx) => (
                          <Text key={idx} style={styles.bulletItem}>• {achievement}</Text>
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
                    <View style={styles.jobHeader}>
                      <Text style={styles.degree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                      <Text style={styles.dates}>
                        {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                      </Text>
                    </View>
                    <Text style={styles.institution}>{edu.institution}</Text>
                    {edu.grade && <Text style={styles.grade}>GPA: {edu.grade}</Text>}
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
                      <Text style={styles.techLine}>{project.technologies.join(' | ')}</Text>
                    )}
                    {(project.projectUrl || project.sourceCodeUrl) && (
                      <View style={styles.projectLinks}>
                        {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>Demo</Link>}
                        {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source</Link>}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Sidebar - Right (35%) */}
          <View style={styles.sidebar}>
            {/* Key Achievements */}
            {keyMetrics.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sidebarSectionTitle}>Key Achievements</Text>
                {keyMetrics.map((item, idx) => (
                  <View key={idx} style={styles.achievementCard}>
                    <Text style={styles.achievementMetric}>{item.metric}</Text>
                    <Text style={styles.achievementLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Skills */}
            {skills.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sidebarSectionTitle}>Skills</Text>
                <View style={styles.skillsContainer}>
                  <View style={styles.skillsRow}>
                    {skills.map((skill) => (
                      <Text key={skill.id} style={styles.skillTag}>{skill.name}</Text>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Languages */}
            {languages && languages.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sidebarSectionTitle}>Languages</Text>
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
                <Text style={styles.sidebarSectionTitle}>Certifications</Text>
                {certifications.map((cert) => (
                  <View key={cert.id} style={styles.certItem}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certDetails}>{cert.issuingOrganization}</Text>
                    <Text style={styles.certDetails}>{formatDate(cert.issueDate)}</Text>
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
