import React from 'react';
import { Eye } from 'lucide-react';
import { DashboardControl } from '../DashboardControls';

type NativeElement = React.ReactElement<Record<string, any>>;
const elements = (children: React.ReactNode): NativeElement[] => {
  const result: NativeElement[] = [];
  React.Children.forEach(children, child => {
    if (!React.isValidElement(child)) return;
    const element = child as NativeElement;
    if (element.type === React.Fragment) result.push(...elements(element.props.children));
    else result.push(element);
  });
  return result;
};
const labelText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(labelText).join('');
  return React.isValidElement(node) ? labelText((node.props as {children?: React.ReactNode}).children) : '';
};

/** Bounded native-table bridge: the existing source cells/callbacks remain authoritative.
 * Conditional columns/fragments are resolved React children, never a second financial model.
 * Unsupported spans/structures retain the original scrollable table at every viewport.
 */
export const FinanceRecordSurface: React.FC<{
  children: React.ReactElement;
  caption: string;
  mobileCards?: boolean;
  desktopOnly?: boolean;
  mobileTools?: React.ReactNode;
}> = ({children, caption, mobileCards = true, desktopOnly = false, mobileTools}) => {
  const table = children as NativeElement;
  const sections = elements(table.props.children);
  const head = sections.find(node => node.type === 'thead');
  const body = sections.find(node => node.type === 'tbody');
  const heads = head ? elements(head.props.children) : [];
  const headers = heads.length === 1 ? elements(heads[0].props.children).filter(node => node.type === 'th') : [];
  const rows = body ? elements(body.props.children).filter(node => node.type === 'tr') : [];
  const cells = rows.map(row => elements(row.props.children).filter(node => node.type === 'td' || node.type === 'th'));
  const supported = headers.length > 0 && headers.every(header => !header.props.colSpan && !header.props.rowSpan) && rows.length > 0 && cells.every(row => row.length === headers.length && row.every(cell => !cell.props.colSpan && !cell.props.rowSpan));
  const cards = mobileCards && supported && !desktopOnly;
  const labels = headers.map(header => labelText(header.props.children).trim());
  const isAction = (index: number) => /^(actions?|management|workflow)$/i.test(labels[index] || '');
  const primaryIndex = labels.findIndex((_, index) => !isAction(index));

  return <>
    {cards && <div className="min-[1100px]:hidden" data-ams-slug="finance-responsive-records">
      {mobileTools && <div className="border-b border-line p-4">{mobileTools}</div>}
      <div className="divide-y divide-line p-4" role="list" aria-label={caption + ' cards'}>
        {rows.map((row, rowIndex) => <article key={row.key ?? rowIndex} role="listitem" className="min-w-0 py-4 first:pt-0 last:pb-0">
          <div hidden={primaryIndex < 0}>{primaryIndex >= 0 && <><p className="text-[10px] font-medium text-muted">{labels[primaryIndex]}</p><div className="mt-1 min-w-0 break-words text-xs font-semibold text-fg">{cells[rowIndex][primaryIndex].props.children}</div></>}</div>
          <dl className="mt-3 grid min-w-0 grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            {cells[rowIndex].map((cell, index) => index !== primaryIndex && !isAction(index) ? <div key={index} className="min-w-0"><dt className="text-[10px] leading-4 text-muted">{labels[index] || 'Recorded value'}</dt><dd className="mt-1 min-w-0 break-words text-xs leading-5 text-fg">{cell.props.children}</dd></div> : null)}
          </dl>
          {(cells[rowIndex].some((_, index) => isAction(index)) || row.props.onClick) && <div className="mt-3 flex min-w-0 flex-wrap items-center gap-2 border-t border-line pt-3">
            {row.props.onClick && <DashboardControl variant="quiet" size="compact" icon={<Eye size={14} />} onClick={row.props.onClick}>Open record</DashboardControl>}
            {cells[rowIndex].map((cell, index) => isAction(index) ? <div key={index} className="min-w-0 max-w-full">{cell.props.children}</div> : null)}
          </div>}
        </article>)}
      </div>
    </div>}
    <div className={(cards || desktopOnly ? 'hidden min-[1100px]:block ' : '') + 'overflow-x-auto custom-scrollbar'} role="region" tabIndex={0} aria-label={'Scrollable ' + caption + ' table'}>
      {React.cloneElement(table, {}, sections.some(node => node.type === 'caption') ? table.props.children : <><caption className="sr-only">{caption}</caption>{table.props.children}</>)}
    </div>
  </>;
};
