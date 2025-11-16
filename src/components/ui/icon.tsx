"use client";

import React, { useState, useEffect } from 'react';
import type { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

interface IconProps extends LucideProps {
  name: keyof typeof dynamicIconImports;
}

const fallback = <div style={{ background: 'transparent', width: 24, height: 24 }}/>;

const Icon = ({ name, ...props }: IconProps) => {
  const [LucideIcon, setLucideIcon] = useState<React.ComponentType<LucideProps> | null>(null);

  useEffect(() => {
    const importIcon = async () => {
      try {
        const importer = dynamicIconImports[name];
        const { default: SvgIcon } = await importer();
        setLucideIcon(() => SvgIcon);
      } catch (error) {
        // You can handle the error here, e.g., by setting a default icon
        console.error(`Failed to load icon: ${name}`, error);
      }
    };

    importIcon();
  }, [name]);

  if (!LucideIcon) {
    return fallback;
  }

  return <LucideIcon {...props} />;
};

export { Icon };
