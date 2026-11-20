import './globals.css';
import type { Metadata } from 'next';
import AppShell from '../components/AppShell';
import Providers from '../components/Providers';

export const metadata: Metadata = {
  title: 'Escuela de Idiomas del Ejército | SACA',
  description: 'Sistema de Gestión Académica - Escuela de Idiomas del Ejército de Bolivia',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var t = localStorage.getItem('eie_theme');
                if (t === 'dark' || t === 'high-contrast') {
                  document.documentElement.setAttribute('data-theme', t);
                  document.documentElement.classList.add('dark');
                } else if (t === 'light') {
                  document.documentElement.setAttribute('data-theme', 'light');
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
