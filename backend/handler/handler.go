package handler

import (
	"pipks/models"
)

func ValidateStructure(in models.StructureInput) models.ValidationResult {
	var errs []string
	var warns []string

	// 1. Проверка counts
	if len(in.Nodes) != len(in.Rods)+1 {
		errs = append(errs, "Количество узлов должно быть на 1 больше числа стержней")
	}

	// 2. Проверка id подряд
	for i, n := range in.Nodes {
		if n.ID != i {
			errs = append(errs, "Узел с ID не соответствует порядку массива")
		}
	}

	// 3. Параметры стержней
	for _, r := range in.Rods {
		if r.Length <= 0 {
			errs = append(errs, "Длина стержня должна быть > 0")
		}
		if r.Area <= 0 {
			errs = append(errs, "Площадь должна быть > 0")
		}
		if r.ElasticModulus <= 0 {
			errs = append(errs, "Модуль упругости должен быть > 0")
		}
		if r.AllowableStress <= 0 {
			errs = append(errs, "Допускаемое напряжение должно быть > 0")
		}
	}

	// 4. Проверка fixed nodes
	for i, n := range in.Nodes {
		if n.Fixed && !(i == 0 || i == len(in.Nodes)-1) {
			errs = append(errs, "Заделки можно ставить только на крайних узлах")
		}
	}

	return models.ValidationResult{
		Nodes:    in.Nodes,
		Rods:     in.Rods,
		Errors:   errs,
		Warnings: warns,
	}
}
