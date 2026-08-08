package controllers

import (
	"net/http"
	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/helpers"
	"cbt-exam/backend-api/models"
	"cbt-exam/backend-api/structs"

	"github.com/gin-gonic/gin"
)

func Login(c *gin.Context) {

	var req = structs.LoginRequest{}
	var user = models.User{}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusUnprocessableEntity, structs.ErrorResponse{
			Success: false,
			Message: "Validation Errors",
			Errors:  helpers.TranslateErrorMessage(err),
		})
		return
	}

	if err := database.DB.Where("username = ?", req.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
			Success: false,
			Message: "User Not Found",
			Errors:  map[string]string{"Error": "Username or password is incorrect"},
		})
		return
	}

	if !helpers.CheckPassword(user.Password, req.Password) {
		c.JSON(http.StatusUnauthorized, structs.ErrorResponse{
			Success: false,
			Message: "Invalid Password",
			Errors:  map[string]string{"Error": "Username or password is incorrect"},
		})
		return
	}

	token := helpers.GenerateToken(user.Id, user.Username, user.Role)

	c.JSON(http.StatusOK, structs.SuccessResponse{
		Success: true,
		Message: "Login Success",
		Data: structs.UserResponse{
			Id:       user.Id,
			Name:     user.Name,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
			Token:    &token,
		},
	})
}
