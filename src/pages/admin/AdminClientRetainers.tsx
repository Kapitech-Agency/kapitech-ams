import React, { useMemo, useState } from 'react';
import { ArrowUp, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Download, Plus, ReceiptText, RotateCcw, Search, TimerReset, TriangleAlert, X } from 'lucide-react';
import { useLanguage } from '../../lib/LanguageContext';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';

type Health = 'healthy' | 'near-cap' | 'overage-risk';
type Cycle = 'monthly' | 'quarterly' | 'annual';
type Tier = 'tier-1' | 'tier-2' | 'tier-3';
type Retainer = { id:string; initials:string; client:string; tier:Tier; monthlyValue:number; committedHours:number; usedHours:number; overageRate:number; cycle:Cycle; renewal:string; health:Health };

const seed: Retainer[] = [
  {id:'RET-2024-01',initials:'NV',client:'PT Nusantara Vault Bank',tier:'tier-1',monthlyValue:250000000,committedHours:400,usedHours:312,overageRate:850000,cycle:'monthly',renewal:'2026-11-30',health:'healthy'},
  {id:'RET-2024-04',initials:'SB',client:'SatuBio Diagnostics',tier:'tier-2',monthlyValue:175000000,committedHours:280,usedHours:246,overageRate:750000,cycle:'monthly',renewal:'2026-10-15',health:'near-cap'},
  {id:'RET-2023-18',initials:'KL',client:'Kinetix Logistics',tier:'tier-2',monthlyValue:140000000,committedHours:220,usedHours:138,overageRate:700000,cycle:'quarterly',renewal:'2026-12-31',health:'healthy'},
  {id:'RET-2024-09',initials:'PP',client:'PayPintar Gateways',tier:'tier-1',monthlyValue:210000000,committedHours:350,usedHours:348,overageRate:900000,cycle:'monthly',renewal:'2027-01-15',health:'overage-risk'},
  {id:'RET-2023-31',initials:'AM',client:'AeroMedika Telemetry',tier:'tier-3',monthlyValue:90000000,committedHours:150,usedHours:96,overageRate:650000,cycle:'monthly',renewal:'2027-03-31',health:'healthy'},
  {id:'RET-2024-11',initials:'VC',client:'Voltran Core Infra',tier:'tier-2',monthlyValue:120000000,committedHours:200,usedHours:164,overageRate:750000,cycle:'annual',renewal:'2027-08-31',health:'near-cap'}
];

const tierLabel: Record<Tier,string> = {'tier-1':'Tier 1 Strategic','tier-2':'Tier 2 Enterprise','tier-3':'Tier 3 Growth'};
const cycleLabel: Record<Cycle,string> = {monthly:'Monthly',quarterly:'Quarterly',annual:'Annual'};
const healthMeta: Record<Health,{label:string;dot:string;className:string}> = {
  healthy:{label:'Healthy',dot:'bg-success',className:'border-success/20 bg-success/10 text-success'},
  'near-cap':{label:'Near Cap',dot:'bg-warning',className:'border-warning/20 bg-warning/10 text-warning'},
  'overage-risk':{label:'Overage Risk',dot:'bg-danger',className:'border-danger/20 bg-danger/10 text-danger'}
};
const money = (value:number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(value);
const formatDate = (value:string) => new Intl.DateTimeFormat('en-GB',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));
const renewalDays = (value:string) => Math.ceil((new Date(value).getTime()-Date.now())/86400000);

export const AdminClientRetainers: React.FC = () => {
  const { language } = useLanguage();
  const [records,setRecords] = useState(seed);
  const [query,setQuery] = useState('');
  const [cycle,setCycle] = useState<'all'|Cycle>('all');
  const [tier,setTier] = useState<'all'|Tier>('all');
  const [health,setHealth] = useState<'all'|Health>('all');
  const [page,setPage] = useState(1);
  const [hoursTarget,setHoursTarget] = useState<Retainer|null>(null);
  const [hours,setHours] = useState('8');
  const [message,setMessage] = useState<string|null>(null);
  const pageSize = 6;

  const filtered = useMemo(() => records.filter((item) => {
    const text = (item.client + ' ' + item.id).toLowerCase();
    return (!query || text.includes(query.trim().toLowerCase())) && (cycle==='all' || item.cycle===cycle) && (tier==='all' || item.tier===tier) && (health==='all' || item.health===health);
  }), [records,query,cycle,tier,health]);
  const pages = Math.max(1,Math.ceil(filtered.length/pageSize));
  const visible = filtered.slice((page-1)*pageSize,page*pageSize);
  const mrr = records.reduce((sum,item)=>sum+item.monthlyValue,0);
  const allocated = records.reduce((sum,item)=>sum+item.committedHours,0);
  const used = records.reduce((sum,item)=>sum+item.usedHours,0);
  const burn = allocated ? (used/allocated)*100 : 0;
  const renewals = records.filter((item) => renewalDays(item.renewal)>=0 && renewalDays(item.renewal)<=30);
  const renewalsValue = renewals.reduce((sum,item)=>sum+item.monthlyValue,0);
  const nearCap = records.filter((item)=>item.health==='near-cap').length;
  const avgRate = records.length ? records.reduce((sum,item)=>sum+item.overageRate,0)/records.length : 0;

  const reset = () => { setQuery(''); setCycle('all'); setTier('all'); setHealth('all'); setPage(1); };
  const exportReport = () => {
    const rows = [
      ['Retainer ID','Client','Tier','Monthly Value','Committed Hours','Used Hours','Burn Rate','Overage Rate','Cycle','Renewal','Health'],
      ...filtered.map((item)=>[item.id,item.client,tierLabel[item.tier],item.monthlyValue,item.committedHours,item.usedHours,Math.round(item.usedHours/item.committedHours*100)+'%',item.overageRate,cycleLabel[item.cycle],item.renewal,healthMeta[item.health].label])
    ];
    const csv = rows.map((row)=>row.map((value)=>'"'+String(value??'').replace(/"/g,'""')+'"').join(',')).join('\n');
    const blob = new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href=url; anchor.download='kapitech-retainer-report.csv'; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
  };
  const logHours = () => {
    if(!hoursTarget) return;
    const amount = Math.max(0,Number(hours)||0);
    setRecords((current)=>current.map((item)=>item.id===hoursTarget.id?{...item,usedHours:Math.min(item.committedHours,item.usedHours+amount)}:item));
    setMessage(String(amount)+' hours logged for '+hoursTarget.client+'.');
    setHoursTarget(null);
  };

  return (
    <div className="min-h-full pb-8">
      <header className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-medium leading-8 tracking-[-0.02em] text-fg">Client Retainer Agreements</h1>
            <span className="inline-flex items-center rounded-badge border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-success">{records.length} Active Contracts</span>
          </div>
          <p className="mt-1 max-w-3xl text-[13px] leading-5 text-muted">Overview of monthly recurring retainers, allocated hours, burn rates, overage caps, and renewal terms.</p>
        </div>
        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button type="button" variant="secondary" onClick={exportReport} icon={<Download size={14}/>}>Download Retainer Report</Button>
          <Button type="button" variant="primary" onClick={()=>setMessage(language==='id'?'Retainer baru masih FE-only untuk sementara.':'New retainer is FE-only for now.')} icon={<Plus size={14}/>}>New Retainer</Button>
        </div>
      </header>

      {message && <div className="mb-4 flex items-center justify-between rounded-card border border-success/20 bg-success/10 px-3 py-2.5 text-xs text-success"><span>{message}</span><button type="button" onClick={()=>setMessage(null)} aria-label="Dismiss"><X size={14}/></button></div>}

      <section className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3" aria-label="Retainer metrics">
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">TOTAL MONTHLY RETAINER MRR</span><ArrowUp size={18} className="text-success"/></div><div className="mt-3 flex flex-wrap items-end justify-between gap-2"><span className="text-2xl font-medium leading-8 tabular-nums text-fg">{money(mrr)}</span><span className="rounded-badge bg-success/10 px-1.5 py-0.5 text-[11px] text-success">+8.4% vs last period</span></div></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">ALLOCATED RETAINER HOURS</span><Clock3 size={18} className="text-info"/></div><div className="mt-3 flex flex-wrap items-end justify-between gap-2"><span className="text-2xl font-medium leading-8 tabular-nums text-fg">{allocated.toLocaleString()} hrs/mo</span><span className="text-[11px] tabular-nums text-muted">Burned: <strong className="text-fg">{used.toLocaleString()} hrs</strong> / {burn.toFixed(1)}%</span></div></div>
        <div className="rounded-card border border-line bg-panel p-4"><div className="flex items-center justify-between text-muted"><span className="text-[11px] font-medium">UPCOMING RENEWALS (30D)</span><CalendarDays size={18} className="text-warning"/></div><div className="mt-3 flex flex-wrap items-end justify-between gap-2"><span className="text-2xl font-medium leading-8 tabular-nums text-fg">{renewals.length} Contracts</span><span className="rounded-badge bg-warning/10 px-1.5 py-0.5 text-[11px] text-warning">Value: {money(renewalsValue)}</span></div></div>
      </section>

      <section className="mb-4 rounded-card border border-line bg-panel p-3" aria-label="Retainer filters">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-[420px]"><Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><label htmlFor="retainer-search" className="sr-only">Search retainers</label><input id="retainer-search" type="search" value={query} onChange={(event)=>{setQuery(event.target.value);setPage(1);}} placeholder="Search retainer name, ID, or client..." className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg placeholder:text-muted focus:border-accent focus:outline-none"/></div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5"><span className="text-[11px] text-muted">Cycle:</span><CustomSelect value={cycle} onChange={(value)=>{setCycle(value as 'all'|Cycle);setPage(1);}} options={[{value:'all',label:'All Billing Cycles'},{value:'monthly',label:'Monthly Recurring'},{value:'quarterly',label:'Quarterly Committed'},{value:'annual',label:'Annual Retainer'}]} aria-label="Billing cycle" className="min-w-[150px]" triggerClassName="w-full"/></div>
            <div className="flex items-center gap-1.5"><span className="text-[11px] text-muted">Tier:</span><CustomSelect value={tier} onChange={(value)=>{setTier(value as 'all'|Tier);setPage(1);}} options={[{value:'all',label:'All Tiers'},{value:'tier-1',label:'Tier 1 Strategic'},{value:'tier-2',label:'Tier 2 Enterprise'},{value:'tier-3',label:'Tier 3 Growth'}]} aria-label="Retainer tier" className="min-w-[150px]" triggerClassName="w-full"/></div>
            <div className="flex items-center gap-1.5"><span className="text-[11px] text-muted">Health:</span><CustomSelect value={health} onChange={(value)=>{setHealth(value as 'all'|Health);setPage(1);}} options={[{value:'all',label:'Hour Allocation Status (All)'},{value:'healthy',label:'Healthy (< 80%)'},{value:'near-cap',label:'Near Cap (80% - 95%)'},{value:'overage-risk',label:'Overage Risk (> 95%)'}]} aria-label="Retainer health" className="min-w-[185px]" triggerClassName="w-full"/></div>
            <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[11px] font-medium text-muted hover:bg-panel hover:text-fg"><RotateCcw size={13}/>Reset</button>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-panel" aria-label="Retainer agreements table">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full min-w-[1160px] border-collapse text-left">
            <thead className="bg-bg"><tr className="border-b border-line text-[11px] text-muted"><th className="px-4 py-2.5 font-medium">CLIENT &amp; CONTRACT</th><th className="px-4 py-2.5 text-right font-medium">MONTHLY VALUE</th><th className="px-4 py-2.5 text-right font-medium">COMMITTED HOURS</th><th className="px-4 py-2.5 font-medium">HOURS USED (BURN RATE)</th><th className="px-4 py-2.5 text-right font-medium">OVERAGE RATE</th><th className="px-4 py-2.5 font-medium">CYCLE / RENEWAL</th><th className="px-4 py-2.5 text-center font-medium">STATUS</th><th className="px-4 py-2.5 text-right font-medium">ACTIONS</th></tr></thead>
            <tbody>
              {visible.map((item)=>{
                const usage=Math.round(item.usedHours/item.committedHours*100); const meta=healthMeta[item.health];
                return <tr key={item.id} className="border-b border-line last:border-0 hover:bg-bg/70">
                  <td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-[11px] font-semibold text-fg">{item.initials}</div><div className="min-w-0"><div className="truncate text-xs font-semibold text-fg">{item.client}</div><div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-muted"><span className="tabular-nums">{item.id}</span><span>•</span><span className={item.tier==='tier-1'?'text-accent-text':item.tier==='tier-2'?'text-info':'text-muted'}>{tierLabel[item.tier]}</span></div></div></div></td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums text-fg">{money(item.monthlyValue)}<span className="ml-0.5 text-[10px] text-muted">/mo</span></td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums text-fg">{item.committedHours} hrs<span className="ml-0.5 text-[10px] text-muted">/mo</span></td>
                  <td className="px-4 py-2.5"><div className="w-44"><div className="mb-1 flex items-center justify-between text-[10px] tabular-nums"><span className="font-medium text-fg">{item.usedHours} / {item.committedHours} hrs</span><span className={usage>=95?'font-semibold text-danger':usage>=80?'font-semibold text-warning':'text-muted'}>{usage}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-line/70"><div className={(usage>=95?'bg-danger':usage>=80?'bg-warning':'bg-success')+' h-1.5 rounded-full'} style={{width: (Math.min(100,usage)+'%')}}/></div></div></td>
                  <td className="px-4 py-2.5 text-right text-xs font-medium tabular-nums text-fg">{money(item.overageRate)}<span className="ml-0.5 text-[10px] text-muted">/hr</span></td>
                  <td className="px-4 py-2.5 text-[11px] text-muted"><div>{cycleLabel[item.cycle]}</div><div className={(renewalDays(item.renewal)<=30?'text-warning ':'text-fg ')+'mt-0.5 font-medium'}>Renews {formatDate(item.renewal)}</div></td>
                  <td className="px-4 py-2.5 text-center"><span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-medium '+meta.className}><span className={'h-1.5 w-1.5 rounded-full '+meta.dot}/>{meta.label}{usage>=80?' ('+usage+'%)':''}</span></td>
                  <td className="px-4 py-2.5 text-right"><div className="flex items-center justify-end gap-1.5"><button type="button" onClick={()=>setMessage('Edit Terms is FE-only for '+item.client+' until BE retainer data is available.')} className="rounded-control border border-line bg-bg px-2 py-1 text-[11px] font-medium text-fg hover:bg-panel">Edit Terms</button><button type="button" onClick={()=>{setHoursTarget(item);setHours('8');}} className="rounded-control border border-accent/30 bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent-text hover:bg-accent hover:text-white">Log Hours</button></div></td>
                </tr>;
              })}
              {!visible.length && <tr><td colSpan={8} className="px-4 py-14 text-center"><Search size={18} className="mx-auto text-muted"/><p className="mt-3 text-sm font-medium text-fg">No matching retainers.</p><p className="mt-1 text-xs text-muted">Try another search or reset the active filters.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-3 border-t border-line bg-bg px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-muted">Showing <span className="font-medium tabular-nums text-fg">{filtered.length ? (page-1)*pageSize+1 : 0}-{Math.min(page*pageSize,filtered.length)}</span> of <span className="font-medium tabular-nums text-fg">{filtered.length}</span> retainers</p>
          <div className="flex items-center gap-1.5"><button type="button" onClick={()=>setPage((current)=>Math.max(1,current-1))} disabled={page===1} className="rounded-control border border-line bg-panel px-2.5 py-1.5 text-[11px] text-muted hover:bg-bg hover:text-fg disabled:opacity-40"><ChevronLeft size={14} className="inline-block"/> Previous</button><span className="px-2 text-[11px] font-medium tabular-nums text-fg">{page} / {pages}</span><button type="button" onClick={()=>setPage((current)=>Math.min(pages,current+1))} disabled={page===pages} className="rounded-control border border-line bg-panel px-2.5 py-1.5 text-[11px] text-fg hover:bg-bg disabled:opacity-40">Next <ChevronRight size={14} className="inline-block"/></button></div>
        </div>
      </section>

      <section className="mt-3 grid grid-cols-1 gap-3 text-[11px] text-muted md:grid-cols-4" aria-label="Retainer summary">
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5"><CheckCircle2 size={14} className="text-success"/><span>Average Agency Burn: <strong className="text-fg">{burn.toFixed(1)}%</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5"><TriangleAlert size={14} className="text-warning"/><span>Near Cap Alerts: <strong className="text-fg">{nearCap} Accounts</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5"><ReceiptText size={14} className="text-info"/><span>Avg. Rate: <strong className="text-fg">{money(avgRate)}/hr</strong></span></div>
        <div className="flex items-center gap-2 rounded-card border border-line bg-panel p-2.5"><TimerReset size={14} className="text-accent-text"/><span>Last Audit Run: <strong className="text-fg">Local preview</strong></span></div>
      </section>

      <Modal open={!!hoursTarget} onClose={()=>setHoursTarget(null)} size="sm" title="Log retainer hours" description={hoursTarget ? hoursTarget.client+' · '+hoursTarget.id : undefined} footer={<div className="flex justify-end gap-2"><Button type="button" variant="secondary" onClick={()=>setHoursTarget(null)}>Cancel</Button><Button type="button" variant="primary" onClick={logHours}>Log Hours</Button></div>}>
        {hoursTarget && <div className="space-y-4"><div><label htmlFor="retainer-hours" className="mb-1.5 block text-xs font-medium text-fg">Hours to log</label><input id="retainer-hours" type="number" min="0" step="0.5" value={hours} onChange={(event)=>setHours(event.target.value)} className="h-9 w-full rounded-control border border-line bg-bg px-3 text-sm text-fg focus:border-accent focus:outline-none"/></div><div className="rounded-card border border-line bg-bg p-3 text-xs text-muted">Current usage: <span className="font-medium tabular-nums text-fg">{hoursTarget.usedHours} / {hoursTarget.committedHours} hrs</span></div></div>}
      </Modal>
    </div>
  );
};
export default AdminClientRetainers;