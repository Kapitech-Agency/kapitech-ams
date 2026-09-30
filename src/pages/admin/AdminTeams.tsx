import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  Edit3,
  ExternalLink,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Star,
  Timer,
  Trash2,
  TrendingUp,
  Users,
  UsersRound,
  WalletCards,
  X
} from 'lucide-react';
import { AdminFilterBar, AdminMetricStrip, AdminModuleHeader, AdminPanel } from '../../components/admin/AdminModulePrimitives';
import { ProfileIdentity } from '../../components/admin/ProfileIdentity';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { Modal } from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import { api } from '../../lib/apiClient';
import { hasAdminPermission } from '../../lib/adminAuth';
import { AgencyVendor, VendorStatus, VendorType } from '../../lib/vendorStore';
import { formatAmount } from '../../lib/currency';

type TeamView = 'team-directory' | 'vendor-directory' | 'capacity-allocation' | 'skill-matrix' | 'time-logs';

type TeamMember = {
  id: string;
  name: string;
  username: string;
  role: string;
  division: string;
  status?: string;
};

type ProjectRecord = {
  id: string;
  name: string;
  status?: string;
};

type TimeLog = {
  id: string;
  projectId?: string;
  projectName?: string;
  taskTitle?: string;
  user?: string;
  userId?: string;
  durationMinutes: number;
  billable?: boolean;
  date: string;
  notes?: string;
};

const teamTabs: Array<{ key: TeamView; label: string; query: string }> = [
  { key: 'team-directory', label: 'Team Directory', query: '' },
  { key: 'vendor-directory', label: 'Vendor Directory', query: '?view=vendor-directory' },
  { key: 'capacity-allocation', label: 'Capacity & Allocation', query: '?view=capacity-allocation' },
  { key: 'skill-matrix', label: 'Skill Matrix', query: '?view=skill-matrix' },
  { key: 'time-logs', label: 'Time Logs', query: '?view=time-logs' }
];

const vendorTypeLabel: Record<VendorType, string> = {
  freelancer: 'Freelancer',
  contractor: 'Contractor',
  agency_partner: 'Agency Partner',
  saas_vendor: 'SaaS Vendor'
};

const vendorStatusLabel: Record<VendorStatus, string> = {
  active: 'Active',
  under_review: 'Review',
  inactive: 'Inactive',
  blacklisted: 'Blacklisted'
};

const vendorStatusTone: Record<VendorStatus, string> = {
  active: 'bg-success/10 text-success border-success/20',
  under_review: 'bg-warning/10 text-warning border-warning/20',
  inactive: 'bg-bg text-muted border-line',
  blacklisted: 'bg-danger/10 text-danger border-danger/20'
};

const dateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return year + '-' + month + '-' + day;
};

const startOfWeek = (value: Date) => {
  const date = new Date(value);
  const day = date.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const formatDate = (value: string) => {
  if (!value) return 'Not set';
  const parsed = new Date(value + 'T00:00:00');
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatHours = (minutes: number) => {
  const safe = Math.max(0, Number(minutes) || 0);
  const hours = Math.floor(safe / 60);
  const mins = safe % 60;
  return hours ? hours + 'h ' + mins + 'm' : mins + 'm';
};

const downloadCsv = (filename: string, rows: Array<Array<string | number | undefined>>) => {
  const csv = rows
    .map((row) => row.map((value) => '"' + String(value ?? '').replace(/"/g, '""') + '"').join(','))
    .join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const roleFocus = (member: TeamMember) => {
  const role = (member.role || '').toLowerCase();
  const division = (member.division || '').toLowerCase();
  if (/frontend|web|react|ui/.test(role)) return 'Frontend & UI Engineering';
  if (/backend|software|developer|engineer/.test(role)) return 'Engineering & API';
  if (/project manager|delivery|producer/.test(role)) return 'Project Delivery & Planning';
  if (/finance|financial|accounting/.test(role) || division.includes('finance')) return 'Finance & Controls';
  if (/marketing|account|sales|growth|communication/.test(role)) return 'Client Growth & Communication';
  if (/design|creative|ux/.test(role)) return 'Design & Creative';
  if (/it|system|devops|security/.test(role)) return 'Infrastructure & Security';
  if (/operations|hr|people/.test(role) || division.includes('operations')) return 'Operations';
  return member.division || member.role || 'General Operations';
};

const emptyVendorForm = {
  name: '',
  companyName: '',
  email: '',
  phone: '',
  type: 'freelancer' as VendorType,
  primaryCategory: 'Frontend Dev' as AgencyVendor['primaryCategory'],
  skills: '',
  hourlyRate: 450000,
  rating: 5,
  location: 'Jakarta, Indonesia',
  status: 'active' as VendorStatus,
  isVetted: true,
  notes: ''
};

export const AdminTeams: React.FC = () => {
  const location = useLocation();
  const activeView = (new URLSearchParams(location.search).get('view') || 'team-directory') as TeamView;
  const currentView = teamTabs.some((tab) => tab.key === activeView) ? activeView : 'team-directory';

  const canManageVendors = hasAdminPermission('canManageVendors');
  const canManageTimeLogs = hasAdminPermission('canManageProjects') || hasAdminPermission('canManageKanbanTasks');
  const canDeleteAllTimeLogs = hasAdminPermission('canManageProjects');
  const canManageAdminAccounts = hasAdminPermission('canManageAdminAccounts');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [vendors, setVendors] = useState<AgencyVendor[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);

  const [teamSearch, setTeamSearch] = useState('');
  const [teamDivision, setTeamDivision] = useState('all');
  const [teamStatus, setTeamStatus] = useState('all');

  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorCategory, setVendorCategory] = useState('all');
  const [vendorType, setVendorType] = useState('all');
  const [vendorStatus, setVendorStatus] = useState('all');
  const [vendorVetted, setVendorVetted] = useState('all');

  const [timeSearch, setTimeSearch] = useState('');
  const [timeProject, setTimeProject] = useState('all');
  const [timeBillable, setTimeBillable] = useState('all');

  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [vendorDetail, setVendorDetail] = useState<AgencyVendor | null>(null);
  const [vendorDeleteTarget, setVendorDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editingVendor, setEditingVendor] = useState<AgencyVendor | null>(null);
  const [vendorForm, setVendorForm] = useState(emptyVendorForm);
  const [savingVendor, setSavingVendor] = useState(false);

  const [timeFormOpen, setTimeFormOpen] = useState(false);
  const [savingTime, setSavingTime] = useState(false);
  const [timeProjectId, setTimeProjectId] = useState('');
  const [timeTask, setTimeTask] = useState('');
  const [timeMinutes, setTimeMinutes] = useState(60);
  const [timeDate, setTimeDate] = useState(dateKey(new Date()));
  const [timeIsBillable, setTimeIsBillable] = useState(true);
  const [timeNotes, setTimeNotes] = useState('');
  const [timeDeleteTarget, setTimeDeleteTarget] = useState<TimeLog | null>(null);

  const loadData = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setNotice(null);

    const [memberRes, vendorRes, projectRes, timeRes] = await Promise.all([
      api.auth.getTaskAssignees(),
      api.vendors.getAll(),
      api.projects.getAll(),
      api.timeLogs.getAll()
    ]);

    if (memberRes.success && Array.isArray(memberRes.data?.assignees)) {
      setMembers(memberRes.data!.assignees as TeamMember[]);
    } else if (!memberRes.success) {
      setNotice({ tone: 'danger', message: memberRes.error || 'Team directory could not be loaded.' });
    }

    if (vendorRes.success && Array.isArray(vendorRes.data?.vendors)) {
      setVendors(vendorRes.data!.vendors as AgencyVendor[]);
    }

    if (projectRes.success && Array.isArray(projectRes.data?.projects)) {
      setProjects(projectRes.data!.projects as ProjectRecord[]);
    }

    if (timeRes.success && Array.isArray(timeRes.data?.timeLogs)) {
      setLogs(timeRes.data!.timeLogs as TimeLog[]);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const teamDivisions = useMemo(
    () => ['all', ...Array.from(new Set(members.map((member) => member.division).filter(Boolean))).sort()],
    [members]
  );

  const teamRows = useMemo(() => {
    const query = teamSearch.trim().toLowerCase();
    return members.filter((member) => {
      const haystack = [member.name, member.username, member.role, member.division].join(' ').toLowerCase();
      const matchesSearch = !query || haystack.includes(query);
      const matchesDivision = teamDivision === 'all' || member.division === teamDivision;
      const matchesStatus = teamStatus === 'all' || String(member.status || 'active') === teamStatus;
      return matchesSearch && matchesDivision && matchesStatus;
    });
  }, [members, teamSearch, teamDivision, teamStatus]);

  const teamTrackedMinutes = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach((log) => {
      if (!log.userId) return;
      map.set(log.userId, (map.get(log.userId) || 0) + Number(log.durationMinutes || 0));
    });
    return map;
  }, [logs]);

  const teamProjectCoverage = useMemo(() => {
    const map = new Map<string, Set<string>>();
    logs.forEach((log) => {
      if (!log.userId) return;
      const key = log.projectId || log.projectName || 'general';
      if (!map.has(log.userId)) map.set(log.userId, new Set());
      map.get(log.userId)!.add(key);
    });
    return map;
  }, [logs]);

  const teamMetrics = useMemo(() => ({
    headcount: members.length,
    active: members.filter((member) => String(member.status || 'active') === 'active').length,
    divisions: new Set(members.map((member) => member.division).filter(Boolean)).size,
    contributors: new Set(logs.map((log) => log.userId || log.user || '').filter(Boolean)).size
  }), [members, logs]);

  const vendorRows = useMemo(() => {
    const query = vendorSearch.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const haystack = [vendor.name, vendor.companyName || '', vendor.email, vendor.primaryCategory, ...vendor.skills].join(' ').toLowerCase();
      return (!query || haystack.includes(query))
        && (vendorCategory === 'all' || vendor.primaryCategory === vendorCategory)
        && (vendorType === 'all' || vendor.type === vendorType)
        && (vendorStatus === 'all' || vendor.status === vendorStatus)
        && (vendorVetted === 'all' || (vendorVetted === 'vetted' ? Boolean(vendor.isVetted ?? true) : !Boolean(vendor.isVetted ?? true)));
    });
  }, [vendors, vendorSearch, vendorCategory, vendorType, vendorStatus, vendorVetted]);

  const vendorMetrics = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.status === 'active');
    return {
      total: vendors.length,
      active: active.length,
      vetted: vendors.filter((vendor) => vendor.isVetted ?? true).length,
      categories: new Set(vendors.map((vendor) => vendor.primaryCategory)).size,
      rating: vendors.length ? vendors.reduce((sum, vendor) => sum + Number(vendor.rating || 0), 0) / vendors.length : 0
    };
  }, [vendors]);

  const filteredLogs = useMemo(() => {
    const query = timeSearch.trim().toLowerCase();
    return [...logs]
      .filter((log) => {
        const haystack = [log.projectName || '', log.taskTitle || '', log.user || '', log.date, log.notes || ''].join(' ').toLowerCase();
        return (!query || haystack.includes(query))
          && (timeProject === 'all' || log.projectId === timeProject)
          && (timeBillable === 'all' || (timeBillable === 'billable' ? log.billable !== false : log.billable === false));
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [logs, timeSearch, timeProject, timeBillable]);

  const timeMetrics = useMemo(() => {
    const total = filteredLogs.reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
    const billable = filteredLogs.filter((log) => log.billable).reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
    return {
      total,
      billable,
      entries: filteredLogs.length,
      contributors: new Set(filteredLogs.map((log) => log.userId || log.user || '').filter(Boolean)).size
    };
  }, [filteredLogs]);

  const weeklyCapacity = useMemo(() => {
    const current = startOfWeek(new Date());
    return Array.from({ length: 4 }, (_, index) => {
      const start = new Date(current);
      start.setDate(start.getDate() - (3 - index) * 7);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return {
        start,
        end,
        label: index === 3 ? 'Current week' : 'Week ' + (index + 1)
      };
    });
  }, []);

  const capacityRows = useMemo(() => {
    return members.map((member) => {
      const weeks = weeklyCapacity.map((week) => {
        const minutes = logs
          .filter((log) => log.userId === member.id || (!log.userId && log.user === member.name))
          .filter((log) => {
            const date = new Date(log.date + 'T00:00:00');
            return date >= week.start && date < week.end;
          })
          .reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
        return { minutes, utilization: Math.min(160, Math.round((minutes / (40 * 60)) * 100)) };
      });
      return { member, weeks };
    });
  }, [members, logs, weeklyCapacity]);

  const currentWeekCapacity = weeklyCapacity.length ? weeklyCapacity[weeklyCapacity.length - 1] : null;
  const currentCapacityStats = useMemo(() => {
    const rows = capacityRows.map((row) => row.weeks[row.weeks.length - 1]?.utilization || 0);
    const totalMinutes = capacityRows.reduce((sum, row) => sum + (row.weeks[row.weeks.length - 1]?.minutes || 0), 0);
    return {
      average: rows.length ? rows.reduce((sum, value) => sum + value, 0) / rows.length : 0,
      highRisk: rows.filter((value) => value > 90).length,
      active: rows.filter((value) => value > 0).length,
      totalMinutes
    };
  }, [capacityRows]);

  const skillRows = useMemo(() => {
    const map = new Map<string, { skill: string; vendors: number; vetted: number; active: number }>();
    vendors.forEach((vendor) => {
      vendor.skills.forEach((skill) => {
        const current = map.get(skill) || { skill, vendors: 0, vetted: 0, active: 0 };
        current.vendors += 1;
        if (vendor.isVetted ?? true) current.vetted += 1;
        if (vendor.status === 'active') current.active += 1;
        map.set(skill, current);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.active - a.active || b.vetted - a.vetted || a.skill.localeCompare(b.skill));
  }, [vendors]);

  const openVendorForm = (vendor?: AgencyVendor) => {
    if (vendor) {
      setEditingVendor(vendor);
      setVendorForm({
        name: vendor.name,
        companyName: vendor.companyName || '',
        email: vendor.email,
        phone: vendor.phone,
        type: vendor.type,
        primaryCategory: vendor.primaryCategory,
        skills: vendor.skills.join(', '),
        hourlyRate: vendor.hourlyRate,
        rating: vendor.rating,
        location: vendor.location,
        status: vendor.status,
        isVetted: vendor.isVetted ?? true,
        notes: vendor.notes || ''
      });
    } else {
      setEditingVendor(null);
      setVendorForm(emptyVendorForm);
    }
    setVendorFormOpen(true);
  };

  const saveVendor = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageVendors || savingVendor) return;
    if (!vendorForm.name.trim() || !vendorForm.email.trim()) {
      setNotice({ tone: 'danger', message: 'Vendor name and email are required.' });
      return;
    }

    setSavingVendor(true);
    const payload: AgencyVendor = {
      id: editingVendor?.id || 'vendor-' + Date.now(),
      name: vendorForm.name.trim(),
      companyName: vendorForm.companyName.trim() || undefined,
      email: vendorForm.email.trim(),
      phone: vendorForm.phone.trim(),
      type: vendorForm.type,
      primaryCategory: vendorForm.primaryCategory,
      skills: vendorForm.skills.split(',').map((skill) => skill.trim()).filter(Boolean),
      hourlyRate: Number(vendorForm.hourlyRate) || 0,
      currency: editingVendor?.currency || 'IDR',
      rating: Math.max(0, Math.min(5, Number(vendorForm.rating) || 0)),
      completedProjectsCount: editingVendor?.completedProjectsCount || 0,
      status: vendorForm.status,
      isVetted: vendorForm.isVetted,
      location: vendorForm.location.trim(),
      portfolioUrl: editingVendor?.portfolioUrl,
      githubUrl: editingVendor?.githubUrl,
      contracts: editingVendor?.contracts || [],
      notes: vendorForm.notes.trim() || undefined,
      createdAt: editingVendor?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const response = editingVendor
      ? await api.vendors.update(payload.id, payload)
      : await api.vendors.create(payload);

    if (response.success && response.data?.vendor) {
      const saved = response.data.vendor as AgencyVendor;
      setVendors((current) => editingVendor
        ? current.map((item) => item.id === saved.id ? saved : item)
        : [saved, ...current]);
      setVendorFormOpen(false);
      setNotice({ tone: 'success', message: editingVendor ? 'Vendor profile updated.' : 'Vendor profile created.' });
    } else {
      setNotice({ tone: 'danger', message: response.error || 'Vendor could not be saved.' });
    }
    setSavingVendor(false);
  };

  const deleteVendor = async () => {
    if (!vendorDeleteTarget || !canManageVendors) return;
    const response = await api.vendors.delete(vendorDeleteTarget.id);
    if (response.success) {
      setVendors((current) => current.filter((vendor) => vendor.id !== vendorDeleteTarget.id));
      setVendorDetail((current) => current?.id === vendorDeleteTarget.id ? null : current);
      setNotice({ tone: 'success', message: 'Vendor removed.' });
    } else {
      setNotice({ tone: 'danger', message: response.error || 'Vendor could not be removed.' });
    }
    setVendorDeleteTarget(null);
  };

  const saveTimeLog = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageTimeLogs || savingTime) return;
    setSavingTime(true);
    const project = projects.find((item) => item.id === timeProjectId);
    const response = await api.timeLogs.create({
      projectId: timeProjectId,
      projectName: project?.name || 'General',
      taskTitle: timeTask.trim(),
      durationMinutes: Number(timeMinutes),
      billable: timeIsBillable,
      date: timeDate,
      notes: timeNotes.trim()
    });
    if (response.success && response.data?.timeLog) {
      setLogs((current) => [response.data!.timeLog as TimeLog, ...current]);
      setTimeFormOpen(false);
      setTimeTask('');
      setTimeNotes('');
      setNotice({ tone: 'success', message: 'Time entry saved.' });
    } else {
      setNotice({ tone: 'danger', message: response.error || 'Time entry could not be saved.' });
    }
    setSavingTime(false);
  };

  const deleteTimeLog = async () => {
    if (!timeDeleteTarget || !canManageTimeLogs) return;
    const sessionId = (() => {
      try {
        const raw = sessionStorage.getItem('kapitech_admin_profile_v2') || localStorage.getItem('kapitech_admin_profile_v2');
        return raw ? JSON.parse(raw)?.id : undefined;
      } catch {
        return undefined;
      }
    })();

    if (!canDeleteAllTimeLogs && timeDeleteTarget.userId && sessionId && timeDeleteTarget.userId !== sessionId) {
      setNotice({ tone: 'danger', message: 'You can only remove your own time entries.' });
      setTimeDeleteTarget(null);
      return;
    }

    const response = await api.timeLogs.delete(timeDeleteTarget.id);
    if (response.success) {
      setLogs((current) => current.filter((log) => log.id !== timeDeleteTarget.id));
      setNotice({ tone: 'success', message: 'Time entry removed.' });
    } else {
      setNotice({ tone: 'danger', message: response.error || 'Time entry could not be removed.' });
    }
    setTimeDeleteTarget(null);
  };

  const exportCurrentView = () => {
    if (currentView === 'team-directory') {
      downloadCsv('kapitech-team-directory.csv', [
        ['Member', 'Username', 'Role', 'Division', 'Status', 'Tracked'],
        ...teamRows.map((member) => [member.name, member.username, member.role, member.division, member.status || 'active', formatHours(teamTrackedMinutes.get(member.id) || 0)])
      ]);
    } else if (currentView === 'vendor-directory') {
      downloadCsv('kapitech-vendor-directory.csv', [
        ['Vendor', 'Company', 'Type', 'Category', 'Rate', 'Rating', 'Status', 'Vetted'],
        ...vendorRows.map((vendor) => [vendor.name, vendor.companyName || '', vendorTypeLabel[vendor.type], vendor.primaryCategory, vendor.hourlyRate, vendor.rating, vendorStatusLabel[vendor.status], vendor.isVetted ?? true ? 'Yes' : 'No'])
      ]);
    } else if (currentView === 'capacity-allocation') {
      downloadCsv('kapitech-capacity-allocation.csv', [
        ['Member', 'Role', ...weeklyCapacity.map((week) => week.label + ' utilization'), 'Current tracked hours'],
        ...capacityRows.map((row) => [row.member.name, row.member.role, ...row.weeks.map((week) => week.utilization + '%'), formatHours(row.weeks[row.weeks.length - 1]?.minutes || 0)])
      ]);
    } else if (currentView === 'skill-matrix') {
      downloadCsv('kapitech-skill-matrix.csv', [
        ['Skill', 'Vendor coverage', 'Vetted', 'Active'],
        ...skillRows.map((row) => [row.skill, row.vendors, row.vetted, row.active])
      ]);
    } else {
      downloadCsv('kapitech-time-logs.csv', [
        ['Date', 'Project', 'Task', 'User', 'Duration', 'Billable', 'Notes'],
        ...filteredLogs.map((log) => [log.date, log.projectName || 'General', log.taskTitle || '', log.user || '', formatHours(log.durationMinutes), log.billable ? 'Yes' : 'No', log.notes || ''])
      ]);
    }
    setNotice({ tone: 'success', message: 'CSV exported.' });
  };

  const pageCopy: Record<TeamView, { title: string; description: string }> = {
    'team-directory': {
      title: 'Team Directory',
      description: 'Manage the internal delivery team, roles, divisions, and current activity coverage.'
    },
    'vendor-directory': {
      title: 'Vendor Directory',
      description: 'Manage freelancers, contractors, agency partners, and external specialists used across projects.'
    },
    'capacity-allocation': {
      title: 'Capacity & Allocation',
      description: 'Review actual tracked workload against a 40-hour weekly planning baseline across the latest four weeks.'
    },
    'skill-matrix': {
      title: 'Skill Matrix',
      description: 'Review role-aligned internal capability focus and verified vendor skill coverage.'
    },
    'time-logs': {
      title: 'Time Logs',
      description: 'Record, review, filter, and reconcile project time entries from the same Team workspace.'
    }
  };

  return (
    <div className="min-h-full pb-10">
      <div className="min-[900px]:hidden -mx-1 mb-4 overflow-x-auto px-1 custom-scrollbar">
        <nav aria-label="Team sections" className="inline-flex min-w-max items-center gap-1 rounded-control border border-line bg-panel p-1">
          {teamTabs.map((tab) => (
            <Link
              key={tab.key}
              to={'/admin/team' + tab.query}
              aria-current={currentView === tab.key ? 'page' : undefined}
              className={'inline-flex min-h-8 shrink-0 items-center rounded-chip border px-3 text-[11px] font-medium transition-colors ' + (
                currentView === tab.key
                  ? 'border-accent/25 bg-accent/10 font-semibold text-fg'
                  : 'border-transparent text-muted hover:bg-bg hover:text-fg'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      <AdminModuleHeader
        title={pageCopy[currentView].title}
        description={pageCopy[currentView].description}
        actions={
          <>
            {currentView === 'vendor-directory' && canManageVendors && (
              <Button type="button" variant="primary" icon={<Plus size={15} />} onClick={() => openVendorForm()}>
                Add Vendor
              </Button>
            )}
            {currentView === 'time-logs' && canManageTimeLogs && (
              <Button type="button" variant="primary" icon={<Plus size={15} />} onClick={() => setTimeFormOpen(true)}>
                Add Time Entry
              </Button>
            )}
            {currentView === 'team-directory' && canManageAdminAccounts && (
              <Link to="/admin/settings?tab=rbac" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-line bg-panel px-3 text-xs font-semibold text-fg hover:bg-bg">
                <Plus size={15} />
                Manage Accounts
              </Link>
            )}
            <Button type="button" variant="secondary" icon={<Download size={14} />} onClick={exportCurrentView}>
              Export
            </Button>
            <Button type="button" variant="secondary" icon={<RefreshCw size={14} />} loading={refreshing} onClick={() => void loadData(true)}>
              Refresh
            </Button>
          </>
        }
      />

      <div className="mb-5 hidden min-[900px]:block">
        <nav aria-label="Team sections" className="flex min-w-0 items-center gap-5 overflow-x-auto border-b border-line">
          {teamTabs.map((tab) => (
            <Link
              key={tab.key}
              to={'/admin/team' + tab.query}
              aria-current={currentView === tab.key ? 'page' : undefined}
              className={'inline-flex min-h-10 shrink-0 items-center border-b-2 px-1 text-xs font-medium transition-colors ' + (
                currentView === tab.key
                  ? 'border-accent text-fg'
                  : 'border-transparent text-muted hover:border-line hover:text-fg'
              )}
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </div>

      {notice && (
        <div className="mb-5 flex items-start gap-3 rounded-card border border-line bg-panel px-4 py-3 text-xs" role="status">
          <span className={notice.tone === 'success' ? 'mt-0.5 text-success' : 'mt-0.5 text-danger'}>
            {notice.tone === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          </span>
          <span className="min-w-0 flex-1 text-fg">{notice.message}</span>
          <button type="button" onClick={() => setNotice(null)} className="rounded-control p-1 text-muted hover:bg-bg hover:text-fg" aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-5" aria-label="Loading Team module">
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => <div key={item} className="h-[104px] animate-pulse rounded-card border border-line bg-panel" />)}
          </div>
          <div className="h-80 animate-pulse rounded-card border border-line bg-panel" />
        </div>
      ) : currentView === 'team-directory' ? (
        <div className="space-y-5">
          <AdminMetricStrip
            metrics={[
              { id: 'headcount', label: 'Headcount', value: teamMetrics.headcount, context: teamMetrics.active + ' active', sparkline: [teamMetrics.headcount, teamMetrics.active, teamMetrics.contributors], icon: <UsersRound size={15} /> },
              { id: 'active', label: 'Active members', value: teamMetrics.active, context: 'Server directory', sparkline: [teamMetrics.active, teamMetrics.headcount], icon: <CheckCircle2 size={15} className="text-success" />, toneClassName: 'text-success' },
              { id: 'divisions', label: 'Divisions', value: teamMetrics.divisions, context: 'Across active team', sparkline: [teamMetrics.divisions, teamMetrics.headcount], icon: <Building2 size={15} /> },
              { id: 'contributors', label: 'Recent contributors', value: teamMetrics.contributors, context: 'Based on time logs', sparkline: [teamMetrics.contributors, teamMetrics.active], icon: <Activity size={15} /> }
            ]}
          />

          <AdminFilterBar searchValue={teamSearch} onSearchChange={setTeamSearch} searchPlaceholder="Search member, role, division..." searchLabel="Search team">
            <CustomSelect
              value={teamDivision}
              onChange={setTeamDivision}
              options={teamDivisions.map((division) => ({ value: division, label: division === 'all' ? 'All divisions' : division }))}
              triggerClassName="h-9 min-h-9 w-full sm:w-[180px]"
            />
            <CustomSelect
              value={teamStatus}
              onChange={setTeamStatus}
              options={[
                { value: 'all', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' }
              ]}
              triggerClassName="h-9 min-h-9 w-full sm:w-[150px]"
            />
          </AdminFilterBar>

          <AdminPanel
            title={'Team directory'}
            description={teamRows.length + ' members visible'}
          >
            <div className="overflow-x-auto custom-scrollbar">
              {teamRows.length === 0 ? (
                <div className="min-h-[180px] px-5 py-10 text-center">
                  <UsersRound size={22} className="mx-auto text-muted" />
                  <p className="mt-3 text-sm font-medium text-fg">No team members found</p>
                  <p className="mt-1 text-xs text-muted">Adjust the search or directory filters.</p>
                </div>
              ) : (
                <table className="ams-finance-table min-w-[980px] table-fixed border-separate border-spacing-0 text-xs">
                  <thead><tr>
                    <th className="w-[24%]">Member</th>
                    <th className="w-[21%]">Role</th>
                    <th className="w-[16%]">Division</th>
                    <th className="w-[12%]">Status</th>
                    <th className="w-[13%] text-right">Tracked</th>
                    <th className="w-[10%] text-right">Projects</th>
                    <th className="w-[56px] text-right">Action</th>
                  </tr></thead>
                  <tbody>
                    {teamRows.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <ProfileIdentity profile={{ id: member.id, name: member.name, username: member.username }} showRole={false} />
                        </td>
                        <td>
                          <p className="font-medium text-fg">{member.role || 'Not assigned'}</p>
                          <p className="mt-1 text-[10px] text-muted">{roleFocus(member)}</p>
                        </td>
                        <td className="text-muted">{member.division || 'Operations'}</td>
                        <td>
                          <span className="inline-flex rounded-badge border border-success/20 bg-success/10 px-2 py-1 text-[10px] font-semibold text-success">
                            {member.status || 'active'}
                          </span>
                        </td>
                        <td className="text-right font-semibold tabular-nums text-fg">{formatHours(teamTrackedMinutes.get(member.id) || 0)}</td>
                        <td className="text-right font-semibold tabular-nums text-fg">{teamProjectCoverage.get(member.id)?.size || 0}</td>
                        <td>
                          <div className="flex justify-end">
                            <Link to="/admin/settings?tab=rbac" className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg" title="Manage account" aria-label="Manage account">
                              <ExternalLink size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </AdminPanel>
        </div>
      ) : currentView === 'vendor-directory' ? (
        <div className="space-y-5">
          <AdminMetricStrip
            metrics={[
              { id: 'total', label: 'Total vendors', value: vendorMetrics.total, context: vendorMetrics.active + ' active', sparkline: [vendorMetrics.total, vendorMetrics.active, vendorMetrics.vetted], icon: <Users size={15} /> },
              { id: 'vetted', label: 'Vetted', value: vendorMetrics.vetted, context: 'Verified network', sparkline: [vendorMetrics.vetted, vendorMetrics.active], icon: <ShieldCheck size={15} className="text-success" />, toneClassName: 'text-success' },
              { id: 'categories', label: 'Capabilities', value: vendorMetrics.categories, context: 'Primary categories', sparkline: [vendorMetrics.categories, vendorMetrics.total], icon: <BarChart3 size={15} /> },
              { id: 'rating', label: 'Average rating', value: vendorMetrics.rating ? vendorMetrics.rating.toFixed(1) : '—', context: 'Vendor directory', sparkline: vendors.slice(0, 8).map((vendor) => vendor.rating), icon: <Star size={15} className="text-warning" />, toneClassName: 'text-warning' }
            ]}
          />

          <AdminFilterBar searchValue={vendorSearch} onSearchChange={setVendorSearch} searchPlaceholder="Search vendor, company, skill..." searchLabel="Search vendors">
            <CustomSelect
              value={vendorCategory}
              onChange={setVendorCategory}
              options={[{ value: 'all', label: 'All capabilities' }, ...Array.from(new Set(vendors.map((vendor) => vendor.primaryCategory))).map((value) => ({ value, label: value }))]}
              triggerClassName="h-9 min-h-9 w-full sm:w-[180px]"
            />
            <CustomSelect
              value={vendorType}
              onChange={setVendorType}
              options={[{ value: 'all', label: 'All types' }, ...Object.keys(vendorTypeLabel).map((value) => ({ value, label: vendorTypeLabel[value as VendorType] }))]}
              triggerClassName="h-9 min-h-9 w-full sm:w-[150px]"
            />
            <CustomSelect
              value={vendorStatus}
              onChange={setVendorStatus}
              options={[{ value: 'all', label: 'All statuses' }, ...Object.keys(vendorStatusLabel).map((value) => ({ value, label: vendorStatusLabel[value as VendorStatus] }))]}
              triggerClassName="h-9 min-h-9 w-full sm:w-[150px]"
            />
            <CustomSelect
              value={vendorVetted}
              onChange={setVendorVetted}
              options={[{ value: 'all', label: 'All verification' }, { value: 'vetted', label: 'Vetted only' }, { value: 'unvetted', label: 'Unvetted' }]}
              triggerClassName="h-9 min-h-9 w-full sm:w-[160px]"
            />
          </AdminFilterBar>

          <AdminPanel title="Vendor directory" description={vendorRows.length + ' vendors visible'}>
            <div className="overflow-x-auto custom-scrollbar">
              {vendorRows.length === 0 ? (
                <div className="min-h-[180px] px-5 py-10 text-center">
                  <Users size={22} className="mx-auto text-muted" />
                  <p className="mt-3 text-sm font-medium text-fg">No vendors found</p>
                  <p className="mt-1 text-xs text-muted">Adjust the search or filters.</p>
                </div>
              ) : (
                <table className="ams-finance-table min-w-[1120px] table-fixed border-separate border-spacing-0 text-xs">
                  <thead><tr>
                    <th className="w-[22%]">Vendor</th>
                    <th className="w-[16%]">Capability</th>
                    <th className="w-[14%]">Type</th>
                    <th className="w-[14%] text-right">Rate</th>
                    <th className="w-[10%] text-right">Rating</th>
                    <th className="w-[12%]">Status</th>
                    <th className="w-[48px] text-right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {vendorRows.map((vendor) => (
                      <tr key={vendor.id}>
                        <td>
                          <button type="button" onClick={() => setVendorDetail(vendor)} className="text-left">
                            <p className="font-medium text-fg hover:text-accent-text">{vendor.companyName || vendor.name}</p>
                            <p className="mt-1 text-[10px] text-muted">{vendor.name} · {vendor.location}</p>
                          </button>
                        </td>
                        <td>
                          <p className="font-medium text-fg">{vendor.primaryCategory}</p>
                          <p className="mt-1 max-w-[220px] truncate text-[10px] text-muted">{vendor.skills.slice(0, 3).join(' · ')}</p>
                        </td>
                        <td className="text-muted">{vendorTypeLabel[vendor.type]}</td>
                        <td className="text-right font-semibold tabular-nums text-fg">{formatAmount(vendor.hourlyRate, vendor.currency)}/hr</td>
                        <td className="text-right">
                          <span className="inline-flex items-center justify-end gap-1 font-semibold tabular-nums text-warning">
                            {vendor.rating.toFixed(1)} <Star size={13} className="fill-warning" />
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={'inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + vendorStatusTone[vendor.status]}>{vendorStatusLabel[vendor.status]}</span>
                            {(vendor.isVetted ?? true) && <span className="inline-flex rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent-text">Vetted</span>}
                          </div>
                        </td>
                        <td>
                          <div className="relative flex justify-end gap-1">
                            <button type="button" onClick={() => setVendorDetail(vendor)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg" title="View vendor" aria-label="View vendor"><MoreHorizontal size={14} /></button>
                            {canManageVendors && <button type="button" onClick={() => openVendorForm(vendor)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg" title="Edit vendor" aria-label="Edit vendor"><Edit3 size={14} /></button>}
                            {canManageVendors && <button type="button" onClick={() => setVendorDeleteTarget({ id: vendor.id, name: vendor.name })} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-danger/10 hover:text-danger" title="Delete vendor" aria-label="Delete vendor"><Trash2 size={14} /></button>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </AdminPanel>
        </div>
      ) : currentView === 'capacity-allocation' ? (
        <div className="space-y-5">
          <AdminMetricStrip
            metrics={[
              { id: 'utilization', label: 'Current utilization', value: currentCapacityStats.average.toFixed(1) + '%', context: 'Tracked vs 40h baseline', sparkline: capacityRows.slice(0, 8).map((row) => row.weeks[row.weeks.length - 1]?.utilization || 0), icon: <TrendingUp size={15} /> },
              { id: 'risk', label: 'High workload risk', value: currentCapacityStats.highRisk, context: '>90% tracked load', sparkline: capacityRows.map((row) => row.weeks[row.weeks.length - 1]?.utilization || 0), icon: <AlertCircle size={15} className="text-danger" />, toneClassName: 'text-danger' },
              { id: 'allocated', label: 'Tracked this week', value: formatHours(currentCapacityStats.totalMinutes), context: currentCapacityStats.active + ' active contributors', sparkline: weeklyCapacity.map((week) => logs.filter((log) => { const date = new Date(log.date + 'T00:00:00'); return date >= week.start && date < week.end; }).reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0)), icon: <Timer size={15} /> },
              { id: 'baseline', label: 'Planning baseline', value: '40h', context: 'Per active member / week', sparkline: [40, 40, 40, 40], icon: <CalendarDays size={15} /> }
            ]}
          />

          <AdminPanel
            title="Capacity & allocation"
            description={currentWeekCapacity ? 'Actual tracked allocation across ' + weeklyCapacity.map((week) => formatDate(dateKey(week.start))).join(' · ') : 'Four-week tracked capacity view.'}
            actions={<span className="text-[10px] text-muted">No forecast values are fabricated; cells are based on recorded time.</span>}
          >
            <div className="overflow-x-auto custom-scrollbar">
              <table className="ams-finance-table min-w-[1180px] table-fixed border-separate border-spacing-0 text-xs">
                <thead><tr>
                  <th className="w-[24%]">Resource & role</th>
                  {weeklyCapacity.map((week) => <th key={week.label} className="w-[19%] text-center">{week.label}</th>)}
                </tr></thead>
                <tbody>
                  {capacityRows.map((row) => (
                    <tr key={row.member.id}>
                      <td>
                        <p className="font-medium text-fg">{row.member.name}</p>
                        <p className="mt-1 text-[10px] text-muted">{row.member.role} · {row.member.division}</p>
                      </td>
                      {row.weeks.map((week, index) => (
                        <td key={index} className="text-center">
                          <div className={'rounded-control border px-3 py-2 ' + (week.utilization > 90 ? 'border-danger/30 bg-danger/5' : week.utilization >= 70 ? 'border-line bg-bg' : 'border-line bg-bg')}>
                            <div className="flex items-center justify-between gap-3 text-xs">
                              <span className={'font-semibold tabular-nums ' + (week.utilization > 90 ? 'text-danger' : week.utilization >= 70 ? 'text-fg' : 'text-muted')}>{week.utilization}%</span>
                              <span className="text-[10px] tabular-nums text-muted">{formatHours(week.minutes)}</span>
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel">
                              <div className={'h-full rounded-full ' + (week.utilization > 90 ? 'bg-danger' : week.utilization >= 70 ? 'bg-series-3' : 'bg-series-4')} style={{ width: Math.min(100, week.utilization) + '%' }} />
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        </div>
      ) : currentView === 'skill-matrix' ? (
        <div className="space-y-5">
          <AdminMetricStrip
            metrics={[
              { id: 'internal', label: 'Internal members', value: members.length, context: 'Role-aligned capability focus', sparkline: [members.length, teamMetrics.active, teamMetrics.divisions], icon: <UsersRound size={15} /> },
              { id: 'vendorSkills', label: 'Vendor skills', value: skillRows.length, context: 'Distinct external skills', sparkline: [skillRows.length, vendorMetrics.vetted, vendorMetrics.active], icon: <BarChart3 size={15} /> },
              { id: 'vettedCoverage', label: 'Vetted coverage', value: skillRows.length ? Math.round((skillRows.filter((row) => row.vetted > 0).length / skillRows.length) * 100) + '%' : '0%', context: 'Skills with vetted coverage', sparkline: [skillRows.filter((row) => row.vetted > 0).length, skillRows.length], icon: <ShieldCheck size={15} className="text-success" />, toneClassName: 'text-success' },
              { id: 'activeCoverage', label: 'Active skill coverage', value: skillRows.length ? Math.round((skillRows.filter((row) => row.active > 0).length / skillRows.length) * 100) + '%' : '0%', context: 'Skills with active vendors', sparkline: [skillRows.filter((row) => row.active > 0).length, skillRows.length], icon: <CheckCircle2 size={15} className="text-success" />, toneClassName: 'text-success' }
            ]}
          />

          <AdminPanel title="Internal role matrix" description="Role-aligned focus derived from the server-provided role and division. It is not a self-reported proficiency score.">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="ams-finance-table min-w-[900px] table-fixed border-separate border-spacing-0 text-xs">
                <thead><tr>
                  <th className="w-[26%]">Member</th>
                  <th className="w-[23%]">Role</th>
                  <th className="w-[18%]">Division</th>
                  <th className="w-[33%]">Primary capability focus</th>
                </tr></thead>
                <tbody>
                  {members.map((member) => (
                    <tr key={member.id}>
                      <td><ProfileIdentity profile={{ id: member.id, name: member.name, username: member.username }} showRole={false} /></td>
                      <td className="text-fg">{member.role || 'Not assigned'}</td>
                      <td className="text-muted">{member.division || 'Operations'}</td>
                      <td>
                        <span className="inline-flex rounded-badge border border-line bg-bg px-2.5 py-1 text-[10px] font-medium text-fg">{roleFocus(member)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>

          <AdminPanel title="Vendor skill coverage" description={skillRows.length + ' distinct skills reported by the vendor directory.'}>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="ams-finance-table min-w-[800px] table-fixed border-separate border-spacing-0 text-xs">
                <thead><tr>
                  <th className="w-[44%]">Skill</th>
                  <th className="w-[18%] text-right">Vendors</th>
                  <th className="w-[18%] text-right">Vetted</th>
                  <th className="w-[20%] text-right">Active</th>
                </tr></thead>
                <tbody>
                  {skillRows.map((row) => (
                    <tr key={row.skill}>
                      <td className="font-medium text-fg">{row.skill}</td>
                      <td className="text-right font-semibold tabular-nums">{row.vendors}</td>
                      <td className="text-right font-semibold tabular-nums text-success">{row.vetted}</td>
                      <td className="text-right font-semibold tabular-nums">{row.active}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </AdminPanel>
        </div>
      ) : (
        <div className="space-y-5">
          <AdminMetricStrip
            metrics={[
              { id: 'tracked', label: 'Tracked time', value: formatHours(timeMetrics.total), context: 'Current filters', sparkline: [timeMetrics.total, timeMetrics.billable], icon: <Timer size={15} />, toneClassName: 'text-accent-text' },
              { id: 'billable', label: 'Billable time', value: formatHours(timeMetrics.billable), context: 'Billable entries', sparkline: [timeMetrics.billable, timeMetrics.total], icon: <WalletCards size={15} /> },
              { id: 'entries', label: 'Entries', value: timeMetrics.entries, context: timeMetrics.contributors + ' contributors', sparkline: [timeMetrics.entries, timeMetrics.contributors], icon: <CalendarDays size={15} /> },
              { id: 'contributors', label: 'Contributors', value: timeMetrics.contributors, context: 'Users in filtered log', sparkline: [timeMetrics.contributors, members.length], icon: <UsersRound size={15} /> }
            ]}
          />

          <AdminFilterBar searchValue={timeSearch} onSearchChange={setTimeSearch} searchPlaceholder="Search project, task, user..." searchLabel="Search time logs">
            <CustomSelect
              value={timeProject}
              onChange={setTimeProject}
              options={[{ value: 'all', label: 'All projects' }, ...projects.map((project) => ({ value: project.id, label: project.name }))]}
              triggerClassName="h-9 min-h-9 w-full sm:w-[190px]"
            />
            <CustomSelect
              value={timeBillable}
              onChange={setTimeBillable}
              options={[{ value: 'all', label: 'All time types' }, { value: 'billable', label: 'Billable' }, { value: 'non-billable', label: 'Non-billable' }]}
              triggerClassName="h-9 min-h-9 w-full sm:w-[160px]"
            />
          </AdminFilterBar>

          {timeFormOpen && canManageTimeLogs && (
            <AdminPanel title="New time entry" description="Record actual delivery time against a project and task.">
              <form onSubmit={saveTimeLog} className="space-y-4 p-4">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <label className="space-y-1.5">
                    <span className="text-[11px] text-muted">Project</span>
                    <CustomSelect value={timeProjectId} onChange={setTimeProjectId} options={[{ value: '', label: 'General' }, ...projects.map((project) => ({ value: project.id, label: project.name }))]} />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] text-muted">Task</span>
                    <input value={timeTask} onChange={(event) => setTimeTask(event.target.value)} placeholder="Task or activity" className="ams-control w-full" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] text-muted">Duration (minutes)</span>
                    <input type="number" min={1} max={1440} value={timeMinutes} onChange={(event) => setTimeMinutes(Number(event.target.value))} className="ams-control w-full" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[11px] text-muted">Date</span>
                    <input type="date" value={timeDate} onChange={(event) => setTimeDate(event.target.value)} className="ams-control w-full" />
                  </label>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <label className="space-y-1.5">
                    <span className="text-[11px] text-muted">Notes</span>
                    <input value={timeNotes} onChange={(event) => setTimeNotes(event.target.value)} placeholder="Optional context" className="ams-control w-full" />
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex h-10 items-center gap-2 rounded-control border border-line bg-bg px-3 text-xs">
                      <input type="checkbox" checked={timeIsBillable} onChange={(event) => setTimeIsBillable(event.target.checked)} className="accent-accent" />
                      Billable
                    </label>
                    <Button type="submit" variant="primary" loading={savingTime}>Save Entry</Button>
                  </div>
                </div>
              </form>
            </AdminPanel>
          )}

          <AdminPanel title="Time log ledger" description={filteredLogs.length + ' entries visible'}>
            <div className="overflow-x-auto custom-scrollbar">
              {filteredLogs.length === 0 ? (
                <div className="min-h-[180px] px-5 py-10 text-center">
                  <Timer size={22} className="mx-auto text-muted" />
                  <p className="mt-3 text-sm font-medium text-fg">No time logs found</p>
                  <p className="mt-1 text-xs text-muted">Adjust the filters or add a time entry.</p>
                </div>
              ) : (
                <table className="ams-finance-table min-w-[1040px] table-fixed border-separate border-spacing-0 text-xs">
                  <thead><tr>
                    <th className="w-[12%]">Date</th>
                    <th className="w-[25%]">Project & task</th>
                    <th className="w-[18%]">User</th>
                    <th className="w-[12%] text-right">Duration</th>
                    <th className="w-[12%]">Type</th>
                    <th className="w-[17%]">Notes</th>
                    <th className="w-[48px] text-right">Action</th>
                  </tr></thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="tabular-nums text-muted">{formatDate(log.date)}</td>
                        <td>
                          <p className="font-medium text-fg">{log.projectName || 'General'}</p>
                          <p className="mt-1 truncate text-[10px] text-muted">{log.taskTitle || 'General activity'}</p>
                        </td>
                        <td>{log.user ? <ProfileIdentity profile={{ id: log.userId, name: log.user, contextLabel: 'Time entry' }} showRole={false} /> : <span className="text-xs text-muted">—</span>}</td>
                        <td className="text-right font-semibold tabular-nums">{formatHours(log.durationMinutes)}</td>
                        <td><span className="inline-flex rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-medium text-muted">{log.billable ? 'Billable' : 'Non-billable'}</span></td>
                        <td className="max-w-[260px] truncate text-xs text-muted">{log.notes || '—'}</td>
                        <td>
                          {canManageTimeLogs && (
                            <div className="flex justify-end">
                              <button type="button" onClick={() => setTimeDeleteTarget(log)} className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger" title="Delete time entry" aria-label="Delete time entry">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </AdminPanel>
        </div>
      )}

      <Modal
        open={vendorFormOpen}
        onClose={() => setVendorFormOpen(false)}
        title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}
        description="Maintain the vendor directory using the existing AMS vendor record."
        size="xl"
      >
        <form onSubmit={saveVendor} className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Name</span><input value={vendorForm.name} onChange={(event) => setVendorForm((current) => ({ ...current, name: event.target.value }))} className="ams-control w-full" required /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Company</span><input value={vendorForm.companyName} onChange={(event) => setVendorForm((current) => ({ ...current, companyName: event.target.value }))} className="ams-control w-full" /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Email</span><input type="email" value={vendorForm.email} onChange={(event) => setVendorForm((current) => ({ ...current, email: event.target.value }))} className="ams-control w-full" required /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Phone</span><input value={vendorForm.phone} onChange={(event) => setVendorForm((current) => ({ ...current, phone: event.target.value }))} className="ams-control w-full" /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Type</span><CustomSelect value={vendorForm.type} onChange={(value) => setVendorForm((current) => ({ ...current, type: value as VendorType }))} options={Object.keys(vendorTypeLabel).map((value) => ({ value, label: vendorTypeLabel[value as VendorType] }))} /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Primary capability</span><CustomSelect value={vendorForm.primaryCategory} onChange={(value) => setVendorForm((current) => ({ ...current, primaryCategory: value as AgencyVendor['primaryCategory'] }))} options={['Frontend Dev', 'Backend Dev', 'UI/UX Design', 'DevOps & Cloud', 'SEO & Copy', '3D & Motion', 'Legal & Accounting'].map((value) => ({ value, label: value }))} /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Hourly rate</span><input type="number" min={0} value={vendorForm.hourlyRate} onChange={(event) => setVendorForm((current) => ({ ...current, hourlyRate: Number(event.target.value) }))} className="ams-control w-full" /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Rating</span><input type="number" min={0} max={5} step={0.1} value={vendorForm.rating} onChange={(event) => setVendorForm((current) => ({ ...current, rating: Number(event.target.value) }))} className="ams-control w-full" /></label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-[11px] text-muted">Skills</span><input value={vendorForm.skills} onChange={(event) => setVendorForm((current) => ({ ...current, skills: event.target.value }))} placeholder="React, TypeScript, Tailwind CSS" className="ams-control w-full" /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Location</span><input value={vendorForm.location} onChange={(event) => setVendorForm((current) => ({ ...current, location: event.target.value }))} className="ams-control w-full" /></label>
            <label className="space-y-1.5"><span className="text-[11px] text-muted">Status</span><CustomSelect value={vendorForm.status} onChange={(value) => setVendorForm((current) => ({ ...current, status: value as VendorStatus }))} options={Object.keys(vendorStatusLabel).map((value) => ({ value, label: vendorStatusLabel[value as VendorStatus] }))} /></label>
            <label className="inline-flex h-10 items-center gap-2 rounded-control border border-line bg-bg px-3 text-xs sm:col-span-2"><input type="checkbox" checked={vendorForm.isVetted} onChange={(event) => setVendorForm((current) => ({ ...current, isVetted: event.target.checked }))} className="accent-accent" /> Vetted</label>
            <label className="space-y-1.5 sm:col-span-2"><span className="text-[11px] text-muted">Notes</span><textarea value={vendorForm.notes} onChange={(event) => setVendorForm((current) => ({ ...current, notes: event.target.value }))} rows={3} className="ams-control w-full" /></label>
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <Button type="button" variant="secondary" onClick={() => setVendorFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" loading={savingVendor}>{editingVendor ? 'Save changes' : 'Create vendor'}</Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(vendorDetail)}
        onClose={() => setVendorDetail(null)}
        title={vendorDetail?.companyName || vendorDetail?.name || 'Vendor'}
        description={vendorDetail?.primaryCategory}
        size="lg"
      >
        {vendorDetail && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Contact</p><p className="mt-1 text-sm font-medium text-fg">{vendorDetail.name}</p><p className="mt-1 text-xs text-muted">{vendorDetail.email}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Commercial</p><p className="mt-1 text-sm font-medium tabular-nums text-fg">{formatAmount(vendorDetail.hourlyRate, vendorDetail.currency)}/hr</p><p className="mt-1 text-xs text-warning">{vendorDetail.rating.toFixed(1)} rating</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Location</p><p className="mt-1 text-sm text-fg">{vendorDetail.location || 'Not set'}</p></div>
              <div className="rounded-control border border-line bg-bg p-3"><p className="text-[10px] text-muted">Status</p><div className="mt-1 flex flex-wrap gap-1.5"><span className={'inline-flex rounded-badge border px-2 py-1 text-[10px] font-semibold ' + vendorStatusTone[vendorDetail.status]}>{vendorStatusLabel[vendorDetail.status]}</span>{(vendorDetail.isVetted ?? true) && <span className="inline-flex rounded-badge border border-accent/20 bg-accent/10 px-2 py-1 text-[10px] font-semibold text-accent-text">Vetted</span>}</div></div>
            </div>
            <div className="rounded-control border border-line bg-bg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Skills</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{vendorDetail.skills.map((skill) => <span key={skill} className="rounded-chip border border-line bg-panel px-2.5 py-1 text-[10px] text-muted">{skill}</span>)}</div>
            </div>
            {vendorDetail.contracts.length > 0 && (
              <div className="overflow-x-auto">
                <table className="ams-finance-table min-w-[640px] border-separate border-spacing-0 text-xs">
                  <thead><tr><th>Contract</th><th>Period</th><th>Rate</th><th>Status</th></tr></thead>
                  <tbody>{vendorDetail.contracts.map((contract) => <tr key={contract.id}><td className="font-medium text-fg">{contract.title}</td><td className="tabular-nums text-muted">{formatDate(contract.startDate)}{contract.endDate ? ' · ' + formatDate(contract.endDate) : ''}</td><td className="tabular-nums text-fg">{formatAmount(contract.rateAmount, contract.currency)}</td><td><span className="rounded-badge border border-line bg-bg px-2 py-1 text-[10px] text-muted">{contract.status}</span></td></tr>)}</tbody>
                </table>
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
              {vendorDetail.portfolioUrl && <a href={vendorDetail.portfolioUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs text-muted hover:bg-bg hover:text-fg"><ExternalLink size={14} />Portfolio</a>}
              {vendorDetail.githubUrl && <a href={vendorDetail.githubUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-2 rounded-control border border-line bg-panel px-3 text-xs text-muted hover:bg-bg hover:text-fg"><ExternalLink size={14} />GitHub</a>}
              {canManageVendors && <Button type="button" variant="primary" icon={<Edit3 size={14} />} onClick={() => { const vendor = vendorDetail; setVendorDetail(null); openVendorForm(vendor); }}>Edit vendor</Button>}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(vendorDeleteTarget)}
        onClose={() => setVendorDeleteTarget(null)}
        title="Delete vendor"
        description={vendorDeleteTarget ? 'Remove ' + vendorDeleteTarget.name + ' from the vendor directory.' : 'Remove this vendor from the directory.'}
        confirmLabel="Delete"
        onConfirm={() => void deleteVendor()}
      />

      <ConfirmDialog
        open={Boolean(timeDeleteTarget)}
        onClose={() => setTimeDeleteTarget(null)}
        title="Delete time entry"
        description={timeDeleteTarget ? (timeDeleteTarget.projectName || 'General') + ' · ' + (timeDeleteTarget.taskTitle || 'General activity') + ' · ' + formatHours(timeDeleteTarget.durationMinutes) : 'Remove this time entry.'}
        confirmLabel="Delete"
        onConfirm={() => void deleteTimeLog()}
      />
    </div>
  );
};
