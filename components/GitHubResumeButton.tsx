"use client";

import React from 'react';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface GitHubResumeButtonProps {
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  disabled?: boolean;
  children?: React.ReactNode;
}

export default function GitHubResumeButton({ 
  onClick, 
  className, 
  variant = 'default',
  size = 'default',
  disabled = false,
  children 
}: GitHubResumeButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn(
        "flex items-center gap-2 transition-all duration-200",
        "hover:scale-105 active:scale-95",
        className
      )}
    >
      <Github className="h-4 w-4" />
      {children || "Build from GitHub"}
    </Button>
  );
}