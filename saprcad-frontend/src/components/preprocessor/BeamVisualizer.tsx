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

    // Константы для визуализации
    const BASE_LENGTH_SCALE = 80;
    const MIN_ROD_WIDTH = 30;
    const MAX_ROD_WIDTH = 200;
    const MAX_TOTAL_WIDTH = 1000;
    const MIN_TOTAL_WIDTH = 400;

    const MAX_HEIGHT = 25;
    const MIN_HEIGHT = 12;
    const ARROW_LENGTH = 25;
    const NODE_OFFSET_X = ARROW_LENGTH + 15;

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
    const rodPositions: { x: number; width: number; height: number; y: number }[] = [];
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
    for (const rod of project.rods) {
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

    // Рассчитываем позиции узлов
    currentX = NODE_OFFSET_X;
    nodePositions.push(currentX);

    for (let i = 0; i < project.rods.length; i++) {
        currentX += Math.max(project.rods[i].length * lengthScale, MIN_ROD_WIDTH);
        nodePositions.push(currentX);
    }

    const finalWidth = Math.max(MIN_TOTAL_WIDTH, Math.min(MAX_TOTAL_WIDTH, requiredWidth));
    const showScaleInfo = lengthScale !== BASE_LENGTH_SCALE || minRodLength * BASE_LENGTH_SCALE < MIN_ROD_WIDTH;

    // Улучшенная функция для расположения подписей узлов
    const getNodeLabelPositions = () => {
        const positions: { y: number; offset: number }[] = [];
        const minLabelDistance = 60; // Минимальное расстояние между подписями

        for (let i = 0; i < nodePositions.length; i++) {
            const nodeX = nodePositions[i];
            let bestY = 150; // Базовая позиция
            let offset = 0; // Смещение для стрелок сил

            // Проверяем расстояние до соседних узлов
            if (i > 0) {
                const prevNodeX = nodePositions[i - 1];
                if (nodeX - prevNodeX < minLabelDistance) {
                    // Чередуем позиции для близких узлов
                    bestY = i % 2 === 0 ? 130 : 150;
                }
            }

            if (i < nodePositions.length - 1) {
                const nextNodeX = nodePositions[i + 1];
                if (nextNodeX - nodeX < minLabelDistance) {
                    // Чередуем позиции для близких узлов
                    bestY = i % 2 === 0 ? 130 : 150;
                }
            }

            // Если узел имеет силу, дополнительно смещаем подпись
            if (project.nodes[i].externalForce !== 0) {
                offset = project.nodes[i].externalForce > 0 ? 10 : -10;
            }

            positions.push({ y: bestY, offset });
        }

        return positions;
    };

    const nodeLabelPositions = getNodeLabelPositions();

    return (
        <div style={{ overflow: 'auto', padding: '10px 0', paddingLeft: '20px' }}>
            <svg
                width="100%"
                height="200"
                style={{
                    minWidth: `${MIN_TOTAL_WIDTH}px`,
                    backgroundColor: '#fafafa',
                    maxWidth: `${MAX_TOTAL_WIDTH}px`
                }}
                viewBox={`0 0 ${finalWidth} 200`}
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

                {/* Стержни */}
                {project.rods.map((rod, i) => {
                    const pos = rodPositions[i];
                    const isVeryShort = rod.length * lengthScale < MIN_ROD_WIDTH;

                    return (
                        <g key={rod.id}>
                            <rect
                                x={pos.x}
                                y={pos.y}
                                width={pos.width}
                                height={pos.height}
                                fill="#4a90e2"
                                stroke="#2c3e50"
                                strokeWidth="1"
                            />

                            {/* Упрощенные подписи стержней для коротких балок */}
                            {pos.width > 50 ? (
                                // Полные подписи для нормальных стержней
                                <>
                                    <circle
                                        cx={pos.x + pos.width / 2}
                                        cy={75}
                                        r="12"
                                        fill="#fff"
                                        stroke="#333"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={pos.x + pos.width / 2}
                                        y={79}
                                        textAnchor="middle"
                                        fontSize="11"
                                        fontWeight="bold"
                                        fill="#000"
                                    >
                                        {rod.id}
                                    </text>
                                    <text
                                        x={pos.x + pos.width / 2}
                                        y={45}
                                        textAnchor="middle"
                                        fontSize="9"
                                        fill="#666"
                                    >
                                        L={rod.length.toFixed(2)}м
                                    </text>
                                    <text
                                        x={pos.x + pos.width / 2}
                                        y={55}
                                        textAnchor="middle"
                                        fontSize="8"
                                        fill="#888"
                                    >
                                        A={rod.area.toExponential(2)}м²
                                    </text>
                                </>
                            ) : (
                                // Упрощенные подписи для очень коротких стержней
                                <>
                                    <circle
                                        cx={pos.x + pos.width / 2}
                                        cy={75}
                                        r="8"
                                        fill="#fff"
                                        stroke="#333"
                                        strokeWidth="1"
                                    />
                                    <text
                                        x={pos.x + pos.width / 2}
                                        y={78}
                                        textAnchor="middle"
                                        fontSize="8"
                                        fontWeight="bold"
                                        fill="#000"
                                    >
                                        {rod.id}
                                    </text>
                                </>
                            )}

                            {/* Распределённая нагрузка - ВСЕГДА отображается если не равна 0 */}
                            {rod.distributedLoad !== 0 && (
                                <>
                                    {/* Для очень коротких стержней - показываем только одну стрелку по центру */}
                                    {pos.width <= 40 ? (
                                        <line
                                            x1={pos.x + pos.width / 2}
                                            y1={pos.y + pos.height / 2}
                                            x2={pos.x + pos.width / 2 + (rod.distributedLoad > 0 ? 10 : -10)}
                                            y2={pos.y + pos.height / 2}
                                            stroke={rod.distributedLoad > 0 ? 'green' : 'red'}
                                            strokeWidth="2"
                                            markerEnd="url(#distributedArrow)"
                                        />
                                    ) : (
                                        /* Для нормальных стержней - несколько стрелок */
                                        <>
                                            {Array.from({ length: Math.max(2, Math.floor(pos.width / 15)) }).map((_, idx) => {
                                                const spacing = pos.width / (Math.max(2, Math.floor(pos.width / 15)) + 1);
                                                const arrowX = pos.x + spacing * (idx + 1);
                                                const direction = rod.distributedLoad > 0 ? 1 : -1;
                                                const arrowLength = 8;

                                                return (
                                                    <line
                                                        key={idx}
                                                        x1={arrowX}
                                                        y1={pos.y + pos.height / 2}
                                                        x2={arrowX + arrowLength * direction}
                                                        y2={pos.y + pos.height / 2}
                                                        stroke={rod.distributedLoad > 0 ? 'green' : 'red'}
                                                        strokeWidth="1.5"
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
                    const labelPos = nodeLabelPositions[i];

                    return (
                        <g key={node.id}>
                            {/* Опора (заделка) - штрихи под одинаковым углом 45 градусов  */}
                            {node.fixed && (
                                <>
                                    <line
                                        x1={nodeX}
                                        y1={90}
                                        x2={nodeX}
                                        y2={120}
                                        stroke="#000"
                                        strokeWidth="3"
                                    />
                                    {[...Array(6)].map((_, idx) => {

                                        const dx = 8;
                                        const dy = 4;

                                        // Для первого узла - смещаем начальную точку влево чтобы штрихи были снаружи
                                        const startX = isFirstNode ? nodeX - 8 : nodeX;

                                        return (
                                            <line
                                                key={idx}
                                                x1={startX}
                                                y1={90 + idx * 5}
                                                x2={startX + dx}
                                                y2={90 + idx * 5 + dy}
                                                stroke="#000"
                                                strokeWidth="1.5"
                                            />
                                        );
                                    })}
                                </>
                            )}

                            {/* Сосредоточенная сила */}
                            {node.externalForce !== 0 && (
                                <>
                                    <line
                                        x1={nodeX}
                                        y1={100}
                                        x2={nodeX + (node.externalForce > 0 ? ARROW_LENGTH : -ARROW_LENGTH)}
                                        y2={100}
                                        stroke={node.externalForce > 0 ? 'blue' : 'orange'}
                                        strokeWidth="2"
                                        markerEnd="url(#concentratedArrow)"
                                    />
                                </>
                            )}

                            {/* Подпись узла - всегда читаемая */}
                            <text
                                x={nodeX + labelPos.offset}
                                y={labelPos.y}
                                textAnchor="middle"
                                fontSize="10"
                                fill="#333"
                                fontWeight="bold"
                            >
                                У{node.id}
                                {node.fixed}
                            </text>

                            {/* Маркер узла */}
                            <circle
                                cx={nodeX}
                                cy={100}
                                r="3"
                                fill="#fff"
                                stroke="#333"
                                strokeWidth="1.5"
                            />
                        </g>
                    );
                })}

                {/* Информация о масштабе */}
                {showScaleInfo && (
                    <text
                        x={NODE_OFFSET_X}
                        y={185}
                        fontSize="10"
                        fill="#666"
                        fontWeight="bold"
                    >
                        Масштаб: 1м = {(lengthScale).toFixed(1)}px
                        {minRodLength * BASE_LENGTH_SCALE < MIN_ROD_WIDTH && " (короткие балки увеличены)"}
                    </text>
                )}

                <text
                    x={finalWidth - NODE_OFFSET_X}
                    y={195}
                    fontSize="10"
                    fill="#888"
                    textAnchor="end"
                >
                    Всего: {project.rods.length} стержней, {project.nodes.length} узлов
                </text>
            </svg>
        </div>
    );
};

export default BeamVisualizer;