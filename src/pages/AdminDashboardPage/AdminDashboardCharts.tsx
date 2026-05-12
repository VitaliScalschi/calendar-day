import { useMemo } from 'react';

type DonutProps = {
  /** În desfășurare + Următoare (aceeași categorie ca pe cardul KPI). */
  inLucru: number;
  viitoare: number;
  expirate: number;
  total: number;
};

/** Ordine legendă: În desfășurare (inclusiv următoare), Viitoare, Expirate — culoare în desfășurare = iconiță KPI (#fd7e14). */
const COL = {
  inLucru: '#fd7e14',
  viitoare: '#6c757d',
  expirate: '#dc3545',
} as const;

const LEGEND_ORDER = [
  { key: 'i', label: 'În desfășurare', nKey: 'inLucru' as const, c: COL.inLucru },
  { key: 'v', label: 'Viitoare', nKey: 'viitoare' as const, c: COL.viitoare },
  { key: 'e', label: 'Expirate', nKey: 'expirate' as const, c: COL.expirate },
] as const;

export function DashboardDonut({ inLucru, viitoare, expirate, total }: DonutProps) {
  const counts = useMemo(() => ({ inLucru, viitoare, expirate }), [inLucru, viitoare, expirate]);

  const parts = useMemo(() => {
    const sum = Math.max(1, counts.inLucru + counts.viitoare + counts.expirate);
    let acc = 0;
    return LEGEND_ORDER.map((row) => {
      const n = counts[row.nKey];
      const start = acc / sum;
      acc += n;
      const end = acc / sum;
      return { ...row, n, start, end };
    });
  }, [counts]);

  /** Conic gradient cu fâșii albe subțiri între segmente (ca în referința vizuală). */
  const gradient = useMemo(() => {
    const sum = Math.max(1, counts.inLucru + counts.viitoare + counts.expirate);
    const gapDeg = 2.25;
    const gapColor = '#ffffff';
    const nonZero = LEGEND_ORDER.map((row) => ({ ...row, n: counts[row.nKey] })).filter((p) => p.n > 0);

    if (nonZero.length === 0) {
      return 'conic-gradient(from -90deg, #e9ecef 0deg 360deg)';
    }
    if (nonZero.length === 1) {
      return `conic-gradient(from -90deg, ${nonZero[0].c} 0deg 360deg)`;
    }

    const gapTotal = nonZero.length * gapDeg;
    const usable = 360 - gapTotal;
    const slices: string[] = [];
    let cursor = 0;
    for (let i = 0; i < nonZero.length; i++) {
      const p = nonZero[i];
      const size = (p.n / sum) * usable;
      const a0 = cursor;
      const a1 = cursor + size;
      slices.push(`${p.c} ${a0.toFixed(2)}deg ${a1.toFixed(2)}deg`);
      cursor = a1;
      slices.push(`${gapColor} ${cursor.toFixed(2)}deg ${(cursor + gapDeg).toFixed(2)}deg`);
      cursor += gapDeg;
    }
    return `conic-gradient(from -90deg, ${slices.join(', ')})`;
  }, [counts]);

  return (
    <div className="admin-dashboard-donut-wrap">
      <div
        className="admin-dashboard-donut"
        style={{ background: gradient }}
        role="img"
        aria-label={`Repartiție termene: total ${total}`}
      >
        <div className="admin-dashboard-donut__hole">
          <span className="admin-dashboard-donut__total">{total}</span>
          <span className="admin-dashboard-donut__label">Total</span>
        </div>
      </div>
      <ul className="list-unstyled mb-0 admin-dashboard-donut-legend">
        {parts.map((row) => (
          <li key={row.key} className="admin-dashboard-donut-legend__row">
            <span className="admin-dashboard-donut-legend__label">
              <span className="admin-dashboard-dot admin-dashboard-dot--legend" style={{ background: row.c }} />
              {row.label}
            </span>
            <span className="admin-dashboard-donut-legend__value">
              <span className="admin-dashboard-donut-legend__num">{row.n}</span>
              <span className="admin-dashboard-donut-legend__pct">
                ({total ? Math.round((row.n / total) * 100) : 0}%)
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
