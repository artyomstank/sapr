package server

import (
	"pipks/handler"
	"pipks/models"

	"github.com/gin-gonic/gin"
)

func HandleStructure(c *gin.Context) {
	var input models.StructureInput

	if err := c.BindJSON(&input); err != nil {
		c.JSON(400, gin.H{
			"errors": []string{"Некорректный JSON"},
		})
		return
	}

	validation := handler.ValidateStructure(input)

	c.JSON(200, validation)
}
