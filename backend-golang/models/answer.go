package models

import "time"

type Answer struct {
	Id             uint      `json:"id" gorm:"primaryKey"`
	SessionId      uint      `json:"session_id" gorm:"index;not null"`
	QuestionId     uint      `json:"question_id" gorm:"index;not null"`
	SelectedOption string    `json:"selected_option"`
	IsCorrect      bool      `json:"is_correct"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
