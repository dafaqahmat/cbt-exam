package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	Id           uint           `json:"id" gorm:"primaryKey"`
	Name         string         `json:"name" gorm:"type:varchar(255);not null"`
	Username     string         `json:"username" gorm:"type:varchar(255);not null"`
	Email        string         `json:"email" gorm:"type:varchar(255)"`
	Password     string         `json:"-" gorm:"not null"`
	Role         string         `json:"role" gorm:"not null;default:peserta"`
	CategoryId   *uint          `json:"category_id" gorm:"index"`
	CategoryName string         `json:"category_name" gorm:"-"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `json:"-"`

	Category *Category `json:"category,omitempty" gorm:"foreignKey:CategoryId;constraint:OnUpdate:CASCADE,OnDelete:SET NULL"`
}