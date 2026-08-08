package models

import "time"

type ExamSection struct {
	Id                uint      `json:"id" gorm:"primaryKey"`
	ExamId            uint      `json:"exam_id" gorm:"index;not null"`
	Title             string    `json:"title" gorm:"not null"`
	Order             int       `json:"order" gorm:"column:sort_order;not null"`
	DurationMinutes   int       `json:"duration_minutes" gorm:"not null"`
	BreakAfterSeconds int       `json:"break_after_seconds" gorm:"default:0"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}
