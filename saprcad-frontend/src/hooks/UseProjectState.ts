// src/hooks/useProjectState.ts
import { useState } from 'react';
import { StructureInput } from '../types/sapr.types';
import { saprApi } from '../api/saprApi';
import { saveProjectToFile, loadProjectFromFile } from '../utils/FileUtils';

export const useProjectState = () => {
    const [project, setProject] = useState<StructureInput>({
        rods: [],
        nodes: [],
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<string[]>([]);

    const validateAndCalculate = async (): Promise<{ success: boolean; displacements?: number[] }> => {
        setLoading(true);
        setErrors([]);
        try {
            // Сначала валидация
            await saprApi.validate(project);

            // Расчёт
            const response = await saprApi.calculate(project);
            return { success: true, displacements: response.data.displacements };
        } catch (err: any) {
            const errMsgs = err.response?.data || ['Ошибка расчёта'];
            setErrors(Array.isArray(errMsgs) ? errMsgs : [errMsgs]);
            return { success: false };
        } finally {
            setLoading(false);
        }
    };

    const saveToFile = () => {
        saveProjectToFile(project);
    };

    const loadFromFile = async (file: File) => {
        try {
            const data = await loadProjectFromFile(file);
            setProject(data);
            setErrors([]);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const clearProject = () => {
        setProject({ rods: [], nodes: [] });
        setErrors([]);
    };

    return {
        project,
        setProject,
        loading,
        errors,
        validateAndCalculate,
        saveToFile,
        loadFromFile,
        clearProject,
    };
};