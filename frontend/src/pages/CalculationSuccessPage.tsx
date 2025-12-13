// src/pages/CalculationSuccessPage.tsx
import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
    project?: any;
    displacements?: number[];
}

const CalculationSuccessPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    useEffect(() => {
        if (!state?.project || !state?.displacements) {
            navigate('/preprocessor', { replace: true });
            return;
        }

        // Через 1.5 секунды переходим в постпроцессор
        const timer = setTimeout(() => {
            navigate('/postprocessor', { state, replace: true });
        }, 1500);

        return () => clearTimeout(timer);
    }, [navigate, state]);

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '300px',
            fontSize: '1.3rem',
            color: '#2e7d32'
        }}>
            <div style={{
                width: '60px',
                height: '60px',
                border: '6px solid #e8f5e9',
                borderTop: '6px solid #4caf50',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
            }} />
            <p style={{ marginTop: '20px' }}>Расчёт выполнен успешно!</p>
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
};

export default CalculationSuccessPage;