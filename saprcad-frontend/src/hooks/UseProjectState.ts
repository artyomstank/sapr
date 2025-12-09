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
            // Отправляем данные на бэкенд для валидации и расчёта
            const response = await saprApi.validate(project);
            
            // Проверяем наличие ошибок в ответе
            if (response.data.errors && response.data.errors.length > 0) {
                setErrors(response.data.errors);
                return { success: false };
            }

            // Если ошибок нет, считаем расчёт успешным
            // Пока возвращаем пустой массив смещений, до тех пор пока бэкенд их не вернёт
            return { success: true, displacements: [] };
        } catch (err: any) {
            const errMsgs = err.response?.data?.errors || err.response?.data || ['Ошибка расчёта'];
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