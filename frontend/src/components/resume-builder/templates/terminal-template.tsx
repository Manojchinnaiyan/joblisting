import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Terminal template - CLI/Command line aesthetic with retro terminal feel
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 30,
      paddingBottom: 30,
      paddingHorizontal: 35,
      fontSize: 10,
      fontFamily: 'Courier',
      color: '#1a1a2e',
      backgroundColor: '#ffffff',
    },
    // Header - Dark terminal header
    header: {
      backgroundColor: '#0d1117',
      padding: 20,
      marginHorizontal: -35,
      marginTop: -30,
      marginBottom: 15,
      borderBottomWidth: 3,
      borderBottomColor: accentColor,
    },
    terminalBar: {
      flexDirection: 'row',
      marginBottom: 12,
      gap: 6,
    },
    terminalDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    dotRed: {
      backgroundColor: '#ff5f56',
    },
    dotYellow: {
      backgroundColor: '#ffbd2e',
    },
    dotGreen: {
      backgroundColor: '#27c93f',
    },
    terminalTitle: {
      fontSize: 8,
      color: '#6e7681',
      fontFamily: 'Courier',
      marginLeft: 8,
    },
    promptLine: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    promptSymbol: {
      fontSize: 10,
      color: accentColor,
      fontFamily: 'Courier',
    },
    promptCommand: {
      fontSize: 10,
      color: '#8b949e',
      fontFamily: 'Courier',
    },
    outputName: {
      fontSize: 24,
      fontFamily: 'Courier',
      color: accentColor,
      marginBottom: 4,
      letterSpacing: 1,
    },
    outputHeadline: {
      fontSize: 11,
      color: '#58a6ff',
      fontFamily: 'Courier',
      marginBottom: 10,
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    contactItem: {
      fontSize: 9,
      color: '#8b949e',
      fontFamily: 'Courier',
    },
    contactLabel: {
      color: '#7ee787',
    },
    linksRow: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 10,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#21262d',
      borderStyle: 'dashed',
    },
    link: {
      fontSize: 9,
      color: '#58a6ff',
      textDecoration: 'none',
      fontFamily: 'Courier',
    },
    // ASCII border section
    asciiBorder: {
      fontSize: 8,
      color: '#6e7681',
      fontFamily: 'Courier',
      marginBottom: 4,
      letterSpacing: 0,
    },
    // Section styling
    section: {
      marginBottom: 14,
    },
    sectionHeader: {
      marginBottom: 8,
      paddingBottom: 4,
    },
    sectionCommand: {
      fontSize: 10,
      fontFamily: 'Courier',
      color: accentColor,
      marginBottom: 2,
    },
    sectionDivider: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: '#6e7681',
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Courier',
      color: '#1a1a2e',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Summary - command output style
    summaryContainer: {
      backgroundColor: '#f6f8fa',
      padding: 10,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    summaryText: {
      fontSize: 9,
      fontFamily: 'Courier',
      lineHeight: 1.5,
      color: '#24292f',
    },
    // Skills - tag-like display
    skillsContainer: {
      backgroundColor: '#f6f8fa',
      padding: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: '#d0d7de',
      borderStyle: 'dashed',
    },
    skillsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    skillsCommand: {
      fontSize: 10,
      fontFamily: 'Courier',
      color: accentColor,
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      backgroundColor: '#ffffff',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: '#d0d7de',
    },
    skillTagExpert: {
      backgroundColor: accentColor,
      borderColor: accentColor,
    },
    skillTagAdvanced: {
      borderColor: accentColor,
    },
    skillText: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: '#24292f',
    },
    skillTextExpert: {
      color: '#ffffff',
    },
    // Experience - command output entries
    itemContainer: {
      marginBottom: 12,
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: '#d0d7de',
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    itemTitleContainer: {
      flex: 1,
    },
    itemPrompt: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: accentColor,
      marginBottom: 2,
    },
    itemTitle: {
      fontSize: 10,
      fontFamily: 'Courier',
      color: '#1a1a2e',
    },
    itemCompany: {
      fontSize: 9,
      color: '#57606a',
      fontFamily: 'Courier',
      marginTop: 1,
    },
    itemLocation: {
      fontSize: 8,
      color: '#6e7681',
      fontFamily: 'Courier',
      marginTop: 1,
    },
    itemDates: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: '#6e7681',
      backgroundColor: '#f6f8fa',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: '#d0d7de',
    },
    itemDescription: {
      fontSize: 9,
      fontFamily: 'Courier',
      lineHeight: 1.4,
      color: '#24292f',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 9,
      fontFamily: 'Courier',
      lineHeight: 1.4,
      color: '#24292f',
      marginBottom: 2,
    },
    bulletMarker: {
      color: accentColor,
    },
    // Education
    eduItem: {
      marginBottom: 8,
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: '#d0d7de',
    },
    eduPrompt: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: accentColor,
      marginBottom: 2,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Courier',
      color: '#1a1a2e',
    },
    eduInstitution: {
      fontSize: 9,
      color: '#57606a',
      fontFamily: 'Courier',
    },
    eduMeta: {
      fontSize: 8,
      color: '#6e7681',
      fontFamily: 'Courier',
      marginTop: 2,
    },
    // Languages - inline display
    languagesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Courier',
      color: '#24292f',
    },
    languageLevel: {
      fontSize: 8,
      color: '#6e7681',
      fontFamily: 'Courier',
      marginLeft: 4,
    },
    // Certifications
    certList: {
      gap: 6,
    },
    certItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: '#d0d7de',
    },
    certContent: {
      flex: 1,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Courier',
      color: '#1a1a2e',
    },
    certOrg: {
      fontSize: 8,
      color: accentColor,
      fontFamily: 'Courier',
      marginTop: 1,
    },
    certDate: {
      fontSize: 7,
      color: '#6e7681',
      fontFamily: 'Courier',
      marginTop: 1,
    },
    // Projects
    projectItem: {
      marginBottom: 12,
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: accentColor,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    projectPrompt: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: accentColor,
      marginBottom: 2,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Courier',
      color: '#1a1a2e',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
    },
    projectLink: {
      fontSize: 8,
      color: '#58a6ff',
      fontFamily: 'Courier',
      textDecoration: 'none',
    },
    projectDesc: {
      fontSize: 9,
      fontFamily: 'Courier',
      lineHeight: 1.4,
      color: '#24292f',
      marginTop: 4,
    },
    techStack: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 6,
    },
    techTag: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: accentColor,
      backgroundColor: '#f6f8fa',
      paddingVertical: 2,
      paddingHorizontal: 5,
      borderWidth: 1,
      borderColor: accentColor,
    },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 15,
      left: 35,
      right: 35,
    },
    footerText: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: '#6e7681',
      textAlign: 'center',
    },
  })

interface TerminalTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function TerminalTemplate({ data, settings }: TerminalTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Separate skills by level
  const expertSkills = skills.filter(s => s.level === 'EXPERT')
  const advancedSkills = skills.filter(s => s.level === 'ADVANCED')
  const otherSkills = skills.filter(s => s.level !== 'EXPERT' && s.level !== 'ADVANCED')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Terminal Header */}
        <View style={styles.header}>
          {/* Terminal window buttons */}
          <View style={styles.terminalBar}>
            <View style={[styles.terminalDot, styles.dotRed]} />
            <View style={[styles.terminalDot, styles.dotYellow]} />
            <View style={[styles.terminalDot, styles.dotGreen]} />
            <Text style={styles.terminalTitle}>resume.sh - {personalInfo.firstName?.toLowerCase() || 'user'}@terminal</Text>
          </View>

          {/* Command prompt */}
          <View style={styles.promptLine}>
            <Text style={styles.promptSymbol}>$ </Text>
            <Text style={styles.promptCommand}>cat user.info</Text>
          </View>

          {/* Output: Name */}
          <Text style={styles.outputName}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>

          {personalInfo.headline && (
            <Text style={styles.outputHeadline}>{`// ${personalInfo.headline}`}</Text>
          )}

          {/* Contact info */}
          <View style={styles.contactRow}>
            {personalInfo.email && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>email:</Text> {personalInfo.email}
              </Text>
            )}
            {personalInfo.phone && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>phone:</Text> {personalInfo.phone}
              </Text>
            )}
            {personalInfo.location && (
              <Text style={styles.contactItem}>
                <Text style={styles.contactLabel}>loc:</Text> {personalInfo.location}
              </Text>
            )}
          </View>

          {/* Links */}
          {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.linksRow}>
              {personalInfo.githubUrl && (
                <Link src={personalInfo.githubUrl} style={styles.link}>[github]</Link>
              )}
              {personalInfo.linkedinUrl && (
                <Link src={personalInfo.linkedinUrl} style={styles.link}>[linkedin]</Link>
              )}
              {personalInfo.portfolioUrl && (
                <Link src={personalInfo.portfolioUrl} style={styles.link}>[portfolio]</Link>
              )}
            </View>
          )}
        </View>

        {/* Skills Section - Prominent */}
        {skills.length > 0 && (
          <View style={styles.skillsContainer}>
            <View style={styles.skillsHeader}>
              <Text style={styles.skillsCommand}>$ ls -la ./skills/</Text>
            </View>
            <View style={styles.skillsGrid}>
              {expertSkills.map((skill) => (
                <View key={skill.id} style={[styles.skillTag, styles.skillTagExpert]}>
                  <Text style={[styles.skillText, styles.skillTextExpert]}>{skill.name}</Text>
                </View>
              ))}
              {advancedSkills.map((skill) => (
                <View key={skill.id} style={[styles.skillTag, styles.skillTagAdvanced]}>
                  <Text style={styles.skillText}>{skill.name}</Text>
                </View>
              ))}
              {otherSkills.map((skill) => (
                <View key={skill.id} style={styles.skillTag}>
                  <Text style={styles.skillText}>{skill.name}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Summary Section */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionCommand}>$ cat README.md</Text>
              <Text style={styles.sectionDivider}>{'─'.repeat(50)}</Text>
            </View>
            <View style={styles.summaryContainer}>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          </View>
        )}

        {/* Experience Section */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionCommand}>$ git log --oneline ./experience/</Text>
              <Text style={styles.sectionDivider}>{'─'.repeat(50)}</Text>
            </View>
            {experience.map((exp, index) => (
              <View key={exp.id} style={styles.itemContainer}>
                <Text style={styles.itemPrompt}>{`[${index + 1}]`}</Text>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleContainer}>
                    <Text style={styles.itemTitle}>{exp.title}</Text>
                    <Text style={styles.itemCompany}>@ {exp.companyName}</Text>
                    {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
                  </View>
                  <Text style={styles.itemDates}>
                    {formatDate(exp.startDate)} - {exp.isCurrent ? 'present' : formatDate(exp.endDate || '')}
                  </Text>
                </View>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.achievements.map((achievement, idx) => (
                      <Text key={idx} style={styles.bulletItem}>
                        <Text style={styles.bulletMarker}>{`> `}</Text>{achievement}
                      </Text>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Projects Section */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionCommand}>$ ls ./projects/</Text>
              <Text style={styles.sectionDivider}>{'─'.repeat(50)}</Text>
            </View>
            {projects.map((project, index) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectPrompt}>{`[${index + 1}]`}</Text>
                <View style={styles.projectHeader}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
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
        )}

        {/* Education Section */}
        {education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionCommand}>$ cat ./education/degrees.log</Text>
              <Text style={styles.sectionDivider}>{'─'.repeat(50)}</Text>
            </View>
            {education.map((edu, index) => (
              <View key={edu.id} style={styles.eduItem}>
                <Text style={styles.eduPrompt}>{`[${index + 1}]`}</Text>
                <Text style={styles.eduDegree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                <Text style={styles.eduInstitution}>@ {edu.institution}</Text>
                <Text style={styles.eduMeta}>
                  {formatDate(edu.startDate)} - {edu.isCurrent ? 'present' : formatDate(edu.endDate || '')}
                  {edu.grade ? ` | GPA: ${edu.grade}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Languages Section */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionCommand}>$ locale -a</Text>
              <Text style={styles.sectionDivider}>{'─'.repeat(50)}</Text>
            </View>
            <View style={styles.languagesRow}>
              {languages.map((lang) => (
                <View key={lang.id} style={styles.languageItem}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {lang.proficiency && (
                    <Text style={styles.languageLevel}>
                      [{lang.proficiency.toLowerCase()}]
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Certifications Section */}
        {certifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionCommand}>$ cat ./certs/*.pem</Text>
              <Text style={styles.sectionDivider}>{'─'.repeat(50)}</Text>
            </View>
            <View style={styles.certList}>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <View style={styles.certContent}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                    <Text style={styles.certDate}>issued: {formatDate(cert.issueDate)}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{'─'.repeat(60)}</Text>
          <Text style={styles.footerText}>$ exit 0</Text>
        </View>
      </Page>
    </Document>
  )
}
