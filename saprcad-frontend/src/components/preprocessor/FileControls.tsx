// src/components/preprocessor/FileControls.tsx
import React, { useRef } from 'react';

interface FileControlsProps {
    onUploadJson: (file: File) => void;
    onSaveJson: () => void;
    onCalculate: () => void;
    onClearProject: () => void;
    onAddNode: () => void;
    onAddRod: () => void;
    disabled: boolean;
    showNodeRodControls?: boolean;
}

const FileControls: React.FC<FileControlsProps> = ({
    onUploadJson,
    onSaveJson,
    onCalculate,
    onClearProject,
    onAddNode,
    onAddRod,
    disabled,
    showNodeRodControls = true,
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file?.name.endsWith('.json')) {
            onUploadJson(file);
        } else {
            alert('Поддерживаются только .json файлы');
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClearProject = () => {
        if (window.confirm('Вы уверены, что хотите очистить проект? Все данные будут удалены.')) {
            onClearProject();
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            gap: '0.5rem', 
            flexWrap: 'wrap', 
            alignItems: 'center',
            marginBottom: '1rem'
        }}>
            {/* Основные кнопки управления файлами */}
            <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                alignItems: 'center',
                flexWrap: 'wrap'
            }}>
                <input
                    type="file"
                    ref={fileInputRef}
                    accept=".json"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                />
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={disabled}
                    style={{ 
                        padding: '6px 12px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Загрузить .json
                </button>
                <button 
                    onClick={onSaveJson} 
                    disabled={disabled}
                    style={{ 
                        padding: '6px 12px',
                        backgroundColor: '#f0f0f0',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    Сохранить .json
                </button>
                <button
                    onClick={handleClearProject}
                    disabled={disabled}
                    style={{ 
                        padding: '6px 12px',
                        backgroundColor: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    Очистить проект
                </button>
            </div>

            {/* Кнопки управления узлами и стержнями */}
            {showNodeRodControls && (
                <div style={{ 
                    display: 'flex', 
                    gap: '0.5rem', 
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    marginLeft: '1rem'
                }}>
                    <button 
                        onClick={onAddNode}
                        disabled={disabled}
                        style={{ 
                            padding: '6px 12px',
                            backgroundColor: '#a1edafff',
                            color: 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        + Добавить узел
                    </button>
                    <button 
                        onClick={onAddRod}
                        disabled={disabled}
                        style={{ 
                            padding: '6px 12px',
                            backgroundColor: '#a1edafff',
                            color: 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        + Добавить стержень
                    </button>
                </div>
            )}

            {/* Кнопка расчета */}
            <div style={{ 
                marginLeft: 'auto', 
                display: 'flex', 
                alignItems: 'center'
            }}>
                <button
                    onClick={onCalculate}
                    disabled={disabled}
                    style={{ 
                        backgroundColor: '#4CAF50', 
                        color: 'white', 
                        padding: '8px 16px',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '1rem'
                    }}
                >
                    Выполнить расчёт →
                </button>
            </div>
        </div>
    );
};

export default FileControls;