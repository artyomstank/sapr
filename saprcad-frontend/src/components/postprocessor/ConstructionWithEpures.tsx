// src/components/postprocessor/ConstructionWithEpures.tsx
import React, { forwardRef } from 'react';
import { RodResult, Node } from '../../types/sapr.types';

interface ConstructionWithEpuresProps {
    rods: RodResult[];
}

const ConstructionWithEpures = forwardRef<SVGSVGElement, ConstructionWithEpuresProps>(
    ({ rods }, ref) => {
        if (rods.length === 0) return null;

        const BASE_LENGTH_SCALE = 80;
        const MIN_ROD_WIDTH = 30;
        const MAX_ROD_WIDTH = 200;
        const MAX_TOTAL_WIDTH = 1000;
        const MIN_TOTAL_WIDTH = 400;

        const MAX_HEIGHT = 25;
        const MIN_HEIGHT = 12;
        const ARROW_LENGTH = 25;
        const NODE_OFFSET_X = ARROW_LENGTH + 15;

        const totalLength = rods.reduce((sum, rod) => sum + rod.length, 0);
        const rodLengths = rods.map(rod => rod.length);
        const minRodLength = Math.min(...rodLengths);
        const maxRodLength = Math.max(...rodLengths);

        let lengthScale = BASE_LENGTH_SCALE;
        if (minRodLength > 0) {
            const minRequiredScale = MIN_ROD_WIDTH / minRodLength;
            const maxAllowedScale = MAX_ROD_WIDTH / maxRodLength;
            lengthScale = Math.min(minRequiredScale, maxAllowedScale, BASE_LENGTH_SCALE * 2);
        }

        let requiredWidth = totalLength * lengthScale + 2 * NODE_OFFSET_X;
        if (requiredWidth < MIN_TOTAL_WIDTH) {
            lengthScale = (MIN_TOTAL_WIDTH - 2 * NODE_OFFSET_X) / totalLength;
        }
        if (requiredWidth > MAX_TOTAL_WIDTH) {
            lengthScale = (MAX_TOTAL_WIDTH - 2 * NODE_OFFSET_X) / totalLength;
        }

        const maxArea = Math.max(...rods.map(r => r.area));
        const minArea = Math.min(...rods.map(r => r.area));
        let areaScale = 1;
        if (maxArea > 0) {
            if (maxArea / minArea > 10 && minArea > 0) {
                areaScale = (MAX_HEIGHT - MIN_HEIGHT) / Math.log(maxArea / minArea + 1);
            } else {
                areaScale = (MAX_HEIGHT - MIN_HEIGHT) / (maxArea || 1);
            }
        }

        const rodPositions: { x: number; width: number; height: number; y: number }[] = [];
        const nodePositions: number[] = [];
        let currentX = NODE_OFFSET_X;

        for (const rod of rods) {
            const width = Math.max(rod.length * lengthScale, MIN_ROD_WIDTH);
            let height;
            if (maxArea / minArea > 10 && minArea > 0) {
                height = MIN_HEIGHT + Math.log(rod.area / minArea + 1) * areaScale;
            } else {
                height = MIN_HEIGHT + rod.area * areaScale;
            }
            height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height));
            const y = 100 - height / 2;
            rodPositions.push({ x: currentX, width, height, y });
            currentX += width;
        }

        currentX = NODE_OFFSET_X;
        nodePositions.push(currentX);
        for (let i = 0; i < rods.length; i++) {
            currentX += Math.max(rods[i].length * lengthScale, MIN_ROD_WIDTH);
            nodePositions.push(currentX);
        }

        const finalWidth = Math.max(MIN_TOTAL_WIDTH, Math.min(MAX_TOTAL_WIDTH, requiredWidth));

        const getN = (rod: RodResult, localX: number): number =>
            rod.axialForceCoeffs.a0 + rod.axialForceCoeffs.a1 * localX;

        const getSigma = (rod: RodResult, localX: number): number =>
            rod.stressCoeffs.a0 + rod.stressCoeffs.a1 * localX;

        const getU = (rod: RodResult, localX: number): number =>
            rod.displacementCoeffs.a0 +
            rod.displacementCoeffs.a1 * localX +
            rod.displacementCoeffs.a2 * localX * localX;

        const EPURE_HEIGHT = 100;
        const EPURE_GAP = 25;

        const nValues = rods.flatMap(r => [getN(r, 0), getN(r, r.length)]);
        const sigmaValues = rods.flatMap(r => [getSigma(r, 0), getSigma(r, r.length)]);
        const uValues = rods.flatMap(r => {
            const vals = [getU(r, 0), getU(r, r.length)];
            const { a1, a2 } = r.displacementCoeffs;
            if (a2 !== 0) {
                const xExt = -a1 / (2 * a2);
                if (xExt > 0 && xExt < r.length) vals.push(getU(r, xExt));
            }
            return vals;
        });

        const nRange = Math.max(...nValues.map(Math.abs)) || 1;
        const sigmaRange = Math.max(...sigmaValues.map(Math.abs)) || 1;
        const uRange = Math.max(...uValues.map(Math.abs)) || 1;

        const nScale = EPURE_HEIGHT / (2 * nRange);
        const sigmaScale = EPURE_HEIGHT / (2 * sigmaRange);
        const uScale = EPURE_HEIGHT / (2 * uRange);

        // Рассчитываем необходимое дополнительное пространство сверху для текста
        const calculateExtraTopSpace = () => {
            let maxTextHeight = 0;

            // Проверяем все точки на всех эпюрах
            rods.forEach(rod => {
                // Эпюра N(x)
                [0, rod.length].forEach(x => {
                    const val = getN(rod, x);
                    if (val >= 0) {
                        // Для положительных значений текст выше точки
                        const pointY = EPURE_HEIGHT / 2 - val * nScale;
                        const textY = pointY - 12; // текст на 12px выше точки
                        const textHeightFromTop = textY; // расстояние от верха эпюры
                        maxTextHeight = Math.max(maxTextHeight, Math.max(0, -textHeightFromTop));
                    }
                });

                // Эпюра σ(x)
                [0, rod.length].forEach(x => {
                    const val = getSigma(rod, x);
                    if (val >= 0) {
                        const pointY = EPURE_HEIGHT / 2 - val * sigmaScale;
                        const textY = pointY - 12;
                        const textHeightFromTop = textY;
                        maxTextHeight = Math.max(maxTextHeight, Math.max(0, -textHeightFromTop));
                    }
                });

                // Эпюра u(x)
                [0, rod.length].forEach(x => {
                    const val = getU(rod, x);
                    if (val >= 0) {
                        const pointY = EPURE_HEIGHT / 2 - val * uScale;
                        const textY = pointY - 12;
                        const textHeightFromTop = textY;
                        maxTextHeight = Math.max(maxTextHeight, Math.max(0, -textHeightFromTop));
                    }
                });

                // Экстремум на эпюре u(x)
                const { a1, a2 } = rod.displacementCoeffs;
                if (a2 !== 0) {
                    const xExt = -a1 / (2 * a2);
                    if (xExt > 0 && xExt < rod.length) {
                        const uExt = getU(rod, xExt);
                        if (uExt >= 0) {
                            const pointY = EPURE_HEIGHT / 2 - uExt * uScale;
                            const textY = pointY - 15; // для экстремума отступ больше
                            const textHeightFromTop = textY;
                            maxTextHeight = Math.max(maxTextHeight, Math.max(0, -textHeightFromTop));
                        }
                    }
                }
            });

            return Math.ceil(maxTextHeight);
        };

        const extraTopSpace = calculateExtraTopSpace();
        const TOP_PADDING = 50 + extraTopSpace; // Добавляем дополнительное пространство сверху

        const getNodeLabelPositions = () => {
            const positions: { y: number; offset: number }[] = [];
            const minLabelDistance = 60;

            for (let i = 0; i < nodePositions.length; i++) {
                const nodeX = nodePositions[i];
                let bestY = 150;
                let offset = 0;

                if (i > 0) {
                    const prevNodeX = nodePositions[i - 1];
                    if (nodeX - prevNodeX < minLabelDistance) {
                        bestY = i % 2 === 0 ? 130 : 150;
                    }
                }

                if (i < nodePositions.length - 1) {
                    const nextNodeX = nodePositions[i + 1];
                    if (nextNodeX - nodeX < minLabelDistance) {
                        bestY = i % 2 === 0 ? 130 : 150;
                    }
                }

                const node = i === 0 ? rods[0]?.nodeRelatedTo[0] : rods[i-1]?.nodeRelatedTo[1];
                if (node?.externalForce !== 0) {
                    offset = node.externalForce > 0 ? 10 : -10;
                }

                positions.push({ y: bestY, offset });
            }
            return positions;
        };

        const nodeLabelPositions = getNodeLabelPositions();

        // Общая высота SVG с дополнительным пространством сверху
        const totalHeight = TOP_PADDING + 100 + 3 * (EPURE_HEIGHT + EPURE_GAP) + 100;

        return (
            <section style={{ marginBottom: '2rem' }}>
                <h3>Конструкция и эпюры N(x), σ(x), u(x)</h3>
                <div style={{ overflowX: 'auto', padding: '10px 0' }}>
                    <svg
                        id="construction-svg"
                        ref={ref}
                        width="100%"
                        height={totalHeight}
                        style={{
                            minWidth: `${finalWidth}px`,
                            backgroundColor: '#fafafa',
                            maxWidth: `${MAX_TOTAL_WIDTH}px`,
                            border: '1px solid #eee',
                            borderRadius: '4px',
                        }}
                        viewBox={`0 0 ${finalWidth} ${totalHeight}`}
                    >
                        <defs>
                            <marker
                                id="concentratedArrow"
                                markerWidth="8"
                                markerHeight="8"
                                refX="7"
                                refY="4"
                                orient="auto"
                            >
                                <line x1="0" y1="4" x2="5" y2="4" stroke="currentColor" strokeWidth="2" />
                                <path d="M5,2 L5,6 L7,4 Z" fill="currentColor" />
                            </marker>
                            <marker
                                id="distributedArrow"
                                markerWidth="4"
                                markerHeight="4"
                                refX="3"
                                refY="2"
                                orient="auto"
                            >
                                <path d="M0,0 L0,4 L3,2 z" fill="currentColor" />
                            </marker>
                        </defs>

                        {/* Конструкция (как в препроцессоре) */}
                        <g transform={`translate(0, ${TOP_PADDING})`}>
                            {rods.map((rod, i) => {
                                const pos = rodPositions[i];
                                const isVeryShort = rod.length * lengthScale < MIN_ROD_WIDTH;
                                return (
                                    <g key={rod.rodId}>
                                        <rect
                                            x={pos.x}
                                            y={-pos.height / 2}
                                            width={pos.width}
                                            height={pos.height}
                                            fill="#4a90e2"
                                            stroke="#2c3e50"
                                        />
                                        {pos.width > 50 ? (
                                            <>
                                                <circle cx={pos.x + pos.width / 2} cy={-25} r="12" fill="#fff" stroke="#333" />
                                                <text x={pos.x + pos.width / 2} y={-21} textAnchor="middle" fontSize="11" fontWeight="bold">
                                                    {rod.rodId}
                                                </text>
                                                <text x={pos.x + pos.width / 2} y={-38} textAnchor="middle" fontSize="9" fill="#666">
                                                    L={rod.length.toFixed(2)}м
                                                </text>
                                            </>
                                        ) : (
                                            <>
                                                <circle cx={pos.x + pos.width / 2} cy={-25} r="8" fill="#fff" stroke="#333" />
                                                <text x={pos.x + pos.width / 2} y={-22} textAnchor="middle" fontSize="8" fontWeight="bold">
                                                    {rod.rodId}
                                                </text>
                                            </>
                                        )}
                                        {rod.distributedLoad !== 0 && (
                                            <>
                                                {isVeryShort ? (
                                                    <line
                                                        x1={pos.x + pos.width / 2}
                                                        y1={0}
                                                        x2={pos.x + pos.width / 2 + (rod.distributedLoad > 0 ? 10 : -10)}
                                                        y2={0}
                                                        stroke={rod.distributedLoad > 0 ? 'green' : 'red'}
                                                        strokeWidth="2"
                                                        markerEnd="url(#distributedArrow)"
                                                    />
                                                ) : (
                                                    Array.from({ length: Math.max(2, Math.floor(pos.width / 15)) }).map((_, idx) => {
                                                        const spacing = pos.width / (Math.max(2, Math.floor(pos.width / 15)) + 1);
                                                        const arrowX = pos.x + spacing * (idx + 1);
                                                        return (
                                                            <line
                                                                key={idx}
                                                                x1={arrowX}
                                                                y1={0}
                                                                x2={arrowX + (rod.distributedLoad > 0 ? 8 : -8)}
                                                                y2={0}
                                                                stroke={rod.distributedLoad > 0 ? 'green' : 'red'}
                                                                strokeWidth="1.5"
                                                                markerEnd="url(#distributedArrow)"
                                                            />
                                                        );
                                                    })
                                                )}
                                            </>
                                        )}
                                    </g>
                                );
                            })}

                            {nodePositions.map((nodeX, i) => {
                                const isFirstNode = i === 0;
                                const labelPos = nodeLabelPositions[i];
                                let node: Node | undefined;
                                if (i === 0) {
                                    node = rods[0]?.nodeRelatedTo[0];
                                } else {
                                    node = rods[i-1]?.nodeRelatedTo[1];
                                }
                                if (!node) return null;
                                return (
                                    <g key={`node-${i}`}>
                                        {node.fixed && (
                                            <>
                                                <line x1={nodeX} y1={-10} x2={nodeX} y2={20} stroke="#000" strokeWidth="3" />
                                                {[...Array(6)].map((_, idx) => (
                                                    <line
                                                        key={idx}
                                                        x1={isFirstNode ? nodeX - 8 : nodeX}
                                                        y1={-10 + idx * 5}
                                                        x2={isFirstNode ? nodeX : nodeX + 8}
                                                        y2={-10 + idx * 5 + 4}
                                                        stroke="#000"
                                                        strokeWidth="1.5"
                                                    />
                                                ))}
                                            </>
                                        )}
                                        {node.externalForce !== 0 && (
                                            <line
                                                x1={nodeX}
                                                y1={0}
                                                x2={nodeX + (node.externalForce > 0 ? ARROW_LENGTH : -ARROW_LENGTH)}
                                                y2={0}
                                                stroke={node.externalForce > 0 ? 'blue' : 'orange'}
                                                strokeWidth="2"
                                                markerEnd="url(#concentratedArrow)"
                                            />
                                        )}
                                        <text
                                            x={nodeX + labelPos.offset}
                                            y={labelPos.y - 50}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fontWeight="bold"
                                        >
                                            У{node.id}{node.fixed}
                                        </text>
                                        <circle cx={nodeX} cy={0} r="3" fill="#fff" stroke="#333" />
                                    </g>
                                );
                            })}

                            {/* Сквозные пунктирные линии */}
                            <g stroke="#999" strokeDasharray="3,3" strokeWidth="1">
                                {nodePositions.map(nx => (
                                    <line key={`guide-${nx}`} x1={nx} y1={-10} x2={nx} y2={3 * (EPURE_HEIGHT + EPURE_GAP) + 175} />
                                ))}
                            </g>
                        </g>

                        {/* === Эпюры (N, σ, u) === */}
                        {[
                            { title: 'N(x), Н', color: '#e53935', scale: nScale, getValue: getN },
                            { title: 'σ(x), Па', color: '#1e88e5', scale: sigmaScale, getValue: getSigma },
                            { title: 'u(x), м', color: '#43a047', scale: uScale, getValue: getU },
                        ].map(({ title, color, scale, getValue }, idx) => {
                            const yOffset = TOP_PADDING + 50 + (idx + 1) * (EPURE_HEIGHT + EPURE_GAP);
                            return (
                                <g key={title} transform={`translate(0, ${yOffset})`}>
                                    <text x={-20} y={EPURE_HEIGHT / 2} textAnchor="middle" fontSize="12" fill={color} fontWeight="bold"
                                          transform={`rotate(-90, -20, ${EPURE_HEIGHT / 2})`}>
                                        {title}
                                    </text>
                                    <line x1="0" y1={EPURE_HEIGHT / 2} x2={finalWidth} y2={EPURE_HEIGHT / 2} stroke="#666" strokeWidth="1.5" />
                                    {rods.map((rod, i) => {
                                        const pos = rodPositions[i];
                                        const points = [];
                                        for (let k = 0; k <= 30; k++) {
                                            const localX = (rod.length * k) / 30;
                                            const globalX = pos.x + (localX / rod.length) * pos.width;
                                            const y = EPURE_HEIGHT / 2 - getValue(rod, localX) * scale;
                                            points.push([globalX, y]);
                                        }
                                        const path = points.map(([x, y]) => `${x},${y}`).join(' ');
                                        const bottom = points.slice().reverse().map(([x]) => `${x},${EPURE_HEIGHT / 2}`).join(' ');
                                        return (
                                            <g key={`${title}-${rod.rodId}`}>
                                                <path d={`M${path} L${bottom} Z`} fill={`${color}20`} stroke="none" />
                                                <polyline points={path} fill="none" stroke={color} strokeWidth="2" />
                                                {[0, rod.length].map((x, j) => {
                                                    const val = getValue(rod, x);
                                                    const gx = j === 0 ? pos.x : pos.x + pos.width;
                                                    const gy = EPURE_HEIGHT / 2 - val * scale;
                                                    // Определяем положение текста относительно точки
                                                    const textOffset = val >= 0 ? -12 : 12; // для положительных - сверху, для отрицательных - снизу
                                                    return (
                                                        <g key={`pt-${j}`}>
                                                            <circle cx={gx} cy={gy} r="3.5" fill={color} />
                                                            <text
                                                                x={gx}
                                                                y={gy + textOffset}
                                                                textAnchor="middle"
                                                                fontSize="9"
                                                                fill={color}
                                                            >
                                                                {val.toExponential(2)}
                                                            </text>
                                                        </g>
                                                    );
                                                })}
                                                {title === 'u(x), м' && (() => {
                                                    const { a1, a2 } = rod.displacementCoeffs;
                                                    if (a2 !== 0) {
                                                        const xExt = -a1 / (2 * a2);
                                                        if (xExt > 0 && xExt < rod.length) {
                                                            const uExt = getValue(rod, xExt);
                                                            const gx = pos.x + (xExt / rod.length) * pos.width;
                                                            const gy = EPURE_HEIGHT / 2 - uExt * scale;
                                                            // Для экстремума также учитываем знак
                                                            const textOffset = uExt >= 0 ? -15 : 15;
                                                            return (
                                                                <g key="extremum">
                                                                    <circle cx={gx} cy={gy} r="4" fill="gold" stroke="#e65100" strokeWidth="1.5" />
                                                                    <text
                                                                        x={gx}
                                                                        y={gy + textOffset}
                                                                        textAnchor="middle"
                                                                        fontSize="9"
                                                                        fill="#e65100"
                                                                        fontWeight="bold"
                                                                    >
                                                                        {uExt.toExponential(2)}
                                                                    </text>
                                                                </g>
                                                            );
                                                        }
                                                    }
                                                    return null;
                                                })()}
                                            </g>
                                        );
                                    })}
                                </g>
                            );
                        })}

                        <text x={finalWidth / 2} y={TOP_PADDING + 100 + 3 * (EPURE_HEIGHT + EPURE_GAP) + 30}
                              textAnchor="middle" fontSize="12" fill="#333">x, м</text>
                    </svg>
                </div>
            </section>
        );
    }
);

export default ConstructionWithEpures;