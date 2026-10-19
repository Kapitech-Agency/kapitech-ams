import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useReportingPeriod } from '../../lib/ReportingPeriodContext';
import { useSearchParams } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Clock3,
  Database,
  Download,
  FileCheck2,
  KeyRound,
  Layers,
  Lock,
  Palette,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Terminal,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Drawer } from '../../components/ui/Drawer';
import { Modal } from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { AdminModuleHeader, AdminPageShell, AdminSectionTabs, AdminTablePagination } from '../../components/admin/AdminModulePrimitives';
import {
  AdminAccount,
  AdminTier,
  SecurityAuditLog,
  createAdminAccount,
  deleteAdminAccount,
  getAdminSession,
  getStoredAdminCredentials,
  isMasterAdministrator,
  updateAdminCredentials,
  cacheAdminSession
} from '../../lib/adminAuth';
import { SiteMetaSettings } from '../../lib/cmsStore';
import { api } from '../../lib/apiClient';
import { CustomSelect } from '../../components/ui/CustomSelect';
import { createQrCode, qrCodeToPath } from '../../lib/qrcodegen';

type SettingsTab = 'overview' | 'audit' | 'security' | 'integrations';
type IntegrationView = 'overview' | 'website-cms';
type AuditOutcome = 'all' | 'success' | 'attention';

type BackupRecord = {
  createdAt: string;
  sizeBytes: number;
};

type SecurityStatus = {
  encryptionAtRest: boolean;
  privateDocumentEncryption: boolean;
  mfaRequired: boolean;
  activeUserCount: number;
  mfaEnabledCount: number;
  mfaCoveragePercent: number;
  backupCount: number;
  latestBackupAt: string | null;
  latestBackupAgeMinutes: number | null;
  backupFresh: boolean;
  backupIntegrity: {
    valid: boolean;
    checkedAt: string;
    latestName?: string;
    reason?: string;
  };
};

// ProductionReadinessCard remains the shared readiness contract for this inline AMS gate.
type ProductionReadiness = {
  productionReady: boolean;
  gates: Record<string, boolean>;
  status?: {
    datasource?: string;
    reason?: string;
  };
};

const formatUtc = (value?: string | null) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'UTC'
  }).format(date) + ' UTC';
};

const formatSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return value >= 10 || index === 0 ? value.toFixed(0) + ' ' + units[index] : value.toFixed(2) + ' ' + units[index];
};

const archiveIdentifier = (createdAt: string, index: number) => {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'ams_prod_snapshot_' + String(index + 1).padStart(2, '0') + '.tar.zst';
  const stamp = date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, '');
  return 'ams_prod_snapshot_' + stamp + '.tar.zst';
};

const statusClasses = {
  success: 'border-success/20 bg-success/10 text-success',
  warning: 'border-warning/20 bg-warning/10 text-warning',
  danger: 'border-danger/20 bg-danger/10 text-danger',
  info: 'border-info/20 bg-info/10 text-info',
  neutral: 'border-line bg-bg text-muted'
} as const;

const StatusBadge: React.FC<{
  tone?: keyof typeof statusClasses;
  label: string;
  icon?: React.ReactNode;
}> = ({ tone = 'neutral', label, icon }) => (
  <span className={'inline-flex items-center gap-1.5 rounded-badge border px-2 py-1 text-[10px] font-semibold ' + statusClasses[tone]}>
    {icon || <span className="h-1.5 w-1.5 rounded-full bg-current" />}
    {label}
  </span>
);

const SummaryCard: React.FC<{
  label: string;
  value: string;
  context: string;
  status: string;
  tone: keyof typeof statusClasses;
}> = ({ label, value, context, status, tone }) => (
  <article className="rounded-card border border-line bg-panel p-5">
    <div className="flex items-center justify-between gap-3">
      <span className="text-[11px] text-muted">{label}</span>
      <StatusBadge tone={tone} label={status} />
    </div>
    <div className="mt-3 min-w-0">
      <div className="truncate text-[20px] font-semibold leading-7 tracking-[-0.01em] text-fg tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] leading-4 text-muted">{context}</div>
    </div>
  </article>
);

export const AdminSettings: React.FC = () => {
  const { matchesDate, value: reportPeriodValue, enabled: reportPeriodEnabled } = useReportingPeriod();
  const [searchParams, setSearchParams] = useSearchParams();
  const session = getAdminSession();
  const storedCreds = getStoredAdminCredentials() ?? {
    username: '',
    email: '',
    displayName: '',
    role: 'Unknown',
    division: 'Operations',
    mfaEnabled: false
  };

  const isSuperAdmin = isMasterAdministrator(session?.user);
  const canAccessServer =
    isSuperAdmin ||
    Boolean(session?.user?.permissions?.canAccessServerAndApi);
  const canManageAdminAccounts =
    isSuperAdmin ||
    Boolean(session?.user?.permissions?.canManageAdminAccounts);
  const canViewAuditLogs =
    isSuperAdmin ||
    Boolean(session?.user?.permissions?.canViewSecurityAuditLogs);
  const isCurrentMaster = isSuperAdmin;
  // Users who must enroll in MFA can reach their own security setup without admin-management permissions.
  const mfaSetupRequired = searchParams.get('mfaRequired') === '1' || session?.user?.mfaEnabled !== true;
  const normalizeTab = (value: string | null): SettingsTab => {
    if (value === 'audit') return 'audit';
    if (value === 'security' || value === 'profile' || value === 'rbac') return 'security';
    if (value === 'integrations' || value === 'branding' || value === 'api') return 'integrations';
    return 'overview';
  };

  const requestedTabParam = searchParams.get('tab');
  const requestedTab = normalizeTab(requestedTabParam);
  const requestedIntegration = searchParams.get('integration');
  const hasIntegrationParameter = searchParams.has('integration');
  const integrationView: IntegrationView = requestedIntegration === 'website-cms' ? 'website-cms' : 'overview';
  const [activeTab, setActiveTab] = useState<SettingsTab>(requestedTab);
  const fallbackTab: SettingsTab = canAccessServer ? 'overview' : canViewAuditLogs ? 'audit' : (mfaSetupRequired || canManageAdminAccounts) ? 'security' : 'overview';

  useEffect(() => {
    const allowed: SettingsTab =
      ((requestedTab === 'overview' || requestedTab === 'integrations') && !canAccessServer) ||
      (requestedTab === 'audit' && !canViewAuditLogs) ||
      (requestedTab === 'security' && !mfaSetupRequired && !canManageAdminAccounts && !canAccessServer)
        ? fallbackTab
        : requestedTab;

    if (activeTab !== allowed) setActiveTab(allowed);
    if (allowed !== requestedTab || (requestedTabParam !== null && requestedTabParam !== allowed)) {
      setSearchParams({ tab: allowed }, { replace: true });
    }
  }, [
    activeTab,
    canAccessServer,
    canManageAdminAccounts,
    canViewAuditLogs,
    fallbackTab,
    mfaSetupRequired,
    requestedTab,
    requestedTabParam,
    setSearchParams
  ]);

  useEffect(() => {
    if (!hasIntegrationParameter) return;
    if (activeTab === 'integrations' && requestedIntegration === 'website-cms') return;

    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('integration');
      return next;
    }, { replace: true });
  }, [activeTab, hasIntegrationParameter, requestedIntegration, setSearchParams]);

  const selectTab = (tab: SettingsTab) => {
    if ((tab === 'overview' || tab === 'integrations') && !canAccessServer) return;
    if (tab === 'audit' && !canViewAuditLogs) return;
    if (tab === 'security' && !mfaSetupRequired && !canManageAdminAccounts && !canAccessServer) return;
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [backupLoadError, setBackupLoadError] = useState<string | null>(null);
  const [backupRetentionDays, setBackupRetentionDays] = useState(0);
  const [backupIntegrity, setBackupIntegrity] = useState<{
    valid: boolean;
    checkedAt?: string;
    latestName?: string;
    reason?: string;
  } | null>(null);
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<'available' | 'unavailable' | 'checking'>('checking');
  const [productionReadiness, setProductionReadiness] = useState<ProductionReadiness | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [integrityLoading, setIntegrityLoading] = useState(false);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [overviewMessage, setOverviewMessage] = useState<{ tone: 'success' | 'warning' | 'danger'; text: string } | null>(null);
  const [overviewLoadError, setOverviewLoadError] = useState<string | null>(null);

  const [logs, setLogs] = useState<SecurityAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [auditQuery, setAuditQuery] = useState('');
  const [auditOutcome, setAuditOutcome] = useState<AuditOutcome>('all');
  const [auditPage, setAuditPage] = useState(1);
  const [auditPageSize, setAuditPageSize] = useState(10);

  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [accountFormMessage, setAccountFormMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [deleteAccountMessage, setDeleteAccountMessage] = useState<string | null>(null);
  const [accountPage, setAccountPage] = useState(1);
  const [accountPageSize, setAccountPageSize] = useState(10);
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
  const [accountMessage, setAccountMessage] = useState<{ success: boolean; text: string } | null>(null);

  const [newAccName, setNewAccName] = useState('');
  const [newAccUsername, setNewAccUsername] = useState('');
  const [newAccEmail, setNewAccEmail] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [newAccRole, setNewAccRole] = useState<AdminTier>('Stakeholder Executive');
  const [newAccDivision, setNewAccDivision] = useState<'Management' | 'Engineering' | 'Design' | 'Finance' | 'Operations'>('Management');

  const [username] = useState(storedCreds.username);
  const [email] = useState(storedCreds.email);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityStatusMessage, setSecurityStatusMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [securitySaving, setSecuritySaving] = useState(false);

  const [mfaEnabled, setMfaEnabled] = useState(Boolean(storedCreds.mfaEnabled));
  const [mfaMode, setMfaMode] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [mfaSetupData, setMfaSetupData] = useState<{ secret: string; otpAuthUri: string } | null>(null);
  const [mfaSetupCode, setMfaSetupCode] = useState('');
  const [mfaDisablePassword, setMfaDisablePassword] = useState('');
  const [mfaDisableCode, setMfaDisableCode] = useState('');
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState<string[] | null>(null);
  const [mfaRecoverySaved, setMfaRecoverySaved] = useState(false);
  const [mfaLoading, setMfaLoading] = useState(false);
  const [mfaMessage, setMfaMessage] = useState<{ success: boolean; text: string } | null>(null);
  const mfaQrCode = useMemo(
    () => (mfaSetupData ? createQrCode(mfaSetupData.otpAuthUri) : null),
    [mfaSetupData]
  );

  const syncSecuritySession = useCallback(async () => {
    try {
      const me = await api.auth.me();
      if (me.success && me.data?.user) {
        cacheAdminSession(me.data.user, session?.rememberMe ?? true);
        setMfaEnabled(Boolean(me.data.user.mfaEnabled));
      }
    } catch {
      // Keep the current UI state when the profile refresh is temporarily unavailable.
    }
  }, [session?.rememberMe]);

  const handleStartMfaSetup = async () => {
    if (mfaLoading || mfaEnabled) return;
    setMfaLoading(true);
    setMfaMessage(null);
    try {
      const res = await api.auth.mfaSetupStart();
      if (!res.success || !res.data?.success || !res.data.secret || !res.data.otpAuthUri) {
        throw new Error(res.error || 'MFA setup could not be started.');
      }
      setMfaSetupData({
        secret: res.data.secret,
        otpAuthUri: res.data.otpAuthUri
      });
      setMfaSetupCode('');
      setMfaRecoveryCodes(null);
      setMfaRecoverySaved(false);
      setMfaMode('setup');
    } catch (error) {
      setMfaMessage({
        success: false,
        text: error instanceof Error ? error.message : 'MFA setup could not be started. Try again.'
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleVerifyMfaSetup = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mfaLoading) return;
    const code = mfaSetupCode.replace(/\D/g, '').slice(0, 6);
    if (!/^\d{6}$/.test(code)) {
      setMfaMessage({ success: false, text: 'Enter the 6-digit TOTP code from your authenticator app.' });
      return;
    }

    setMfaLoading(true);
    setMfaMessage(null);
    try {
      const res = await api.auth.mfaSetupVerify(code);
      if (!res.success || !res.data?.success || !res.data.mfaEnabled) {
        throw new Error(res.error || 'MFA verification failed. Check the authenticator code and try again.');
      }
      setMfaEnabled(true);
      setMfaRecoveryCodes(Array.isArray(res.data.mfaRecoveryCodes) ? res.data.mfaRecoveryCodes : []);
      setMfaRecoverySaved(false);
      setMfaMode('idle');
      setMfaSetupCode('');
      setMfaMessage({ success: true, text: 'MFA is enabled. Save the recovery codes before leaving this page.' });
      await syncSecuritySession();
    } catch (error) {
      setMfaMessage({
        success: false,
        text: error instanceof Error ? error.message : 'MFA verification failed. Check the code and try again.'
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const handleDisableMfa = async (event: React.FormEvent) => {
    event.preventDefault();
    if (mfaLoading || !mfaEnabled) return;
    if (!mfaDisablePassword || !/^\d{6}$/.test(mfaDisableCode)) {
      setMfaMessage({ success: false, text: 'Enter the current password and 6-digit MFA code to disable MFA.' });
      return;
    }

    setMfaLoading(true);
    setMfaMessage(null);
    try {
      const res = await api.auth.mfaDisable(mfaDisablePassword, mfaDisableCode);
      if (!res.success || !res.data?.success || res.data.mfaEnabled) {
        throw new Error(res.error || 'MFA could not be disabled. Check the password and current MFA code.');
      }
      setMfaEnabled(false);
      setMfaMode('idle');
      setMfaDisablePassword('');
      setMfaDisableCode('');
      setMfaRecoveryCodes(null);
      setMfaMessage({ success: true, text: 'MFA has been disabled for this account.' });
      await syncSecuritySession();
    } catch (error) {
      setMfaMessage({
        success: false,
        text: error instanceof Error ? error.message : 'MFA could not be disabled. Try again.'
      });
    } finally {
      setMfaLoading(false);
    }
  };

  const copyMfaValue = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMfaMessage({ success: true, text: 'Copied to clipboard.' });
    } catch {
      setMfaMessage({ success: false, text: 'Could not copy to clipboard. Copy the value manually.' });
    }
  };

  const downloadRecoveryCodes = () => {
    if (!mfaRecoveryCodes?.length) return;
    const blob = new Blob([mfaRecoveryCodes.join('\n') + '\n'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'kapitech-ams-mfa-recovery-codes.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const [metaSettings, setMetaSettings] = useState<SiteMetaSettings>({
    siteTitle: '',
    siteDescription: '',
    contactReceiverEmail: '',
    defaultLanguage: 'en',
    enableLiveChat: false,
    enableSoundAlerts: false,
    maintenanceMode: false
  });
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaMessage, setMetaMessage] = useState<{ success: boolean; text: string } | null>(null);

  const loadOverview = useCallback(async () => {
    if (!canAccessServer) return;
    setOverviewLoading(true);
    setOverviewLoadError(null);
    setNotificationStatus('checking');
    try {
      const [backupRes, securityRes, notificationRes, readinessRes] = await Promise.all([
        api.system.getBackups().catch(() => null),
        api.system.securityStatus().catch(() => null),
        api.notifications.getSettings().catch(() => null),
        api.system.productionReadiness().catch(() => null)
      ]);
      const failures: string[] = [];

      if (backupRes?.success && backupRes.data) {
        setBackups(Array.isArray(backupRes.data.backups) ? backupRes.data.backups : []);
        setBackupLoadError(null);
        const res = backupRes;
        setBackupRetentionDays(Number(res.data.retention ?? res.data.retentionDays ?? 14));
      } else {
        const backupError = backupRes && 'error' in backupRes ? backupRes.error : undefined;
        setBackupLoadError(backupError || 'Backup status could not be loaded. Retry to refresh the latest server data.');
        failures.push('backup status');
      }

      if (securityRes?.success && securityRes.data?.status) {
        setSecurityStatus(securityRes.data.status);
        setBackupIntegrity(securityRes.data.status.backupIntegrity);
      } else {
        failures.push('security status');
      }

      if (notificationRes?.success) {
        setNotificationStatus('available');
      } else {
        setNotificationStatus('unavailable');
        failures.push('notification status');
      }

      if (readinessRes?.success && readinessRes.data) {
        setProductionReadiness(readinessRes.data);
      } else {
        failures.push('production readiness');
      }

      setOverviewLoadError(
        failures.length
          ? 'Some system status could not be loaded: ' + failures.join(', ') + '. Retry to refresh the latest server data.'
          : null
      );
    } catch (error) {
      setNotificationStatus('unavailable');
      setOverviewLoadError(error instanceof Error ? error.message : 'System status could not be loaded. Try again.');
    } finally {
      setOverviewLoading(false);
    }
  }, [canAccessServer]);

  const loadAuditLogs = useCallback(async () => {
    if (!canViewAuditLogs) return;
    setAuditLoading(true);
    setAuditError(null);
    try {
      const response = await api.auditLogs.getAll();
      if (!response.success || !Array.isArray(response.data?.logs)) {
        throw new Error(response.error || 'Audit logs could not be loaded. Try again.');
      }
      setLogs(response.data.logs);
    } catch (error) {
      setAuditError(error instanceof Error ? error.message : 'Audit logs could not be loaded. Try again.');
    } finally {
      setAuditLoading(false);
    }
  }, [canViewAuditLogs]);

  const loadAccounts = useCallback(async () => {
    if (!canManageAdminAccounts) return;
    setAccountsLoading(true);
    setAccountsError(null);
    try {
      const response = await api.auth.getUsers();
      if (!response.success || !Array.isArray(response.data?.users)) {
        throw new Error(response.error || 'Admin accounts could not be loaded. Try again.');
      }
      setAccounts(response.data.users);
    } catch (error) {
      setAccountsError(error instanceof Error ? error.message : 'Admin accounts could not be loaded. Try again.');
    } finally {
      setAccountsLoading(false);
    }
  }, [canManageAdminAccounts]);

  const loadMeta = useCallback(async () => {
    setMetaMessage(null);
    try {
      const res = await api.cms.getSettings();
      if (!res.success || !res.data?.settings) {
        setMetaMessage({ success: false, text: res.error || 'Brand and metadata settings could not be loaded. Try again.' });
        return;
      }
      setMetaSettings(current => ({
        ...current,
        ...res.data.settings
      }));
    } catch (error) {
      setMetaMessage({ success: false, text: error instanceof Error ? error.message : 'Brand and metadata settings could not be loaded. Try again.' });
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'overview') void loadOverview();
    if (activeTab === 'audit') void loadAuditLogs();
    if (activeTab === 'security') {
      if (canManageAdminAccounts) void loadAccounts();
      if (canAccessServer) void loadOverview();
    }
    if (activeTab === 'integrations') {
      if (canAccessServer) void loadOverview();
      void loadMeta();
    }
  }, [activeTab, canAccessServer, canManageAdminAccounts, loadAccounts, loadAuditLogs, loadMeta, loadOverview]);

  const triggerIntegrityCheck = async () => {
    if (!canAccessServer || integrityLoading) return;
    setIntegrityLoading(true);
    setOverviewMessage(null);
    try {
      const [backupCheck, auditCheck] = await Promise.all([
        api.system.backupIntegrity(),
        api.auditLogs.integrity()
      ]);
      if (backupCheck.success && backupCheck.data?.integrity) {
        setBackupIntegrity(backupCheck.data.integrity);
      }
      const valid = Boolean(backupCheck.success && backupCheck.data?.integrity?.valid) && Boolean(auditCheck.success && auditCheck.data?.integrity?.valid);
      setOverviewMessage({
        tone: valid ? 'success' : 'warning',
        text: valid ? 'Integrity checks completed successfully.' : 'Integrity checks completed with attention required.'
      });
      await loadOverview();
    } catch (error) {
      setOverviewMessage({
        tone: 'danger',
        text: error instanceof Error ? error.message : 'Integrity checks could not be completed. Try again.'
      });
    } finally {
      setIntegrityLoading(false);
    }
  };

  const createSnapshot = async () => {
    if (!canAccessServer || snapshotLoading) return;
    setSnapshotLoading(true);
    setOverviewMessage(null);
    try {
      const res = await api.system.createBackup();
      if (res.success) {
        setOverviewMessage({ tone: 'success', text: 'Production snapshot created successfully.' });
        await loadOverview();
      } else {
        setOverviewMessage({ tone: 'danger', text: res.error || 'Snapshot creation failed. Try again.' });
      }
    } catch (error) {
      setOverviewMessage({ tone: 'danger', text: error instanceof Error ? error.message : 'Snapshot creation failed. Try again.' });
    } finally {
      setSnapshotLoading(false);
    }
  };

  const handleExportLogs = () => {
    if (filteredLogs.length === 0) return;
    const rows = [
      ['Timestamp (UTC)', 'Actor', 'Event', 'Details', 'Origin / IP', 'Status'],
      ...filteredLogs.map((log) => [
        formatUtc(log.timestamp),
        log.actor,
        log.action,
        log.details,
        log.ip || 'Unknown',
        log.severity === 'critical' ? 'Critical' : log.severity === 'warning' ? 'Warning' : 'Success'
      ])
    ];
    const safeAuditCsvCell = (cell: unknown) => {
      const raw = String(cell ?? '');
      const safeValue = /^[\s\u0000-\u001f]*[=+\-@]/.test(raw) ? "'" + raw : raw;
      return '"' + safeValue.replace(/"/g, '""') + '"';
    };
    const csv = rows
      .map((row) => row.map(safeAuditCsvCell).join(','))
      .join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'kapitech_security_audit_' + new Date().toISOString().slice(0, 10) + '.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const periodBackups = useMemo(() => backups.filter((backup) => matchesDate(backup.createdAt)), [backups, matchesDate]);

  const filteredLogs = useMemo(() => {
    const query = auditQuery.trim().toLowerCase();
    return logs.filter((log) => {
      if (!matchesDate(log.timestamp)) return false;
      const matchesQuery = !query || [log.actor, log.action, log.details, log.ip].some((value) => String(value || '').toLowerCase().includes(query));
      const matchesOutcome =
        auditOutcome === 'all' ||
        (auditOutcome === 'success' && log.severity === 'info') ||
        (auditOutcome === 'attention' && (log.severity === 'warning' || log.severity === 'critical'));
      return matchesQuery && matchesOutcome;
    });
  }, [auditOutcome, auditQuery, logs, matchesDate]);

  useEffect(() => {
    setAuditPage(1);
  }, [auditOutcome, auditQuery, reportPeriodValue, reportPeriodEnabled]);

  useEffect(() => {
    setAccountPage(1);
  }, [accountPageSize]);

  const auditPageCount = Math.max(1, Math.ceil(filteredLogs.length / auditPageSize));
  const pagedLogs = useMemo(
    () => filteredLogs.slice((auditPage - 1) * auditPageSize, auditPage * auditPageSize),
    [auditPage, auditPageSize, filteredLogs]
  );

  const accountPageCount = Math.max(1, Math.ceil(accounts.length / accountPageSize));
  const pagedAccounts = useMemo(
    () => accounts.slice((accountPage - 1) * accountPageSize, accountPage * accountPageSize),
    [accountPage, accountPageSize, accounts]
  );

  useEffect(() => { setAuditPage((page) => Math.min(page, auditPageCount)); }, [auditPageCount]);
  useEffect(() => { setAccountPage((page) => Math.min(page, accountPageCount)); }, [accountPageCount]);

  const handleOpenAddAccount = () => {
    if (!canManageAdminAccounts || isCreatingAccount) return;
    setAccountFormMessage(null);
    setNewAccName('');
    setNewAccUsername('');
    setNewAccEmail('');
    setNewAccPassword('Kapi_' + crypto.randomUUID().replace(/-/g, ''));
    setNewAccRole('Stakeholder Executive');
    setNewAccDivision('Management');
    setAccountMessage(null);
    setIsAddAccountModalOpen(true);
  };

  const handleRoleChangeForNewAccount = (role: AdminTier) => {
    setNewAccRole(role);
    if (role === 'Teknisi IT / Systems Engineer' || role.includes('Internal IT')) {
      setNewAccDivision('Engineering');
    } else if (role === 'Stakeholder Executive' || role.includes('Top Management')) {
      setNewAccDivision('Management');
    } else if (role.includes('Project Manager')) {
      setNewAccDivision('Operations');
    }
  };

  const submitNewAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canManageAdminAccounts || isCreatingAccount) return;
    setAccountFormMessage(null);
    if (newAccPassword.length < 12 || newAccPassword.length > 128) {
      setAccountFormMessage({ success: false, text: 'Temporary password must be 12 to 128 characters.' });
      return;
    }
    setIsCreatingAccount(true);
    try {
      const res = await createAdminAccount({
        name: newAccName,
        username: newAccUsername,
        email: newAccEmail,
        passwordPlain: newAccPassword,
        role: newAccRole,
        division: newAccDivision
      });
      if (res.success) {
        setIsAddAccountModalOpen(false);
        setAccountFormMessage(null);
        setAccountMessage({ success: true, text: 'Account created successfully.' });
        await loadAccounts();
      } else {
        setAccountFormMessage({ success: false, text: res.error || 'Account creation failed. Check the form and try again.' });
      }
    } catch (error) {
      setAccountFormMessage({ success: false, text: error instanceof Error ? error.message : 'Account creation failed. Check the form and try again.' });
    } finally {
      setIsCreatingAccount(false);
    }
  };

  const confirmDeleteAccount = async () => {
    if (!canManageAdminAccounts || !confirmDelete || isDeletingAccount) return;
    setDeleteAccountMessage(null);
    setIsDeletingAccount(true);
    try {
      const res = await deleteAdminAccount(confirmDelete.id);
      if (res.success) {
        setConfirmDelete(null);
        setAccountMessage({ success: true, text: 'Account deleted successfully.' });
        await loadAccounts();
      } else {
        setDeleteAccountMessage(res.error || 'Account deletion failed. Try again.');
      }
    } catch (error) {
      setDeleteAccountMessage(error instanceof Error ? error.message : 'Account deletion failed. Try again.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleUpdateSecurity = async (event: React.FormEvent) => {
    event.preventDefault();
    if (securitySaving) return;
    setSecurityStatusMessage(null);

    if (!currentPassword) {
      setSecurityStatusMessage({ success: false, text: 'Current password is required for security verification.' });
      return;
    }
    if (!newPassword) {
      setSecurityStatusMessage({ success: false, text: 'Enter a new password before saving.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityStatusMessage({ success: false, text: 'New password confirmation does not match.' });
      return;
    }
    if (newPassword.length < 12 || newPassword.length > 128) {
      setSecurityStatusMessage({ success: false, text: 'New password must be 12 to 128 characters.' });
      return;
    }
    if (newPassword === currentPassword) {
      setSecurityStatusMessage({ success: false, text: 'New password must be different from the current password.' });
      return;
    }

    setSecuritySaving(true);
    let res: { success: boolean; error?: string };
    try {
      res = await updateAdminCredentials(currentPassword, { newPassword });
    } catch (error) {
      setSecurityStatusMessage({
        success: false,
        text: error instanceof Error ? error.message : 'Password update failed. Check the current password and try again.'
      });
      return;
    } finally {
      setSecuritySaving(false);
    }
    if (!res.success) {
      setSecurityStatusMessage({ success: false, text: res.error || 'Password update failed. Check the current password and try again.' });
      return;
    }
    setSecurityStatusMessage({ success: true, text: 'Account password updated successfully.' });
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleSaveMeta = async (event: React.FormEvent) => {
    event.preventDefault();
    if (metaSaving) return;
    setMetaSaving(true);
    setMetaMessage(null);
    try {
      const res = await api.cms.updateSettings(metaSettings);
      if (!res.success) {
        setMetaMessage({ success: false, text: res.error || 'Settings could not be saved. Check the fields and try again.' });
        return;
      }
      setMetaMessage({ success: true, text: 'Brand and metadata settings saved.' });
    } catch (error) {
      setMetaMessage({ success: false, text: error instanceof Error ? error.message : 'Settings could not be saved. Check the fields and try again.' });
    } finally {
      setMetaSaving(false);
    }
  };

  const latestBackup = backups[0] ?? null;
  const backupHealthy = Boolean(backupIntegrity?.valid);
  const mfaEnrolled = securityStatus
    ? securityStatus.mfaEnabledCount + ' / ' + securityStatus.activeUserCount + ' Enrolled'
    : overviewLoading ? 'Checking…' : 'Unavailable';
  const backupValue = backupLoadError
    ? backups.length > 0 ? 'Last known' : 'Unavailable'
    : latestBackup
      ? backupHealthy ? '100% Verified' : 'Check required'
      : 'No snapshot';
  const backupContext = backupLoadError
    ? backups.length > 0
      ? 'Current backup status could not be refreshed. The last known snapshot is shown below.'
      : 'Backup status could not be verified. Retry to refresh the server data.'
    : latestBackup
      ? 'Latest snapshot ' + formatUtc(latestBackup.createdAt)
      : 'No production backup returned by the server';
  const notificationContext =
    notificationStatus === 'available'
      ? 'Settings request succeeded; delivery readiness is reported separately below'
      : notificationStatus === 'unavailable'
        ? 'Notification settings could not be loaded'
        : 'Checking notification settings';
  const notificationLabel =
    notificationStatus === 'available'
      ? 'Settings available'
      : notificationStatus === 'unavailable'
        ? 'Unavailable'
        : 'Checking';
  const readinessTone: keyof typeof statusClasses = productionReadiness?.productionReady ? 'success' : 'warning';

  const renderSkeleton = () => (
    <div className="animate-pulse space-y-3" aria-hidden="true">
      <div className="h-4 w-32 rounded bg-line" />
      <div className="h-8 w-48 rounded bg-line" />
      <div className="h-3 w-64 rounded bg-line" />
    </div>
  );

  return (
    <AdminPageShell featureSlug="settings-module">
      <AdminModuleHeader slug="settings-header"
        title={activeTab === 'overview'
          ? 'System overview'
          : activeTab === 'security'
            ? 'Access & security'
            : activeTab === 'audit'
              ? 'Audit log'
              : 'Integrations'}
        description={activeTab === 'overview'
          ? 'Review system health, backup history, and production readiness.'
          : activeTab === 'security'
            ? 'Review account identity, access, and multi-factor authentication.'
            : activeTab === 'audit'
              ? 'Search and review server-recorded security and administrative events.'
              : 'Review server-managed connections, public metadata, and integration health.'}
        actions={canAccessServer && activeTab === 'overview' ? (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void triggerIntegrityCheck()}
              loading={integrityLoading}
              icon={<FileCheck2 size={15} />}
            >
              Trigger Integrity Check
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={() => void createSnapshot()}
              loading={snapshotLoading}
              icon={<Database size={15} />}
            >
              Create Snapshot
            </Button>
          </>
        ) : undefined}
      />

      

      {overviewLoadError && canAccessServer && activeTab !== 'audit' && (
        <div className="flex flex-col gap-2 rounded-control border border-danger/20 bg-danger/5 px-4 py-3 text-xs text-danger sm:flex-row sm:items-center sm:justify-between" role="alert">
          <span>{overviewLoadError}</span>
          <Button type="button" variant="secondary" onClick={() => void loadOverview()} disabled={overviewLoading} loading={overviewLoading}>Retry</Button>
        </div>
      )}

      {overviewMessage && (
        <div className={
          'rounded-card border px-4 py-3 text-xs ' +
          (overviewMessage.tone === 'success'
            ? 'border-success/20 bg-success/10 text-success'
            : overviewMessage.tone === 'warning'
              ? 'border-warning/20 bg-warning/10 text-warning'
              : 'border-danger/20 bg-danger/10 text-danger')
        } role="status">
          {overviewMessage.text}
        </div>
      )}

      {activeTab === 'overview' && !canAccessServer && (
        <section className="rounded-card border border-line bg-panel p-5" role="status">
          <h2 className="text-sm font-semibold text-fg">System settings access is restricted</h2>
          <p className="mt-2 text-xs leading-5 text-muted">This account does not have permission to view backup, server, or integration settings. Contact an administrator if you need access.</p>
        </section>
      )}

      {activeTab === 'overview' && canAccessServer && (
        <section data-ams-feature-slug="settings-overview" data-ams-slug="settings-overview" aria-label="System Status Summary" className="space-y-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <SummaryCard
              label="Backup & Recovery"
              value={overviewLoading ? 'Checking…' : backupValue}
              context={overviewLoading ? 'Loading backup health and retention status' : backupContext}
              status={overviewLoading ? 'Checking' : backupLoadError ? 'Unavailable' : backupHealthy ? 'Healthy' : 'Needs review'}
              tone={overviewLoading ? 'neutral' : backupLoadError ? 'warning' : backupHealthy ? 'success' : 'warning'}
            />
            <SummaryCard
              label="Security & MFA"
              value={overviewLoading ? 'Checking…' : mfaEnrolled}
              context={overviewLoading
                ? 'Loading identity protection status'
                : securityStatus
                  ? securityStatus.activeUserCount + ' active users reported by the server'
                  : 'Security status could not be verified'}
              status={overviewLoading ? 'Checking' : !securityStatus ? 'Unavailable' : securityStatus.mfaCoveragePercent === 100 ? 'Enforced' : 'Review'}
              tone={overviewLoading ? 'neutral' : !securityStatus ? 'warning' : securityStatus.mfaCoveragePercent === 100 ? 'success' : 'warning'}
            />
            <SummaryCard
              label="Integrations & Alerts"
              value={notificationStatus === 'available' ? 'Notification settings' : 'Server-managed'}
              context={notificationContext}
              status={notificationLabel}
              tone={notificationStatus === 'unavailable' ? 'warning' : 'neutral'}
            />
          </div>

          <section data-ams-feature-slug="settings-backup-history" data-ams-slug="settings-backup-history" className="overflow-hidden rounded-card border border-line bg-panel">
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Clock3 size={17} className="text-accent-text" />
                <h2 className="text-sm font-semibold text-fg">Recent Production Backups</h2>
              </div>
              <span className="text-[10px] text-muted">
                Retention: {backupRetentionDays ? backupRetentionDays + ' days' : 'Provider-managed backup'}
              </span>
            </div>

            <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable production backup history">
              {overviewLoading && backups.length === 0 ? (
                <div className="px-5 py-8">{renderSkeleton()}</div>
              ) : backupLoadError && backups.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center px-5 py-10 text-center" role="alert">
                  <p className="text-sm font-medium text-fg">Backup status unavailable</p>
                  <p className="mt-1 max-w-md text-xs leading-5 text-muted">{backupLoadError}</p>
                  <Button type="button" variant="secondary" onClick={() => void loadOverview()} disabled={overviewLoading} loading={overviewLoading} className="mt-4">Retry status</Button>
                </div>
              ) : backups.length === 0 ? (
                <div className="flex min-h-[180px] flex-col items-center justify-center px-5 py-10 text-center">
                  <FileCheck2 size={22} className="text-muted" />
                  <p className="mt-3 text-sm font-medium text-fg">No production backups found</p>
                  <p className="mt-1 max-w-md text-xs leading-5 text-muted">Create a snapshot to start the production backup history.</p>
                  <button
                    type="button"
                    onClick={() => void createSnapshot()}
                    disabled={snapshotLoading}
                    className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-control bg-accent px-3 text-xs font-medium text-white hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <Database size={14} />
                    Create Snapshot
                  </button>
                </div>
              ) : (
                <>
                  {overviewLoading && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-bg px-5 py-2 text-[11px] text-muted" role="status">
                      <span>Refreshing backup status. Previously loaded entries remain visible.</span>
                    </div>
                  )}
                  {backupLoadError && (
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warning/20 bg-warning/5 px-5 py-3 text-[11px] text-warning" role="alert">
                      <span>{backupLoadError} Showing the last successfully loaded backup entries.</span>
                      <Button type="button" variant="secondary" onClick={() => void loadOverview()} disabled={overviewLoading} loading={overviewLoading}>Retry</Button>
                    </div>
                  )}
                  <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="settings-backup-cards" role="list" aria-label="Production backup snapshots">
                    {periodBackups.length === 0 ? (
                      <div className="rounded-control border border-line bg-bg p-5 text-center text-xs text-muted">{reportPeriodEnabled ? 'No backup snapshots in the selected reporting period.' : 'No backup snapshots are available.'}</div>
                    ) : periodBackups.slice(0, 8).map((backup, index) => (
                      <article key={backup.createdAt + String(index)} role="listitem" data-ams-slug={'settings-backup-card-' + index} className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-all font-mono text-xs font-medium text-fg">{archiveIdentifier(backup.createdAt, index)}</p>
                            <p className="mt-1 text-[10px] text-muted">Production snapshot</p>
                          </div>
                          <StatusBadge tone={backupHealthy ? 'success' : 'warning'} label={backupHealthy ? 'Verified' : 'Needs check'} />
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-3">
                          <div className="min-w-0"><p className="text-[10px] text-muted">Size</p><p className="mt-1 text-xs tabular-nums text-fg">{formatSize(backup.sizeBytes)}</p></div>
                          <div className="min-w-0"><p className="text-[10px] text-muted">Created (UTC)</p><p className="mt-1 break-words text-xs tabular-nums text-fg">{formatUtc(backup.createdAt)}</p></div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <button type="button" onClick={() => void triggerIntegrityCheck()} disabled={integrityLoading} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[11px] text-muted transition-colors hover:bg-panel-hover hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-wait disabled:opacity-50"><CheckCircle2 size={13} />Verify integrity</button>
                        </div>
                      </article>
                    ))}
                  </div>
                  <div className="hidden min-[1280px]:block overflow-x-auto">
                  <table className="settings-system-table min-w-[760px]">
                  <thead>
                    <tr>
                      <th>Archive Identifier</th>
                      <th>Type</th>
                      <th>Size</th>
                      <th>Created</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {periodBackups.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-3 py-6 text-center text-xs text-muted">
                          {reportPeriodEnabled ? 'No backup snapshots in the selected reporting period.' : 'No backup snapshots are available.'}
                        </td>
                      </tr>
                    ) : periodBackups.slice(0, 8).map((backup, index) => (
                      <tr key={backup.createdAt + String(index)}>
                        <td className="font-mono text-[11px] text-fg">{archiveIdentifier(backup.createdAt, index)}</td>
                        <td>
                          <span className="inline-flex rounded-badge border border-line bg-bg px-1.5 py-0.5 text-[10px] text-muted">Snapshot</span>
                        </td>
                        <td className="font-mono text-[11px] tabular-nums text-muted">{formatSize(backup.sizeBytes)}</td>
                        <td className="text-[11px] text-muted tabular-nums">{formatUtc(backup.createdAt)}</td>
                        <td>
                          <StatusBadge
                            tone={backupHealthy ? 'success' : 'warning'}
                            label={backupHealthy ? 'Verified' : 'Needs check'}
                          />
                        </td>
                        <td className="text-right">
                          <button
                            type="button"
                            onClick={() => void triggerIntegrityCheck()}
                            disabled={integrityLoading}
                            className="inline-flex min-h-8 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[11px] text-muted transition-colors hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            <CheckCircle2 size={13} />
                            Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  </table>
                  </div>
                </>
              )}
            </div>
          </section>

          <section className="rounded-card border border-line bg-panel p-5">
            <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-muted" />
                <div>
                  <h2 className="text-sm font-semibold text-fg">System Integrity</h2>
                  <p className="mt-1 text-[10px] text-muted">Server-side checks across backup, audit, and production readiness controls.</p>
                </div>
              </div>
              <StatusBadge
                tone={readinessTone}
                label={productionReadiness?.productionReady ? 'Production ready' : 'Review gates'}
              />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Runtime', Boolean(productionReadiness?.gates?.runtime)],
                ['PostgreSQL', Boolean(productionReadiness?.gates?.postgres)],
                ['MFA', Boolean(productionReadiness?.gates?.mfa)],
                ['Documents', Boolean(productionReadiness?.gates?.documentStorage)]
              ].map(([label, ready]) => (
                <div key={String(label)} className="flex items-center justify-between gap-2 rounded-control border border-line bg-bg px-3 py-2.5">
                  <span className="text-[10px] text-muted">{String(label)}</span>
                  {ready ? <Check size={14} className="text-success" /> : <AlertCircle size={14} className="text-warning" />}
                </div>
              ))}
            </div>

            {productionReadiness?.status?.reason && (
              <div className="mt-3 rounded-control border border-warning/20 bg-warning/5 px-3 py-2.5 text-[11px] leading-5 text-warning">
                {productionReadiness.status.reason}
              </div>
            )}
          </section>
        </section>
      )}

      {activeTab === 'audit' && canViewAuditLogs && (
        <section className="rounded-card border border-line bg-panel">
          <div className="flex flex-col gap-3 border-b border-line px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <Clock3 size={18} className="text-muted" />
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-fg">Immutable System Audit Log</h2>
                  <span className="rounded-badge border border-line bg-bg px-2 py-0.5 text-[10px] font-mono text-muted">Write-Once Ledger</span>
                </div>
                <p className="mt-1 text-[10px] leading-4 text-muted">Authentication, RBAC, and security operations reported by the server.</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative sm:w-56">
                <span className="sr-only">Filter by event or actor</span>
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  value={auditQuery}
                  onChange={(event) => setAuditQuery(event.target.value)}
                  placeholder="Filter by event or actor..."
                  className="h-8 w-full bg-bg pl-9 pr-3 text-[11px]"
                />
              </label>
              <CustomSelect
                value={auditOutcome}
                onChange={(value) => setAuditOutcome(value as AuditOutcome)}
                options={[
                  { value: 'all', label: 'All outcomes' },
                  { value: 'success', label: 'Success only' },
                  { value: 'attention', label: 'Warnings & critical' }
                ]}
                triggerClassName="h-8 min-h-8 w-[160px]"
                aria-label="Filter audit outcomes"
              />
              <button
                type="button"
                onClick={handleExportLogs}
                disabled={filteredLogs.length === 0}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-control border border-line bg-bg px-3 text-[11px] text-muted transition-colors hover:bg-panel hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-40"
              >
                <Download size={13} />
                Export CSV
              </button>
            </div>
          </div>

          {auditError && filteredLogs.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-danger/20 bg-danger/5 px-5 py-3 text-[11px] text-danger" role="alert">
              <span>{auditError} Showing the last successfully loaded entries.</span>
              <Button type="button" variant="secondary" onClick={() => void loadAuditLogs()} disabled={auditLoading} loading={auditLoading}>Retry</Button>
            </div>
          )}

          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable system audit log">
            {auditLoading ? (
              <div className="px-5 py-10">{renderSkeleton()}</div>
            ) : auditError && filteredLogs.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center" role="alert">
                <AlertCircle size={24} className="text-danger" />
                <p className="mt-3 text-sm font-medium text-fg">Audit logs could not be loaded</p>
                <p className="mt-1 max-w-md text-xs leading-5 text-muted">{auditError}</p>
                <Button type="button" variant="secondary" onClick={() => void loadAuditLogs()} disabled={auditLoading} loading={auditLoading} className="mt-4">Retry</Button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-10 text-center">
                <Clock3 size={24} className="text-muted" />
                <p className="mt-3 text-sm font-medium text-fg">No audit entries found</p>
                <p className="mt-1 max-w-md text-xs leading-5 text-muted">Adjust the filters or wait for new server-side audit activity.</p>
              </div>
            ) : (
              <>
              <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="settings-audit-cards" role="list" aria-label="System audit entries">
                {pagedLogs.map((log) => {
                  const isCritical = log.severity === 'critical';
                  const isWarning = log.severity === 'warning';
                  return (
                    <article key={log.id} role="listitem" data-ams-slug={'settings-audit-card-' + log.id} className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] tabular-nums text-muted">{formatUtc(log.timestamp)}</p>
                          <p className="mt-1 break-words text-xs font-semibold text-fg">{log.actor || 'System'}</p>
                        </div>
                        <StatusBadge tone={isCritical ? 'danger' : isWarning ? 'warning' : 'success'} label={isCritical ? 'Critical' : isWarning ? 'Warning' : 'Success'} />
                      </div>
                      <div className="mt-3 border-y border-line py-3">
                        <span className="inline-flex max-w-full break-all rounded-badge border border-line bg-panel px-2 py-1 font-mono text-[10px] font-medium text-fg">{log.action}</span>
                        <p className="mt-2 break-words text-xs leading-5 text-muted">{log.details || 'No additional details'}</p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] text-muted">Origin / IP</span>
                        <span className="break-all font-mono text-[10px] text-fg">{log.ip || 'Internal cluster'}</span>
                      </div>
                    </article>
                  );
                })}
              </div>
              <div className="hidden min-[1280px]:block">
              <table className="settings-system-table min-w-[1080px]">
                <thead>
                  <tr>
                    <th>Timestamp (UTC)</th>
                    <th>Actor</th>
                    <th>Event</th>
                    <th>Details</th>
                    <th>Origin / IP</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedLogs.map((log) => {
                    const isCritical = log.severity === 'critical';
                    const isWarning = log.severity === 'warning';
                    return (
                      <tr key={log.id}>
                        <td className="font-mono text-[10px] tabular-nums text-muted">{formatUtc(log.timestamp)}</td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-control border border-line bg-bg text-[10px] font-mono font-semibold text-fg">
                              {String(log.actor || 'SYS').slice(0, 2).toUpperCase()}
                            </span>
                            <span className="text-[11px] font-medium text-fg">{log.actor || 'System'}</span>
                          </div>
                        </td>
                        <td>
                          <span className="rounded-badge border border-line bg-bg px-2 py-0.5 font-mono text-[10px] font-medium text-fg">
                            {log.action}
                          </span>
                        </td>
                        <td className="max-w-[420px] text-[11px] text-muted">{log.details}</td>
                        <td className="font-mono text-[10px] text-muted">{log.ip || 'Internal cluster'}</td>
                        <td className="text-right">
                          <StatusBadge
                            tone={isCritical ? 'danger' : isWarning ? 'warning' : 'success'}
                            label={isCritical ? 'Critical' : isWarning ? 'Warning' : 'Success'}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              </div>
              </>
            )}
          </div>

          {!auditLoading && (
            <AdminTablePagination
              total={filteredLogs.length}
              page={auditPage}
              pageSize={auditPageSize}
              onPageChange={setAuditPage}
              onPageSizeChange={setAuditPageSize}
              itemLabel="ledger entries"
              slug="settings-audit-pagination"
              secondaryLabel="Retention is server-managed."
            />
          )}
        </section>
      )}

      {activeTab === 'security' && (
        <section className="space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-card border border-line bg-panel p-5">
              <div className="flex items-center gap-2 border-b border-line pb-4">
                <UserCheck size={18} className="text-accent-text" />
                <div>
                  <h2 className="text-sm font-semibold text-fg">Account profile & identity</h2>
                  <p className="mt-1 text-[10px] leading-4 text-muted">Identity and login state are sourced from the server session.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-muted">Username</label>
                  <input value={username} readOnly aria-readonly="true" className="w-full bg-bg text-[11px] text-muted" />
                </div>
                <div>
                  <label className="mb-1 block text-[10px] font-medium text-muted">Notification email</label>
                  <input value={email} readOnly aria-readonly="true" className="w-full bg-bg text-[11px] text-muted" />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-control border border-line bg-bg px-3 py-3">
                  <p className="text-[10px] text-muted">Role</p>
                  <p className="mt-1 text-xs font-semibold text-fg">{session?.user?.role || storedCreds.role}</p>
                </div>
                <div className="rounded-control border border-line bg-bg px-3 py-3">
                  <p className="text-[10px] text-muted">Division</p>
                  <p className="mt-1 text-xs font-semibold text-fg">{storedCreds.division || 'Management'}</p>
                </div>
                <div className="rounded-control border border-line bg-bg px-3 py-3">
                  <p className="text-[10px] text-muted">Last login</p>
                  <p className="mt-1 text-xs font-semibold text-fg">{formatUtc(session?.user?.lastLogin)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-card border border-line bg-panel p-5">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
                <div className="flex items-center gap-2">
                  <Lock size={18} className="text-warning" />
                  <div>
                    <h2 className="text-sm font-semibold text-fg">Security & MFA policy</h2>
                    <p className="mt-1 text-[10px] leading-4 text-muted">Manage your own authenticator enrollment without exposing secrets to the browser storage layer.</p>
                  </div>
                </div>
                <StatusBadge
                  tone={mfaEnabled ? 'success' : 'warning'}
                  label={mfaEnabled ? 'Enabled' : 'Not configured'}
                  icon={mfaEnabled ? <ShieldCheck size={12} /> : <AlertCircle size={12} />}
                />
              </div>

              <div className="mt-4 rounded-control border border-line bg-bg p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <Smartphone size={18} className={mfaEnabled ? 'text-success' : 'text-warning'} />
                    <div>
                      <p className="text-xs font-semibold text-fg">Multi-factor authentication</p>
                      <p className="mt-1 text-[10px] leading-5 text-muted">
                        {mfaEnabled
                          ? 'Your account requires an authenticator code during sign-in. Keep your recovery codes somewhere secure.'
                          : 'Protect this account with a TOTP authenticator app. The setup secret is shown once during enrollment.'}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {!mfaEnabled && (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => void handleStartMfaSetup()}
                        loading={mfaLoading}
                        icon={<ShieldCheck size={14} />}
                      >
                        Enable MFA
                      </Button>
                    )}
                    {mfaEnabled && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setMfaMessage(null);
                          if (mfaMode === 'disable') {
                            setMfaDisablePassword('');
                            setMfaDisableCode('');
                            setMfaMode('idle');
                          } else {
                            setMfaMode('disable');
                          }
                        }}
                        disabled={mfaLoading}
                      >
                        {mfaMode === 'disable' ? 'Cancel' : 'Disable MFA'}
                      </Button>
                    )}
                  </div>
                </div>

                {mfaMode === 'setup' && mfaSetupData && (
                  <div className="mt-4 space-y-4 border-t border-line pt-4">
                    <div className="rounded-control border border-info/20 bg-info/10 px-3 py-3">
                      <p className="text-[11px] font-semibold text-fg">1. Add the account to your authenticator</p>
                      <p className="mt-1 text-[10px] leading-5 text-muted">Use the manual setup key below in Google Authenticator, Microsoft Authenticator, 1Password, or another compatible TOTP app.</p>
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[220px_minmax(0,1fr)]">
                      <div className="rounded-control border border-line bg-panel p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-medium text-muted">Scan with your phone</span>
                            <p className="mt-1 text-[10px] leading-4 text-muted">Open your authenticator app and scan this QR code.</p>
                          </div>
                          <Smartphone size={14} className="text-accent-text" />
                        </div>
                        <div className="mt-3 flex justify-center rounded-control bg-white p-3 text-black">
                          {mfaQrCode ? (
                            <svg
                              viewBox={`0 0 ${mfaQrCode.size + 8} ${mfaQrCode.size + 8}`}
                              className="h-[180px] w-[180px] max-w-full"
                              role="img"
                              aria-label="MFA authenticator QR code"
                              shapeRendering="crispEdges"
                            >
                              <path d={qrCodeToPath(mfaQrCode, 4)} fill="currentColor" />
                            </svg>
                          ) : (
                            <div className="flex h-[180px] w-[180px] items-center justify-center text-center text-[10px] text-muted">
                              QR code unavailable
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="rounded-control border border-line bg-panel p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-medium text-muted">Setup key</span>
                            <button type="button" onClick={() => void copyMfaValue(mfaSetupData.secret)} className="inline-flex min-h-8 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[10px] text-muted hover:text-fg">
                              <Copy size={11} />Copy
                            </button>
                          </div>
                          <p className="mt-2 break-all rounded-control border border-line bg-bg px-3 py-2 font-mono text-[11px] font-semibold tracking-[0.08em] text-fg">{mfaSetupData.secret}</p>
                        </div>

                        <div className="rounded-control border border-line bg-panel p-3">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-medium text-muted">Authenticator URI</span>
                            <button type="button" onClick={() => void copyMfaValue(mfaSetupData.otpAuthUri)} className="inline-flex min-h-8 items-center gap-1 rounded-control border border-line bg-bg px-2.5 text-[10px] text-muted hover:text-fg">
                              <Copy size={11} />Copy
                            </button>
                          </div>
                          <p className="mt-2 max-h-24 overflow-y-auto break-all rounded-control border border-line bg-bg px-3 py-2 font-mono text-[10px] leading-4 text-muted">{mfaSetupData.otpAuthUri}</p>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleVerifyMfaSetup} className="rounded-control border border-line bg-panel p-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <label className="min-w-0 flex-1">
                          <span className="mb-1 block text-[10px] font-medium text-muted">2. Verify the 6-digit TOTP code</span>
                          <input
                            value={mfaSetupCode}
                            onChange={(event) => setMfaSetupCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            className="w-full bg-bg text-center font-mono text-base tracking-[0.35em]"
                            placeholder="000000"
                          />
                        </label>
                        <Button type="submit" variant="primary" loading={mfaLoading} icon={<Check size={14} />}>
                          Verify & enable
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {mfaMode === 'disable' && mfaEnabled && (
                  <form onSubmit={handleDisableMfa} className="mt-4 space-y-3 border-t border-line pt-4">
                    <div className="rounded-control border border-danger/20 bg-danger/10 px-3 py-3">
                      <p className="text-[11px] font-semibold text-fg">Disable MFA</p>
                      <p className="mt-1 text-[10px] leading-5 text-muted">This removes the extra sign-in factor for this account. Confirm with the current password and a valid authenticator code.</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label>
                        <span className="mb-1 block text-[10px] font-medium text-muted">Current password</span>
                        <input
                          type="password"
                          value={mfaDisablePassword}
                          onChange={(event) => setMfaDisablePassword(event.target.value)}
                          className="w-full bg-bg"
                          autoComplete="current-password"
                        />
                      </label>
                      <label>
                        <span className="mb-1 block text-[10px] font-medium text-muted">Current MFA code</span>
                        <input
                          value={mfaDisableCode}
                          onChange={(event) => setMfaDisableCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          className="w-full bg-bg font-mono tracking-[0.2em]"
                          placeholder="000000"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <Button type="submit" variant="secondary" loading={mfaLoading} icon={<ShieldCheck size={14} />}>
                        Confirm disable
                      </Button>
                    </div>
                  </form>
                )}

                {mfaMessage && (
                  <div className={'mt-4 rounded-control border px-3 py-2.5 text-[10px] ' + (mfaMessage.success ? 'border-success/20 bg-success/10 text-success' : 'border-danger/20 bg-danger/10 text-danger')} role="status">
                    {mfaMessage.text}
                  </div>
                )}

                {mfaRecoveryCodes && mfaRecoveryCodes.length > 0 && (
                  <div className="mt-4 rounded-control border border-warning/30 bg-warning/10 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold text-fg">Recovery codes</p>
                        <p className="mt-1 text-[10px] leading-5 text-muted">These codes are shown after enrollment. Save them now. Each code can be used once.</p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <button type="button" onClick={() => void copyMfaValue(mfaRecoveryCodes.join('\n'))} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[10px] font-medium text-fg hover:bg-bg">
                          <Copy size={12} />Copy codes
                        </button>
                        <button type="button" onClick={downloadRecoveryCodes} className="inline-flex min-h-9 items-center gap-1.5 rounded-control bg-accent px-3 text-[10px] font-medium text-white hover:bg-accent/90">
                          <Download size={12} />Download
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {mfaRecoveryCodes.map((code) => (
                        <code key={code} className="rounded-control border border-line bg-bg px-3 py-2 text-center font-mono text-[11px] text-fg">{code}</code>
                      ))}
                    </div>
                    <div className="mt-3 flex flex-col gap-3 border-t border-warning/20 pt-3 sm:flex-row sm:items-center sm:justify-between">
                      <label className="flex items-start gap-2 text-[10px] text-muted">
                        <input
                          type="checkbox"
                          checked={mfaRecoverySaved}
                          onChange={(event) => setMfaRecoverySaved(event.target.checked)}
                          className="mt-0.5 accent-accent"
                        />
                        <span>I saved these recovery codes somewhere secure.</span>
                      </label>
                      <button
                        type="button"
                        disabled={!mfaRecoverySaved}
                        onClick={() => setMfaRecoveryCodes(null)}
                        className="inline-flex min-h-9 items-center justify-center rounded-control border border-line bg-panel px-3 text-[10px] font-medium text-muted hover:bg-bg hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-control border border-line bg-bg p-3">
                    <p className="text-[10px] text-muted">Session expiry</p>
                    <p className="mt-1 text-xs font-semibold text-fg">Server enforced</p>
                  </div>
                  <div className="rounded-control border border-line bg-bg p-3">
                    <p className="text-[10px] text-muted">Active users with MFA</p>
                    <p className="mt-1 text-xs font-semibold tabular-nums text-fg">
                      {securityStatus ? securityStatus.mfaEnabledCount + ' / ' + securityStatus.activeUserCount : 'Checking…'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-card border border-line bg-panel p-5">
            <div className="flex flex-col gap-3 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-muted" />
                <div>
                  <h2 className="text-sm font-semibold text-fg">Change account password</h2>
                  <p className="mt-1 text-[10px] leading-4 text-muted">Current password verification is required before the server saves a new password.</p>
                </div>
              </div>
              {securityStatusMessage && (
                <StatusBadge
                  tone={securityStatusMessage.success ? 'success' : 'danger'}
                  label={securityStatusMessage.text}
                  icon={securityStatusMessage.success ? <Check size={13} /> : <AlertCircle size={13} />}
                />
              )}
            </div>

            <form onSubmit={handleUpdateSecurity} data-ams-feature-slug="settings-password-form" data-ams-slug="settings-password-form" className="mt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className="mb-1 block text-[10px] font-medium text-muted">New password</span>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="At least 12 characters"
                    className="w-full bg-bg"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[10px] font-medium text-muted">Confirm new password</span>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Repeat the new password"
                    className="w-full bg-bg"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-[10px] font-medium text-muted">Current password</span>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Enter your current account password"
                  className="w-full bg-bg"
                />
              </label>
              <div className="flex justify-end">
                <Button type="submit" variant="primary" loading={securitySaving} icon={<Save size={14} />}>
                  Update Password
                </Button>
              </div>
            </form>
          </section>

          {canManageAdminAccounts && (
            <>
              <section className="overflow-hidden rounded-card border border-line bg-panel">
                <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <Users size={18} className="text-muted" />
                    <div>
                      <h2 className="text-sm font-semibold text-fg">Admin access accounts</h2>
                      <p className="mt-1 text-[10px] leading-4 text-muted">Roles and permissions remain server-managed.</p>
                    </div>
                  </div>
                  <Button type="button" variant="primary" onClick={handleOpenAddAccount} icon={<UserPlus size={14} />}>
                    Add Account
                  </Button>
                </div>

                {accountsError && accounts.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-danger/20 bg-danger/5 px-5 py-3 text-[11px] text-danger" role="alert">
                    <span>{accountsError} Showing the last successfully loaded accounts.</span>
                    <Button type="button" variant="secondary" onClick={() => void loadAccounts()} disabled={accountsLoading} loading={accountsLoading}>Retry</Button>
                  </div>
                )}
                {accountMessage && (
                  <div className={'border-b px-5 py-3 text-xs ' + (accountMessage.success ? 'border-success/20 bg-success/10 text-success' : 'border-danger/20 bg-danger/10 text-danger')}>
                    {accountMessage.text}
                  </div>
                )}

                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable administrator accounts table">
                  {accountsLoading ? (
                    <div className="px-5 py-10">{renderSkeleton()}</div>
                  ) : pagedAccounts.length === 0 && accountsError ? (
                    <div className="flex min-h-[180px] flex-col items-center justify-center px-5 py-10 text-center" role="alert">
                      <AlertCircle size={22} className="text-danger" />
                      <p className="mt-3 text-sm font-medium text-fg">Admin accounts could not be loaded</p>
                      <p className="mt-1 max-w-md text-xs leading-5 text-muted">{accountsError}</p>
                      <Button type="button" variant="secondary" onClick={() => void loadAccounts()} disabled={accountsLoading} loading={accountsLoading} className="mt-4">Retry</Button>
                    </div>
                  ) : pagedAccounts.length === 0 ? (
                    <div className="flex min-h-[180px] flex-col items-center justify-center px-5 py-10 text-center">
                      <Users size={22} className="text-muted" />
                      <p className="mt-3 text-sm font-medium text-fg">No admin accounts found</p>
                      <p className="mt-1 text-xs leading-5 text-muted">Create the first server-managed account from this section.</p>
                    </div>
                  ) : (
                    <>
                    <div className="grid gap-3 p-3 min-[1280px]:hidden sm:p-4" data-ams-feature-slug="settings-account-cards" role="list" aria-label="Administrator account cards">
                      {pagedAccounts.map((account) => {
                        const masterAccount = account.username === 'admin' || account.stakeholderType === 'Master';
                        return (
                          <article key={account.id} role="listitem" data-ams-slug={'settings-account-card-' + account.id} className="min-w-0 rounded-card border border-line bg-bg p-3.5">
                            <div className="flex min-w-0 items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="break-words text-sm font-semibold text-fg">{account.name}</p>
                                <p className="mt-1 break-words font-mono text-[10px] text-muted">{account.username}</p>
                                <p className="mt-1 break-all text-[10px] text-muted">{account.email}</p>
                              </div>
                              <StatusBadge tone={account.status === 'active' ? 'success' : 'warning'} label={account.status === 'active' ? 'Active' : 'Suspended'} />
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3 border-y border-line py-3">
                              <div className="min-w-0"><p className="text-[10px] text-muted">Role</p><p className="mt-1 break-words text-xs text-fg">{account.role}</p></div>
                              <div className="min-w-0"><p className="text-[10px] text-muted">Division</p><p className="mt-1 break-words text-xs text-fg">{account.division}</p></div>
                              <div className="min-w-0"><p className="text-[10px] text-muted">MFA</p><div className="mt-1"><StatusBadge tone={account.mfaEnabled ? 'success' : 'warning'} label={account.mfaEnabled ? 'Enabled' : 'Not configured'} /></div></div>
                              <div className="min-w-0"><p className="text-[10px] text-muted">Last login (UTC)</p><p className="mt-1 break-words text-xs tabular-nums text-fg">{formatUtc(account.lastLogin)}</p></div>
                            </div>
                            <div className="mt-3 flex justify-end">
                              {isCurrentMaster && !masterAccount ? (
                                <button type="button" onClick={() => { setDeleteAccountMessage(null); setConfirmDelete({ id: account.id, name: account.name }); }} className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-line bg-panel px-3 text-[11px] text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"><Trash2 size={13} />Delete</button>
                              ) : (
                                <span className="text-[10px] text-muted">{masterAccount ? 'Root account' : 'Master access required'}</span>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                    <div className="hidden min-[1280px]:block overflow-x-auto">
                    <table className="settings-system-table min-w-[940px]">
                      <thead>
                        <tr>
                          <th>Account</th>
                          <th>Role</th>
                          <th>Division</th>
                          <th>Status</th>
                          <th>MFA</th>
                          <th>Last login</th>
                          <th className="text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedAccounts.map((account) => {
                          const masterAccount = account.username === 'admin' || account.stakeholderType === 'Master';
                          return (
                            <tr key={account.id}>
                              <td>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-medium text-fg">{account.name}</p>
                                  <p className="mt-1 font-mono text-[10px] text-muted">{account.username} · {account.email}</p>
                                </div>
                              </td>
                              <td className="text-[11px] text-fg">{account.role}</td>
                              <td className="text-[11px] text-muted">{account.division}</td>
                              <td><StatusBadge tone={account.status === 'active' ? 'success' : 'warning'} label={account.status === 'active' ? 'Active' : 'Suspended'} /></td>
                              <td><StatusBadge tone={account.mfaEnabled ? 'success' : 'warning'} label={account.mfaEnabled ? 'Enabled' : 'Not configured'} /></td>
                              <td className="text-[11px] tabular-nums text-muted">{formatUtc(account.lastLogin)}</td>
                              <td className="text-right">
                                {isCurrentMaster && !masterAccount ? (
                                  <button
                                    type="button"
                                    onClick={() => { setDeleteAccountMessage(null); setConfirmDelete({ id: account.id, name: account.name }); }}
                                    className="inline-flex min-h-8 items-center gap-1.5 rounded-control border border-line bg-bg px-2.5 text-[11px] text-muted hover:border-danger/30 hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                  >
                                    <Trash2 size={13} />
                                    Delete
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-muted">{masterAccount ? 'Root account' : 'Master access required'}</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                    </>
                  )}
                </div>

                {!accountsLoading && (
                  <AdminTablePagination
                    total={accounts.length}
                    page={accountPage}
                    pageSize={accountPageSize}
                    onPageChange={setAccountPage}
                    onPageSizeChange={setAccountPageSize}
                    itemLabel="accounts"
                    slug="settings-account-pagination"
                  />
                )}
              </section>

              <section className="overflow-hidden rounded-card border border-line bg-panel">
                <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                  <Layers size={18} className="text-muted" />
                  <div>
                    <h2 className="text-sm font-semibold text-fg">Stakeholder access standards</h2>
                    <p className="mt-1 text-[10px] leading-4 text-muted">Reference matrix for finance, client management, delivery, and system access.</p>
                  </div>
                </div>
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Scrollable stakeholder access matrix">
                  <table className="settings-system-table min-w-[900px]">
                    <thead>
                      <tr>
                        <th>Tier & role</th>
                        <th>Financial & invoicing</th>
                        <th>Client records & leads</th>
                        <th>Sprint & tasks</th>
                        <th>System & cloud API</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="font-semibold text-fg">Stakeholder Executive</td>
                        <td className="text-success">Approval & audit</td>
                        <td className="text-success">Full client-lead visibility</td>
                        <td className="text-warning">Milestone review</td>
                        <td className="text-muted">Governance</td>
                      </tr>
                      <tr>
                        <td className="font-semibold text-fg">Teknisi IT / Systems Engineer</td>
                        <td className="text-muted">No financial access</td>
                        <td className="text-muted">No access</td>
                        <td className="text-success">Technical tasks</td>
                        <td className="text-success">Server & diagnostics</td>
                      </tr>
                      <tr>
                        <td className="font-semibold text-fg">Tier 2: Project Manager</td>
                        <td className="text-warning">View & draft invoices</td>
                        <td className="text-success">Manage pipeline</td>
                        <td className="text-success">Sprint planning</td>
                        <td className="text-muted">View only</td>
                      </tr>
                      <tr>
                        <td className="font-semibold text-fg">Tier 3: Operational Staff</td>
                        <td className="text-muted">No access</td>
                        <td className="text-info">Assigned deals</td>
                        <td className="text-success">Assigned tasks</td>
                        <td className="text-muted">No access</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          )}
        </section>
      )}

      {activeTab === 'integrations' && canAccessServer && (
        <section className="space-y-6">
          <AdminSectionTabs
            ariaLabel="Integration worksheets"
            activeKey={integrationView}
            className="w-full border-b border-line pb-2"
            items={[
              { key: 'overview', label: 'Integration Overview', to: '/admin/settings?tab=integrations' },
              { key: 'website-cms', label: 'Website & CMS Integrations', to: '/admin/settings?tab=integrations&integration=website-cms' },
              { key: 'kopra-h2h', label: 'Bank Mandiri Kopra H2H', to: '/admin/settings?tab=integrations', available: false },
            ]}
          />
          {integrationView === 'overview' ? (
            <>
              <section className="rounded-card border border-line bg-panel p-5">
              <div className="flex items-center gap-2 border-b border-line pb-4">
                <Database size={18} className="text-info" />
                <div>
                  <h2 className="text-sm font-semibold text-fg">Server-managed connections</h2>
                  <p className="mt-1 text-[10px] leading-4 text-muted">Production credentials and endpoints stay outside the browser.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ['Database', productionReadiness?.status?.datasource || 'PostgreSQL', 'Production data source'],
                  ['Document vault', productionReadiness?.gates?.documentStorage ? 'Ready' : 'Check required', 'Storage is server-managed'],
                  ['Notification settings', notificationStatus === 'available' ? 'Available' : notificationStatus === 'unavailable' ? 'Unavailable' : 'Checking', 'Delivery readiness is reported separately below'],
                  ['Backup / DR', securityStatus?.backupFresh ? 'Fresh' : 'Review', 'Restore policy remains infrastructure-managed']
                ].map(([label, value, helper]) => (
                  <div key={String(label)} className="rounded-control border border-line bg-bg p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-muted">{String(label)}</span>
                      <Activity size={13} className="text-muted" />
                    </div>
                    <p className="mt-1 text-sm font-medium text-fg">{String(value)}</p>
                    <p className="mt-1 text-[10px] leading-4 text-muted">{String(helper)}</p>
                  </div>
                ))}
              </div>
              </section>
            </>
          ) : (
            <section className="rounded-card border border-line bg-panel p-5">
              <div className="flex items-center gap-2 border-b border-line pb-4">
                <Palette size={18} className="text-accent-text" />
                <div>
                  <h2 className="text-sm font-semibold text-fg">Brand identity & metadata</h2>
                  <p className="mt-1 text-[10px] leading-4 text-muted">Public metadata is saved through the existing CMS API.</p>
                </div>
              </div>

              <form onSubmit={handleSaveMeta} data-ams-feature-slug="settings-meta-form" data-ams-slug="settings-meta-form" className="mt-4 space-y-3">
                <label>
                  <span className="mb-1 block text-[10px] font-medium text-muted">Site title</span>
                  <input
                    value={metaSettings.siteTitle}
                    onChange={(event) => setMetaSettings({ ...metaSettings, siteTitle: event.target.value })}
                    className="w-full bg-bg"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-[10px] font-medium text-muted">Site description</span>
                  <textarea
                    rows={3}
                    value={metaSettings.siteDescription}
                    onChange={(event) => setMetaSettings({ ...metaSettings, siteDescription: event.target.value })}
                    className="w-full bg-bg"
                  />
                </label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="mb-1 block text-[10px] font-medium text-muted">Notification email</span>
                    <input
                      type="email"
                      value={metaSettings.contactReceiverEmail}
                      onChange={(event) => setMetaSettings({ ...metaSettings, contactReceiverEmail: event.target.value })}
                      className="w-full bg-bg"
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[10px] font-medium text-muted">Default language</span>
                    <CustomSelect
                      value={metaSettings.defaultLanguage}
                      onChange={(value) => setMetaSettings({ ...metaSettings, defaultLanguage: value as 'en' | 'id' })}
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'id', label: 'Bahasa Indonesia' }
                      ]}
                      aria-label="Default language"
                    />
                  </label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="flex min-h-9 items-center gap-2 rounded-control border border-line bg-bg px-3 text-[11px] text-fg">
                    <input
                      type="checkbox"
                      checked={metaSettings.enableSoundAlerts}
                      onChange={(event) => setMetaSettings({ ...metaSettings, enableSoundAlerts: event.target.checked })}
                      className="accent-accent"
                    />
                    Enable sound alerts
                  </label>
                  <label className="flex min-h-9 items-center gap-2 rounded-control border border-line bg-bg px-3 text-[11px] text-fg">
                    <input
                      type="checkbox"
                      checked={metaSettings.enableLiveChat}
                      onChange={(event) => setMetaSettings({ ...metaSettings, enableLiveChat: event.target.checked })}
                      className="accent-accent"
                    />
                    Enable live chat
                  </label>
                </div>
                {metaMessage && <div className={'rounded-control border px-3 py-2.5 text-[11px] ' + (metaMessage.success ? 'border-success/20 bg-success/10 text-success' : 'border-danger/20 bg-danger/10 text-danger')} role={metaMessage.success ? 'status' : 'alert'}>{metaMessage.text}</div>}
                <div className="flex justify-end pt-1">
                  <Button type="submit" variant="primary" loading={metaSaving} icon={<Save size={14} />}>
                    Save changes
                  </Button>
                </div>
              </form>
            </section>
          )}
          {integrationView === 'overview' && (
            <section className="rounded-card border border-line bg-panel p-5">
              <div className="flex items-center gap-2 border-b border-line pb-4">
                <ShieldCheck size={18} className="text-success" />
              <div>
                <h2 className="text-sm font-semibold text-fg">Integration health</h2>
                <p className="mt-1 text-[10px] leading-4 text-muted">Current server-side readiness signals for the production environment.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ['Runtime', Boolean(productionReadiness?.gates?.runtime)],
                ['Encryption', Boolean(productionReadiness?.gates?.encryption)],
                ['MFA', Boolean(productionReadiness?.gates?.mfa)],
                ['Notifications', Boolean(productionReadiness?.gates?.notifications)]
              ].map(([label, ready]) => (
                <div key={String(label)} className="flex items-center justify-between rounded-control border border-line bg-bg px-3 py-3">
                  <span className="text-[10px] text-muted">{String(label)}</span>
                  {ready ? <Check size={14} className="text-success" /> : <AlertCircle size={14} className="text-warning" />}
                </div>
              ))}
            </div>
            </section>
          )}
        </section>
      )}

      <Drawer
        open={isAddAccountModalOpen}
        onClose={() => !isCreatingAccount && setIsAddAccountModalOpen(false)}
        size="lg"
        title="Add admin access account"
        description="Create a server-managed account with the role policy already defined by AMS."
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setIsAddAccountModalOpen(false)} disabled={isCreatingAccount}>
              Cancel
            </Button>
            <Button type="submit" form="add-admin-account-form" variant="primary" loading={isCreatingAccount} disabled={!canManageAdminAccounts}>
              Create account
            </Button>
          </>
        }
      >
        <form id="add-admin-account-form" data-ams-feature-slug="settings-add-account-form" data-ams-slug="settings-add-account-form" onSubmit={submitNewAccount} className="space-y-5">
          <div>
            <label className="mb-2 block text-[10px] font-semibold text-muted">Select stakeholder role</label>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['Stakeholder Executive', 'Executive stakeholder and approval access', Users],
                ['Teknisi IT / Systems Engineer', 'Infrastructure, cloud, and diagnostics', Terminal],
                ['Tier 2: Project Manager (PM)', 'Delivery, pipeline, and task management', Layers],
                ['Tier 3: Operational Staff', 'Assigned operational task access', UserCheck]
              ].map(([role, description, Icon]) => {
                const selected = newAccRole === role;
                const RoleIcon = Icon as React.ComponentType<{ size?: number; className?: string }>;
                return (
                  <button
                    key={String(role)}
                    type="button"
                    onClick={() => handleRoleChangeForNewAccount(role as AdminTier)}
                    className={'rounded-card border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' + (
                      selected
                        ? 'border-accent/30 bg-accent/10'
                        : 'border-line bg-panel hover:bg-bg'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <RoleIcon size={15} className={selected ? 'text-accent-text' : 'text-muted'} />
                      <span className="text-xs font-semibold text-fg">{String(role)}</span>
                    </div>
                    <p className="mt-1 text-[10px] leading-4 text-muted">{String(description)}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {accountFormMessage && (
            <div className={'rounded-control border px-3 py-2.5 text-xs ' + (accountFormMessage.success ? 'border-success/20 bg-success/10 text-success' : 'border-danger/20 bg-danger/10 text-danger')} role={accountFormMessage.success ? 'status' : 'alert'}>
              {accountFormMessage.text}
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-[10px] font-medium text-muted">Full name</span>
              <input required value={newAccName} onChange={(event) => setNewAccName(event.target.value)} className="w-full bg-bg" placeholder="Alexander Hartanto" />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-medium text-muted">Username</span>
              <input required value={newAccUsername} onChange={(event) => setNewAccUsername(event.target.value)} className="w-full bg-bg" placeholder="exec.alex" />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-medium text-muted">Email</span>
              <input required type="email" value={newAccEmail} onChange={(event) => setNewAccEmail(event.target.value)} className="w-full bg-bg" placeholder="alex@kapitech.id" />
            </label>
            <label>
              <span className="mb-1 block text-[10px] font-medium text-muted">Temporary password</span>
              <input required minLength={12} maxLength={128} value={newAccPassword} onChange={(event) => setNewAccPassword(event.target.value)} className="w-full bg-bg" />
            </label>
          </div>

          <div className="rounded-control border border-line bg-bg p-4">
            <div className="flex items-start gap-2">
              <ShieldAlert size={15} className="mt-0.5 text-info" />
              <div>
                <p className="text-[11px] font-semibold text-fg">Server-managed role policy</p>
                <p className="mt-1 text-[10px] leading-5 text-muted">Permissions are applied by the server from the selected role. The browser does not override the access policy.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-badge border border-line bg-panel px-2 py-1 text-[10px] font-medium text-muted">{newAccRole}</span>
              <span className="rounded-badge border border-info/20 bg-info/10 px-2 py-1 text-[10px] font-medium text-info">{newAccDivision}</span>
            </div>
          </div>
        </form>
      </Drawer>

      <Modal
        open={Boolean(confirmDelete)}
        onClose={() => { if (!isDeletingAccount) setConfirmDelete(null); }}
        busy={isDeletingAccount}
        size="sm"
        title="Delete admin account?"
        description={confirmDelete ? 'Remove ' + confirmDelete.name + ' from the server-managed account list.' : 'Remove this admin account.'}
        footer={
          <>
            <Button type="button" variant="secondary" onClick={() => setConfirmDelete(null)} disabled={isDeletingAccount}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={() => void confirmDeleteAccount()} loading={isDeletingAccount}>
              Delete
            </Button>
          </>
        }
      >
        {deleteAccountMessage && <div className="mb-3 rounded-control border border-danger/20 bg-danger/10 px-3 py-2.5 text-xs text-danger" role="alert">{deleteAccountMessage}</div>}
        <div className="rounded-card border border-danger/20 bg-danger/5 p-4 text-xs text-muted">
          This action removes the account. Confirm the account name before continuing.
        </div>
      </Modal>

      <span className="sr-only" aria-live="polite">
        {overviewMessage?.text || overviewLoadError || accountMessage?.text || accountFormMessage?.text || deleteAccountMessage || metaMessage?.text || securityStatusMessage?.text || auditError || accountsError || ''}
      </span>
    </AdminPageShell>
  );
};

export default AdminSettings;
