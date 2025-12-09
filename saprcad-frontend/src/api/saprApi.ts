// src/api/saprApi.ts
import axios from 'axios';
import {FullResult, StructureInput} from '../types/sapr.types';

const API_BASE = 'http://localhost:8080/api';

export interface ValidationResponse {
    nodes: any[];
    rods: any[];
    errors: string[];
    warnings: string[];
}

export const saprApi = {
    // Валидация структуры
    validate: (data: StructureInput) =>
        axios.post<ValidationResponse>(`${API_BASE}/structure/preview`, data),

    // Для совместимости используем тот же эндпоинт
    calculate: (data: StructureInput) =>
        axios.post<{displacements: number[]}>(`${API_BASE}/structure/preview`, data),

    fullCalculation: (data: StructureInput) =>
        axios.post<FullResult>(`${API_BASE}/structure/preview`, data)
};