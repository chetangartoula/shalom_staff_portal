import { cn } from '@/lib/utils';
import React from 'react';

export const Logo = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 256 256"
    className={cn('h-6 w-6', className)}
    {...props}
  >
    <path
      fill="currentColor"
      d="M232.49,199.43,149.81,39.92a14,14,0,0,0-25.21,0L40.92,199.43a14,14,0,0,0,12.6,20.57H219.88A14,14,0,0,0,232.49,199.43ZM152.23,152l-24.24,42L103.77,152Zm-46.7-64,24.23,42,24.24-42Z"
    />
  </svg>
);
