import React from 'react';
import { cn } from '../../lib/cn';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => (
  <div
    aria-hidden="true"
    className={cn('animate-pulse rounded-control bg-line/70', className)}
    {...props}
  />
);

export default Skeleton;
