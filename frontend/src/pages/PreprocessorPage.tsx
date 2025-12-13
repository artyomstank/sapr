// src/pages/PreprocessorPage.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProjectState } from '../hooks/UseProjectState';
import BeamVisualizer from '../components/preprocessor/BeamVisualizer';
import RodEditor from '../components/preprocessor/RodEditor';
import NodeEditor from '../components/preprocessor/NodeEditor';
import FileControls from '../components/preprocessor/FileControls';

const PreprocessorPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {
        project,
        setProject,
        loading,
        errors,
        validateAndCalculate,
        saveToFile,
        loadFromFile,
        clearProject,
    } = useProjectState();

    const [componentKey, setComponentKey] = useState(0);

    useEffect(() => {
        const state = location.state as { project?: any; timestamp?: number } | null;

        // Обрабатываем только если есть project
        if (state?.project) {
            console.log('Загрузка проекта из location.state');
            setProject(state.project);
            setComponentKey(prev => prev + 1);
            // Опционально: очищаем state из URL через replace
            // Но делаем это АСИНХРОННО, чтобы не мешать рендеру
            setTimeout(() => {
                if (window.history.state && window.history.state.usr?.state) {
                    navigate('.', { replace: true });
                }
            }, 0);
        }
    }, [location.state, setProject]);

    const handleCalculate = async () => {
        const result = await validateAndCalculate();
        if (result.success && result.displacements) {
            navigate('/calculation-success', {
                state: { project, displacements: result.displacements },
                replace: true
            });
        } else if (!result.success && result.errorMessage) {
            navigate('/calculation-error', {
                state: { error: result.errorMessage, project },
                replace: true
            });
        }
    };

    // Функции для добавления узлов и стержней
    const handleAddNode = () => {
        const newId = project.nodes.length > 0 ? Math.max(...project.nodes.map(n => n.id)) + 1 : 0;
        setProject({
            ...project,
            nodes: [
                ...project.nodes,
                {
                    id: newId,
                    fixed: false,
                    externalForce: 0.0,
                },
            ],
        });
    };

    const handleAddRod = () => {
        const newId = project.rods.length > 0 ? Math.max(...project.rods.map(r => r.id)) + 1 : 0;
        
        setProject({
            ...project,
            rods: [
                ...project.rods,
                {
                    id: newId,
                    length: 1.0,
                    area: 0.01,
                    elasticModulus: 2.1e11,
                    allowableStress: 250e6,
                    distributedLoad: 0.0,
                },
            ],
        });
    };

    return (
        <div key={componentKey} style={{ padding: '1.5rem', fontFamily: 'Arial, sans-serif', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Препроцессор: ввод данных и визуализация</h2>
            </div>

            {errors.length > 0 && (
                <div style={{ color: 'red', marginBottom: '1.2rem', padding: '0.8rem', backgroundColor: '#ffebee', borderRadius: '4px' }}>
                    <strong>Ошибки валидации:</strong>
                    <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                        {errors.map((e, i) => (
                            <li key={i}>{e}</li>
                        ))}
                    </ul>
                </div>
            )}

            <FileControls
                onUploadJson={(file) => loadFromFile(file)}
                onSaveJson={saveToFile}
                onCalculate={handleCalculate}
                onClearProject={clearProject}
                onAddNode={handleAddNode}
                onAddRod={handleAddRod}
                disabled={loading}
                showNodeRodControls={true}
            />

            <h3 style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>Визуализация конструкции</h3>
            <BeamVisualizer project={project} />

            <div style={{ marginTop: '2rem' }}>
                <div style={{ marginBottom: '2rem' }}>
                    <h3>Узлы</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <NodeEditor
                            nodes={project.nodes}
                            onChange={(nodes) => setProject({ ...project, nodes })} rods={project.rods}
                        />
                    </div>
                </div>
                <div>
                    <h3>Стержни</h3>
                    <div style={{ overflowX: 'auto' }}>
                        <RodEditor
                            rods={project.rods}
                            onChange={(rods) => setProject({ ...project, rods })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PreprocessorPage;