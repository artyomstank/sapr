package handler

import (
	"pipks/models"
	"pipks/postprocessor"
	"pipks/processor"
	"pipks/validator"

	"github.com/gin-gonic/gin"
)

// HandleSubmit обрабатывает валидацию проекта
func HandleSubmit(c *gin.Context) {
	var input models.StructureInput

	if err := c.BindJSON(&input); err != nil {
		c.JSON(400, gin.H{
			"errors": []string{"Некорректный JSON"},
		})
		return
	}

	errors := validator.ValidateStructure(&input)
	if len(errors) > 0 {
		c.JSON(400, gin.H{
			"errors": errors,
		})
		return
	}

	c.JSON(200, gin.H{
		"status": "OK",
		"errors": []string{},
	})
}

// HandleCalculate обрабатывает расчёт смещений
func HandleCalculate(c *gin.Context) {
	var input models.StructureInput

	if err := c.BindJSON(&input); err != nil {
		c.JSON(400, gin.H{
			"errors": []string{"Некорректный JSON"},
		})
		return
	}

	// Валидация входных данных
	errors := validator.ValidateStructure(&input)
	if len(errors) > 0 {
		c.JSON(400, gin.H{
			"errors": errors,
		})
		return
	}

	// Расчёт смещений
	result, err := processor.CalculateDisplacements(&input)
	if err != nil {
		c.JSON(400, gin.H{
			"errors": []string{err.Error()},
		})
		return
	}

	c.JSON(200, result)
}

// HandleFullCalculation обрабатывает полный расчёт
func HandleFullCalculation(c *gin.Context) {
	var input models.StructureInput

	if err := c.BindJSON(&input); err != nil {
		c.JSON(400, gin.H{
			"errors": []string{"Некорректный JSON"},
		})
		return
	}

	// Валидация входных данных
	errors := validator.ValidateStructure(&input)
	if len(errors) > 0 {
		c.JSON(400, gin.H{
			"errors": errors,
		})
		return
	}

	// Расчёт смещений
	displacementResult, err := processor.CalculateDisplacements(&input)
	if err != nil {
		c.JSON(400, gin.H{
			"errors": []string{err.Error()},
		})
		return
	}

	// Расчёт полных результатов (усилия, напряжения, перемещения)
	fullResult, err := postprocessor.CalculateNds(&input, displacementResult.Displacements)
	if err != nil {
		c.JSON(400, gin.H{
			"errors": []string{err.Error()},
		})
		return
	}

	c.JSON(200, fullResult)
}
