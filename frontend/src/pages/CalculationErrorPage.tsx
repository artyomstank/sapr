// src/pages/CalculationErrorPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
    error?: string;
    project?: any;
}

const CalculationErrorPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    useEffect(() => {
        if (!state?.error) {
            navigate('/preprocessor', { replace: true });
            return;
        }
    }, [navigate, state]);

    const handleReturnToPreprocessor = () => {
        if (state?.project) {
            navigate('/preprocessor', {
                state: { project: state.project },
                replace: true
            });
        } else {
            navigate('/preprocessor', { replace: true });
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            padding: '2rem',
            fontFamily: 'Arial, sans-serif',
        }}>
            <div style={{
                width: '60px',
                height: '60px',
                border: '6px solid #ffebee',
                borderTop: '6px solid #f44336',
                borderRadius: '50%',
                marginBottom: '20px',
                animation: 'pulse 1s ease-in-out infinite'
            }} />
            
            <h2 style={{ color: '#d32f2f', marginBottom: '1rem', fontSize: '1.5rem' }}>
                ❌ Ошибка расчёта
            </h2>
            
            <div style={{
                backgroundColor: '#ffebee',
                border: '2px solid #ef5350',
                borderRadius: '6px',
                padding: '1.5rem',
                maxWidth: '600px',
                marginBottom: '2rem',
                color: '#c62828'
            }}>
                <p style={{ marginTop: 0, marginBottom: '0.5rem', fontWeight: 'bold' }}>
                    Детали ошибки:
                </p>
                <p style={{
                    wordBreak: 'break-word',
                    fontSize: '0.95rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap'
                }}>
                    {state?.error || 'Неизвестная ошибка'}
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <button
                    onClick={handleReturnToPreprocessor}
                    style={{
                        padding: '12px 24px',
                        fontSize: '1rem',
                        backgroundColor: '#4a90e2',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#357ae8')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#4a90e2')}
                >
                    ← Назад
                </button>
                <button
                    onClick={() => window.location.reload()}
                    style={{
                        padding: '12px 24px',
                        fontSize: '1rem',
                        backgroundColor: '#f5f5f5',
                        color: '#333',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.3s'
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#efefef')}
                    onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#f5f5f5')}
                >
                    ⟲ Перезагрузить
                </button>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
            `}</style>
        </div>
    );
};

export default CalculationErrorPage;
