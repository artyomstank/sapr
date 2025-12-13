export interface Node {
    id: number;               // номер узла (глобальный)
    fixed: boolean;         // true — жёсткая опора, false — свободен
    externalForce: number;    // F_j: >0 — растяжение, <0 — сжатие, 0 — нет нагрузки
}

export interface Rod {
    id: number;               // номер стержня
    length: number;           // Li > 0
    area: number;             // Ai > 0
    elasticModulus: number;   // Ei > 0
    allowableStress: number;  // [σ]i > 0
    distributedLoad: number;  // qi: >0 — растяжение, <0 — сжатие, 0 — нет
}

export interface StructureInput {
    rods: Rod[];
    nodes: Node[];
}

export interface AxialForceCoeffs {
    a0: number;
    a1: number;
    a2: null; // всегда null для линейного N(x)
}

export interface DisplacementCoeffs {
    a0: number;
    a1: number;
    a2: number;
}

export interface StressCoeffs {
    a0: number;
    a1: number;
    a2: null;
}

export interface RodResult {
    rodId: number;
    length: number;
    area: number;
    elasticModulus: number;
    allowableStress: number;
    distributedLoad: number;
    nodeRelatedTo: Node[];
    axialForceCoeffs: AxialForceCoeffs;
    displacementCoeffs: DisplacementCoeffs;
    stressCoeffs: StressCoeffs;
    maxStressOnTheRod: number;
}

export interface FullResult {
    displacements: number[];
    resultOutput: RodResult[];
}