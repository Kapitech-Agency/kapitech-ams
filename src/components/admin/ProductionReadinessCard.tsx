import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../../lib/apiClient';

type Props = { language: 'id' | 'en' };

const labels: Array<[string, string]> = [
  ['runtime', 'Runtime'],
  ['encryption', 'Encryption'],
  ['postgres', 'PostgreSQL'],
  ['migrations', 'Migrations'],
  ['mfa', 'MFA'],
  ['backupDr', 'Backup / DR'],
  ['documentStorage', 'Documents'],
  ['notifications', 'Notifications']
];

export const ProductionReadinessCard: React.FC<Props> = ({ language }) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ productionReady: boolean; gates: Record<string, boolean>; status: any } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.system.productionReadiness();
      if (response.data) {
        setResult({
          productionReady: Boolean(response.data.productionReady),
          gates: response.data.gates || {},
          status: response.data.status || { datasource: 'unknown' }
        });
      } else {
        setResult(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div className="p-4 rounded-card bg-panel border border-line space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-fg flex items-center gap-2">
            <ShieldCheck size={15} className="text-accent" />
            <span>Production Readiness Gate</span>
          </h3>
          <p className="text-[11px] text-muted font-sans mt-1">
            {language === 'id' ? 'Status server-side dari seluruh kontrol wajib sebelum cutover PostgreSQL.' : 'Server-side status of all required controls before PostgreSQL cutover.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={'inline-flex items-center min-h-10 px-3 rounded-control border text-[10px] font-sans font-semibold ' + (result?.productionReady ? 'border-success/30 bg-success/5 text-success' : 'border-warning/30 bg-warning/5 text-warning')}>
            {result?.productionReady ? 'Production Ready' : language === 'id' ? 'Cutover Ditahan' : 'Cutover Blocked'}
          </span>
          <button type="button" onClick={() => void refresh()} disabled={loading} className="min-h-10 px-3 rounded-control bg-panel border border-line text-muted text-[10px] font-sans font-semibold disabled:opacity-50" aria-label="Refresh production readiness">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>
      {result && (
        <>
          {result.status?.reason && <div className="rounded-control border border-warning/20 bg-warning/5 p-3 text-[11px] text-amber-200 font-sans">{result.status.reason}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {labels.map(([key, label]) => {
              const ready = Boolean(result.gates[key]);
              return <div key={key} className="flex items-center justify-between gap-2 rounded-control bg-panel border border-line px-3 py-2.5">
                <span className="text-[10px] text-muted font-sans">{label}</span>
                {ready ? <Check size={14} className="text-success shrink-0" /> : <AlertCircle size={14} className="text-warning shrink-0" />}
              </div>;
            })}
          </div>
          <div className="text-[10px] text-[var(--k-text-tertiary)] font-sans">
            {language === 'id' ? 'Datasource: ' + String(result.status?.datasource || 'unknown') + '. Gate dihitung server-side.' : 'Datasource: ' + String(result.status?.datasource || 'unknown') + '. Gates are evaluated server-side.'}
          </div>
        </>
      )}
      {!result && !loading && <div className="text-[11px] text-[var(--k-text-tertiary)] font-sans">{language === 'id' ? 'Status readiness belum tersedia.' : 'Readiness status is unavailable.'}</div>}
    </div>
  );
};