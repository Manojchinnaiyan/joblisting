import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Magazine-style template with editorial/publication feel
// Features: Masthead header, 2-column layout, pull quotes, drop caps, stylish typography
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 30,
      paddingHorizontal: 0,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#1a1a1a',
      backgroundColor: '#fefefe',
    },
    // Magazine Masthead Header
    masthead: {
      paddingTop: 40,
      paddingBottom: 25,
      paddingHorizontal: 40,
      borderBottomWidth: 4,
      borderBottomColor: accentColor,
      marginBottom: 20,
    },
    mastheadInner: {
      alignItems: 'center',
    },
    nameText: {
      fontSize: 42,
      fontFamily: 'Times-Bold',
      color: '#000000',
      letterSpacing: 6,
      textTransform: 'uppercase',
      marginBottom: 4,
      textAlign: 'center',
    },
    mastheadDivider: {
      width: 60,
      height: 2,
      backgroundColor: accentColor,
      marginVertical: 10,
    },
    headline: {
      fontSize: 14,
      fontFamily: 'Times-Italic',
      color: '#4a4a4a',
      letterSpacing: 2,
      textAlign: 'center',
      marginBottom: 12,
    },
    contactBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 20,
      marginTop: 8,
    },
    contactItem: {
      fontSize: 9,
      color: '#555555',
      fontFamily: 'Helvetica',
    },
    contactSeparator: {
      fontSize: 9,
      color: accentColor,
    },
    linksRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 20,
      marginTop: 8,
    },
    link: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
      fontFamily: 'Helvetica-Bold',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Main Content Area
    mainContent: {
      paddingHorizontal: 40,
    },
    // Summary Section with Drop Cap
    summarySection: {
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e0e0e0',
    },
    summaryContainer: {
      flexDirection: 'row',
    },
    dropCap: {
      fontSize: 48,
      fontFamily: 'Times-Bold',
      color: accentColor,
      lineHeight: 1,
      marginRight: 6,
      marginTop: -4,
    },
    summaryTextContainer: {
      flex: 1,
    },
    summaryText: {
      fontSize: 11,
      lineHeight: 1.7,
      color: '#333333',
      fontFamily: 'Times-Roman',
      textAlign: 'justify',
    },
    // Two Column Layout
    columnsContainer: {
      flexDirection: 'row',
      gap: 25,
    },
    leftColumn: {
      flex: 1.2,
    },
    rightColumn: {
      flex: 0.8,
    },
    columnDivider: {
      width: 1,
      backgroundColor: '#e0e0e0',
    },
    // Section Styling
    section: {
      marginBottom: 18,
    },
    sectionHeader: {
      marginBottom: 10,
      borderBottomWidth: 2,
      borderBottomColor: '#1a1a1a',
      paddingBottom: 4,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Times-Bold',
      color: '#1a1a1a',
      textTransform: 'uppercase',
      letterSpacing: 3,
    },
    // Pull Quote Box
    pullQuote: {
      backgroundColor: '#f8f8f8',
      borderLeftWidth: 4,
      borderLeftColor: accentColor,
      paddingVertical: 12,
      paddingHorizontal: 15,
      marginVertical: 12,
    },
    pullQuoteText: {
      fontSize: 11,
      fontFamily: 'Times-Italic',
      color: '#333333',
      lineHeight: 1.6,
    },
    pullQuoteAuthor: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      marginTop: 6,
      textAlign: 'right',
    },
    // Experience Items
    experienceItem: {
      marginBottom: 14,
    },
    expHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 3,
    },
    expTitle: {
      fontSize: 11,
      fontFamily: 'Times-Bold',
      color: '#1a1a1a',
      flex: 1,
    },
    expDates: {
      fontSize: 9,
      fontFamily: 'Helvetica-Oblique',
      color: accentColor,
    },
    expCompany: {
      fontSize: 10,
      fontFamily: 'Times-Italic',
      color: '#555555',
      marginBottom: 4,
    },
    expDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#444444',
      fontFamily: 'Helvetica',
    },
    bulletList: {
      marginTop: 4,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#444444',
      fontFamily: 'Helvetica',
      marginBottom: 2,
    },
    // Education Items
    educationItem: {
      marginBottom: 10,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Times-Bold',
      color: '#1a1a1a',
    },
    eduField: {
      fontSize: 9,
      fontFamily: 'Times-Italic',
      color: '#555555',
    },
    eduInstitution: {
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#666666',
      marginTop: 2,
    },
    eduDates: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: accentColor,
      marginTop: 2,
    },
    eduGrade: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: '#555555',
    },
    // Skills - Editorial Tag Style
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: '#ffffff',
      backgroundColor: accentColor,
      paddingVertical: 3,
      paddingHorizontal: 8,
    },
    skillTagAlt: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: accentColor,
      backgroundColor: '#f0f0f0',
      paddingVertical: 3,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: accentColor,
    },
    // Languages
    languageItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 4,
      paddingBottom: 4,
      borderBottomWidth: 1,
      borderBottomColor: '#f0f0f0',
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#333333',
    },
    languageLevel: {
      fontSize: 8,
      fontFamily: 'Helvetica-Oblique',
      color: '#666666',
    },
    // Certifications
    certItem: {
      marginBottom: 8,
      paddingLeft: 10,
      borderLeftWidth: 2,
      borderLeftColor: accentColor,
    },
    certName: {
      fontSize: 9,
      fontFamily: 'Times-Bold',
      color: '#1a1a1a',
    },
    certDetails: {
      fontSize: 8,
      fontFamily: 'Helvetica',
      color: '#666666',
      marginTop: 1,
    },
    // Projects - Feature Article Style
    projectItem: {
      marginBottom: 12,
      padding: 10,
      backgroundColor: '#fafafa',
      borderWidth: 1,
      borderColor: '#e8e8e8',
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Times-Bold',
      color: '#1a1a1a',
      marginBottom: 4,
    },
    projectDesc: {
      fontSize: 8,
      lineHeight: 1.5,
      color: '#444444',
      fontFamily: 'Helvetica',
    },
    projectTech: {
      fontSize: 8,
      fontFamily: 'Helvetica-Oblique',
      color: accentColor,
      marginTop: 6,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 6,
    },
    projectLink: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      textDecoration: 'underline',
    },
    // Highlighted Text Box
    highlightBox: {
      backgroundColor: accentColor,
      padding: 12,
      marginVertical: 10,
    },
    highlightText: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      textAlign: 'center',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Footer accent
    footerAccent: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: accentColor,
    },
  })

interface MagazineTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function MagazineTemplate({ data, settings }: MagazineTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Get first letter and rest of summary for drop cap effect
  const getDropCapParts = (text: string) => {
    if (!text) return { firstLetter: '', rest: '' }
    const cleanText = text.replace(/<[^>]*>/g, '').trim()
    return {
      firstLetter: cleanText.charAt(0).toUpperCase(),
      rest: cleanText.slice(1),
    }
  }

  const summaryParts = getDropCapParts(personalInfo.summary || '')

  // Get a featured achievement for pull quote (first experience with achievements)
  const featuredAchievement = experience.find((exp) => exp.achievements && exp.achievements.length > 0)?.achievements?.[0]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Magazine Masthead Header */}
        <View style={styles.masthead}>
          <View style={styles.mastheadInner}>
            <Text style={styles.nameText}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            <View style={styles.mastheadDivider} />
            {personalInfo.headline && (
              <Text style={styles.headline}>{personalInfo.headline}</Text>
            )}
            <View style={styles.contactBar}>
              {personalInfo.email && (
                <Text style={styles.contactItem}>{personalInfo.email}</Text>
              )}
              {personalInfo.phone && (
                <Text style={styles.contactItem}>{personalInfo.phone}</Text>
              )}
              {personalInfo.location && (
                <Text style={styles.contactItem}>{personalInfo.location}</Text>
              )}
            </View>
            {(personalInfo.linkedinUrl || personalInfo.githubUrl || personalInfo.portfolioUrl) && (
              <View style={styles.linksRow}>
                {personalInfo.linkedinUrl && (
                  <Link src={personalInfo.linkedinUrl} style={styles.link}>LinkedIn</Link>
                )}
                {personalInfo.githubUrl && (
                  <Link src={personalInfo.githubUrl} style={styles.link}>GitHub</Link>
                )}
                {personalInfo.portfolioUrl && (
                  <Link src={personalInfo.portfolioUrl} style={styles.link}>Portfolio</Link>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Summary with Drop Cap */}
          {personalInfo.summary && (
            <View style={styles.summarySection}>
              <View style={styles.summaryContainer}>
                <Text style={styles.dropCap}>{summaryParts.firstLetter}</Text>
                <View style={styles.summaryTextContainer}>
                  <Text style={styles.summaryText}>{summaryParts.rest}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Two Column Layout */}
          <View style={styles.columnsContainer}>
            {/* Left Column - Main Content */}
            <View style={styles.leftColumn}>
              {/* Experience */}
              {experience.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Experience</Text>
                  </View>
                  {experience.map((exp, index) => (
                    <View key={exp.id}>
                      <View style={styles.experienceItem}>
                        <View style={styles.expHeader}>
                          <Text style={styles.expTitle}>{exp.title}</Text>
                          <Text style={styles.expDates}>
                            {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                          </Text>
                        </View>
                        <Text style={styles.expCompany}>
                          {exp.companyName}{exp.location ? `, ${exp.location}` : ''}
                        </Text>
                        {exp.description && (
                          <RichTextRenderer text={exp.description} style={styles.expDescription} />
                        )}
                        {exp.achievements && exp.achievements.length > 0 && (
                          <View style={styles.bulletList}>
                            {exp.achievements.map((achievement, idx) => (
                              <Text key={idx} style={styles.bulletItem}>• {achievement}</Text>
                            ))}
                          </View>
                        )}
                      </View>
                      {/* Insert Pull Quote after first experience if available */}
                      {index === 0 && featuredAchievement && (
                        <View style={styles.pullQuote}>
                          <Text style={styles.pullQuoteText}>{`"${featuredAchievement}"`}</Text>
                          <Text style={styles.pullQuoteAuthor}>— Key Achievement</Text>
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
                    <Text style={styles.sectionTitle}>Featured Projects</Text>
                  </View>
                  {projects.map((project) => (
                    <View key={project.id} style={styles.projectItem}>
                      <Text style={styles.projectTitle}>{project.title}</Text>
                      <RichTextRenderer text={project.description} style={styles.projectDesc} />
                      {project.technologies && project.technologies.length > 0 && (
                        <Text style={styles.projectTech}>
                          Built with: {project.technologies.join(' • ')}
                        </Text>
                      )}
                      {(project.projectUrl || project.sourceCodeUrl) && (
                        <View style={styles.projectLinks}>
                          {project.projectUrl && (
                            <Link src={project.projectUrl} style={styles.projectLink}>View Project</Link>
                          )}
                          {project.sourceCodeUrl && (
                            <Link src={project.sourceCodeUrl} style={styles.projectLink}>Source Code</Link>
                          )}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Right Column - Sidebar Content */}
            <View style={styles.rightColumn}>
              {/* Skills Highlight Box */}
              {skills.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.highlightBox}>
                    <Text style={styles.highlightText}>Core Expertise</Text>
                  </View>
                  <View style={styles.skillsContainer}>
                    {skills.map((skill, index) => (
                      <Text
                        key={skill.id}
                        style={index % 2 === 0 ? styles.skillTag : styles.skillTagAlt}
                      >
                        {skill.name}
                      </Text>
                    ))}
                  </View>
                </View>
              )}

              {/* Education */}
              {education.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Education</Text>
                  </View>
                  {education.map((edu) => (
                    <View key={edu.id} style={styles.educationItem}>
                      <Text style={styles.eduDegree}>{edu.degree}</Text>
                      <Text style={styles.eduField}>{edu.fieldOfStudy}</Text>
                      <Text style={styles.eduInstitution}>{edu.institution}</Text>
                      <Text style={styles.eduDates}>
                        {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                      </Text>
                      {edu.grade && <Text style={styles.eduGrade}>GPA: {edu.grade}</Text>}
                    </View>
                  ))}
                </View>
              )}

              {/* Languages */}
              {languages && languages.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Languages</Text>
                  </View>
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
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Credentials</Text>
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
            </View>
          </View>
        </View>

        {/* Footer Accent Line */}
        <View style={styles.footerAccent} />
      </Page>
    </Document>
  )
}
