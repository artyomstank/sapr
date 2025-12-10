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

    const validateAndCalculate = async (): Promise<{ success: boolean; displacements?: number[]; errorMessage?: string }> => {
        setLoading(true);
        setErrors([]);
        try {
            // Сначала валидация
            const validateResponse = await saprApi.validate(project);
            if (validateResponse.data.errors && validateResponse.data.errors.length > 0) {
                const errorMessage = validateResponse.data.errors.join('\n');
                setErrors(validateResponse.data.errors);
                return { success: false, errorMessage };
            }

            // Расчёт смещений
            const response = await saprApi.calculate(project);
            return { success: true, displacements: response.data.displacements };
        } catch (err: any) {
            const errMsgs = err.response?.data?.errors || err.response?.data || ['Ошибка расчёта'];
            const errorArray = Array.isArray(errMsgs) ? errMsgs : [errMsgs];
            const errorMessage = errorArray.join('\n');
            setErrors(errorArray);
            return { success: false, errorMessage };
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