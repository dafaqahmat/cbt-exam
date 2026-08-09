package models

import (
	"time"

	"gorm.io/gorm"
)

type ExamSection struct {
	Id                uint           `json:"id" gorm:"primaryKey"`
	ExamId            uint           `json:"exam_id" gorm:"index;not null"`
	Title             string         `json:"title" gorm:"type:varchar(255);not null"`
	Order             int            `json:"order" gorm:"column:sort_order;not null"`
	DurationMinutes   int            `json:"duration_minutes" gorm:"not null"`
	BreakAfterSeconds int            `json:"break_after_seconds" gorm:"default:0"`
	CreatedAt         time.Time      `json:"created_at"`
	UpdatedAt         time.Time      `json:"updated_at"`
	DeletedAt         gorm.DeletedAt `json:"-"`

	Exam      *Exam       `json:"-"`
	Questions []*Question `json:"questions,omitempty" gorm:"foreignKey:SectionId"`
}