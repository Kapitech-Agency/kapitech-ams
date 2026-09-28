import React, { useEffect, useMemo, useState } from 'react';
// Shared module chrome renders the canonical ams-dashboard-header primitive.
import {
  Activity,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  CircleDashed,
  Download,
  Eye,
  Globe,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Trash2,
  TrendingUp,
  ShieldCheck,
  Users,
  X
} from 'lucide-react';
import { AgencyClient } from '../../lib/clientStore';
import { formatAmount, getActiveCurrency, CURRENCY_EVENT, CurrencyCode } from '../../lib/currency';
import { useLanguage } from '../../lib/LanguageContext';
import { hasAdminPermission } from '../../lib/adminAuth';
import { api } from '../../lib/apiClient';
import { Button } from '../../components/ui/Button';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';


type SortKey = 'name' | 'company' | 'industry' | 'status' | 'updatedAt' | 'projectsCount' | 'totalSpend';
type SortDirection = 'asc' | 'desc';
type SlaFilter = 'all' | 'healthy' | 'near' | 'over' | 'not-configured';
type StatusScope = 'all' | 'active' | 'lead' | 'at-risk';

const STATUS_OPTIONS: Array<{ value: AgencyClient['status']; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'lead', label: 'Lead' },
  { value: 'inactive', label: 'Inactive' }
];

const statusMeta: Record<AgencyClient['status'], { label: string; tone: 'success' | 'info' | 'warning' | 'neutral'; icon: React.ReactNode }> = {
  active: { label: 'Active', tone: 'success', icon: <Activity size={12} aria-hidden="true" /> },
  completed: { label: 'Completed', tone: 'info', icon: <Check size={12} aria-hidden="true" /> },
  lead: { label: 'Lead', tone: 'warning', icon: <Users size={12} aria-hidden="true" /> },
  inactive: { label: 'Inactive', tone: 'neutral', icon: <X size={12} aria-hidden="true" /> }
};

const statusClasses: Record<'success' | 'info' | 'warning' | 'neutral', string> = {
  success: 'bg-success/10 text-success',
  info: 'bg-info/10 text-info',
  warning: 'bg-warning/10 text-warning',
  neutral: 'bg-bg text-muted'
};
