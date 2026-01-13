import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Data Template - Data visualization focused with bar charts and metrics
const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 30,
      paddingBottom: 30,
      paddingHorizontal: 35,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
      backgroundColor: '#ffffff',
    },
    // Header with metrics dashboard feel
    header: {
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 3,
      borderBottomColor: primaryColor,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      width: 140,
      alignItems: 'flex-end',
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      letterSpacing: -0.5,
    },
    headline: {
      fontSize: 11,
      color: primaryColor,
      marginTop: 3,
      fontFamily: 'Helvetica-Bold',
    },
    contactItem: {
      fontSize: 8,
      color: '#6b7280',
      marginBottom: 2,
      textAlign: 'right',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 4,
    },
    link: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'none',
    },
    // Key metrics row - infographic style
    metricsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 10,
      gap: 10,
    },
    metricBox: {
      flex: 1,
      backgroundColor: '#f9fafb',
      padding: 10,
      borderRadius: 4,
      alignItems: 'center',
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
    },
    metricValue: {
      fontSize: 16,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
    },
    metricLabel: {
      fontSize: 7,
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginTop: 2,
    },
    // Main content area
    content: {
      flexDirection: 'row',
      gap: 20,
    },
    mainColumn: {
      flex: 2,
    },
    sideColumn: {
      flex: 1,
    },
    // Section styling
    section: {
      marginBottom: 14,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    sectionIcon: {
      width: 16,
      height: 16,
      backgroundColor: primaryColor,
      borderRadius: 2,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sectionIconText: {
      fontSize: 8,
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Summary
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
    },
    // Skills with horizontal bar charts
    skillsContainer: {
      marginTop: 4,
    },
    skillItem: {
      marginBottom: 8,
    },
    skillHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    skillName: {
      fontSize: 9,
      color: '#374151',
    },
    skillLevel: {
      fontSize: 7,
      color: '#9ca3af',
      textTransform: 'uppercase',
    },
    skillBarContainer: {
      height: 8,
      backgroundColor: '#e5e7eb',
      borderRadius: 4,
      overflow: 'hidden',
    },
    skillBar: {
      height: 8,
      backgroundColor: primaryColor,
      borderRadius: 4,
    },
    skillBarIntermediate: {
      opacity: 0.7,
    },
    skillBarBeginner: {
      opacity: 0.4,
    },
    // Timeline for experience - infographic style
    timelineContainer: {
      marginTop: 4,
    },
    timelineItem: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    timelineLeft: {
      width: 60,
      paddingRight: 10,
    },
    timelineDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: primaryColor,
      position: 'absolute',
      right: 0,
      top: 2,
    },
    timelineLine: {
      position: 'absolute',
      right: 4,
      top: 12,
      width: 2,
      height: '100%',
      backgroundColor: '#e5e7eb',
    },
    timelineDates: {
      fontSize: 7,
      color: '#6b7280',
      textAlign: 'right',
      paddingRight: 15,
    },
    timelineContent: {
      flex: 1,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: '#e5e7eb',
    },
    timelineTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    timelineCompany: {
      fontSize: 9,
      color: primaryColor,
      marginTop: 1,
    },
    timelineLocation: {
      fontSize: 8,
      color: '#9ca3af',
      marginTop: 1,
    },
    timelineDescription: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 4,
    },
    timelineAchievements: {
      marginTop: 4,
    },
    achievementItem: {
      flexDirection: 'row',
      marginBottom: 2,
    },
    achievementBullet: {
      width: 12,
      fontSize: 9,
      color: primaryColor,
    },
    achievementText: {
      flex: 1,
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
    },
    // Education cards
    eduCard: {
      backgroundColor: '#f9fafb',
      padding: 10,
      borderRadius: 4,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: primaryColor,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    eduField: {
      fontSize: 9,
      color: primaryColor,
      marginTop: 1,
    },
    eduInstitution: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 2,
    },
    eduMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    eduDate: {
      fontSize: 7,
      color: '#9ca3af',
    },
    eduGrade: {
      fontSize: 7,
      color: primaryColor,
      fontFamily: 'Helvetica-Bold',
    },
    // Languages with visual indicators
    languagesContainer: {
      marginTop: 4,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#374151',
      width: 60,
    },
    languageIndicator: {
      flexDirection: 'row',
      gap: 2,
    },
    languageDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: primaryColor,
    },
    languageDotEmpty: {
      backgroundColor: '#e5e7eb',
    },
    // Certifications
    certItem: {
      flexDirection: 'row',
      marginBottom: 8,
      alignItems: 'flex-start',
    },
    certBadge: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: primaryColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    certBadgeText: {
      fontSize: 8,
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
    },
    certContent: {
      flex: 1,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    certOrg: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 1,
    },
    certDate: {
      fontSize: 7,
      color: '#9ca3af',
      marginTop: 1,
    },
    // Projects with tech stack visualization
    projectItem: {
      marginBottom: 10,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    projectItemLast: {
      borderBottomWidth: 0,
      paddingBottom: 0,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 6,
    },
    projectLink: {
      fontSize: 7,
      color: primaryColor,
      textDecoration: 'none',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 4,
    },
    techRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 6,
    },
    techTag: {
      fontSize: 7,
      color: '#ffffff',
      backgroundColor: primaryColor,
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 2,
    },
  })

interface DataTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function DataTemplate({ data, settings }: DataTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatDateShort = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })
  }

  // Calculate metrics for infographic header
  const yearsExperience = experience.length > 0
    ? Math.max(...experience.map(exp => {
        const start = new Date(exp.startDate)
        const end = exp.isCurrent ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date())
        return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365))
      }))
    : 0

  const totalYearsExperience = experience.reduce((total, exp) => {
    const start = new Date(exp.startDate)
    const end = exp.isCurrent ? new Date() : (exp.endDate ? new Date(exp.endDate) : new Date())
    return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365)
  }, 0)

  const expertSkillsCount = skills.filter(s => s.level === 'EXPERT' || s.level === 'ADVANCED').length
  const totalProjects = projects.length
  const totalCerts = certifications.length

  // Get skill bar width based on level
  const getSkillWidth = (level?: string) => {
    switch (level) {
      case 'EXPERT': return '100%'
      case 'ADVANCED': return '85%'
      case 'INTERMEDIATE': return '65%'
      case 'BEGINNER': return '40%'
      default: return '75%'
    }
  }

  // Get language proficiency dots (out of 5)
  const getLanguageDots = (proficiency?: string) => {
    switch (proficiency) {
      case 'NATIVE': return 5
      case 'FLUENT': return 5
      case 'PROFESSIONAL': return 4
      case 'CONVERSATIONAL': return 3
      case 'BASIC': return 2
      default: return 3
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with Dashboard Feel */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.name}>
                {personalInfo.firstName} {personalInfo.lastName}
              </Text>
              {personalInfo.headline && (
                <Text style={styles.headline}>{personalInfo.headline}</Text>
              )}
            </View>
            <View style={styles.headerRight}>
              {personalInfo.email && <Text style={styles.contactItem}>{personalInfo.email}</Text>}
              {personalInfo.phone && <Text style={styles.contactItem}>{personalInfo.phone}</Text>}
              {personalInfo.location && <Text style={styles.contactItem}>{personalInfo.location}</Text>}
              {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
                <View style={styles.linkRow}>
                  {personalInfo.linkedinUrl && <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>}
                  {personalInfo.githubUrl && <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>}
                  {personalInfo.portfolioUrl && <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>}
                </View>
              )}
            </View>
          </View>

          {/* Key Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{Math.round(totalYearsExperience)}+</Text>
              <Text style={styles.metricLabel}>Years Exp.</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{skills.length}</Text>
              <Text style={styles.metricLabel}>Skills</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{expertSkillsCount}</Text>
              <Text style={styles.metricLabel}>Expert Skills</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue}>{totalProjects + totalCerts}</Text>
              <Text style={styles.metricLabel}>Projects & Certs</Text>
            </View>
          </View>
        </View>

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Text style={styles.sectionIconText}>P</Text>
              </View>
              <Text style={styles.sectionTitle}>Profile Summary</Text>
            </View>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Two Column Layout */}
        <View style={styles.content}>
          {/* Main Column */}
          <View style={styles.mainColumn}>
            {/* Experience Timeline */}
            {experience.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Text style={styles.sectionIconText}>E</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Experience Timeline</Text>
                </View>
                <View style={styles.timelineContainer}>
                  {experience.map((exp, index) => (
                    <View key={exp.id} style={styles.timelineItem}>
                      <View style={styles.timelineLeft}>
                        <Text style={styles.timelineDates}>
                          {formatDateShort(exp.startDate)}
                        </Text>
                        <Text style={styles.timelineDates}>
                          {exp.isCurrent ? 'Present' : formatDateShort(exp.endDate || '')}
                        </Text>
                        <View style={styles.timelineDot} />
                        {index < experience.length - 1 && <View style={styles.timelineLine} />}
                      </View>
                      <View style={styles.timelineContent}>
                        <Text style={styles.timelineTitle}>{exp.title}</Text>
                        <Text style={styles.timelineCompany}>{exp.companyName}</Text>
                        {exp.location && <Text style={styles.timelineLocation}>{exp.location}</Text>}
                        {exp.description && (
                          <RichTextRenderer text={exp.description} style={styles.timelineDescription} />
                        )}
                        {exp.achievements && exp.achievements.length > 0 && (
                          <View style={styles.timelineAchievements}>
                            {exp.achievements.map((achievement, idx) => (
                              <View key={idx} style={styles.achievementItem}>
                                <Text style={styles.achievementBullet}>&#9658;</Text>
                                <Text style={styles.achievementText}>{achievement}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Projects */}
            {projects.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Text style={styles.sectionIconText}>P</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Projects</Text>
                </View>
                {projects.map((project, index) => (
                  <View
                    key={project.id}
                    style={[
                      styles.projectItem,
                      ...(index === projects.length - 1 ? [styles.projectItemLast] : []),
                    ]}
                  >
                    <View style={styles.projectHeader}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      {(project.projectUrl || project.sourceCodeUrl) && (
                        <View style={styles.projectLinks}>
                          {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>Demo</Link>}
                          {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Code</Link>}
                        </View>
                      )}
                    </View>
                    <RichTextRenderer text={project.description} style={styles.projectDesc} />
                    {project.technologies && project.technologies.length > 0 && (
                      <View style={styles.techRow}>
                        {project.technologies.map((tech, idx) => (
                          <Text key={idx} style={styles.techTag}>{tech}</Text>
                        ))}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Side Column */}
          <View style={styles.sideColumn}>
            {/* Skills with Bar Charts */}
            {skills.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Text style={styles.sectionIconText}>S</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Skills</Text>
                </View>
                <View style={styles.skillsContainer}>
                  {skills.map((skill) => (
                    <View key={skill.id} style={styles.skillItem}>
                      <View style={styles.skillHeader}>
                        <Text style={styles.skillName}>{skill.name}</Text>
                        {skill.level && (
                          <Text style={styles.skillLevel}>
                            {skill.level.charAt(0) + skill.level.slice(1).toLowerCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.skillBarContainer}>
                        <View
                          style={[
                            styles.skillBar,
                            { width: getSkillWidth(skill.level) },
                            skill.level === 'INTERMEDIATE' ? styles.skillBarIntermediate : {},
                            skill.level === 'BEGINNER' ? styles.skillBarBeginner : {},
                          ]}
                        />
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Education Cards */}
            {education.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Text style={styles.sectionIconText}>E</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Education</Text>
                </View>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.eduCard}>
                    <Text style={styles.eduDegree}>{edu.degree}</Text>
                    <Text style={styles.eduField}>{edu.fieldOfStudy}</Text>
                    <Text style={styles.eduInstitution}>{edu.institution}</Text>
                    <View style={styles.eduMeta}>
                      <Text style={styles.eduDate}>
                        {formatDate(edu.endDate || edu.startDate)}
                      </Text>
                      {edu.grade && <Text style={styles.eduGrade}>GPA: {edu.grade}</Text>}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Languages with Visual Indicators */}
            {languages && languages.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Text style={styles.sectionIconText}>L</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Languages</Text>
                </View>
                <View style={styles.languagesContainer}>
                  {languages.map((lang) => (
                    <View key={lang.id} style={styles.languageItem}>
                      <Text style={styles.languageName}>{lang.name}</Text>
                      <View style={styles.languageIndicator}>
                        {[1, 2, 3, 4, 5].map((dot) => (
                          <View
                            key={dot}
                            style={[
                              styles.languageDot,
                              dot > getLanguageDots(lang.proficiency) ? styles.languageDotEmpty : {},
                            ]}
                          />
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Certifications with Badges */}
            {certifications.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Text style={styles.sectionIconText}>C</Text>
                  </View>
                  <Text style={styles.sectionTitle}>Certifications</Text>
                </View>
                {certifications.map((cert, index) => (
                  <View key={cert.id} style={styles.certItem}>
                    <View style={styles.certBadge}>
                      <Text style={styles.certBadgeText}>{index + 1}</Text>
                    </View>
                    <View style={styles.certContent}>
                      <Text style={styles.certName}>{cert.name}</Text>
                      <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                      <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                    </View>
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
