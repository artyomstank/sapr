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
                navigate('/preprocessor', { replace: true });
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
                const errorMsg = `Ошибка расчёта: ${msg}`;
                navigate('/calculation-error', {
                    state: { error: errorMsg },
                    replace: true
                });
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

    if (!result) return null;

    // Обработка случая когда resultOutput отсутствует (для совместимости с новым бэкендом)
    const resultOutput = 'resultOutput' in result ? (result as FullResult).resultOutput : [];
    const displacements = 'displacements' in result ? result.displacements : [];

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
                            backgroundColor: '#a1edafff',
                            color: 'black',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                    >
                        сохранить в HTML
                    </button>
                    <button
                        onClick={() => navigate('/preprocessor', { state: { project: state?.project } })}
                        style={{
                            padding: '8px 20px',
                            fontSize: '1rem',
                            backgroundColor: '#f0f0f0',
                            border: '1px solid #ccc',
                            color: 'black',
                            borderRadius: '4px',
                            cursor: 'pointer',
                        }}
                    >
                        ← Назад
                    </button>
                </div>
            </div>

            {/* 1. Эпюры вдоль конструкции */}
            <div style={{ marginTop: '2rem' }}>
                <h3>Эпюры вдоль конструкции</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
                    <div>
                        <h4>Продольные силы N(x)</h4>
                        <EpurePlot
                            rods={resultOutput}
                            getValue={(rod, x) => rod.axialForceCoeffs.a0 + rod.axialForceCoeffs.a1 * x}
                            ylabel="N(x), Н"
                            color="#e53935"
                        />
                    </div>
                    <div>
                        <h4>Напряжения σ(x)</h4>
                        <EpurePlot
                            rods={resultOutput}
                            getValue={(rod, x) => rod.stressCoeffs.a0 + rod.stressCoeffs.a1 * x}
                            ylabel="σ(x), Па"
                            color="#1e88e5"
                            showAllowable={true}
                            allowableStress={resultOutput[0]?.allowableStress}
                        />
                    </div>
                    <div>
                        <h4>Перемещения u(x)</h4>
                        <EpurePlot
                            rods={resultOutput}
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

            {/* 2. Конструкция и эпюры N(x), σ(x), u(x) */}
            {resultOutput.length > 0 && (
                <>
                    <ConstructionWithEpures rods={resultOutput} />

                    {/* 3. Узловые перемещения ∆ */}
                    <section style={{ marginBottom: '2rem', marginTop: '2rem' }}>
                        <h3>Узловые перемещения ∆</h3>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {displacements.map((u, i) => (
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

                    {/* 4. Таблица результатов */}
                    <ResultTable result={result as FullResult} />

                    {showHtmlModal.open && (
                        <ExportHtmlModal
                            rods={resultOutput}
                            displacements={displacements}
                            sectionCalcHistory={showHtmlModal.history}
                            uniformStepData={showHtmlModal.stepData}
                            onClose={handleCloseModal}
                        />
                    )}
                </>
            )}

            {/* 5. Калькуляторы в самом низу */}
            <div style={{ marginTop: '3rem' }}>
                {resultOutput.length > 0 && (
                    <>
                        <UniformStepCalculator
                            ref={uniformStepRef}
                            rods={resultOutput}
                        />
                        <SectionCalculator
                            ref={sectionCalcRef}
                            rods={resultOutput}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default PostprocessorPage;