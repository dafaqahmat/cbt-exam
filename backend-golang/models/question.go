package models

import (
	"time"

	"gorm.io/gorm"
)

type Question struct {
	Id            uint           `json:"id" gorm:"primaryKey"`
	SectionId     uint           `json:"section_id" gorm:"index;not null"`
	QuestionText  string         `json:"question_text" gorm:"type:text"`
	QuestionImage string         `json:"question_image"`
	OptionAText   string         `json:"option_a_text" gorm:"type:text"`
	OptionAImage  string         `json:"option_a_image"`
	OptionBText   string         `json:"option_b_text" gorm:"type:text"`
	OptionBImage  string         `json:"option_b_image"`
	OptionCText   string         `json:"option_c_text" gorm:"type:text"`
	OptionCImage  string         `json:"option_c_image"`
	OptionDText   string         `json:"option_d_text" gorm:"type:text"`
	OptionDImage  string         `json:"option_d_image"`
	CorrectAnswer string         `json:"-" gorm:"not null"`
	Points        int            `json:"points" gorm:"default:1"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `json:"-"`

	Section *ExamSection `json:"-"`
}