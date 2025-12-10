package processor

import (
	"fmt"
	"math"
	"pipks/models"
)

// CalculateDisplacements вычисляет смещения узлов конструкции
func CalculateDisplacements(input *models.StructureInput) (*models.DisplacementVector, error) {
	if input == nil {
		return nil, fmt.Errorf("входные данные не могут быть nil")
	}

	n := len(input.Nodes) // размерность задачи

	// Глобальная матрица жёсткости A (n x n)
	A := make([][]float64, n)
	for i := 0; i < n; i++ {
		A[i] = make([]float64, n)
	}

	// Вектор нагрузок b (размер n)
	b := make([]float64, n)

	// Этап 1: Сборка A и F от стержней
	for i, rod := range input.Rods {
		// Жёсткость стержня k = EA/L
		k := rod.ElasticModulus * rod.Area / rod.Length

		// Стержень i соединяет узлы i и i+1
		nodeA := i
		nodeB := i + 1

		// Добавляем в глобальную матрицу жёсткости
		A[nodeA][nodeA] += k
		A[nodeA][nodeB] -= k
		A[nodeB][nodeA] -= k
		A[nodeB][nodeB] += k

		// Эквивалентные узловые силы от равномерной погонной нагрузки qi
		// Для стержня: F_A += qi * L / 2, F_B += qi * L / 2
		equivForce := rod.DistributedLoad * rod.Length / 2.0
		b[nodeA] += equivForce
		b[nodeB] += equivForce
	}

	// Этап 2: Добавляем сосредоточенные силы
	for j, node := range input.Nodes {
		b[j] += node.ExternalForce
	}

	// Этап 3: Определяем свободные узлы (незакреплённые)
	var freeNodes []int
	for i, node := range input.Nodes {
		if !node.Fixed {
			freeNodes = append(freeNodes, i)
		}
	}

	m := len(freeNodes)

	// Если все узлы закреплены, все смещения равны 0
	if m == 0 {
		displacements := make([]float64, n)
		return &models.DisplacementVector{Displacements: displacements}, nil
	}

	// Формируем сокращённую матрицу K_reduced и вектор F_reduced
	K_reduced := make([][]float64, m)
	for i := 0; i < m; i++ {
		K_reduced[i] = make([]float64, m)
	}
	F_reduced := make([]float64, m)

	for i := 0; i < m; i++ {
		for j := 0; j < m; j++ {
			K_reduced[i][j] = A[freeNodes[i]][freeNodes[j]]
		}
		F_reduced[i] = b[freeNodes[i]]
	}

	// Этап 4: Решаем систему уравнений K_reduced * delta_free = F_reduced
	// Используем метод Гаусса с прямой подстановкой
	deltaFree, err := solveLinearSystem(K_reduced, F_reduced)
	if err != nil {
		return nil, err
	}

	// Этап 5: Формируем полный вектор смещений (с нулями в закреплённых узлах)
	fullDelta := make([]float64, n)
	for i := 0; i < n; i++ {
		fullDelta[i] = 0.0
	}
	for i := 0; i < m; i++ {
		fullDelta[freeNodes[i]] = deltaFree[i]
	}

	return &models.DisplacementVector{Displacements: fullDelta}, nil
}

// solveLinearSystem решает систему линейных уравнений Ax = b методом Гаусса
func solveLinearSystem(A [][]float64, b []float64) ([]float64, error) {
	n := len(A)
	if len(b) != n {
		return nil, fmt.Errorf("размеры матрицы и вектора не совпадают")
	}

	// Создаём копию матрицы и вектора
	matrix := make([][]float64, n)
	for i := 0; i < n; i++ {
		matrix[i] = make([]float64, n+1)
		copy(matrix[i][:n], A[i])
		matrix[i][n] = b[i]
	}

	// Прямой ход - приведение к треугольному виду
	for i := 0; i < n; i++ {
		// Поиск максимального элемента в столбце (выбор главного элемента)
		maxRow := i
		for k := i + 1; k < n; k++ {
			if math.Abs(matrix[k][i]) > math.Abs(matrix[maxRow][i]) {
				maxRow = k
			}
		}

		// Проверка на сингулярность
		if math.Abs(matrix[maxRow][i]) < 1e-10 {
			return nil, fmt.Errorf("Конструкция не имеет ни одного крепления")
		}

		// Обмен строк
		matrix[i], matrix[maxRow] = matrix[maxRow], matrix[i]

		// Исключение переменной
		for k := i + 1; k < n; k++ {
			c := matrix[k][i] / matrix[i][i]
			for j := i; j <= n; j++ {
				if i == j {
					matrix[k][j] = 0
				} else {
					matrix[k][j] -= c * matrix[i][j]
				}
			}
		}
	}

	// Обратный ход - нахождение решения
	x := make([]float64, n)
	for i := n - 1; i >= 0; i-- {
		x[i] = matrix[i][n]
		for j := i + 1; j < n; j++ {
			x[i] -= matrix[i][j] * x[j]
		}
		x[i] /= matrix[i][i]
	}

	return x, nil
}
