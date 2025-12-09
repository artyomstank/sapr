// src/components/postprocessor/UniformStepCalculator.tsx
import React, { useState, useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import { RodResult } from '../../types/sapr.types';

export interface UniformStepRow {
    rodId: number;
    x: number;
    N: number;
    sigma: number;
    u: number;
    isBoundary: boolean;
}

export interface UniformStepHandle {
    getStepData: () => UniformStepRow[];
}

interface Props {
    rods: RodResult[];
}

const UniformStepCalculator = forwardRef<UniformStepHandle, Props>(({ rods }, ref) => {
    const [step, setStep] = useState<number>(0.5);
    const [tableData, setTableData] = useState<UniformStepRow[]>([]);

    const data = useMemo(() => {
        if (step <= 0) return [];
        const rows: UniformStepRow[] = [];
        rods.forEach(rod => {
            const L = rod.length;
            const points = new Set<number>();
            points.add(0);
            points.add(L);
            if (step < L) {
                let x = step;
                while (x < L) {
                    points.add(x);
                    x += step;
                }
            }
            Array.from(points).sort((a, b) => a - b).forEach(x => {
                const N = rod.axialForceCoeffs.a0 + rod.axialForceCoeffs.a1 * x;
                const sigma = rod.stressCoeffs.a0 + rod.stressCoeffs.a1 * x;
                const u = rod.displacementCoeffs.a0 +
                    rod.displacementCoeffs.a1 * x +
                    rod.displacementCoeffs.a2 * x * x;
                rows.push({
                    rodId: rod.rodId,
                    x,
                    N,
                    sigma,
                    u,
                    isBoundary: x === 0 || x === L,
                });
            });
        });
        return rows;
    }, [rods, step]);

    useEffect(() => {
        setTableData(data);
    }, [data]);

    useImperativeHandle(ref, () => ({
        getStepData: () => tableData,
    }), [tableData]);

    return (
        <section style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: '#f9f9f9', borderRadius: '6px' }}>
            <h3>Расчёт по равномерному шагу</h3>
            <p>Таблица значений N(x), σ(x), u(x) с шагом вдоль конструкции.</p>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                <label>
                    Шаг, м:
                    <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={step}
                        onChange={e => setStep(parseFloat(e.target.value) || 0.01)}
                        style={{ width: '80px', marginLeft: '6px' }}
                    />
                </label>
                <button
                    onClick={() => {
                        const content = `Стержень,x,N(x),σ(x),u(x)\n` +
                            tableData.map(r =>
                                `${r.rodId},${r.x.toFixed(4)},${r.N.toExponential(4)},${r.sigma.toExponential(4)},${r.u.toExponential(6)}`
                            ).join('\n');
                        const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `step_table_${step}m.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                    }}
                    style={{ padding: '4px 10px', fontSize: '0.9em' }}
                >
                    Экспорт в CSV
                </button>
            </div>

            {tableData.length > 0 && (
                <div style={{ maxHeight: '250px', overflow: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9em' }}>
                        <thead>
                        <tr style={{ backgroundColor: '#4a90e2', color: 'white' }}>
                            <th>Стержень</th>
                            <th>x, м</th>
                            <th>N(x), Н</th>
                            <th>σ(x), Па</th>
                            <th>u(x), м</th>
                        </tr>
                        </thead>
                        <tbody>
                        {tableData.map((row, i) => (
                            <tr key={i} style={{ backgroundColor: row.isBoundary ? '#e8f5e9' : 'transparent' }}>
                                <td style={{ padding: '4px', textAlign: 'center' }}>{row.rodId}</td>
                                <td style={{ padding: '4px', textAlign: 'center' }}>{row.x.toFixed(3)}</td>
                                <td style={{ padding: '4px', textAlign: 'center', fontFamily: 'monospace' }}>{row.N.toExponential(3)}</td>
                                <td style={{ padding: '4px', textAlign: 'center', fontFamily: 'monospace' }}>{row.sigma.toExponential(3)}</td>
                                <td style={{ padding: '4px', textAlign: 'center', fontFamily: 'monospace' }}>{row.u.toExponential(3)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <p style={{ fontSize: '0.85em', color: '#666', marginTop: '6px' }}>
                        Подсвечены граничные сечения (начало и конец стержня)
                    </p>
                </div>
            )}
        </section>
    );
});

export default UniformStepCalculator;