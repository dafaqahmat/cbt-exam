package controllers

import (
	"net/http"
	"time"
	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/helpers"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
)

type SectionScoreItem struct {
	SectionId uint     `json:"section_id"`
	Title     string   `json:"title"`
	Order     int      `json:"order"`
	Score     *float64 `json:"score"`
	Status    string   `json:"status"`
}

type AnswerReviewItem struct {
	QuestionId     uint `json:"question_id"`
	QuestionText   string `json:"question_text"`
	QuestionImage  string `json:"question_image"`
	OptionAText    string `json:"option_a_text"`
	OptionAImage   string `json:"option_a_image"`
	OptionBText    string `json:"option_b_text"`
	OptionBImage   string `json:"option_b_image"`
	OptionCText    string `json:"option_c_text"`
	OptionCImage   string `json:"option_c_image"`
	OptionDText    string `json:"option_d_text"`
	OptionDImage   string `json:"option_d_image"`
	SelectedOption string `json:"selected_option"`
	CorrectAnswer  string `json:"correct_answer"`
	IsCorrect      bool   `json:"is_correct"`
}

func buildAnswerReview(answers []models.Answer) []AnswerReviewItem {
	questionIds := make([]uint, 0, len(answers))
	for _, a := range answers {
		questionIds = append(questionIds, a.QuestionId)
	}

	questionMap := make(map[uint]models.Question)
	if len(questionIds) > 0 {
		var questions []models.Question
		database.DB.Where("id IN ?", questionIds).Find(&questions)
		for _, q := range questions {
			questionMap[q.Id] = q
		}
	}

	result := make([]AnswerReviewItem, 0, len(answers))
	for _, a := range answers {
		q, ok := questionMap[a.QuestionId]
		if !ok {
			continue
		}
		result = append(result, AnswerReviewItem{
			QuestionId:     q.Id,
			QuestionText:   q.QuestionText,
			QuestionImage:  q.QuestionImage,
			OptionAText:    q.OptionAText,
			OptionAImage:   q.OptionAImage,
			OptionBText:    q.OptionBText,
			OptionBImage:   q.OptionBImage,
			OptionCText:    q.OptionCText,
			OptionCImage:   q.OptionCImage,
			OptionDText:    q.OptionDText,
			OptionDImage:   q.OptionDImage,
			SelectedOption: a.SelectedOption,
			CorrectAnswer:  q.CorrectAnswer,
			IsCorrect:      a.IsCorrect,
		})
	}
	return result
}

func buildSectionScores(session *models.ExamSession) []SectionScoreItem {
	var attempts []models.SectionAttempt
	database.DB.Where("session_id = ?", session.Id).Find(&attempts)

	result := make([]SectionScoreItem, 0, len(attempts))
	for _, a := range attempts {
		var section models.ExamSection
		if err := database.DB.First(&section, a.SectionId).Error; err != nil {
			continue
		}
		result = append(result, SectionScoreItem{
			SectionId: section.Id,
			Title:     section.Title,
			Order:     section.Order,
			Score:     a.Score,
			Status:    a.Status,
		})
	}
	return result
}

func PesertaGetResult(c *gin.Context) {

	userId := c.MustGet("user_id").(uint)

	examId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var exam models.Exam
	if err := database.DB.First(&exam, examId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var session models.ExamSession
	if err := database.DB.Where("user_id = ? AND exam_id = ?", userId, examId).First(&session).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "You have not taken this exam",
			Errors:  map[string]string{},
		})
		return
	}

	if session.Status != "finished" {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Your exam session is not finished yet",
			Errors:  map[string]string{},
		})
		return
	}

	if !exam.ResultsPublished {
		c.JSON(http.StatusOK, structs.SuccessResponse{
			Success: true,
			Message: "Results have not been published yet",
			Data: gin.H{
				"published": false,
			},
		})
		return
	}

	var answers []models.Answer
	database.DB.Where("session_id = ?", session.Id).Find(&answers)

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Exam Result",
		Data: gin.H{
			"published":     true,
			"total_score":   session.TotalScore,
			"sections":      buildSectionScores(&session),
			"answers":       buildAnswerReview(answers),
			"finished_at":   session.FinishedAt,
			"violation_count": session.ViolationCount,
		},
	})
}

type AdminResultItem struct {
	SessionId      uint               `json:"session_id"`
	User           structs.UserResponse `json:"user"`
	Status         string             `json:"status"`
	StartedAt      time.Time          `json:"started_at"`
	FinishedAt     *time.Time         `json:"finished_at"`
	TotalScore     *float64           `json:"total_score"`
	ViolationCount int                `json:"violation_count"`
	Sections       []SectionScoreItem `json:"sections"`
}

func AdminFindExamResults(c *gin.Context) {

	examId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var exam models.Exam
	if err := database.DB.First(&exam, examId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var sessions []models.ExamSession
	database.DB.Where("exam_id = ?", exam.Id).Order("started_at ASC").Find(&sessions)

	userIds := make([]uint, 0, len(sessions))
	for _, s := range sessions {
		userIds = append(userIds, s.UserId)
	}

	userMap := make(map[uint]models.User)
	if len(userIds) > 0 {
		var users []models.User
		database.DB.Where("id IN ?", userIds).Find(&users)
		for _, u := range users {
			userMap[u.Id] = u
		}
	}

	result := make([]AdminResultItem, 0, len(sessions))
	for _, s := range sessions {
		u := userMap[s.UserId]
		result = append(result, AdminResultItem{
			SessionId: s.Id,
			User: structs.UserResponse{
				Id:       u.Id,
				Name:     u.Name,
				Username: u.Username,
				Email:    u.Email,
				Role:     u.Role,
			},
			Status:         s.Status,
			StartedAt:      s.StartedAt,
			FinishedAt:     s.FinishedAt,
			TotalScore:     s.TotalScore,
			ViolationCount: s.ViolationCount,
			Sections:       buildSectionScores(&s),
		})
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Exam Results",
		Data: gin.H{
			"exam":     exam,
			"results":  result,
		},
	})
}

func AdminFindSessionAnswers(c *gin.Context) {

	sessionId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var session models.ExamSession
	if err := database.DB.First(&session, sessionId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Session not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var answers []models.Answer
	database.DB.Where("session_id = ?", session.Id).Find(&answers)

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Session Answers",
		Data: gin.H{
			"session_id":  session.Id,
			"total_score": session.TotalScore,
			"answers":     buildAnswerReview(answers),
		},
	})
}
