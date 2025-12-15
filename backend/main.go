package main

import (
	"log"
	"sync"

	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
)

// Struktur data untuk Team
type Team struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	Location string  `json:"location"`
	IP       string  `json:"ip"`
	Members  int     `json:"members"`
	Score    int     `json:"score"`
	Solved   int     `json:"solved"`
	Lat      float64 `json:"lat"`
	Lng      float64 `json:"lng"`
	Color    string  `json:"color"`
	IsActive bool    `json:"is_active"`
}

// Struktur data untuk Challenge
type Challenge struct {
	ID          int    `json:"id"`
	Title       string `json:"title"`
	Category    string `json:"category"`
	Points      int    `json:"points"`
	Description string `json:"description"`
	Hint        string `json:"hint"`
	TargetInfo  string `json:"target_info"`
	Flag        string `json:"-"` // Hidden dari JSON response
}

// Struktur untuk Submit Request
type SubmitRequest struct {
	TeamID      int    `json:"team_id"`
	ChallengeID int    `json:"challenge_id"`
	Flag        string `json:"flag"`
}

// Struktur untuk Submit Response
type SubmitResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Points  int    `json:"points,omitempty"`
}

// Global data dengan mutex untuk thread safety
var (
	mu    sync.Mutex
	teams = []Team{
		{1, "Team Glend", "Tokyo, Japan", "192.168.1.101", 5, 0, 0, 35.6762, 139.6503, "#ff4d4d", true},
		{2, "Team Bona", "San Francisco, USA", "192.168.1.102", 5, 0, 0, 37.7749, -122.4194, "#ffad33", true},
		{3, "Team Arief", "Berlin, Germany", "192.168.1.103", 5, 0, 0, 52.5200, 13.4050, "#33ff77", true},
		{4, "Team Irfan", "Singapore", "192.168.1.104", 5, 0, 0, 1.3521, 103.8198, "#f0e130", true},
		{5, "Team Deni", "Sydney, Australia", "192.168.1.105", 5, 0, 0, -33.8688, 151.2093, "#a333ff", true},
	}

	challenges = []Challenge{
		{
			ID:          1,
			Title:       "IDOR - User Profile Access",
			Category:    "Web Security",
			Points:      5,
			Description: "Enumerate user IDs to find administrative accounts. Use Burp Suite to systematically test different user ID values through the API endpoint.",
			Hint:        "Try changing the user ID parameter in the request. Admin accounts usually have low ID numbers.",
			TargetInfo:  "Endpoint: /api/user/{id}\nMethod: GET\nHost: target.challenge.lan",
			Flag:        "FLAG{IDOR_1S_D4NG3R0US}",
		},
		{
			ID:          2,
			Title:       "SQL Injection - Login Bypass",
			Category:    "Web Security",
			Points:      10,
			Description: "The login form is vulnerable to SQL injection. Find a way to bypass authentication without knowing the password.",
			Hint:        "Classic SQL injection payloads might work. Think about how the query is constructed.",
			TargetInfo:  "Endpoint: /api/login\nMethod: POST\nContent-Type: application/json\nBody: {\"username\": \"\", \"password\": \"\"}",
			Flag:        "FLAG{SQL1_L0G1N_BYPA55}",
		},
		{
			ID:          3,
			Title:       "XSS - Reflected Attack",
			Category:    "Web Security",
			Points:      10,
			Description: "Find the reflected XSS vulnerability in the search functionality and craft a payload to steal cookies.",
			Hint:        "The search parameter is not properly sanitized before being reflected back.",
			TargetInfo:  "Endpoint: /search?q={payload}\nMethod: GET",
			Flag:        "FLAG{XSS_R3FL3CT3D_4TT4CK}",
		},
		{
			ID:          4,
			Title:       "Cryptography - Decode The Secret",
			Category:    "Cryptography",
			Points:      15,
			Description: "Decode the following encoded message: U0dWc2JHOW5JRTFsY21SbGEyRWhJRk5wWW1WeQ==",
			Hint:        "This looks like a common encoding format. Try base64.",
			TargetInfo:  "No target server needed. Decode the string to find the flag format.",
			Flag:        "FLAG{B4S364_D3C0D3D}",
		},
	}

	// Track solved challenges per team: map[teamID]map[challengeID]bool
	solvedChallenges = make(map[int]map[int]bool)
)

func main() {
	app := fiber.New()

	// Enable CORS
	app.Use(cors.New())

	// GET /api/teams - Mendapatkan semua tim
	app.Get("/api/teams", func(c *fiber.Ctx) error {
		mu.Lock()
		defer mu.Unlock()
		return c.JSON(teams)
	})

	// GET /api/challenges - Mendapatkan semua challenge (tanpa flag)
	app.Get("/api/challenges", func(c *fiber.Ctx) error {
		return c.JSON(challenges)
	})

	// POST /api/submit - Submit flag
	app.Post("/api/submit", func(c *fiber.Ctx) error {
		var req SubmitRequest
		if err := c.BodyParser(&req); err != nil {
			return c.Status(400).JSON(SubmitResponse{
				Success: false,
				Message: "Invalid request body",
			})
		}

		// Validasi team ID
		mu.Lock()
		defer mu.Unlock()

		teamIndex := -1
		for i, t := range teams {
			if t.ID == req.TeamID {
				teamIndex = i
				break
			}
		}
		if teamIndex == -1 {
			return c.JSON(SubmitResponse{
				Success: false,
				Message: "Team not found",
			})
		}

		// Validasi challenge ID
		var challenge *Challenge
		for i := range challenges {
			if challenges[i].ID == req.ChallengeID {
				challenge = &challenges[i]
				break
			}
		}
		if challenge == nil {
			return c.JSON(SubmitResponse{
				Success: false,
				Message: "Challenge not found",
			})
		}

		// Cek apakah sudah pernah solved
		if solvedChallenges[req.TeamID] == nil {
			solvedChallenges[req.TeamID] = make(map[int]bool)
		}
		if solvedChallenges[req.TeamID][req.ChallengeID] {
			return c.JSON(SubmitResponse{
				Success: false,
				Message: "Challenge already solved by your team",
			})
		}

		// Validasi flag
		if req.Flag != challenge.Flag {
			return c.JSON(SubmitResponse{
				Success: false,
				Message: "Incorrect flag. Try again!",
			})
		}

		// Flag benar! Update skor
		teams[teamIndex].Score += challenge.Points
		teams[teamIndex].Solved++
		solvedChallenges[req.TeamID][req.ChallengeID] = true

		log.Printf("✅ Team %s solved challenge '%s' (+%d points)",
			teams[teamIndex].Name, challenge.Title, challenge.Points)

		return c.JSON(SubmitResponse{
			Success: true,
			Message: "🎉 Correct! Flag accepted.",
			Points:  challenge.Points,
		})
	})

	log.Println("🚀 Backend CTF running on port 3000")
	log.Println("   GET  /api/teams      - Get all teams")
	log.Println("   GET  /api/challenges - Get all challenges")
	log.Println("   POST /api/submit     - Submit flag")
	log.Fatal(app.Listen(":3000"))
}
