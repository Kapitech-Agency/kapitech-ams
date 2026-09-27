import React from 'react';
import { cn } from '../../lib/cn';

export interface UserAvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  online?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8 text-[10px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-14 w-14 text-sm'
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  imageUrl,
  size = 'md',
  online = false,
  className
}) => {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <div className={cn('relative shrink-0', className)}>
      <div className={cn(
        sizeClasses[size],
        'overflow-hidden rounded-full border border-line bg-accent/15 text-accent-text font-semibold flex items-center justify-center'
      )}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          initials || 'U'
        )}
      </div>
      {online && (
        <span
          aria-label="Online"
          title="Online"
          className="absolute bottom-0 right-0 h-2.5 w-2.5 translate-x-[1px] translate-y-[1px] rounded-full border-2 border-panel bg-success"
        />
      )}
    </div>
  );
};

export default UserAvatar;
