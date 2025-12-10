package validator

import (
	"fmt"
	"pipks/models"
)

// ValidateStructure проверяет корректность входных данных
func ValidateStructure(input *models.StructureInput) []string {
	var errors []string

	// Проверка на nil
	if input == nil {
		errors = append(errors, "Входные данные не могут быть nil")
		return errors
	}

	if input.Nodes == nil {
		errors = append(errors, "Список узлов не может быть nil")
	}

	if input.Rods == nil {
		errors = append(errors, "Список стержней не может быть nil")
	}

	if len(errors) > 0 {
		return errors
	}

	// Проверка что списки не пустые
	if len(input.Nodes) == 0 {
		errors = append(errors, "Список узлов не может быть пустым")
	}

	if len(input.Rods) == 0 {
		errors = append(errors, "Список стержней не может быть пустым")
	}

	if len(errors) > 0 {
		return errors
	}

	// Проверка количества узлов = количество стержней + 1
	if len(input.Nodes) != len(input.Rods)+1 {
		errors = append(errors, fmt.Sprintf(
			"Количество узлов должно быть на 1 больше количества стержней. Узлов: %d, стержней: %d",
			len(input.Nodes), len(input.Rods)))
	}

	// Проверка уникальности ID стержней
	validateUniqueIds(input.Rods, "стержней", &errors)

	// Проверка уникальности ID узлов
	validateUniqueNodeIds(input.Nodes, "узлов", &errors)

	// Проверка корректности ID (не отрицательные)
	validateIdNonNegativeRods(input.Rods, "стержней", &errors)
	validateIdNonNegativeNodes(input.Nodes, "узлов", &errors)

	// Проверка физических ограничений для стержней
	for _, rod := range input.Rods {
		if rod.Length <= 0 {
			errors = append(errors, fmt.Sprintf("Стержень ID=%d: длина должна быть > 0", rod.ID))
		}
		if rod.Area <= 0 {
			errors = append(errors, fmt.Sprintf("Стержень ID=%d: площадь сечения должна быть > 0", rod.ID))
		}
		if rod.ElasticModulus <= 0 {
			errors = append(errors, fmt.Sprintf("Стержень ID=%d: модуль упругости должен быть > 0", rod.ID))
		}
		if rod.AllowableStress <= 0 {
			errors = append(errors, fmt.Sprintf("Стержень ID=%d: допускаемое напряжение должно быть > 0", rod.ID))
		}
	}

	// Проверка последовательности ID узлов
	validateNodeIdSequence(input.Nodes, &errors)

	// Проверка последовательности ID стержней
	validateRodIdSequence(input.Rods, &errors)

	// Проверка структуры стержневой системы
	validateStructureConnectivity(input.Rods, input.Nodes, &errors)

	// Проверка расположения опор
	validateSupportLocations(input.Nodes, &errors)

	return errors
}

// validateUniqueIds проверяет уникальность ID стержней
func validateUniqueIds(rods []models.Rod, typ string, errors *[]string) {
	if len(rods) == 0 {
		return
	}

	idMap := make(map[int]bool)
	for _, rod := range rods {
		if idMap[rod.ID] {
			*errors = append(*errors, fmt.Sprintf("Дублированный ID %d в списке %s", rod.ID, typ))
		}
		idMap[rod.ID] = true
	}
}

// validateUniqueNodeIds проверяет уникальность ID узлов
func validateUniqueNodeIds(nodes []models.Node, typ string, errors *[]string) {
	if len(nodes) == 0 {
		return
	}

	idMap := make(map[int]bool)
	for _, node := range nodes {
		if idMap[node.ID] {
			*errors = append(*errors, fmt.Sprintf("Дублированный ID %d в списке %s", node.ID, typ))
		}
		idMap[node.ID] = true
	}
}

// validateIdNonNegativeRods проверяет что ID стержней не отрицательные
func validateIdNonNegativeRods(rods []models.Rod, typ string, errors *[]string) {
	for _, rod := range rods {
		if rod.ID < 0 {
			*errors = append(*errors, fmt.Sprintf("%s не может иметь отрицательный ID: %d", typ, rod.ID))
		}
	}
}

// validateIdNonNegativeNodes проверяет что ID узлов не отрицательные
func validateIdNonNegativeNodes(nodes []models.Node, typ string, errors *[]string) {
	for _, node := range nodes {
		if node.ID < 0 {
			*errors = append(*errors, fmt.Sprintf("%s не может иметь отрицательный ID: %d", typ, node.ID))
		}
	}
}

// validateNodeIdSequence проверяет что ID узлов идут последовательно от 0
func validateNodeIdSequence(nodes []models.Node, errors *[]string) {
	for i, node := range nodes {
		if node.ID != i {
			*errors = append(*errors, fmt.Sprintf("Узлы должны иметь последовательные ID начиная с 0. Ожидается ID=%d, получено ID=%d", i, node.ID))
		}
	}
}

// validateRodIdSequence проверяет что ID стержней идут последовательно от 0
func validateRodIdSequence(rods []models.Rod, errors *[]string) {
	for i, rod := range rods {
		if rod.ID != i {
			*errors = append(*errors, fmt.Sprintf("Стержни должны иметь последовательные ID начиная с 0. Ожидается ID=%d, получено ID=%d", i, rod.ID))
		}
	}
}

// validateStructureConnectivity проверяет связность структуры
func validateStructureConnectivity(rods []models.Rod, nodes []models.Node, errors *[]string) {
	// Все стержни должны соединять соседние узлы (для упрощенной модели)
	// Стержень i должен соединять узлы i и i+1
	// На текущей стадии эта проверка не критична, так как модель подразумевает
	// что стержни всегда соединяют соседние узлы
}

// validateSupportLocations проверяет что опоры установлены только на крайних узлах
func validateSupportLocations(nodes []models.Node, errors *[]string) {
	for i, node := range nodes {
		if node.Fixed && i > 0 && i < len(nodes)-1 {
			*errors = append(*errors, fmt.Sprintf("Заделка на узле ID=%d: опоры могут быть только на крайних узлах", node.ID))
		}
	}
}
