import React, { useMemo } from 'react';
import {
  Briefcase,
  Building2,
  CalendarDays,
  Edit3,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react';
import { Drawer } from '../ui/Drawer';
import Button from '../ui/Button';
import UserAvatar from './UserAvatar';
import { getAdminSession } from '../../lib/adminAuth';

interface UserProfilePublicDrawerProps {
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
  displayName: string;
  title: string;
  slug?: string;
}

const formatLastLogin = (value?: string) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const UserProfilePublicDrawer: React.FC<UserProfilePublicDrawerProps> = ({
  open,
  onClose,
  onEdit,
  displayName,
  title,
  slug = 'profile-public'
}) => {
  const session = getAdminSession();
  const user = session?.user;

  const profile = useMemo(() => ({
    name: String(user?.profileDisplayName || user?.name || displayName || 'AMS member'),
    role: String(user?.role || title || 'AMS member'),
    division: String(user?.division || 'Operations'),
    username: String(user?.username || '—'),
    companyEmail: String(user?.email || '—'),
    personalEmail: String(user?.personalEmail || ''),
    phone: String(user?.phone || ''),
    additionalPhone: String(user?.additionalPhone || ''),
    bio: String(user?.bio || ''),
    avatarUrl: user?.avatarUrl || null,
    lastLogin: String(user?.lastLogin || ''),
  }), [user, displayName, title]);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      size="lg"
      slug={slug}
      title="Public profile"
      description="The profile view other AMS users see for your workspace identity."
      footer={(
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="primary" icon={<Edit3 size={14} />} onClick={onEdit}>
            Edit profile
          </Button>
        </>
      )}
    >
      <div className="space-y-4" data-ams-feature-slug={slug}>
        <section className="rounded-card border border-line bg-panel p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <UserAvatar name={profile.name} imageUrl={profile.avatarUrl} size="lg" online />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold text-fg">{profile.name}</h2>
                <span className="rounded-badge border border-success/20 bg-success/10 px-2 py-0.5 text-[10px] font-semibold text-success">
                  Active
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">{profile.role}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-medium text-muted">
                  <Building2 size={12} />
                  {profile.division}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-badge border border-line bg-bg px-2 py-1 text-[10px] font-medium text-muted">
                  <UserRound size={12} />
                  {profile.username}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div data-ams-drawer-layout="sections" className="grid gap-4 lg:grid-cols-2">
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
            <p className="text-xs leading-6 text-muted">
              {profile.bio || 'No professional bio has been added yet.'}
            </p>
          </section>

          <section className="rounded-card border border-line bg-panel p-4">
            <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted">
                <Briefcase size={15} />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-fg">Work context</h3>
                <p className="mt-0.5 text-[10px] text-muted">Role and workspace identity.</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Role</div>
                <div className="mt-1 text-xs font-medium text-fg">{profile.role}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Division</div>
                <div className="mt-1 text-xs font-medium text-fg">{profile.division}</div>
              </div>
            </div>
          </section>
        </div>

        <section className="rounded-card border border-line bg-panel p-4">
          <div className="mb-4 flex items-center gap-2 border-b border-line pb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-control border border-line bg-bg text-muted">
              <Mail size={15} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-fg">Contact</h3>
              <p className="mt-0.5 text-[10px] text-muted">Contact details shown on your profile.</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Company email</div>
              <div className="mt-1 break-all text-xs font-medium text-fg">{profile.companyEmail}</div>
            </div>
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Personal email</div>
              <div className="mt-1 break-all text-xs font-medium text-fg">{profile.personalEmail || 'Not added'}</div>
            </div>
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-muted">
                <Phone size={11} />
                Primary phone
              </div>
              <div className="mt-1 text-xs font-medium text-fg">{profile.phone || 'Not added'}</div>
            </div>
            <div className="rounded-control border border-line bg-bg p-3">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em] text-muted">
                <Phone size={11} />
                Additional phone
              </div>
              <div className="mt-1 text-xs font-medium text-fg">{profile.additionalPhone || 'Not added'}</div>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-line bg-bg p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted">
                <CalendarDays size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Last active</div>
                <div className="mt-1 text-xs font-medium text-fg">{formatLastLogin(profile.lastLogin)}</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control border border-line bg-panel text-muted">
                <UserRound size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[0.08em] text-muted">Username</div>
                <div className="mt-1 truncate text-xs font-medium text-fg">{profile.username}</div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-card border border-accent/20 bg-accent/5 p-4">
          <div className="flex items-start gap-3">
            <UserAvatar name={profile.name} imageUrl={profile.avatarUrl} size="md" />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-fg">Profile preview</div>
              <p className="mt-1 text-[11px] leading-5 text-muted">
                This is the information presented from your AMS profile identity. Edit the profile to update your photo, name, contact details, and professional bio.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Drawer>
  );
};

export default UserProfilePublicDrawer;
