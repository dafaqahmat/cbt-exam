package models

import "time"

type ExamSession struct {
	Id               uint       `json:"id" gorm:"primaryKey"`
	UserId           uint       `json:"user_id" gorm:"not null;uniqueIndex:idx_user_exam"`
	ExamId           uint       `json:"exam_id" gorm:"not null;uniqueIndex:idx_user_exam"`
	StartedAt        time.Time  `json:"started_at"`
	FinishedAt       *time.Time `json:"finished_at"`
	TotalScore       *float64   `json:"total_score"`
	ViolationCount   int        `json:"violation_count" gorm:"default:0"`
	CurrentSectionId *uint      `json:"current_section_id"`
	BreakStartedAt   *time.Time `json:"break_started_at"`
	Status           string     `json:"status" gorm:"not null;default:in_progress"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}
