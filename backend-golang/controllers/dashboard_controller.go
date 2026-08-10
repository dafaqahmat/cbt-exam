package controllers

import (
	"net/http"
	"time"

	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
)

type DashboardNameValue struct {
	Name  string `json:"name"`
	Value int64  `json:"value"`
}

type DashboardExamSessions struct {
	ExamTitle       string `json:"exam_title"`
	ParticipantCount int64 `json:"participant_count"`
}

type DashboardScoreBucket struct {
	Label string `json:"label"`
	Count int64  `json:"count"`
}

type DashboardRecentSession struct {
	UserName   string     `json:"user_name"`
	Username   string     `json:"username"`
	ExamTitle  string     `json:"exam_title"`
	TotalScore *float64   `json:"total_score"`
	FinishedAt *time.Time `json:"finished_at"`
}

func GetDashboard(c *gin.Context) {

	var totalPeserta, totalExams, activeExams, draftExams, closedExams int64
	database.DB.Model(&models.User{}).Where("role = ?", "peserta").Count(&totalPeserta)
	database.DB.Model(&models.Exam{}).Count(&totalExams)
	database.DB.Model(&models.Exam{}).Where("status = ?", "active").Count(&activeExams)
	database.DB.Model(&models.Exam{}).Where("status = ?", "draft").Count(&draftExams)
	database.DB.Model(&models.Exam{}).Where("status = ?", "closed").Count(&closedExams)

	var totalSessions, finishedSessions int64
	database.DB.Model(&models.ExamSession{}).Count(&totalSessions)
	database.DB.Model(&models.ExamSession{}).Where("status = ?", "finished").Count(&finishedSessions)

	// Rata-rata nilai & distribusi skor dari sesi selesai.
	var scores []*float64
	database.DB.Model(&models.ExamSession{}).
		Where("status = ? AND total_score IS NOT NULL", "finished").
		Pluck("total_score", &scores)

	var averageScore *float64
	buckets := []DashboardScoreBucket{
		{Label: "< 50"},
		{Label: "50–69"},
		{Label: "70–89"},
		{Label: "90–100"},
	}
	var scoreSum float64
	scoreCount := 0
	for _, s := range scores {
		if s == nil {
			continue
		}
		scoreSum += *s
		scoreCount++
		switch {
		case *s < 50:
			buckets[0].Count++
		case *s < 70:
			buckets[1].Count++
		case *s < 90:
			buckets[2].Count++
		default:
			buckets[3].Count++
		}
	}
	if scoreCount > 0 {
		avg := scoreSum / float64(scoreCount)
		averageScore = &avg
	}

	// Distribusi status ujian.
	var examsByStatus []DashboardNameValue
	database.DB.Model(&models.Exam{}).
		Select("status AS name, COUNT(*) AS value").
		Group("status").
		Order("value DESC").
		Scan(&examsByStatus)

	// Peserta per kategori.
	var participantsByCategory []DashboardNameValue
	database.DB.Table("users").
		Select("categories.name AS name, COUNT(users.id) AS value").
		Joins("JOIN categories ON categories.id = users.category_id").
		Where("users.role = ? AND users.deleted_at IS NULL AND categories.deleted_at IS NULL", "peserta").
		Group("categories.name").
		Order("value DESC").
		Scan(&participantsByCategory)

	// Peserta per ujian (8 besar).
	var sessionsPerExam []DashboardExamSessions
	database.DB.Table("exam_sessions").
		Select("exams.title AS exam_title, COUNT(exam_sessions.id) AS participant_count").
		Joins("JOIN exams ON exams.id = exam_sessions.exam_id").
		Where("exam_sessions.deleted_at IS NULL AND exams.deleted_at IS NULL").
		Group("exams.id, exams.title").
		Order("participant_count DESC").
		Limit(8).
		Scan(&sessionsPerExam)

	// Aktivitas terbaru (sesi selesai).
	var recentSessions []models.ExamSession
	database.DB.Where("status = ?", "finished").
		Order("finished_at DESC").
		Limit(5).
		Find(&recentSessions)

	recent := make([]DashboardRecentSession, 0, len(recentSessions))
	if len(recentSessions) > 0 {
		userIdMap := make(map[uint]models.User)
		examIdMap := make(map[uint]models.Exam)

		var userIds []uint
		var examIds []uint
		for _, s := range recentSessions {
			userIds = append(userIds, s.UserId)
			examIds = append(examIds, s.ExamId)
		}

		var users []models.User
		var exams []models.Exam
		database.DB.Where("id IN ?", userIds).Find(&users)
		database.DB.Where("id IN ?", examIds).Find(&exams)
		for _, u := range users {
			userIdMap[u.Id] = u
		}
		for _, e := range exams {
			examIdMap[e.Id] = e
		}

		for _, s := range recentSessions {
			u := userIdMap[s.UserId]
			e := examIdMap[s.ExamId]
			recent = append(recent, DashboardRecentSession{
				UserName:   u.Name,
				Username:   u.Username,
				ExamTitle:  e.Title,
				TotalScore: s.TotalScore,
				FinishedAt: s.FinishedAt,
			})
		}
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Dashboard Stats",
		Data: gin.H{
			"total_peserta":            totalPeserta,
			"total_exams":              totalExams,
			"active_exams":             activeExams,
			"draft_exams":              draftExams,
			"closed_exams":             closedExams,
			"total_sessions":           totalSessions,
			"finished_sessions":        finishedSessions,
			"average_score":            averageScore,
			"exams_by_status":          examsByStatus,
			"participants_by_category": participantsByCategory,
			"sessions_per_exam":        sessionsPerExam,
			"score_distribution":       buckets,
			"recent_sessions":          recent,
		},
	})
}