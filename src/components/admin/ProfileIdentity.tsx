import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  Building2,
  CalendarDays,
  Check,
  Copy,
  ExternalLink,
  Mail,
  LogOut,
  Phone,
  UserRound,
} from 'lucide-react';
import Button from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Drawer } from '../ui/Drawer';
import UserAvatar from './UserAvatar';

export interface PublicProfileData {
  id?: string;
  name: string;
  role?: string;
  division?: string;
  contextLabel?: string;
  username?: string;
  companyEmail?: string;
  personalEmail?: string;
  phone?: string;
  additionalPhone?: string;
  bio?: string;
  avatarUrl?: string | null;
  lastActive?: string;
  status?: 'active' | 'away' | 'offline';
}

interface ProfileIdentityProps {
  profile: PublicProfileData;
  size?: 'sm' | 'md' | 'lg';
  compact?: boolean;
  className?: string;
  showRole?: boolean;
  onEdit?: () => void;
  onLogout?: () => void;
  directOpen?: boolean;
  actionMenu?: boolean;
  slug?: string;
}

const statusClass: Record<NonNullable<PublicProfileData['status']>, string> = {
  active: 'border-success/20 bg-success/10 text-success',
  away: 'border-warning/20 bg-warning/10 text-warning',
  offline: 'border-line bg-bg text-muted',
};

const statusLabel: Record<NonNullable<PublicProfileData['status']>, string> = {
  active: 'Active',
  away: 'Away',
  offline: 'Offline',
};

const formatLastActive = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getProfileCompleteness = (profile: PublicProfileData) => {
  const fields = [
    Boolean(profile.name.trim()),
    Boolean(profile.avatarUrl),
    Boolean(profile.role),
    Boolean(profile.division),
    Boolean(profile.companyEmail),
    Boolean(profile.bio?.trim())
  ];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
};

const copyProfileValue = async (value: string) => {
  if (!value) return false;
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

export const ProfileIdentity: React.FC<ProfileIdentityProps> = ({
  profile,
  size = 'md',
  compact = false,
  className,
  showRole = true,
  onEdit,
  onLogout,
  directOpen = false,
  actionMenu = false,
  slug = 'profile',
}) => {
  const [quickOpen, setQuickOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [fullOpen, setFullOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const status = profile.status;
  const hasContact = Boolean(
    profile.companyEmail || profile.personalEmail || profile.phone || profile.additionalPhone
  );
  const formattedLastActive = formatLastActive(profile.lastActive);
  const completeness = useMemo(() => getProfileCompleteness(profile), [profile]);

  const handleCopy = async (key: string, value: string) => {
    if (!(await copyProfileValue(value))) return;
    setCopied(key);
    window.setTimeout(() => setCopied(current => current === key ? null : current), 1400);
  };

  const openFullProfile = () => {
    setMenuOpen(false);
    setQuickOpen(false);
    setFullOpen(true);
  };

  const handleProfileClick = () => {
    if (actionMenu) {
      setMenuOpen((open) => !open);
      return;
    }
    if (directOpen) {
      setFullOpen(true);
      return;
    }
    setQuickOpen(true);
  };

  const closeAll = () => {
    setMenuOpen(false);
    setQuickOpen(false);
    setFullOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        type="button"
        data-ams-feature-slug={slug}
        data-ams-slug={slug}
        onClick={handleProfileClick}
        className={[
          'group/profile inline-flex min-w-0 items-center text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          compact
            ? 'rounded-full'
            : 'gap-2 rounded-control px-1.5 py-1 hover:bg-panel-hover',
          className || '',
        ].join(' ')}
        aria-haspopup={actionMenu ? 'menu' : 'dialog'}
        aria-expanded={actionMenu ? menuOpen : undefined}
        aria-controls={actionMenu ? slug + '-action-menu' : undefined}
        aria-label={actionMenu ? 'Open profile menu for ' + profile.name : 'Open profile for ' + profile.name}
      >
        <UserAvatar
          name={profile.name}
          imageUrl={profile.avatarUrl}
          size={size}
          online={status === 'active'}
        />
        {!compact && (
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-fg group-hover/profile:underline group-hover/profile:decoration-line group-hover/profile:underline-offset-2">
              {profile.name}
            </span>
            {showRole && profile.role && (
              <span className="mt-0.5 block truncate text-[10px] text-muted">{profile.role}</span>
            )}
          </span>
        )}
      </button>

      {actionMenu && menuOpen && (
        <div
          id={slug + '-action-menu'}
          role="menu"
          aria-label="Profile actions"
          data-ams-feature-slug={slug + '-action-menu'}
          className="absolute right-0 top-full z-[70] mt-2 w-52 overflow-hidden rounded-card border border-line bg-panel shadow-lg"
        >
          <div className="border-b border-line px-3.5 py-3">
            <p className="truncate text-xs font-semibold text-fg">{profile.name}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted">{profile.role || 'AMS user'}</p>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={() => { setMenuOpen(false); setFullOpen(true); }}
            className="flex min-h-10 w-full items-center gap-2.5 px-3.5 text-left text-xs text-fg transition-colors hover:bg-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
          >
            <UserRound size={14} aria-hidden="true" />
            My Profile
          </button>
          {onLogout && (
            <button
              type="button"
              role="menuitem"
              onClick={() => { setMenuOpen(false); onLogout(); }}
              className="flex min-h-10 w-full items-center gap-2.5 border-t border-line px-3.5 text-left text-xs text-muted transition-colors hover:bg-danger/10 hover:text-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
            >
              <LogOut size={14} aria-hidden="true" />
              Logout
            </button>
          )}
        </div>
      )}

      <Modal
        open={quickOpen}
        onClose={() => setQuickOpen(false)}
        size="sm"
        slug={slug + '-quick-view'}
        title="Profile"
        description="Quick profile overview."
        footer={(
          <>
            <Button type="button" variant="secondary" onClick={() => setQuickOpen(false)}>
              Close
            </Button>
            <Button
              type="button"
              variant="primary"
              icon={<ExternalLink size={14} />}
              onClick={openFullProfile}
            >
              View full profile
            </Button>
          </>
        )}
      >
        <div className="space-y-3" data-ams-feature-slug={slug + '-quick-view'}>
          <section className="rounded-card border border-line bg-bg p-4" data-ams-slug={slug + '-quick-identity'}>
            <div className="flex items-start gap-3">
              <UserAvatar
                name={profile.name}
                imageUrl={profile.avatarUrl}
                size="lg"
                online={status === 'active'}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="min-w-0 truncate text-sm font-semibold text-fg">{profile.name}</h3>
                  {status && (
                    <span className={"rounded-badge border px-1.5 py-0.5 text-[9px] font-semibold " + (status ? statusClass[status] : "")}>
                      {statusLabel[status]}
                    </span>
                  )}
                </div>
                {profile.role && <p className="mt-1 text-xs text-muted">{profile.role}</p>}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {profile.division && (
                    <span className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-panel px-2 py-1 text-[10px] text-muted">
                      <Building2 size={11} />
                      {profile.division}
                    </span>
                  )}
                  {profile.contextLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-panel px-2 py-1 text-[10px] text-muted">
                      {profile.contextLabel}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-card border border-line bg-panel p-3.5" data-ams-slug={slug + '-quick-completeness'}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Profile completeness</div>
                <div className="mt-1 text-xs font-medium text-fg">{completeness}% ready</div>
              </div>
              <span className="text-[10px] text-muted">{completeness === 100 ? 'Complete' : 'Review profile details'}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: completeness + '%' }} />
            </div>
          </section>

          {(profile.companyEmail || profile.phone || profile.bio) && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {profile.companyEmail && (
                <div className="rounded-control border border-line bg-bg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
                      <Mail size={11} />
                      Email
                    </div>
                    <button type="button" data-ams-slug={slug + '-quick-copy-email'} className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-muted hover:text-fg" aria-label="Copy company email" onClick={() => void handleCopy('quick-email', profile.companyEmail || '')}>
                      {copied === 'quick-email' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="mt-1 break-all text-xs font-medium text-fg">{profile.companyEmail}</div>
                    <button type="button" data-ams-slug={slug + '-public-copy-email'} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-control border border-line bg-bg text-muted hover:text-fg" aria-label="Copy company email" onClick={() => void handleCopy('public-email', profile.companyEmail || '')}>
                      {copied === 'public-email' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              )}
              {profile.phone && (
                <div className="rounded-control border border-line bg-bg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
                      <Phone size={11} />
                      Phone
                    </div>
                    <button type="button" data-ams-slug={slug + '-quick-copy-phone'} className="flex h-7 w-7 items-center justify-center rounded-control border border-line bg-panel text-muted hover:text-fg" aria-label="Copy phone" onClick={() => void handleCopy('quick-phone', profile.phone || '')}>
                      {copied === 'quick-phone' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="mt-1 text-xs font-medium text-fg">{profile.phone}</div>
                </div>
              )}
              {profile.bio && (
                <div className="rounded-card border border-line bg-bg p-3.5 sm:col-span-2">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">
                    <UserRound size={12} />
                    About
                  </div>
                  <p className="mt-2 text-xs leading-5 text-muted line-clamp-3">{profile.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      <Drawer
        open={fullOpen}
        onClose={closeAll}
        size="xl"
        slug={slug + '-public'}
        title="Public profile"
        description="Complete profile information available within your current AMS visibility scope."
        footer={(
          <>
            <Button type="button" variant="secondary" slug={slug + '-public-close'} onClick={closeAll}>
              Close
            </Button>
            {onEdit && (
              <Button
                type="button"
                variant="primary"
                slug={slug + '-public-edit'}
                onClick={() => {
                  closeAll();
                  onEdit();
                }}
              >
                Edit profile
              </Button>
            )}
            {onLogout && (
              <Button
                type="button"
                variant="destructive"
                slug={slug + '-public-logout'}
                icon={<LogOut size={14} />}
                onClick={() => {
                  closeAll();
                  onLogout();
                }}
              >
                Sign out
              </Button>
            )}
          </>
        )}
      >
        <div className="space-y-4" data-ams-feature-slug={slug + '-public-profile'}>
          <section className="rounded-card border border-line bg-bg p-5" data-ams-slug={slug + '-public-identity'}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <UserAvatar
                name={profile.name}
                imageUrl={profile.avatarUrl}
                size="lg"
                online={status === 'active'}
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-fg">{profile.name}</h2>
                  {status && (
                    <span className={"rounded-badge border px-2 py-0.5 text-[10px] font-semibold " + (status ? statusClass[status] : "")}>
                      {statusLabel[status]}
                    </span>
                  )}
                </div>
                {profile.role && <p className="mt-1 text-sm text-muted">{profile.role}</p>}
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.division && (
                    <span className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-panel px-2.5 py-1 text-[10px] font-medium text-muted">
                      <Building2 size={12} />
                      {profile.division}
                    </span>
                  )}
                  {profile.contextLabel && (
                    <span className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-panel px-2.5 py-1 text-[10px] font-medium text-muted">
                      {profile.contextLabel}
                    </span>
                  )}
                  {profile.username && (
                    <span className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-panel px-2.5 py-1 text-[10px] font-medium text-muted">
                      <UserRound size={12} />
                      {profile.username}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-card border border-line bg-panel p-3.5" data-ams-slug={slug + '-public-completeness'}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">Profile completeness</div>
                <div className="mt-1 text-xs font-medium text-fg">{completeness}% ready</div>
              </div>
              <span className="text-[10px] text-muted">{completeness === 100 ? 'Complete profile' : 'Some optional details are missing'}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line">
              <div className="h-full rounded-full bg-accent" style={{ width: completeness + '%' }} />
            </div>
          </section>

          {profile.bio && (
            <section className="rounded-card border border-line bg-panel p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted">
                  <UserRound size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-fg">About</h3>
                  <p className="mt-0.5 text-[10px] text-muted">Professional profile information.</p>
                </div>
              </div>
              <p className="text-xs leading-6 text-muted">{profile.bio}</p>
            </section>
          )}

          {(profile.role || profile.division || profile.contextLabel || profile.id) && (
            <section className="rounded-card border border-line bg-panel p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted">
                  <Briefcase size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-fg">Work context</h3>
                  <p className="mt-0.5 text-[10px] text-muted">Profile and organizational context currently available.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.role && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Role</div>
                    <div className="mt-1 text-xs font-medium text-fg">{profile.role}</div>
                  </div>
                )}
                {profile.division && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Division</div>
                    <div className="mt-1 text-xs font-medium text-fg">{profile.division}</div>
                  </div>
                )}
                {profile.contextLabel && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Context</div>
                    <div className="mt-1 text-xs font-medium text-fg">{profile.contextLabel}</div>
                  </div>
                )}
                {profile.id && (
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Profile ID</div>
                    <div className="mt-1 break-all text-xs font-medium text-fg">{profile.id}</div>
                  </div>
                )}
              </div>
            </section>
          )}

          {hasContact && (
            <section className="rounded-card border border-line bg-panel p-4">
              <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted">
                  <Mail size={15} />
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-fg">Contact</h3>
                  <p className="mt-0.5 text-[10px] text-muted">Contact details available within the current profile scope.</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {profile.companyEmail && (
                  <div className="rounded-control border border-line bg-bg p-3">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Company email</div>
                    <div className="mt-1 break-all text-xs font-medium text-fg">{profile.companyEmail}</div>
                  </div>
                )}
                {profile.personalEmail && (
                  <div className="rounded-control border border-line bg-bg p-3">
                    <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Personal email</div>
                    <div className="mt-1 break-all text-xs font-medium text-fg">{profile.personalEmail}</div>
                  </div>
                )}
                {profile.phone && (
                  <div className="rounded-control border border-line bg-bg p-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-muted">
                      <Phone size={11} />
                      Primary phone
                    </div>
                    <div className="mt-1 text-xs font-medium text-fg">{profile.phone}</div>
                  </div>
                )}
                {profile.additionalPhone && (
                  <div className="rounded-control border border-line bg-bg p-3">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-muted">
                      <Phone size={11} />
                      Additional phone
                    </div>
                    <div className="mt-1 text-xs font-medium text-fg">{profile.additionalPhone}</div>
                  </div>
                )}
              </div>
            </section>
          )}

          {formattedLastActive && (
            <section className="rounded-card border border-line bg-bg p-4">
              <div className="flex items-start gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted">
                  <CalendarDays size={14} />
                </div>
                <div className="min-w-0">
                  <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Last active</div>
                  <div className="mt-1 text-xs font-medium text-fg">{formattedLastActive}</div>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-card border border-line bg-bg p-4" data-ams-slug={slug + '-public-visibility'}>
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-accent/20 bg-accent/8 text-accent-text">
                <UserRound size={15} />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-fg">Profile visibility</div>
                <p className="mt-1 text-[11px] leading-5 text-muted">This drawer shows the professional identity shared inside AMS. Private contact fields remain available from Edit profile.</p>
              </div>
            </div>
          </section>

          {!profile.bio &&
            !profile.role &&
            !profile.division &&
            !profile.contextLabel &&
            !profile.username &&
            !hasContact &&
            !formattedLastActive &&
            !profile.id && (
              <section className="rounded-card border border-line bg-bg p-4">
                <p className="text-xs leading-5 text-muted">
                  Only the profile identity is currently available in this module.
                </p>
              </section>
            )}
        </div>
      </Drawer>
    </div>
  );
};

export default ProfileIdentity;
