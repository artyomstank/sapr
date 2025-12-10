import React from 'react';
import { StructureInput } from '../../types/sapr.types';

interface BeamVisualizerProps {
    project: StructureInput;
}

const BeamVisualizer: React.FC<BeamVisualizerProps> = ({ project }) => {

    if (project.nodes.length !== project.rods.length + 1) {
        return (
            <div style={{ padding: '1rem', color: 'orange' }}>
                Несоответствие: узлов должно быть на 1 больше, чем стержней.
                Сейчас: стержней — {project.rods.length}, узлов — {project.nodes.length}.
            </div>
        );
    }

    if (project.rods.length === 0 || project.nodes.length === 0) {
        return <div className="beam-placeholder">Добавьте стержни и узлы</div>;
    }

    // Константы для визуализации (еще больше увеличиваем)
    const BASE_LENGTH_SCALE = 120;
    const MIN_ROD_WIDTH = 50;
    const MAX_ROD_WIDTH = 300;
    const MAX_TOTAL_WIDTH = 1600;
    const MIN_TOTAL_WIDTH = 600;

    const MAX_HEIGHT = 60;
    const MIN_HEIGHT = 30;
    const ARROW_LENGTH = 50;
    const NODE_OFFSET_X = ARROW_LENGTH + 30;
    const SVG_HEIGHT = 500; // Очень большая высота
    const ROD_CENTER_Y = SVG_HEIGHT / 3.5; // Поднимаем стержни выше

    // Рассчитываем общую длину конструкции
    const totalLength = project.rods.reduce((sum, rod) => sum + rod.length, 0);

    // Находим минимальную и максимальную длину стержней
    const rodLengths = project.rods.map(rod => rod.length);
    const minRodLength = Math.min(...rodLengths);
    const maxRodLength = Math.max(...rodLengths);

    // Адаптивное масштабирование длины
    let lengthScale = BASE_LENGTH_SCALE;

    if (minRodLength > 0) {
        const minRequiredScale = MIN_ROD_WIDTH / minRodLength;
        const maxAllowedScale = MAX_ROD_WIDTH / maxRodLength;
        lengthScale = Math.min(minRequiredScale, maxAllowedScale, BASE_LENGTH_SCALE * 2);
    }

    // Проверяем общую ширину
    const requiredWidth = totalLength * lengthScale + 2 * NODE_OFFSET_X;

    if (requiredWidth < MIN_TOTAL_WIDTH) {
        lengthScale = (MIN_TOTAL_WIDTH - 2 * NODE_OFFSET_X) / totalLength;
    }

    if (requiredWidth > MAX_TOTAL_WIDTH) {
        lengthScale = (MAX_TOTAL_WIDTH - 2 * NODE_OFFSET_X) / totalLength;
    }

    // Позиции стержней и узлов
    const rodPositions: { 
        x: number; 
        width: number; 
        height: number; 
        y: number;
        bottomY: number;
        topY: number;
        rodIndex: number;
    }[] = [];
    
    const nodePositions: number[] = [];

    let currentX = NODE_OFFSET_X;

    // Масштабирование высоты для площади сечения
    const maxArea = Math.max(...project.rods.map(r => r.area));
    const minArea = Math.min(...project.rods.map(r => r.area));
    let areaScale = 1;

    if (maxArea > 0) {
        if (maxArea / minArea > 10) {
            areaScale = (MAX_HEIGHT - MIN_HEIGHT) / Math.log(maxArea / minArea + 1);
        } else {
            areaScale = (MAX_HEIGHT - MIN_HEIGHT) / (maxArea || 1);
        }
    }

    // Рассчитываем позиции стержней
    project.rods.forEach((rod, index) => {
        const width = Math.max(rod.length * lengthScale, MIN_ROD_WIDTH);
        let height;

        if (maxArea / minArea > 10 && minArea > 0) {
            height = MIN_HEIGHT + Math.log(rod.area / minArea + 1) * areaScale;
        } else {
            height = MIN_HEIGHT + rod.area * areaScale;
        }

        height = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, height));

        const y = ROD_CENTER_Y - height / 2;
        const topY = y;
        const bottomY = y + height;
        
        rodPositions.push({ 
            x: currentX, 
            width, 
            height, 
            y,
            topY,
            bottomY,
            rodIndex: index
        });
        currentX += width;
    });

    // Рассчитываем позиции узлов
    currentX = NODE_OFFSET_X;
    nodePositions.push(currentX);

    project.rods.forEach((rod, i) => {
        currentX += Math.max(rod.length * lengthScale, MIN_ROD_WIDTH);
        nodePositions.push(currentX);
    });

    const finalWidth = Math.max(MIN_TOTAL_WIDTH, Math.min(MAX_TOTAL_WIDTH, requiredWidth));
    const showScaleInfo = lengthScale !== BASE_LENGTH_SCALE || minRodLength * BASE_LENGTH_SCALE < MIN_ROD_WIDTH;

    // Функция для получения высоты стержня в позиции узла
    const getRodDataAtNode = (nodeIndex: number) => {
        if (nodeIndex === 0) {
            // Первый узел - начало первого стержня
            return { rod: rodPositions[0], side: 'left' as const };
        } else if (nodeIndex === project.nodes.length - 1) {
            // Последний узел - конец последнего стержня
            return { rod: rodPositions[project.rods.length - 1], side: 'right' as const };
        } else {
            // Внутренний узел - граница между двумя стержнями
            const leftRod = rodPositions[nodeIndex - 1];
            const rightRod = rodPositions[nodeIndex];
            // Возвращаем более высокий стержень для лучшей видимости
            return leftRod.height >= rightRod.height 
                ? { rod: leftRod, side: 'right' as const }
                : { rod: rightRod, side: 'left' as const };
        }
    };

    // Улучшенная функция для расположения подписей узлов
    const getNodeLabelPositions = () => {
        const positions: { y: number; offset: number }[] = [];
        const minLabelDistance = 80;

        for (let i = 0; i < nodePositions.length; i++) {
            const nodeX = nodePositions[i];
            let bestY = ROD_CENTER_Y + MAX_HEIGHT + 50;
            let offset = 0;

            // Проверяем расстояние до соседних узлов
            if (i > 0 && nodeX - nodePositions[i - 1] < minLabelDistance) {
                bestY = i % 2 === 0 ? ROD_CENTER_Y + MAX_HEIGHT + 30 : ROD_CENTER_Y + MAX_HEIGHT + 70;
            }
            if (i < nodePositions.length - 1 && nodePositions[i + 1] - nodeX < minLabelDistance) {
                bestY = i % 2 === 0 ? ROD_CENTER_Y + MAX_HEIGHT + 30 : ROD_CENTER_Y + MAX_HEIGHT + 70;
            }

            if (project.nodes[i].externalForce !== 0) {
                offset = project.nodes[i].externalForce > 0 ? 15 : -15;
            }

            positions.push({ y: bestY, offset });
        }

        return positions;
    };

    const nodeLabelPositions = getNodeLabelPositions();

    // Функция для отрисовки заделки
    const renderFixedSupport = (nodeX: number, rodData: ReturnType<typeof getRodDataAtNode>, isFirstNode: boolean, isLastNode: boolean) => {
        const { rod, side } = rodData;
        const topY = rod.topY;
        const bottomY = rod.bottomY;
        const rodHeight = rod.height;
        const hatchCount = 7;
        const dx = 6;
        const dy = 6;
        
        // Определяем начальную позицию в зависимости от стороны
        const startX = side === 'right' ? nodeX : nodeX - dx;
        
        return (
            <>
                {/* Вертикальная линия заделки - вдоль всей высоты стержня */}
                <line
                    x1={nodeX}
                    y1={topY}
                    x2={nodeX}
                    y2={bottomY}
                    stroke="#2c3e50"
                    strokeWidth="3"
                />
                
                {/* Штрихи под углом 45 градусов */}
                {[...Array(hatchCount)].map((_, idx) => {
                    const yOffset = topY + (idx * rodHeight / (hatchCount - 1));
                    const dy = side === 'right' ? -15 : 15; // вверх если справа, вниз если слева
                    
                    return (
                        <line
                            key={idx}
                            x1={nodeX}
                            y1={yOffset}
                            x2={nodeX + (side === 'right' ? 15 : -15)}
                            y2={yOffset + dy}
                            stroke="#2c3e50"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                    );
                })}
            </>
        );
    };

    return (
        <div style={{ 
            overflow: 'auto', 
            padding: '20px 0',
            backgroundColor: '#fafafa', 
            border: '1px solid #ddd',
            borderRadius: '4px'
        }}>
            <svg
                width="100%"
                height={SVG_HEIGHT}
                style={{
                    minWidth: `${MIN_TOTAL_WIDTH}px`,
                    backgroundColor: '#fafafa'
                }}
                viewBox={`0 0 ${finalWidth} ${SVG_HEIGHT}`}
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <marker
                        id="concentratedArrow"
                        markerWidth="16"
                        markerHeight="16"
                        refX="1"
                        refY="8"
                        orient="auto"
                    >
                        <line x1="0" y1="8" x2="4" y2="8" stroke="currentColor" strokeWidth="3" />
                        <path d="M4,5 L4,11 L16,8 Z" fill="currentColor" />
                    </marker>

                    <marker
                        id="distributedArrow"
                        markerWidth="8"
                        markerHeight="8"
                        refX="6"
                        refY="4"
                        orient="auto"
                    >
                        <line x1="0" y1="4" x2="3" y2="4" stroke="#ff5e00ff" strokeWidth="2" />
                        <path d="M3,1 L3,7 L8,4 z" fill="#ff5e00ff" />
                    </marker>
                    
                    <linearGradient id="rodGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#4a90e2" />
                        <stop offset="100%" stopColor="#357abd" />
                    </linearGradient>
                </defs>

                {/* Стержни */}
                {project.rods.map((rod, i) => {
                    const pos = rodPositions[i];
                    const rodCenterY = pos.y + pos.height / 2;

                    return (
                        <g key={rod.id}>
                            <rect
                                x={pos.x}
                                y={pos.y}
                                width={pos.width}
                                height={pos.height}
                                fill="url(#rodGradient)"
                                stroke="#2c3e50"
                                strokeWidth="2"
                                rx="3"
                                ry="3"
                            />

                            {/* Подписи стержней */}
                            {pos.width > 70 ? (
                                <>
                                    <circle
                                        cx={pos.x + pos.width / 2}
                                        cy={rodCenterY - pos.height / 2 - 25}
                                        r="16"
                                        fill="#fff"
                                        stroke="#333"
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={pos.x + pos.width / 2}
                                        y={rodCenterY - pos.height / 2 - 20}
                                        textAnchor="middle"
                                        fontSize="15"
                                        fontWeight="bold"
                                        fill="#000"
                                    >
                                        {rod.id}
                                    </text>
                                    <text
                                        x={pos.x + pos.width / 2}
                                        y={rodCenterY - pos.height / 2 - 50}
                                        textAnchor="middle"
                                        fontSize="13"
                                        fill="#666"
                                        fontWeight="bold"
                                    >
                                        L={rod.length.toFixed(2)}м
                                    </text>
                                </>
                            ) : (
                                <>
                                    <circle
                                        cx={pos.x + pos.width / 2}
                                        cy={rodCenterY - pos.height / 2 - 20}
                                        r="12"
                                        fill="#fff"
                                        stroke="#333"
                                        strokeWidth="2"
                                    />
                                    <text
                                        x={pos.x + pos.width / 2}
                                        y={rodCenterY - pos.height / 2 - 15}
                                        textAnchor="middle"
                                        fontSize="12"
                                        fontWeight="bold"
                                        fill="#000"
                                    >
                                        {rod.id}
                                    </text>
                                </>
                            )}

                            {/* Распределённая нагрузка */}
                            {rod.distributedLoad !== 0 && (
                                <>
                                    {pos.width <= 60 ? (
                                        <line
                                            x1={pos.x + pos.width / 2}
                                            y1={rodCenterY}
                                            x2={pos.x + pos.width / 2 + (rod.distributedLoad > 0 ? 18 : -18)}
                                            y2={rodCenterY}
                                            stroke="#999"
                                            strokeWidth="3"
                                            markerEnd="url(#distributedArrow)"
                                        />
                                    ) : (
                                        <>
                                            {Array.from({ length: Math.max(2, Math.floor(pos.width / 30)) }).map((_, idx) => {
                                                const spacing = pos.width / (Math.max(2, Math.floor(pos.width / 30)) + 1);
                                                const arrowX = pos.x + spacing * (idx + 1);
                                                const direction = rod.distributedLoad > 0 ? 1 : -1;
                                                const arrowLength = 15;

                                                return (
                                                    <line
                                                        key={idx}
                                                        x1={arrowX}
                                                        y1={rodCenterY}
                                                        x2={arrowX + arrowLength * direction}
                                                        y2={rodCenterY}
                                                        stroke="#999"
                                                        strokeWidth="2.5"
                                                        markerEnd="url(#distributedArrow)"
                                                    />
                                                );
                                            })}
                                        </>
                                    )}
                                </>
                            )}
                        </g>
                    );
                })}

                {/* Узлы */}
                {project.nodes.map((node, i) => {
                    const nodeX = nodePositions[i];
                    const isFirstNode = i === 0;
                    const isLastNode = i === project.nodes.length - 1;
                    const labelPos = nodeLabelPositions[i];
                    
                    // Получаем данные о стержне в позиции узла
                    const rodData = getRodDataAtNode(i);
                    const rodCenterY = rodData.rod.y + rodData.rod.height / 2;
                    const rodBottomY = rodData.rod.bottomY;

                    return (
                        <g key={node.id}>
                            {/* Опора (заделка) - исправленная версия */}
                            {node.fixed && renderFixedSupport(nodeX, rodData, isFirstNode, isLastNode)}

                            {/* Сосредоточенная сила */}
                            {node.externalForce !== 0 && (
                                <line
                                    x1={nodeX}
                                    y1={rodCenterY}
                                    x2={nodeX + (node.externalForce > 0 ? ARROW_LENGTH - 30 : -(ARROW_LENGTH - 30))}
                                    y2={rodCenterY}
                                    stroke="#000"
                                    strokeWidth="3.5"
                                    markerEnd="url(#concentratedArrow)"
                                />
                            )}

                            {/* Подпись узла */}
                            <text
                                x={nodeX + labelPos.offset}
                                y={labelPos.y}
                                textAnchor="middle"
                                fontSize="14"
                                fill="#2c3e50"
                                fontWeight="bold"
                            >
                                У{node.id}
                            </text>

                            {/* Маркер узла */}
                            <circle
                                cx={nodeX}
                                cy={rodCenterY}
                                r="6"
                                fill="#fff"
                                stroke="#2c3e50"
                                strokeWidth="2.5"
                            />
                        </g>
                    );
                })}

                {/* Информация о масштабе */}
                {showScaleInfo && (
                    <text
                        x={NODE_OFFSET_X}
                        y={SVG_HEIGHT - 20}
                        fontSize="13"
                        fill="#666"
                        fontWeight="bold"
                    >
                        Масштаб: 1м = {(lengthScale).toFixed(1)}px
                        {minRodLength * BASE_LENGTH_SCALE < MIN_ROD_WIDTH && " (короткие балки увеличены)"}
                    </text>
                )}

            </svg>
        </div>
    );
};

export default BeamVisualizer;