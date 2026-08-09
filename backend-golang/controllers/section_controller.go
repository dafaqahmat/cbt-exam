package controllers

import (
	"net/http"
	"strconv"
	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/helpers"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
)

// ===== helper internal =====

func sectionExamIsActive(examId uint, field string) (*structs.ErrorResponse, error) {
	var exam models.Exam
	if err := database.DB.First(&exam, examId).Error; err != nil {
		return &structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		}, err
	}
	if exam.Status == "active" {
		return &structs.ErrorResponse{
			Success: false,
			Message: "Exam is active",
			Errors:  map[string]string{field: "Ujian masih aktif, ubah ke Draft dulu sebelum mengubah atau menghapus"},
		}, nil
	}
	return nil, nil
}

func FindSections(c *gin.Context) {

	examId := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, examId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var sections []models.ExamSection
	database.DB.Where("exam_id = ?", exam.Id).Order("sort_order ASC").Find(&sections)

	type SectionWithCount struct {
		models.ExamSection
		QuestionCount int64 `json:"question_count"`
	}

	result := make([]SectionWithCount, 0, len(sections))
	for _, section := range sections {
		var count int64
		database.DB.Model(&models.Question{}).Where("section_id = ?", section.Id).Count(&count)
		result = append(result, SectionWithCount{
			ExamSection:   section,
			QuestionCount: count,
		})
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Lists Data Sections",
		Data:    result,
	})
}

func CreateSection(c *gin.Context) {

	examId := c.Param("id")

	var exam models.Exam
	if err := database.DB.First(&exam, examId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var req = structs.SectionRequest{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var duplicate int64
	database.DB.Model(&models.ExamSection{}).
		Where("exam_id = ? AND sort_order = ?", exam.Id, req.Order).Count(&duplicate)
	if duplicate > 0 {
		c.JSON(http.StatusConflict, structs.ErrorResponse{
			Success: false,
			Message: "Section order already used in this exam",
			Errors:  map[string]string{"Order": "Order already exists, choose another number"},
		})
		return
	}

	section := models.ExamSection{
		ExamId:            exam.Id,
		Title:             req.Title,
		Order:             req.Order,
		DurationMinutes:   req.DurationMinutes,
		BreakAfterSeconds: req.BreakAfterSeconds,
	}

	if err := database.DB.Create(&section).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to create section",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse{
		Success: true,
		Message: "Section created successfully",
		Data:    section,
	})
}

func UpdateSection(c *gin.Context) {

	id := c.Param("id")

	var section models.ExamSection

	if err := database.DB.First(&section, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if errResp, err := sectionExamIsActive(section.ExamId, "Section"); errResp != nil || err != nil {
		c.JSON(http.StatusUnprocessableEntity, errResp)
		return
	}

	var req = structs.SectionRequest{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var duplicate int64
	database.DB.Model(&models.ExamSection{}).
		Where("exam_id = ? AND sort_order = ? AND id != ?", section.ExamId, req.Order, section.Id).Count(&duplicate)
	if duplicate > 0 {
		c.JSON(http.StatusConflict, structs.ErrorResponse{
			Success: false,
			Message: "Section order already used in this exam",
			Errors:  map[string]string{"Order": "Order already exists, choose another number"},
		})
		return
	}

	section.Title = req.Title
	section.Order = req.Order
	section.DurationMinutes = req.DurationMinutes
	section.BreakAfterSeconds = req.BreakAfterSeconds

	if err := database.DB.Save(&section).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to update section",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Section updated successfully",
		Data:    section,
	})
}

func DeleteSection(c *gin.Context) {

	id := c.Param("id")

	var section models.ExamSection

	if err := database.DB.First(&section, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if errResp, err := sectionExamIsActive(section.ExamId, "Section"); errResp != nil || err != nil {
		c.JSON(http.StatusUnprocessableEntity, errResp)
		return
	}

	var inProgress int64
	database.DB.Model(&models.ExamSession{}).
		Where("current_section_id = ? AND status = ?", section.Id, "in_progress").Count(&inProgress)
	if inProgress > 0 {
		c.JSON(http.StatusConflict, structs.ErrorResponse{
			Success: false,
			Message: "Cannot delete section while participants are taking it",
			Errors:  map[string]string{},
		})
		return
	}

	database.DB.Where("section_id = ?", section.Id).Delete(&models.Question{})

	if err := database.DB.Delete(&section).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to delete section",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Section deleted successfully",
	})
}

// parseUintParam mengubah param URL menjadi uint
func parseUintParam(c *gin.Context, name string) (uint, bool) {
	value, err := strconv.ParseUint(c.Param(name), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Invalid id parameter",
			Errors:  map[string]string{},
		})
		return 0, false
	}
	return uint(value), true
}
