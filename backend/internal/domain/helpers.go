package domain

import (
	"time"
)

// ParseDate parses a date string in YYYY-MM-DD format
func ParseDate(dateStr string) (time.Time, error) {
	return time.Parse("2006-01-02", dateStr)
}

// ParseDateTime parses a datetime string in RFC3339 format
func ParseDateTime(dateTimeStr string) (time.Time, error) {
	return time.Parse(time.RFC3339, dateTimeStr)
}

// FormatDate formats a time.Time to YYYY-MM-DD string
func FormatDate(t time.Time) string {
	return t.Format("2006-01-02")
}

// FormatDateTime formats a time.Time to RFC3339 string
func FormatDateTime(t time.Time) string {
	return t.Format(time.RFC3339)
}
