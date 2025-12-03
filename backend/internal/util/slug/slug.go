package slug

import (
	"fmt"
	"regexp"
	"strings"

	"github.com/google/uuid"
)

// Generate generates a URL-friendly slug from a title
func Generate(title string) string {
	// Convert to lowercase
	slug := strings.ToLower(title)

	// Replace spaces with hyphens
	slug = strings.ReplaceAll(slug, " ", "-")

	// Remove special characters
	reg := regexp.MustCompile("[^a-z0-9-]+")
	slug = reg.ReplaceAllString(slug, "")

	// Remove multiple consecutive hyphens
	reg = regexp.MustCompile("-+")
	slug = reg.ReplaceAllString(slug, "-")

	// Trim hyphens from start and end
	slug = strings.Trim(slug, "-")

	// Limit length
	if len(slug) > 100 {
		slug = slug[:100]
		// Trim any partial word at the end
		if lastHyphen := strings.LastIndex(slug, "-"); lastHyphen > 0 {
			slug = slug[:lastHyphen]
		}
	}

	return slug
}

// GenerateUnique generates a unique slug by appending a short UUID
func GenerateUnique(title string) string {
	baseSlug := Generate(title)
	shortID := uuid.New().String()[:8]
	return fmt.Sprintf("%s-%s", baseSlug, shortID)
}

// MakeUnique appends a number or UUID to make a slug unique
func MakeUnique(slug string, exists func(string) bool) string {
	if !exists(slug) {
		return slug
	}

	// Try appending numbers first
	for i := 1; i <= 10; i++ {
		numbered := fmt.Sprintf("%s-%d", slug, i)
		if !exists(numbered) {
			return numbered
		}
	}

	// If still not unique, append UUID
	return GenerateUnique(slug)
}
