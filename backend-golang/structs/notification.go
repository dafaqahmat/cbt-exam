package structs

type NotifyRequest struct {
	Message   string `json:"message" binding:"required"`
	ExamDate  string `json:"exam_date"`
	StartTime string `json:"start_time"`
	EndTime   string `json:"end_time"`
}