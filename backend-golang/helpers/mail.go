package helpers

import (
	"crypto/sha256"
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"net"
	"net/smtp"
	"strconv"
	"strings"
	"time"

	"cbt-exam/backend-api/config"
)

func smtpConfigAvailable() (bool, string, int, string, string, error) {
	host := config.GetEnv("SMTP_HOST", "smtp.gmail.com")
	port, err := strconv.Atoi(config.GetEnv("SMTP_PORT", "587"))
	if err != nil {
		port = 587
	}
	user := config.GetEnv("SMTP_USER", "")
	pass := config.GetEnv("SMTP_PASS", "")
	from := config.GetEnv("SMTP_FROM", user)

	if user == "" || pass == "" || host == "" || from == "" {
		return false, "", 0, "", "", fmt.Errorf("SMTP belum dikonfigurasi. Tambahkan SMTP_HOST, SMTP_USER, SMTP_PASS, dan SMTP_FROM di file .env")
	}

	return true, host, port, user, pass, nil
}

// encodeRFC2047 menangani subjek/header non-ASCII agar tidak rusak di client email.
func encodeRFC2047(value string) string {
	if isASCII(value) {
		return value
	}
	return "=?UTF-8?B?" + base64.StdEncoding.EncodeToString([]byte(value)) + "?="
}

func isASCII(s string) bool {
	for i := 0; i < len(s); i++ {
		if s[i] >= 0x80 {
			return false
		}
	}
	return true
}

func SendEmail(to string, subject string, body string) error {

	ok, host, port, user, pass, err := smtpConfigAvailable()
	if !ok {
		return err
	}

	from := config.GetEnv("SMTP_FROM", user)

	messageId := fmt.Sprintf("%x", sha256.Sum256([]byte(fmt.Sprintf("%d-%s", time.Now().UnixNano(), to))))

	var msg strings.Builder
	msg.WriteString(fmt.Sprintf("From: %s\r\n", encodeRFC2047(config.GetEnv("SMTP_SENDER_NAME", "CBT Exam"))+" <"+from+">"))
	msg.WriteString(fmt.Sprintf("To: %s\r\n", to))
	msg.WriteString(fmt.Sprintf("Subject: %s\r\n", encodeRFC2047(subject)))
	msg.WriteString(fmt.Sprintf("Date: %s\r\n", time.Now().Format(time.RFC1123Z)))
	msg.WriteString(fmt.Sprintf("Message-ID: <%s@%s>\r\n", messageId, host))
	msg.WriteString("MIME-Version: 1.0\r\n")
	msg.WriteString("Content-Type: text/plain; charset=UTF-8\r\n")
	msg.WriteString("Content-Transfer-Encoding: base64\r\n")
	msg.WriteString("List-Unsubscribe: <mailto:" + user + "?subject=unsubscribe>\r\n")
	msg.WriteString("\r\n")
	msg.WriteString(base64.StdEncoding.EncodeToString([]byte(body)))

	addr := net.JoinHostPort(host, strconv.Itoa(port))

	// Kirim dengan timeout agar request tidak menggantung.
	conn, err := net.DialTimeout("tcp", addr, 15*time.Second)
	if err != nil {
		return fmt.Errorf("gagal koneksi SMTP: %w", err)
	}
	defer conn.Close()

	client, err := smtp.NewClient(conn, host)
	if err != nil {
		return fmt.Errorf("gagal memulai sesi SMTP: %w", err)
	}
	defer client.Close()

	if err := client.Hello(host); err != nil {
		return fmt.Errorf("SMTP salutation gagal: %w", err)
	}

	// Gunakan STARTTLS agar autentikasi aman (wajib untuk Gmail).
	if ok, _ := client.Extension("STARTTLS"); ok {
		tlsConfig := &tls.Config{
			ServerName: host,
			MinVersion: tls.VersionTLS12,
		}
		if err := client.StartTLS(tlsConfig); err != nil {
			return fmt.Errorf("gagal STARTTLS: %w", err)
		}
	}

	auth := smtp.PlainAuth("", user, pass, host)
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("autentikasi SMTP gagal (cek SMTP_USER/SMTP_PASS, untuk Gmail gunakan App Password): %w", err)
	}

	if err := client.Mail(from); err != nil {
		return fmt.Errorf("command MAIL gagal: %w", err)
	}
	if err := client.Rcpt(to); err != nil {
		return fmt.Errorf("command RCPT gagal: %w", err)
	}

	w, err := client.Data()
	if err != nil {
		return fmt.Errorf("command DATA gagal: %w", err)
	}
	if _, err := w.Write([]byte(msg.String())); err != nil {
		return fmt.Errorf("gagal menulis isi email: %w", err)
	}
	if err := w.Close(); err != nil {
		return fmt.Errorf("gagal menyelesaikan DATA: %w", err)
	}

	if err := client.Quit(); err != nil {
		// Quit gagal bukan berarti email tidak terkirim.
		return nil
	}

	return nil
}