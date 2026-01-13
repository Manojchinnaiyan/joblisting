import { Document, Page, Text, View, StyleSheet, Link } from '@react-pdf/renderer'
import type { ResumeData, ResumeSettings } from '@/types/resume-builder'
import { RichTextRenderer } from './rich-text-renderer'

// Developer template - GitHub profile-inspired layout with repository cards and contribution graph
const createStyles = (accentColor: string) =>
  StyleSheet.create({
    page: {
      paddingTop: 0,
      paddingBottom: 30,
      paddingHorizontal: 0,
      fontSize: 10,
      fontFamily: 'Helvetica',
      color: '#24292f',
      backgroundColor: '#ffffff',
    },
    // GitHub-style header with avatar placeholder and stats
    header: {
      backgroundColor: '#f6f8fa',
      borderBottomWidth: 1,
      borderBottomColor: '#d0d7de',
      paddingVertical: 20,
      paddingHorizontal: 30,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    avatarPlaceholder: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#d0d7de',
      borderWidth: 1,
      borderColor: '#d0d7de',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 20,
    },
    avatarInitials: {
      fontSize: 28,
      fontFamily: 'Helvetica-Bold',
      color: '#57606a',
    },
    profileInfo: {
      flex: 1,
    },
    displayName: {
      fontSize: 24,
      fontFamily: 'Helvetica-Bold',
      color: '#24292f',
      marginBottom: 2,
    },
    username: {
      fontSize: 18,
      color: '#57606a',
      marginBottom: 6,
    },
    headline: {
      fontSize: 11,
      color: '#24292f',
      marginBottom: 10,
      lineHeight: 1.4,
    },
    statsRow: {
      flexDirection: 'row',
      gap: 20,
      marginTop: 8,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    statIcon: {
      fontSize: 9,
      color: '#57606a',
      marginRight: 4,
    },
    statValue: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#24292f',
      marginRight: 3,
    },
    statLabel: {
      fontSize: 10,
      color: '#57606a',
    },
    // Links bar - GitHub style
    linksBar: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#d0d7de',
    },
    linkItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    linkIcon: {
      fontSize: 9,
      color: '#57606a',
      marginRight: 4,
    },
    linkText: {
      fontSize: 9,
      color: accentColor,
      textDecoration: 'none',
    },
    // Main content area
    mainContent: {
      paddingHorizontal: 30,
      paddingTop: 15,
    },
    // Section headers - GitHub tab style
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
      paddingBottom: 8,
      borderBottomWidth: 2,
      borderBottomColor: accentColor,
    },
    sectionIcon: {
      fontSize: 12,
      color: '#57606a',
      marginRight: 8,
    },
    sectionTitle: {
      fontSize: 12,
      fontFamily: 'Helvetica-Bold',
      color: '#24292f',
    },
    sectionCount: {
      fontSize: 9,
      color: '#57606a',
      backgroundColor: '#e2e8f0',
      paddingVertical: 1,
      paddingHorizontal: 6,
      borderRadius: 10,
      marginLeft: 8,
    },
    section: {
      marginBottom: 16,
    },
    // README-style summary (About section)
    readmeBox: {
      backgroundColor: '#f6f8fa',
      borderWidth: 1,
      borderColor: '#d0d7de',
      borderRadius: 6,
      padding: 12,
      marginBottom: 16,
    },
    readmeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
      paddingBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#d0d7de',
    },
    readmeIcon: {
      fontSize: 10,
      color: '#57606a',
      marginRight: 6,
    },
    readmeTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#24292f',
    },
    readmeContent: {
      fontSize: 9,
      lineHeight: 1.5,
      color: '#24292f',
    },
    // Repository/Project cards
    repoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    repoCard: {
      width: '48%',
      backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#d0d7de',
      borderRadius: 6,
      padding: 10,
    },
    repoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 6,
    },
    repoIcon: {
      fontSize: 10,
      color: '#57606a',
      marginRight: 6,
    },
    repoName: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: accentColor,
      flex: 1,
    },
    repoDescription: {
      fontSize: 8,
      color: '#57606a',
      lineHeight: 1.4,
      marginBottom: 8,
    },
    repoMeta: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 10,
    },
    repoTech: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    techDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: accentColor,
      marginRight: 4,
    },
    techName: {
      fontSize: 8,
      color: '#57606a',
    },
    repoLinks: {
      flexDirection: 'row',
      gap: 8,
    },
    repoLink: {
      fontSize: 7,
      color: accentColor,
      textDecoration: 'none',
    },
    // Contribution graph-like skills visualization
    contributionSection: {
      marginBottom: 16,
    },
    contributionGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 3,
    },
    skillBlock: {
      paddingVertical: 4,
      paddingHorizontal: 8,
      borderRadius: 3,
      marginBottom: 3,
    },
    skillBlockExpert: {
      backgroundColor: accentColor,
    },
    skillBlockAdvanced: {
      backgroundColor: `${accentColor}cc`,
    },
    skillBlockIntermediate: {
      backgroundColor: `${accentColor}80`,
    },
    skillBlockBeginner: {
      backgroundColor: `${accentColor}40`,
    },
    skillText: {
      fontSize: 8,
      color: '#ffffff',
    },
    skillTextLight: {
      fontSize: 8,
      color: '#24292f',
    },
    skillLegend: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      marginTop: 8,
      gap: 4,
    },
    legendText: {
      fontSize: 7,
      color: '#57606a',
    },
    legendBlock: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
    // Experience - Commit history style
    commitHistory: {
      marginBottom: 16,
    },
    commitItem: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    commitLine: {
      width: 20,
      alignItems: 'center',
    },
    commitDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: accentColor,
      borderWidth: 2,
      borderColor: '#ffffff',
    },
    commitConnector: {
      width: 2,
      flex: 1,
      backgroundColor: '#d0d7de',
      marginTop: 2,
    },
    commitContent: {
      flex: 1,
      paddingLeft: 10,
      paddingBottom: 4,
    },
    commitTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#24292f',
    },
    commitCompany: {
      fontSize: 9,
      color: accentColor,
      marginTop: 1,
    },
    commitMeta: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 4,
    },
    commitDate: {
      fontSize: 8,
      color: '#57606a',
    },
    commitLocation: {
      fontSize: 8,
      color: '#57606a',
    },
    commitDescription: {
      fontSize: 9,
      color: '#57606a',
      lineHeight: 1.4,
      marginTop: 6,
    },
    commitAchievements: {
      marginTop: 4,
    },
    achievementItem: {
      fontSize: 8,
      color: '#24292f',
      marginBottom: 2,
      lineHeight: 1.3,
    },
    achievementBullet: {
      color: accentColor,
    },
    // Education - Issue/PR style
    issueList: {
      marginBottom: 16,
    },
    issueItem: {
      flexDirection: 'row',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#d0d7de',
    },
    issueIcon: {
      width: 20,
      alignItems: 'center',
      paddingTop: 2,
    },
    issueIconText: {
      fontSize: 10,
      color: '#8250df',
    },
    issueContent: {
      flex: 1,
    },
    issueTitle: {
      fontSize: 10,
      fontFamily: 'Helvetica-Bold',
      color: '#24292f',
    },
    issueSubtitle: {
      fontSize: 9,
      color: '#57606a',
      marginTop: 2,
    },
    issueMeta: {
      fontSize: 8,
      color: '#57606a',
      marginTop: 2,
    },
    // Certifications - Badge style
    badgeGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#ddf4ff',
      borderWidth: 1,
      borderColor: '#54aeff66',
      borderRadius: 12,
      paddingVertical: 4,
      paddingHorizontal: 10,
    },
    badgeIcon: {
      fontSize: 8,
      color: accentColor,
      marginRight: 4,
    },
    badgeText: {
      fontSize: 8,
      color: '#0969da',
    },
    badgeOrg: {
      fontSize: 7,
      color: '#57606a',
      marginLeft: 4,
    },
    // Languages section
    languagesRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
      marginBottom: 16,
    },
    languageItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    languageFlag: {
      width: 12,
      height: 12,
      borderRadius: 2,
      backgroundColor: accentColor,
      marginRight: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    languageFlagText: {
      fontSize: 6,
      color: '#ffffff',
    },
    languageName: {
      fontSize: 9,
      fontFamily: 'Helvetica-Bold',
      color: '#24292f',
    },
    languageLevel: {
      fontSize: 8,
      color: '#57606a',
      marginLeft: 4,
    },
    // Footer
    footer: {
      position: 'absolute',
      bottom: 15,
      left: 30,
      right: 30,
      flexDirection: 'row',
      justifyContent: 'center',
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: '#d0d7de',
    },
    footerText: {
      fontSize: 7,
      color: '#57606a',
    },
  })

interface DeveloperTemplateProps {
  data: ResumeData
  settings: ResumeSettings
}

export function DeveloperTemplate({ data, settings }: DeveloperTemplateProps) {
  const styles = createStyles(settings.primaryColor)
  const { personalInfo, experience, education, skills, certifications, projects, languages } = data

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
  }

  // Get initials for avatar
  const getInitials = () => {
    const first = personalInfo.firstName?.charAt(0) || ''
    const last = personalInfo.lastName?.charAt(0) || ''
    return `${first}${last}`.toUpperCase()
  }

  // Create username from name
  const getUsername = () => {
    const name = `${personalInfo.firstName}${personalInfo.lastName}`.toLowerCase().replace(/\s/g, '')
    return `@${name}`
  }

  // Group skills by level for contribution graph effect
  const expertSkills = skills.filter(s => s.level === 'EXPERT')
  const advancedSkills = skills.filter(s => s.level === 'ADVANCED')
  const intermediateSkills = skills.filter(s => s.level === 'INTERMEDIATE')
  const beginnerSkills = skills.filter(s => s.level === 'BEGINNER' || !s.level)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* GitHub-style Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            {/* Avatar placeholder with initials */}
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitials}>{getInitials()}</Text>
            </View>

            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>
                {personalInfo.firstName} {personalInfo.lastName}
              </Text>
              <Text style={styles.username}>{getUsername()}</Text>
              {personalInfo.headline && (
                <Text style={styles.headline}>{personalInfo.headline}</Text>
              )}

              {/* Stats row */}
              <View style={styles.statsRow}>
                {projects.length > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>[repo]</Text>
                    <Text style={styles.statValue}>{projects.length}</Text>
                    <Text style={styles.statLabel}>projects</Text>
                  </View>
                )}
                {experience.length > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>[exp]</Text>
                    <Text style={styles.statValue}>{experience.length}</Text>
                    <Text style={styles.statLabel}>roles</Text>
                  </View>
                )}
                {skills.length > 0 && (
                  <View style={styles.statItem}>
                    <Text style={styles.statIcon}>[code]</Text>
                    <Text style={styles.statValue}>{skills.length}</Text>
                    <Text style={styles.statLabel}>skills</Text>
                  </View>
                )}
              </View>

              {/* Links bar */}
              {(personalInfo.email || personalInfo.location || personalInfo.githubUrl || personalInfo.portfolioUrl || personalInfo.linkedinUrl) && (
                <View style={styles.linksBar}>
                  {personalInfo.location && (
                    <View style={styles.linkItem}>
                      <Text style={styles.linkIcon}>[pin]</Text>
                      <Text style={styles.linkText}>{personalInfo.location}</Text>
                    </View>
                  )}
                  {personalInfo.email && (
                    <View style={styles.linkItem}>
                      <Text style={styles.linkIcon}>[mail]</Text>
                      <Link src={`mailto:${personalInfo.email}`} style={styles.linkText}>
                        {personalInfo.email}
                      </Link>
                    </View>
                  )}
                  {personalInfo.githubUrl && (
                    <View style={styles.linkItem}>
                      <Text style={styles.linkIcon}>[gh]</Text>
                      <Link src={personalInfo.githubUrl} style={styles.linkText}>
                        GitHub
                      </Link>
                    </View>
                  )}
                  {personalInfo.portfolioUrl && (
                    <View style={styles.linkItem}>
                      <Text style={styles.linkIcon}>[www]</Text>
                      <Link src={personalInfo.portfolioUrl} style={styles.linkText}>
                        Portfolio
                      </Link>
                    </View>
                  )}
                  {personalInfo.linkedinUrl && (
                    <View style={styles.linkItem}>
                      <Text style={styles.linkIcon}>[in]</Text>
                      <Link src={personalInfo.linkedinUrl} style={styles.linkText}>
                        LinkedIn
                      </Link>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* README/About Section */}
          {personalInfo.summary && (
            <View style={styles.readmeBox}>
              <View style={styles.readmeHeader}>
                <Text style={styles.readmeIcon}>[readme]</Text>
                <Text style={styles.readmeTitle}>README.md</Text>
              </View>
              <RichTextRenderer text={personalInfo.summary} style={styles.readmeContent} />
            </View>
          )}

          {/* Skills - Contribution Graph Style */}
          {skills.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>[#]</Text>
                <Text style={styles.sectionTitle}>Tech Stack</Text>
                <Text style={styles.sectionCount}>{skills.length}</Text>
              </View>
              <View style={styles.contributionGrid}>
                {expertSkills.map((skill) => (
                  <View key={skill.id} style={[styles.skillBlock, styles.skillBlockExpert]}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
                {advancedSkills.map((skill) => (
                  <View key={skill.id} style={[styles.skillBlock, styles.skillBlockAdvanced]}>
                    <Text style={styles.skillText}>{skill.name}</Text>
                  </View>
                ))}
                {intermediateSkills.map((skill) => (
                  <View key={skill.id} style={[styles.skillBlock, styles.skillBlockIntermediate]}>
                    <Text style={styles.skillTextLight}>{skill.name}</Text>
                  </View>
                ))}
                {beginnerSkills.map((skill) => (
                  <View key={skill.id} style={[styles.skillBlock, styles.skillBlockBeginner]}>
                    <Text style={styles.skillTextLight}>{skill.name}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.skillLegend}>
                <Text style={styles.legendText}>Less</Text>
                <View style={[styles.legendBlock, { backgroundColor: `${settings.primaryColor}40` }]} />
                <View style={[styles.legendBlock, { backgroundColor: `${settings.primaryColor}80` }]} />
                <View style={[styles.legendBlock, { backgroundColor: `${settings.primaryColor}cc` }]} />
                <View style={[styles.legendBlock, { backgroundColor: settings.primaryColor }]} />
                <Text style={styles.legendText}>More</Text>
              </View>
            </View>
          )}

          {/* Projects - Repository Cards */}
          {projects.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>[repo]</Text>
                <Text style={styles.sectionTitle}>Pinned Repositories</Text>
                <Text style={styles.sectionCount}>{projects.length}</Text>
              </View>
              <View style={styles.repoGrid}>
                {projects.map((project) => (
                  <View key={project.id} style={styles.repoCard}>
                    <View style={styles.repoHeader}>
                      <Text style={styles.repoIcon}>[/]</Text>
                      <Text style={styles.repoName}>{project.title}</Text>
                    </View>
                    <Text style={styles.repoDescription}>
                      {project.description}
                    </Text>
                    <View style={styles.repoMeta}>
                      {project.technologies && project.technologies.length > 0 && (
                        <View style={styles.repoTech}>
                          <View style={styles.techDot} />
                          <Text style={styles.techName}>{project.technologies[0]}</Text>
                        </View>
                      )}
                      <View style={styles.repoLinks}>
                        {project.sourceCodeUrl && (
                          <Link src={project.sourceCodeUrl} style={styles.repoLink}>
                            [code]
                          </Link>
                        )}
                        {project.projectUrl && (
                          <Link src={project.projectUrl} style={styles.repoLink}>
                            [demo]
                          </Link>
                        )}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Experience - Commit History Style */}
          {experience.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>[git]</Text>
                <Text style={styles.sectionTitle}>Contribution History</Text>
                <Text style={styles.sectionCount}>{experience.length}</Text>
              </View>
              <View style={styles.commitHistory}>
                {experience.map((exp, index) => (
                  <View key={exp.id} style={styles.commitItem}>
                    <View style={styles.commitLine}>
                      <View style={styles.commitDot} />
                      {index < experience.length - 1 && <View style={styles.commitConnector} />}
                    </View>
                    <View style={styles.commitContent}>
                      <Text style={styles.commitTitle}>{exp.title}</Text>
                      <Text style={styles.commitCompany}>{exp.companyName}</Text>
                      <View style={styles.commitMeta}>
                        <Text style={styles.commitDate}>
                          {formatDate(exp.startDate)} - {exp.isCurrent ? 'Present' : formatDate(exp.endDate || '')}
                        </Text>
                        {exp.location && (
                          <Text style={styles.commitLocation}>{exp.location}</Text>
                        )}
                      </View>
                      {exp.description && (
                        <RichTextRenderer text={exp.description} style={styles.commitDescription} />
                      )}
                      {exp.achievements && exp.achievements.length > 0 && (
                        <View style={styles.commitAchievements}>
                          {exp.achievements.map((achievement, idx) => (
                            <Text key={idx} style={styles.achievementItem}>
                              <Text style={styles.achievementBullet}>+ </Text>
                              {achievement}
                            </Text>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Education - Issue Style */}
          {education.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>[edu]</Text>
                <Text style={styles.sectionTitle}>Education</Text>
                <Text style={styles.sectionCount}>{education.length}</Text>
              </View>
              <View style={styles.issueList}>
                {education.map((edu) => (
                  <View key={edu.id} style={styles.issueItem}>
                    <View style={styles.issueIcon}>
                      <Text style={styles.issueIconText}>[*]</Text>
                    </View>
                    <View style={styles.issueContent}>
                      <Text style={styles.issueTitle}>
                        {edu.degree} in {edu.fieldOfStudy}
                      </Text>
                      <Text style={styles.issueSubtitle}>{edu.institution}</Text>
                      <Text style={styles.issueMeta}>
                        {formatDate(edu.startDate)} - {edu.isCurrent ? 'Present' : formatDate(edu.endDate || '')}
                        {edu.grade ? ` | GPA: ${edu.grade}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Languages */}
          {languages && languages.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>[lang]</Text>
                <Text style={styles.sectionTitle}>Languages</Text>
                <Text style={styles.sectionCount}>{languages.length}</Text>
              </View>
              <View style={styles.languagesRow}>
                {languages.map((lang) => (
                  <View key={lang.id} style={styles.languageItem}>
                    <View style={styles.languageFlag}>
                      <Text style={styles.languageFlagText}>{lang.name.charAt(0)}</Text>
                    </View>
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

          {/* Certifications - Badge Style */}
          {certifications.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>[badge]</Text>
                <Text style={styles.sectionTitle}>Achievements</Text>
                <Text style={styles.sectionCount}>{certifications.length}</Text>
              </View>
              <View style={styles.badgeGrid}>
                {certifications.map((cert) => (
                  <View key={cert.id} style={styles.badge}>
                    <Text style={styles.badgeIcon}>[v]</Text>
                    <Text style={styles.badgeText}>{cert.name}</Text>
                    <Text style={styles.badgeOrg}>by {cert.issuingOrganization}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </Page>
    </Document>
  )
}
