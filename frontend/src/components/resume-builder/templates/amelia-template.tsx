import { Document, Page, Text, View, StyleSheet, Link, Svg, Path, Circle } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Amelia Miller template - Two-column with left sidebar (30%), main content (70%)
// Professional design with achievement icons, contact info in sidebar, ATS-friendly
const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      flexDirection: 'row',
      fontSize: 9,
      fontFamily: 'Helvetica',
      backgroundColor: '#ffffff',
    },
    // Left Sidebar (30%)
    sidebar: {
      width: '30%',
      backgroundColor: primaryColor,
      padding: 20,
      paddingTop: 30,
      color: '#ffffff',
    },
    // Main Content (70%)
    main: {
      width: '70%',
      padding: 30,
      paddingLeft: 25,
      backgroundColor: '#ffffff',
      color: '#1f2937',
    },
    // Sidebar Name Section
    nameSection: {
      marginBottom: 25,
      paddingBottom: 15,
      borderBottomWidth: 2,
      borderBottomColor: 'rgba(255, 255, 255, 0.3)',
    },
    sidebarName: {
      fontSize: 18,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 4,
      lineHeight: 1.2,
    },
    sidebarHeadline: {
      fontSize: 9,
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: 1.3,
      letterSpacing: 0.3,
    },
    // Sidebar Section Styles
    sidebarSection: {
      marginBottom: 18,
    },
    sidebarSectionTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    // Contact Styles
    contactItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    contactIcon: {
      width: 14,
      height: 14,
      marginRight: 8,
      marginTop: 1,
    },
    contactText: {
      fontSize: 8,
      color: 'rgba(255, 255, 255, 0.95)',
      flex: 1,
      lineHeight: 1.4,
    },
    contactLink: {
      fontSize: 8,
      color: '#ffffff',
      textDecoration: 'none',
      flex: 1,
      lineHeight: 1.4,
    },
    // Achievement Badge Styles
    achievementItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      padding: 8,
      borderRadius: 4,
    },
    achievementBadge: {
      width: 20,
      height: 20,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    achievementText: {
      fontSize: 8,
      color: '#ffffff',
      flex: 1,
      lineHeight: 1.4,
    },
    // Skills Styles
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
    },
    skillPill: {
      fontSize: 7,
      color: primaryColor,
      backgroundColor: '#ffffff',
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 10,
      marginBottom: 4,
      marginRight: 4,
    },
    // Languages Styles
    languageItem: {
      marginBottom: 8,
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
    },
    languageLevel: {
      fontSize: 8,
      color: 'rgba(255, 255, 255, 0.8)',
      marginTop: 2,
    },
    // Certifications Styles
    certItem: {
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    },
    certName: {
      fontSize: 8,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      lineHeight: 1.3,
    },
    certOrg: {
      fontSize: 7,
      color: 'rgba(255, 255, 255, 0.85)',
      marginTop: 2,
    },
    certDate: {
      fontSize: 7,
      color: 'rgba(255, 255, 255, 0.7)',
      marginTop: 1,
    },
    // Main Content Header
    mainHeader: {
      marginBottom: 20,
    },
    mainName: {
      fontSize: 26,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      marginBottom: 4,
    },
    mainHeadline: {
      fontSize: 12,
      color: primaryColor,
      marginBottom: 12,
      letterSpacing: 0.5,
    },
    summarySection: {
      marginBottom: 20,
      paddingBottom: 15,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    summaryText: {
      fontSize: 9,
      lineHeight: 1.6,
      color: '#4b5563',
    },
    // Main Section Styles
    mainSection: {
      marginBottom: 18,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: primaryColor,
      marginBottom: 12,
      paddingBottom: 6,
      borderBottomWidth: 2,
      borderBottomColor: primaryColor,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    // Experience Item Styles
    experienceItem: {
      marginBottom: 14,
    },
    experienceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 3,
    },
    experienceTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
      flex: 1,
    },
    experienceDates: {
      fontSize: 8,
      color: primaryColor,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'right',
    },
    experienceCompany: {
      fontSize: 9,
      color: '#6b7280',
      marginBottom: 4,
    },
    experienceDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
      marginTop: 4,
    },
    achievementsList: {
      marginTop: 6,
    },
    achievementBullet: {
      flexDirection: 'row',
      marginBottom: 3,
    },
    bulletPoint: {
      fontSize: 9,
      color: primaryColor,
      marginRight: 6,
      fontFamily: 'Helvetica-Bold',
    },
    bulletText: {
      fontSize: 9,
      color: '#4b5563',
      flex: 1,
      lineHeight: 1.4,
    },
    // Education Styles
    educationItem: {
      marginBottom: 12,
    },
    eduDegree: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    eduField: {
      fontSize: 9,
      color: '#374151',
      marginTop: 1,
    },
    eduInstitution: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 2,
    },
    eduDate: {
      fontSize: 8,
      color: primaryColor,
      marginTop: 2,
    },
    eduGrade: {
      fontSize: 8,
      color: '#4b5563',
      marginTop: 2,
    },
    // Projects Styles
    projectItem: {
      marginBottom: 12,
    },
    projectTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#111827',
    },
    projectDesc: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginTop: 3,
    },
    projectTech: {
      fontSize: 8,
      color: primaryColor,
      marginTop: 4,
      fontStyle: 'italic',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 4,
    },
    projectLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'underline',
    },
  })

// Icon Components for Contact and Achievements
const EmailIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24">
    <Path
      d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="2" fill="none" />
  </Svg>
)

const PhoneIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24">
    <Path
      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
)

const LocationIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2" fill="none" />
  </Svg>
)

const LinkIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width="12" height="12" viewBox="0 0 24 24">
    <Path
      d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
)

const StarIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24">
    <Path
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      fill={color}
    />
  </Svg>
)

const TrophyIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24">
    <Path
      d="M6 9H4a2 2 0 01-2-2V4a2 2 0 012-2h2M18 9h2a2 2 0 002-2V4a2 2 0 00-2-2h-2M9 22h6M12 17v5"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
    <Path
      d="M6 2h12v7a6 6 0 01-12 0V2z"
      stroke={color}
      strokeWidth="2"
      fill="none"
    />
  </Svg>
)

const CheckIcon = ({ color = '#ffffff' }: { color?: string }) => (
  <Svg width="14" height="14" viewBox="0 0 24 24">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
    <Path d="M9 12l2 2 4-4" stroke={color} strokeWidth="2" fill="none" />
  </Svg>
)

interface AmeliaTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function AmeliaTemplate({ data, settings }: AmeliaTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Extract key achievements from experience for sidebar display
  const keyAchievements = experience
    .flatMap((exp) => exp.achievements || [])
    .slice(0, 3)

  // Icons for achievements rotation
  const achievementIcons = [StarIcon, TrophyIcon, CheckIcon]

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Left Sidebar */}
        <View style={styles.sidebar}>
          {/* Name Section */}
          <View style={styles.nameSection}>
            <Text style={styles.sidebarName}>
              {personalInfo.firstName}
            </Text>
            <Text style={styles.sidebarName}>
              {personalInfo.lastName}
            </Text>
            {personalInfo.headline && (
              <Text style={styles.sidebarHeadline}>{personalInfo.headline}</Text>
            )}
          </View>

          {/* Contact Section */}
          <View style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>Contact</Text>
            {personalInfo.email && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <EmailIcon />
                </View>
                <Text style={styles.contactText}>{personalInfo.email}</Text>
              </View>
            )}
            {personalInfo.phone && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <PhoneIcon />
                </View>
                <Text style={styles.contactText}>{personalInfo.phone}</Text>
              </View>
            )}
            {personalInfo.location && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <LocationIcon />
                </View>
                <Text style={styles.contactText}>{personalInfo.location}</Text>
              </View>
            )}
            {personalInfo.linkedinUrl && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <LinkIcon />
                </View>
                <Link src={personalInfo.linkedinUrl} style={styles.contactLink}>
                  LinkedIn
                </Link>
              </View>
            )}
            {personalInfo.githubUrl && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <LinkIcon />
                </View>
                <Link src={personalInfo.githubUrl} style={styles.contactLink}>
                  GitHub
                </Link>
              </View>
            )}
            {personalInfo.portfolioUrl && (
              <View style={styles.contactItem}>
                <View style={styles.contactIcon}>
                  <LinkIcon />
                </View>
                <Link src={personalInfo.portfolioUrl} style={styles.contactLink}>
                  Portfolio
                </Link>
              </View>
            )}
          </View>

          {/* Key Achievements Section (with badges/icons) */}
          {keyAchievements.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Key Achievements</Text>
              {keyAchievements.map((achievement, idx) => {
                const IconComponent = achievementIcons[idx % achievementIcons.length]
                return (
                  <View key={idx} style={styles.achievementItem}>
                    <View style={styles.achievementBadge}>
                      <IconComponent />
                    </View>
                    <Text style={styles.achievementText}>{achievement}</Text>
                  </View>
                )
              })}
            </View>
          )}

          {/* Skills Section */}
          {skills.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Skills</Text>
              <View style={styles.skillsContainer}>
                {skills.map((skill) => (
                  <Text key={skill.id} style={styles.skillPill}>
                    {skill.name}
                  </Text>
                ))}
              </View>
            </View>
          )}

          {/* Languages Section */}
          {languages && languages.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Languages</Text>
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

          {/* Certifications Section */}
          {certifications.length > 0 && (
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarSectionTitle}>Certifications</Text>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certOrg}>{cert.issuingOrganization}</Text>
                  <Text style={styles.certDate}>{formatDate(cert.issueDate)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Main Content Area */}
        <View style={styles.main}>
          {/* Header with Name (hidden if you want name only in sidebar) */}
          <View style={styles.mainHeader}>
            <Text style={styles.mainName}>
              {personalInfo.firstName} {personalInfo.lastName}
            </Text>
            {personalInfo.headline && (
              <Text style={styles.mainHeadline}>{personalInfo.headline}</Text>
            )}
          </View>

          {/* Summary Section */}
          {personalInfo.summary && (
            <View style={styles.summarySection}>
              <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
            </View>
          )}

          {/* Experience Section */}
          {experience.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.sectionTitle}>Experience</Text>
              {experience.map((exp) => (
                <View key={exp.id} style={styles.experienceItem}>
                  <View style={styles.experienceHeader}>
                    <Text style={styles.experienceTitle}>{exp.title}</Text>
                    <Text style={styles.experienceDates}>
                      {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                    </Text>
                  </View>
                  <Text style={styles.experienceCompany}>
                    {exp.companyName}
                    {exp.location ? ` | ${exp.location}` : ''}
                  </Text>
                  {exp.description && (
                    <RichTextRenderer text={exp.description} style={styles.experienceDescription} />
                  )}
                  {exp.achievements && exp.achievements.length > 0 && (
                    <View style={styles.achievementsList}>
                      {exp.achievements.map((achievement, idx) => (
                        <View key={idx} style={styles.achievementBullet}>
                          <Text style={styles.bulletPoint}>*</Text>
                          <Text style={styles.bulletText}>{achievement}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Education Section */}
          {education.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.sectionTitle}>Education</Text>
              {education.map((edu) => (
                <View key={edu.id} style={styles.educationItem}>
                  <Text style={styles.eduDegree}>{edu.degree}</Text>
                  <Text style={styles.eduField}>{edu.fieldOfStudy}</Text>
                  <Text style={styles.eduInstitution}>{edu.institution}</Text>
                  <Text style={styles.eduDate}>
                    {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                  </Text>
                  {edu.grade && <Text style={styles.eduGrade}>GPA: {edu.grade}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Projects Section */}
          {projects.length > 0 && (
            <View style={styles.mainSection}>
              <Text style={styles.sectionTitle}>Projects</Text>
              {projects.map((project) => (
                <View key={project.id} style={styles.projectItem}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.projectTech}>
                      Technologies: {project.technologies.join(' | ')}
                    </Text>
                  )}
                  {(project.projectUrl || project.sourceCodeUrl) && (
                    <View style={styles.projectLinks}>
                      {project.projectUrl && (
                        <Link src={project.projectUrl} style={styles.projectLink}>
                          Live Demo
                        </Link>
                      )}
                      {project.sourceCodeUrl && (
                        <Link src={project.sourceCodeUrl} style={styles.projectLink}>
                          Source Code
                        </Link>
                      )}
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
