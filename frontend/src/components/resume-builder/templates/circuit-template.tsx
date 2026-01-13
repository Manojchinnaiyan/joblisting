import { Document, Page, Text, View, StyleSheet, Link, Svg, Line, Circle } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Circuit template - Circuit board inspired with geometric traces and node connections
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 30,
      paddingBottom: 30,
      paddingHorizontal: 40,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#1a1a2e',
      backgroundColor: '#ffffff',
    },
    // Circuit trace decorations on left side
    circuitTraceContainer: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 25,
    },
    // Header with circuit node design
    header: {
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
      position: 'relative',
    },
    headerContent: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    headerLeft: {
      flex: 1,
    },
    headerNode: {
      position: 'absolute',
      right: 0,
      top: 0,
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
      letterSpacing: 1,
    },
    headline: {
      fontSize: 12,
      color: accentColor,
      marginTop: 4,
      fontFamily: 'Helvetica',
      letterSpacing: 0.5,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 10,
      gap: 12,
    },
    contactItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    contactDot: {
      width: 4,
      height: 4,
      backgroundColor: accentColor,
      borderRadius: 2,
      marginRight: 5,
    },
    contactText: {
      fontSize: 9,
      color: '#4a4a68',
    },
    contactLink: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
    },
    // Section with circuit trace styling
    section: {
      marginBottom: 16,
      position: 'relative',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
    },
    sectionNode: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: accentColor,
      marginRight: 8,
    },
    sectionNodeInner: {
      position: 'absolute',
      left: 3,
      top: 3,
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: '#ffffff',
    },
    sectionTrace: {
      flex: 1,
      height: 2,
      backgroundColor: accentColor,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginLeft: 10,
      backgroundColor: '#ffffff',
      paddingHorizontal: 8,
    },
    // Summary
    summaryText: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.6,
      color: '#4a4a68',
      paddingLeft: 18,
      borderLeftWidth: 1,
      borderLeftColor: accentColor,
      borderLeftStyle: 'dashed',
    },
    // Skills as connected nodes
    skillsContainer: {
      paddingLeft: 18,
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillNode: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#f8f9fa',
      paddingVertical: 4,
      paddingHorizontal: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#e0e0e0',
    },
    skillNodeExpert: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
    skillNodeAdvanced: {
      borderColor: accentColor,
      borderWidth: 1.5,
    },
    skillDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: accentColor,
      marginRight: 6,
    },
    skillDotExpert: {
      backgroundColor: '#ffffff',
    },
    skillText: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: '#1a1a2e',
    },
    skillTextExpert: {
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
    },
    // Experience items with trace connectors
    itemContainer: {
      marginBottom: 14,
      paddingLeft: 18,
      position: 'relative',
    },
    itemConnector: {
      position: 'absolute',
      left: 4,
      top: 0,
      bottom: 0,
      width: 1,
      backgroundColor: accentColor,
    },
    itemNode: {
      position: 'absolute',
      left: 0,
      top: 2,
      width: 9,
      height: 9,
      borderRadius: 1,
      backgroundColor: accentColor,
    },
    itemNodeInner: {
      position: 'absolute',
      left: 2,
      top: 2,
      width: 5,
      height: 5,
      backgroundColor: '#ffffff',
      borderRadius: 1,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    itemTitleContainer: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    itemCompany: {
      fontSize: 9,
      color: accentColor,
      marginTop: 2,
    },
    itemLocation: {
      fontSize: 8,
      color: '#6b6b8a',
      marginTop: 1,
    },
    itemDates: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: '#6b6b8a',
      backgroundColor: '#f0f0f5',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderRadius: 2,
    },
    itemDescription: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.5,
      color: '#4a4a68',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    bulletMarker: {
      width: 14,
      fontSize: 9,
      color: accentColor,
    },
    bulletText: {
      flex: 1,
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#4a4a68',
    },
    // Education
    eduItem: {
      marginBottom: 10,
      paddingLeft: 18,
      position: 'relative',
    },
    eduNode: {
      position: 'absolute',
      left: 0,
      top: 2,
      width: 9,
      height: 9,
      borderWidth: 2,
      borderColor: accentColor,
      borderRadius: 1,
      backgroundColor: '#ffffff',
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    eduInstitution: {
      fontSize: 9,
      color: '#4a4a68',
      marginTop: 1,
    },
    eduMeta: {
      fontSize: 8,
      color: '#6b6b8a',
      marginTop: 2,
    },
    // Languages
    languagesContainer: {
      paddingLeft: 18,
    },
    languagesGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 15,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageDot: {
      width: 5,
      height: 5,
      borderRadius: 2.5,
      backgroundColor: accentColor,
      marginRight: 5,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    languageLevel: {
      fontSize: 8,
      color: '#6b6b8a',
      marginLeft: 4,
    },
    // Certifications
    certContainer: {
      paddingLeft: 18,
    },
    certGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    certItem: {
      width: '48%',
      backgroundColor: '#f8f9fa',
      padding: 8,
      borderLeftWidth: 2,
      borderLeftColor: accentColor,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    certOrg: {
      fontSize: 8,
      color: accentColor,
      marginTop: 2,
    },
    certDate: {
      fontSize: 7,
      color: '#6b6b8a',
      marginTop: 2,
    },
    // Projects with circuit styling
    projectContainer: {
      paddingLeft: 18,
    },
    projectItem: {
      marginBottom: 12,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#e8e8f0',
      borderBottomStyle: 'dashed',
    },
    projectItemLast: {
      borderBottomWidth: 0,
      marginBottom: 0,
      paddingBottom: 0,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    projectTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    projectNode: {
      width: 6,
      height: 6,
      backgroundColor: accentColor,
      borderRadius: 3,
      marginRight: 6,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a2e',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'none',
    },
    projectDesc: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#4a4a68',
      marginTop: 4,
      marginLeft: 12,
    },
    techStack: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 6,
      marginLeft: 12,
    },
    techTag: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: accentColor,
      backgroundColor: '#ffffff',
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderWidth: 1,
      borderColor: accentColor,
      borderRadius: 2,
    },
    // Circuit decorative elements
    cornerCircuit: {
      position: 'absolute',
      bottom: 15,
      right: 15,
    },
  })

// SVG component for circuit traces on left margin
function CircuitTraces({ color }: { color: string }) {
  return (
    <Svg width={25} height={792} style={{ position: 'absolute', left: 0, top: 0 }}>
      {/* Main vertical trace */}
      <Line x1={12} y1={30} x2={12} y2={762} stroke={color} strokeWidth={1.5} />
      {/* Connection nodes at intervals */}
      <Circle cx={12} cy={60} r={4} fill={color} />
      <Circle cx={12} cy={60} r={2} fill="#ffffff" />
      <Line x1={12} y1={60} x2={25} y2={60} stroke={color} strokeWidth={1} />

      <Circle cx={12} cy={150} r={4} fill={color} />
      <Circle cx={12} cy={150} r={2} fill="#ffffff" />
      <Line x1={12} y1={150} x2={25} y2={150} stroke={color} strokeWidth={1} />

      <Circle cx={12} cy={280} r={4} fill={color} />
      <Circle cx={12} cy={280} r={2} fill="#ffffff" />
      <Line x1={12} y1={280} x2={25} y2={280} stroke={color} strokeWidth={1} />

      <Circle cx={12} cy={420} r={4} fill={color} />
      <Circle cx={12} cy={420} r={2} fill="#ffffff" />
      <Line x1={12} y1={420} x2={25} y2={420} stroke={color} strokeWidth={1} />

      <Circle cx={12} cy={560} r={4} fill={color} />
      <Circle cx={12} cy={560} r={2} fill="#ffffff" />
      <Line x1={12} y1={560} x2={25} y2={560} stroke={color} strokeWidth={1} />

      <Circle cx={12} cy={700} r={4} fill={color} />
      <Circle cx={12} cy={700} r={2} fill="#ffffff" />
      <Line x1={12} y1={700} x2={25} y2={700} stroke={color} strokeWidth={1} />

      {/* Start and end nodes */}
      <Circle cx={12} cy={30} r={5} fill={color} />
      <Circle cx={12} cy={762} r={5} fill={color} />
    </Svg>
  )
}

// SVG component for header connection node
function HeaderNode({ color }: { color: string }) {
  return (
    <Svg width={50} height={50}>
      {/* Outer ring */}
      <Circle cx={25} cy={25} r={20} fill="none" stroke={color} strokeWidth={2} />
      {/* Inner ring */}
      <Circle cx={25} cy={25} r={12} fill="none" stroke={color} strokeWidth={1.5} />
      {/* Center node */}
      <Circle cx={25} cy={25} r={6} fill={color} />
      <Circle cx={25} cy={25} r={3} fill="#ffffff" />
      {/* Connection lines */}
      <Line x1={5} y1={25} x2={13} y2={25} stroke={color} strokeWidth={1.5} />
      <Line x1={37} y1={25} x2={45} y2={25} stroke={color} strokeWidth={1.5} />
      <Line x1={25} y1={5} x2={25} y2={13} stroke={color} strokeWidth={1.5} />
      <Line x1={25} y1={37} x2={25} y2={45} stroke={color} strokeWidth={1.5} />
    </Svg>
  )
}

// SVG for corner circuit decoration
function CornerCircuit({ color }: { color: string }) {
  return (
    <Svg width={60} height={60}>
      <Line x1={60} y1={0} x2={60} y2={40} stroke={color} strokeWidth={1} opacity={0.3} />
      <Line x1={60} y1={40} x2={40} y2={40} stroke={color} strokeWidth={1} opacity={0.3} />
      <Line x1={40} y1={40} x2={40} y2={60} stroke={color} strokeWidth={1} opacity={0.3} />
      <Circle cx={60} cy={0} r={3} fill={color} opacity={0.3} />
      <Circle cx={40} cy={40} r={3} fill={color} opacity={0.3} />
      <Circle cx={40} cy={60} r={3} fill={color} opacity={0.3} />
    </Svg>
  )
}

interface CircuitTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function CircuitTemplate({ data, settings }: CircuitTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Categorize skills by level
  const expertSkills = skills.filter(s => s.level === 'EXPERT')
  const advancedSkills = skills.filter(s => s.level === 'ADVANCED')
  const otherSkills = skills.filter(s => s.level !== 'EXPERT' && s.level !== 'ADVANCED')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Circuit traces on left margin */}
        <CircuitTraces color={settings.primaryColor} />

        {/* Corner circuit decoration */}
        <View style={styles.cornerCircuit}>
          <CornerCircuit color={settings.primaryColor} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <Text style={styles.name}>
                {personalInfo.firstName} {personalInfo.lastName}
              </Text>
              {personalInfo.headline && (
                <Text style={styles.headline}>{personalInfo.headline}</Text>
              )}
              <View style={styles.contactRow}>
                {personalInfo.email && (
                  <View style={styles.contactItem}>
                    <View style={styles.contactDot} />
                    <Text style={styles.contactText}>{personalInfo.email}</Text>
                  </View>
                )}
                {personalInfo.phone && (
                  <View style={styles.contactItem}>
                    <View style={styles.contactDot} />
                    <Text style={styles.contactText}>{personalInfo.phone}</Text>
                  </View>
                )}
                {personalInfo.location && (
                  <View style={styles.contactItem}>
                    <View style={styles.contactDot} />
                    <Text style={styles.contactText}>{personalInfo.location}</Text>
                  </View>
                )}
              </View>
              <View style={styles.contactRow}>
                {personalInfo.linkedinUrl && (
                  <Link src={personalInfo.linkedinUrl} style={styles.contactLink}>LinkedIn</Link>
                )}
                {personalInfo.githubUrl && (
                  <Link src={personalInfo.githubUrl} style={styles.contactLink}>GitHub</Link>
                )}
                {personalInfo.portfolioUrl && (
                  <Link src={personalInfo.portfolioUrl} style={styles.contactLink}>Portfolio</Link>
                )}
              </View>
            </View>
            <View style={styles.headerNode}>
              <HeaderNode color={settings.primaryColor} />
            </View>
          </View>
        </View>

        {/* Skills - Connected Nodes */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNode}>
                <View style={styles.sectionNodeInner} />
              </View>
              <View style={styles.sectionTrace} />
              <Text style={styles.sectionTitle}>Skills</Text>
            </View>
            <View style={styles.skillsContainer}>
              <View style={styles.skillsGrid}>
                {expertSkills.map((skill) => (
                  <View key={skill.id} style={[styles.skillNode, styles.skillNodeExpert]}>
                    <View style={[styles.skillDot, styles.skillDotExpert]} />
                    <Text style={[styles.skillText, styles.skillTextExpert]}>{skill.name}</Text>
                  </View>
                ))}
                {advancedSkills.map((skill) => (
                  <View key={skill.id} style={[styles.skillNode, styles.skillNodeAdvanced]}>
                    <View style={styles.skillDot} />
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
                {otherSkills.map((skill) => (
                  <View key={skill.id} style={styles.skillNode}>
                    <View style={styles.skillDot} />
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Summary */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNode}>
                <View style={styles.sectionNodeInner} />
              </View>
              <View style={styles.sectionTrace} />
              <Text style={styles.sectionTitle}>Summary</Text>
            </View>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNode}>
                <View style={styles.sectionNodeInner} />
              </View>
              <View style={styles.sectionTrace} />
              <Text style={styles.sectionTitle}>Experience</Text>
            </View>
            {experience.map((exp, index) => (
              <View key={exp.id} style={styles.itemContainer}>
                {index < experience.length - 1 && <View style={styles.itemConnector} />}
                <View style={styles.itemNode}>
                  <View style={styles.itemNodeInner} />
                </View>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleContainer}>
                    <Text style={styles.itemTitle}>{exp.title}</Text>
                    <Text style={styles.itemCompany}>{exp.companyName}</Text>
                    {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
                  </View>
                  <Text style={styles.itemDates}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                  </Text>
                </View>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.achievements.map((achievement, idx) => (
                      <View key={idx} style={styles.bulletItem}>
                        <Text style={styles.bulletMarker}>&#9656;</Text>
                        <Text style={styles.bulletText}>{achievement}</Text>
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
              <View style={styles.sectionNode}>
                <View style={styles.sectionNodeInner} />
              </View>
              <View style={styles.sectionTrace} />
              <Text style={styles.sectionTitle}>Projects</Text>
            </View>
            <View style={styles.projectContainer}>
              {projects.map((project, index) => (
                <View
                  key={project.id}
                  style={[
                    styles.projectItem,
                    ...(index === projects.length - 1 ? [styles.projectItemLast] : []),
                  ]}
                >
                  <View style={styles.projectHeader}>
                    <View style={styles.projectTitleRow}>
                      <View style={styles.projectNode} />
                      <Text style={styles.projectTitle}>{project.title}</Text>
                    </View>
                    {(project.projectUrl || project.sourceCodeUrl) && (
                      <View style={styles.projectLinks}>
                        {project.sourceCodeUrl && (
                          <Link src={project.sourceCodeUrl} style={styles.projectLink}>[src]</Link>
                        )}
                        {project.projectUrl && (
                          <Link src={project.projectUrl} style={styles.projectLink}>[demo]</Link>
                        )}
                      </View>
                    )}
                  </View>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <View style={styles.techStack}>
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

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNode}>
                <View style={styles.sectionNodeInner} />
              </View>
              <View style={styles.sectionTrace} />
              <Text style={styles.sectionTitle}>Education</Text>
            </View>
            {education.map((edu) => (
              <View key={edu.id} style={styles.eduItem}>
                <View style={styles.eduNode} />
                <Text style={styles.eduDegree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                <Text style={styles.eduInstitution}>{edu.institution}</Text>
                <Text style={styles.eduMeta}>
                  {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
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
              <View style={styles.sectionNode}>
                <View style={styles.sectionNodeInner} />
              </View>
              <View style={styles.sectionTrace} />
              <Text style={styles.sectionTitle}>Languages</Text>
            </View>
            <View style={styles.languagesContainer}>
              <View style={styles.languagesGrid}>
                {languages.map((lang) => (
                  <View key={lang.id} style={styles.languageItem}>
                    <View style={styles.languageDot} />
                    <Text style={styles.languageName}>{lang.name}</Text>
                    {lang.proficiency && (
                      <Text style={styles.languageLevel}>
                        ({lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()})
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionNode}>
                <View style={styles.sectionNodeInner} />
              </View>
              <View style={styles.sectionTrace} />
              <Text style={styles.sectionTitle}>Certifications</Text>
            </View>
            <View style={styles.certContainer}>
              <View style={styles.certGrid}>
                {certifications.map((cert) => (
                  <View key={cert.id} style={styles.certItem}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                    <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </Page>
    </Document>
  )
}
