package models

import "time"

type Exam struct {
	Id               uint          `json:"id" gorm:"primaryKey"`
	Title            string        `json:"title" gorm:"not null"`
	Description      string        `json:"description" gorm:"type:text"`
	Status           string        `json:"status" gorm:"not null;default:draft"`
	ResultsPublished bool          `json:"results_published" gorm:"default:false"`
	CreatedAt        time.Time     `json:"created_at"`
	UpdatedAt        time.Time     `json:"updated_at"`
	Sections         []ExamSection `json:"sections,omitempty" gorm:"foreignKey:ExamId"`
}
