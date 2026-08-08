package models

import "time"

type User struct {
	Id           uint      `json:"id" gorm:"primaryKey"`
	Name         string    `json:"name" gorm:"not null"`
	Username     string    `json:"username" gorm:"unique;not null"`
	Email        string    `json:"email"`
	Password     string    `json:"-" gorm:"not null"`
	Role         string    `json:"role" gorm:"not null;default:peserta"`
	CategoryId   *uint     `json:"category_id" gorm:"index"`
	CategoryName string    `json:"category_name" gorm:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}
