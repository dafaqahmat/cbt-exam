package main

import (
	"cbt-exam/backend-api/config"
	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/routes"
)

func main() {

	config.LoadEnv()

	database.InitDB()

	r := routes.SetupRouter()

	r.Run(":" + config.GetEnv("APP_PORT", "3000"))
}
