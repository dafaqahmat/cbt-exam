package models

import "time"

type SectionAttempt struct {
	Id         uint       `json:"id" gorm:"primaryKey"`
	SessionId  uint       `json:"session_id" gorm:"index;not null"`
	SectionId  uint       `json:"section_id" gorm:"index;not null"`
	StartedAt  time.Time  `json:"started_at"`
	FinishedAt *time.Time `json:"finished_at"`
	Score      *float64   `json:"score"`
	Status     string     `json:"status" gorm:"not null;default:in_progress"`
	CreatedAt  time.Time  `json:"created_at"`
	UpdatedAt  time.Time  `json:"updated_at"`
}
