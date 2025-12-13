import React from 'react';
import { Node } from '../../types/sapr.types';

interface NodeEditorProps {
    nodes: Node[];
    rods: any[];
    onChange: (nodes: Node[]) => void;
}

const NodeEditor: React.FC<NodeEditorProps> = ({ nodes, rods, onChange }) => {
    // Проверяем, можно ли зафиксировать узел (только первый и последний)
    const canFixNode = (nodeIndex: number) => {
        return nodeIndex === 0 || nodeIndex === nodes.length - 1;
    };

    const updateNode = (index: number, field: keyof Node, value: string | boolean | number) => {
        const updated = [...nodes];

        if (field === 'fixed') {
            // Нормализуем булево значение
            let boolValue: boolean;
            if (typeof value === 'string') {
                boolValue = value === 'true' || value === '1' || value.toLowerCase() === 'истина';
            } else {
                boolValue = Boolean(value);
            }

            // Проверяем, можно ли установить заделку
            if (boolValue && !canFixNode(index)) {
                alert('Заделки можно устанавливать только на крайних узлах конструкции!');
                return;
            }
            updated[index][field] = boolValue;
        } else if (field === 'externalForce') {

            if (value === '') {
                updated[index][field] = 0;
            } else if (value === '-' || value === '-.') {
                // Сохраняем как строку для промежуточного состояния
                updated[index][field] = value as any;
            } else {
                const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
                updated[index][field] = numValue as number;
            }
        } else {
            // @ts-ignore
            updated[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value;
        }
        onChange(updated);
    };

    const handleForceInput = (index: number, value: string) => {
        // Разрешаем: пустую строку, минус, минус с точкой, отрицательные числа, десятичные числа
        if (value === '' ||
            value === '-' ||
            value === '-.' ||
            /^-?\d*\.?\d*$/.test(value)) {
            updateNode(index, 'externalForce', value);
        }
    };

    const removeNode = (index: number) => {
        // Не позволяем удалить узел, если он используется в стержнях
        const isNodeUsed = rods.some(rod => rod.startNode === nodes[index].id || rod.endNode === nodes[index].id);

        if (isNodeUsed) {
            alert('Нельзя удалить узел, который используется в стержнях!');
            return;
        }

        // Удаляем узел
        const updatedNodes = nodes.filter((_, i) => i !== index);

        // Переиндексируем ID узлов, чтобы они шли последовательно от 0
        const reindexedNodes = updatedNodes.map((node, newIndex) => ({
            ...node,
            id: newIndex
        }));

        onChange(reindexedNodes);
    };

    // Функция для получения отображаемого значения
    const getDisplayValue = (node: Node): string => {
        if (typeof node.externalForce === 'string') {
            // Если значение хранится как строка (промежуточное состояние), возвращаем как есть
            return node.externalForce;
        }
        // Если это число и равно 0, возвращаем пустую строку
        return node.externalForce === 0 ? '' : node.externalForce.toString();
    };

    return (
        <div style={{ width: '100%', maxWidth: '100%' }}>
            <div style={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: '1rem',
                width: '100%'
            }}>
                {/* Таблица узлов */}
                <div style={{ flex: 1 }}>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        fontSize: '0.9em',
                        minWidth: '400px'
                    }}>
                        <thead>
                        <tr>
                            <th>ID</th>
                            <th style={{ textAlign: 'center' }}>Заделка</th>
                            <th style={{ textAlign: 'center' }}>Fj (Н)</th>
                            <th></th>
                        </tr>
                        </thead>
                        <tbody>
                        {nodes.map((node, i) => (
                            <tr key={node.id} style={{
                                backgroundColor: canFixNode(i) ? '#a1edafff' : '#efefefff'
                            }}>
                                <td style={{
                                    textAlign: 'center',
                                    padding: '15px',
                                    fontWeight: 'bold'
                                }}>
                                    {node.id}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={node.fixed}
                                        disabled={!canFixNode(i)}
                                        onChange={e => updateNode(i, 'fixed', e.target.checked)}
                                        title={!canFixNode(i) ? "Заделки можно ставить только на крайних узлах" : ""}
                                    />
                                    {!canFixNode(i) && node.fixed && (
                                        <span style={{color: 'red', fontSize: '0.8em', marginLeft: '5px'}}>⚠️</span>
                                    )}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <input
                                        type="text"
                                        value={getDisplayValue(node)}
                                        onChange={e => handleForceInput(i, e.target.value)}
                                        onBlur={(e) => {
                                            const value = e.target.value;
                                            if (value === '' || value === '-' || value === '-.') {
                                                updateNode(i, 'externalForce', 0);
                                            } else {
                                                // При потере фокуса нормализуем значение
                                                const numValue = parseFloat(value);
                                                if (isNaN(numValue)) {
                                                    updateNode(i, 'externalForce', 0);
                                                } else {
                                                    updateNode(i, 'externalForce', numValue);
                                                }
                                            }
                                        }}
                                        placeholder="0"
                                        style={{ width: '60px', textAlign: 'right' }}
                                    />
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                    <button
                                        onClick={() => removeNode(i)}
                                        style={{
                                            color: 'white',
                                            background: '#db4f4fff',
                                            border: 'none',
                                            fontSize: '1.2em',
                                            cursor: 'pointer',
                                            padding: '2px 6px'
                                        }}
                                        title="Удалить узел"
                                    >
                                        ×
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Подсказка для пользователя - теперь справа от таблицы */}
                <div style={{
                    marginTop: '0',
                    fontSize: '1em',
                    color: '#666',
                    padding: '1.2rem',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    maxWidth: '0px',
                    minWidth: '400px',
                    flexShrink: 0
                }}>
                    Заделки можно устанавливать только на крайних узлах конструкции (отмечены зеленым цветом)
                </div>
            </div>
        </div>
    );
};

export default NodeEditor;