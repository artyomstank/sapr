// src/components/postprocessor/EpurePlot.tsx
import React from 'react';
import {AxialForceCoeffs, DisplacementCoeffs, StressCoeffs} from "../../types/sapr.types";

interface EpurePlotProps {
    rods: {
        rodId: number;
        length: number;
        axialForceCoeffs: AxialForceCoeffs;
        stressCoeffs: StressCoeffs;
        displacementCoeffs: DisplacementCoeffs;
        allowableStress?: number;
    }[];
    getValue: (rod: {
        rodId: number;
        length: number;
        axialForceCoeffs: AxialForceCoeffs;
        stressCoeffs: StressCoeffs;
        displacementCoeffs: DisplacementCoeffs;
        allowableStress?: number;
    }, x: number) => number;
    ylabel: string;
    color: string;
    showAllowable?: boolean;
    allowableStress?: number;
}

const EpurePlot: React.FC<EpurePlotProps> = ({
                                                 rods,
                                                 getValue,
                                                 ylabel,
                                                 color,
                                                 showAllowable,
                                                 allowableStress,
                                             }) => {
    const totalLength = rods.reduce((sum, r) => sum + r.length, 0);
    if (totalLength === 0) return <div>Нет данных</div>;

    // Генерация точек (51 на стержень)
    const points: { x: number; y: number }[] = [];
    let globalX = 0;
    for (const rod of rods) {
        for (let i = 0; i <= 50; i++) {
            const localX = (rod.length * i) / 50;
            const y = getValue(rod, localX);
            points.push({ x: globalX + localX, y });
        }
        globalX += rod.length;
    }

    // Узловые координаты
    const nodeXs = [0, ...rods.map(r => r.length)].map((_, i) =>
        rods.slice(0, i).reduce((sum, r) => sum + r.length, 0)
    );

    // Масштабирование
    const padding = 45;
    const width = 520;
    const height = 220;
    const xScale = (width - 2 * padding) / totalLength;

    const yValues = points.map(p => p.y);
    const yMin = Math.min(...yValues, 0);
    const yMax = Math.max(...yValues, 0);
    const yRange = yMax - yMin || 1;
    const yScale = (height - 2 * padding) / yRange;

    // Путь графика
    const pathData = points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${padding + p.x * xScale} ${height - padding - (p.y - yMin) * yScale}`)
        .join(' ');

    // Подписи по оси X (узлы)
    const xTicks = nodeXs.map(x => ({
        value: x,
        label: x.toFixed(1),
    }));

    // Подписи по оси Y (3–5 точек)
    const yTicks = [];
    const tickCount = 5;
    for (let i = 0; i < tickCount; i++) {
        const frac = i / (tickCount - 1);
        const yVal = yMin + frac * yRange;
        yTicks.push({
            value: yVal,
            label: yVal.toExponential(2),
        });
    }

    // Создаем путь для заливки до оси y=0
    const fillPathData = (() => {
        if (points.length === 0) return '';

        const zeroY = height - padding - (0 - yMin) * yScale;
        const startPoint = `${padding + points[0].x * xScale},${height - padding - (points[0].y - yMin) * yScale}`;
        const graphPath = points.slice(1).map(p =>
            `L${padding + p.x * xScale},${height - padding - (p.y - yMin) * yScale}`
        ).join(' ');
        const endPoint = `${padding + points[points.length - 1].x * xScale},${zeroY}`;
        const bottomPath = `L${padding},${zeroY} Z`;

        return `M${startPoint} ${graphPath} L${endPoint} ${bottomPath}`;
    })();

    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px', backgroundColor: '#fff' }}>
            <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
                {/* Сетка */}
                {xTicks.map(tick => (
                    <line
                        key={`x-grid-${tick.value}`}
                        x1={padding + tick.value * xScale}
                        y1={padding}
                        x2={padding + tick.value * xScale}
                        y2={height - padding}
                        stroke="#f0f0f0"
                    />
                ))}
                {yTicks.map(tick => (
                    <line
                        key={`y-grid-${tick.value}`}
                        x1={padding}
                        y1={height - padding - (tick.value - yMin) * yScale}
                        x2={width - padding}
                        y2={height - padding - (tick.value - yMin) * yScale}
                        stroke="#f0f0f0"
                    />
                ))}

                {/* Ось y=0 - выраженная линия */}
                <line
                    x1={padding}
                    y1={height - padding - (0 - yMin) * yScale}
                    x2={width - padding}
                    y2={height - padding - (0 - yMin) * yScale}
                    stroke="#666"
                    strokeWidth="1.5"
                />

                {/* Заливка области под графиком до оси y=0 */}
                <path d={fillPathData} fill={`${color}20`} stroke="none" />

                {/* Оси */}
                <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#333" />
                <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#333" />

                {/* Вертикальные линии узлов */}
                {xTicks.map(tick => (
                    <line
                        key={`x-line-${tick.value}`}
                        x1={padding + tick.value * xScale}
                        y1={padding}
                        x2={padding + tick.value * xScale}
                        y2={height - padding}
                        stroke="#999"
                        strokeDasharray="2,2"
                    />
                ))}

                {/* Допускаемые напряжения (±) */}
                {showAllowable && allowableStress !== undefined && (
                    <>
                        {/* +[σ] */}
                        <line
                            x1={padding}
                            y1={height - padding - (allowableStress - yMin) * yScale}
                            x2={width - padding}
                            y2={height - padding - (allowableStress - yMin) * yScale}
                            stroke="#ff6d00"
                            strokeDasharray="4,2"
                        />
                        {/* -[σ] */}
                        <line
                            x1={padding}
                            y1={height - padding - (-allowableStress - yMin) * yScale}
                            x2={width - padding}
                            y2={height - padding - (-allowableStress - yMin) * yScale}
                            stroke="#ff6d00"
                            strokeDasharray="4,2"
                        />
                    </>
                )}

                {/* График */}
                <path d={pathData} fill="none" stroke={color} strokeWidth="2.5" />

                {/* Подписи осей */}
                {xTicks.map(tick => (
                    <text
                        key={`x-label-${tick.value}`}
                        x={padding + tick.value * xScale}
                        y={height - padding + 20}
                        textAnchor="middle"
                        fontSize="10"
                        fill="#333"
                    >
                        {tick.label}
                    </text>
                ))}
                {yTicks.map(tick => (
                    <text
                        key={`y-label-${tick.value}`}
                        x={padding - 10}
                        y={height - padding - (tick.value - yMin) * yScale + 4}
                        textAnchor="end"
                        fontSize="10"
                        fill="#333"
                    >
                        {tick.label}
                    </text>
                ))}

                <text x={width / 2} y={height - 5} textAnchor="middle" fontSize="12" fill="#333">
                    x, м
                </text>
                <text
                    x={-7}
                    y={height / 2}
                    transform={`rotate(-90, -7, ${height / 2})`}
                    textAnchor="middle"
                    fontSize="12"
                    fill="#333"
                >
                    {ylabel}
                </text>
            </svg>
        </div>
    );
};

export default EpurePlot;