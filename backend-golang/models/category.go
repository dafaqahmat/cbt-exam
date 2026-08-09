package models

import (
	"time"

	"gorm.io/gorm"
)

type Category struct {
	Id        uint           `json:"id" gorm:"primaryKey"`
	Name      string         `json:"name" gorm:"type:varchar(255);not null"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-"`

	Exams []Exam `json:"exams,omitempty" gorm:"many2many:exam_categories"`
}