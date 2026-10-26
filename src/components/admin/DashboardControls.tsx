import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';

export type DashboardControlVariant='action'|'primary'|'shortcut'|'icon'|'quiet'|'filter';
export type DashboardControlSize='compact'|'standard'|'roomy';
type CommonProps={children?:React.ReactNode;variant?:DashboardControlVariant;size?:DashboardControlSize;icon?:React.ReactNode;trailingIcon?:React.ReactNode;showArrow?:boolean;active?:boolean;count?:React.ReactNode;metric?:React.ReactNode;disabled?:boolean;className?:string;title?:string;ariaLabel?:string;ariaPressed?:boolean;ariaCurrent?:React.AriaAttributes['aria-current'];ariaExpanded?:boolean;ariaControls?:string;id?:string;buttonRef?:React.Ref<HTMLButtonElement>};
type LinkProps=CommonProps&{to:string;onClick?:React.MouseEventHandler<HTMLAnchorElement>;type?:never};
type ButtonProps=CommonProps&{to?:undefined;onClick?:React.MouseEventHandler<HTMLButtonElement>;type?:'button'|'submit'|'reset'};
export type DashboardControlProps=LinkProps|ButtonProps;
export const DashboardControl:React.FC<DashboardControlProps>=(p)=>{
 const {children,variant='action',size='standard',icon,trailingIcon,showArrow,active=false,count,metric,disabled=false,className='',title,ariaLabel,ariaPressed,ariaCurrent,ariaExpanded,ariaControls,id,buttonRef}=p;
 const arrow=showArrow??Boolean(p.to&&variant==='action');
 const cls=['ams-dashboard-control','ams-dashboard-control--'+variant,'ams-dashboard-control--'+size,active?'is-active':'',className].filter(Boolean).join(' ');
 const child=<>{icon?<span className="ams-dashboard-control__icon" aria-hidden="true">{icon}</span>:null}{children!==undefined&&children!==null?<span className="ams-dashboard-control__label">{children}</span>:null}{metric!==undefined&&metric!==null?<span className="ams-dashboard-control__metric">{metric}</span>:null}{count!==undefined&&count!==null?<span className="ams-dashboard-control__count">{count}</span>:null}{trailingIcon?<span className="ams-dashboard-control__trailing-icon" aria-hidden="true">{trailingIcon}</span>:arrow?<span className="ams-dashboard-control__trailing-icon" aria-hidden="true"><ArrowUpRight size={13}/></span>:null}</>;
 if(p.to)return <Link id={id} to={p.to} onClick={p.onClick} className={cls} title={title} aria-label={ariaLabel} aria-current={ariaCurrent} aria-pressed={ariaPressed??(variant==='filter'?active:undefined)} aria-expanded={ariaExpanded} aria-controls={ariaControls} aria-disabled={disabled||undefined} tabIndex={disabled?-1:undefined} data-ams-control={variant}>{child}</Link>;
 return <button ref={buttonRef} id={id} type={p.type||'button'} onClick={p.onClick} className={cls} disabled={disabled} title={title} aria-label={ariaLabel} aria-current={ariaCurrent} aria-pressed={ariaPressed??(variant==='filter'?active:undefined)} aria-expanded={ariaExpanded} aria-controls={ariaControls} data-ams-control={variant}>{child}</button>;
};
export type DashboardFilterOption={value:string;label:React.ReactNode;count?:React.ReactNode;metric?:React.ReactNode;disabled?:boolean;title?:string};
export type DashboardFilterGroupProps={ariaLabel:string;value:string;options:DashboardFilterOption[];onChange:(value:string)=>void;density?:'compact'|'comfortable'|'metric';layout?:'segmented'|'grid';className?:string;disabled?:boolean};
export const DashboardFilterGroup:React.FC<DashboardFilterGroupProps>=({ariaLabel,value,options,onChange,density='compact',layout='segmented',className='',disabled=false})=><div className={['ams-dashboard-filter-group','ams-dashboard-filter-group--'+density,'ams-dashboard-filter-group--'+layout,className].filter(Boolean).join(' ')} role="group" aria-label={ariaLabel} data-density={density} data-layout={layout}>{options.map(o=><DashboardControl key={o.value} variant="filter" size={density==='comfortable'?'roomy':'compact'} active={value===o.value} ariaPressed={value===o.value} disabled={disabled||Boolean(o.disabled)} title={o.title} onClick={()=>onChange(o.value)} count={o.count} metric={o.metric}>{o.label}</DashboardControl>)}</div>;
