package controllers

import (
	"net/http"
	"strconv"
	"time"

	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
)

type ReportExamItem struct {
	ExamId           uint     `json:"exam_id"`
	ExamTitle        string   `json:"exam_title"`
	ExamStatus       string   `json:"exam_status"`
	ParticipantCount int64    `json:"participant_count"`
	FinishedCount    int64    `json:"finished_count"`
	AverageScore     *float64 `json:"average_score"`
	MaxScore         *float64 `json:"max_score"`
	MinScore         *float64 `json:"min_score"`
}

func parseReportDate(value string) (time.Time, bool) {
	if value == "" {
		return time.Time{}, true
	}
	t, err := time.Parse("2006-01-02", value)
	if err != nil {
		return time.Time{}, false
	}
	return t, true
}

func GenerateReport(c *gin.Context) {

	start, startOk := parseReportDate(c.Query("start"))
	if !startOk {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Invalid start date, gunakan format YYYY-MM-DD",
			Errors:  map[string]string{},
		})
		return
	}

	end, endOk := parseReportDate(c.Query("end"))
	if !endOk {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Invalid end date, gunakan format YYYY-MM-DD",
			Errors:  map[string]string{},
		})
		return
	}

	hasStart := c.Query("start") != ""
	hasEnd := c.Query("end") != ""

	if hasStart && hasEnd && start.After(end) {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Tanggal awal tidak boleh lebih besar dari tanggal akhir",
			Errors:  map[string]string{},
		})
		return
	}

	var examId uint
	examIdStr := c.Query("exam_id")
	if examIdStr != "" {
		id, err := strconv.ParseUint(examIdStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, structs.ErrorResponse{
				Success: false,
				Message: "Invalid exam_id parameter",
				Errors:  map[string]string{},
			})
			return
		}
		examId = uint(id)
	}

	var categoryId uint
	categoryIdStr := c.Query("category_id")
	if categoryIdStr != "" {
		id, err := strconv.ParseUint(categoryIdStr, 10, 64)
		if err != nil {
			c.JSON(http.StatusBadRequest, structs.ErrorResponse{
				Success: false,
				Message: "Invalid category_id parameter",
				Errors:  map[string]string{},
			})
			return
		}
		categoryId = uint(id)
	}

	query := database.DB.Model(&models.ExamSession{}).
		Joins("JOIN users ON users.id = exam_sessions.user_id").
		Joins("JOIN exams ON exams.id = exam_sessions.exam_id").
		Where("exam_sessions.deleted_at IS NULL").
		Where("users.deleted_at IS NULL").
		Where("exams.deleted_at IS NULL")

	if hasStart {
		query = query.Where("exam_sessions.started_at >= ?", start)
	}

	if hasEnd {
		query = query.Where("exam_sessions.started_at < ?", end.Add(24*time.Hour))
	}

	if examIdStr != "" {
		query = query.Where("exam_sessions.exam_id = ?", examId)
	}

	if categoryIdStr != "" {
		query = query.Where("users.category_id = ?", categoryId)
	}

	var items []ReportExamItem
	query.Select(
		"exam_sessions.exam_id AS exam_id",
		"exams.title AS exam_title",
		"exams.status AS exam_status",
		"COUNT(*) AS participant_count",
		"SUM(CASE WHEN exam_sessions.status = 'finished' THEN 1 ELSE 0 END) AS finished_count",
		"AVG(CASE WHEN exam_sessions.status = 'finished' THEN exam_sessions.total_score END) AS average_score",
		"MAX(CASE WHEN exam_sessions.status = 'finished' THEN exam_sessions.total_score END) AS max_score",
		"MIN(CASE WHEN exam_sessions.status = 'finished' THEN exam_sessions.total_score END) AS min_score",
	).
		Group("exam_sessions.exam_id, exams.title, exams.status").
		Order("exams.title ASC").
		Scan(&items)

	var totalParticipants int64
	for _, item := range items {
		totalParticipants += item.ParticipantCount
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Exam Report",
		Data: gin.H{
			"total_exams":       len(items),
			"total_participants": totalParticipants,
			"exams":             items,
		},
	})
}