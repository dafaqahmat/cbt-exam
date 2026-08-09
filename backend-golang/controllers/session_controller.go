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

// ===== helper internal =====

func sectionDeadline(attempt *models.SectionAttempt, section *models.ExamSection) time.Time {
	return attempt.StartedAt.Add(time.Duration(section.DurationMinutes) * time.Minute)
}

func attemptRemainingSeconds(attempt *models.SectionAttempt, section *models.ExamSection) int {
	remaining := int(time.Until(sectionDeadline(attempt, section)).Seconds())
	if remaining < 0 {
		return 0
	}
	return remaining
}

func findNextSection(examId uint, currentOrder int) *models.ExamSection {
	var section models.ExamSection
	err := database.DB.
		Where("exam_id = ? AND sort_order > ?", examId, currentOrder).
		Order("sort_order ASC").First(&section).Error
	if err != nil {
		return nil
	}
	return &section
}

func gradeAttempt(attempt *models.SectionAttempt, section *models.ExamSection, submitted []structs.AnswerItem) float64 {
	if attempt.Status != "in_progress" {
		if attempt.Score != nil {
			return *attempt.Score
		}
		return 0
	}

	var questions []models.Question
	database.DB.Where("section_id = ?", section.Id).Find(&questions)

	answerMap := make(map[uint]string)
	for _, a := range submitted {
		answerMap[a.QuestionId] = a.SelectedOption
	}

	var score float64
	now := time.Now()
	for _, q := range questions {
		selected := answerMap[q.Id]
		isCorrect := selected != "" && selected == q.CorrectAnswer
		if isCorrect {
			score += float64(q.Points)
		}
		database.DB.Create(&models.Answer{
			SessionId:      attempt.SessionId,
			QuestionId:     q.Id,
			SelectedOption: selected,
			IsCorrect:      isCorrect,
		})
	}

	attempt.FinishedAt = &now
	attempt.Score = &score
	attempt.Status = "finished"
	database.DB.Save(attempt)
	return score
}

func startAttempt(session *models.ExamSession, section *models.ExamSection) *models.SectionAttempt {
	var existing models.SectionAttempt
	err := database.DB.
		Where("session_id = ? AND section_id = ?", session.Id, section.Id).
		First(&existing).Error
	if err == nil {
		session.CurrentSectionId = &section.Id
		session.BreakStartedAt = nil
		database.DB.Save(session)
		return &existing
	}

	now := time.Now()
	attempt := models.SectionAttempt{
		SessionId: session.Id,
		SectionId: section.Id,
		StartedAt: now,
		Status:    "in_progress",
	}
	database.DB.Create(&attempt)

	session.CurrentSectionId = &section.Id
	session.BreakStartedAt = nil
	database.DB.Save(session)
	return &attempt
}

func buildQuestionsState(section *models.ExamSection, attempt *models.SectionAttempt) structs.CurrentStateResponse {
	var questions []models.Question
	database.DB.Where("section_id = ?", section.Id).Order("id ASC").Find(&questions)

	return structs.CurrentStateResponse{
		Phase:            "questions",
		Section:          section,
		Questions:        questions,
		RemainingSeconds: attemptRemainingSeconds(attempt, section),
	}
}

func finishExam(session *models.ExamSession) structs.CurrentStateResponse {
	now := time.Now()

	var attempts []models.SectionAttempt
	database.DB.Where("session_id = ?", session.Id).Find(&attempts)

	var total float64
	for _, a := range attempts {
		if a.Score != nil {
			total += *a.Score
		}
	}

	session.Status = "finished"
	session.FinishedAt = &now
	session.TotalScore = &total
	session.CurrentSectionId = nil
	session.BreakStartedAt = nil
	database.DB.Save(session)

	return structs.CurrentStateResponse{
		Phase:      "finished",
		TotalScore: &total,
	}
}

func advanceAfterSection(session *models.ExamSession, current *models.ExamSection) structs.CurrentStateResponse {
	next := findNextSection(current.ExamId, current.Order)
	if next == nil {
		return finishExam(session)
	}

	if current.BreakAfterSeconds > 0 {
		now := time.Now()
		session.BreakStartedAt = &now
		database.DB.Save(session)
		return structs.CurrentStateResponse{
			Phase:                 "break",
			BreakRemainingSeconds: current.BreakAfterSeconds,
			NextSection:           next,
		}
	}

	attempt := startAttempt(session, next)
	return buildQuestionsState(next, attempt)
}

func getActiveSession(userId uint, examId uint) (*models.ExamSession, error) {
	var session models.ExamSession
	err := database.DB.
		Where("user_id = ? AND exam_id = ? AND status = ?", userId, examId, "in_progress").
		First(&session).Error
	if err != nil {
		return nil, err
	}
	return &session, nil
}

// ===== endpoint peserta =====

type ExamSessionInfo struct {
	Status         string    `json:"status"`
	ViolationCount int       `json:"violation_count"`
	TotalScore     *float64  `json:"total_score"`
	StartedAt      time.Time `json:"started_at"`
}

type ExamListItem struct {
	models.Exam
	SectionCount         int64            `json:"section_count"`
	TotalDurationMinutes int64            `json:"total_duration_minutes"`
	Session              *ExamSessionInfo `json:"session"`
}

func PesertaFindExams(c *gin.Context) {

	userId := c.MustGet("user_id").(uint)

	var user models.User
	if err := database.DB.First(&user, userId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to load user",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var sessions []models.ExamSession
	database.DB.Where("user_id = ?", userId).Find(&sessions)

	sessionByExam := make(map[uint]models.ExamSession)
	examIdsWithSession := make([]uint, 0)
	for _, s := range sessions {
		sessionByExam[s.ExamId] = s
		examIdsWithSession = append(examIdsWithSession, s.ExamId)
	}

	var exams []models.Exam
	query := database.DB.Where("status = ?", "active")
	if user.CategoryId != nil {
		var categoryExamIds []uint
		database.DB.Table("exam_categories").
			Where("category_id = ?", *user.CategoryId).
			Pluck("exam_id", &categoryExamIds)
		if len(categoryExamIds) > 0 {
			query = query.Where("id IN ?", categoryExamIds)
		} else {
			query = query.Where("1 = 0")
		}
	} else {
		query = query.Where("1 = 0")
	}
	if len(examIdsWithSession) > 0 {
		query = query.Or("id IN ?", examIdsWithSession)
	}
	query.Order("id DESC").Find(&exams)

	result := make([]ExamListItem, 0, len(exams))
	for _, exam := range exams {
		var sectionCount int64
		var totalDuration int64
		database.DB.Model(&models.ExamSection{}).Where("exam_id = ?", exam.Id).Count(&sectionCount)
		database.DB.Model(&models.ExamSection{}).Where("exam_id = ?", exam.Id).
			Select("COALESCE(SUM(duration_minutes), 0)").Scan(&totalDuration)

		item := ExamListItem{
			Exam:                 exam,
			SectionCount:         sectionCount,
			TotalDurationMinutes: totalDuration,
		}

		if s, ok := sessionByExam[exam.Id]; ok {
			info := ExamSessionInfo{
				Status:         s.Status,
				ViolationCount: s.ViolationCount,
				StartedAt:      s.StartedAt,
			}
			if exam.ResultsPublished {
				info.TotalScore = s.TotalScore
			}
			item.Session = &info
		}

		result = append(result, item)
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Lists Available Exams",
		Data:    result,
	})
}

func StartExam(c *gin.Context) {

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

	if exam.Status != "active" {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Exam is not active",
			Errors:  map[string]string{},
		})
		return
	}

	var user models.User
	if err := database.DB.First(&user, userId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to load user",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if user.CategoryId != nil {
		var granted int64
		database.DB.Table("exam_categories").
			Where("exam_id = ? AND category_id = ?", examId, *user.CategoryId).
			Count(&granted)
		if granted == 0 {
			c.JSON(http.StatusForbidden, structs.ErrorResponse{
				Success: false,
				Message: "Ujian tidak untuk kategori Anda",
				Errors:  map[string]string{},
			})
			return
		}
	} else {
		c.JSON(http.StatusForbidden, structs.ErrorResponse{
			Success: false,
			Message: "Ujian tidak untuk kategori Anda",
			Errors:  map[string]string{},
		})
		return
	}

	var existingCount int64
	database.DB.Model(&models.ExamSession{}).
		Where("user_id = ? AND exam_id = ?", userId, examId).Count(&existingCount)
	if existingCount > 0 {
		c.JSON(http.StatusConflict, structs.ErrorResponse{
			Success: false,
			Message: "You have already started this exam",
			Errors:  map[string]string{},
		})
		return
	}

	var firstSection models.ExamSection
	if err := database.DB.Where("exam_id = ?", examId).Order("sort_order ASC").First(&firstSection).Error; err != nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "This exam has no sections yet",
			Errors:  map[string]string{},
		})
		return
	}

	now := time.Now()
	session := models.ExamSession{
		UserId:           userId,
		ExamId:           exam.Id,
		StartedAt:        now,
		CurrentSectionId: &firstSection.Id,
		Status:           "in_progress",
	}
	if err := database.DB.Create(&session).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to start exam",
			Errors:  map[string]string{"Error": err.Error()},
		})
		return
	}

	attempt := startAttempt(&session, &firstSection)

	c.JSON(http.StatusCreated, structs.SuccessResponse{
		Success: true,
		Message: "Exam started successfully",
		Data:    buildQuestionsState(&firstSection, attempt),
	})
}

func GetCurrentState(c *gin.Context) {

	userId := c.MustGet("user_id").(uint)

	examId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var session models.ExamSession
	if err := database.DB.Where("user_id = ? AND exam_id = ?", userId, examId).First(&session).Error; err != nil {
		c.JSON(http.StatusOK, structs.SuccessResponse{
			Success: true,
			Message: "No session found",
			Data:    structs.CurrentStateResponse{Phase: "not_started"},
		})
		return
	}

	if session.Status == "finished" {
		c.JSON(http.StatusOK, structs.SuccessResponse{
			Success: true,
			Message: "Exam finished",
			Data:    structs.CurrentStateResponse{Phase: "finished"},
		})
		return
	}

	var attempt models.SectionAttempt
	errAttempt := database.DB.
		Where("session_id = ? AND status = ?", session.Id, "in_progress").
		First(&attempt).Error

	if errAttempt == nil {
		var section models.ExamSection
		database.DB.First(&section, attempt.SectionId)

		if attemptRemainingSeconds(&attempt, &section) > 0 {
			c.JSON(http.StatusOK, structs.SuccessResponse{
				Success: true,
				Message: "Section in progress",
				Data:    buildQuestionsState(&section, &attempt),
			})
			return
		}

		gradeAttempt(&attempt, &section, nil)
		c.JSON(http.StatusOK, structs.SuccessResponse{
			Success: true,
			Message: "Section time expired",
			Data:    advanceAfterSection(&session, &section),
		})
		return
	}

	if session.BreakStartedAt != nil && session.CurrentSectionId != nil {
		var section models.ExamSection
		if err := database.DB.First(&section, *session.CurrentSectionId).Error; err == nil {
			breakEnd := session.BreakStartedAt.Add(time.Duration(section.BreakAfterSeconds) * time.Second)

			if time.Now().Before(breakEnd) {
				c.JSON(http.StatusOK, structs.SuccessResponse{
					Success: true,
					Message: "On break",
					Data: structs.CurrentStateResponse{
						Phase:                 "break",
						BreakRemainingSeconds: int(time.Until(breakEnd).Seconds()),
						NextSection:           findNextSection(section.ExamId, section.Order),
					},
				})
				return
			}

			next := findNextSection(section.ExamId, section.Order)
			if next != nil {
				nextAttempt := startAttempt(&session, next)
				c.JSON(http.StatusOK, structs.SuccessResponse{
					Success: true,
					Message: "Break finished, continuing to next section",
					Data:    buildQuestionsState(next, nextAttempt),
				})
				return
			}

			c.JSON(http.StatusOK, structs.SuccessResponse{
				Success: true,
				Message: "Exam finished",
				Data:    finishExam(&session),
			})
			return
		}
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "No active state",
		Data:    structs.CurrentStateResponse{Phase: "not_started"},
	})
}

func PesertaFindQuestions(c *gin.Context) {

	userId := c.MustGet("user_id").(uint)

	sectionId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var section models.ExamSection
	if err := database.DB.First(&section, sectionId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	session, err := getActiveSession(userId, section.ExamId)
	if err != nil {
		c.JSON(http.StatusForbidden, structs.ErrorResponse{
			Success: false,
			Message: "You don't have an active session for this exam",
			Errors:  map[string]string{},
		})
		return
	}

	var attempt models.SectionAttempt
	if err := database.DB.
		Where("session_id = ? AND section_id = ? AND status = ?", session.Id, section.Id, "in_progress").
		First(&attempt).Error; err != nil {
		c.JSON(http.StatusForbidden, structs.ErrorResponse{
			Success: false,
			Message: "This section is not active for you",
			Errors:  map[string]string{},
		})
		return
	}

	if attemptRemainingSeconds(&attempt, &section) <= 0 {
		gradeAttempt(&attempt, &section, nil)
		c.JSON(http.StatusOK, structs.SuccessResponse{
			Success: true,
			Message: "Section time expired",
			Data:    advanceAfterSection(session, &section),
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Lists Section Questions",
		Data:    buildQuestionsState(&section, &attempt),
	})
}

func SubmitSection(c *gin.Context) {

	userId := c.MustGet("user_id").(uint)

	sectionId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var section models.ExamSection
	if err := database.DB.First(&section, sectionId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var req = structs.SubmitSectionRequest{}
	if err := c.ShouldBindJSON(&req); err != nil {
		req = structs.SubmitSectionRequest{Answers: []structs.AnswerItem{}}
	}

	session, err := getActiveSession(userId, section.ExamId)
	if err != nil {
		c.JSON(http.StatusForbidden, structs.ErrorResponse{
			Success: false,
			Message: "You don't have an active session for this exam",
			Errors:  map[string]string{},
		})
		return
	}

	var attempt models.SectionAttempt
	if err := database.DB.
		Where("session_id = ? AND section_id = ?", session.Id, section.Id).
		First(&attempt).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section attempt not found",
			Errors:  map[string]string{},
		})
		return
	}

	if attempt.Status == "finished" {
		c.JSON(http.StatusOK, structs.SuccessResponse{
			Success: true,
			Message: "Section already submitted",
			Data:    gin.H{"phase": "already_submitted"},
		})
		return
	}

	if time.Now().After(sectionDeadline(&attempt, &section)) {
		gradeAttempt(&attempt, &section, nil)
		c.JSON(http.StatusOK, structs.SuccessResponse{
			Success: true,
			Message: "Time expired, answers not accepted",
			Data:    advanceAfterSection(session, &section),
		})
		return
	}

	gradeAttempt(&attempt, &section, req.Answers)

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Section submitted successfully",
		Data:    advanceAfterSection(session, &section),
	})
}

func StartSection(c *gin.Context) {

	userId := c.MustGet("user_id").(uint)

	sectionId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	var section models.ExamSection
	if err := database.DB.First(&section, sectionId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Section not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	session, err := getActiveSession(userId, section.ExamId)
	if err != nil {
		c.JSON(http.StatusForbidden, structs.ErrorResponse{
			Success: false,
			Message: "You don't have an active session for this exam",
			Errors:  map[string]string{},
		})
		return
	}

	if session.BreakStartedAt == nil || session.CurrentSectionId == nil {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "You are not on a break",
			Errors:  map[string]string{},
		})
		return
	}

	var currentSection models.ExamSection
	if err := database.DB.First(&currentSection, *session.CurrentSectionId).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Current section not found",
			Errors:  map[string]string{},
		})
		return
	}

	if section.Order <= currentSection.Order {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Invalid section order",
			Errors:  map[string]string{},
		})
		return
	}

	breakEnd := session.BreakStartedAt.Add(time.Duration(currentSection.BreakAfterSeconds) * time.Second)
	if time.Now().Before(breakEnd) {
		c.JSON(http.StatusBadRequest, structs.ErrorResponse{
			Success: false,
			Message: "Break is not finished yet",
			Errors:  map[string]string{},
		})
		return
	}

	attempt := startAttempt(session, &section)

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Section started successfully",
		Data:    buildQuestionsState(&section, attempt),
	})
}

func ReportViolation(c *gin.Context) {

	userId := c.MustGet("user_id").(uint)

	examId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	session, err := getActiveSession(userId, examId)
	if err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "No active session found",
			Errors:  map[string]string{},
		})
		return
	}

	session.ViolationCount++
	database.DB.Save(session)

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Violation recorded",
		Data: gin.H{
			"violation_count": session.ViolationCount,
		},
	})
}
