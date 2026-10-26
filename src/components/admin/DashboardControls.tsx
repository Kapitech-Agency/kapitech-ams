import React from 'react';

export type DashboardControlSize = 'compact' | 'standard' | 'roomy';
type FilterOptionButtonProps = {
  children: React.ReactNode;
  active: boolean;
  count?: React.ReactNode;
  metric?: React.ReactNode;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
};
export const DashboardFilterOptionButton: React.FC<FilterOptionButtonProps> = ({children,active,count,metric,disabled=false,title,onClick}) => (
  <button type="button" onClick={onClick} className={['ams-dashboard-control','ams-dashboard-control--filter',active?'is-active':''].filter(Boolean).join(' ')} disabled={disabled} title={title} aria-pressed={active} data-ams-control="filter">
    <span className="ams-dashboard-control__label">{children}</span>
    {metric!==undefined&&metric!==null?<span className="ams-dashboard-control__metric">{metric}</span>:null}
    {count!==undefined&&count!==null?<span className="ams-dashboard-control__count">{count}</span>:null}
  </button>
);

export type DashboardFilterOption = { value:string; label:React.ReactNode; count?:React.ReactNode; metric?:React.ReactNode; disabled?:boolean; title?:string };
export type DashboardFilterGroupProps = { ariaLabel:string; value:string; options:DashboardFilterOption[]; onChange:(value:string)=>void; density?:'compact'|'comfortable'|'metric'; layout?:'segmented'|'grid'; className?:string; disabled?:boolean };
export const DashboardFilterGroup: React.FC<DashboardFilterGroupProps> = ({ariaLabel,value,options,onChange,density='compact',layout='segmented',className='',disabled=false}) => (
  <div className={['ams-dashboard-filter-group','ams-dashboard-filter-group--'+density,'ams-dashboard-filter-group--'+layout,className].filter(Boolean).join(' ')} role="group" aria-label={ariaLabel} data-density={density} data-layout={layout}>
    {options.map(option=><DashboardFilterOptionButton key={option.value} active={value===option.value} disabled={disabled||Boolean(option.disabled)} title={option.title} onClick={()=>onChange(option.value)} count={option.count} metric={option.metric}>{option.label}</DashboardFilterOptionButton>)}
  </div>
);
