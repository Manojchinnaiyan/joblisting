import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Artistic template - Designer/artist portfolio feel with creative asymmetric layout
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 40,
      paddingHorizontal: 0,
      fontSize: 9,
      fontFamily: 'Helvetica',
      color: '#2d2d2d',
      backgroundColor: '#fafafa',
    },
    // Bold artistic header with diagonal accent
    headerContainer: {
      position: 'relative',
      marginBottom: 25,
    },
    headerAccentBar: {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '45%',
      height: 120,
      backgroundColor: accentColor,
    },
    headerContent: {
      paddingTop: 30,
      paddingLeft: 35,
      paddingRight: 40,
    },
    nameContainer: {
      marginBottom: 8,
    },
    firstName: {
      fontSize: 36,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    lastName: {
      fontSize: 36,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      letterSpacing: 2,
      textTransform: 'uppercase',
      marginLeft: 120,
    },
    headline: {
      fontSize: 11,
      color: '#ffffff',
      letterSpacing: 3,
      textTransform: 'uppercase',
      marginTop: 4,
      marginBottom: 15,
    },
    // Contact info in artistic arrangement
    contactContainer: {
      flexDirection: 'row',
      marginTop: 30,
      paddingLeft: 35,
    },
    contactColumn: {
      marginRight: 40,
    },
    contactLabel: {
      fontSize: 7,
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: 2,
    },
    contactValue: {
      fontSize: 9,
      color: '#4a4a4a',
      marginBottom: 8,
    },
    contactLink: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
      marginBottom: 8,
    },
    // Main content with staggered indentation
    mainContent: {
      paddingHorizontal: 35,
      marginTop: 10,
    },
    // Section with varying indentation for artistic feel
    sectionOdd: {
      marginBottom: 22,
      marginLeft: 0,
    },
    sectionEven: {
      marginBottom: 22,
      marginLeft: 45,
    },
    sectionDeep: {
      marginBottom: 22,
      marginLeft: 90,
    },
    sectionTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    sectionTitleLine: {
      width: 35,
      height: 2,
      backgroundColor: accentColor,
      marginRight: 10,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
      textTransform: 'uppercase',
      letterSpacing: 3,
    },
    // Summary with large quote style
    summaryContainer: {
      paddingLeft: 20,
      borderLeftWidth: 3,
      borderLeftColor: accentColor,
    },
    summaryText: {
      fontSize: 10,
      lineHeight: 1.7,
      color: '#3d3d3d',
      fontStyle: 'italic',
    },
    // Experience cards with creative offset
    experienceItem: {
      marginBottom: 18,
      position: 'relative',
    },
    experienceAccent: {
      position: 'absolute',
      left: -15,
      top: 0,
      width: 6,
      height: 6,
      backgroundColor: accentColor,
      borderRadius: 3,
    },
    experienceHeader: {
      marginBottom: 6,
    },
    experienceTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    experienceCompany: {
      fontSize: 10,
      color: accentColor,
      marginTop: 2,
    },
    experienceMeta: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 3,
    },
    experienceDate: {
      fontSize: 8,
      color: '#7a7a7a',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    experienceLocation: {
      fontSize: 8,
      color: '#9a9a9a',
    },
    experienceDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4a4a4a',
      marginTop: 6,
    },
    bulletList: {
      marginTop: 6,
      paddingLeft: 10,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4a4a4a',
      marginBottom: 3,
    },
    // Education with minimalist style
    educationItem: {
      marginBottom: 14,
      paddingBottom: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#e8e8e8',
    },
    educationDegree: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    educationInstitution: {
      fontSize: 9,
      color: '#5a5a5a',
      marginTop: 2,
    },
    educationDetails: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 4,
    },
    educationDate: {
      fontSize: 8,
      color: accentColor,
    },
    educationGrade: {
      fontSize: 8,
      color: '#7a7a7a',
    },
    // Skills as artistic tags
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
    },
    skillTag: {
      paddingVertical: 5,
      paddingHorizontal: 12,
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: accentColor,
    },
    skillTagText: {
      fontSize: 8,
      color: '#3d3d3d',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    // Languages with visual proficiency
    languageRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#2d2d2d',
      width: 90,
    },
    languageProficiency: {
      fontSize: 8,
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Certifications with badge style
    certItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    certBadge: {
      width: 8,
      height: 8,
      backgroundColor: accentColor,
      marginRight: 10,
      marginTop: 3,
    },
    certContent: {
      flex: 1,
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    certDetails: {
      fontSize: 8,
      color: '#6a6a6a',
      marginTop: 2,
    },
    // Projects as portfolio cards
    projectCard: {
      marginBottom: 16,
      padding: 14,
      backgroundColor: '#ffffff',
      borderLeftWidth: 4,
      borderLeftColor: accentColor,
    },
    projectTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1a1a1a',
    },
    projectDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4a4a4a',
      marginTop: 6,
    },
    projectTech: {
      fontSize: 7,
      color: accentColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: 8,
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 15,
      marginTop: 8,
    },
    projectLink: {
      fontSize: 8,
      color: accentColor,
      textDecoration: 'underline',
    },
    // Footer accent
    footerAccent: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 100,
      height: 4,
      backgroundColor: accentColor,
    },
  })

interface ArtisticTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function ArtisticTemplate({ data, settings }: ArtisticTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Get section style based on index for staggered effect
  const getSectionStyle = (index: number) => {
    const pattern = index % 3
    if (pattern === 0) return styles.sectionOdd
    if (pattern === 1) return styles.sectionEven
    return styles.sectionDeep
  }

  let sectionIndex = 0

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Artistic Header */}
        <View style={styles.headerContainer}>
          <View style={styles.headerAccentBar} />
          <View style={styles.headerContent}>
            <View style={styles.nameContainer}>
              <Text style={styles.firstName}>{personalInfo.firstName}</Text>
              <Text style={styles.lastName}>{personalInfo.lastName}</Text>
            </View>
            {personalInfo.headline && (
              <Text style={styles.headline}>{personalInfo.headline}</Text>
            )}
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.contactContainer}>
          {(personalInfo.email || personalInfo.phone) && (
            <View style={styles.contactColumn}>
              {personalInfo.email && (
                <>
                  <Text style={styles.contactLabel}>Email</Text>
                  <Text style={styles.contactValue}>{personalInfo.email}</Text>
                </>
              )}
              {personalInfo.phone && (
                <>
                  <Text style={styles.contactLabel}>Phone</Text>
                  <Text style={styles.contactValue}>{personalInfo.phone}</Text>
                </>
              )}
            </View>
          )}
          {(personalInfo.location || personalInfo.linkedinUrl) && (
            <View style={styles.contactColumn}>
              {personalInfo.location && (
                <>
                  <Text style={styles.contactLabel}>Location</Text>
                  <Text style={styles.contactValue}>{personalInfo.location}</Text>
                </>
              )}
              {personalInfo.linkedinUrl && (
                <>
                  <Text style={styles.contactLabel}>LinkedIn</Text>
                  <Link src={personalInfo.linkedinUrl} style={styles.contactLink}>
                    View Profile
                  </Link>
                </>
              )}
            </View>
          )}
          {(personalInfo.githubUrl || personalInfo.portfolioUrl) && (
            <View style={styles.contactColumn}>
              {personalInfo.portfolioUrl && (
                <>
                  <Text style={styles.contactLabel}>Portfolio</Text>
                  <Link src={personalInfo.portfolioUrl} style={styles.contactLink}>
                    View Work
                  </Link>
                </>
              )}
              {personalInfo.githubUrl && (
                <>
                  <Text style={styles.contactLabel}>GitHub</Text>
                  <Link src={personalInfo.githubUrl} style={styles.contactLink}>
                    View Code
                  </Link>
                </>
              )}
            </View>
          )}
        </View>

        <View style={styles.mainContent}>
          {/* Summary */}
          {personalInfo.summary && (
            <View style={getSectionStyle(sectionIndex++)}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleLine} />
                <Text style={styles.sectionTitle}>Profile</Text>
              </View>
              <View style={styles.summaryContainer}>
                <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
              </View>
            </View>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <View style={getSectionStyle(sectionIndex++)}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleLine} />
                <Text style={styles.sectionTitle}>Experience</Text>
              </View>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.experienceItem}>
                  <View style={styles.experienceAccent} />
                  <View style={styles.experienceHeader}>
                    <Text style={styles.experienceTitle}>{exp.title}</Text>
                    <Text style={styles.experienceCompany}>{exp.companyName}</Text>
                    <View style={styles.experienceMeta}>
                      <Text style={styles.experienceDate}>
                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                      </Text>
                      {exp.location && (
                        <Text style={styles.experienceLocation}>{exp.location}</Text>
                      )}
                    </View>
                  </View>
                  {exp.description && (
                    <RichTextRenderer text={exp.description} style={styles.experienceDescription} />
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.bulletList}>
                      {exp.achievements.map((achievement, idx) => (
                        <Text key={idx} style={styles.bulletItem}>+ {achievement}</Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Projects - Featured before education for portfolio feel */}
          {projects.length > 0 && (
            <View style={getSectionStyle(sectionIndex++)}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleLine} />
                <Text style={styles.sectionTitle}>Featured Work</Text>
              </View>
              {projects.map((project) => (
                <View key={project.id} style={styles.projectCard}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <RichTextRenderer text={project.description} style={styles.projectDescription} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.projectTech}>
                      Built with: {project.technologies.join(' / ')}
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

          {/* Skills */}
          {skills.length > 0 && (
            <View style={getSectionStyle(sectionIndex++)}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleLine} />
                <Text style={styles.sectionTitle}>Expertise</Text>
              </View>
              <View style={styles.skillsContainer}>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.skillTag}>
                    <Text style={styles.skillTagText}>{skill.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Education */}
          {education.length > 0 && (
            <View style={getSectionStyle(sectionIndex++)}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleLine} />
                <Text style={styles.sectionTitle}>Education</Text>
              </View>
              {education.map((edu, index) => (
                <View
                  key={edu.id}
                  style={[
                    styles.educationItem,
                    index === education.length - 1 ? { borderBottomWidth: 0 } : {}
                  ]}
                >
                  <Text style={styles.educationDegree}>
                    {edu.degree} in {edu.fieldOfStudy}
                  </Text>
                  <Text style={styles.educationInstitution}>{edu.institution}</Text>
                  <View style={styles.educationDetails}>
                    <Text style={styles.educationDate}>
                      {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                    </Text>
                    {edu.grade && (
                      <Text style={styles.educationGrade}>GPA: {edu.grade}</Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <View style={getSectionStyle(sectionIndex++)}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleLine} />
                <Text style={styles.sectionTitle}>Languages</Text>
              </View>
              {languages.map((lang) => (
                <View key={lang.id} style={styles.languageRow}>
                  <Text style={styles.languageName}>{lang.name}</Text>
                  {lang.proficiency && (
                    <Text style={styles.languageProficiency}>
                      {lang.proficiency.charAt(0) + lang.proficiency.slice(1).toLowerCase()}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <View style={getSectionStyle(sectionIndex++)}>
              <View style={styles.sectionTitleContainer}>
                <View style={styles.sectionTitleLine} />
                <Text style={styles.sectionTitle}>Certifications</Text>
              </View>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <View style={styles.certBadge} />
                  <View style={styles.certContent}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certDetails}>
                      {cert.issuingOrganization} | {formatDate(cert.issueDate)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Footer Accent */}
        <View style={styles.footerAccent} />
      </Page>
    </Document>
  )
}
