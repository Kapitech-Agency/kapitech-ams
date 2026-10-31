import React from 'react';
import { FileText } from 'lucide-react';
import './DashboardEmptyState.css';

export type DashboardEmptyStateProps = {
  eyebrow: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  compact?: boolean;
  tone?: 'neutral' | 'success';
};

export const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
  eyebrow,
  title,
  description,
  icon = <FileText size={17} aria-hidden="true" />,
  action,
  compact = true,
  tone = 'neutral'
}) => (
  <div className={[
    'ams-dashboard-empty',
    compact ? 'ams-dashboard-empty--compact' : '',
    tone === 'success' ? 'ams-dashboard-empty--success' : ''
  ].filter(Boolean).join(' ')} role="status">
    <span className="ams-dashboard-empty__icon" aria-hidden="true">{icon}</span>
    <div className="ams-dashboard-empty__content">
      <p className="ams-dashboard-empty__eyebrow">{eyebrow}</p>
      <p className="ams-dashboard-empty__title">{title}</p>
      <p className="ams-dashboard-empty__description">{description}</p>
      {action ? <div className="ams-dashboard-empty__action">{action}</div> : null}
    </div>
  </div>
);

