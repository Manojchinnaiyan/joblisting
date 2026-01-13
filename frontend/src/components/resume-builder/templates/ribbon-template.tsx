import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Ribbon template with banner-style section headers
// Features folded ribbon effects and decorative banner elements
const createStyles = (primaryColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 40,
      paddingHorizontal: 0,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#333333',
      backgroundColor: '#fafafa',
    },
    // Name banner ribbon at top - extends full width with folded edges
    nameBanner: {
      backgroundColor: primaryColor,
      paddingVertical: 24,
      paddingHorizontal: 50,
      marginBottom: 0,
      position: 'relative',
    },
    nameBannerShadow: {
      position: 'absolute',
      bottom: -8,
      left: 30,
      right: 30,
      height: 8,
      backgroundColor: 'rgba(0,0,0,0.1)',
    },
    // Left ribbon fold
    ribbonFoldLeft: {
      position: 'absolute',
      left: 0,
      bottom: -12,
      width: 0,
      height: 0,
      borderLeftWidth: 30,
      borderLeftColor: 'transparent',
      borderTopWidth: 12,
      borderTopColor: primaryColor,
    },
    // Right ribbon fold
    ribbonFoldRight: {
      position: 'absolute',
      right: 0,
      bottom: -12,
      width: 0,
      height: 0,
      borderRightWidth: 30,
      borderRightColor: 'transparent',
      borderTopWidth: 12,
      borderTopColor: primaryColor,
    },
    name: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      textAlign: 'center',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    headline: {
      fontSize: 12,
      color: '#ffffff',
      textAlign: 'center',
      opacity: 0.9,
      marginTop: 6,
      letterSpacing: 1,
    },
    // Contact bar below name banner
    contactBar: {
      backgroundColor: '#ffffff',
      paddingVertical: 12,
      paddingHorizontal: 40,
      marginTop: 16,
      flexDirection: 'row',
      justifyContent: 'center',
      flexWrap: 'wrap',
      gap: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    contactItem: {
      fontSize: 9,
      color: '#4b5563',
    },
    contactLink: {
      fontSize: 9,
      color: primaryColor,
      textDecoration: 'none',
    },
    // Main content area
    content: {
      paddingHorizontal: 40,
      paddingTop: 20,
    },
    // Section with ribbon header
    section: {
      marginBottom: 18,
    },
    // Ribbon-style section header - extends beyond content with folded ends
    sectionRibbon: {
      position: 'relative',
      marginLeft: -20,
      marginRight: -20,
      marginBottom: 12,
    },
    sectionRibbonMain: {
      backgroundColor: primaryColor,
      paddingVertical: 8,
      paddingHorizontal: 24,
      flexDirection: 'row',
      alignItems: 'center',
    },
    sectionTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    // Decorative ribbon fold on left side of section header
    sectionFoldLeft: {
      position: 'absolute',
      left: 0,
      bottom: -6,
      width: 0,
      height: 0,
      borderLeftWidth: 12,
      borderLeftColor: 'transparent',
      borderTopWidth: 6,
      borderTopColor: primaryColor,
    },
    // Decorative ribbon fold on right side of section header
    sectionFoldRight: {
      position: 'absolute',
      right: 0,
      bottom: -6,
      width: 0,
      height: 0,
      borderRightWidth: 12,
      borderRightColor: 'transparent',
      borderTopWidth: 6,
      borderTopColor: primaryColor,
    },
    // Decorative ribbon end tail on right
    ribbonTailRight: {
      position: 'absolute',
      right: -10,
      top: 0,
      width: 0,
      height: 0,
      borderTopWidth: 15,
      borderTopColor: primaryColor,
      borderBottomWidth: 15,
      borderBottomColor: primaryColor,
      borderRightWidth: 10,
      borderRightColor: 'transparent',
    },
    // Summary section
    summaryBox: {
      backgroundColor: '#ffffff',
      padding: 14,
      borderRadius: 4,
      borderLeftWidth: 4,
      borderLeftColor: primaryColor,
    },
    summaryText: {
      fontSize: 10,
      lineHeight: 1.6,
      color: '#4b5563',
    },
    // Experience & Education items
    itemContainer: {
      backgroundColor: '#ffffff',
      padding: 12,
      marginBottom: 10,
      borderRadius: 4,
    },
    itemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 4,
    },
    itemTitle: {
      fontSize: 11,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
      flex: 1,
    },
    itemDates: {
      fontSize: 9,
      color: '#ffffff',
      backgroundColor: primaryColor,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 3,
    },
    itemSubtitle: {
      fontSize: 10,
      color: '#6b7280',
      marginBottom: 6,
    },
    itemDescription: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#4b5563',
    },
    bulletList: {
      marginTop: 6,
    },
    bulletItem: {
      fontSize: 9,
      lineHeight: 1.4,
      color: '#4b5563',
      marginBottom: 3,
      paddingLeft: 12,
    },
    bulletMarker: {
      position: 'absolute',
      left: 0,
      color: primaryColor,
      fontFamily: 'Helvetica-Bold',
    },
    // Skills displayed as ribbon tags
    skillsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      backgroundColor: '#ffffff',
      padding: 12,
      borderRadius: 4,
    },
    skillRibbon: {
      backgroundColor: primaryColor,
      paddingVertical: 5,
      paddingHorizontal: 12,
      position: 'relative',
    },
    skillRibbonTail: {
      position: 'absolute',
      right: -6,
      top: 0,
      width: 0,
      height: 0,
      borderTopWidth: 11,
      borderTopColor: primaryColor,
      borderBottomWidth: 11,
      borderBottomColor: primaryColor,
      borderRightWidth: 6,
      borderRightColor: 'transparent',
    },
    skillText: {
      fontSize: 9,
      color: '#ffffff',
      fontFamily: 'Helvetica-Bold',
    },
    // Languages section
    languagesContainer: {
      backgroundColor: '#ffffff',
      padding: 12,
      borderRadius: 4,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    languageName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#374151',
      width: 100,
    },
    languageLevel: {
      fontSize: 9,
      color: '#6b7280',
    },
    // Certifications
    certContainer: {
      backgroundColor: '#ffffff',
      padding: 12,
      borderRadius: 4,
    },
    certItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    certRibbonIcon: {
      width: 16,
      height: 16,
      backgroundColor: primaryColor,
      marginRight: 10,
      borderRadius: 2,
    },
    certContent: {
      flex: 1,
    },
    certName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#1f2937',
    },
    certDetails: {
      fontSize: 9,
      color: '#6b7280',
      marginTop: 2,
    },
    // Projects
    projectItem: {
      backgroundColor: '#ffffff',
      padding: 12,
      marginBottom: 10,
      borderRadius: 4,
      borderTopWidth: 3,
      borderTopColor: primaryColor,
    },
    projectTitle: {
      fontSize: 11,
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
      color: primaryColor,
      marginTop: 6,
      fontFamily: 'Helvetica-Bold',
    },
    projectLinks: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 6,
    },
    projectLink: {
      fontSize: 8,
      color: primaryColor,
      textDecoration: 'underline',
    },
    // Decorative ribbon divider
    ribbonDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginVertical: 10,
    },
    ribbonDividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: '#e5e7eb',
    },
    ribbonDividerIcon: {
      width: 20,
      height: 12,
      backgroundColor: primaryColor,
      marginHorizontal: 10,
      position: 'relative',
    },
    ribbonDividerTailLeft: {
      position: 'absolute',
      left: -6,
      top: 0,
      width: 0,
      height: 0,
      borderTopWidth: 6,
      borderTopColor: primaryColor,
      borderBottomWidth: 6,
      borderBottomColor: primaryColor,
      borderLeftWidth: 6,
      borderLeftColor: 'transparent',
    },
    ribbonDividerTailRight: {
      position: 'absolute',
      right: -6,
      top: 0,
      width: 0,
      height: 0,
      borderTopWidth: 6,
      borderTopColor: primaryColor,
      borderBottomWidth: 6,
      borderBottomColor: primaryColor,
      borderRightWidth: 6,
      borderRightColor: 'transparent',
    },
  })

interface RibbonTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function RibbonTemplate({ data, settings }: RibbonTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Section header with ribbon styling
  const SectionRibbon = ({ title }: { title: string }) => (
    <View style={styles.sectionRibbon}>
      <View style={styles.sectionRibbonMain}>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionFoldLeft} />
      <View style={styles.sectionFoldRight} />
      <View style={styles.ribbonTailRight} />
    </View>
  )

  // Decorative ribbon divider between sections
  const RibbonDivider = () => (
    <View style={styles.ribbonDivider}>
      <View style={styles.ribbonDividerLine} />
      <View style={styles.ribbonDividerIcon}>
        <View style={styles.ribbonDividerTailLeft} />
        <View style={styles.ribbonDividerTailRight} />
      </View>
      <View style={styles.ribbonDividerLine} />
    </View>
  )

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Name Banner Ribbon */}
        <View style={styles.nameBanner}>
          <Text style={styles.name}>
            {personalInfo.firstName} {personalInfo.lastName}
          </Text>
          {personalInfo.headline && (
            <Text style={styles.headline}>{personalInfo.headline}</Text>
          )}
          <View style={styles.nameBannerShadow} />
          <View style={styles.ribbonFoldLeft} />
          <View style={styles.ribbonFoldRight} />
        </View>

        {/* Contact Bar */}
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

        <View style={styles.content}>
          {/* Summary */}
          {personalInfo.summary && (
            <View style={styles.section}>
              <SectionRibbon title="Professional Summary" />
              <View style={styles.summaryBox}>
                <RichTextRenderer text={personalInfo.summary} style={styles.summaryText} />
              </View>
            </View>
          )}

          {/* Experience */}
          {experience.length > 0 && (
            <View style={styles.section}>
              <SectionRibbon title="Experience" />
              {experience.map((exp, index) => (
                <View key={exp.id}>
                  <View style={styles.itemContainer}>
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemTitle}>{exp.title}</Text>
                      <Text style={styles.itemDates}>
                        {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                      </Text>
                    </View>
                    <Text style={styles.itemSubtitle}>
                      {exp.companyName}{exp.location ? ` | ${exp.location}` : ''}
                    </Text>
                    {exp.description && (
                      <RichTextRenderer text={exp.description} style={styles.itemDescription} />
                    )}
                    {exp.achievements && exp.achievements.length > 0 && (
                      <View style={styles.bulletList}>
                        {exp.achievements.map((achievement, idx) => (
                          <Text key={idx} style={styles.bulletItem}>
                            <Text style={{ color: settings.primaryColor, fontFamily: 'Helvetica-Bold' }}>&#x2022; </Text>
                            {achievement}
                          </Text>
                        ))}
                      </View>
                    )}
                  </View>
                  {index < experience.length - 1 && <RibbonDivider />}
                </View>
              ))}
            </View>
          )}

          {/* Education */}
          {education.length > 0 && (
            <View style={styles.section}>
              <SectionRibbon title="Education" />
              {education.map((edu) => (
                <View key={edu.id} style={styles.itemContainer}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemTitle}>{edu.degree} in {edu.fieldOfStudy}</Text>
                    <Text style={styles.itemDates}>
                      {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                    </Text>
                  </View>
                  <Text style={styles.itemSubtitle}>{edu.institution}</Text>
                  {edu.grade && <Text style={styles.itemDescription}>GPA: {edu.grade}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Skills - displayed as ribbon tags */}
          {skills.length > 0 && (
            <View style={styles.section}>
              <SectionRibbon title="Skills" />
              <View style={styles.skillsContainer}>
                {skills.map((skill) => (
                  <View key={skill.id} style={styles.skillRibbon}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                    <View style={styles.skillRibbonTail} />
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <View style={styles.section}>
              <SectionRibbon title="Languages" />
              <View style={styles.languagesContainer}>
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
            </View>
          )}

          {/* Certifications */}
          {certifications.length > 0 && (
            <View style={styles.section}>
              <SectionRibbon title="Certifications" />
              <View style={styles.certContainer}>
                {certifications.map((cert) => (
                  <View key={cert.id} style={styles.certItem}>
                    <View style={styles.certRibbonIcon} />
                    <View style={styles.certContent}>
                      <Text style={styles.certName}>{cert.name}</Text>
                      <Text style={styles.certDetails}>
                        {cert.issuingOrganization} | {formatDate(cert.issueDate)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Projects */}
          {projects.length > 0 && (
            <View style={styles.section}>
              <SectionRibbon title="Projects" />
              {projects.map((project) => (
                <View key={project.id} style={styles.projectItem}>
                  <Text style={styles.projectTitle}>{project.title}</Text>
                  <RichTextRenderer text={project.description} style={styles.projectDesc} />
                  {project.technologies && project.technologies.length > 0 && (
                    <Text style={styles.techLine}>
                      {project.technologies.join(' | ')}
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
      </Page>
    </Document>
  )
}
