import React from 'react';
import { 
  UserCheck, 
  FileText, 
  Calendar, 
  ShieldCheck, 
  Moon 
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: 'presensi' | 'riwayat' | 'izin' | 'admin' | 'jadwal_doa';
  setActiveTab: (tab: 'presensi' | 'riwayat' | 'izin' | 'admin' | 'jadwal_doa') => void;
  todayCount: number;
  isAdmin?: boolean;
}

interface NavItem {
  id: 'presensi' | 'riwayat' | 'izin' | 'admin' | 'jadwal_doa';
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  todayCount,
  isAdmin = false,
}) => {
  const allNavItems: NavItem[] = [
    { id: 'presensi', label: 'Presensi', icon: UserCheck },
    { id: 'riwayat', label: 'Riwayat', icon: FileText },
    { id: 'izin', label: 'Cuti / Izin', icon: Calendar },
    { id: 'jadwal_doa', label: 'Sholat & Doa', icon: Moon },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Portal HRD', icon: ShieldCheck, badge: todayCount > 0 ? todayCount : undefined }] : []),
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {allNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl min-w-[62px] min-h-[48px] transition-all relative cursor-pointer ${
                isActive
                  ? 'text-emerald-700 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              {isActive && (
                <span className="absolute -top-1 w-6 h-1 rounded-full bg-emerald-600 animate-in fade-in zoom-in duration-150" />
              )}
              
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5px] text-emerald-700' : 'stroke-[1.8px]'}`} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2.5 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-white shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 truncate ${isActive ? 'font-bold text-emerald-800' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
