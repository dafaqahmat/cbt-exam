package controllers

import (
	"fmt"
	"net/http"
	"strings"
	"time"

	"cbt-exam/backend-api/config"
	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/helpers"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
)

func examCategoryIds(exam models.Exam) []uint {
	ids := make([]uint, 0, len(exam.Categories))
	for _, cat := range exam.Categories {
		ids = append(ids, cat.Id)
	}
	return ids
}

func GetNotifyPreview(c *gin.Context) {

	examId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var exam models.Exam
	if err := database.DB.Preload("Categories").First(&exam, examId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	categoryIds := examCategoryIds(exam)

	var count int64
	if len(categoryIds) > 0 {
		database.DB.Model(&models.User{}).
			Where("role = ? AND category_id IN ? AND email != '' AND deleted_at IS NULL", "peserta", categoryIds).
			Count(&count)
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Notify Preview",
		Data: gin.H{
			"exam_title":      exam.Title,
			"categories":      exam.Categories,
			"recipient_count": count,
		},
	})
}

var indonesianMonths = []string{"", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"}

func formatIndonesianDate(value string) string {
	t, err := time.Parse("2006-01-02", value)
	if err != nil {
		return value
	}
	return fmt.Sprintf("%d %s %d", t.Day(), indonesianMonths[int(t.Month())], t.Year())
}

func buildScheduleTime(req structs.NotifyRequest) string {
	switch {
	case req.StartTime != "" && req.EndTime != "":
		return req.StartTime + " s.d. " + req.EndTime
	case req.StartTime != "":
		return req.StartTime + " s.d. selesai"
	case req.EndTime != "":
		return "s.d. " + req.EndTime
	default:
		return ""
	}
}

func buildNotifyBody(exam models.Exam, req structs.NotifyRequest, name string, username string, password string) string {
	var body strings.Builder

	body.WriteString("Halo " + name + ",\n\n")
	body.WriteString(strings.TrimSpace(req.Message) + "\n\n")

	body.WriteString("Jadwal ujian Anda:\n")
	body.WriteString("• Ujian   : " + exam.Title + "\n")
	if req.ExamDate != "" {
		body.WriteString("• Tanggal : " + formatIndonesianDate(req.ExamDate) + "\n")
	}
	if timeRange := buildScheduleTime(req); timeRange != "" {
		body.WriteString("• Waktu   : " + timeRange + "\n")
	}

	body.WriteString("\nAkun Anda:\n")
	body.WriteString("• Username: " + username + "\n")
	body.WriteString("• Password: " + password + "\n")

	return body.String()
}

func NotifyExamParticipants(c *gin.Context) {

	examId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var exam models.Exam
	if err := database.DB.Preload("Categories").First(&exam, examId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var req structs.NotifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	categoryIds := examCategoryIds(exam)

	var recipients []models.User
	if len(categoryIds) > 0 {
		database.DB.Where("role = ? AND category_id IN ? AND email != '' AND deleted_at IS NULL", "peserta", categoryIds).Find(&recipients)
	}

	if len(recipients) == 0 {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Tidak ada penerima",
			Errors:  map[string]string{"Penerima": "Tidak ada peserta dengan email terdaftar pada kategori ujian tersebut"},
		})
		return
	}

	delay := 300
	if v := config.GetEnv("SMTP_SEND_DELAY_MS", "300"); v != "" {
		if parsed, err := time.ParseDuration(v + "ms"); err == nil {
			delay = int(parsed.Milliseconds())
		}
	}

	subject := "Pemberitahuan Ujian: " + exam.Title

	sent := 0
	failed := 0
	var lastErr error

	for _, recipient := range recipients {
		// Setiap kirim: buat password acak baru untuk peserta, kirim email dulu,
		// baru simpan hash-nya hanya jika email berhasil terkirim.
		plainPassword := helpers.GenerateRandomPassword(10)
		body := buildNotifyBody(exam, req, recipient.Name, recipient.Username, plainPassword)

		err := helpers.SendEmail(recipient.Email, subject, body)
		if err != nil {
			// Retry satu kali untuk kegagalan sementara (mis. rate limit / koneksi).
			time.Sleep(500 * time.Millisecond)
			err = helpers.SendEmail(recipient.Email, subject, body)
		}

		if err != nil {
			failed++
			lastErr = err
			continue
		}

		database.DB.Model(&recipient).Update("password", helpers.HashPassword(plainPassword))

		sent++
		if delay > 0 {
			time.Sleep(time.Duration(delay) * time.Millisecond)
		}
	}

	message := "Pemberitahuan terkirim"
	if failed > 0 {
		message = "Sebagian pemberitahuan gagal terkirim"
	}
	if failed == len(recipients) {
		message = "Semua pemberitahuan gagal terkirim"
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: failed == 0,
		Message: message,
		Data: gin.H{
			"exam_title":      exam.Title,
			"total_recipients": len(recipients),
			"sent":            sent,
			"failed":          failed,
			"error":           messageIfErr(lastErr),
		},
	})
}

func messageIfErr(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}