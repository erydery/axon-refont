import { useEffect, useId, useState } from 'react';
import mermaid from 'mermaid';

let renderQueue: Promise<unknown> = Promise.resolve();

function normalizeChart(value: unknown): string {
  let source = typeof value === 'string' ? value : '';
  if (!source && value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    source = String(record.mermaid ?? record.chart ?? record.code ?? record.definition ?? '');
  }
  source = source
    .trim()
    .replace(/^```(?:mermaid)?\s*/i, '')
    .replace(/\s*```$/, '');
  try {
    const parsed: unknown = JSON.parse(source);
    if (parsed && typeof parsed === 'object') {
      const record = parsed as Record<string, unknown>;
      source = String(record.mermaid ?? record.chart ?? record.code ?? record.definition ?? source);
    }
  } catch {
    // Mermaid source is normally not JSON; use it directly.
  }
  return source.trim();
}

function palette(isDark: boolean) {
  return {
    primaryColor: isDark ? '#29264d' : '#eeedff',
    primaryTextColor: isDark ? '#f2f0ff' : '#34376b',
    primaryBorderColor: isDark ? '#8f83ff' : '#6658ff',
    lineColor: isDark ? '#aaa0ff' : '#5146c8',
    secondaryColor: isDark ? '#202130' : '#f4f3ff',
    tertiaryColor: isDark ? '#1b1c29' : '#ffffff',
    background: isDark ? '#1b1c29' : '#ffffff',
    mainBkg: isDark ? '#29264d' : '#eeedff',
    secondBkg: isDark ? '#202130' : '#f4f3ff',
    tertiaryBkg: isDark ? '#1b1c29' : '#ffffff',
    nodeBorder: isDark ? '#8f83ff' : '#6658ff',
    clusterBkg: isDark ? '#202130' : '#f7f7fb',
    clusterBorder: isDark ? '#555276' : '#d9d8ef',
    titleColor: isDark ? '#f2f0ff' : '#34376b',
    edgeLabelBackground: isDark ? '#1b1c29' : '#ffffff',
    actorBkg: isDark ? '#29264d' : '#eeedff',
    actorBorder: isDark ? '#8f83ff' : '#6658ff',
    actorTextColor: isDark ? '#f2f0ff' : '#34376b',
    signalColor: isDark ? '#aaa0ff' : '#5146c8',
    signalTextColor: isDark ? '#f2f0ff' : '#34376b',
    fontFamily: 'DM Sans, Arial, sans-serif',
  };
}

export function MermaidChart({ chart }: { chart: unknown }) {
  const id = `axon-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const [svg, setSvg] = useState('');
  const [error, setError] = useState('');
  const [theme, setTheme] = useState(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );
  const source = normalizeChart(chart);

  useEffect(() => {
    const observer = new MutationObserver(() =>
      setTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'),
    );
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;
    setSvg('');
    setError('');
    if (!source) {
      setError('Aucune définition de diagramme trouvée.');
      return () => {
        active = false;
      };
    }
    const isDark = theme === 'dark';
    const render = async () => {
      try {
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: 'base',
          themeVariables: palette(isDark),
          flowchart: { htmlLabels: false, curve: 'basis' },
        });
        const result = await mermaid.render(id, source);
        if (active) setSvg(result.svg);
      } catch (cause) {
        if (active)
          setError(
            cause instanceof Error ? cause.message : 'La définition du diagramme est invalide.',
          );
      }
    };
    const queued = renderQueue.then(render, render);
    renderQueue = queued.catch(() => undefined);
    return () => {
      active = false;
    };
  }, [id, source, theme]);

  return svg ? (
    <div
      className="mermaid-wrap"
      role="img"
      aria-label="Diagramme de cours"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  ) : (
    <div className="chart-fallback" role="status">
      <strong>Diagramme non affiché</strong>
      <span>{error || 'Rendu du diagramme…'}</span>
      <pre>{source}</pre>
    </div>
  );
}
