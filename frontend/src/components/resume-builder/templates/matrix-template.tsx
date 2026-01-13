import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Matrix template - Grid/matrix-based layout with technical precision aesthetic
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 24,
      paddingBottom: 24,
      paddingHorizontal: 28,
      fontSize: 9,
      fontFamily: 'Courier',
      color: '#1a1a2e',
      backgroundColor: '#ffffff',
    },
    // Matrix grid overlay effect
    matrixHeader: {
      backgroundColor: '#0f0f23',
      padding: 18,
      marginHorizontal: -28,
      marginTop: -24,
      marginBottom: 16,
      borderBottomWidth: 3,
      borderBottomColor: accentColor,
    },
    // Header grid layout
    headerGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flex: 1,
    },
    headerRight: {
      width: 180,
      borderLeftWidth: 1,
      borderLeftColor: '#2d2d44',
      paddingLeft: 12,
    },
    // Matrix coordinate style for name
    matrixCoord: {
      fontSize: 7,
      color: accentColor,
      fontFamily: 'Courier',
      marginBottom: 2,
    },
    name: {
      fontSize: 20,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 4,
      letterSpacing: 1,
    },
    headline: {
      fontSize: 10,
      color: accentColor,
      fontFamily: 'Courier',
    },
    // Contact data table
    dataTable: {
      marginTop: 4,
    },
    dataRow: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    dataLabel: {
      width: 50,
      fontSize: 7,
      color: '#6b6b80',
      fontFamily: 'Courier',
      textTransform: 'uppercase',
    },
    dataValue: {
      fontSize: 8,
      color: '#e0e0e0',
      fontFamily: 'Courier',
    },
    linkValue: {
      fontSize: 8,
      color: accentColor,
      fontFamily: 'Courier',
      textDecoration: 'none',
    },
    // Main content grid
    mainGrid: {
      flexDirection: 'row',
      gap: 14,
    },
    leftColumn: {
      width: '38%',
    },
    rightColumn: {
      width: '62%',
    },
    // Matrix cell/module styling
    matrixCell: {
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: '#fafbfc',
    },
    cellHeader: {
      backgroundColor: '#f1f5f9',
      paddingVertical: 6,
      paddingHorizontal: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      flexDirection: 'row',
      alignItems: 'center',
    },
    cellIndex: {
      width: 18,
      height: 18,
      backgroundColor: accentColor,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
    },
    cellIndexText: {
      fontSize: 8,
      color: '#ffffff',
      fontFamily: 'Courier',
      fontWeight: 700,
    },
    cellTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
      textTransform: 'uppercase',
      letterSpacing: 0.8,
    },
    cellBody: {
      padding: 10,
    },
    // Summary cell - full width
    summaryCell: {
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      backgroundColor: '#fafbfc',
    },
    summaryText: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.6,
      color: '#334155',
    },
    // Skills matrix table
    skillsMatrix: {
      marginTop: 2,
    },
    skillRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#e8ecf0',
      paddingVertical: 4,
    },
    skillRowLast: {
      borderBottomWidth: 0,
    },
    skillName: {
      flex: 1,
      fontSize: 8,
      fontFamily: 'Courier',
      color: '#334155',
    },
    skillLevel: {
      width: 70,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 2,
    },
    levelDot: {
      width: 8,
      height: 8,
      borderRadius: 1,
      backgroundColor: '#e2e8f0',
    },
    levelDotFilled: {
      backgroundColor: accentColor,
    },
    // Languages matrix
    languageRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#e8ecf0',
    },
    languageRowLast: {
      borderBottomWidth: 0,
    },
    languageName: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    languageLevel: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: accentColor,
      textTransform: 'uppercase',
    },
    // Certifications grid
    certItem: {
      paddingVertical: 5,
      borderBottomWidth: 1,
      borderBottomColor: '#e8ecf0',
    },
    certItemLast: {
      borderBottomWidth: 0,
    },
    certName: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    certMeta: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: '#64748b',
      marginTop: 2,
    },
    // Experience matrix entries
    experienceEntry: {
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#e8ecf0',
      borderBottomStyle: 'dashed',
    },
    experienceEntryLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    entryHeader: {
      flexDirection: 'row',
      marginBottom: 4,
    },
    entryIndex: {
      width: 20,
      fontSize: 7,
      fontFamily: 'Courier',
      color: accentColor,
    },
    entryMeta: {
      flex: 1,
    },
    entryTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    entryCompany: {
      fontSize: 9,
      color: '#475569',
      marginTop: 1,
    },
    entryLocation: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: '#94a3b8',
      marginTop: 1,
    },
    entryDate: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: '#64748b',
      backgroundColor: '#f1f5f9',
      paddingVertical: 2,
      paddingHorizontal: 6,
      alignSelf: 'flex-start',
    },
    entryDescription: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      lineHeight: 1.5,
      color: '#475569',
      marginTop: 6,
      marginLeft: 20,
    },
    achievementsList: {
      marginTop: 4,
      marginLeft: 20,
    },
    achievementItem: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#475569',
      marginBottom: 2,
    },
    achievementMarker: {
      color: accentColor,
      fontFamily: 'Courier',
    },
    // Education matrix entries
    educationEntry: {
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e8ecf0',
    },
    educationEntryLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    eduHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    eduInfo: {
      flex: 1,
    },
    eduDegree: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    eduInstitution: {
      fontSize: 8,
      color: '#475569',
      marginTop: 1,
    },
    eduDate: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: '#64748b',
    },
    eduGrade: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: accentColor,
      marginTop: 2,
    },
    // Projects matrix
    projectEntry: {
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e8ecf0',
    },
    projectEntryLast: {
      marginBottom: 0,
      paddingBottom: 0,
      borderBottomWidth: 0,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    projectTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 6,
    },
    projectLink: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: accentColor,
      textDecoration: 'none',
    },
    projectDesc: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      lineHeight: 1.5,
      color: '#475569',
      marginTop: 4,
    },
    techGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 6,
    },
    techTag: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: accentColor,
      backgroundColor: '#f1f5f9',
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderWidth: 1,
      borderColor: accentColor,
    },
  })

interface MatrixTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function MatrixTemplate({ data, settings }: MatrixTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Get skill level as number for dot display (1-4)
  const getSkillLevelNumber = (level?: string): number => {
    switch (level) {
      case 'EXPERT': return 4
      case 'ADVANCED': return 3
      case 'INTERMEDIATE': return 2
      case 'BEGINNER': return 1
      default: return 2
    }
  }

  // Section index counter
  let sectionIndex = 0
  const getNextIndex = () => {
    sectionIndex++
    return sectionIndex.toString().padStart(2, '0')
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Matrix Header */}
        <View style={styles.matrixHeader}>
          <View style={styles.headerGrid}>
            <View style={styles.headerLeft}>
              <Text style={styles.matrixCoord}>[PROFILE.INIT]</Text>
              <Text style={styles.name}>
                {personalInfo.firstName} {personalInfo.lastName}
              </Text>
              {personalInfo.headline && (
                <Text style={styles.headline}>{personalInfo.headline}</Text>
              )}
            </View>
            <View style={styles.headerRight}>
              <View style={styles.dataTable}>
                {personalInfo.email && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>EMAIL</Text>
                    <Text style={styles.dataValue}>{personalInfo.email}</Text>
                  </View>
                )}
                {personalInfo.phone && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>PHONE</Text>
                    <Text style={styles.dataValue}>{personalInfo.phone}</Text>
                  </View>
                )}
                {personalInfo.location && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>LOC</Text>
                    <Text style={styles.dataValue}>{personalInfo.location}</Text>
                  </View>
                )}
                {personalInfo.linkedinUrl && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>LINK</Text>
                    <Link src={personalInfo.linkedinUrl} style={styles.linkValue}>LinkedIn</Link>
                  </View>
                )}
                {personalInfo.githubUrl && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>CODE</Text>
                    <Link src={personalInfo.githubUrl} style={styles.linkValue}>GitHub</Link>
                  </View>
                )}
                {personalInfo.portfolioUrl && (
                  <View style={styles.dataRow}>
                    <Text style={styles.dataLabel}>WEB</Text>
                    <Link src={personalInfo.portfolioUrl} style={styles.linkValue}>Portfolio</Link>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Summary Cell */}
        {personalInfo.summary && (
          <View style={styles.summaryCell}>
            <View style={styles.cellHeader}>
              <View style={styles.cellIndex}>
                <Text style={styles.cellIndexText}>{getNextIndex()}</Text>
              </View>
              <Text style={styles.cellTitle}>Profile Summary</Text>
            </View>
            <View style={styles.cellBody}>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          </View>
        )}

        {/* Main Grid Layout */}
        <View style={styles.mainGrid}>
          {/* Left Column */}
          <View style={styles.leftColumn}>
            {/* Skills Matrix */}
            {skills.length > 0 && (
              <View style={styles.matrixCell}>
                <View style={styles.cellHeader}>
                  <View style={styles.cellIndex}>
                    <Text style={styles.cellIndexText}>{getNextIndex()}</Text>
                  </View>
                  <Text style={styles.cellTitle}>Skills Matrix</Text>
                </View>
                <View style={styles.cellBody}>
                  <View style={styles.skillsMatrix}>
                    {skills.map((skill, index) => {
                      const levelNum = getSkillLevelNumber(skill.level)
                      return (
                        <View
                          key={skill.id}
                          style={[
                            styles.skillRow,
                            index === skills.length - 1 ? styles.skillRowLast : {},
                          ]}
                        >
                          <Text style={styles.skillName}>{skill.name}</Text>
                          <View style={styles.skillLevel}>
                            {[1, 2, 3, 4].map((dot) => (
                              <View
                                key={dot}
                                style={[
                                  styles.levelDot,
                                  dot <= levelNum ? styles.levelDotFilled : {},
                                ]}
                              />
                            ))}
                          </View>
                        </View>
                      )
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* Languages Matrix */}
            {languages && languages.length > 0 && (
              <View style={styles.matrixCell}>
                <View style={styles.cellHeader}>
                  <View style={styles.cellIndex}>
                    <Text style={styles.cellIndexText}>{getNextIndex()}</Text>
                  </View>
                  <Text style={styles.cellTitle}>Languages</Text>
                </View>
                <View style={styles.cellBody}>
                  {languages.map((lang, index) => (
                    <View
                      key={lang.id}
                      style={[
                        styles.languageRow,
                        index === languages.length - 1 ? styles.languageRowLast : {},
                      ]}
                    >
                      <Text style={styles.languageName}>{lang.name}</Text>
                      {lang.proficiency && (
                        <Text style={styles.languageLevel}>
                          {lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Certifications Matrix */}
            {certifications.length > 0 && (
              <View style={styles.matrixCell}>
                <View style={styles.cellHeader}>
                  <View style={styles.cellIndex}>
                    <Text style={styles.cellIndexText}>{getNextIndex()}</Text>
                  </View>
                  <Text style={styles.cellTitle}>Certifications</Text>
                </View>
                <View style={styles.cellBody}>
                  {certifications.map((cert, index) => (
                    <View
                      key={cert.id}
                      style={[
                        styles.certItem,
                        index === certifications.length - 1 ? styles.certItemLast : {},
                      ]}
                    >
                      <Text style={styles.certName}>{cert.name}</Text>
                      <Text style={styles.certMeta}>
                        {cert.issuingOrganization} | {formatDate(cert.issueDate)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Right Column */}
          <View style={styles.rightColumn}>
            {/* Experience Matrix */}
            {experience.length > 0 && (
              <View style={styles.matrixCell}>
                <View style={styles.cellHeader}>
                  <View style={styles.cellIndex}>
                    <Text style={styles.cellIndexText}>{getNextIndex()}</Text>
                  </View>
                  <Text style={styles.cellTitle}>Experience Log</Text>
                </View>
                <View style={styles.cellBody}>
                  {experience.map((exp, index) => (
                    <View
                      key={exp.id}
                      style={[
                        styles.experienceEntry,
                        index === experience.length - 1 ? styles.experienceEntryLast : {},
                      ]}
                    >
                      <View style={styles.entryHeader}>
                        <Text style={styles.entryIndex}>[{(index + 1).toString().padStart(2, '0')}]</Text>
                        <View style={styles.entryMeta}>
                          <Text style={styles.entryTitle}>{exp.title}</Text>
                          <Text style={styles.entryCompany}>{exp.companyName}</Text>
                          {exp.location && <Text style={styles.entryLocation}>{exp.location}</Text>}
                        </View>
                        <Text style={styles.entryDate}>
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                        </Text>
                      </View>
                      {exp.description && (
                        <RichTextRenderer text={exp.description} style={styles.entryDescription} />
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <View style={styles.achievementsList}>
                          {exp.achievements.map((achievement, idx) => (
                            <Text key={idx} style={styles.achievementItem}>
                              <Text style={styles.achievementMarker}>{'>>'} </Text>{achievement}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Education Matrix */}
            {education.length > 0 && (
              <View style={styles.matrixCell}>
                <View style={styles.cellHeader}>
                  <View style={styles.cellIndex}>
                    <Text style={styles.cellIndexText}>{getNextIndex()}</Text>
                  </View>
                  <Text style={styles.cellTitle}>Education</Text>
                </View>
                <View style={styles.cellBody}>
                  {education.map((edu, index) => (
                    <View
                      key={edu.id}
                      style={[
                        styles.educationEntry,
                        index === education.length - 1 ? styles.educationEntryLast : {},
                      ]}
                    >
                      <View style={styles.eduHeader}>
                        <View style={styles.eduInfo}>
                          <Text style={styles.eduDegree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                          <Text style={styles.eduInstitution}>{edu.institution}</Text>
                          {edu.grade && <Text style={styles.eduGrade}>GPA: {edu.grade}</Text>}
                        </View>
                        <Text style={styles.eduDate}>
                          {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Projects Matrix */}
            {projects.length > 0 && (
              <View style={styles.matrixCell}>
                <View style={styles.cellHeader}>
                  <View style={styles.cellIndex}>
                    <Text style={styles.cellIndexText}>{getNextIndex()}</Text>
                  </View>
                  <Text style={styles.cellTitle}>Projects</Text>
                </View>
                <View style={styles.cellBody}>
                  {projects.map((project, index) => (
                    <View
                      key={project.id}
                      style={[
                        styles.projectEntry,
                        index === projects.length - 1 ? styles.projectEntryLast : {},
                      ]}
                    >
                      <View style={styles.projectHeader}>
                        <Text style={styles.projectTitle}>{project.title}</Text>
                        {(project.projectUrl || project.sourceCodeUrl) && (
                          <View style={styles.projectLinks}>
                            {project.sourceCodeUrl && (
                              <Link src={project.sourceCodeUrl} style={styles.projectLink}>[SRC]</Link>
                            )}
                            {project.projectUrl && (
                              <Link src={project.projectUrl} style={styles.projectLink}>[DEMO]</Link>
                            )}
                          </View>
                        )}
                      </View>
                      <RichTextRenderer text={project.description} style={styles.projectDesc} />
                      {project.technologies && project.technologies.length > 0 && (
                        <View style={styles.techGrid}>
                          {project.technologies.map((tech, idx) => (
                            <Text key={idx} style={styles.techTag}>{tech}</Text>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </View>
      </Page>
    </Document>
  )
}
