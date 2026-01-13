import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Geometric template - Unique design with geometric shapes as accents
// Features: Geometric shapes (squares, triangles, circles), angular dividers, shape-based skill indicators
const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 30,
      paddingHorizontal: 0,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1f2937',
      backgroundColor: '#ffffff',
    },
    // Header with geometric pattern
    header: {
      backgroundColor: primaryColor,
      paddingTop: 25,
      paddingBottom: 25,
      paddingHorizontal: 35,
      position: 'relative',
    },
    // Decorative geometric shapes in header
    headerTriangleTopRight: {
      position: 'absolute',
      top: 0,
      right: 0,
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderLeftWidth: 80,
      borderLeftColor: 'transparent',
      borderTopWidth: 80,
      borderTopColor: 'rgba(255,255,255,0.15)',
    },
    headerCircle: {
      position: 'absolute',
      bottom: -15,
      left: 50,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerSquare: {
      position: 'absolute',
      top: 15,
      right: 100,
      width: 20,
      height: 20,
      backgroundColor: 'rgba(255,255,255,0.12)',
      transform: 'rotate(45deg)',
    },
    headerDiamond: {
      position: 'absolute',
      bottom: 10,
      right: 180,
      width: 15,
      height: 15,
      backgroundColor: 'rgba(255,255,255,0.08)',
      transform: 'rotate(45deg)',
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      width: 180,
      alignItems: 'flex-end',
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      letterSpacing: 1,
      marginBottom: 4,
    },
    headline: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.9)',
      letterSpacing: 0.5,
    },
    contactItem: {
      fontSize: 8,
      color: 'rgba(255,255,255,0.9)',
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
      color: '#ffffff',
      textDecoration: 'underline',
    },
    // Angular section divider
    angularDivider: {
      height: 20,
      backgroundColor: '#f8f9fa',
      position: 'relative',
      marginBottom: 10,
    },
    angularShape: {
      position: 'absolute',
      left: 35,
      top: 5,
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderBottomWidth: 10,
      borderBottomColor: primaryColor,
      borderLeftWidth: 10,
      borderLeftColor: 'transparent',
      borderRightWidth: 10,
      borderRightColor: 'transparent',
    },
    // Main content area
    content: {
      paddingHorizontal: 35,
      paddingTop: 15,
    },
    twoColumn: {
      flexDirection: 'row',
      gap: 25,
    },
    leftColumn: {
      flex: 2,
    },
    rightColumn: {
      flex: 1,
    },
    // Section styling with geometric accent
    section: {
      marginBottom: 14,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionSquare: {
      width: 8,
      height: 8,
      backgroundColor: primaryColor,
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    sectionDivider: {
      flex: 1,
      height: 1,
      backgroundColor: '#e5e7eb',
      marginLeft: 10,
    },
    // Summary section
    summaryText: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#374151',
    },
    // Experience items
    itemContainer: {
      marginBottom: 10,
      paddingLeft: 16,
      borderLeftWidth: 2,
      borderLeftColor: '#e5e7eb',
    },
    itemDot: {
      position: 'absolute',
      left: -5,
      top: 3,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: primaryColor,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      flex: 1,
    },
    itemDates: {
      fontSize: 8,
      color: primaryColor,
      fontFamily: 'Helvetica-Bold',
    },
    itemSubtitle: {
      fontSize: 9,
      color: '#6b7280',
      marginBottom: 3,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
    },
    bulletList: {
      marginTop: 3,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 2,
    },
    // Geometric skill indicators
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
      width: '48%',
    },
    skillShape: {
      width: 6,
      height: 6,
      marginRight: 6,
    },
    skillCircle: {
      borderRadius: 3,
      backgroundColor: primaryColor,
    },
    skillSquare: {
      backgroundColor: primaryColor,
    },
    skillTriangle: {
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderLeftWidth: 3,
      borderLeftColor: 'transparent',
      borderRightWidth: 3,
      borderRightColor: 'transparent',
      borderBottomWidth: 6,
      borderBottomColor: primaryColor,
      marginRight: 6,
    },
    skillDiamond: {
      backgroundColor: primaryColor,
      transform: 'rotate(45deg)',
    },
    skillName: {
      fontSize: 9,
      color: '#374151',
    },
    // Right column skill bars with geometric style
    skillBarContainer: {
      marginBottom: 8,
    },
    skillBarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    skillBarName: {
      fontSize: 9,
      color: '#111827',
    },
    skillBarLevel: {
      fontSize: 7,
      color: '#6b7280',
    },
    skillBarBg: {
      height: 4,
      backgroundColor: '#e5e7eb',
      flexDirection: 'row',
    },
    skillBarFill: {
      height: 4,
      backgroundColor: primaryColor,
    },
    skillBarSegment: {
      width: '20%',
      height: 4,
      borderRightWidth: 1,
      borderRightColor: '#ffffff',
    },
    skillBarSegmentFilled: {
      backgroundColor: primaryColor,
    },
    skillBarSegmentEmpty: {
      backgroundColor: '#e5e7eb',
    },
    // Education styling
    educationItem: {
      marginBottom: 8,
      paddingLeft: 12,
      position: 'relative',
    },
    educationTriangle: {
      position: 'absolute',
      left: 0,
      top: 3,
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderLeftWidth: 4,
      borderLeftColor: primaryColor,
      borderTopWidth: 4,
      borderTopColor: 'transparent',
      borderBottomWidth: 4,
      borderBottomColor: 'transparent',
    },
    educationDegree: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    educationField: {
      fontSize: 9,
      color: '#6b7280',
    },
    educationInstitution: {
      fontSize: 8,
      color: '#9ca3af',
    },
    educationDates: {
      fontSize: 8,
      color: primaryColor,
    },
    // Certifications with hexagon-like accent
    certItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    certHexagon: {
      width: 8,
      height: 8,
      backgroundColor: primaryColor,
      marginRight: 8,
      marginTop: 2,
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
    },
    certDate: {
      fontSize: 7,
      color: '#9ca3af',
    },
    // Languages with circle indicators
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5,
    },
    languageCircle: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: primaryColor,
      marginRight: 6,
    },
    languageName: {
      fontSize: 9,
      color: '#111827',
      marginRight: 4,
    },
    languageLevel: {
      fontSize: 8,
      color: '#6b7280',
    },
    // Projects section
    projectItem: {
      marginBottom: 10,
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: primaryColor,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 2,
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 3,
    },
    techRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginBottom: 3,
    },
    techTag: {
      fontSize: 7,
      color: '#ffffff',
      backgroundColor: primaryColor,
      paddingVertical: 2,
      paddingHorizontal: 5,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
    },
    projectLink: {
      fontSize: 7,
      color: primaryColor,
      textDecoration: 'underline',
    },
    // Decorative footer shapes
    footerDecoration: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 15,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      paddingRight: 35,
    },
    footerSquare: {
      width: 10,
      height: 10,
      backgroundColor: primaryColor,
      opacity: 0.3,
      marginLeft: 5,
    },
    footerCircle: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: primaryColor,
      opacity: 0.2,
      marginLeft: 5,
    },
  })

interface GeometricTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function GeometricTemplate({ data, settings }: GeometricTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Get geometric shape for skill based on level
  const getSkillShape = (level?: string, index?: number) => {
    const shapeIndex = index !== undefined ? index % 4 : 0
    switch (shapeIndex) {
      case 0: return [styles.skillShape, styles.skillCircle]
      case 1: return [styles.skillShape, styles.skillSquare]
      case 2: return null // Triangle - handled separately
      case 3: return [styles.skillShape, styles.skillDiamond]
      default: return [styles.skillShape, styles.skillCircle]
    }
  }

  const getSkillWidth = (level?: string) => {
    switch (level) {
      case 'EXPERT': return '100%'
      case 'ADVANCED': return '80%'
      case 'INTERMEDIATE': return '60%'
      case 'BEGINNER': return '40%'
      default: return '70%'
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Geometric Header */}
        <View style={styles.header}>
          {/* Decorative shapes */}
          <View style={styles.headerTriangleTopRight} />
          <View style={styles.headerCircle} />
          <View style={styles.headerSquare} />
          <View style={styles.headerDiamond} />

          <View style={styles.headerContent}>
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
        </View>

        {/* Angular Section Divider */}
        <View style={styles.angularDivider}>
          <View style={styles.angularShape} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Summary */}
          {personalInfo.summary && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionSquare} />
                <Text style={styles.sectionTitle}>Profile</Text>
                <View style={styles.sectionDivider} />
              </View>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          )}

          {/* Two Column Layout */}
          <View style={styles.twoColumn}>
            <View style={styles.leftColumn}>
              {/* Experience */}
              {experience.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionSquare} />
                    <Text style={styles.sectionTitle}>Experience</Text>
                    <View style={styles.sectionDivider} />
                  </View>
                  {experience.map((exp) => (
                    <View key={exp.id} style={styles.itemContainer}>
                      <View style={styles.itemHeader}>
                        <Text style={styles.itemTitle}>{exp.title}</Text>
                        <Text style={styles.itemDates}>
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                        </Text>
                      </View>
                      <Text style={styles.itemSubtitle}>
                        {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
                      </Text>
                      {exp.description && (
                        <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <View style={styles.bulletList}>
                          {exp.achievements.map((achievement, idx) => (
                            <Text key={idx} style={styles.bulletItem}>▸ {achievement}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Projects */}
              {projects.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionSquare} />
                    <Text style={styles.sectionTitle}>Projects</Text>
                    <View style={styles.sectionDivider} />
                  </View>
                  {projects.map((project) => (
                    <View key={project.id} style={styles.projectItem}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <RichTextRenderer text={project.description} style={styles.projectDesc} />
                      {project.technologies && project.technologies.length > 0 && (
                        <View style={styles.techRow}>
                          {project.technologies.map((tech, idx) => (
                            <Text key={idx} style={styles.techTag}>{tech}</Text>
                          ))}
                        </View>
                      )}
                      {(project.projectUrl || project.sourceCodeUrl) && (
                        <View style={styles.projectLinks}>
                          {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>Live Demo</Link>}
                          {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source Code</Link>}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.rightColumn}>
              {/* Skills with geometric indicators */}
              {skills.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionSquare} />
                    <Text style={styles.sectionTitle}>Skills</Text>
                  </View>
                  {skills.map((skill, idx) => (
                    <View key={skill.id} style={styles.skillBarContainer}>
                      <View style={styles.skillBarHeader}>
                        <Text style={styles.skillBarName}>{skill.name}</Text>
                        {skill.level && (
                          <Text style={styles.skillBarLevel}>
                            {skill.level.charAt(0) + skill.level.slice(1).toLowerCase()}
                          </Text>
                        )}
                      </View>
                      <View style={styles.skillBarBg}>
                        <View style={[styles.skillBarFill, { width: getSkillWidth(skill.level) }]} />
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Education */}
              {education.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionSquare} />
                    <Text style={styles.sectionTitle}>Education</Text>
                  </View>
                  {education.map((edu) => (
                    <View key={edu.id} style={styles.educationItem}>
                      <View style={styles.educationTriangle} />
                      <Text style={styles.educationDegree}>{edu.degree}</Text>
                      <Text style={styles.educationField}>{edu.fieldOfStudy}</Text>
                      <Text style={styles.educationInstitution}>{edu.institution}</Text>
                      <Text style={styles.educationDates}>
                        {formatDate(edu.endDate || edu.startDate)}
                        {edu.grade ? ` | GPA: ${edu.grade}` : ''}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Languages */}
              {languages && languages.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionSquare} />
                    <Text style={styles.sectionTitle}>Languages</Text>
                  </View>
                  {languages.map((lang) => (
                    <View key={lang.id} style={styles.languageItem}>
                      <View style={styles.languageCircle} />
                      <Text style={styles.languageName}>{lang.name}</Text>
                      {lang.proficiency && (
                        <Text style={styles.languageLevel}>
                          ({lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionSquare} />
                    <Text style={styles.sectionTitle}>Certifications</Text>
                  </View>
                  {certifications.map((cert) => (
                    <View key={cert.id} style={styles.certItem}>
                      <View style={styles.certHexagon} />
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
        </View>

        {/* Footer decoration */}
        <View style={styles.footerDecoration}>
          <View style={styles.footerSquare} />
          <View style={styles.footerCircle} />
          <View style={styles.footerSquare} />
        </View>
      </Page>
    </Document>
  )
}
