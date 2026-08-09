package controllers

import (
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

	status := req.Status
	if status == "" {
		status = "draft"
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
