package database

import (
	"fmt"
	"log"
	"cbt-exam/backend-api/config"
	"cbt-exam/backend-api/helpers"
	"cbt-exam/backend-api/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {

	dbUser := config.GetEnv("DB_USER", "root")
	dbPass := config.GetEnv("DB_PASS", "")
	dbHost := config.GetEnv("DB_HOST", "localhost")
	dbPort := config.GetEnv("DB_PORT", "3306")
	dbName := config.GetEnv("DB_NAME", "")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		dbUser, dbPass, dbHost, dbPort, dbName)

	var err error
	DB, err = gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	fmt.Println("Database connected successfully!")

	err = DB.AutoMigrate(
		&models.User{},
		&models.Exam{},
		&models.ExamSection{},
		&models.Question{},
		&models.ExamSession{},
		&models.SectionAttempt{},
		&models.Answer{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	fmt.Println("Database migrated successfully!")

	seedAdmin()
}

func seedAdmin() {
	var count int64
	DB.Model(&models.User{}).Where("role = ?", "admin").Count(&count)
	if count > 0 {
		return
	}

	admin := models.User{
		Name:     config.GetEnv("ADMIN_NAME", "Administrator"),
		Username: config.GetEnv("ADMIN_USERNAME", "admin"),
		Email:    config.GetEnv("ADMIN_EMAIL", "admin@cbt.local"),
		Password: helpers.HashPassword(config.GetEnv("ADMIN_PASSWORD", "admin123")),
		Role:     "admin",
	}

	if err := DB.Create(&admin).Error; err != nil {
		log.Println("Failed to seed admin:", err)
		return
	}

	fmt.Println("Admin account seeded successfully! Username:", admin.Username)
}
