package controllers

import (
	"net/http"
	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/helpers"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
)

func toAdminQuestionResponse(q models.Question) structs.AdminQuestionResponse {
	return structs.AdminQuestionResponse{
		Id:            q.Id,
		SectionId:     q.SectionId,
		QuestionText:  q.QuestionText,
		QuestionImage: q.QuestionImage,
		OptionAText:   q.OptionAText,
		OptionAImage:  q.OptionAImage,
		OptionBText:   q.OptionBText,
		OptionBImage:  q.OptionBImage,
		OptionCText:   q.OptionCText,
		OptionCImage:  q.OptionCImage,
		OptionDText:   q.OptionDText,
		OptionDImage:  q.OptionDImage,
		CorrectAnswer: q.CorrectAnswer,
		Points:        q.Points,
		CreatedAt:     q.CreatedAt.Format("2006-01-02 15:04:05"),
		UpdatedAt:     q.UpdatedAt.Format("2006-01-02 15:04:05"),
	}
}

func AdminFindQuestions(c *gin.Context) {

	sectionId := c.Param("id")

	var section models.ExamSection
	if err := database.DB.First(&section, sectionId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var questions []models.Question
	database.DB.Where("section_id = ?", section.Id).Order("id ASC").Find(&questions)

	result := make([]structs.AdminQuestionResponse, 0, len(questions))
	for _, q := range questions {
		result = append(result, toAdminQuestionResponse(q))
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Lists Data Questions",
		Data:    result,
	})
}

func AdminFindQuestionById(c *gin.Context) {

	id := c.Param("id")

	var question models.Question

	if err := database.DB.First(&question, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Question not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Question Found",
		Data:    toAdminQuestionResponse(question),
	})
}

func CreateQuestion(c *gin.Context) {

	sectionId := c.Param("id")

	var section models.ExamSection
	if err := database.DB.First(&section, sectionId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var req = structs.QuestionRequest{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	points := req.Points
	if points <= 0 {
		points = 1
	}

	question := models.Question{
		SectionId:     section.Id,
		QuestionText:  req.QuestionText,
		QuestionImage: req.QuestionImage,
		OptionAText:   req.OptionAText,
		OptionAImage:  req.OptionAImage,
		OptionBText:   req.OptionBText,
		OptionBImage:  req.OptionBImage,
		OptionCText:   req.OptionCText,
		OptionCImage:  req.OptionCImage,
		OptionDText:   req.OptionDText,
		OptionDImage:  req.OptionDImage,
		CorrectAnswer: req.CorrectAnswer,
		Points:        points,
	}

	if err := database.DB.Create(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to create question",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse{
		Success: true,
		Message: "Question created successfully",
		Data:    toAdminQuestionResponse(question),
	})
}

func UpdateQuestion(c *gin.Context) {

	id := c.Param("id")

	var question models.Question

	if err := database.DB.First(&question, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Question not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var section models.ExamSection
	if err := database.DB.First(&section, question.SectionId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if errResp, err := sectionExamIsActive(section.ExamId, "Question"); errResp != nil || err != nil {
		c.JSON(http.StatusUnprocessableEntity, errResp)
		return
	}

	var req = structs.QuestionRequest{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	question.QuestionText = req.QuestionText
	question.QuestionImage = req.QuestionImage
	question.OptionAText = req.OptionAText
	question.OptionAImage = req.OptionAImage
	question.OptionBText = req.OptionBText
	question.OptionBImage = req.OptionBImage
	question.OptionCText = req.OptionCText
	question.OptionCImage = req.OptionCImage
	question.OptionDText = req.OptionDText
	question.OptionDImage = req.OptionDImage
	question.CorrectAnswer = req.CorrectAnswer
	if req.Points > 0 {
		question.Points = req.Points
	}

	if err := database.DB.Save(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to update question",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Question updated successfully",
		Data:    toAdminQuestionResponse(question),
	})
}

func DeleteQuestion(c *gin.Context) {

	id := c.Param("id")

	var question models.Question

	if err := database.DB.First(&question, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Question not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var section models.ExamSection
	if err := database.DB.First(&section, question.SectionId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if errResp, err := sectionExamIsActive(section.ExamId, "Question"); errResp != nil || err != nil {
		c.JSON(http.StatusUnprocessableEntity, errResp)
		return
	}

	if err := database.DB.Delete(&question).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to delete question",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Question deleted successfully",
	})
}
