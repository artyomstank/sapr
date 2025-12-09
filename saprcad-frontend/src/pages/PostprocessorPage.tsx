// src/pages/PostprocessorPage.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { StructureInput, FullResult, RodResult } from '../types/sapr.types';
import { saprApi } from '../api/saprApi';
import ResultTable from '../components/postprocessor/ResultTable';
import ConstructionWithEpures from '../components/postprocessor/ConstructionWithEpures';
import SectionCalculator, { SectionCalcResult, SectionCalculatorHandle } from '../components/postprocessor/SectionCalculator';
import UniformStepCalculator, { UniformStepRow, UniformStepHandle } from '../components/postprocessor/UniformStepCalculator';
import EpurePlot from '../components/postprocessor/EpurePlot';
import ExportHtmlModal from '../components/postprocessor/ExportHtmlModal';

interface LocationState {
    project?: StructureInput;
    displacements?: number[];
}

interface HtmlModalState {
    open: boolean;
    history: SectionCalcResult[];
    stepData: UniformStepRow[];
}

const PostprocessorPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [result, setResult] = useState<FullResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showHtmlModal, setShowHtmlModal] = useState<HtmlModalState>({
        open: false,
        history: [],
        stepData: []
    });

    // ref-ы для получения данных
    const sectionCalcRef = useRef<SectionCalculatorHandle>(null);
    const uniformStepRef = useRef<UniformStepHandle>(null);

    const state = location.state as LocationState | null;

    useEffect(() => {
        const fetchData = async () => {
            if (!state?.project) {
                alert('Нет данных для расчёта');
                navigate('/preprocessor');
                return;
            }

            try {
                const res = await saprApi.fullCalculation(state.project);
                setResult(res.data);
            } catch (err: any) {
                const msg = err.response?.data?.message
                    || err.response?.data?.error
                    || err.response?.statusText
                    || err.message
                    || 'Неизвестная ошибка';
                setError(`Ошибка расчёта: ${msg}`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [state, navigate]);

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>Выполняется расчёт...</h2>
                <div className="spinner" style={{
                    width: '40px', height: '40px', margin: '2rem auto',
                    border: '4px solid #f3f3f3', borderTop: '4px solid #4a90e2',
                    borderRadius: '50%', animation: 'spin 1s linear infinite'
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ padding: '2rem', color: 'red' }}>
                <h2>Ошибка</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/preprocessor')}>
                    ← Вернуться в препроцессор
                </button>
            </div>
        );
    }

    if (!result) return null;

    const handleExportClick = () => {
        const history = sectionCalcRef.current?.getHistory() || [];
        const stepData = uniformStepRef.current?.getStepData() || [];
        setShowHtmlModal({
            open: true,
            history,
            stepData
        });
    };

    const handleCloseModal = () => {
        setShowHtmlModal(prev => ({
            ...prev,
            open: false
        }));
    };

    return (
        <div style={{ padding: '1.5rem', fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2>Постпроцессор: анализ </h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={handleExportClick}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        HTML-отчёт
                    </button>
                    <button
                        onClick={() => navigate('/preprocessor', { state: { project: state?.project } })}
                        style={{
                            padding: '8px 20px',
                            fontSize: '1rem',
                            backgroundColor: '#90a4ae',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        ← Вернуться в препроцессор
                    </button>
                </div>
            </div>

            <section style={{ marginBottom: '2rem' }}>
                <h3>Узловые перемещения ∆</h3>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {result.displacements.map((u, i) => (
                        <div key={i} style={{
                            padding: '0.5rem 1rem',
                            backgroundColor: '#e3f2fd',
                            borderRadius: '4px',
                            minWidth: '100px',
                            textAlign: 'center'
                        }}>
                            <strong>Узел {i}</strong><br />
                            <span style={{ fontSize: '1.2em' }}>{u.toFixed(6)}</span> м
                        </div>
                    ))}
                </div>
            </section>

            <ConstructionWithEpures rods={result.resultOutput} />

            <ResultTable result={result} />

            <SectionCalculator
                ref={sectionCalcRef}
                rods={result.resultOutput}
            />

            <UniformStepCalculator
                ref={uniformStepRef}
                rods={result.resultOutput}
            />

            <div style={{ marginTop: '3rem' }}>
                <h3>Эпюры вдоль конструкции</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                    <div>
                        <h4>Продольные силы N(x)</h4>
                        <EpurePlot
                            rods={result.resultOutput}
                            getValue={(rod, x) => rod.axialForceCoeffs.a0 + rod.axialForceCoeffs.a1 * x}
                            ylabel="N(x), Н"
                            color="#e53935"
                        />
                    </div>
                    <div>
                        <h4>Напряжения σ(x)</h4>
                        <EpurePlot
                            rods={result.resultOutput}
                            getValue={(rod, x) => rod.stressCoeffs.a0 + rod.stressCoeffs.a1 * x}
                            ylabel="σ(x), Па"
                            color="#1e88e5"
                            showAllowable={true}
                            allowableStress={result.resultOutput[0]?.allowableStress}
                        />
                    </div>
                    <div>
                        <h4>Перемещения u(x)</h4>
                        <EpurePlot
                            rods={result.resultOutput}
                            getValue={(rod, x) =>
                                rod.displacementCoeffs.a0 +
                                rod.displacementCoeffs.a1 * x +
                                rod.displacementCoeffs.a2 * x * x
                            }
                            ylabel="u(x), м"
                            color="#43a047"
                        />
                    </div>
                </div>
            </div>

            {showHtmlModal.open && (
                <ExportHtmlModal
                    rods={result.resultOutput}
                    displacements={result.displacements}
                    sectionCalcHistory={showHtmlModal.history}
                    uniformStepData={showHtmlModal.stepData}
                    onClose={handleCloseModal}
                />
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                    onClick={() => navigate('/preprocessor', { state: { project: state?.project } })}
                    style={{
                        padding: '8px 20px',
                        fontSize: '1rem',
                        backgroundColor: '#90a4ae',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    Вернуться в препроцессор для редактирования
                </button>
            </div>
        </div>
    );
};

export default PostprocessorPage;