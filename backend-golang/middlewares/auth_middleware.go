package middlewares

import (
	"net/http"
	"cbt-exam/backend-api/config"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

var jwtKey = []byte(config.GetEnv("JWT_SECRET", "secret_key"))

func AuthMiddleware() gin.HandlerFunc {

	return func(c *gin.Context) {

		tokenString := c.GetHeader("Authorization")

		if tokenString == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Token is required",
			})
			c.Abort()
			return
		}

		tokenString = strings.TrimPrefix(tokenString, "Bearer ")

		claims := &jwt.MapClaims{}

		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtKey, nil
		})

		if err != nil || !token.Valid {
			c.JSON(http.StatusUnauthorized, gin.H{
				"success": false,
				"message": "Invalid token",
			})
			c.Abort()
			return
		}

		c.Set("claims", *claims)
		if sub, ok := (*claims)["sub"].(string); ok {
			c.Set("username", sub)
		}
		if userId, ok := (*claims)["user_id"].(float64); ok {
			c.Set("user_id", uint(userId))
		}
		if role, ok := (*claims)["role"].(string); ok {
			c.Set("role", role)
		}

		c.Next()
	}
}

func AdminOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "admin" {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Admin access only",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}

func PesertaOnly() gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists || role != "peserta" {
			c.JSON(http.StatusForbidden, gin.H{
				"success": false,
				"message": "Peserta access only",
			})
			c.Abort()
			return
		}
		c.Next()
	}
}
