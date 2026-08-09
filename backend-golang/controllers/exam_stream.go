package controllers

import (
	"fmt"
	"net/http"
	"sync"
	"time"

	"cbt-exam/backend-api/config"
	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type examStreamHub struct {
	mu   sync.Mutex
	subs map[uint]map[chan string]struct{}
}

var streamHub = &examStreamHub{
	subs: make(map[uint]map[chan string]struct{}),
}

func (h *examStreamHub) subscribe(examId uint) chan string {
	h.mu.Lock()
	defer h.mu.Unlock()
	ch := make(chan string, 16)
	if h.subs[examId] == nil {
		h.subs[examId] = make(map[chan string]struct{})
	}
	h.subs[examId][ch] = struct{}{}
	return ch
}

func (h *examStreamHub) unsubscribe(examId uint, ch chan string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	if subs, ok := h.subs[examId]; ok {
		delete(subs, ch)
		close(ch)
		if len(subs) == 0 {
			delete(h.subs, examId)
		}
	}
}

func (h *examStreamHub) publish(examId uint, eventName, payload string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	chans := h.subs[examId]
	for ch := range chans {
		select {
		case ch <- fmt.Sprintf("event: %s\ndata: %s\n\n", eventName, payload):
		default:
		}
	}
}

func StreamExamStatus(c *gin.Context) {

	examId, ok := parseUintParam(c, "id")
	if !ok {
		return
	}

	tokenString := c.Query("token")
	if tokenString == "" {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
			Success: false,
			Message: "Token is required",
			Errors:  map[string]string{},
		})
		return
	}

	claims := &jwt.MapClaims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return []byte(config.GetEnv("JWT_SECRET", "secret_key")), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
			Success: false,
			Message: "Invalid token",
			Errors:  map[string]string{},
		})
		return
	}

	if role, ok := (*claims)["role"].(string); !ok || role != "peserta" {
		c.JSON(http.StatusForbidden, structs.ErrorResponse{
			Success: false,
			Message: "Peserta access only",
			Errors:  map[string]string{},
		})
		return
	}

	var exam models.Exam
	if err := database.DB.First(&exam, examId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "Exam not found",
			Errors:  map[string]string{},
		})
		return
	}

	ch := streamHub.subscribe(examId)
	defer streamHub.unsubscribe(examId, ch)

	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("X-Accel-Buffering", "no")

	c.SSEvent("ready", "connected")
	c.Writer.Flush()

	heartbeat := time.NewTicker(15 * time.Second)
	defer heartbeat.Stop()

	for {
		select {
		case <-c.Request.Context().Done():
			return
		case msg := <-ch:
			_, _ = c.Writer.WriteString(msg)
			c.Writer.Flush()
		case <-heartbeat.C:
			_, _ = c.Writer.WriteString(": keepalive\n\n")
			c.Writer.Flush()
		}
	}
}