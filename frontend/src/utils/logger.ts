/**
 * Logger Centralizado del Frontend - Escuela de Idiomas del Ejército (EIE · CEDMIL)
 * Captura y transmite logs de interfaz, navegación, telemetría y excepciones al backend.
 */

export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'AUDIT';

export interface ClientLogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  action: string;
  context?: Record<string, any>;
  userId?: number | null;
}

declare global {
  interface Window {
    __eie_client_logs?: ClientLogEntry[];
  }
}

class ClientLogger {
  private inMemoryLogs: ClientLogEntry[] = [];
  private maxBuffer = 100;
  private isBrowser = typeof window !== 'undefined';

  constructor() {
    if (this.isBrowser) {
      if (!window.__eie_client_logs) {
        window.__eie_client_logs = this.inMemoryLogs;
      }
      this.initGlobalErrorHandler();
    }
  }

  private initGlobalErrorHandler() {
    if (!this.isBrowser) return;

    window.addEventListener('error', (event) => {
      this.error('CLIENT_UNCAUGHT_EXCEPTION', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack || null,
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.error('CLIENT_UNHANDLED_PROMISE_REJECTION', {
        reason: typeof event.reason === 'object' ? event.reason?.message || JSON.stringify(event.reason) : String(event.reason),
        stack: event.reason?.stack || null,
      });
    });
  }

  private emit(level: LogLevel, action: string, context?: Record<string, any>, userId?: number | null) {
    const timestamp = new Date().toISOString();
    const entry: ClientLogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp,
      level,
      action,
      context,
      userId,
    };

    // Almacenamiento en búfer local
    this.inMemoryLogs.unshift(entry);
    if (this.inMemoryLogs.length > this.maxBuffer) {
      this.inMemoryLogs.pop();
    }

    // Impresión en consola de desarrollo con formato militar
    if (process.env.NODE_ENV !== 'production' || level === 'ERROR' || level === 'CRITICAL') {
      const styleMap: Record<LogLevel, string> = {
        DEBUG: 'color: #94a3b8; font-weight: normal;',
        INFO: 'color: #38bdf8; font-weight: bold;',
        WARNING: 'color: #fbbf24; font-weight: bold;',
        ERROR: 'color: #f87171; font-weight: bold;',
        CRITICAL: 'color: #ffffff; background: #dc2626; padding: 2px 5px; font-weight: bold;',
        AUDIT: 'color: #a855f7; font-weight: bold;',
      };

      console.log(
        `%c[EIE-CLIENT ${level}] %c${action}`,
        styleMap[level] || '',
        'color: #e2e8f0;',
        context || ''
      );
    }

    // Transmisión asíncrona al backend
    if (this.isBrowser) {
      this.sendToServer(entry).catch(() => {
        // Silencio intencional para no causar bucles infinitos
      });
    }
  }

  private async sendToServer(entry: ClientLogEntry): Promise<void> {
    try {
      await fetch('/api/v1/logs/frontend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          level: entry.level,
          action: entry.action,
          context: entry.context,
          userId: entry.userId,
        }),
      });
    } catch {
      // Ignorar fallas de red para evitar interferir con la navegación del usuario
    }
  }

  public debug(action: string, context?: Record<string, any>, userId?: number | null) {
    this.emit('DEBUG', action, context, userId);
  }

  public info(action: string, context?: Record<string, any>, userId?: number | null) {
    this.emit('INFO', action, context, userId);
  }

  public warn(action: string, context?: Record<string, any>, userId?: number | null) {
    this.emit('WARNING', action, context, userId);
  }

  public error(action: string, context?: Record<string, any>, userId?: number | null) {
    this.emit('ERROR', action, context, userId);
  }

  public critical(action: string, context?: Record<string, any>, userId?: number | null) {
    this.emit('CRITICAL', action, context, userId);
  }

  public audit(action: string, context?: Record<string, any>, userId?: number | null) {
    this.emit('AUDIT', action, context, userId);
  }

  public getRecentLogs(): ClientLogEntry[] {
    return [...this.inMemoryLogs];
  }
}

export const logger = new ClientLogger();
export default logger;
