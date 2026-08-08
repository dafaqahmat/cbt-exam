package structs

type ExamCreateRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Status      string `json:"status" binding:"omitempty,oneof=draft active closed"`
}

type ExamUpdateRequest struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Status      string `json:"status" binding:"omitempty,oneof=draft active closed"`
}
