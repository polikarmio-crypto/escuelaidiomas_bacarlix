'use client';

import React from 'react';
import { SessionProvider } from 'next-auth/react';
import { AuthRoleProvider } from '@/context/AuthRoleContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthRoleProvider>
        {children}
      </AuthRoleProvider>
    </SessionProvider>
  );
}
