import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Engineer template - Technical/Blueprint style with measurement markers and gauge-style skills
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 25,
      paddingBottom: 25,
      paddingHorizontal: 30,
      fontSize: 10,
      fontFamily: 'Courier',
      color: '#1a365d',
      backgroundColor: '#f8fafc',
    },
    // Blueprint border with measurement markers
    blueprintFrame: {
      position: 'absolute',
      top: 15,
      left: 15,
      right: 15,
      bottom: 15,
      borderWidth: 2,
      borderColor: accentColor,
      borderStyle: 'solid',
    },
    cornerMarker: {
      position: 'absolute',
      width: 12,
      height: 12,
      borderColor: accentColor,
    },
    cornerTopLeft: {
      top: -2,
      left: -2,
      borderTopWidth: 3,
      borderLeftWidth: 3,
    },
    cornerTopRight: {
      top: -2,
      right: -2,
      borderTopWidth: 3,
      borderRightWidth: 3,
    },
    cornerBottomLeft: {
      bottom: -2,
      left: -2,
      borderBottomWidth: 3,
      borderLeftWidth: 3,
    },
    cornerBottomRight: {
      bottom: -2,
      right: -2,
      borderBottomWidth: 3,
      borderRightWidth: 3,
    },
    // Measurement tick marks
    tickContainer: {
      position: 'absolute',
      flexDirection: 'row',
      left: 30,
      right: 30,
      top: 6,
      justifyContent: 'space-between',
    },
    tick: {
      width: 1,
      height: 6,
      backgroundColor: accentColor,
    },
    // Grid background pattern (simulated with subtle lines)
    gridLine: {
      position: 'absolute',
      left: 30,
      right: 30,
      height: 1,
      backgroundColor: '#e2e8f0',
      opacity: 0.5,
    },
    // Header section with technical styling
    header: {
      marginTop: 10,
      marginBottom: 15,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
      borderBottomStyle: 'dashed',
    },
    revisionBox: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: accentColor,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    revisionText: {
      fontSize: 7,
      color: '#ffffff',
      fontFamily: 'Courier',
    },
    titleBlock: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      marginBottom: 8,
    },
    name: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#1a365d',
      letterSpacing: 1,
    },
    specLabel: {
      fontSize: 8,
      color: '#64748b',
      marginLeft: 10,
      marginBottom: 3,
    },
    headline: {
      fontSize: 12,
      color: accentColor,
      fontFamily: 'Courier',
      marginBottom: 10,
      paddingLeft: 4,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    // Contact grid - technical specification style
    specGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      padding: 8,
    },
    specItem: {
      width: '50%',
      flexDirection: 'row',
      marginBottom: 4,
    },
    specKey: {
      fontSize: 8,
      color: '#64748b',
      width: 50,
      fontFamily: 'Courier',
    },
    specValue: {
      fontSize: 9,
      color: '#1e293b',
      fontFamily: 'Courier',
      flex: 1,
    },
    specLink: {
      fontSize: 9,
      color: accentColor,
      fontFamily: 'Courier',
      textDecoration: 'none',
    },
    // Section styling
    section: {
      marginBottom: 14,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      backgroundColor: '#ffffff',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderLeftWidth: 4,
      borderLeftColor: accentColor,
      borderRightWidth: 1,
      borderRightColor: '#e2e8f0',
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    sectionNumber: {
      fontSize: 10,
      fontFamily: 'Courier',
      color: accentColor,
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1a365d',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    dimensionLabel: {
      fontSize: 7,
      color: '#94a3b8',
      marginLeft: 'auto',
      fontFamily: 'Courier',
    },
    // Summary - Blueprint note style
    summaryBox: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      padding: 10,
      position: 'relative',
    },
    noteLabel: {
      position: 'absolute',
      top: -6,
      left: 8,
      backgroundColor: '#f8fafc',
      paddingHorizontal: 4,
      fontSize: 7,
      color: '#64748b',
      fontFamily: 'Courier',
    },
    summaryText: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.5,
      color: '#334155',
    },
    // Skills - Technical gauge/meter style
    skillsContainer: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      padding: 10,
    },
    skillsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    skillItem: {
      width: '50%',
      marginBottom: 6,
      paddingRight: 10,
    },
    skillHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 3,
    },
    skillName: {
      fontSize: 9,
      fontFamily: 'Courier',
      color: '#1e293b',
    },
    skillLevel: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: '#64748b',
    },
    // Gauge meter
    gaugeBg: {
      height: 6,
      backgroundColor: '#e2e8f0',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      position: 'relative',
    },
    gaugeFill: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      backgroundColor: accentColor,
    },
    gaugeMarkers: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      flexDirection: 'row',
      justifyContent: 'space-evenly',
    },
    gaugeMarker: {
      width: 1,
      height: '100%',
      backgroundColor: '#ffffff',
    },
    // Experience - Technical specification cards
    expCard: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      marginBottom: 10,
      position: 'relative',
    },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
      paddingHorizontal: 10,
      paddingVertical: 6,
      backgroundColor: '#f1f5f9',
    },
    expTitleBlock: {
      flex: 1,
    },
    expTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a365d',
    },
    expCompany: {
      fontSize: 9,
      color: accentColor,
      fontFamily: 'Courier',
      marginTop: 1,
    },
    expMeta: {
      alignItems: 'flex-end',
    },
    expDate: {
      fontSize: 8,
      fontFamily: 'Courier',
      color: '#64748b',
      backgroundColor: '#ffffff',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: '#e2e8f0',
    },
    expLocation: {
      fontSize: 7,
      color: '#94a3b8',
      marginTop: 2,
    },
    expBody: {
      padding: 10,
    },
    expDescription: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#475569',
    },
    achievementList: {
      marginTop: 6,
    },
    achievementItem: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    achievementMarker: {
      fontSize: 9,
      color: accentColor,
      marginRight: 6,
      fontFamily: 'Courier',
    },
    achievementText: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#334155',
      flex: 1,
      lineHeight: 1.3,
    },
    // Education - Credential blocks
    eduGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    eduCard: {
      width: '48%',
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      padding: 8,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a365d',
      marginBottom: 2,
    },
    eduField: {
      fontSize: 9,
      color: accentColor,
      fontFamily: 'Courier',
    },
    eduInstitution: {
      fontSize: 9,
      color: '#475569',
      marginTop: 4,
    },
    eduMeta: {
      fontSize: 8,
      color: '#64748b',
      fontFamily: 'Courier',
      marginTop: 4,
      paddingTop: 4,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
    },
    // Projects - Technical project cards with schematic styling
    projectCard: {
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      marginBottom: 8,
    },
    projectHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#f8fafc',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a365d',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 8,
    },
    projectLink: {
      fontSize: 7,
      color: accentColor,
      fontFamily: 'Courier',
      textDecoration: 'none',
      paddingVertical: 2,
      paddingHorizontal: 4,
      borderWidth: 1,
      borderColor: accentColor,
    },
    projectBody: {
      padding: 10,
    },
    projectDesc: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      lineHeight: 1.4,
      color: '#475569',
    },
    techRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: '#e2e8f0',
    },
    techTag: {
      fontSize: 7,
      fontFamily: 'Courier',
      color: '#1e293b',
      backgroundColor: '#f1f5f9',
      paddingVertical: 2,
      paddingHorizontal: 6,
      borderWidth: 1,
      borderColor: '#cbd5e1',
    },
    // Certifications - Badge/stamp style
    certGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    certBadge: {
      width: '48%',
      backgroundColor: '#ffffff',
      borderWidth: 2,
      borderColor: accentColor,
      padding: 8,
      alignItems: 'center',
    },
    certIcon: {
      fontSize: 12,
      color: accentColor,
      marginBottom: 4,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1a365d',
      textAlign: 'center',
    },
    certOrg: {
      fontSize: 8,
      color: accentColor,
      fontFamily: 'Courier',
      marginTop: 2,
    },
    certDate: {
      fontSize: 7,
      color: '#64748b',
      marginTop: 4,
    },
    // Languages - Specification list
    langGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#cbd5e1',
      padding: 10,
    },
    langItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    langIndicator: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: accentColor,
      marginRight: 6,
    },
    langName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#1e293b',
    },
    langLevel: {
      fontSize: 8,
      color: '#64748b',
      marginLeft: 4,
      fontFamily: 'Courier',
    },
    // Footer with drawing number style
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 30,
      right: 30,
      flexDirection: 'row',
      justifyContent: 'space-between',
      borderTopWidth: 1,
      borderTopColor: accentColor,
      paddingTop: 6,
    },
    footerText: {
      fontSize: 7,
      color: '#64748b',
      fontFamily: 'Courier',
    },
  })

interface EngineerTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function EngineerTemplate({ data, settings }: EngineerTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Get skill percentage based on level
  const getSkillPercentage = (level?: string) => {
    switch (level) {
      case 'EXPERT': return 100
      case 'ADVANCED': return 80
      case 'INTERMEDIATE': return 60
      case 'BEGINNER': return 40
      default: return 50
    }
  }

  // Get short level label
  const getLevelLabel = (level?: string) => {
    switch (level) {
      case 'EXPERT': return 'EXP'
      case 'ADVANCED': return 'ADV'
      case 'INTERMEDIATE': return 'INT'
      case 'BEGINNER': return 'BEG'
      default: return 'STD'
    }
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Blueprint frame with corner markers */}
        <View style={styles.blueprintFrame}>
          <View style={[styles.cornerMarker, styles.cornerTopLeft]} />
          <View style={[styles.cornerMarker, styles.cornerTopRight]} />
          <View style={[styles.cornerMarker, styles.cornerBottomLeft]} />
          <View style={[styles.cornerMarker, styles.cornerBottomRight]} />
        </View>

        {/* Measurement tick marks */}
        <View style={styles.tickContainer}>
          {[...Array(20)].map((_, i) => (
            <View key={i} style={styles.tick} />
          ))}
        </View>

        {/* Header with revision box */}
        <View style={styles.header}>
          <View style={styles.revisionBox}>
            <Text style={styles.revisionText}>REV. 1.0</Text>
          </View>

          <View style={styles.titleBlock}>
            <Text style={styles.name}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            <Text style={styles.specLabel}>ENGINEER</Text>
          </View>

          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}

          {/* Contact specifications grid */}
          <View style={styles.specGrid}>
            {personalInfo.email && (
              <View style={styles.specItem}>
                <Text style={styles.specKey}>EMAIL:</Text>
                <Text style={styles.specValue}>{personalInfo.email}</Text>
              </View>
            )}
            {personalInfo.phone && (
              <View style={styles.specItem}>
                <Text style={styles.specKey}>TEL:</Text>
                <Text style={styles.specValue}>{personalInfo.phone}</Text>
              </View>
            )}
            {personalInfo.location && (
              <View style={styles.specItem}>
                <Text style={styles.specKey}>LOC:</Text>
                <Text style={styles.specValue}>{personalInfo.location}</Text>
              </View>
            )}
            {personalInfo.githubUrl && (
              <View style={styles.specItem}>
                <Text style={styles.specKey}>GIT:</Text>
                <Link src={personalInfo.githubUrl} style={styles.specLink}>GitHub</Link>
              </View>
            )}
            {personalInfo.linkedinUrl && (
              <View style={styles.specItem}>
                <Text style={styles.specKey}>LI:</Text>
                <Link src={personalInfo.linkedinUrl} style={styles.specLink}>LinkedIn</Link>
              </View>
            )}
            {personalInfo.portfolioUrl && (
              <View style={styles.specItem}>
                <Text style={styles.specKey}>WEB:</Text>
                <Link src={personalInfo.portfolioUrl} style={styles.specLink}>Portfolio</Link>
              </View>
            )}
          </View>
        </View>

        {/* Summary - Technical note */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>01</Text>
              <Text style={styles.sectionTitle}>Overview</Text>
              <Text style={styles.dimensionLabel}>SPEC</Text>
            </View>
            <View style={styles.summaryBox}>
              <Text style={styles.noteLabel}>NOTE</Text>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          </View>
        )}

        {/* Skills - Gauge meter style */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>02</Text>
              <Text style={styles.sectionTitle}>Technical Skills</Text>
              <Text style={styles.dimensionLabel}>PROFICIENCY</Text>
            </View>
            <View style={styles.skillsContainer}>
              <View style={styles.skillsGrid}>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.skillItem}>
                    <View style={styles.skillHeader}>
                      <Text style={styles.skillName}>{skill.name}</Text>
                      <Text style={styles.skillLevel}>[{getLevelLabel(skill.level)}]</Text>
                    </View>
                    <View style={styles.gaugeBg}>
                      <View
                        style={[
                          styles.gaugeFill,
                          { width: `${getSkillPercentage(skill.level)}%` }
                        ]}
                      />
                      <View style={styles.gaugeMarkers}>
                        <View style={styles.gaugeMarker} />
                        <View style={styles.gaugeMarker} />
                        <View style={styles.gaugeMarker} />
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Experience - Technical specification cards */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>03</Text>
              <Text style={styles.sectionTitle}>Experience</Text>
              <Text style={styles.dimensionLabel}>HISTORY</Text>
            </View>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.expCard}>
                <View style={styles.expHeader}>
                  <View style={styles.expTitleBlock}>
                    <Text style={styles.expTitle}>{exp.title}</Text>
                    <Text style={styles.expCompany}>{exp.companyName}</Text>
                  </View>
                  <View style={styles.expMeta}>
                    <Text style={styles.expDate}>
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'PRESENT' : formatDate(exp.endDate || '')}
                    </Text>
                    {exp.location && <Text style={styles.expLocation}>{exp.location}</Text>}
                  </View>
                </View>
                <View style={styles.expBody}>
                  {exp.description && (
                    <RichTextRenderer text={exp.description} style={styles.expDescription} />
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.achievementList}>
                      {exp.achievements.map((achievement, idx) => (
                        <View key={idx} style={styles.achievementItem}>
                          <Text style={styles.achievementMarker}>{`>`}</Text>
                          <Text style={styles.achievementText}>{achievement}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>04</Text>
              <Text style={styles.sectionTitle}>Projects</Text>
              <Text style={styles.dimensionLabel}>PORTFOLIO</Text>
            </View>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
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
                <View style={styles.projectBody}>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <View style={styles.techRow}>
                      {project.technologies.map((tech, idx) => (
                        <Text key={idx} style={styles.techTag}>{tech}</Text>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Education */}
        {education.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>05</Text>
              <Text style={styles.sectionTitle}>Education</Text>
              <Text style={styles.dimensionLabel}>CREDENTIALS</Text>
            </View>
            <View style={styles.eduGrid}>
              {education.map((edu) => (
                <View key={edu.id} style={styles.eduCard}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduField}>{edu.fieldOfStudy}</Text>
                  <Text style={styles.eduInstitution}>{edu.institution}</Text>
                  <Text style={styles.eduMeta}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'PRESENT' : formatDate(edu.endDate || '')}
                    {edu.grade ? ` | GPA: ${edu.grade}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionNumber}>06</Text>
              <Text style={styles.sectionTitle}>Languages</Text>
              <Text style={styles.dimensionLabel}>COMM</Text>
            </View>
            <View style={styles.langGrid}>
              {languages.map((lang) => (
                <View key={lang.id} style={styles.langItem}>
                  <View style={styles.langIndicator} />
                  <Text style={styles.langName}>{lang.name}</Text>
                  {lang.proficiency && (
                    <Text style={styles.langLevel}>
                      [{lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()}]
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
              <Text style={styles.sectionNumber}>07</Text>
              <Text style={styles.sectionTitle}>Certifications</Text>
              <Text style={styles.dimensionLabel}>VERIFIED</Text>
            </View>
            <View style={styles.certGrid}>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certBadge}>
                  <Text style={styles.certIcon}>[*]</Text>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                  <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            DWG: {personalInfo.firstName?.toUpperCase()}-{personalInfo.lastName?.toUpperCase()}-CV
          </Text>
          <Text style={styles.footerText}>SCALE: 1:1</Text>
          <Text style={styles.footerText}>
            DATE: {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
        </View>
      </Page>
    </Document>
  )
}
