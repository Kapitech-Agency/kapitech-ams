import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  CalendarDays,
  ExternalLink,
  Mail,
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
  directOpen?: boolean;
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

export const ProfileIdentity: React.FC<ProfileIdentityProps> = ({
  profile,
  size = 'md',
  compact = false,
  className,
  showRole = true,
  onEdit,
  directOpen = false,
  slug = 'profile',
}) => {
  const [quickOpen, setQuickOpen] = useState(false);
  const [fullOpen, setFullOpen] = useState(false);

  const status = profile.status;
  const hasContact = Boolean(
    profile.companyEmail || profile.personalEmail || profile.phone || profile.additionalPhone
  );
  const formattedLastActive = formatLastActive(profile.lastActive);

  const openFullProfile = () => {
    setQuickOpen(false);
    setFullOpen(true);
  };

  const handleProfileClick = () => {
    if (directOpen) {
      setFullOpen(true);
      return;
    }
    setQuickOpen(true);
  };

  const closeAll = () => {
    setQuickOpen(false);
    setFullOpen(false);
  };

  return (
    <>
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
        aria-haspopup="dialog"
        aria-label={'Open profile for ' + profile.name}
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
        <div className="space-y-3">
          <section className="rounded-card border border-line bg-bg p-4">
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

          {(profile.companyEmail || profile.phone || profile.bio) && (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {profile.companyEmail && (
                <div className="rounded-control border border-line bg-bg p-3">
                  <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
                    <Mail size={11} />
                    Email
                  </div>
                  <div className="mt-1 break-all text-xs font-medium text-fg">{profile.companyEmail}</div>
                </div>
              )}
              {profile.phone && (
                <div className="rounded-control border border-line bg-bg p-3">
                  <div className="flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-muted">
                    <Phone size={11} />
                    Phone
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
          </>
        )}
      >
        <div className="space-y-4">
          <section className="rounded-card border border-line bg-bg p-5">
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
    </>
  );
};

export default ProfileIdentity;
