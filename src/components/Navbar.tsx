import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Clock, 
  Calendar, 
  UserCheck, 
  MapPin, 
  ShieldCheck, 
  FileText, 
  Users, 
  Moon, 
  ChevronDown, 
  Sparkles, 
  CheckCircle2, 
  Activity,
  Shield,
  Camera,
  LogOut
} from 'lucide-react';
import { Employee, HospitalLocation, PrayerTimeInfo } from '../types';
import { getBanjarbaruPrayerTimes } from '../utils/prayerTimes';
import { RsiLogo } from './RsiLogo';

interface NavbarProps {
  activeTab: 'presensi' | 'riwayat' | 'izin' | 'admin' | 'jadwal_doa';
  setActiveTab: (tab: 'presensi' | 'riwayat' | 'izin' | 'admin' | 'jadwal_doa') => void;
  activeEmployee: Employee;
  hospitalConfig: HospitalLocation;
  todayCount: number;
  onOpenPermissions?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  activeEmployee,
  hospitalConfig,
  todayCount,
  onOpenPermissions,
  onLogout,
}) => {
  const [timeString, setTimeString] = useState<string>('');
  const [dateString, setDateString] = useState<string>('');
  const [prayerInfo, setPrayerInfo] = useState<PrayerTimeInfo>(getBanjarbaruPrayerTimes());

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format time in WITA (UTC+8)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Makassar',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      setTimeString(now.toLocaleTimeString('id-ID', options) + ' WITA');

      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Makassar',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      };
      setDateString(now.toLocaleDateString('id-ID', dateOptions));
      setPrayerInfo(getBanjarbaruPrayerTimes(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top Banner: Islamic Hospital Greeting & Prayer Status */}
      <div className="bg-slate-900 text-white text-xs px-4 sm:px-8 py-1.5 flex flex-wrap justify-between items-center gap-2 border-b border-slate-800">
        <div className="flex items-center gap-2 font-medium tracking-wide">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-emerald-400 font-bold uppercase tracking-wider text-[11px]">Sistem Presensi Resmi</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-300 text-[11px]">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ • Pelayanan Medis Islami & Profesional</span>
        </div>
        
        <div className="flex items-center gap-3 text-slate-300 text-[11px]">
          <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-700">
            <Moon className="w-3 h-3 text-amber-300" />
            <span>Sholat {prayerInfo.nextPrayer}: <strong className="text-emerald-300">{prayerInfo.timeRemaining} lagi</strong></span>
          </div>
          <span className="hidden md:inline bg-emerald-950 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">
            KOTA BANJARBARU
          </span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Hospital Logo & Brand matching Professional Polish Header */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-2xl flex items-center justify-center shrink-0 shadow-xs border border-emerald-200 ring-2 ring-emerald-500/20 p-1">
              <RsiLogo variant="emblem-only" className="w-full h-full" />
            </div>
            
            <div>
              <h1 className="text-base sm:text-xl font-black tracking-tight text-emerald-800 uppercase leading-tight">
                RSI Sultan Agung
              </h1>
              <p className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Banjarbaru • Presensi Pegawai
              </p>
            </div>
          </div>

          {/* Center: Live Clock & Date */}
          <div className="hidden lg:flex items-center gap-4 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-mono text-base font-bold text-slate-800 tracking-wider">{timeString || 'Memuat...'}</span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{dateString}</span>
            </div>
          </div>

          {/* Right: Employee Profile & Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {onOpenPermissions && (
              <button
                id="btn-open-permissions-nav"
                onClick={onOpenPermissions}
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-emerald-700 transition-colors cursor-pointer"
                title="Kelola Izin Kamera & Lokasi GPS"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Izin Akses</span>
              </button>
            )}

            {/* Dedicated Single-User Account Badge */}
            <div className="flex items-center gap-2 sm:gap-3 px-2 sm:px-3 py-1.5 rounded-2xl bg-slate-50 border border-slate-200">
              <div className="text-right hidden sm:block max-w-[200px]">
                <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                  {activeEmployee.name}
                </p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  {activeEmployee.isAdmin ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                      HRD
                    </span>
                  ) : (
                    <span className="text-[9px] font-semibold px-1 py-0.2 rounded-sm bg-slate-200 text-slate-600 uppercase">
                      PEGAWAI
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 font-mono">
                    {activeEmployee.nip}
                  </span>
                </div>
              </div>

              <div className="relative shrink-0">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 ${activeEmployee.isAdmin ? 'border-emerald-500 ring-2 ring-emerald-300/40' : 'border-emerald-300'} bg-slate-200 overflow-hidden`}>
                  <img
                    src={activeEmployee.avatar}
                    alt={activeEmployee.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                {activeEmployee.isAdmin && (
                  <span className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs" title="Akun Administrator HRD">
                    <ShieldCheck className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            {/* Direct Logout Button */}
            {onLogout && (
              <button
                id="btn-header-logout"
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs transition-colors cursor-pointer"
                title="Keluar dari Akun Pegawai Ini"
              >
                <LogOut className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Menu - Visible on Desktop only, Mobile uses Bottom App Bar */}
        <nav className="hidden sm:flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 border-t border-slate-100 scrollbar-none">
          <button
            id="tab-presensi"
            onClick={() => setActiveTab('presensi')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'presensi'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Verifikasi Presensi</span>
          </button>

          <button
            id="tab-riwayat"
            onClick={() => setActiveTab('riwayat')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'riwayat'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Riwayat Presensi</span>
          </button>

          <button
            id="tab-izin"
            onClick={() => setActiveTab('izin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'izin'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Pengajuan Cuti & Izin</span>
          </button>

          {/* Portal HRD & Geofence: Restricted to HRD accounts only */}
          {activeEmployee.isAdmin && (
            <button
              id="tab-admin"
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'admin'
                  ? 'bg-emerald-700 text-white shadow-xs ring-2 ring-emerald-400/30'
                  : 'text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Portal HRD & Geofence</span>
              {todayCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'admin' ? 'bg-white text-emerald-800' : 'bg-emerald-600 text-white'
                }`}>
                  {todayCount}
                </span>
              )}
            </button>
          )}

          <button
            id="tab-jadwal-doa"
            onClick={() => setActiveTab('jadwal_doa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'jadwal_doa'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Moon className="w-4 h-4" />
            <span>Jadwal Sholat & Doa</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
