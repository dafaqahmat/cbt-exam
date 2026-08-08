package structs

import "cbt-exam/backend-api/models"

type SubmitSectionRequest struct {
	Answers []AnswerItem `json:"answers"`
}

type AnswerItem struct {
	QuestionId     uint   `json:"question_id"`
	SelectedOption string `json:"selected_option" binding:"omitempty,oneof=A B C D"`
}

type CurrentStateResponse struct {
	Phase                 string              `json:"phase"`
	Section               *models.ExamSection `json:"section,omitempty"`
	Questions             []models.Question   `json:"questions,omitempty"`
	RemainingSeconds      int                 `json:"remaining_seconds,omitempty"`
	BreakRemainingSeconds int                 `json:"break_remaining_seconds,omitempty"`
	NextSection           *models.ExamSection `json:"next_section,omitempty"`
	TotalScore            *float64            `json:"total_score,omitempty"`
}
