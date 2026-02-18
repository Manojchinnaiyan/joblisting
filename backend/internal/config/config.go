package config

import (
	"fmt"
	"time"

	"github.com/joho/godotenv"
	"github.com/spf13/viper"
)

type Config struct {
	// Application
	AppEnv  string
	AppPort string
	AppHost string

	// Database
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string

	// Redis
	RedisHost     string
	RedisPort     string
	RedisPassword string

	// Meilisearch
	MeiliHost      string
	MeiliMasterKey string

	// MinIO
	MinioEndpoint          string
	MinioAccessKey         string
	MinioSecretKey         string
	MinioUseSSL            bool
	MinioPublicURL         string
	MinioBucketResumes     string
	MinioBucketAvatars     string
	MinioBucketCerts       string
	MinioBucketPortfolios  string
	MinioBucketCompanies   string

	// File Upload Limits
	MaxResumeSizeMB       int64
	MaxAvatarSizeMB       int64
	MaxResumesPerUser     int
	ResumeURLExpiryHours  int

	// Profile Settings
	MinProfileCompletenessToApply int

	// JWT
	JWTSecret        string
	JWTAccessExpiry  string
	JWTRefreshExpiry string
	JWTAdminExpiry   string

	// Password & Security
	BcryptCost              int
	PasswordMinLength       int
	MaxLoginAttempts        int
	AccountLockDuration     string
	EmailVerificationExpiry string
	PasswordResetExpiry     string

	// Google OAuth
	GoogleClientID     string
	GoogleClientSecret string
	GoogleRedirectURL  string

	// LinkedIn OAuth
	LinkedInClientID     string
	LinkedInClientSecret string
	LinkedInRedirectURL  string

	// Email Provider
	EmailProvider string

	// Resend
	ResendAPIKey     string
	ResendFromEmail  string
	ResendFromName   string

	// Email (SMTP)
	SMTPHost     string
	SMTPPort     int
	SMTPUser     string
	SMTPPassword string
	EmailFrom    string

	// Admin
	AdminEmailDomain   string
	SuperAdminEmail    string

	// Frontend URLs
	FrontendURL             string
	AdminFrontendURL        string
	EmailVerificationURL    string
	PasswordResetURL        string
}

func Load() (*Config, error) {
	// Load .env file (check current dir, then parent dir)
	_ = godotenv.Load()
	_ = godotenv.Load("../.env")

	// Setup Viper
	viper.AutomaticEnv()

	// Set defaults
	viper.SetDefault("APP_ENV", "development")
	viper.SetDefault("APP_PORT", "8080")
	viper.SetDefault("APP_HOST", "0.0.0.0")

	// File upload defaults
	viper.SetDefault("MAX_RESUMES_PER_USER", 5)
	viper.SetDefault("MAX_RESUME_SIZE_MB", 10)
	viper.SetDefault("MAX_AVATAR_SIZE_MB", 5)
	viper.SetDefault("RESUME_URL_EXPIRY_HOURS", 24)

	cfg := &Config{
		AppEnv:  viper.GetString("APP_ENV"),
		AppPort: viper.GetString("APP_PORT"),
		AppHost: viper.GetString("APP_HOST"),

		DBHost:     viper.GetString("DB_HOST"),
		DBPort:     viper.GetString("DB_PORT"),
		DBUser:     viper.GetString("DB_USER"),
		DBPassword: viper.GetString("DB_PASSWORD"),
		DBName:     viper.GetString("DB_NAME"),
		DBSSLMode:  viper.GetString("DB_SSLMODE"),

		RedisHost:     viper.GetString("REDIS_HOST"),
		RedisPort:     viper.GetString("REDIS_PORT"),
		RedisPassword: viper.GetString("REDIS_PASSWORD"),

		MeiliHost:      viper.GetString("MEILI_HOST"),
		MeiliMasterKey: viper.GetString("MEILI_MASTER_KEY"),

		MinioEndpoint:         viper.GetString("MINIO_ENDPOINT"),
		MinioAccessKey:        viper.GetString("MINIO_ACCESS_KEY"),
		MinioSecretKey:        viper.GetString("MINIO_SECRET_KEY"),
		MinioUseSSL:           viper.GetBool("MINIO_USE_SSL"),
		MinioPublicURL:        viper.GetString("MINIO_PUBLIC_URL"),
		MinioBucketResumes:    viper.GetString("MINIO_BUCKET_RESUMES"),
		MinioBucketAvatars:    viper.GetString("MINIO_BUCKET_AVATARS"),
		MinioBucketCerts:      viper.GetString("MINIO_BUCKET_CERTIFICATES"),
		MinioBucketPortfolios: viper.GetString("MINIO_BUCKET_PORTFOLIOS"),
		MinioBucketCompanies:  viper.GetString("MINIO_BUCKET_COMPANIES"),

		// File Upload Limits
		MaxResumeSizeMB:       viper.GetInt64("MAX_RESUME_SIZE_MB"),
		MaxAvatarSizeMB:       viper.GetInt64("MAX_AVATAR_SIZE_MB"),
		MaxResumesPerUser:     viper.GetInt("MAX_RESUMES_PER_USER"),
		ResumeURLExpiryHours:  viper.GetInt("RESUME_URL_EXPIRY_HOURS"),

		// Profile Settings
		MinProfileCompletenessToApply: viper.GetInt("MIN_PROFILE_COMPLETENESS_FOR_APPLY"),

		// JWT
		JWTSecret:        viper.GetString("JWT_SECRET"),
		JWTAccessExpiry:  viper.GetString("JWT_ACCESS_EXPIRY"),
		JWTRefreshExpiry: viper.GetString("JWT_REFRESH_EXPIRY"),
		JWTAdminExpiry:   viper.GetString("JWT_ADMIN_EXPIRY"),

		// Password & Security
		BcryptCost:              viper.GetInt("BCRYPT_COST"),
		PasswordMinLength:       viper.GetInt("PASSWORD_MIN_LENGTH"),
		MaxLoginAttempts:        viper.GetInt("MAX_LOGIN_ATTEMPTS"),
		AccountLockDuration:     viper.GetString("ACCOUNT_LOCK_DURATION"),
		EmailVerificationExpiry: viper.GetString("EMAIL_VERIFICATION_EXPIRY"),
		PasswordResetExpiry:     viper.GetString("PASSWORD_RESET_EXPIRY"),

		// Google OAuth
		GoogleClientID:     viper.GetString("GOOGLE_CLIENT_ID"),
		GoogleClientSecret: viper.GetString("GOOGLE_CLIENT_SECRET"),
		GoogleRedirectURL:  viper.GetString("GOOGLE_REDIRECT_URL"),

		// LinkedIn OAuth
		LinkedInClientID:     viper.GetString("LINKEDIN_CLIENT_ID"),
		LinkedInClientSecret: viper.GetString("LINKEDIN_CLIENT_SECRET"),
		LinkedInRedirectURL:  viper.GetString("LINKEDIN_REDIRECT_URL"),

		// Email Provider
		EmailProvider: viper.GetString("EMAIL_PROVIDER"),

		// Resend
		ResendAPIKey:    viper.GetString("RESEND_API_KEY"),
		ResendFromEmail: viper.GetString("RESEND_FROM_EMAIL"),
		ResendFromName:  viper.GetString("RESEND_FROM_NAME"),

		// Email (SMTP)
		SMTPHost:     viper.GetString("SMTP_HOST"),
		SMTPPort:     viper.GetInt("SMTP_PORT"),
		SMTPUser:     viper.GetString("SMTP_USER"),
		SMTPPassword: viper.GetString("SMTP_PASSWORD"),
		EmailFrom:    viper.GetString("EMAIL_FROM"),

		// Admin
		AdminEmailDomain: viper.GetString("ADMIN_EMAIL_DOMAIN"),
		SuperAdminEmail:  viper.GetString("SUPER_ADMIN_EMAIL"),

		// Frontend URLs
		FrontendURL:          viper.GetString("FRONTEND_URL"),
		AdminFrontendURL:     viper.GetString("ADMIN_FRONTEND_URL"),
		EmailVerificationURL: viper.GetString("EMAIL_VERIFICATION_URL"),
		PasswordResetURL:     viper.GetString("PASSWORD_RESET_URL"),
	}

	return cfg, nil
}

func (c *Config) GetDSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.DBHost, c.DBPort, c.DBUser, c.DBPassword, c.DBName, c.DBSSLMode,
	)
}

func (c *Config) GetRedisAddr() string {
	return fmt.Sprintf("%s:%s", c.RedisHost, c.RedisPort)
}

// ParseDuration parses duration strings like "24h", "15m", etc.
func ParseDuration(s string) (time.Duration, error) {
	return time.ParseDuration(s)
}
