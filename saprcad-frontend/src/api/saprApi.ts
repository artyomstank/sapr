// src/api/saprApi.ts
import axios from 'axios';
import {FullResult, StructureInput} from '../types/sapr.types';

const API_BASE = 'http://localhost:8081/api/saprcad';

export interface DisplacementVector {
    displacements: number[];
}

export const saprApi = {
    // Валидация (можно использовать перед расчётом)
    validate: (data: StructureInput) =>
        axios.post<string>(`${API_BASE}/submit`, data),

    // Полный расчёт
    calculate: (data: StructureInput) =>
        axios.post<DisplacementVector>(`${API_BASE}/calculate-structure`, data),

    fullCalculation: (data: StructureInput) =>
        axios.post<FullResult>(`${API_BASE}/full-calculation`, data)
};