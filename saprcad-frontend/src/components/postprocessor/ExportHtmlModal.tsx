// src/components/postprocessor/ExportHtmlModal.tsx
import React, { useState } from 'react';
import {RodResult} from "../../types/sapr.types";

interface SectionCalcResult {
    id: string;
    rodId: number;
    x: number;
    N: number;
    sigma: number;
    u: number;
    timestamp: Date;
}

interface UniformStepRow {
    rodId: number;
    x: number;
    N: number;
    sigma: number;
    u: number;
    isBoundary: boolean;
}

interface ExportHtmlModalProps {
    rods: RodResult[];
    displacements: number[];
    sectionCalcHistory: SectionCalcResult[];
    uniformStepData: UniformStepRow[];
    onClose: () => void;
}

const ExportHtmlModal: React.FC<ExportHtmlModalProps> = ({
                                                             rods,
                                                             displacements,
                                                             sectionCalcHistory = [],
                                                             uniformStepData = [],
                                                             onClose,
                                                         }) => {
    const [selected, setSelected] = useState({
        construction: true,
        table: true,
        epureN: true,
        epureSigma: true,
        epureU: true,
        displacements: true,
        sectionCalc: sectionCalcHistory.length > 0,
        uniformStep: uniformStepData.length > 0,
    });

    const [isGenerating, setIsGenerating] = useState(false);

    const toggle = (key: keyof typeof selected) => {
        setSelected(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const generateHtmlReport = () => {
        setIsGenerating(true);

        try {
            const getSvgString = (selectorOrId: string): string => {
                let el: Element | null = null;

                if (selectorOrId.startsWith('#')) {
                    // Поиск по ID
                    el = document.querySelector(selectorOrId);
                } else {
                    // Поиск по заголовку
                    const h4Elements = Array.from(document.querySelectorAll('h4'));
                    const targetH4 = h4Elements.find(el =>
                        el.textContent?.includes(selectorOrId)
                    );

                    if (targetH4) {
                        // Ищем SVG в родительском контейнере
                        const container = targetH4.closest('div');
                        if (container) {
                            el = container.querySelector('svg');
                        }
                    }
                }

                // Явное приведение типа к Element и проверка на null
                return el ? new XMLSerializer().serializeToString(el as Element) : '';
            };

            const constructionSvg = selected.construction ? getSvgString('#construction-svg') : '';
            const epureNSvg = selected.epureN ? getSvgString('Продольные силы N(x)') : '';
            const epureSigmaSvg = selected.epureSigma ? getSvgString('Напряжения σ(x)') : '';
            const epureUSvg = selected.epureU ? getSvgString('Перемещения u(x)') : '';

            const htmlContent = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>САПР — Отчёт по расчёту НДС</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #4a90e2; padding-bottom: 15px; }
    h1 { color: #2c3e50; margin: 10px 0; }
    h2 { color: #3498db; margin: 25px 0 15px; }
    h3 { color: #2980b9; margin: 20px 0 12px; }
    .meta { background: #f8f9fa; padding: 10px; border-radius: 4px; margin: 15px 0; }
    .displacements { display: flex; flex-wrap: wrap; gap: 10px; }
    .disp-card { background: #e3f2fd; padding: 8px 16px; border-radius: 4px; min-width: 120px; text-align: center; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
    th { background-color: #4a90e2; color: white; }
    .epure-svg { margin: 20px 0; border: 1px solid #eee; border-radius: 4px; overflow: hidden; }
    .boundary { background-color: #e8f5e9; }
    footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #777; font-size: 0.9em; }
  </style>
</head>
<body>
  <header>
    <h1>САПР стержневых систем</h1>
    <h2>Отчёт по расчёту напряжённо-деформированного состояния</h2>
    <div class="meta">
      <p><strong>Дата:</strong> ${new Date().toLocaleString('ru-RU')}</p>
      <p><strong>Стержней:</strong> ${rods.length}, <strong>узлов:</strong> ${rods.length + 1}</p>
    </div>
  </header>

  ${selected.displacements ? `
  <section>
    <h3>Узловые перемещения ∆, м</h3>
    <div class="displacements">
      ${displacements.map((u, i) => `
        <div class="disp-card">
          <strong>Узел ${i}</strong><br>
          ${u.toExponential(4)}
        </div>
      `).join('')}
    </div>
  </section>
  ` : ''}

  ${constructionSvg ? `
  <section>
    <h3>Конструкция и эпюры N(x), σ(x), u(x)</h3>
    <div class="epure-svg">${constructionSvg}</div>
  </section>
  ` : ''}

  ${epureNSvg ? `
  <section>
    <h3>Эпюра продольных сил N(x)</h3>
    <div class="epure-svg">${epureNSvg}</div>
  </section>
  ` : ''}

  ${epureSigmaSvg ? `
  <section>
    <h3>Эпюра нормальных напряжений σ(x)</h3>
    <div class="epure-svg">${epureSigmaSvg}</div>
  </section>
  ` : ''}

  ${epureUSvg ? `
  <section>
    <h3>Эпюра перемещений u(x)</h3>
    <div class="epure-svg">${epureUSvg}</div>
  </section>
  ` : ''}

  ${selected.table ? `
  <section>
    <h3>Сводная таблица по стержням</h3>
    <table>
      <thead>
        <tr>
          <th>№</th>
          <th>L, м</th>
          <th>A, м²</th>
          <th>[σ], Па</th>
          <th>max\|σ\|, Па</th>
          <th>Прочность</th>
          <th>N₀, Н</th>
          <th>Nₗ, Н</th>
        </tr>
      </thead>
      <tbody>
        ${rods.map((rod: any) => {
                const N0 = rod.axialForceCoeffs.a0;
                const Nl = N0 + rod.axialForceCoeffs.a1 * rod.length;
                const safe = Math.abs(rod.maxStressOnTheRod) <= rod.allowableStress;
                return `
            <tr>
              <td>${rod.rodId}</td>
              <td>${rod.length.toFixed(2)}</td>
              <td>${rod.area.toExponential(1)}</td>
              <td>${rod.allowableStress.toExponential(1)}</td>
              <td>${rod.maxStressOnTheRod.toExponential(1)}</td>
              <td>${safe ? '✓' : '✗'}</td>
              <td>${N0.toFixed(0)}</td>
              <td>${Nl.toFixed(0)}</td>
            </tr>
          `;
            }).join('')}
      </tbody>
    </table>
  </section>
  ` : ''}

  ${selected.sectionCalc && sectionCalcHistory.length > 0 ? `
  <section>
    <h3>История расчётов в сечениях (${sectionCalcHistory.length})</h3>
    <table>
      <thead>
        <tr>
          <th>Стержень</th>
          <th>x, м</th>
          <th>N(x), Н</th>
          <th>σ(x), Па</th>
          <th>u(x), м</th>
          <th>Прочность</th>
        </tr>
      </thead>
      <tbody>
        ${sectionCalcHistory.map(item => {
                const rod = rods.find((r: any) => r.rodId === item.rodId);
                const safe = rod ? Math.abs(item.sigma) <= rod.allowableStress : true;
                return `
            <tr>
              <td>${item.rodId}</td>
              <td>${item.x.toFixed(3)}</td>
              <td>${item.N.toExponential(4)}</td>
              <td>${item.sigma.toExponential(4)}</td>
              <td>${item.u.toExponential(6)}</td>
              <td style="color: ${safe ? '#2e7d32' : '#e53935'}">${safe ? '✓' : '✗'}</td>
            </tr>
          `;
            }).join('')}
      </tbody>
    </table>
  </section>
  ` : ''}

  ${selected.uniformStep && uniformStepData.length > 0 ? `
  <section>
    <h3>Расчёт по равномерному шагу (${uniformStepData.length} точек)</h3>
    <table>
      <thead>
        <tr>
          <th>Стержень</th>
          <th>x, м</th>
          <th>N(x), Н</th>
          <th>σ(x), Па</th>
          <th>u(x), м</th>
          <th>Граница</th>
        </tr>
      </thead>
      <tbody>
        ${uniformStepData.map(row => `
          <tr ${row.isBoundary ? 'class="boundary"' : ''}>
            <td>${row.rodId}</td>
            <td>${row.x.toFixed(4)}</td>
            <td>${row.N.toExponential(3)}</td>
            <td>${row.sigma.toExponential(3)}</td>
            <td>${row.u.toExponential(5)}</td>
            <td>${row.isBoundary ? '✓' : ''}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    <p style="font-size: 0.9em; color: #666;">
      Подсвечены сечения на границах стержней (x = 0 и x = L<sub>i</sub>). 
      Расчёт для каждого стержня начинается с x = 0.
    </p>
  </section>
  ` : ''}

  <footer>
    САПР стержневых систем. Курсовая работа. Вычислительная механика, 2025/26
  </footer>
</body>
</html>
`;

            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `sapr_report_${new Date().toISOString().slice(0, 10)}.html`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            onClose();

        } catch (err) {
            console.error('Ошибка генерации HTML', err);
            alert('Не удалось создать отчёт. Проверьте консоль.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        }}>
            <div style={{
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                width: '500px',
                maxHeight: '85vh',
                overflowY: 'auto',
            }}>
                <h3 style={{ margin: '0 0 1rem 0' }}>Формирование отчёта (HTML)</h3>
                <p>Выберите, какие блоки включить:</p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '6px 12px', marginBottom: '1.5rem' }}>
                    {[
                        { key: 'construction', label: 'Конструкция + эпюры' },
                        { key: 'table', label: 'Сводная таблица' },
                        { key: 'epureN', label: 'Эпюра N(x)' },
                        { key: 'epureSigma', label: 'Эпюра σ(x)' },
                        { key: 'epureU', label: 'Эпюра u(x)' },
                        { key: 'displacements', label: 'Вектор ∆' },
                        { key: 'sectionCalc', label: `История сечений (${sectionCalcHistory.length})`, disabled: sectionCalcHistory.length === 0 },
                        { key: 'uniformStep', label: `Шаговая таблица (${uniformStepData.length})`, disabled: uniformStepData.length === 0 },
                    ].map(({ key, label, disabled }) => (
                        <React.Fragment key={key}>
                            <label style={{ opacity: disabled ? 0.5 : 1 }}>
                                <input
                                    type="checkbox"
                                    checked={selected[key as keyof typeof selected]}
                                    onChange={() => !disabled && toggle(key as keyof typeof selected)}
                                    disabled={disabled}
                                />
                                {' '} {label}
                            </label>
                            <div></div>
                        </React.Fragment>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{ padding: '6px 16px' }}>
                        Отмена
                    </button>
                    <button
                        onClick={generateHtmlReport}
                        disabled={isGenerating}
                        style={{
                            padding: '6px 16px',
                            backgroundColor: isGenerating ? '#ccc' : '#2e7d32',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isGenerating ? 'wait' : 'pointer',
                        }}
                    >
                        {isGenerating ? 'Генерация…' : 'Скачать HTML'}
                    </button>
                </div>

                <p style={{ fontSize: '0.85em', color: '#666', marginTop: '1rem' }}>
                    HTML —  с SVG и кириллицей<br />
                </p>
            </div>
        </div>
    );
};

export default ExportHtmlModal;