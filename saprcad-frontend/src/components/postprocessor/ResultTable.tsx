// src/components/postprocessor/ResultTable.tsx
import React from 'react';
import { FullResult } from '../../types/sapr.types';

interface ResultTableProps {
    result: FullResult;
}

const ResultTable: React.FC<ResultTableProps> = ({ result }) => {
    return (
        <section style={{ marginBottom: '2rem' }}>
            <h3>Сводная таблица по стержням</h3>
            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '0.95em',
                    minWidth: '800px'
                }}>
                    <thead>
                    <tr style={{ backgroundColor: '#4a90e2', color: 'white' }}>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Стержень</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>L, м</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>A, м²</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>[σ], Па</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>max|σ|, Па</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Прочность</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>N₀, Н</th>
                        <th style={{ padding: '10px', textAlign: 'center' }}>Nₗ, Н</th>
                    </tr>
                    </thead>
                    <tbody>
                    {result.resultOutput.map(rod => {
                        const N0 = rod.axialForceCoeffs.a0;
                        const Nl = N0 + rod.axialForceCoeffs.a1 * rod.length;
                        const isSafe = Math.abs(rod.maxStressOnTheRod) <= rod.allowableStress;
                        return (
                            <tr key={rod.rodId} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{rod.rodId}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{rod.length.toFixed(4)}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{rod.area.toFixed(4)}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>{rod.allowableStress.toFixed(4)}</td>
                                <td style={{ padding: '8px', textAlign: 'center', color: isSafe ? 'green' : 'red' }}>
                                    {rod.maxStressOnTheRod.toFixed(4)}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                    <span
                        style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            backgroundColor: isSafe ? '#c8e6c9' : '#ffcdd2',
                            color: isSafe ? '#2e7d32' : '#c62828',
                            fontWeight: 'bold',
                        }}
                    >
                      {isSafe ? '✓' : '✗'}
                    </span>
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>
                                    {N0.toFixed(4)}
                                </td>
                                <td style={{ padding: '8px', textAlign: 'center', fontFamily: 'monospace' }}>
                                    {Nl.toFixed(4)}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
            <p style={{ fontSize: '0.9em', color: '#666', marginTop: '0.5rem' }}>
                N₀ — продольная сила в начале стержня, Nₗ — в конце.
            </p>
        </section>
    );
};

export default ResultTable;