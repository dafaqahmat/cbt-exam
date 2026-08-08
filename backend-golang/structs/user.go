package structs

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type UserResponse struct {
	Id           uint    `json:"id"`
	Name         string  `json:"name"`
	Username     string  `json:"username"`
	Email        string  `json:"email"`
	Role         string  `json:"role"`
	CategoryId   *uint   `json:"category_id"`
	CategoryName string  `json:"category_name"`
	Token        *string `json:"token,omitempty"`
}

type UserCreateRequest struct {
	Name       string `json:"name" binding:"required"`
	Username   string `json:"username" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password" binding:"required,min=6"`
	Role       string `json:"role" binding:"required,oneof=admin peserta"`
	CategoryId *uint  `json:"category_id"`
}

type UserUpdateRequest struct {
	Name       string `json:"name" binding:"required"`
	Username   string `json:"username" binding:"required"`
	Email      string `json:"email" binding:"required,email"`
	Password   string `json:"password,omitempty"`
	Role       string `json:"role" binding:"required,oneof=admin peserta"`
	CategoryId *uint  `json:"category_id"`
}

type ProfileUpdateRequest struct {
	Name     string `json:"name" binding:"required"`
	Username string `json:"username" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password,omitempty"`
}

type CategoryRequest struct {
	Name string `json:"name" binding:"required"`
}