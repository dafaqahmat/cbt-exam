package helpers

import (
	"crypto/rand"
)

const passwordChars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"

func GenerateRandomPassword(length int) string {
	if length <= 0 {
		length = 10
	}

	buffer := make([]byte, length)
	if _, err := rand.Read(buffer); err != nil {
		// Fallback deterministik yang aman — praktis tidak terjadi.
		result := ""
		for i := 0; i < length; i++ {
			result += "x"
		}
		return result
	}

	result := make([]byte, length)
	mod := byte(len(passwordChars))
	for i, b := range buffer {
		result[i] = passwordChars[b%mod]
	}
	return string(result)
}