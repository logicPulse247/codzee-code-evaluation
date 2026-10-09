'use client';

import React from 'react';

export function LoadingSkeleton({ className = '' }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#1C1C20] border border-[#26262C] ${className}`}
    />
  );
}
