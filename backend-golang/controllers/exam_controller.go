package controllers

import (
	"fmt"
	"net/http"

	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/helpers"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ExamWithInfo struct {
	models.Exam
	SectionCount     int64 `json:"section_count"`
	QuestionCount    int64 `json:"question_count"`
	ParticipantCount int64 `json:"participant_count"`
}

func countSections(examId uint) int64 {
	var count int64
	database.DB.Model(&models.ExamSection{}).Where("exam_id = ?", examId).Count(&count)
	return count
}

func countQuestions(examId uint) int64 {
	var count int64
	database.DB.Model(&models.Question{}).
		Joins("JOIN exam_sections ON exam_sections.id = questions.section_id").
		Where("exam_sections.exam_id = ?", examId).Count(&count)
	return count
}

func examIsReadyToActivate(examId uint) bool {
	return countSections(examId) > 0 && countQuestions(examId) > 0
}

func examNotActiveError(c *gin.Context) {
	c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
		Success: false,
		Message: "Validation Errors",
		Errors:  map[string]string{"Status": "Sesi dan soal masih kosong"},
	})
}

func resetExamProgress(examId uint) {
	var sessionIds []uint
	database.DB.Model(&models.ExamSession{}).Where("exam_id = ?", examId).Pluck("id", &sessionIds)
	if len(sessionIds) == 0 {
		return
	}
	database.DB.Where("session_id IN ?", sessionIds).Delete(&models.Answer{})
	database.DB.Where("session_id IN ?", sessionIds).Delete(&models.SectionAttempt{})
	database.DB.Where("id IN ?", sessionIds).Delete(&models.ExamSession{})
}

func publishExamStatus(examId uint, status string) {
	streamHub.publish(examId, "status", fmt.Sprintf(`{"status": %q}`, status))
}

func AdminFindExams(c *gin.Context) {

	var exams []models.Exam
	database.DB.Preload("Sections", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC")
	}).Preload("Categories").Order("id DESC").Find(&exams)

	result := make([]ExamWithInfo, 0, len(exams))
	for _, exam := range exams {
		var questionCount int64
		var participantCount int64

		database.DB.Model(&models.Question{}).
			Joins("JOIN exam_sections ON exam_sections.id = questions.section_id").
			Where("exam_sections.exam_id = ?", exam.Id).Count(&questionCount)

		database.DB.Model(&models.ExamSession{}).Where("exam_id = ?", exam.Id).Count(&participantCount)

		result = append(result, ExamWithInfo{
			Exam:             exam,
			SectionCount:     int64(len(exam.Sections)),
			QuestionCount:    questionCount,
			ParticipantCount: participantCount,
		})
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Lists Data Exams",
		Data:    result,
	})
}

func CreateExam(c *gin.Context) {

	var req = structs.ExamCreateRequest{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	status := "draft"

	if len(req.CategoryIds) == 0 {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  map[string]string{"CategoryIds": "Pilih minimal satu kategori peserta"},
		})
		return
	}

	var categories []models.Category
	if len(req.CategoryIds) > 0 {
		if err := database.DB.Where("id IN ?", req.CategoryIds).Find(&categories).Error; err != nil {
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Failed to load categories",
				Errors:  helpers.TranslateErrorMessage(err),
			})
			return
		}
		if len(categories) != len(req.CategoryIds) {
			c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
				Success: false,
				Message: "Validation Errors",
				Errors:  map[string]string{"CategoryIds": "Beberapa kategori tidak valid"},
			})
			return
		}
	}

	exam := models.Exam{
		Title:       req.Title,
		Description: req.Description,
		Status:      status,
		Categories:  categories,
	}

	if err := database.DB.Create(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to create exam",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse{
		Success: true,
		Message: "Exam created successfully",
		Data:    exam,
	})
}

func UpdateExam(c *gin.Context) {

	id := c.Param("id")

	var exam models.Exam

	if err := database.DB.First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var req = structs.ExamUpdateRequest{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if len(req.CategoryIds) == 0 {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  map[string]string{"CategoryIds": "Pilih minimal satu kategori peserta"},
		})
		return
	}

	var categories []models.Category
	if err := database.DB.Where("id IN ?", req.CategoryIds).Find(&categories).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to load categories",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}
	if len(categories) != len(req.CategoryIds) {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  map[string]string{"CategoryIds": "Beberapa kategori tidak valid"},
		})
		return
	}

	if req.Status == "active" && exam.Status != "active" && !examIsReadyToActivate(exam.Id) {
		examNotActiveError(c)
		return
	}

	oldStatus := exam.Status
	exam.Title = req.Title
	exam.Description = req.Description
	if req.Status != "" {
		exam.Status = req.Status
	}

	if err := database.DB.Save(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to update exam",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if err := database.DB.Model(&exam).Association("Categories").Replace(categories); err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to update exam categories",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}
	exam.Categories = categories

	if req.Status != "" && req.Status != oldStatus {
		if req.Status == "draft" {
			resetExamProgress(exam.Id)
			publishExamStatus(exam.Id, "draft")
		}
		if req.Status == "closed" {
			publishExamStatus(exam.Id, "closed")
		}
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Exam updated successfully",
		Data:    exam,
	})
}

func DeleteExam(c *gin.Context) {

	id := c.Param("id")

	var exam models.Exam

	if err := database.DB.First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if exam.Status != "draft" && exam.Status != "closed" {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Ujian tidak dapat dihapus saat berstatus aktif",
			Errors:  map[string]string{"Status": "Hanya ujian berstatus Draft atau Closed yang dapat dihapus"},
		})
		return
	}

	if err := database.DB.Delete(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to delete exam",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Exam deleted successfully",
	})
}

func PublishExamResults(c *gin.Context) {

	id := c.Param("id")

	var exam models.Exam

	if err := database.DB.First(&exam, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	exam.ResultsPublished = true

	if err := database.DB.Save(&exam).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to publish results",
			Errors:  map[string]string{"Error": err.Error()},
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Results published successfully",
		Data:    exam,
	})
}
