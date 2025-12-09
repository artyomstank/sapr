// src/components/preprocessor/RodEditor.tsx
import React from 'react';
import { Rod } from '../../types/sapr.types';

interface RodEditorProps {
    rods: Rod[];
    onChange: (rods: Rod[]) => void;
}

const RodEditor: React.FC<RodEditorProps> = ({ rods, onChange }) => {
    const updateRod = (index: number, field: keyof Rod, value: string | number) => {
        const updated = [...rods];

        if (field !== 'distributedLoad') {
            // Для всех полей кроме distributedLoad запрещаем отрицательные значения
            const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
            // @ts-ignore
            updated[index][field] = Math.max(0, numValue);
        } else {
            // Для distributedLoad разрешаем ввод отрицательных значений и промежуточные состояния
            if (value === '') {
                updated[index][field] = 0;
            } else if (value === '-' || value === '-.') {
                // Сохраняем как строку для промежуточного состояния
                updated[index][field] = value as any;
            } else {
                const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                updated[index][field] = numValue as number;
            }
        }

        onChange(updated);
    };

    const handleInput = (index: number, field: keyof Rod, value: string) => {
        if (field !== 'distributedLoad') {
            // Для всех полей кроме distributedLoad запрещаем ввод минуса
            if (!value.startsWith('-')) {
                updateRod(index, field, value);
            }
        } else {
            // Для distributedLoad разрешаем любой ввод, включая минус
            updateRod(index, field, value);
        }
    };

    const removeRod = (index: number) => {
        onChange(rods.filter((_, i) => i !== index));
    };

    // Функция для получения отображаемого значения distributedLoad
    const getDisplayValue = (rod: Rod): string => {
        if (typeof rod.distributedLoad === 'string') {
            // Если значение хранится как строка (промежуточное состояние), возвращаем как есть
            return rod.distributedLoad;
        }
        // Если это число и равно 0, возвращаем пустую строку
        return rod.distributedLoad === 0 ? '' : rod.distributedLoad.toString();
    };

    return (
        <div>
            <table style={{ width: '80%', borderCollapse: 'collapse', fontSize: '1em' }}>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Li (м)</th>
                    <th>Ai (м²)</th>
                    <th>Ei (Па)</th>
                    <th>[σ]i (Па)</th>
                    <th>qi (Н/м)</th>
                    <th></th>
                </tr>
                </thead>
                <tbody>
                {rods.map((rod, i) => (
                    <tr key={rod.id} style={{
                                backgroundColor:  '#efefefff'
                            }}>
                        <td style={{
                            textAlign: 'center',
                            padding: '15px',
                            fontWeight: 'bold'
                        }}>
                            {rod.id}
                        </td>
                        <td>
                            <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={rod.length}
                                onChange={e => handleInput(i, 'length', e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                type="number"
                                step="0.0001"
                                min="0"
                                value={rod.area}
                                onChange={e => handleInput(i, 'area', e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                type="number"
                                min="0"
                                value={rod.elasticModulus}
                                onChange={e => handleInput(i, 'elasticModulus', e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                type="number"
                                min="0"
                                value={rod.allowableStress}
                                onChange={e => handleInput(i, 'allowableStress', e.target.value)}
                            />
                        </td>
                        <td>
                            <input
                                type="text"
                                value={getDisplayValue(rod)}
                                onChange={e => {
                                    // Разрешаем ввод: пустая строка, минус, минус с точкой, числа с минусом, десятичные числа
                                    const value = e.target.value;
                                    if (value === '' ||
                                        value === '-' ||
                                        value === '-.' ||
                                        /^-?\d*\.?\d*$/.test(value)) {
                                        updateRod(i, 'distributedLoad', value);
                                    }
                                }}
                                onBlur={(e) => {
                                    // При потере фокуса нормализуем значение
                                    const value = e.target.value;
                                    if (value === '' || value === '-' || value === '-.') {
                                        updateRod(i, 'distributedLoad', 0);
                                    } else {
                                        const numValue = parseFloat(value);
                                        if (isNaN(numValue)) {
                                            updateRod(i, 'distributedLoad', 0);
                                        } else {
                                            updateRod(i, 'distributedLoad', numValue);
                                        }
                                    }
                                }}
                                style={{ width: '80px', textAlign: 'right' }}
                            />
                        </td>
                        <td>
                            <button
                                onClick={() => removeRod(i)}
                                style={{
                                    color: 'white',
                                    background: '#db4f4fff',
                                    border: 'none',
                                    fontSize: '1.2em',
                                    cursor: 'pointer',
                                    padding: '2px 6px'
                                }}
                            >
                                ×
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    );
};

export default RodEditor;