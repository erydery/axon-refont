import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type ChartRecord = Record<string, unknown>;
const colors = [
  'var(--chart-primary)',
  'var(--chart-secondary)',
  'var(--chart-tertiary)',
  'var(--chart-quaternary)',
];

function toRows(input: unknown): { rows: ChartRecord[]; title?: string } {
  let value = input;
  if (typeof value === 'string') {
    try {
      value = JSON.parse(value);
    } catch {
      return { rows: [] };
    }
  }
  if (Array.isArray(value))
    return { rows: value.filter((row) => row && typeof row === 'object') as ChartRecord[] };
  if (!value || typeof value !== 'object') return { rows: [] };
  const record = value as ChartRecord;
  const title = typeof record.title === 'string' ? record.title : undefined;
  if (Array.isArray(record.data))
    return {
      rows: record.data.filter((row) => row && typeof row === 'object') as ChartRecord[],
      title,
    };
  if (Array.isArray(record.labels) && Array.isArray(record.datasets)) {
    const datasets = record.datasets as ChartRecord[];
    const rows = (record.labels as unknown[]).map((label, index) => {
      const row: ChartRecord = { name: String(label) };
      datasets.forEach((dataset, seriesIndex) => {
        const key = String(dataset.label ?? `Série ${seriesIndex + 1}`);
        const values = Array.isArray(dataset.data) ? dataset.data : [];
        row[key] = values[index];
      });
      return row;
    });
    return { rows, title };
  }
  return { rows: [], title };
}

const isNumeric = (value: unknown) =>
  value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value));

export function StatisticalChart({ data }: { data: unknown }) {
  const { rows, title } = toRows(data);
  if (!rows.length) {
    const fallback = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    return (
      <div className="chart-fallback" role="status">
        <strong>Graphique non affiché</strong>
        <span>Format de données non reconnu.</span>
        <pre>{fallback}</pre>
      </div>
    );
  }
  const first = rows[0];
  const labelKey =
    ['name', 'label', 'month', 'date', 'category', 'x'].find((key) => key in first) ??
    Object.keys(first).find((key) => !isNumeric(first[key])) ??
    'name';
  const series = Object.keys(first).filter(
    (key) => key !== labelKey && rows.some((row) => isNumeric(row[key])),
  );
  if (!series.length) {
    return (
      <div className="chart-fallback" role="status">
        <strong>Graphique non affiché</strong>
        <span>Aucune valeur numérique exploitable.</span>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }
  const normalizedRows = rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [
        key,
        series.includes(key) && isNumeric(value) ? Number(value) : value,
      ]),
    ),
  );
  return (
    <figure className="stat-chart">
      {title && <figcaption>{title}</figcaption>}
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={normalizedRows} margin={{ top: 12, right: 12, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
          <XAxis
            dataKey={labelKey}
            stroke="var(--chart-axis)"
            tick={{ fontSize: 11, fill: 'var(--chart-axis)' }}
          />
          <YAxis stroke="var(--chart-axis)" tick={{ fontSize: 10, fill: 'var(--chart-axis)' }} />
          <Tooltip
            contentStyle={{
              background: 'var(--chart-tooltip-bg)',
              border: '1px solid var(--chart-grid)',
              borderRadius: 12,
              color: 'var(--chart-text)',
            }}
            labelStyle={{ color: 'var(--chart-text)' }}
            itemStyle={{ color: 'var(--chart-text)' }}
          />
          {series.length > 1 && (
            <Legend
              wrapperStyle={{
                color: 'var(--chart-text)',
                fontFamily: 'DM Sans, Arial, sans-serif',
                fontSize: 12,
              }}
            />
          )}
          {series.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[5, 5, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </figure>
  );
}
