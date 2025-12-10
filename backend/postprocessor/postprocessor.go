package postprocessor

import (
	"fmt"
	"math"
	"pipks/models"
)

// CalculateNds вычисляет полные результаты (усилия, напряжения, перемещения)
func CalculateNds(input *models.StructureInput, displacements []float64) (*models.FullResult, error) {
	if input == nil {
		return nil, fmt.Errorf("входные данные не могут быть nil")
	}

	if len(displacements) != len(input.Nodes) {
		return nil, fmt.Errorf("количество смещений не совпадает с количеством узлов")
	}

	rods := input.Rods
	nodes := input.Nodes
	var rodResults []models.RodResult

	for i := 0; i < len(rods); i++ {
		rod := rods[i]
		leftNode := nodes[i]
		rightNode := nodes[i+1]

		delta0 := displacements[i]   // ∆_i
		delta1 := displacements[i+1] // ∆_{i+1}

		L := rod.Length
		A := rod.Area
		E := rod.ElasticModulus
		q := rod.DistributedLoad

		// Коэффициенты для Nx(x) = a0 + a1 * x
		a0 := ((E*A)/L)*(delta1-delta0) + ((q * L) / 2)
		a1 := ((q * L) / 2) * (-2 / L)

		// Коэффициенты для ux(x) = b0 + b1 * x + b2 * x^2
		b0 := delta0
		b1 := (delta1-delta0)/L + (q*L*L)/(2*E*A*L)
		b2 := ((q * L * L) / (2 * E * A * L)) * (-1 / L)

		// Коэффициенты для σx(x) = c0 + c1 * x
		c0 := a0 / A
		c1 := a1 / A

		// Максимальное |σx| на стержне
		sigma0 := c0        // σ(0)
		sigmaL := c0 + c1*L // σ(L)
		maxStress := math.Max(math.Abs(sigma0), math.Abs(sigmaL))

		// Сборка данных в объект
		resultOutput := models.RodResult{
			RodID:           rod.ID,
			Length:          L,
			Area:            A,
			ElasticModulus:  E,
			AllowableStress: rod.AllowableStress,
			DistributedLoad: q,
			NodeRelatedTo:   []models.Node{leftNode, rightNode},
			AxialForceCoeffs: models.PolynomialCoeffs{
				A0: a0,
				A1: a1,
				A2: 0, // Для линейной функции
			},
			DisplacementCoeffs: models.PolynomialCoeffs{
				A0: b0,
				A1: b1,
				A2: b2,
			},
			StressCoeffs: models.PolynomialCoeffs{
				A0: c0,
				A1: c1,
				A2: 0, // Для линейной функции
			},
			MaxStressOnTheRod: maxStress,
		}

		rodResults = append(rodResults, resultOutput)
	}

	fullResult := &models.FullResult{
		Displacements: displacements,
		ResultOutput:  rodResults,
	}

	return fullResult, nil
}
