package database

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"gorm.io/gorm"
)

// MigrationRecord tracks which migrations have been applied
type MigrationRecord struct {
	ID        uint   `gorm:"primaryKey"`
	Name      string `gorm:"uniqueIndex;size:255"`
	AppliedAt string `gorm:"autoCreateTime"`
}

func (MigrationRecord) TableName() string {
	return "schema_migrations"
}

// RunMigrations executes the schema.sql file and all numbered migration files
func RunMigrations(db *gorm.DB) error {
	log.Println("🔄 Running database migrations...")

	// First, ensure the migrations tracking table exists
	if err := db.AutoMigrate(&MigrationRecord{}); err != nil {
		return fmt.Errorf("failed to create migrations tracking table: %w", err)
	}

	// Find migrations directory
	migrationsDir := findMigrationsDir()
	if migrationsDir == "" {
		return fmt.Errorf("migrations directory not found")
	}

	log.Printf("📁 Using migrations directory: %s", migrationsDir)

	// List all files in migrations directory for debugging
	entries, err := os.ReadDir(migrationsDir)
	if err != nil {
		log.Printf("⚠️  Warning: could not list migrations directory: %v", err)
	} else {
		log.Printf("📂 Files in migrations directory:")
		for _, entry := range entries {
			log.Printf("   - %s", entry.Name())
		}
	}

	// Step 1: Run schema.sql first (base schema)
	schemaPath := filepath.Join(migrationsDir, "schema.sql")
	if err := runMigrationFile(db, schemaPath, "schema.sql"); err != nil {
		return err
	}

	// Step 2: Find and run all numbered migration files
	migrationFiles, err := findNumberedMigrations(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to find migration files: %w", err)
	}

	log.Printf("📋 Found %d numbered migration files: %v", len(migrationFiles), migrationFiles)

	// Run each migration in order
	for _, migFile := range migrationFiles {
		migPath := filepath.Join(migrationsDir, migFile)
		if err := runMigrationFile(db, migPath, migFile); err != nil {
			return err
		}
	}

	log.Println("✅ Database migrations completed successfully!")
	return nil
}

// findMigrationsDir finds the migrations directory
func findMigrationsDir() string {
	// Try multiple paths
	paths := []string{
		"migrations",
		"../migrations",
		"/app/migrations",
	}

	for _, path := range paths {
		if info, err := os.Stat(path); err == nil && info.IsDir() {
			return path
		}
	}

	// Try relative to executable
	execPath, err := os.Executable()
	if err == nil {
		execDir := filepath.Dir(execPath)
		migPath := filepath.Join(execDir, "migrations")
		if info, err := os.Stat(migPath); err == nil && info.IsDir() {
			return migPath
		}
	}

	return ""
}

// findNumberedMigrations finds all numbered migration files (e.g., 001_xxx.sql, 002_xxx.sql)
func findNumberedMigrations(dir string) ([]string, error) {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	var migrations []string
	for _, entry := range entries {
		name := entry.Name()
		// Match files like 001_xxx.sql, 002_xxx.sql, etc.
		if strings.HasSuffix(name, ".sql") && name != "schema.sql" {
			// Check if it starts with a number
			if len(name) >= 3 && name[0] >= '0' && name[0] <= '9' {
				migrations = append(migrations, name)
			}
		}
	}

	// Sort migrations by filename (which sorts by number prefix)
	sort.Strings(migrations)

	return migrations, nil
}

// runMigrationFile runs a single migration file if it hasn't been applied yet
func runMigrationFile(db *gorm.DB, filePath string, fileName string) error {
	// Check if this migration has already been applied
	var existing MigrationRecord
	result := db.Where("name = ?", fileName).First(&existing)
	if result.Error == nil {
		log.Printf("⏭️  Skipping %s (already applied)", fileName)
		return nil
	}

	// Read the SQL file
	sqlContent, err := os.ReadFile(filePath)
	if err != nil {
		// For schema.sql, this is critical
		if fileName == "schema.sql" {
			return fmt.Errorf("failed to read %s: %w", fileName, err)
		}
		// For other files, just log and continue
		log.Printf("⚠️  Warning: could not read %s: %v", fileName, err)
		return nil
	}

	log.Printf("▶️  Running migration: %s", fileName)

	// Execute the SQL
	sqlDB, err := db.DB()
	if err != nil {
		return fmt.Errorf("failed to get database connection: %w", err)
	}

	_, err = sqlDB.Exec(string(sqlContent))
	if err != nil {
		return fmt.Errorf("failed to execute migration %s: %w", fileName, err)
	}

	// Record that this migration was applied
	db.Create(&MigrationRecord{Name: fileName})

	log.Printf("✅ Applied migration: %s", fileName)
	return nil
}
