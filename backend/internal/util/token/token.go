package token

import (
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"math/big"
)

// GenerateSecureToken generates a secure random token
func GenerateSecureToken(length int) (string, error) {
	bytes := make([]byte, length)
	_, err := rand.Read(bytes)
	if err != nil {
		return "", err
	}
	return base64.URLEncoding.EncodeToString(bytes), nil
}

// GenerateNumericCode generates a numeric code (for 2FA)
func GenerateNumericCode(digits int) (string, error) {
	max := new(big.Int)
	max.Exp(big.NewInt(10), big.NewInt(int64(digits)), nil)

	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}

	format := fmt.Sprintf("%%0%dd", digits)
	return fmt.Sprintf(format, n), nil
}

// GenerateRefreshTokenHash generates a hash for refresh token storage
func GenerateRefreshTokenHash() (string, error) {
	return GenerateSecureToken(32)
}
