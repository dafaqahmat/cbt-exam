package controllers

import (
	"net/http"
	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/helpers"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
)

func categoryNameOf(categoryId *uint) string {
	if categoryId == nil {
		return ""
	}
	var cat models.Category
	if err := database.DB.First(&cat, *categoryId).Error; err != nil {
		return ""
	}
	return cat.Name
}

func FindUsers(c *gin.Context) {

	var users []structs.UserResponse

	query := database.DB
	if role := c.Query("role"); role != "" {
		query = query.Where("role = ?", role)
	}

	query.
		Model(&models.User{}).
		Select("users.id, users.name, users.username, users.email, users.role, users.category_id, COALESCE(categories.name, '') AS category_name").
		Joins("LEFT JOIN categories ON categories.id = users.category_id").
		Order("users.id ASC").
		Scan(&users)

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Lists Data Users",
		Data:    users,
	})
}

func CreateUser(c *gin.Context) {

	var req = structs.UserCreateRequest{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if req.Role == "peserta" && req.CategoryId == nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  map[string]string{"CategoryId": "Kategori wajib dipilih"},
		})
		return
	}

	user := models.User{
		Name:       req.Name,
		Username:   req.Username,
		Email:      req.Email,
		Password:   helpers.HashPassword(req.Password),
		Role:       req.Role,
		CategoryId: req.CategoryId,
	}

	if err := database.DB.Create(&user).Error; err != nil {
		if helpers.IsDuplicateEntryError(err) {
			c.JSON(http.StatusConflict, structs.ErrorResponse{
				Success: false,
				Message: "Duplicate entry error",
				Errors:  helpers.TranslateErrorMessage(err),
			})
		} else {
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Failed to create user",
				Errors:  helpers.TranslateErrorMessage(err),
			})
		}
		return
	}

	c.JSON(http.StatusCreated, structs.SuccessResponse{
		Success: true,
		Message: "User created successfully",
		Data: structs.UserResponse{
			Id:           user.Id,
			Name:         user.Name,
			Username:     user.Username,
			Email:        user.Email,
			Role:         user.Role,
			CategoryId:   user.CategoryId,
			CategoryName: categoryNameOf(user.CategoryId),
		},
	})
}

func UpdateUser(c *gin.Context) {

	id := c.Param("id")

	var user models.User

	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "User not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var req = structs.UserUpdateRequest{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if req.Role == "peserta" && req.CategoryId == nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  map[string]string{"CategoryId": "Kategori wajib dipilih"},
		})
		return
	}

	user.Name = req.Name
	user.Username = req.Username
	user.Email = req.Email
	user.Role = req.Role
	user.CategoryId = req.CategoryId

	if req.Password != "" {
		user.Password = helpers.HashPassword(req.Password)
	}

	if err := database.DB.Save(&user).Error; err != nil {
		if helpers.IsDuplicateEntryError(err) {
			c.JSON(http.StatusConflict, structs.ErrorResponse{
				Success: false,
				Message: "Duplicate entry error",
				Errors:  helpers.TranslateErrorMessage(err),
			})
		} else {
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Failed to update user",
				Errors:  helpers.TranslateErrorMessage(err),
			})
		}
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "User updated successfully",
		Data: structs.UserResponse{
			Id:           user.Id,
			Name:         user.Name,
			Username:     user.Username,
			Email:        user.Email,
			Role:         user.Role,
			CategoryId:   user.CategoryId,
			CategoryName: categoryNameOf(user.CategoryId),
		},
	})
}

func GetProfile(c *gin.Context) {

	currentUserId, _ := c.Get("user_id")
	if currentUserId == nil {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
			Errors:  map[string]string{},
		})
		return
	}

	var user models.User
	if err := database.DB.First(&user, currentUserId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "User not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Profile retrieved successfully",
		Data: structs.UserResponse{
			Id:       user.Id,
			Name:     user.Name,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
		},
	})
}

func UpdateProfile(c *gin.Context) {

	currentUserId, _ := c.Get("user_id")
	if currentUserId == nil {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
			Success: false,
			Message: "Unauthorized",
			Errors:  map[string]string{},
		})
		return
	}

	var user models.User
	if err := database.DB.First(&user, currentUserId).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "User not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	var req = structs.ProfileUpdateRequest{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	user.Name = req.Name
	user.Username = req.Username
	user.Email = req.Email

	if req.Password != "" {
		user.Password = helpers.HashPassword(req.Password)
	}

	if err := database.DB.Save(&user).Error; err != nil {
		if helpers.IsDuplicateEntryError(err) {
			c.JSON(http.StatusConflict, structs.ErrorResponse{
				Success: false,
				Message: "Duplicate entry error",
				Errors:  helpers.TranslateErrorMessage(err),
			})
		} else {
			c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
				Success: false,
				Message: "Failed to update profile",
				Errors:  helpers.TranslateErrorMessage(err),
			})
		}
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Profile updated successfully",
		Data: structs.UserResponse{
			Id:       user.Id,
			Name:     user.Name,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
		},
	})
}

func DeleteUser(c *gin.Context) {

	id := c.Param("id")

	currentUserId, _ := c.Get("user_id")
	if currentUserId != nil {
		var target models.User
		if err := database.DB.First(&target, id).Error; err == nil {
			if target.Id == currentUserId.(uint) {
				c.JSON(http.StatusBadRequest, structs.ErrorResponse{
					Success: false,
					Message: "You cannot delete your own account",
					Errors:  map[string]string{},
				})
				return
			}
		}
	}

	var user models.User

	if err := database.DB.First(&user, id).Error; err != nil {
		c.JSON(http.StatusNotFound, structs.ErrorResponse{
			Success: false,
			Message: "User not found",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if err := database.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, structs.ErrorResponse{
			Success: false,
			Message: "Failed to delete user",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "User deleted successfully",
	})
}
