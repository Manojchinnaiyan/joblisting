import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Elegant template - Refined typography with sophisticated, upscale feel
// Features: Small caps headers, thin line dividers, script-like name styling, generous whitespace
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 60,
      paddingBottom: 60,
      paddingHorizontal: 55,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#2c2c2c',
      backgroundColor: '#ffffff',
    },
    // Header - Elegant name styling
    header: {
      marginBottom: 35,
      textAlign: 'center',
    },
    name: {
      fontSize: 32,
      fontFamily: 'Helvetica',
      fontWeight: 300,
      color: '#1a1a1a',
      letterSpacing: 6,
      marginBottom: 8,
      textTransform: 'uppercase',
    },
    headline: {
      fontSize: 11,
      color: '#666666',
      letterSpacing: 4,
      textTransform: 'uppercase',
      marginBottom: 20,
    },
    // Thin elegant divider under name
    headerDivider: {
      width: 80,
      height: 0.5,
      backgroundColor: '#cccccc',
      marginHorizontal: 'auto',
      marginBottom: 18,
    },
    contactRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 24,
    },
    contactItem: {
      fontSize: 9,
      color: '#555555',
      letterSpacing: 0.5,
    },
    contactSeparator: {
      fontSize: 9,
      color: '#cccccc',
    },
    linkRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 28,
      marginTop: 12,
    },
    link: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
      letterSpacing: 0.5,
    },
    // Section styling with small caps
    section: {
      marginBottom: 28,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 14,
    },
    sectionLine: {
      flex: 1,
      height: 0.5,
      backgroundColor: '#e0e0e0',
    },
    sectionTitle: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#444444',
      textTransform: 'uppercase',
      letterSpacing: 3,
      paddingHorizontal: 16,
    },
    // Summary with elegant typography
    summaryText: {
      fontSize: 10,
      lineHeight: 1.8,
      color: '#444444',
      textAlign: 'center',
      paddingHorizontal: 30,
      fontStyle: 'italic',
    },
    // Experience items
    itemContainer: {
      marginBottom: 22,
    },
    itemHeader: {
      marginBottom: 6,
    },
    itemTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 3,
    },
    itemTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      letterSpacing: 0.5,
    },
    itemDates: {
      fontSize: 9,
      color: '#777777',
      letterSpacing: 0.5,
    },
    itemSubtitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
    },
    itemCompany: {
      fontSize: 10,
      color: '#555555',
      fontStyle: 'italic',
    },
    itemLocation: {
      fontSize: 9,
      color: '#888888',
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.7,
      color: '#444444',
      marginTop: 8,
    },
    bulletList: {
      marginTop: 8,
      marginLeft: 4,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.7,
      color: '#444444',
      marginBottom: 4,
      paddingLeft: 12,
    },
    // Education
    eduItem: {
      marginBottom: 16,
    },
    eduTitleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'baseline',
      marginBottom: 2,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      letterSpacing: 0.3,
    },
    eduDates: {
      fontSize: 9,
      color: '#777777',
    },
    eduInstitution: {
      fontSize: 10,
      color: '#555555',
      fontStyle: 'italic',
    },
    eduDetails: {
      fontSize: 9,
      color: '#666666',
      marginTop: 3,
    },
    // Skills - elegant inline display
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 20,
    },
    skillItem: {
      fontSize: 9,
      color: '#555555',
      letterSpacing: 0.5,
      paddingVertical: 3,
      paddingHorizontal: 10,
    },
    skillSeparator: {
      fontSize: 9,
      color: '#cccccc',
      paddingVertical: 3,
    },
    // Languages
    languagesContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: 20,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 6,
    },
    languageName: {
      fontSize: 9,
      color: '#444444',
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 0.3,
    },
    languageLevel: {
      fontSize: 8,
      color: '#777777',
      fontStyle: 'italic',
    },
    // Certifications
    certItem: {
      marginBottom: 12,
      textAlign: 'center',
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      letterSpacing: 0.3,
    },
    certDetails: {
      fontSize: 9,
      color: '#666666',
      marginTop: 2,
    },
    // Projects
    projectItem: {
      marginBottom: 18,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      letterSpacing: 0.3,
      marginBottom: 4,
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.7,
      color: '#444444',
    },
    techLine: {
      fontSize: 8,
      color: '#777777',
      marginTop: 6,
      fontStyle: 'italic',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 6,
      justifyContent: 'flex-start',
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'none',
    },
    // Thin divider between sections
    thinDivider: {
      width: '100%',
      height: 0.5,
      backgroundColor: '#e8e8e8',
      marginVertical: 20,
    },
  })

interface ElegantTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function ElegantTemplate({ data, settings }: ElegantTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  const formatProficiency = (proficiency: string) => {
    return proficiency.charAt(0) + proficiency.slice(1).toLowerCase().replace('_', ' ')
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header - Elegant name styling */}
        <View style={styles.header}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          <View style={styles.headerDivider} />
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.contactRow}>
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
            <View style={styles.linkRow}>
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

        {/* Summary - Centered elegant text */}
        {personalInfo.summary && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>Profile</Text>
              <View style={styles.sectionLine} />
            </View>
            <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
          </View>
        )}

        {/* Experience */}
        {experience.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>Experience</Text>
              <View style={styles.sectionLine} />
            </View>
            {experience.map((exp) => (
              <View key={exp.id} style={styles.itemContainer}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemTitle}>{exp.title}</Text>
                    <Text style={styles.itemDates}>
                      {formatDate(exp.startDate)} — {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                    </Text>
                  </View>
                  <View style={styles.itemSubtitleRow}>
                    <Text style={styles.itemCompany}>{exp.companyName}</Text>
                    {exp.location && <Text style={styles.itemLocation}>{exp.location}</Text>}
                  </View>
                </View>
                {exp.description && (
                  <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                )}
                {exp.achievements && exp.achievements.length > 0 && (
                  <View style={styles.bulletList}>
                    {exp.achievements.map((achievement, idx) => (
                      <Text key={idx} style={styles.bulletItem}>— {achievement}</Text>
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
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>Education</Text>
              <View style={styles.sectionLine} />
            </View>
            {education.map((edu) => (
              <View key={edu.id} style={styles.eduItem}>
                <View style={styles.eduTitleRow}>
                  <Text style={styles.eduDegree}>{edu.degree} in {edu.fieldOfStudy}</Text>
                  <Text style={styles.eduDates}>
                    {formatDate(edu.startDate)} — {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                  </Text>
                </View>
                <Text style={styles.eduInstitution}>{edu.institution}</Text>
                {edu.grade && <Text style={styles.eduDetails}>GPA: {edu.grade}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Skills - Elegant inline display */}
        {skills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>Expertise</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.skillsContainer}>
              {skills.map((skill, index) => (
                <View key={skill.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.skillItem}>{skill.name}</Text>
                  {index < skills.length - 1 && (
                    <Text style={styles.skillSeparator}>·</Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Languages */}
        {languages && languages.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>Languages</Text>
              <View style={styles.sectionLine} />
            </View>
            <View style={styles.languagesContainer}>
              {languages.map((lang) => (
                <View key={lang.id} style={styles.languageItem}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {lang.proficiency && (
                    <Text style={styles.languageLevel}>({formatProficiency(lang.proficiency)})</Text>
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
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>Certifications</Text>
              <View style={styles.sectionLine} />
            </View>
            {certifications.map((cert) => (
              <View key={cert.id} style={styles.certItem}>
                <Text style={styles.certName}>{cert.name}</Text>
                <Text style={styles.certDetails}>
                  {cert.issuingOrganization} — {formatDate(cert.issueDate)}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionLine} />
              <Text style={styles.sectionTitle}>Selected Projects</Text>
              <View style={styles.sectionLine} />
            </View>
            {projects.map((project) => (
              <View key={project.id} style={styles.projectItem}>
                <Text style={styles.projectTitle}>{project.title}</Text>
                <RichTextRenderer text={project.description} style={styles.projectDesc} />
                {project.technologies && project.technologies.length > 0 && (
                  <Text style={styles.techLine}>
                    Technologies: {project.technologies.join(', ')}
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
      </Page>
    </Document>
  )
}
