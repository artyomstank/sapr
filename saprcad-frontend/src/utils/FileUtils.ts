// src/utils/fileUtils.ts
import { StructureInput } from '../types/sapr.types';

export const saveProjectToFile = (data: StructureInput): void => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sapr_structure.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

export const loadProjectFromFile = (file: File): Promise<StructureInput> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result;
                if (typeof result !== 'string') {
                    reject(new Error('Неверный формат файла'));
                    return;
                }
                const data = JSON.parse(result);
                // Базовая проверка структуры
                if (!Array.isArray(data.rods) || !Array.isArray(data.nodes)) {
                    reject(new Error('Файл не содержит rods или nodes'));
                    return;
                }
                resolve(data as StructureInput);
            } catch (err) {
                reject(new Error('Ошибка парсинга JSON: ' + (err as Error).message));
            }
        };
        reader.onerror = () => reject(new Error('Ошибка чтения файла'));
        reader.readAsText(file);
    });
};