'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Shield,
  ShieldAlert,
  GraduationCap,
  Landmark,
  Package,
  Database,
  Globe,
  Cpu,
  Folder,
  FileText,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Filter,
  Terminal,
  Activity,
  AlertTriangle,
  Info,
  Clock,
  User,
  Sliders,
  Sparkles,
  Layers,
  X
} from 'lucide-react';
import { logger } from '@/utils/logger';

interface LogFolder {
  id: string;
  name: string;
  system: string;
  scope: 'backend' | 'frontend' | 'quarkus';
  description: string;
  icon: string;
  color: string;
  file_count: number;
  total_bytes: number;
  total_human: string;
  latest_file: string | null;
  latest_activity: string | null;
}

interface LogFile {
  filename: string;
  size_bytes: number;
  size_human: string;
  updated_at: string;
  is_today: boolean;
}

interface LogEntry {
  id: number;
  format: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' | 'AUDIT';
  action: string;
  user: string;
  ip: string;
  context: any;
  message: string;
  stacktrace?: string[] | null;
  raw: string;
}

interface Counters {
  ALL: number;
  INFO: number;
  WARNING: number;
  ERROR: number;
  DEBUG: number;
  CRITICAL: number;
  AUDIT: number;
}

export default function LogsViewerPage() {
  // Estado de carpetas y navegación
  const [folders, setFolders] = useState<LogFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('auth');
  const [files, setFiles] = useState<LogFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('');

  // Estado de entradas y filtros
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [counters, setCounters] = useState<Counters>({
    ALL: 0,
    INFO: 0,
    WARNING: 0,
    ERROR: 0,
    DEBUG: 0,
    CRITICAL: 0,
    AUDIT: 0,
  });
  const [selectedLevel, setSelectedLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(50);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalEntries, setTotalEntries] = useState<number>(0);
  const [filteredEntries, setFilteredEntries] = useState<number>(0);

  // Estados de carga y operaciones
  const [loadingFolders, setLoadingFolders] = useState<boolean>(true);
  const [loadingEntries, setLoadingEntries] = useState<boolean>(false);
  const [generatingTest, setGeneratingTest] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [expandedContexts, setExpandedContexts] = useState<Record<number, boolean>>({});
  const [expandedTraces, setExpandedTraces] = useState<Record<number, boolean>>({});
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [showPurgeModal, setShowPurgeModal] = useState<boolean>(false);
  const [purging, setPurging] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mapeo de iconos dinámicos
  const renderFolderIcon = (iconName: string, color: string) => {
    const props = { className: 'w-5 h-5', style: { color } };
    switch (iconName) {
      case 'Shield': return <Shield {...props} />;
      case 'GraduationCap': return <GraduationCap {...props} />;
      case 'Landmark': return <Landmark {...props} />;
      case 'Package': return <Package {...props} />;
      case 'Database': return <Database {...props} />;
      case 'Globe': return <Globe {...props} />;
      case 'Cpu': return <Cpu {...props} />;
      default: return <Folder {...props} />;
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Cargar lista de carpetas
  const loadFolders = useCallback(async () => {
    try {
      setLoadingFolders(true);
      const res = await fetch('/api/v1/logs/folders');
      if (!res.ok) throw new Error('Error al cargar carpetas de log');
      const data = await res.json();
      if (data.status === 'success' && data.folders) {
        setFolders(data.folders);
        // Mantener seleccionada la actual o la primera
        if (!data.folders.some((f: LogFolder) => f.id === selectedFolder)) {
          setSelectedFolder(data.folders[0]?.id || 'auth');
        }
      }
    } catch (err: any) {
      console.error(err);
      showToast('No se pudieron cargar las carpetas de log');
    } finally {
      setLoadingFolders(false);
    }
  }, [selectedFolder]);

  // 2. Cargar archivos de la carpeta seleccionada
  const loadFiles = useCallback(async (folderId: string) => {
    try {
      const res = await fetch(`/api/v1/logs/files?folder=${encodeURIComponent(folderId)}`);
      if (!res.ok) throw new Error('Error al cargar archivos');
      const data = await res.json();
      if (data.status === 'success') {
        const fileList: LogFile[] = data.files || [];
        setFiles(fileList);
        if (fileList.length > 0) {
          // Seleccionar el archivo de hoy o el primero
          const todayFile = fileList.find((f) => f.is_today);
          setSelectedFile(todayFile ? todayFile.filename : fileList[0].filename);
        } else {
          setSelectedFile('');
          setEntries([]);
          setCounters({ ALL: 0, INFO: 0, WARNING: 0, ERROR: 0, DEBUG: 0, CRITICAL: 0, AUDIT: 0 });
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // 3. Cargar entradas del archivo actual con filtros
  const loadEntries = useCallback(async () => {
    if (!selectedFolder) return;
    try {
      setLoadingEntries(true);
      const params = new URLSearchParams({
        folder: selectedFolder,
        page: page.toString(),
        per_page: perPage.toString(),
        level: selectedLevel,
      });

      if (selectedFile) {
        params.append('file', selectedFile);
      }
      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      const res = await fetch(`/api/v1/logs/entries?${params.toString()}`);
      if (!res.ok) throw new Error('Error al consultar entradas de log');
      const data = await res.json();

      if (data.status === 'success') {
        setEntries(data.entries || []);
        setCounters(data.counters || { ALL: 0, INFO: 0, WARNING: 0, ERROR: 0, DEBUG: 0, CRITICAL: 0, AUDIT: 0 });
        setTotalPages(data.total_pages || 1);
        setTotalEntries(data.total_entries || 0);
        setFilteredEntries(data.filtered_entries || 0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEntries(false);
    }
  }, [selectedFolder, selectedFile, selectedLevel, searchQuery, page, perPage]);

  // Carga inicial
  useEffect(() => {
    loadFolders();
    logger.info('UI_LOGS_VIEWER_OPENED', { component: 'LogsViewerPage' });
  }, [loadFolders]);

  // Al cambiar carpeta, recargar archivos
  useEffect(() => {
    if (selectedFolder) {
      setPage(1);
      loadFiles(selectedFolder);
    }
  }, [selectedFolder, loadFiles]);

  // Al cambiar archivo, nivel o búsqueda, recargar entradas
  useEffect(() => {
    loadEntries();
  }, [selectedFolder, selectedFile, selectedLevel, searchQuery, page, perPage, loadEntries]);

  // Auto-refresco en vivo cada 10s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadEntries();
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadEntries]);

  // Generar batería de prueba
  const handleGenerateTestLogs = async () => {
    try {
      setGeneratingTest(true);
      const res = await fetch('/api/v1/logs/test', { method: 'POST' });
      const data = await res.json();
      if (data.status === 'success') {
        showToast('Batería de logs generada en Backend, Frontend y Microservicio Quarkus.');
        await loadFolders();
        await loadFiles(selectedFolder);
        await loadEntries();
      }
    } catch (err) {
      showToast('Error al generar logs de prueba.');
    } finally {
      setGeneratingTest(false);
    }
  };

  // Descarga del archivo
  const handleDownloadLog = () => {
    if (!selectedFolder || !selectedFile) return;
    window.open(`/api/v1/logs/download?folder=${encodeURIComponent(selectedFolder)}&file=${encodeURIComponent(selectedFile)}`, '_blank');
  };

  // Purga del archivo
  const handlePurgeLog = async () => {
    if (!selectedFolder || !selectedFile) return;
    try {
      setPurging(true);
      const res = await fetch('/api/v1/logs/clear', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: selectedFolder, file: selectedFile }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(data.message || 'Archivo purgado exitosamente.');
        setShowPurgeModal(false);
        await loadEntries();
      }
    } catch (err) {
      showToast('Error al purgar el archivo de registros.');
    } finally {
      setPurging(false);
    }
  };

  // Copiar JSON al portapapeles
  const handleCopyJson = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleContext = (id: number) => {
    setExpandedContexts((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleTrace = (id: number) => {
    setExpandedTraces((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Badge y estilos por nivel
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'INFO':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">INFO</span>;
      case 'WARNING':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">WARN</span>;
      case 'ERROR':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/40">ERROR</span>;
      case 'CRITICAL':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black bg-rose-700/40 text-rose-300 border border-rose-500 animate-pulse">CRITICAL</span>;
      case 'DEBUG':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">DEBUG</span>;
      case 'AUDIT':
      case 'EMERGENCY':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">AUDIT</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-neutral-700 text-neutral-300">{level}</span>;
    }
  };

  const activeFolderMeta = useMemo(() => {
    return folders.find((f) => f.id === selectedFolder);
  }, [folders, selectedFolder]);

  return (
    <div className="space-y-6 pb-12">
      {/* Toast de notificación */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-neutral-900 border border-neutral-700 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 transition-all">
          <Activity className="w-5 h-5 text-amber-400 animate-pulse" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Terminal className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black text-white tracking-wide">
                  Centro de Auditoría y Logs del Sistema
                </h1>
                <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  En Vivo
                </span>
              </div>
              <p className="text-sm text-neutral-400 mt-1">
                Monitoreo unificado de registros por componentes: Backend (Laravel), Frontend (Next.js) y Microservicio Reactivo Quarkus.
              </p>
            </div>
          </div>

          {/* Botones de acción globales */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                loadFolders();
                loadEntries();
              }}
              disabled={loadingEntries}
              className="flex items-center space-x-2 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition border border-neutral-700"
              title="Refrescar lista de registros"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingEntries ? 'animate-spin text-amber-400' : ''}`} />
              <span>Actualizar</span>
            </button>

            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold transition border ${
                autoRefresh
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                  : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border-neutral-700'
              }`}
              title="Alternar refresco automático cada 10 segundos"
            >
              <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-pulse text-emerald-400' : ''}`} />
              <span>{autoRefresh ? 'Auto 10s: Activo' : 'Auto-Refresco'}</span>
            </button>

            <button
              onClick={handleGenerateTestLogs}
              disabled={generatingTest}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white rounded-xl text-xs font-bold shadow-lg transition disabled:opacity-50"
              title="Generar eventos de prueba en todas las carpetas"
            >
              <Sparkles className={`w-3.5 h-3.5 ${generatingTest ? 'animate-spin' : ''}`} />
              <span>Generar Logs de Prueba</span>
            </button>

            {selectedFile && (
              <>
                <button
                  onClick={handleDownloadLog}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-xl text-xs font-semibold transition border border-neutral-700"
                  title="Descargar archivo crudo"
                >
                  <Download className="w-3.5 h-3.5 text-blue-400" />
                  <span>Descargar</span>
                </button>

                <button
                  onClick={() => setShowPurgeModal(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 rounded-xl text-xs font-semibold transition border border-red-800/40"
                  title="Purgar archivo de log con constancia militar"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Purgar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Cinta de Métricas por Nivel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5 mt-6 pt-6 border-t border-neutral-800">
          <div className="bg-neutral-950/60 border border-neutral-800 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block">Total Archivo</span>
            <span className="text-xl font-black text-white font-mono mt-0.5 block">{counters.ALL}</span>
          </div>

          <div className="bg-blue-950/20 border border-blue-900/40 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">INFO</span>
            <span className="text-xl font-black text-blue-300 font-mono mt-0.5 block">{counters.INFO}</span>
          </div>

          <div className="bg-amber-950/20 border border-amber-900/40 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">WARNING</span>
            <span className="text-xl font-black text-amber-300 font-mono mt-0.5 block">{counters.WARNING}</span>
          </div>

          <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">ERROR</span>
            <span className="text-xl font-black text-red-400 font-mono mt-0.5 block">{counters.ERROR}</span>
          </div>

          <div className="bg-purple-950/20 border border-purple-900/40 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">DEBUG</span>
            <span className="text-xl font-black text-purple-300 font-mono mt-0.5 block">{counters.DEBUG}</span>
          </div>

          <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">CRITICAL</span>
            <span className="text-xl font-black text-rose-300 font-mono mt-0.5 block">{counters.CRITICAL}</span>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3 text-center">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">AUDIT</span>
            <span className="text-xl font-black text-emerald-300 font-mono mt-0.5 block">{counters.AUDIT}</span>
          </div>
        </div>
      </div>

      {/* Selector de Carpetas del Sistema */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-neutral-200 uppercase tracking-wider">
              Carpetas y Fuentes del Sistema
            </h2>
          </div>
          <span className="text-xs text-neutral-400">
            {folders.length} componentes monitoreados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {folders.map((folder) => {
            const isSelected = selectedFolder === folder.id;
            return (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`text-left p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-neutral-800/90 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-neutral-900/60 hover:bg-neutral-800/60 border-neutral-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800">
                      {renderFolderIcon(folder.icon, folder.color)}
                    </div>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                        folder.scope === 'frontend'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : folder.scope === 'quarkus'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      {folder.scope}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-white truncate" title={folder.name}>
                    {folder.name}
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    /{folder.id}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
                  <span>{folder.file_count} {folder.file_count === 1 ? 'archivo' : 'archivos'}</span>
                  <span className="font-mono text-neutral-300 font-semibold">{folder.total_human}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de Filtros, Selector de Archivo y Buscador */}
      <div className="bg-neutral-900/70 border border-neutral-800 rounded-2xl p-4 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Selector de Archivo */}
          <div className="flex items-center space-x-3">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center space-x-1.5 whitespace-nowrap">
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span>Archivo:</span>
            </span>
            {files.length > 0 ? (
              <select
                value={selectedFile}
                onChange={(e) => {
                  setSelectedFile(e.target.value);
                  setPage(1);
                }}
                className="bg-neutral-950 border border-neutral-700 text-white rounded-xl px-3 py-1.5 text-xs font-mono font-medium focus:ring-1 focus:ring-amber-500 focus:outline-none"
              >
                {files.map((file) => (
                  <option key={file.filename} value={file.filename}>
                    {file.filename} ({file.size_human}){file.is_today ? ' ★ HOY' : ''}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-neutral-500 italic">No hay archivos en esta carpeta</span>
            )}
          </div>

          {/* Buscador de texto en tiempo real */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar en el log (acción, usuario, IP, texto, JSON)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-neutral-950 border border-neutral-700 text-white rounded-xl pl-9 pr-8 py-1.5 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Píldoras de Filtro por Nivel */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-800/80">
          <span className="text-xs font-bold text-neutral-400 mr-2 flex items-center space-x-1">
            <Filter className="w-3 h-3 text-neutral-500" />
            <span>Nivel:</span>
          </span>
          {['ALL', 'INFO', 'WARNING', 'ERROR', 'DEBUG', 'CRITICAL', 'AUDIT'].map((lvl) => {
            const isSelected = selectedLevel === lvl;
            const count = counters[lvl as keyof Counters] || 0;
            return (
              <button
                key={lvl}
                onClick={() => {
                  setSelectedLevel(lvl);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                  isSelected
                    ? 'bg-amber-500 text-neutral-950 shadow-md font-extrabold'
                    : 'bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <span>{lvl === 'ALL' ? 'TODOS' : lvl}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isSelected ? 'bg-neutral-950 text-amber-400' : 'bg-neutral-900 text-neutral-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Consola Principal de Registros */}
      <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
        {/* Barra superior de estado de la consola */}
        <div className="bg-neutral-950 px-5 py-3 border-b border-neutral-800 flex items-center justify-between text-xs font-mono text-neutral-400">
          <div className="flex items-center space-x-3">
            <span className="flex space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block"></span>
            </span>
            <span className="text-neutral-300 font-bold">
              {activeFolderMeta?.name || selectedFolder} &gt; {selectedFile || 'sin archivo'}
            </span>
          </div>

          <div className="flex items-center space-x-4">
            <span>
              Mostrando <strong className="text-white font-bold">{entries.length}</strong> de{' '}
              <strong className="text-white font-bold">{filteredEntries}</strong> registros
            </span>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(parseInt(e.target.value));
                setPage(1);
              }}
              className="bg-neutral-900 border border-neutral-700 text-white rounded px-2 py-0.5 text-xs focus:outline-none"
            >
              <option value="25">25 / pág</option>
              <option value="50">50 / pág</option>
              <option value="100">100 / pág</option>
            </select>
          </div>
        </div>

        {/* Cuerpo de la tabla / lista de eventos */}
        <div className="divide-y divide-neutral-800/80 font-mono text-xs">
          {loadingEntries ? (
            <div className="p-16 text-center text-neutral-400 space-y-3">
              <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-sm font-semibold">Cargando y parseando registros del sistema...</p>
            </div>
          ) : entries.length === 0 ? (
            <div className="p-16 text-center text-neutral-500 space-y-3">
              <FileText className="w-10 h-10 text-neutral-600 mx-auto" />
              <p className="text-sm font-semibold text-neutral-400">
                No se encontraron registros que coincidan con los filtros aplicados.
              </p>
              <p className="text-xs text-neutral-500">
                Puedes generar eventos reales presionando el botón &quot;Generar Logs de Prueba&quot;.
              </p>
            </div>
          ) : (
            entries.map((entry) => {
              const isExpanded = !!expandedContexts[entry.id];
              const isTraceExpanded = !!expandedTraces[entry.id];
              const jsonString = entry.context ? JSON.stringify(entry.context, null, 2) : '';

              return (
                <div
                  key={entry.id}
                  className="p-3.5 hover:bg-neutral-800/40 transition-colors space-y-2 group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-neutral-500 text-[11px] select-none font-bold">
                        #{entry.id}
                      </span>
                      <span className="text-neutral-400 text-xs font-semibold flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>{entry.timestamp}</span>
                      </span>
                      {getLevelBadge(entry.level)}
                      <span className="text-white font-bold text-xs bg-neutral-950/80 px-2 py-0.5 rounded border border-neutral-800">
                        {entry.action}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-[11px] text-neutral-400">
                      <span className="flex items-center space-x-1">
                        <User className="w-3 h-3 text-neutral-500" />
                        <span className="text-neutral-300 font-semibold">{entry.user}</span>
                      </span>
                      <span className="text-neutral-500">•</span>
                      <span className="text-neutral-400 font-mono">{entry.ip}</span>
                    </div>
                  </div>

                  {/* Mensaje principal / resumen */}
                  <div className="text-neutral-300 font-sans text-xs pl-2 border-l-2 border-neutral-700 group-hover:border-amber-500/70 transition-colors">
                    <p className="font-mono text-xs text-neutral-200 break-words">{entry.message}</p>
                  </div>

                  {/* Acciones para contexto JSON y Stacktrace */}
                  <div className="flex items-center space-x-3 pt-1">
                    {entry.context && (
                      <button
                        onClick={() => toggleContext(entry.id)}
                        className="inline-flex items-center space-x-1 text-[11px] text-amber-400 hover:text-amber-300 font-bold transition"
                      >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>{isExpanded ? 'Ocultar Contexto JSON' : 'Ver Contexto JSON'}</span>
                      </button>
                    )}

                    {entry.stacktrace && entry.stacktrace.length > 0 && (
                      <button
                        onClick={() => toggleTrace(entry.id)}
                        className="inline-flex items-center space-x-1 text-[11px] text-rose-400 hover:text-rose-300 font-bold transition"
                      >
                        {isTraceExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        <span>{isTraceExpanded ? 'Ocultar Traza Técnica' : `Ver Traza (${entry.stacktrace.length} líneas)`}</span>
                      </button>
                    )}
                  </div>

                  {/* Detalle de Contexto JSON Expandido */}
                  {isExpanded && entry.context && (
                    <div className="mt-2 bg-neutral-950 border border-neutral-800 rounded-xl p-3 relative font-mono text-[11px]">
                      <button
                        onClick={() => handleCopyJson(entry.id, jsonString)}
                        className="absolute right-2.5 top-2.5 px-2 py-1 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 flex items-center space-x-1 border border-neutral-700 transition"
                        title="Copiar JSON al portapapeles"
                      >
                        {copiedId === entry.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-emerald-400">Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-neutral-400" />
                            <span className="text-[10px]">Copiar</span>
                          </>
                        )}
                      </button>
                      <pre className="text-amber-200/90 overflow-x-auto pr-16">{jsonString}</pre>
                    </div>
                  )}

                  {/* Traza de Error Expandida */}
                  {isTraceExpanded && entry.stacktrace && (
                    <div className="mt-2 bg-rose-950/20 border border-rose-900/40 rounded-xl p-3 font-mono text-[11px] text-rose-300 overflow-x-auto max-h-64 overflow-y-auto">
                      <p className="font-bold text-rose-400 mb-1 flex items-center space-x-1">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Traza de excepción (Stacktrace):</span>
                      </p>
                      <pre className="whitespace-pre-wrap">{entry.stacktrace.join('\n')}</pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Paginador */}
        {totalPages > 1 && (
          <div className="bg-neutral-950 px-5 py-3 border-t border-neutral-800 flex items-center justify-between text-xs">
            <span className="text-neutral-400">
              Página <strong className="text-white font-bold">{page}</strong> de{' '}
              <strong className="text-white font-bold">{totalPages}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold disabled:opacity-40 transition flex items-center space-x-1 border border-neutral-700"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold disabled:opacity-40 transition flex items-center space-x-1 border border-neutral-700"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Purga de Log */}
      {showPurgeModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Confirmar Purga Militar</h3>
                <p className="text-xs text-neutral-400">Acción restringida a personal de comando</p>
              </div>
            </div>

            <p className="text-sm text-neutral-300">
              ¿Está seguro de que desea purgar el archivo{' '}
              <strong className="text-white font-mono bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                {selectedFile}
              </strong>{' '}
              de la carpeta{' '}
              <strong className="text-amber-400 font-mono">{selectedFolder}</strong>?
            </p>

            <div className="p-3 bg-red-950/30 border border-red-900/40 rounded-xl text-xs text-red-300">
              Esta acción vaciará los registros históricos de este archivo y registrará una entrada formal de
              auditoría con fecha, hora y usuario que autorizó el reinicio.
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowPurgeModal(false)}
                className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                onClick={handlePurgeLog}
                disabled={purging}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition shadow-lg disabled:opacity-50"
              >
                {purging ? 'Purgando...' : 'Confirmar y Purgar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
