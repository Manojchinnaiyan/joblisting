package main

import (
	"bufio"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"
	"syscall"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/term"
)

// User status and role constants
const (
	RoleAdmin            = "ADMIN"
	StatusActive         = "ACTIVE"
	AuthProviderEmail    = "EMAIL"
	EmailVerified        = true
	TwoFactorEnabled     = false
	FailedLoginAttempts  = 0
)

func main() {
	fmt.Println("=== Job Platform - Admin User Seeder ===\n")

	// Load environment variables
	dbHost := getEnv("DB_HOST", "localhost")
	dbPort := getEnv("DB_PORT", "5432")
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "jobplatform")
	dbSSLMode := getEnv("DB_SSLMODE", "disable")

	// Build connection string
	connStr := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		dbHost, dbPort, dbUser, dbPassword, dbName, dbSSLMode,
	)

	// Connect to database
	db, err := sql.Open("postgres", connStr)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Test connection
	if err := db.Ping(); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}

	fmt.Println("✓ Connected to database successfully\n")

	// Get admin details from user
	reader := bufio.NewReader(os.Stdin)

	fmt.Print("Enter admin email (must be @admin.jobplatform.com): ")
	email, _ := reader.ReadString('\n')
	email = strings.TrimSpace(email)

	// Validate email domain
	if !strings.HasSuffix(email, "@admin.jobplatform.com") {
		log.Fatal("Error: Admin email must be from @admin.jobplatform.com domain")
	}

	// Check if admin already exists
	var existingID string
	err = db.QueryRow("SELECT id FROM users WHERE email = $1", email).Scan(&existingID)
	if err != sql.ErrNoRows {
		if err == nil {
			log.Fatalf("Error: Admin with email %s already exists (ID: %s)", email, existingID)
		}
		log.Fatalf("Error checking existing admin: %v", err)
	}

	fmt.Print("Enter first name: ")
	firstName, _ := reader.ReadString('\n')
	firstName = strings.TrimSpace(firstName)

	if len(firstName) < 2 {
		log.Fatal("Error: First name must be at least 2 characters")
	}

	fmt.Print("Enter last name: ")
	lastName, _ := reader.ReadString('\n')
	lastName = strings.TrimSpace(lastName)

	if len(lastName) < 2 {
		log.Fatal("Error: Last name must be at least 2 characters")
	}

	// Get password (hidden input)
	fmt.Print("Enter password (min 8 chars, must include uppercase, lowercase, number, special char): ")
	passwordBytes, err := term.ReadPassword(int(syscall.Stdin))
	if err != nil {
		log.Fatalf("Failed to read password: %v", err)
	}
	password := string(passwordBytes)
	fmt.Println() // New line after password input

	// Validate password
	if err := validatePassword(password); err != nil {
		log.Fatalf("Password validation failed: %v", err)
	}

	// Confirm password
	fmt.Print("Confirm password: ")
	confirmBytes, err := term.ReadPassword(int(syscall.Stdin))
	if err != nil {
		log.Fatalf("Failed to read password confirmation: %v", err)
	}
	confirmPassword := string(confirmBytes)
	fmt.Println() // New line after password input

	if password != confirmPassword {
		log.Fatal("Error: Passwords do not match")
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	// Start transaction
	tx, err := db.Begin()
	if err != nil {
		log.Fatalf("Failed to start transaction: %v", err)
	}
	defer tx.Rollback()

	// Generate UUIDs
	userID := uuid.New()
	profileID := uuid.New()
	passwordHistoryID := uuid.New()

	fmt.Println("\nCreating admin user...")

	// Create user
	_, err = tx.Exec(`
		INSERT INTO users (
			id, email, password, first_name, last_name, role,
			status, auth_provider, email_verified, two_factor_enabled,
			failed_login_attempts
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`,
		userID,
		email,
		string(hashedPassword),
		firstName,
		lastName,
		RoleAdmin,
		StatusActive,
		AuthProviderEmail,
		EmailVerified,
		TwoFactorEnabled,
		FailedLoginAttempts,
	)
	if err != nil {
		log.Fatalf("Failed to create admin user: %v", err)
	}

	fmt.Println("✓ Admin user created")

	// Create user profile
	_, err = tx.Exec(`
		INSERT INTO user_profiles (id, user_id) VALUES ($1, $2)
	`, profileID, userID)
	if err != nil {
		log.Fatalf("Failed to create admin profile: %v", err)
	}

	fmt.Println("✓ Admin profile created")

	// Create password history
	_, err = tx.Exec(`
		INSERT INTO password_history (id, user_id, password_hash)
		VALUES ($1, $2, $3)
	`, passwordHistoryID, userID, string(hashedPassword))
	if err != nil {
		log.Fatalf("Failed to create password history: %v", err)
	}

	fmt.Println("✓ Password history created")

	// Commit transaction
	if err := tx.Commit(); err != nil {
		log.Fatalf("Failed to commit transaction: %v", err)
	}

	fmt.Println("\n========================================")
	fmt.Println("✓ Admin user created successfully!")
	fmt.Println("========================================")
	fmt.Printf("\nAdmin Details:\n")
	fmt.Printf("  ID:         %s\n", userID)
	fmt.Printf("  Email:      %s\n", email)
	fmt.Printf("  Name:       %s %s\n", firstName, lastName)
	fmt.Printf("  Role:       %s\n", RoleAdmin)
	fmt.Printf("  Status:     %s\n", StatusActive)
	fmt.Println("\nYou can now login with these credentials.")
	fmt.Println("It is recommended to enable 2FA after first login.")
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

// validatePassword validates password strength
func validatePassword(password string) error {
	if len(password) < 8 {
		return fmt.Errorf("password must be at least 8 characters long")
	}

	var (
		hasUpper   bool
		hasLower   bool
		hasNumber  bool
		hasSpecial bool
	)

	for _, char := range password {
		switch {
		case char >= 'A' && char <= 'Z':
			hasUpper = true
		case char >= 'a' && char <= 'z':
			hasLower = true
		case char >= '0' && char <= '9':
			hasNumber = true
		case (char >= '!' && char <= '/') || (char >= ':' && char <= '@') ||
		     (char >= '[' && char <= '`') || (char >= '{' && char <= '~'):
			hasSpecial = true
		}
	}

	if !hasUpper {
		return fmt.Errorf("password must contain at least one uppercase letter")
	}

	if !hasLower {
		return fmt.Errorf("password must contain at least one lowercase letter")
	}

	if !hasNumber {
		return fmt.Errorf("password must contain at least one number")
	}

	if !hasSpecial {
		return fmt.Errorf("password must contain at least one special character")
	}

	return nil
}
