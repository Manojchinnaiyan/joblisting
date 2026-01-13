import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Helper to create lighter tint of color
const lightenColor = (color: string, percent: number) => {
  const hex = color.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const newR = Math.min(255, Math.round(r + (255 - r) * percent))
  const newG = Math.min(255, Math.round(g + (255 - g) * percent))
  const newB = Math.min(255, Math.round(b + (255 - b) * percent))
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`
}

// Wave template with flowing, organic visual elements
const createStyles = (accentColor: string) => {
  const lightAccent = lightenColor(accentColor, 0.85)
  const mediumAccent = lightenColor(accentColor, 0.6)

  return StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 30,
      paddingHorizontal: 0,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#374151',
      backgroundColor: '#ffffff',
    },
    // Header with wave-like bottom edge
    headerContainer: {
      position: 'relative',
      backgroundColor: accentColor,
      paddingTop: 30,
      paddingBottom: 40,
      paddingHorizontal: 40,
    },
    // Wave effect - multiple curved lines at the bottom of header
    waveContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 30,
      overflow: 'hidden',
    },
    waveLine1: {
      position: 'absolute',
      bottom: 22,
      left: -20,
      right: -20,
      height: 50,
      borderRadius: 100,
      backgroundColor: 'rgba(255,255,255,0.15)',
      transform: 'rotate(-2deg)',
    },
    waveLine2: {
      position: 'absolute',
      bottom: 15,
      left: -30,
      right: -30,
      height: 45,
      borderRadius: 100,
      backgroundColor: 'rgba(255,255,255,0.2)',
      transform: 'rotate(1deg)',
    },
    waveLine3: {
      position: 'absolute',
      bottom: 8,
      left: -10,
      right: -10,
      height: 40,
      borderRadius: 100,
      backgroundColor: 'rgba(255,255,255,0.3)',
      transform: 'rotate(-1deg)',
    },
    waveLineFinal: {
      position: 'absolute',
      bottom: 0,
      left: -20,
      right: -20,
      height: 35,
      borderRadius: 80,
      backgroundColor: '#ffffff',
    },
    name: {
      fontSize: 26,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 6,
      letterSpacing: 0.5,
    },
    headline: {
      fontSize: 12,
      color: 'rgba(255,255,255,0.9)',
      marginBottom: 12,
      fontStyle: 'italic',
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
    },
    contactItem: {
      fontSize: 9,
      color: 'rgba(255,255,255,0.85)',
    },
    linkRow: {
      flexDirection: 'row',
      gap: 16,
      marginTop: 8,
    },
    link: {
      fontSize: 9,
      color: '#ffffff',
      textDecoration: 'underline',
    },
    // Content area
    content: {
      paddingHorizontal: 40,
      paddingTop: 10,
    },
    // Section with wave-like divider
    section: {
      marginBottom: 16,
    },
    sectionHeader: {
      position: 'relative',
      marginBottom: 12,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 6,
    },
    // Wave divider under section titles - multiple thin lines
    waveDivider: {
      height: 8,
      position: 'relative',
    },
    dividerLine1: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: 80,
      height: 2,
      backgroundColor: accentColor,
      borderRadius: 10,
    },
    dividerLine2: {
      position: 'absolute',
      top: 3,
      left: 10,
      width: 60,
      height: 2,
      backgroundColor: mediumAccent,
      borderRadius: 10,
    },
    dividerLine3: {
      position: 'absolute',
      top: 6,
      left: 5,
      width: 40,
      height: 1,
      backgroundColor: lightAccent,
      borderRadius: 10,
    },
    // Summary
    summaryText: {
      fontSize: 10,
      lineHeight: 1.6,
      color: '#4b5563',
    },
    // Experience & Education items
    itemContainer: {
      marginBottom: 12,
      paddingLeft: 16,
      position: 'relative',
    },
    // Flowing accent line on left
    flowAccent: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: lightAccent,
      borderRadius: 3,
    },
    flowAccentDot: {
      position: 'absolute',
      left: -2,
      top: 4,
      width: 7,
      height: 7,
      backgroundColor: accentColor,
      borderRadius: 10,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 2,
    },
    itemTitleWrap: {
      flex: 1,
    },
    itemTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
    },
    itemCompany: {
      fontSize: 9,
      color: accentColor,
      marginTop: 2,
    },
    itemDates: {
      fontSize: 8,
      color: '#6b7280',
      backgroundColor: lightAccent,
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 10,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginTop: 4,
    },
    bulletList: {
      marginTop: 5,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 3,
    },
    // Skills with flowing pill design
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    skillPill: {
      backgroundColor: lightAccent,
      paddingVertical: 5,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderLeftWidth: 2,
      borderLeftColor: accentColor,
    },
    skillText: {
      fontSize: 9,
      color: '#374151',
    },
    // Languages
    languageContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: accentColor,
      marginRight: 6,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#374151',
    },
    languageLevel: {
      fontSize: 9,
      color: '#6b7280',
      marginLeft: 4,
    },
    // Certifications
    certItem: {
      marginBottom: 8,
      paddingLeft: 12,
      borderLeftWidth: 2,
      borderLeftColor: mediumAccent,
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
    },
    certDetails: {
      fontSize: 8,
      color: '#6b7280',
      marginTop: 1,
    },
    // Projects with subtle wave background
    projectItem: {
      marginBottom: 12,
      padding: 12,
      backgroundColor: lightAccent,
      borderRadius: 8,
      borderTopWidth: 2,
      borderTopColor: accentColor,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
      marginBottom: 4,
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
    },
    techLine: {
      fontSize: 8,
      color: accentColor,
      marginTop: 5,
      fontStyle: 'italic',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 5,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
    },
    // Decorative wave element for page
    pageDecor: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 20,
    },
    decorWave1: {
      position: 'absolute',
      bottom: 12,
      left: -30,
      right: -30,
      height: 25,
      borderRadius: 100,
      backgroundColor: lightAccent,
      opacity: 0.5,
    },
    decorWave2: {
      position: 'absolute',
      bottom: 5,
      left: -20,
      right: -20,
      height: 20,
      borderRadius: 100,
      backgroundColor: lightAccent,
      opacity: 0.3,
    },
  })
}

interface WaveTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function WaveTemplate({ data, settings }: WaveTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with wave effect */}
        <View style={styles.headerContainer}>
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
          {/* Wave effect at bottom of header */}
          <View style={styles.waveContainer}>
            <View style={styles.waveLine1} />
            <View style={styles.waveLine2} />
            <View style={styles.waveLine3} />
            <View style={styles.waveLineFinal} />
          </View>
        </View>

        <View style={styles.content}>
          {/* Summary */}
          {personalInfo.summary && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>About</Text>
                <View style={styles.waveDivider}>
                  <View style={styles.dividerLine1} />
                  <View style={styles.dividerLine2} />
                  <View style={styles.dividerLine3} />
                </View>
              </View>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Experience</Text>
                <View style={styles.waveDivider}>
                  <View style={styles.dividerLine1} />
                  <View style={styles.dividerLine2} />
                  <View style={styles.dividerLine3} />
                </View>
              </View>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.itemContainer}>
                  <View style={styles.flowAccent} />
                  <View style={styles.flowAccentDot} />
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleWrap}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemCompany}>
                        {exp.companyName}{exp.location ? ` • ${exp.location}` : ''}
                      </Text>
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
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Education</Text>
                <View style={styles.waveDivider}>
                  <View style={styles.dividerLine1} />
                  <View style={styles.dividerLine2} />
                  <View style={styles.dividerLine3} />
                </View>
              </View>
              {education.map((edu) => (
                <View key={edu.id} style={styles.itemContainer}>
                  <View style={styles.flowAccent} />
                  <View style={styles.flowAccentDot} />
                  <View style={styles.itemHeader}>
                    <View style={styles.itemTitleWrap}>
                      <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                      <Text style={styles.itemCompany}>{edu.institution}</Text>
                    </View>
                    <Text style={styles.itemDates}>
                      {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                    </Text>
                  </View>
                  {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Skills</Text>
                <View style={styles.waveDivider}>
                  <View style={styles.dividerLine1} />
                  <View style={styles.dividerLine2} />
                  <View style={styles.dividerLine3} />
                </View>
              </View>
              <View style={styles.skillsContainer}>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.skillPill}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Languages</Text>
                <View style={styles.waveDivider}>
                  <View style={styles.dividerLine1} />
                  <View style={styles.dividerLine2} />
                  <View style={styles.dividerLine3} />
                </View>
              </View>
              <View style={styles.languageContainer}>
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
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Certifications</Text>
                <View style={styles.waveDivider}>
                  <View style={styles.dividerLine1} />
                  <View style={styles.dividerLine2} />
                  <View style={styles.dividerLine3} />
                </View>
              </View>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certDetails}>
                    {cert.issuingOrganization} • {formatDate(cert.issueDate)}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Projects</Text>
                <View style={styles.waveDivider}>
                  <View style={styles.dividerLine1} />
                  <View style={styles.dividerLine2} />
                  <View style={styles.dividerLine3} />
                </View>
              </View>
              {projects.map((project) => (
                <View key={project.id} style={styles.projectItem}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.techLine}>{project.technologies.join(' • ')}</Text>
                  )}
                  {(project.projectUrl || project.sourceCodeUrl) && (
                    <View style={styles.projectLinks}>
                      {project.projectUrl && <Link src={project.projectUrl} style={styles.projectLink}>View Project</Link>}
                      {project.sourceCodeUrl && <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source Code</Link>}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Decorative wave at page bottom */}
        <View style={styles.pageDecor}>
          <View style={styles.decorWave1} />
          <View style={styles.decorWave2} />
        </View>
      </Page>
    </Document>
  )
}
