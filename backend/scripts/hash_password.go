package main

import (
	"fmt"
	"log"
	"os"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	if len(os.Args) < 2 {
		log.Fatal("Usage: go run hash_password.go <password>")
	}

	password := os.Args[1]
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	if err != nil {
		log.Fatalf("Failed to hash password: %v", err)
	}

	fmt.Println(string(hash))
}
