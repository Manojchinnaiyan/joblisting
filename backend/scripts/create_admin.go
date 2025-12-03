//go:build ignore
// +build ignore

package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"golang.org/x/crypto/bcrypt"
)

// User status and role constants
const (
	RoleAdmin           = "ADMIN"
	StatusActive        = "ACTIVE"
	AuthProviderEmail   = "EMAIL"
	EmailVerified       = true
	TwoFactorEnabled    = false
	FailedLoginAttempts = 0
)

func main() {
	fmt.Println("=== Job Platform - Create Admin User ===\n")

	// Admin credentials
	email := "manoj@gmail.com"
	firstName := "Manoj"
	lastName := "Admin"
	password := "Admin@123!"

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

	// Check if admin already exists
	var existingID string
	err = db.QueryRow("SELECT id FROM users WHERE email = $1", email).Scan(&existingID)
	if err != sql.ErrNoRows {
		if err == nil {
			fmt.Printf("Admin with email %s already exists (ID: %s)\n", email, existingID)
			fmt.Println("\nExisting admin credentials:")
			fmt.Printf("  Email:    %s\n", email)
			fmt.Printf("  Password: %s\n", password)
			return
		}
		log.Fatalf("Error checking existing admin: %v", err)
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

	fmt.Println("Creating admin user...")

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
	fmt.Printf("\nAdmin Credentials:\n")
	fmt.Printf("  Email:    %s\n", email)
	fmt.Printf("  Password: %s\n", password)
	fmt.Printf("\nAdmin Details:\n")
	fmt.Printf("  ID:       %s\n", userID)
	fmt.Printf("  Name:     %s %s\n", firstName, lastName)
	fmt.Printf("  Role:     %s\n", RoleAdmin)
	fmt.Printf("  Status:   %s\n", StatusActive)
	fmt.Println("\nYou can now login at /admin/login with these credentials.")
}

// getEnv gets environment variable with fallback
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
