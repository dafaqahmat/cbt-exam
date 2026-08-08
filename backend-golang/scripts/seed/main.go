package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"

	"gorm.io/gorm"

	"cbt-exam/backend-api/config"
	"cbt-exam/backend-api/database"
	"cbt-exam/backend-api/helpers"
	"cbt-exam/backend-api/models"
)

func ensureDatabase() {
	host := config.GetEnv("DB_HOST", "localhost")
	port := config.GetEnv("DB_PORT", "3306")
	user := config.GetEnv("DB_USER", "root")
	pass := config.GetEnv("DB_PASS", "")
	name := config.GetEnv("DB_NAME", "db_cbt_exam")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/?charset=utf8mb4&parseTime=True&loc=Local", user, pass, host, port)
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal("Cannot open MySQL:", err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Cannot connect to MySQL:", err)
	}

	_, err = db.Exec("CREATE DATABASE IF NOT EXISTS `" + name + "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
	if err != nil {
		log.Fatal("Failed to create database:", err)
	}
}

// ===== seed data peserta =====

var categoryNames = []string{
	"Siswa Kelas 10",
	"Siswa Kelas 11",
	"Siswa Kelas 12",
	"Umum",
}

func cleanExisting() {
	var total int64
	database.DB.Model(&models.Answer{}).Count(&total)
	if total > 0 {
		database.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.Answer{})
	}
	database.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.SectionAttempt{})
	database.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.ExamSession{})
	database.DB.Where("role = ?", "peserta").Delete(&models.User{})
	database.DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.Category{})
	log.Println("Data lama (peserta, kategori, sesi) dihapus untuk seed fresh.")
}

func seedCategories() {
	created := 0
	for _, name := range categoryNames {
		category := models.Category{Name: name}
		if err := database.DB.Create(&category).Error; err != nil {
			log.Printf("Gagal membuat kategori %s: %v", name, err)
			continue
		}
		created++
	}
	fmt.Printf("Kategori: %d dibuat ulang (Siswa Kelas 10-12, Umum)\n", created)
}

var participants = []struct {
	name, username, email string
}{
	{"Budi Santoso", "budi", "budi@peserta.id"},
	{"Siti Rahayu", "siti", "siti@peserta.id"},
	{"Andi Wijaya", "andi", "andi@peserta.id"},
	{"Dewi Lestari", "dewi", "dewi@peserta.id"},
	{"Rani Permata", "rani", "rani@peserta.id"},
	{"Joko Widodo Putra", "joko", "joko@peserta.id"},
	{"Maya Anggraini", "maya", "maya@peserta.id"},
	{"Fajar Nugroho", "fajar", "fajar@peserta.id"},
	{"Lina Kartika", "lina", "lina@peserta.id"},
	{"Rizky Ramadhan", "rizky", "rizky@peserta.id"},
	{"Nina Suryani", "nina", "nina@peserta.id"},
	{"Doni Prasetyo", "doni", "doni@peserta.id"},
	{"Sari Wulandari", "sari", "sari@peserta.id"},
	{"Bayu Aji Pamungkas", "bayu", "bayu@peserta.id"},
	{"Intan Permatasari", "intan", "intan@peserta.id"},
	{"Yudi Hartono", "yudi", "yudi@peserta.id"},
	{"Ratna Sari Dewi", "ratna", "ratna@peserta.id"},
	{"Dimas Anggara", "dimas", "dimas@peserta.id"},
	{"Putri Ayu Lestari", "putri", "putri@peserta.id"},
	{"Hendra Gunawan", "hendra", "hendra@peserta.id"},
}

func seedUsers() {
	var categories []models.Category
	database.DB.Order("id ASC").Find(&categories)
	if len(categories) == 0 {
		log.Println("Warn: tidak ada kategori, buat seedCategories() terlebih dahulu")
		return
	}

	created := 0
	for i, p := range participants {
		categoryId := categories[i%len(categories)].Id
		user := models.User{
			Name:       p.name,
			Username:   p.username,
			Email:      p.email,
			Password:   helpers.HashPassword("peserta123"),
			Role:       "peserta",
			CategoryId: &categoryId,
		}
		if err := database.DB.Create(&user).Error; err != nil {
			log.Printf("Gagal membuat peserta %s: %v", p.username, err)
			continue
		}
		created++
	}
	fmt.Printf("Peserta: %d dibuat ulang (password default: peserta123)\n", created)
}

// ===== seed ujian & soal =====

type seedQuestion struct {
	text    string
	a, b, c string
	d       string
	correct string
	points  int
}

type seedSection struct {
	title           string
	order           int
	durationMinutes int
	breakSeconds    int
	questions       []seedQuestion
}

type seedExam struct {
	title       string
	description string
	status      string
	sections    []seedSection
}

var exams = []seedExam{
	{
		title:       "Tes Online — Seleksi Umum 2026",
		description: "Contoh ujian multi-sesi dengan 2 sesi dan istirahat di antaranya.",
		status:      "active",
		sections: []seedSection{
			{
				title:           "Sesi 1 - Matematika Dasar",
				order:           1,
				durationMinutes: 15,
				breakSeconds:    300,
				questions: []seedQuestion{
					{text: "Berapakah hasil dari 12 x 8?", a: "86", b: "92", c: "96", d: "104", correct: "C", points: 10},
					{text: "Hasil dari 144 : 12 adalah ...", a: "10", b: "11", c: "12", d: "13", correct: "C", points: 10},
					{text: "Berapakah 25% dari 200?", a: "25", b: "50", c: "75", d: "100", correct: "B", points: 10},
					{text: "Nilai dari 2^5 adalah ...", a: "16", b: "24", c: "30", d: "32", correct: "D", points: 10},
					{text: "Bilangan prima antara 20 dan 30 adalah ...", a: "21, 23, 29", b: "23, 29", c: "23, 27, 29", d: "23, 25, 29", correct: "B", points: 10},
				},
			},
			{
				title:           "Sesi 2 - Bahasa Indonesia",
				order:           2,
				durationMinutes: 15,
				breakSeconds:    0,
				questions: []seedQuestion{
					{text: "Sinonim dari kata \"bahagia\" adalah ...", a: "sedih", b: "senang", c: "marah", d: "lelah", correct: "B", points: 10},
					{text: "Kalimat yang menggunakan tanda baca dengan benar adalah ...", a: "apakah kamu datang", b: "Apakah kamu datang?", c: "apakah kamu datang?", d: "Apakah kamu datang", correct: "B", points: 10},
					{text: "Kata baku yang tepat adalah ...", a: "apotik", b: "ijin", c: "izin", d: "resiko", correct: "C", points: 10},
					{text: "\"Si Kancil\" dalam cerita rakyat termasuk jenis sastra ...", a: "fabel", b: "legenda", c: "saga", d: "mitos", correct: "A", points: 10},
					{text: "Kalimat yang menyatakan pujian adalah ...", a: "Tugasmu sangat rapi dan teliti!", b: "Kamu terlambat lagi!", c: "Siapa yang meminjam bukuku?", d: "Tolong tutup pintunya.", correct: "A", points: 10},
				},
			},
		},
	},
	{
		title:       "Latihan Harian (Draft)",
		description: "Contoh ujian status draft, belum boleh dikerjakan peserta.",
		status:      "draft",
		sections: []seedSection{
			{
				title:           "Latihan Umum",
				order:           1,
				durationMinutes: 10,
				breakSeconds:    0,
				questions: []seedQuestion{
					{text: "Ibu kota Indonesia adalah ...", a: "Bandung", b: "Jakarta", c: "Surabaya", d: "Medan", correct: "B", points: 10},
					{text: "Planet terdekat dari Matahari adalah ...", a: "Bumi", b: "Venus", c: "Merkurius", d: "Mars", correct: "C", points: 10},
					{text: "Hasil dari 7 x 7 adalah ...", a: "42", b: "49", c: "56", d: "63", correct: "B", points: 10},
				},
			},
		},
	},
}

func insertQuestions(sectionID uint, questions []seedQuestion) {
	for _, q := range questions {
		question := models.Question{
			SectionId:     sectionID,
			Type:          "text_text",
			QuestionText:  q.text,
			OptionAText:   q.a,
			OptionBText:   q.b,
			OptionCText:   q.c,
			OptionDText:   q.d,
			CorrectAnswer: q.correct,
			Points:        q.points,
		}
		if err := database.DB.Create(&question).Error; err != nil {
			log.Printf("!! Gagal membuat soal (%s): %v", q.text, err)
		}
	}
}

func seedExams() {
	for _, exam := range exams {
		var count int64
		database.DB.Model(&models.Exam{}).Where("title = ?", exam.title).Count(&count)
		if count > 0 {
			fmt.Printf("Ujian \"%s\" sudah ada, dilewati.\n", exam.title)
			continue
		}

		examRecord := models.Exam{
			Title:       exam.title,
			Description: exam.description,
			Status:      exam.status,
		}
		if err := database.DB.Create(&examRecord).Error; err != nil {
			log.Printf("!! Gagal membuat ujian %s: %v", exam.title, err)
			continue
		}

		for _, sec := range exam.sections {
			section := models.ExamSection{
				ExamId:            examRecord.Id,
				Title:             sec.title,
				Order:             sec.order,
				DurationMinutes:   sec.durationMinutes,
				BreakAfterSeconds: sec.breakSeconds,
			}
			if err := database.DB.Create(&section).Error; err != nil {
				log.Printf("!! Gagal membuat sesi %s: %v", sec.title, err)
				continue
			}
			insertQuestions(section.Id, sec.questions)
		}

		fmt.Printf("Ujian \"%s\" dibuat (%d sesi, status: %s)\n", exam.title, len(exam.sections), exam.status)
	}
}

func main() {
	config.LoadEnv()

	ensureDatabase()
	database.InitDB()

	cleanExisting()
	seedCategories()
	seedUsers()
	seedExams()

	fmt.Println()
	fmt.Println("======================================")
	fmt.Println("Seeding selesai!")
	fmt.Println("  Kategori : Siswa Kelas 10, Siswa Kelas 11, Siswa Kelas 12, Umum")
	fmt.Println("  Admin    : admin / admin123 (dari .env)")
	fmt.Println("  Peserta  : budi, siti, andi, dewi, rani + 15 akun lain / password: peserta123")
	fmt.Println("  Ujian    : \"Tes Online Contoh Seleksi Umum 2026\" (aktif) + \"Latihan Harian\" (draft)")
	fmt.Println("  Peserta  : kategori terbagi merata di Siswa Kelas 10-12 & Umum")
	fmt.Println("======================================")
}