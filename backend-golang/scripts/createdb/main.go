package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/go-sql-driver/mysql"
)

func main() {
	dsn := "root:@tcp(localhost:3306)/?charset=utf8mb4&parseTime=True&loc=Local"
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		log.Fatal("Cannot connect to MySQL:", err)
	}

	_, err = db.Exec("CREATE DATABASE IF NOT EXISTS db_cbt_exam CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
	if err != nil {
		log.Fatal("Failed to create database:", err)
	}

	fmt.Println("Database db_cbt_exam is ready!")
}
