import { cn } from '@/lib/utils';
import React from 'react';
import Image from 'next/image';

const logoUrl = "https://www.shalomtreks.com/Logo.png";

export const Logo = ({ className, width = 256, height = 54 }: { className?: string, width?: number, height?: number }) => (
  <Image
    src={logoUrl}
    alt="Shalom Treks Logo"
    width={width}
    height={height}
    className={cn(className)}
    priority
  />
);
