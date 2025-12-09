// src/components/preprocessor/FileControls.tsx
import React, { useRef } from 'react';

interface FileControlsProps {
    onUploadJson: (file: File) => void;
    onSaveJson: () => void;
    onCalculate: () => void;
    disabled: boolean;
}

const FileControls: React.FC<FileControlsProps> = ({
                                                       onUploadJson,
                                                       onSaveJson,
                                                       onCalculate,
                                                       disabled,
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

    return (
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />
            <button onClick={() => fileInputRef.current?.click()} disabled={disabled}>
                Загрузить .json
            </button>
            <button onClick={onSaveJson} disabled={disabled}>
                Сохранить .json
            </button>
            <button
                onClick={onCalculate}
                disabled={disabled}
                style={{ backgroundColor: '#4CAF50', color: 'white', padding: '6px 12px' }}
            >
                Выполнить расчёт →
            </button>
        </div>
    );
};

export default FileControls;