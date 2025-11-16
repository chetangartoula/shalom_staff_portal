"use client";

import React, { lazy, Suspense } from 'react';
import type { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

interface IconProps extends LucideProps {
  name: keyof typeof dynamicIconImports;
}

const fallback = <div style={{ background: 'transparent', width: 24, height: 24 }}/>

const Icon = ({ name, ...props }: IconProps) => {
  const LucideIcon = lazy(() => dynamicIconImports[name]());

  return (
    <Suspense fallback={fallback}>
      <LucideIcon {...props} />
    </Suspense>
  );
};

export { Icon };
