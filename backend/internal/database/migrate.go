package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"gorm.io/gorm"
)

// RunMigrations executes the schema.sql file to ensure all tables exist
func RunMigrations(db *gorm.DB) error {
	log.Println("🔄 Running database migrations...")

	// Try multiple paths for the schema file
	schemaPaths := []string{
		"migrations/schema.sql",
		"../migrations/schema.sql",
		"/app/migrations/schema.sql",
	}

	var schemaSQL []byte
	var err error
	var usedPath string

	for _, path := range schemaPaths {
		schemaSQL, err = os.ReadFile(path)
		if err == nil {
			usedPath = path
			break
		}
	}

	if err != nil {
		// Try to find it relative to executable
		execPath, _ := os.Executable()
		execDir := filepath.Dir(execPath)
		schemaPath := filepath.Join(execDir, "migrations", "schema.sql")
		schemaSQL, err = os.ReadFile(schemaPath)
		if err != nil {
			return fmt.Errorf("failed to read schema.sql from any location: %w", err)
		}
		usedPath = schemaPath
	}

	log.Printf("📁 Using schema file: %s", usedPath)

	// Execute the SQL
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}

	_, err = sqlDB.Exec(string(schemaSQL))
	if err != nil {
		return fmt.Errorf("failed to execute migrations: %w", err)
	}

	log.Println("✅ Database migrations completed successfully!")
	return nil
}
