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
