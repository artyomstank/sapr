package models

type Rod struct {
	ID              int     `json:"id"`
	Length          float64 `json:"length"`
	Area            float64 `json:"area"`
	ElasticModulus  float64 `json:"elasticModulus"`
	AllowableStress float64 `json:"allowableStress"`
	DistributedLoad float64 `json:"distributedLoad"`
}

type Node struct {
	ID            int     `json:"id"`
	Fixed         bool    `json:"fixed"`
	ExternalForce float64 `json:"externalForce"`
}

type StructureInput struct {
	Nodes []Node `json:"nodes"`
	Rods  []Rod  `json:"rods"`
}

type ValidationResult struct {
	Nodes    []Node   `json:"nodes"`
	Rods     []Rod    `json:"rods"`
	Errors   []string `json:"errors"`
	Warnings []string `json:"warnings"`
}

type DisplacementVector struct {
	Displacements []float64 `json:"displacements"`
}

type PolynomialCoeffs struct {
	A0 float64 `json:"a0"`
	A1 float64 `json:"a1"`
	A2 float64 `json:"a2"`
}

type RodResult struct {
	RodID              int              `json:"rodId"`
	Length             float64          `json:"length"`
	Area               float64          `json:"area"`
	ElasticModulus     float64          `json:"elasticModulus"`
	AllowableStress    float64          `json:"allowableStress"`
	DistributedLoad    float64          `json:"distributedLoad"`
	NodeRelatedTo      []Node           `json:"nodeRelatedTo"`
	AxialForceCoeffs   PolynomialCoeffs `json:"axialForceCoeffs"`
	DisplacementCoeffs PolynomialCoeffs `json:"displacementCoeffs"`
	StressCoeffs       PolynomialCoeffs `json:"stressCoeffs"`
	MaxStressOnTheRod  float64          `json:"maxStressOnTheRod"`
}

type FullResult struct {
	Displacements []float64   `json:"displacements"`
	ResultOutput  []RodResult `json:"resultOutput"`
}
