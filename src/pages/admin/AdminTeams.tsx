import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit3,
  ExternalLink,
  Grid2X2,
  Handshake,
  LayoutGrid,
  MoreHorizontal,
  Plus,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Table2,
  Timer,
  Trash2,
  TrendingUp,
  UserPlus,
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
  slug: string;
};

type VendorRecord = AgencyVendor & {
  slug: string;
};

type SkillRecord = {
  skill: string;
  slug: string;
  vendors: number;
  vetted: number;
  active: number;
};

type ProjectTaskRecord = {
  id?: string;
  title?: string;
  status?: string;
  assignedTo?: string;
  assignee?: string;
  dueDate?: string;
};

type ProjectRecord = {
  id: string;
  name: string;
  status?: string;
  slug: string;
  teamLead?: string;
  teamMembers?: string[];
  tasks?: ProjectTaskRecord[];
  techStack?: string[];
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
  slug: string;
};



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

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'item';

const memberSlug = (member: Pick<TeamMember, 'id' | 'name'>) =>
  'team-' + slugify(member.name || member.id) + '-' + slugify(member.id);

const vendorSlug = (vendor: Pick<AgencyVendor, 'id' | 'name' | 'companyName'>) =>
  'vendor-' + slugify(vendor.name || vendor.companyName || vendor.id) + '-' + slugify(vendor.id);

const projectSlug = (project: Pick<ProjectRecord, 'id' | 'name'>) =>
  'project-' + slugify(project.name || project.id) + '-' + slugify(project.id);

const timeLogSlug = (log: Pick<TimeLog, 'id' | 'taskTitle' | 'projectName'>) =>
  'time-' + slugify(log.taskTitle || log.projectName || log.id) + '-' + slugify(log.id);

const skillSlug = (skill: string) => 'skill-' + slugify(skill);

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
  const validTeamViews: TeamView[] = ['team-directory', 'vendor-directory', 'capacity-allocation', 'skill-matrix', 'time-logs'];
  const currentView = validTeamViews.includes(activeView) ? activeView : 'team-directory';

  const canManageVendors = hasAdminPermission('canManageVendors');
  const canManageTimeLogs = hasAdminPermission('canManageProjects') || hasAdminPermission('canManageKanbanTasks');
  const canDeleteAllTimeLogs = hasAdminPermission('canManageProjects');
  const canManageAdminAccounts = hasAdminPermission('canManageAdminAccounts');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [vendors, setVendors] = useState<VendorRecord[]>([]);
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'danger'; message: string } | null>(null);

  const [teamHeaderSearch, setTeamHeaderSearch] = useState('');
  const [teamSearch, setTeamSearch] = useState('');
  const [teamDepartment, setTeamDepartment] = useState('all');
  const [teamPod, setTeamPod] = useState('all');
  const [teamStatus, setTeamStatus] = useState('all');
  const [teamDisplay, setTeamDisplay] = useState<'table' | 'grid'>('table');
  const [teamPage, setTeamPage] = useState(1);
  const [memberDetail, setMemberDetail] = useState<TeamMember | null>(null);
  const [allocationTarget, setAllocationTarget] = useState<TeamMember | null>(null);

  const [vendorHeaderSearch, setVendorHeaderSearch] = useState('');
  const [vendorHeaderCategory, setVendorHeaderCategory] = useState('all');
  const [vendorSearch, setVendorSearch] = useState('');
  const [vendorCategory, setVendorCategory] = useState('all');
  const [vendorTier, setVendorTier] = useState('all');
  const [vendorAgreementStatus, setVendorAgreementStatus] = useState('active-verified');
  const [vendorPage, setVendorPage] = useState(1);

  const [timeSearch, setTimeSearch] = useState('');
  const [timeProject, setTimeProject] = useState('all');
  const [timeBillable, setTimeBillable] = useState('all');

  const [vendorFormOpen, setVendorFormOpen] = useState(false);
  const [vendorDetail, setVendorDetail] = useState<VendorRecord | null>(null);
  const [vendorDeleteTarget, setVendorDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editingVendor, setEditingVendor] = useState<VendorRecord | null>(null);
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
      setMembers(
        (memberRes.data!.assignees as Omit<TeamMember, 'slug'>[]).map((member) => ({
          ...member,
          slug: memberSlug(member),
        }))
      );
    } else if (!memberRes.success) {
      setNotice({ tone: 'danger', message: memberRes.error || 'Team directory could not be loaded.' });
    }

    if (vendorRes.success && Array.isArray(vendorRes.data?.vendors)) {
      setVendors(
        (vendorRes.data!.vendors as AgencyVendor[]).map((vendor) => ({
          ...vendor,
          slug: vendorSlug(vendor),
        }))
      );
    }

    if (projectRes.success && Array.isArray(projectRes.data?.projects)) {
      setProjects(
        (projectRes.data!.projects as Omit<ProjectRecord, 'slug'>[]).map((project) => ({
          ...project,
          slug: projectSlug(project),
          teamLead: String(project.teamLead || ''),
          teamMembers: Array.isArray(project.teamMembers) ? project.teamMembers.map(String) : [],
          tasks: Array.isArray(project.tasks) ? project.tasks as ProjectTaskRecord[] : [],
          techStack: Array.isArray(project.techStack) ? project.techStack.map(String) : [],
        }))
      );
    }

    if (timeRes.success && Array.isArray(timeRes.data?.timeLogs)) {
      setLogs(
        (timeRes.data!.timeLogs as Omit<TimeLog, 'slug'>[]).map((log) => ({
          ...log,
          slug: timeLogSlug(log),
        }))
      );
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  useEffect(() => { setTeamPage(1); }, [teamHeaderSearch, teamSearch, teamDepartment, teamPod, teamStatus, teamDisplay]);
  useEffect(() => { setVendorPage(1); }, [vendorHeaderSearch, vendorHeaderCategory, vendorSearch, vendorCategory, vendorTier, vendorAgreementStatus]);

  const teamDivisions = useMemo(
    () => ['all', ...Array.from(new Set(members.map((member) => member.division).filter(Boolean))).sort()],
    [members]
  );

  const teamPods = useMemo(
    () => ['all', ...Array.from(new Set(projects.map((project) => project.name).filter(Boolean))).sort()],
    [projects]
  );

  const memberAllocation = (member: TeamMember) => {
    const start = startOfWeek(new Date());
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const minutes = logs
      .filter((log) => log.userId === member.id || (!log.userId && log.user === member.name))
      .filter((log) => {
        const date = new Date(log.date + 'T00:00:00');
        return date >= start && date < end;
      })
      .reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
    const percent = Math.min(160, Math.round((minutes / (40 * 60)) * 100));
    const status = String(member.status || '').toLowerCase();
    if (status.includes('leave')) return { label: 'On Leave', tone: 'warning', percent };
    if (percent > 0) return { label: 'Allocated', tone: 'success', percent };
    return { label: 'Available / Bench', tone: 'warning', percent: 0 };
  };

  const memberProjects = (member: TeamMember) => projects.filter((project) => {
    if (project.status === 'completed') return false;
    const values = [
      project.teamLead || '',
      ...(project.teamMembers || [])
    ].map((value) => String(value).toLowerCase());
    const targets = [member.id, member.name, member.username, member.role].map((value) => String(value || '').toLowerCase());
    return values.some((value) => targets.some((target) => target && value.includes(target)));
  });

  const memberCoreSkills = (member: TeamMember) => {
    const projectSkills = memberProjects(member).flatMap((project) => project.techStack || []);
    return Array.from(new Set([roleFocus(member), ...projectSkills].filter(Boolean))).slice(0, 3);
  };

  const teamRows = useMemo(() => {
    const headerQuery = teamHeaderSearch.trim().toLowerCase();
    const toolbarQuery = teamSearch.trim().toLowerCase();
    return members.filter((member) => {
      const searchable = [member.name, member.username, member.role, member.division, member.id].join(' ').toLowerCase();
      const matchesHeaderSearch = !headerQuery || searchable.includes(headerQuery);
      const matchesToolbarSearch = !toolbarQuery || searchable.includes(toolbarQuery);
      const projectsForMember = memberProjects(member);
      const allocation = memberAllocation(member);
      const matchesDepartment = teamDepartment === 'all' || member.division === teamDepartment;
      const matchesPod = teamPod === 'all' || projectsForMember.some((project) => project.name === teamPod);
      const matchesStatus =
        teamStatus === 'all' ||
        (teamStatus === 'allocated' && allocation.label === 'Allocated') ||
        (teamStatus === 'bench' && allocation.label === 'Available / Bench') ||
        (teamStatus === 'leave' && allocation.label === 'On Leave');
      return matchesHeaderSearch && matchesToolbarSearch && matchesDepartment && matchesPod && matchesStatus;
    });
  }, [members, projects, logs, teamHeaderSearch, teamSearch, teamDepartment, teamPod, teamStatus]);

  const teamPageSize = 6;
  const teamPageCount = Math.max(1, Math.ceil(teamRows.length / teamPageSize));
  const pagedTeamRows = teamRows.slice((teamPage - 1) * teamPageSize, teamPage * teamPageSize);


  const teamTrackedMinutes = useMemo(() => {
    const map = new Map<string, number>();
    logs.forEach((log) => {
      if (!log.userId) return;
      map.set(log.userId, (map.get(log.userId) || 0) + Number(log.durationMinutes || 0));
    });
    return map;
  }, [logs]);

  const activeProjectMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    projects.forEach((project) => {
      if (project.status === 'completed') return;
      const ids = new Set([
        ...(project.teamLead ? [project.teamLead] : []),
        ...(project.teamMembers || []),
      ].filter(Boolean));
      ids.forEach((memberId) => {
        if (!map.has(memberId)) map.set(memberId, new Set());
        map.get(memberId)!.add(project.id);
      });
    });
    return map;
  }, [projects]);

  const taskStatusMap = useMemo(() => {
    const map = new Map<string, { total: number; done: number; inProgress: number; todo: number }>();
    projects.forEach((project) => {
      (project.tasks || []).forEach((task) => {
        const memberId = String(task.assignedTo || task.assignee || '');
        if (!memberId) return;
        const current = map.get(memberId) || { total: 0, done: 0, inProgress: 0, todo: 0 };
        current.total += 1;
        if (task.status === 'done' || task.status === 'completed') current.done += 1;
        else if (task.status === 'in_progress' || task.status === 'review') current.inProgress += 1;
        else current.todo += 1;
        map.set(memberId, current);
      });
    });
    return map;
  }, [projects]);

  const currentMemberWorkload = useMemo(() => {
    const currentWeek = startOfWeek(new Date());
    const nextWeek = new Date(currentWeek);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const map = new Map<string, number>();
    members.forEach((member) => {
      const minutes = logs
        .filter((log) => log.userId === member.id || (!log.userId && log.user === member.name))
        .filter((log) => {
          const date = new Date(log.date + 'T00:00:00');
          return date >= currentWeek && date < nextWeek;
        })
        .reduce((sum, log) => sum + Number(log.durationMinutes || 0), 0);
      map.set(member.id, Math.min(160, Math.round((minutes / (40 * 60)) * 100)));
    });
    return map;
  }, [members, logs]);

  const teamMetrics = useMemo(() => ({
    headcount: members.length,
    active: members.filter((member) => String(member.status || 'active') === 'active').length,
    divisions: new Set(members.map((member) => member.division).filter(Boolean)).size,
    contributors: new Set(logs.map((log) => log.userId || log.user || '').filter(Boolean)).size
  }), [members, logs]);

  const vendorTierOf = (vendor: AgencyVendor) => {
    if (vendor.type === 'agency_partner') return 'strategic';
    if (vendor.type === 'contractor') return 'specialized';
    return 'adhoc';
  };

  const vendorAgreementState = (vendor: AgencyVendor) => {
    const contracts = vendor.contracts || [];
    const now = new Date();
    const renewal = contracts.some((contract) => {
      if (!contract.endDate || contract.status !== 'active') return false;
      const end = new Date(contract.endDate + 'T23:59:59');
      const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      return days >= 0 && days <= 30;
    });
    if (renewal) return 'renewal';
    if (vendor.status === 'under_review') return 'review';
    if (vendor.status === 'inactive' || vendor.status === 'blacklisted') return 'archived';
    if ((vendor.contracts || []).some((contract) => contract.status === 'active') || (vendor.isVetted ?? true)) return 'active-verified';
    return 'pending';
  };

  const vendorCurrentContract = (vendor: AgencyVendor) =>
    vendor.contracts?.find((contract) => contract.status === 'active') ||
    vendor.contracts?.[0] ||
    null;

  const vendorRenewalCount = useMemo(() => {
    const now = new Date();
    return vendors.reduce((count, vendor) => count + (vendor.contracts || []).filter((contract) => {
      if (!contract.endDate || contract.status !== 'active') return false;
      const end = new Date(contract.endDate + 'T23:59:59');
      const days = Math.ceil((end.getTime() - now.getTime()) / 86400000);
      return days >= 0 && days <= 30;
    }).length, 0);
  }, [vendors]);

  const vendorMonthlyBurn = useMemo(() => {
    const totals: Record<string, number> = {};
    vendors.forEach((vendor) => {
      (vendor.contracts || []).forEach((contract) => {
        if (contract.status !== 'active' || contract.rateType !== 'monthly_retainer') return;
        totals[contract.currency] = (totals[contract.currency] || 0) + Number(contract.rateAmount || 0);
      });
    });
    return totals;
  }, [vendors]);


  const vendorMetrics = useMemo(() => ({
    total: vendors.length,
    active: vendors.filter((vendor) => vendor.status === 'active').length,
    vetted: vendors.filter((vendor) => vendor.isVetted ?? true).length,
    categories: new Set(vendors.map((vendor) => vendor.primaryCategory)).size,
    rating: vendors.length
      ? vendors.reduce((sum, vendor) => sum + Number(vendor.rating || 0), 0) / vendors.length
      : 0
  }), [vendors]);

  const vendorTierCounts = useMemo(() => ({
    strategic: vendors.filter((vendor) => vendorTierOf(vendor) === 'strategic').length,
    specialized: vendors.filter((vendor) => vendorTierOf(vendor) === 'specialized').length,
    adhoc: vendors.filter((vendor) => vendorTierOf(vendor) === 'adhoc').length
  }), [vendors]);

  const vendorRows = useMemo(() => {
    const headerQuery = vendorHeaderSearch.trim().toLowerCase();
    const toolbarQuery = vendorSearch.trim().toLowerCase();
    return vendors.filter((vendor) => {
      const searchable = [vendor.name, vendor.companyName || '', vendor.email, vendor.primaryCategory, ...vendor.skills, vendor.id].join(' ').toLowerCase();
      const matchesHeaderSearch = !headerQuery || searchable.includes(headerQuery);
      const matchesToolbarSearch = !toolbarQuery || searchable.includes(toolbarQuery);
      return matchesHeaderSearch &&
        matchesToolbarSearch &&
        (vendorHeaderCategory === 'all' || vendor.primaryCategory === vendorHeaderCategory) &&
        (vendorCategory === 'all' || vendor.primaryCategory === vendorCategory) &&
        (vendorTier === 'all' || vendorTierOf(vendor) === vendorTier) &&
        (vendorAgreementStatus === 'all' || vendorAgreementState(vendor) === vendorAgreementStatus);
    }).sort((a, b) => Number(b.hourlyRate || 0) - Number(a.hourlyRate || 0));
  }, [vendors, vendorHeaderSearch, vendorSearch, vendorHeaderCategory, vendorCategory, vendorTier, vendorAgreementStatus]);

  const vendorPageSize = 6;
  const vendorPageCount = Math.max(1, Math.ceil(vendorRows.length / vendorPageSize));
  const pagedVendorRows = vendorRows.slice((vendorPage - 1) * vendorPageSize, vendorPage * vendorPageSize);

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
    const map = new Map<string, SkillRecord>();
    vendors.forEach((vendor) => {
      vendor.skills.forEach((skill) => {
        const current = map.get(skill) || { skill, slug: skillSlug(skill), vendors: 0, vetted: 0, active: 0 };
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
      const savedWithSlug: VendorRecord = { ...saved, slug: vendorSlug(saved) };
      setVendors((current) => editingVendor
        ? current.map((item) => item.id === savedWithSlug.id ? savedWithSlug : item)
        : [savedWithSlug, ...current]);
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
      const saved = response.data!.timeLog as Omit<TimeLog, 'slug'>;
      setLogs((current) => [{ ...saved, slug: timeLogSlug(saved) }, ...current]);
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
        ['Slug', 'Member', 'Username', 'Role', 'Division', 'Status', 'Tracked'],
        ...teamRows.map((member) => [member.slug, member.name, member.username, member.role, member.division, member.status || 'active', formatHours(teamTrackedMinutes.get(member.id) || 0)])
      ]);
    } else if (currentView === 'vendor-directory') {
      downloadCsv('kapitech-vendor-directory.csv', [
        ['Slug', 'Vendor', 'Company', 'Type', 'Category', 'Rate', 'Rating', 'Status', 'Vetted'],
        ...vendorRows.map((vendor) => [vendor.slug, vendor.name, vendor.companyName || '', vendorTypeLabel[vendor.type], vendor.primaryCategory, vendor.hourlyRate, vendor.rating, vendorStatusLabel[vendor.status], vendor.isVetted ?? true ? 'Yes' : 'No'])
      ]);
    } else if (currentView === 'capacity-allocation') {
      downloadCsv('kapitech-capacity-allocation.csv', [
        ['Slug', 'Member', 'Role', ...weeklyCapacity.map((week) => week.label + ' utilization'), 'Current tracked hours'],
        ...capacityRows.map((row) => [row.member.slug, row.member.name, row.member.role, ...row.weeks.map((week) => week.utilization + '%'), formatHours(row.weeks[row.weeks.length - 1]?.minutes || 0)])
      ]);
    } else if (currentView === 'skill-matrix') {
      downloadCsv('kapitech-skill-matrix.csv', [
        ['Slug', 'Skill', 'Vendor coverage', 'Vetted', 'Active'],
        ...skillRows.map((row) => [row.slug, row.skill, row.vendors, row.vetted, row.active])
      ]);
    } else {
      downloadCsv('kapitech-time-logs.csv', [
        ['Slug', 'Date', 'Project', 'Task', 'User', 'Duration', 'Billable', 'Notes'],
        ...filteredLogs.map((log) => [log.slug, log.date, log.projectName || 'General', log.taskTitle || '', log.user || '', formatHours(log.durationMinutes), log.billable ? 'Yes' : 'No', log.notes || ''])
      ]);
    }
    setNotice({ tone: 'success', message: 'CSV exported.' });
  };

  const pageCopy: Record<TeamView, { title: string; description: string }> = {
    'team-directory': {
      title: 'Team Directory',
      description: 'Manage full-time agency staff, core engineering pods, design teams, and direct reports.'
    },
    'vendor-directory': {
      title: 'Vendor & Contractor Directory',
      description: 'External specialized agencies, freelance contractors, cloud vendors, and SLA compliance.'
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
      <AdminModuleHeader
        title={currentView === 'team-directory'
          ? <>Team Directory <span className="inline-flex items-center rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-medium text-muted">{members.length} Internal Members</span></>
          : pageCopy[currentView].title}
        description={pageCopy[currentView].description}
        actions={
          <>
            {currentView === 'vendor-directory' && (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <label className="relative w-full sm:w-[190px]">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={vendorHeaderSearch} onChange={(event) => setVendorHeaderSearch(event.target.value)} placeholder="Filter vendors..." aria-label="Filter vendors" className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg outline-none placeholder:text-muted focus:border-accent" />
                </label>
                <CustomSelect
                  value={vendorHeaderCategory}
                  onChange={setVendorHeaderCategory}
                  options={[{ value: 'all', label: 'All Categories' }, ...Array.from(new Set(vendors.map((vendor) => vendor.primaryCategory))).sort().map((value) => ({ value, label: value }))]}
                  triggerClassName="h-9 min-h-9 w-full sm:w-[165px]"
                />
                {canManageVendors && (
                  <Button type="button" variant="primary" icon={<Plus size={14} />} onClick={() => openVendorForm()}>
                    + Add Vendor / Contractor
                  </Button>
                )}
              </div>
            )}
            {currentView === 'time-logs' && canManageTimeLogs && (
              <Button type="button" variant="primary" icon={<Plus size={15} />} onClick={() => setTimeFormOpen(true)}>
                Add Time Entry
              </Button>
            )}
            {currentView === 'team-directory' && (
              <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                <label className="relative w-full sm:w-[190px]">
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={teamHeaderSearch} onChange={(event) => setTeamHeaderSearch(event.target.value)} placeholder="Search team..." aria-label="Search team" className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg outline-none placeholder:text-muted focus:border-accent" />
                </label>
                <CustomSelect
                  value={teamDepartment}
                  onChange={setTeamDepartment}
                  options={teamDivisions.map((value) => ({ value, label: value === 'all' ? 'All Departments' : value }))}
                  triggerClassName="h-9 min-h-9 w-full sm:w-[165px]"
                />
                {canManageAdminAccounts && (
                  <Link to="/admin/settings?tab=rbac" className="inline-flex h-9 items-center justify-center gap-2 rounded-control bg-accent px-3 text-xs font-semibold text-white hover:bg-accent/90">
                    <UserPlus size={14} /> Invite Member
                  </Link>
                )}
              </div>
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
        <div className="space-y-5" data-ams-feature-slug="team-directory">
          <AdminMetricStrip
            metrics={[
              {
                id: 'headcount',
                label: 'Total Headcount',
                value: teamMetrics.headcount,
                context: (teamRows.filter((member) => memberAllocation(member).label === 'Allocated').length) + ' Allocated · ' + (teamMetrics.headcount - teamRows.filter((member) => memberAllocation(member).label === 'Allocated').length) + ' Bench',
                sparkline: [teamMetrics.headcount, members.length, teamRows.length],
                icon: <UsersRound size={15} />
              },
              {
                id: 'engineering',
                label: 'Engineering & Tech',
                value: members.filter((member) => /engineer|developer|devops|qa|tech|architect|frontend|backend/i.test(member.role + ' ' + member.division)).length,
                context: 'Backend, Frontend, DevOps & QA',
                sparkline: [members.length, members.filter((member) => /engineer|developer|devops|qa|tech|architect|frontend|backend/i.test(member.role + ' ' + member.division)).length],
                icon: <BarChart3 size={15} />,
                toneClassName: 'text-info'
              },
              {
                id: 'design',
                label: 'Product & Design',
                value: members.filter((member) => /design|product|ux|creative|ui/i.test(member.role + ' ' + member.division)).length,
                context: 'UI/UX, Product Strategy & Systems',
                sparkline: [members.length, members.filter((member) => /design|product|ux|creative|ui/i.test(member.role + ' ' + member.division)).length],
                icon: <LayoutGrid size={15} />,
                toneClassName: 'text-info'
              },
              {
                id: 'operations',
                label: 'Operations & Delivery',
                value: members.filter((member) => /manager|operations|delivery|pm|project|marketing|account/i.test(member.role + ' ' + member.division)).length,
                context: 'Delivery, PMs, Operations & Client Work',
                sparkline: [members.length, members.filter((member) => /manager|operations|delivery|pm|project|marketing|account/i.test(member.role + ' ' + member.division)).length],
                icon: <Handshake size={15} />
              }
            ]}
          />

          <section className="rounded-card border border-line bg-panel p-4" data-ams-feature-slug="team-directory-filters">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <label className="relative min-w-0 flex-1 sm:max-w-sm">
                  <span className="sr-only">Search by name, role, email</span>
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={teamSearch} onChange={(event) => setTeamSearch(event.target.value)} placeholder="Search by name, role, email..." aria-label="Search by name, role, email" className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg outline-none placeholder:text-muted focus:border-accent" />
                </label>
                <CustomSelect value={teamPod} onChange={setTeamPod} options={[{ value: 'all', label: 'All Pods' }, ...teamPods.slice(1).map((value) => ({ value, label: 'Pod: ' + value }))]} triggerClassName="h-9 min-h-9 w-full sm:w-[205px]" />
                <CustomSelect
                  value={teamStatus}
                  onChange={setTeamStatus}
                  options={[
                    { value: 'all', label: 'Status: All' },
                    { value: 'allocated', label: 'Allocated' },
                    { value: 'bench', label: 'Available / Bench' },
                    { value: 'leave', label: 'On Leave' }
                  ]}
                  triggerClassName="h-9 min-h-9 w-full sm:w-[165px]"
                />
                <Button type="button" variant="ghost" icon={<RotateCcw size={14} />} onClick={() => { setTeamHeaderSearch(''); setTeamSearch(''); setTeamDepartment('all'); setTeamPod('all'); setTeamStatus('all'); }}>
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-muted">Display:</span>
                <div className="inline-flex items-center gap-0.5 rounded-control border border-line bg-bg p-0.5">
                  <button type="button" onClick={() => setTeamDisplay('table')} className={'inline-flex h-8 items-center gap-1.5 rounded-control px-2.5 text-[11px] font-medium ' + (teamDisplay === 'table' ? 'bg-panel text-fg' : 'text-muted hover:text-fg')} title="Table View">
                    <Table2 size={14} /> Table
                  </button>
                  <button type="button" onClick={() => setTeamDisplay('grid')} className={'inline-flex h-8 items-center gap-1.5 rounded-control px-2.5 text-[11px] font-medium ' + (teamDisplay === 'grid' ? 'bg-panel text-fg' : 'text-muted hover:text-fg')} title="Grid View">
                    <Grid2X2 size={14} /> Grid
                  </button>
                </div>
                <Button type="button" variant="secondary" icon={<Download size={14} />} onClick={exportCurrentView}>Export</Button>
              </div>
            </div>
          </section>

          {teamDisplay === 'table' ? (
            <AdminPanel title="Team Directory" description={teamRows.length + ' members'}>
              <div className="overflow-x-auto custom-scrollbar">
                {pagedTeamRows.length === 0 ? (
                  <div className="min-h-[180px] px-5 py-10 text-center">
                    <UsersRound size={22} className="mx-auto text-muted" />
                    <p className="mt-3 text-sm font-medium text-fg">No team members found</p>
                    <p className="mt-1 text-xs text-muted">Adjust your search, pod, or allocation filters.</p>
                  </div>
                ) : (
                  <table className="ams-finance-table min-w-[1240px] table-fixed border-separate border-spacing-0 text-xs">
                    <thead><tr>
                      <th className="w-[25%]">Team Member</th>
                      <th className="w-[18%]">Pod / Focus</th>
                      <th className="w-[11%]">Active Projects</th>
                      <th className="w-[14%]">Allocation Status</th>
                      <th className="w-[17%]">Core Skills</th>
                      <th className="w-[15%] text-right">Actions</th>
                    </tr></thead>
                    <tbody>
                      {pagedTeamRows.map((member) => {
                        const allocation = memberAllocation(member);
                        const projectsForMember = memberProjects(member);
                        const skills = memberCoreSkills(member);
                        return (
                          <tr key={member.id} data-ams-slug={member.slug}>
                            <td>
                              <button type="button" className="text-left" onClick={() => setMemberDetail(member)}>
                                <ProfileIdentity profile={{ id: member.id, name: member.name, username: member.username }} showRole={false} />
                                <span className="mt-1 block font-mono text-[9px] text-muted/70">slug: {member.slug}</span>
                              </button>
                            </td>
                            <td>
                              <p className="font-medium text-fg">{projectsForMember[0]?.name || member.division || 'Unassigned'}</p>
                              <p className="mt-1 text-[10px] text-muted">{roleFocus(member)}</p>
                            </td>
                            <td>
                              <p className="font-semibold tabular-nums text-fg">{projectsForMember.length}</p>
                              <p className="mt-1 text-[10px] text-muted">{projectsForMember.length === 1 ? 'Pod assigned' : 'Pods assigned'}</p>
                            </td>
                            <td>
                              <div className="w-36 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-0.5 text-[10px] font-medium ' + (allocation.tone === 'success' ? 'border-success/20 bg-success/10 text-success' : 'border-warning/20 bg-warning/10 text-warning')}>
                                    <span className={'h-1.5 w-1.5 rounded-full ' + (allocation.tone === 'success' ? 'bg-success' : 'bg-warning')} />
                                    {allocation.label}
                                  </span>
                                  <span className={'text-[10px] font-semibold tabular-nums ' + (allocation.tone === 'success' ? 'text-success' : 'text-warning')}>{allocation.percent}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-bg">
                                  <div className={'h-full rounded-full ' + (allocation.tone === 'success' ? 'bg-success' : 'bg-warning')} style={{ width: Math.min(100, allocation.percent) + '%' }} />
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="flex max-w-[260px] flex-wrap gap-1.5">
                                {skills.map((skill) => <span key={skill} className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-medium text-fg">{skill}</span>)}
                              </div>
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="secondary" className="h-8 px-2.5 text-[11px]" onClick={() => setMemberDetail(member)}>View Profile</Button>
                                <Button type="button" variant="primary" className="h-8 px-2.5 text-[11px]" onClick={() => setAllocationTarget(member)}>Allocate</Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </AdminPanel>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {pagedTeamRows.map((member) => {
                const allocation = memberAllocation(member);
                const projectsForMember = memberProjects(member);
                const skills = memberCoreSkills(member);
                return (
                  <article key={member.id} data-ams-slug={member.slug} className="rounded-card border border-line bg-panel p-4">
                    <div className="flex items-start justify-between gap-3">
                      <ProfileIdentity profile={{ id: member.id, name: member.name, username: member.username }} showRole={true} />
                      <span className="rounded-badge border border-line bg-bg px-2 py-0.5 font-mono text-[9px] text-muted">slug: {member.slug}</span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                      <div><p className="text-muted">Pod / Focus</p><p className="mt-1 font-medium text-fg">{projectsForMember[0]?.name || member.division || 'Unassigned'}</p></div>
                      <div><p className="text-muted">Active Projects</p><p className="mt-1 font-semibold tabular-nums text-fg">{projectsForMember.length}</p></div>
                    </div>
                    <div className="mt-4 rounded-control border border-line bg-bg p-3">
                      <div className="flex items-center justify-between gap-2"><span className="text-[10px] text-muted">Allocation Status</span><span className="text-[11px] font-semibold text-fg">{allocation.label} · {allocation.percent}%</span></div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel"><div className="h-full rounded-full bg-accent" style={{ width: Math.min(100, allocation.percent) + '%' }} /></div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {skills.map((skill) => <span key={skill} className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] text-fg">{skill}</span>)}
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <Button type="button" variant="secondary" className="h-8 px-2.5 text-[11px]" onClick={() => setMemberDetail(member)}>View Profile</Button>
                      <Button type="button" variant="primary" className="h-8 px-2.5 text-[11px]" onClick={() => setAllocationTarget(member)}>Allocate</Button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-line bg-panel px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
            <span className="text-muted">
              Showing <span className="font-semibold tabular-nums text-fg">{teamRows.length ? (teamPage - 1) * teamPageSize + 1 : 0}</span> to <span className="font-semibold tabular-nums text-fg">{Math.min(teamPage * teamPageSize, teamRows.length)}</span> of <span className="font-semibold tabular-nums text-fg">{teamRows.length}</span> members
            </span>
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={teamPage <= 1} onClick={() => setTeamPage((value) => Math.max(1, value - 1))} className="inline-flex h-8 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[11px] text-muted disabled:opacity-40"><ChevronLeft size={14} /> Previous</button>
              {Array.from({ length: Math.min(teamPageCount, 8) }, (_, index) => {
                const page = index + 1;
                return <button key={page} type="button" onClick={() => setTeamPage(page)} className={'h-8 w-8 rounded-control border px-0 text-[11px] font-semibold ' + (teamPage === page ? 'border-accent bg-accent text-white' : 'border-line bg-bg text-muted')}>{page}</button>;
              })}
              <button type="button" disabled={teamPage >= teamPageCount} onClick={() => setTeamPage((value) => Math.min(teamPageCount, value + 1))} className="inline-flex h-8 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[11px] text-muted disabled:opacity-40">Next <ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      ) : currentView === 'vendor-directory' ? (
        <div className="space-y-5" data-ams-feature-slug="vendor-directory">
          <AdminMetricStrip
            metrics={[
              {
                id: 'active-contractors',
                label: 'Active Contractors',
                value: vendors.filter((vendor) => vendor.status === 'active').length,
                context: vendorTierCounts.strategic + ' Dedicated · ' + (vendorTierCounts.specialized + vendorTierCounts.adhoc) + ' On-Demand',
                sparkline: [vendors.length, vendors.filter((vendor) => vendor.status === 'active').length, vendorRows.length],
                icon: <Handshake size={15} />
              },
              {
                id: 'external-burn',
                label: 'Monthly External Burn',
                value: Object.keys(vendorMonthlyBurn).length === 1
                  ? formatAmount(vendorMonthlyBurn[Object.keys(vendorMonthlyBurn)[0]], Object.keys(vendorMonthlyBurn)[0] as 'IDR' | 'USD')
                  : Object.keys(vendorMonthlyBurn).length > 1 ? 'Mixed' : '—',
                context: Object.entries(vendorMonthlyBurn).map(([currency, amount]) => formatAmount(Number(amount), currency as 'IDR' | 'USD')).join(' · ') || 'No active monthly retainers',
                sparkline: Object.values(vendorMonthlyBurn),
                icon: <TrendingUp size={15} />
              },
              {
                id: 'sla',
                label: 'Average SLA Compliance',
                value: '—',
                context: 'SLA data is not tracked in the current vendor model',
                sparkline: [0, 0],
                icon: <ShieldCheck size={15} />,
                toneClassName: 'text-muted'
              },
              {
                id: 'renewals',
                label: 'Contract Renewals Due',
                value: vendorRenewalCount,
                context: 'Action required within 30 days',
                sparkline: [vendorRenewalCount, vendors.length],
                icon: <CalendarDays size={15} className="text-warning" />,
                toneClassName: 'text-warning'
              }
            ]}
          />

          <section className="rounded-card border border-line bg-panel p-4" data-ams-feature-slug="vendor-directory-filters">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2 xl:flex-row xl:items-center">
                <label className="relative min-w-0 flex-1 xl:max-w-sm">
                  <span className="sr-only">Search vendor directory</span>
                  <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <input value={vendorSearch} onChange={(event) => setVendorSearch(event.target.value)} placeholder="Search by company or freelancer name..." aria-label="Search by company or freelancer name" className="h-9 w-full rounded-control border border-line bg-bg pl-9 pr-3 text-xs text-fg outline-none placeholder:text-muted focus:border-accent" />
                </label>
                <div className="hidden xl:flex items-center gap-1.5 rounded-control border border-line bg-bg p-0.5">
                  {[
                    { value: 'all', label: 'All Tiers' },
                    { value: 'strategic', label: 'Strategic' },
                    { value: 'specialized', label: 'Specialized' },
                    { value: 'adhoc', label: 'Ad-hoc' }
                  ].map((option) => (
                    <button key={option.value} type="button" onClick={() => setVendorTier(option.value)} className={'inline-flex h-8 items-center rounded-control px-2.5 text-[10px] font-medium ' + (vendorTier === option.value ? 'bg-panel text-fg border border-line' : 'text-muted hover:text-fg')}>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <CustomSelect
                  value={vendorCategory}
                  onChange={setVendorCategory}
                  options={[{ value: 'all', label: 'Service Category: All' }, ...Array.from(new Set(vendors.map((vendor) => vendor.primaryCategory))).sort().map((value) => ({ value, label: value }))]}
                  triggerClassName="h-9 min-h-9 w-full sm:w-[185px]"
                />
                <CustomSelect
                  value={vendorAgreementStatus}
                  onChange={setVendorAgreementStatus}
                  options={[
                    { value: 'active-verified', label: 'Status: Active & Verified' },
                    { value: 'renewal', label: 'Under Renewal Review' },
                    { value: 'pending', label: 'Pending Signature' },
                    { value: 'archived', label: 'Archived' },
                    { value: 'all', label: 'Status: All' }
                  ]}
                  triggerClassName="h-9 min-h-9 w-full sm:w-[185px]"
                />
                <Button type="button" variant="secondary" icon={<Download size={14} />} onClick={exportCurrentView}>Export</Button>
              </div>
            </div>
          </section>

          <AdminPanel title="Vendor & Contractor Directory" description={vendorRows.length + ' external vendors · sorted by rate high to low'}>
            <div className="overflow-x-auto custom-scrollbar">
              {pagedVendorRows.length === 0 ? (
                <div className="min-h-[180px] px-5 py-10 text-center">
                  <Users size={22} className="mx-auto text-muted" />
                  <p className="mt-3 text-sm font-medium text-fg">No vendors found</p>
                  <p className="mt-1 text-xs text-muted">Adjust search, tier, category, or agreement filters.</p>
                </div>
              ) : (
                <table className="ams-finance-table min-w-[1260px] table-fixed border-separate border-spacing-0 text-xs">
                  <thead><tr>
                    <th className="w-[26%]">Vendor & Specialty</th>
                    <th className="w-[13%]">Type</th>
                    <th className="w-[16%] text-right">Rate / Retainer</th>
                    <th className="w-[16%]">Current Projects</th>
                    <th className="w-[14%]">NDA & Contract</th>
                    <th className="w-[8%] text-center">SLA</th>
                    <th className="w-[17%] text-right">Actions</th>
                  </tr></thead>
                  <tbody>
                    {pagedVendorRows.map((vendor, index) => {
                      const agreement = vendorAgreementState(vendor);
                      const contract = vendorCurrentContract(vendor);
                      const tier = vendorTierOf(vendor);
                      const renewalAction = agreement === 'renewal' ? 'Renew' : agreement === 'review' ? 'Review' : 'Manage Contract';
                      const rateValue = contract ? formatAmount(contract.rateAmount, contract.currency) : formatAmount(vendor.hourlyRate, vendor.currency);
                      const rateSuffix = contract ? (contract.rateType === 'monthly_retainer' ? '/ mo' : contract.rateType === 'project' ? '/ project' : '/ hr') : '/ hr';
                      return (
                        <tr key={vendor.id} data-ams-slug={vendor.slug}>
                          <td>
                            <button type="button" className="flex items-center gap-3 text-left" onClick={() => setVendorDetail(vendor)}>
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted">
                                {tier === 'strategic' ? <Handshake size={18} /> : tier === 'specialized' ? <ShieldCheck size={18} /> : <Users size={18} />}
                              </span>
                              <span className="min-w-0">
                                <span className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-medium text-fg hover:text-accent-text">{vendor.companyName || vendor.name}</span>
                                  <span className="rounded-badge border border-line bg-bg px-1.5 py-0.5 font-mono text-[8px] font-semibold text-muted">{tier.toUpperCase()}</span>
                                </span>
                                <span className="mt-1 block text-[10px] text-muted">{vendor.primaryCategory}</span>
                                <span className="mt-1 block font-mono text-[9px] text-muted/70">slug: {vendor.slug}</span>
                              </span>
                            </button>
                          </td>
                          <td>
                            <span className="inline-flex rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-medium text-fg">{vendorTypeLabel[vendor.type]}</span>
                          </td>
                          <td className="text-right font-semibold tabular-nums whitespace-nowrap text-fg">{rateValue} <span className="text-[10px] font-normal text-muted">{rateSuffix}</span></td>
                          <td>
                            <div className="min-w-0">
                              <p className="truncate font-medium text-fg">{contract?.status === 'active' ? contract.title : 'No active project'}</p>
                              <p className="mt-1 text-[10px] text-muted">{vendor.completedProjectsCount || 0} completed assignments</p>
                            </div>
                          </td>
                          <td>
                            <span className={'inline-flex items-center gap-1.5 rounded-badge border px-2.5 py-0.5 text-[10px] font-semibold ' + (
                              agreement === 'active-verified' ? 'border-success/20 bg-success/10 text-success' :
                              agreement === 'renewal' ? 'border-warning/20 bg-warning/10 text-warning' :
                              agreement === 'review' ? 'border-warning/20 bg-warning/10 text-warning' :
                              agreement === 'archived' ? 'border-line bg-bg text-muted' :
                              'border-info/20 bg-info/10 text-info'
                            )}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              {agreement === 'active-verified' ? 'Signed & Valid' : agreement === 'renewal' ? 'Renewal Due' : agreement === 'review' ? 'Under Review' : agreement === 'archived' ? 'Archived' : 'Pending Signature'}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted" title="SLA is not tracked by the current vendor data model">—</span>
                          </td>
                          <td>
                            <div className="flex items-center justify-end gap-1.5">
                              {renewalAction !== 'Manage Contract' ? (
                                <Button type="button" variant="secondary" className="h-8 border-warning/30 bg-warning/10 px-2.5 text-[10px] text-warning" onClick={() => agreement === 'renewal' ? setVendorDetail(vendor) : openVendorForm(vendor)}>
                                  {renewalAction}
                                </Button>
                              ) : (
                                <Button type="button" variant="secondary" className="h-8 px-2.5 text-[10px]" onClick={() => setVendorDetail(vendor)}>Manage Contract</Button>
                              )}
                              <Link to="/admin/invoicing?finance=vendor-payments" className="inline-flex h-8 w-8 items-center justify-center rounded-control border border-line bg-panel text-muted hover:bg-bg hover:text-fg" title="View Invoices" aria-label="View Invoices">
                                <ReceiptText size={14} />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
            <div className="flex flex-col gap-3 border-t border-line bg-panel px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
              <div className="text-muted">
                Showing <span className="font-semibold tabular-nums text-fg">{vendorRows.length ? (vendorPage - 1) * vendorPageSize + 1 : 0}</span> to <span className="font-semibold tabular-nums text-fg">{Math.min(vendorPage * vendorPageSize, vendorRows.length)}</span> of <span className="font-semibold tabular-nums text-fg">{vendorRows.length}</span> external vendors
                <span className="mx-2 text-line">|</span>
                Sorted by Rate (High to Low)
              </div>
              <div className="flex items-center gap-1.5">
                <button type="button" disabled={vendorPage <= 1} onClick={() => setVendorPage((value) => Math.max(1, value - 1))} className="inline-flex h-8 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[11px] text-muted disabled:opacity-40"><ChevronLeft size={14} /> Previous</button>
                {Array.from({ length: Math.min(vendorPageCount, 8) }, (_, index) => {
                  const page = index + 1;
                  return <button key={page} type="button" onClick={() => setVendorPage(page)} className={'h-8 w-8 rounded-control border px-0 text-[11px] font-semibold ' + (vendorPage === page ? 'border-accent bg-accent text-white' : 'border-line bg-bg text-muted')}>{page}</button>;
                })}
                <button type="button" disabled={vendorPage >= vendorPageCount} onClick={() => setVendorPage((value) => Math.min(vendorPageCount, value + 1))} className="inline-flex h-8 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[11px] text-muted disabled:opacity-40">Next <ChevronRight size={14} /></button>
              </div>
            </div>
          </AdminPanel>
        </div>
      ) : currentView === 'capacity-allocation' ? (
        <div className="space-y-5" data-ams-feature-slug="capacity-allocation">
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
                    <tr key={row.member.id} data-ams-slug={row.member.slug}>
                      <td>
                        <p className="font-medium text-fg">{row.member.name}</p>
                        <p className="mt-1 text-[10px] text-muted">{row.member.role} · {row.member.division}</p>
                        <p className="mt-1 font-mono text-[9px] text-muted/70">slug: {row.member.slug}</p>
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
        <div className="space-y-5" data-ams-feature-slug="skill-matrix">
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
                    <tr key={row.slug} data-ams-slug={row.slug}>
                      <td>
                        <p className="font-medium text-fg">{row.skill}</p>
                        <p className="mt-1 font-mono text-[9px] text-muted/70">slug: {row.slug}</p>
                      </td>
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
        <div className="space-y-5" data-ams-feature-slug="time-logs">
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
                      <tr key={log.id} data-ams-slug={log.slug}>
                        <td className="tabular-nums text-muted">{formatDate(log.date)}</td>
                        <td>
                          <p className="font-medium text-fg">{log.projectName || 'General'}</p>
                          <p className="mt-1 truncate text-[10px] text-muted">{log.taskTitle || 'General activity'}</p>
                          <p className="mt-1 font-mono text-[9px] text-muted/70">slug: {log.slug}</p>
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
        open={Boolean(memberDetail)}
        onClose={() => setMemberDetail(null)}
        title={memberDetail?.name || 'Team Member'}
        description={memberDetail ? 'Team member profile · ' + memberDetail.slug : undefined}
        size="lg"
      >
        {memberDetail && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-control border border-line bg-bg p-3">
                <p className="text-[10px] text-muted">Role</p>
                <p className="mt-1 text-sm font-medium text-fg">{memberDetail.role || 'Not assigned'}</p>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <p className="text-[10px] text-muted">Department</p>
                <p className="mt-1 text-sm font-medium text-fg">{memberDetail.division || 'Not assigned'}</p>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <p className="text-[10px] text-muted">Allocation</p>
                <p className="mt-1 text-sm font-semibold text-fg">{memberAllocation(memberDetail).label} · {memberAllocation(memberDetail).percent}%</p>
              </div>
              <div className="rounded-control border border-line bg-bg p-3">
                <p className="text-[10px] text-muted">Slug</p>
                <p className="mt-1 break-all font-mono text-[10px] text-fg">{memberDetail.slug}</p>
              </div>
            </div>
            <div className="rounded-control border border-line bg-bg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Active Projects</p>
              <div className="mt-2 space-y-2">
                {memberProjects(memberDetail).length ? memberProjects(memberDetail).map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-3 rounded-control border border-line bg-panel px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-fg">{project.name}</p>
                      <p className="mt-1 text-[10px] text-muted">{project.status || 'Active'}</p>
                    </div>
                    <span className="font-mono text-[9px] text-muted">{project.slug}</span>
                  </div>
                )) : <p className="text-xs text-muted">No active project assignments found.</p>}
              </div>
            </div>
            <div className="rounded-control border border-line bg-bg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Core Skills</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {memberCoreSkills(memberDetail).map((skill) => <span key={skill} className="rounded-badge border border-line bg-panel px-2.5 py-1 text-[10px] text-fg">{skill}</span>)}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Link to="/admin/projects" className="inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg">Open Projects</Link>
              <Button type="button" variant="primary" onClick={() => { const member = memberDetail; setMemberDetail(null); setAllocationTarget(member); }}>Allocate</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={Boolean(allocationTarget)}
        onClose={() => setAllocationTarget(null)}
        title="Allocate Team Member"
        description={allocationTarget ? 'Current allocation for ' + allocationTarget.name + '. Allocation controls are presented from existing project data.' : undefined}
        size="lg"
      >
        {allocationTarget && (
          <div className="space-y-4">
            <div className="rounded-control border border-line bg-bg p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-fg">{allocationTarget.name}</p>
                  <p className="mt-1 text-xs text-muted">{allocationTarget.role} · {allocationTarget.division}</p>
                </div>
                <span className="font-mono text-[9px] text-muted">{allocationTarget.slug}</span>
              </div>
              <div className="mt-3">
                <p className="text-[10px] text-muted">Current workload</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-fg">{memberAllocation(allocationTarget).percent}%</p>
              </div>
            </div>
            <div className="rounded-control border border-line bg-bg p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted">Available active projects</p>
              <div className="mt-2 space-y-2">
                {projects.filter((project) => project.status !== 'completed').slice(0, 8).map((project) => (
                  <div key={project.id} className="flex items-center justify-between gap-3 rounded-control border border-line bg-panel px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-fg">{project.name}</p>
                      <p className="mt-1 text-[10px] text-muted">{project.clientName || project.clientCompany || 'Active project'}</p>
                    </div>
                    <span className="font-mono text-[9px] text-muted">{project.slug}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-line pt-4">
              <Link to="/admin/projects" className="inline-flex min-h-9 items-center rounded-control border border-line bg-panel px-3 text-xs font-medium text-fg hover:bg-bg">Open Project Workspace</Link>
              <Button type="button" variant="secondary" onClick={() => setAllocationTarget(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

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
        description={(vendorDetail?.primaryCategory || '') + (vendorDetail ? ' · ' + vendorDetail.slug : '')}
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
