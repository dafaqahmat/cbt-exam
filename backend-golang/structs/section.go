package structs

type SectionRequest struct {
	Title             string `json:"title" binding:"required"`
	Order             int    `json:"order" binding:"required,min=1"`
	DurationMinutes   int    `json:"duration_minutes" binding:"required,min=1"`
	BreakAfterSeconds int    `json:"break_after_seconds" binding:"min=0"`
}
