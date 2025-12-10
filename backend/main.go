package main

import (
	"log"
	"pipks/handler"

	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(200)
			return
		}
		c.Next()
	})

	// Эндпоинты API
	r.POST("/api/saprcad/submit", handler.HandleSubmit)
	r.POST("/api/saprcad/calculate-structure", handler.HandleCalculate)
	r.POST("/api/saprcad/full-calculation", handler.HandleFullCalculation)

	err := r.Run(":8081")
	if err != nil {
		log.Fatal(err)
	}
}
