package routes

import (
	"cbt-exam/backend-api/controllers"
	"cbt-exam/backend-api/middlewares"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {

	router := gin.Default()

	router.Use(cors.New(cors.Config{
		AllowOrigins:  []string{"*"},
		AllowMethods:  []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:  []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders: []string{"Content-Length"},
	}))

	// serve file upload (gambar soal)
	router.Static("/uploads", "./uploads")

	// ===== PUBLIK =====
	router.POST("/api/login", controllers.Login)

	// ===== ADMIN =====
	admin := router.Group("/api/admin", middlewares.AuthMiddleware(), middlewares.AdminOnly())
	{
		// peserta
		admin.GET("/users", controllers.FindUsers)
		admin.POST("/users", controllers.CreateUser)
		admin.PUT("/users/:id", controllers.UpdateUser)
		admin.DELETE("/users/:id", controllers.DeleteUser)

		// kategori peserta
		admin.GET("/categories", controllers.FindCategories)
		admin.POST("/categories", controllers.CreateCategory)
		admin.PUT("/categories/:id", controllers.UpdateCategory)
		admin.DELETE("/categories/:id", controllers.DeleteCategory)

		// profil admin (akun sendiri)
		admin.GET("/profile", controllers.GetProfile)
		admin.PUT("/profile", controllers.UpdateProfile)

		// dashboard
		admin.GET("/dashboard", controllers.GetDashboard)

		// ujian
		admin.GET("/exams", controllers.AdminFindExams)
		admin.POST("/exams", controllers.CreateExam)
		admin.PUT("/exams/:id", controllers.UpdateExam)
		admin.DELETE("/exams/:id", controllers.DeleteExam)
		admin.POST("/exams/:id/publish", controllers.PublishExamResults)

		// sesi
		admin.GET("/exams/:id/sections", controllers.FindSections)
		admin.POST("/exams/:id/sections", controllers.CreateSection)
		admin.PUT("/sections/:id", controllers.UpdateSection)
		admin.DELETE("/sections/:id", controllers.DeleteSection)

		// soal
		admin.GET("/sections/:id/questions", controllers.AdminFindQuestions)
		admin.GET("/questions/:id", controllers.AdminFindQuestionById)
		admin.POST("/sections/:id/questions", controllers.CreateQuestion)
		admin.PUT("/questions/:id", controllers.UpdateQuestion)
		admin.DELETE("/questions/:id", controllers.DeleteQuestion)

		// upload gambar
		admin.POST("/upload", controllers.UploadImage)

		// hasil ujian
		admin.GET("/exams/:id/results", controllers.AdminFindExamResults)
		admin.GET("/sessions/:id/answers", controllers.AdminFindSessionAnswers)

		// pemberitahuan email
		admin.GET("/exams/:id/notify/preview", controllers.GetNotifyPreview)
		admin.POST("/exams/:id/notify", controllers.NotifyExamParticipants)

		// laporan ujian
		admin.GET("/reports", controllers.GenerateReport)
	}

	// ===== PESERTA =====
	// stream status ujian (SSE) memakai token via query, bukan header
	router.GET("/api/exams/:id/stream", controllers.StreamExamStatus)

	peserta := router.Group("/api", middlewares.AuthMiddleware(), middlewares.PesertaOnly())
	{
		peserta.GET("/exams", controllers.PesertaFindExams)
		peserta.POST("/exams/:id/start", controllers.StartExam)
		peserta.GET("/exams/:id/current", controllers.GetCurrentState)
		peserta.GET("/sections/:id/questions", controllers.PesertaFindQuestions)
		peserta.POST("/sections/:id/submit", controllers.SubmitSection)
		peserta.POST("/sections/:id/start", controllers.StartSection)
		peserta.POST("/exams/:id/violation", controllers.ReportViolation)
		peserta.GET("/exams/:id/result", controllers.PesertaGetResult)
	}

	return router
}
