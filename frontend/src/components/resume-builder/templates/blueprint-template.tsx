import { Document, Page, Text, View, StyleSheet, Link, Svg, Line, Rect } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Blueprint Template - Engineering/Architectural blueprint aesthetic
// Features: Blueprint blue (#1a4480) header, grid pattern feel, measurement markers, technical annotations

const BLUEPRINT_BLUE = '#1a4480'
const BLUEPRINT_LIGHT = '#2a5490'
const GRID_LINE_COLOR = '#c5d4e8'
const ANNOTATION_COLOR = '#5a7a9a'

const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 30,
      paddingHorizontal: 0,
      fontSize: 10,
      fontFamily: 'Courier',
      color: '#1e293b',
      backgroundColor: '#f8fafc',
    },
    // Grid background effect
    gridContainer: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    // Header - Blueprint style
    header: {
      backgroundColor: BLUEPRINT_BLUE,
      padding: 25,
      paddingTop: 30,
      marginBottom: 0,
      position: 'relative',
    },
    headerGrid: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      opacity: 0.15,
    },
    titleBlock: {
      borderWidth: 2,
      borderColor: '#ffffff',
      padding: 15,
      marginBottom: 10,
    },
    revisionMarker: {
      position: 'absolute',
      top: 10,
      right: 15,
      flexDirection: 'row',
      alignItems: 'center',
    },
    revisionText: {
      fontSize: 7,
      color: '#ffffff',
      opacity: 0.7,
      fontFamily: 'Courier',
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    headline: {
      fontSize: 11,
      color: '#a8c5e5',
      fontFamily: 'Courier',
      letterSpacing: 1,
    },
    contactBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 20,
      marginTop: 12,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,0.3)',
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    contactLabel: {
      fontSize: 7,
      color: '#a8c5e5',
      fontFamily: 'Courier',
      textTransform: 'uppercase',
      marginRight: 4,
    },
    contactValue: {
      fontSize: 9,
      color: '#ffffff',
      fontFamily: 'Courier',
    },
    linksRow: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 8,
    },
    link: {
      fontSize: 8,
      color: '#a8c5e5',
      textDecoration: 'none',
      fontFamily: 'Courier',
    },
    // Scale/ruler bar
    scaleBar: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 35,
      paddingVertical: 8,
      backgroundColor: BLUEPRINT_LIGHT,
    },
    scaleMark: {
      fontSize: 6,
      color: '#ffffff',
      fontFamily: 'Courier',
      opacity: 0.7,
    },
    // Main content area
    contentArea: {
      paddingHorizontal: 35,
      paddingTop: 15,
    },
    // Section with blueprint annotations
    section: {
      marginBottom: 16,
      position: 'relative',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: BLUEPRINT_BLUE,
      borderBottomStyle: 'dashed',
    },
    sectionMarker: {
      width: 20,
      height: 20,
      backgroundColor: BLUEPRINT_BLUE,
      marginRight: 10,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sectionMarkerText: {
      fontSize: 10,
      color: '#ffffff',
      fontFamily: 'Courier',
      fontWeight: 'bold',
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: BLUEPRINT_BLUE,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    sectionAnnotation: {
      marginLeft: 'auto',
      fontSize: 7,
      color: ANNOTATION_COLOR,
      fontFamily: 'Courier',
    },
    // Summary with technical note style
    summaryContainer: {
      backgroundColor: '#ffffff',
      padding: 12,
      borderWidth: 1,
      borderColor: GRID_LINE_COLOR,
      position: 'relative',
    },
    summaryNote: {
      position: 'absolute',
      top: -8,
      left: 10,
      backgroundColor: '#f8fafc',
      paddingHorizontal: 6,
      fontSize: 7,
      color: ANNOTATION_COLOR,
      fontFamily: 'Courier',
    },
    summaryText: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.5,
      color: '#334155',
    },
    // Experience items with dimension lines
    itemContainer: {
      marginBottom: 14,
      paddingLeft: 15,
      borderLeftWidth: 2,
      borderLeftColor: GRID_LINE_COLOR,
      position: 'relative',
    },
    itemDot: {
      position: 'absolute',
      left: -5,
      top: 0,
      width: 8,
      height: 8,
      backgroundColor: BLUEPRINT_BLUE,
      borderRadius: 4,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    itemTitleContainer: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    itemCompany: {
      fontSize: 9,
      color: BLUEPRINT_BLUE,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    itemLocation: {
      fontSize: 8,
      color: ANNOTATION_COLOR,
      fontFamily: 'Courier',
      marginTop: 1,
    },
    itemDates: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: '#ffffff',
      backgroundColor: BLUEPRINT_BLUE,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    itemDescription: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#475569',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 6,
    },
    bulletItem: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#475569',
      marginBottom: 3,
      flexDirection: 'row',
    },
    bulletMarker: {
      color: BLUEPRINT_BLUE,
      marginRight: 6,
      fontFamily: 'Courier',
    },
    // Skills with grid layout
    skillsContainer: {
      backgroundColor: '#ffffff',
      padding: 12,
      borderWidth: 1,
      borderColor: GRID_LINE_COLOR,
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillTag: {
      backgroundColor: '#e8f0f8',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderWidth: 1,
      borderColor: BLUEPRINT_BLUE,
      borderStyle: 'dashed',
    },
    skillTagExpert: {
      backgroundColor: BLUEPRINT_BLUE,
      borderStyle: 'solid',
    },
    skillText: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: BLUEPRINT_BLUE,
    },
    skillTextExpert: {
      color: '#ffffff',
    },
    // Education
    eduItem: {
      marginBottom: 10,
      paddingLeft: 15,
      borderLeftWidth: 2,
      borderLeftColor: GRID_LINE_COLOR,
      position: 'relative',
    },
    eduDot: {
      position: 'absolute',
      left: -5,
      top: 2,
      width: 8,
      height: 8,
      backgroundColor: BLUEPRINT_BLUE,
      borderRadius: 4,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    eduInstitution: {
      fontSize: 9,
      color: BLUEPRINT_BLUE,
      fontFamily: 'Courier',
    },
    eduMeta: {
      fontSize: 8,
      color: ANNOTATION_COLOR,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    // Languages
    languagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    languageItem: {
      backgroundColor: '#ffffff',
      padding: 8,
      borderWidth: 1,
      borderColor: GRID_LINE_COLOR,
      minWidth: 100,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    languageLevel: {
      fontSize: 7,
      color: ANNOTATION_COLOR,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    // Certifications
    certGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    certItem: {
      backgroundColor: '#ffffff',
      padding: 10,
      borderWidth: 1,
      borderColor: GRID_LINE_COLOR,
      width: '48%',
      position: 'relative',
    },
    certBadge: {
      position: 'absolute',
      top: -6,
      right: 10,
      backgroundColor: BLUEPRINT_BLUE,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    certBadgeText: {
      fontSize: 6,
      color: '#ffffff',
      fontFamily: 'Courier',
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      marginTop: 4,
    },
    certOrg: {
      fontSize: 8,
      color: BLUEPRINT_BLUE,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    certDate: {
      fontSize: 7,
      color: ANNOTATION_COLOR,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    // Projects with technical specs
    projectItem: {
      marginBottom: 14,
      backgroundColor: '#ffffff',
      padding: 12,
      borderWidth: 1,
      borderColor: GRID_LINE_COLOR,
      position: 'relative',
    },
    projectNumber: {
      position: 'absolute',
      top: -8,
      left: 10,
      backgroundColor: BLUEPRINT_BLUE,
      paddingHorizontal: 8,
      paddingVertical: 2,
    },
    projectNumberText: {
      fontSize: 7,
      color: '#ffffff',
      fontFamily: 'Courier',
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginTop: 4,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
    },
    projectLink: {
      fontSize: 8,
      color: BLUEPRINT_BLUE,
      fontFamily: 'Courier',
    },
    projectDesc: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#475569',
      marginTop: 6,
    },
    techStack: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: GRID_LINE_COLOR,
      borderTopStyle: 'dashed',
    },
    techLabel: {
      fontSize: 7,
      color: ANNOTATION_COLOR,
      fontFamily: 'Courier',
      marginRight: 4,
    },
    techTag: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: BLUEPRINT_BLUE,
      backgroundColor: '#e8f0f8',
      paddingVertical: 2,
      paddingHorizontal: 6,
    },
    // Footer with drawing info
    footer: {
      position: 'absolute',
      bottom: 10,
      left: 35,
      right: 35,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: GRID_LINE_COLOR,
      paddingTop: 6,
    },
    footerText: {
      fontSize: 6,
      color: ANNOTATION_COLOR,
      fontFamily: 'Courier',
    },
  })

interface BlueprintTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function BlueprintTemplate({ data, settings }: BlueprintTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Separate expert skills
  const expertSkills = skills.filter(s => s.level === 'EXPERT')
  const otherSkills = skills.filter(s => s.level !== 'EXPERT')

  // Section markers
  let sectionCounter = 0
  const getNextSection = () => {
    sectionCounter++
    return sectionCounter.toString().padStart(2, '0')
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Blueprint Header */}
        <View style={styles.header}>
          {/* Revision marker */}
          <View style={styles.revisionMarker}>
            <Text style={styles.revisionText}>REV. 01 | CURRENT</Text>
          </View>

          {/* Title block - architectural style */}
          <View style={styles.titleBlock}>
            <Text style={styles.name}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            {personalInfo.headline && (
              <Text style={styles.headline}>{'// '}{personalInfo.headline}</Text>
            )}
          </View>

          {/* Contact information */}
          <View style={styles.contactBar}>
            {personalInfo.email && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>EMAIL:</Text>
                <Text style={styles.contactValue}>{personalInfo.email}</Text>
              </View>
            )}
            {personalInfo.phone && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>TEL:</Text>
                <Text style={styles.contactValue}>{personalInfo.phone}</Text>
              </View>
            )}
            {personalInfo.location && (
              <View style={styles.contactItem}>
                <Text style={styles.contactLabel}>LOC:</Text>
                <Text style={styles.contactValue}>{personalInfo.location}</Text>
              </View>
            )}
          </View>

          {/* Links */}
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linksRow}>
              {personalInfo.githubUrl && (
                <Link src={personalInfo.githubUrl} style={styles.link}>[GITHUB]</Link>
              )}
              {personalInfo.linkedinUrl && (
                <Link src={personalInfo.linkedinUrl} style={styles.link}>[LINKEDIN]</Link>
              )}
              {personalInfo.portfolioUrl && (
                <Link src={personalInfo.portfolioUrl} style={styles.link}>[PORTFOLIO]</Link>
              )}
            </View>
          )}
        </View>

        {/* Scale bar */}
        <View style={styles.scaleBar}>
          <Text style={styles.scaleMark}>|--- 0</Text>
          <Text style={styles.scaleMark}>|--- 25%</Text>
          <Text style={styles.scaleMark}>|--- 50%</Text>
          <Text style={styles.scaleMark}>|--- 75%</Text>
          <Text style={styles.scaleMark}>|--- 100%</Text>
        </View>

        {/* Main Content */}
        <View style={styles.contentArea}>
          {/* Summary */}
          {personalInfo.summary && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionMarker}>
                  <Text style={styles.sectionMarkerText}>{getNextSection()}</Text>
                </View>
                <Text style={styles.sectionTitle}>Executive Summary</Text>
                <Text style={styles.sectionAnnotation}>SPEC. NOTE</Text>
              </View>
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryNote}>DESCRIPTION</Text>
                <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
              </View>
            </View>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionMarker}>
                  <Text style={styles.sectionMarkerText}>{getNextSection()}</Text>
                </View>
                <Text style={styles.sectionTitle}>Technical Specifications</Text>
                <Text style={styles.sectionAnnotation}>MATERIALS</Text>
              </View>
              <View style={styles.skillsContainer}>
                <View style={styles.skillsGrid}>
                  {expertSkills.map((skill) => (
                    <View key={skill.id} style={[styles.skillTag, styles.skillTagExpert]}>
                      <Text style={[styles.skillText, styles.skillTextExpert]}>{skill.name}</Text>
                    </View>
                  ))}
                  {otherSkills.map((skill) => (
                    <View key={skill.id} style={styles.skillTag}>
                      <Text style={styles.skillText}>{skill.name}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionMarker}>
                  <Text style={styles.sectionMarkerText}>{getNextSection()}</Text>
                </View>
                <Text style={styles.sectionTitle}>Work History</Text>
                <Text style={styles.sectionAnnotation}>TIMELINE</Text>
              </View>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.itemContainer}>
                  <View style={styles.itemDot} />
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleContainer}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemCompany}>{exp.companyName}</Text>
                      {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
                    </View>
                    <Text style={styles.itemDates}>
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'PRESENT' : formatDate(exp.endDate || '')}
                    </Text>
                  </View>
                  {exp.description && (
                    <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.bulletList}>
                      {exp.achievements.map((achievement, idx) => (
                        <View key={idx} style={styles.bulletItem}>
                          <Text style={styles.bulletMarker}>{'>'}</Text>
                          <Text style={styles.itemDescription}>{achievement}</Text>
                        </View>
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
                <View style={styles.sectionMarker}>
                  <Text style={styles.sectionMarkerText}>{getNextSection()}</Text>
                </View>
                <Text style={styles.sectionTitle}>Project Specifications</Text>
                <Text style={styles.sectionAnnotation}>DELIVERABLES</Text>
              </View>
              {projects.map((project, index) => (
                <View key={project.id} style={styles.projectItem}>
                  <View style={styles.projectNumber}>
                    <Text style={styles.projectNumberText}>PROJ-{(index + 1).toString().padStart(2, '0')}</Text>
                  </View>
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
                    <View style={styles.techStack}>
                      <Text style={styles.techLabel}>STACK:</Text>
                      {project.technologies.map((tech, idx) => (
                        <Text key={idx} style={styles.techTag}>{tech}</Text>
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
              <View style={styles.sectionHeader}>
                <View style={styles.sectionMarker}>
                  <Text style={styles.sectionMarkerText}>{getNextSection()}</Text>
                </View>
                <Text style={styles.sectionTitle}>Education</Text>
                <Text style={styles.sectionAnnotation}>CREDENTIALS</Text>
              </View>
              {education.map((edu) => (
                <View key={edu.id} style={styles.eduItem}>
                  <View style={styles.eduDot} />
                  <Text style={styles.eduDegree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.eduInstitution}>{edu.institution}</Text>
                  <Text style={styles.eduMeta}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'PRESENT' : formatDate(edu.endDate || '')}
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
                <View style={styles.sectionMarker}>
                  <Text style={styles.sectionMarkerText}>{getNextSection()}</Text>
                </View>
                <Text style={styles.sectionTitle}>Languages</Text>
                <Text style={styles.sectionAnnotation}>COMMUNICATION</Text>
              </View>
              <View style={styles.languagesGrid}>
                {languages.map((lang) => (
                  <View key={lang.id} style={styles.languageItem}>
                    <Text style={styles.languageName}>{lang.name}</Text>
                    {lang.proficiency && (
                      <Text style={styles.languageLevel}>
                        [{lang.proficiency}]
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionMarker}>
                  <Text style={styles.sectionMarkerText}>{getNextSection()}</Text>
                </View>
                <Text style={styles.sectionTitle}>Certifications</Text>
                <Text style={styles.sectionAnnotation}>QUALIFICATIONS</Text>
              </View>
              <View style={styles.certGrid}>
                {certifications.map((cert, index) => (
                  <View key={cert.id} style={styles.certItem}>
                    <View style={styles.certBadge}>
                      <Text style={styles.certBadgeText}>CERT-{(index + 1).toString().padStart(2, '0')}</Text>
                    </View>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                    <Text style={styles.certDate}>ISSUED: {formatDate(cert.issueDate)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>DRAWING: RESUME-001</Text>
          <Text style={styles.footerText}>SCALE: NTS</Text>
          <Text style={styles.footerText}>DATE: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</Text>
        </View>
      </Page>
    </Document>
  )
}
