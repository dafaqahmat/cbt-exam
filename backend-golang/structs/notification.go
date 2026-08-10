package structs

type NotifyRequest struct {
	Message string `json:"message" binding:"required"`
}