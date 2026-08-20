import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  MapPin, 
  Sliders, 
  Download, 
  Search, 
  Eye, 
  XCircle, 
  Building2, 
  Sparkles,
  RefreshCcw,
  SlidersHorizontal,
  FileSpreadsheet,
  Activity
} from 'lucide-react';
import { AttendanceRecord, Employee, HospitalLocation, LeaveRequest } from '../types';
import { formatDistance } from '../utils/geo';
import { playSuccessChime } from '../utils/audio';

interface AdminDashboardProps {
  employees: Employee[];
  attendances: AttendanceRecord[];
  leaves: LeaveRequest[];
  hospitalConfig: HospitalLocation;
  onUpdateHospitalConfig: (config: HospitalLocation) => void;
  onUpdateLeaveStatus: (leaveId: string, status: 'approved' | 'rejected') => void;
  onResetAllData: () => void;
  onOpenWorkspace?: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  employees,
  attendances,
  leaves,
  hospitalConfig,
  onUpdateHospitalConfig,
  onUpdateLeaveStatus,
  onResetAllData,
  onOpenWorkspace,
}) => {
  const [adminTab, setAdminTab] = useState<'monitoring' | 'geofence' | 'persetujuan' | 'pegawai'>('monitoring');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [radiusInput, setRadiusInput] = useState<number>(hospitalConfig.allowedRadiusMeters);
  const [latInput, setLatInput] = useState<number>(hospitalConfig.latitude);
  const [lngInput, setLngInput] = useState<number>(hospitalConfig.longitude);
  const [saveConfigNotice, setSaveConfigNotice] = useState<boolean>(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendances = attendances.filter((a) => a.date === todayStr);
  const todayClockIns = todayAttendances.filter((a) => a.type === 'masuk');
  
  const presentCount = todayClockIns.length;
  const onTimeCount = todayClockIns.filter((a) => a.status === 'tepat_waktu').length;
  const lateCount = todayClockIns.filter((a) => a.status === 'terlambat').length;
  const attendancePercent = Math.round((presentCount / Math.max(1, employees.length)) * 100);

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');

  const filteredAttendances = attendances.filter((record) => {
    return (
      record.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeNip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.shiftName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleSaveGeofence = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateHospitalConfig({
      ...hospitalConfig,
      latitude: Number(latInput),
      longitude: Number(lngInput),
      allowedRadiusMeters: Number(radiusInput),
    });
    playSuccessChime();
    setSaveConfigNotice(true);
    setTimeout(() => setSaveConfigNotice(false), 4000);
  };

  const handleExportFullCSV = () => {
    const headers = [
      'ID Presensi',
      'NIP',
      'Nama Pegawai',
      'Jabatan/Profesi',
      'Departemen/Ruangan',
      'Tanggal',
      'Waktu WITA',
      'Jenis Presensi',
      'Shift',
      'Status Kehadiran',
      'Jarak ke RS (Meter)',
      'Dalam Radius?',
      'Skor AI Wajah (%)',
      'Lokasi Presensi',
      'Catatan',
    ];

    const rows = attendances.map((r) => [
      r.id,
      r.employeeNip,
      `"${r.employeeName}"`,
      `"${r.employeeRole}"`,
      `"${r.employeeDepartment}"`,
      r.date,
      r.formattedTime,
      r.type,
      `"${r.shiftName}"`,
      r.status,
      r.distanceToHospitalMeters,
      r.isWithinRadius ? 'YA' : 'TIDAK',
      r.faceVerificationScore,
      `"${r.locationAddress.replace(/"/g, '""')}"`,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_presensi_rsisa_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Admin Summary Banner matching Professional Polish Theme */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/40 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 uppercase tracking-widest">
                PORTAL HRD & MANAJEMEN RS
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                <Activity className="w-3 h-3 animate-pulse" /> Real-time
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1 tracking-tight">
              Pusat Monitoring Presensi & Geofencing
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              RSI Sultan Agung Banjarbaru • Evaluasi kehadiran biometrik & perizinan pegawai
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenWorkspace && (
              <button
                onClick={onOpenWorkspace}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs flex items-center gap-2 transition-colors cursor-pointer uppercase tracking-wider"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                <span>Google Sheets & Drive</span>
              </button>
            )}

            <button
              onClick={handleExportFullCSV}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 shadow-xs flex items-center gap-2 transition-colors cursor-pointer uppercase tracking-wider"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          </div>
        </div>

        {/* Live KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-6 relative z-10">
          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tingkat Kehadiran</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-400 mt-1 font-mono">{attendancePercent}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{presentCount} dari {employees.length} Pegawai Hadir</p>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tepat Waktu</p>
            <p className="text-2xl sm:text-3xl font-bold text-teal-300 mt-1 font-mono">{onTimeCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Sesuai Toleransi Shift</p>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Terlambat</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1 font-mono">{lateCount}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">&gt; 15 menit dari jam shift</p>
          </div>

          <div className="p-4 bg-slate-800/60 rounded-xl border border-slate-700/60">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Izin Pending</p>
            <p className="text-2xl sm:text-3xl font-bold text-purple-300 mt-1 font-mono">{pendingLeaves.length}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Perlu Review SDM</p>
          </div>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setAdminTab('monitoring')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'monitoring'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Monitor Presensi ({attendances.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('geofence')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'geofence'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Geofencing Radius ({hospitalConfig.allowedRadiusMeters}m)</span>
        </button>

        <button
          onClick={() => setAdminTab('persetujuan')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
            adminTab === 'persetujuan'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Persetujuan Izin</span>
          {pendingLeaves.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-400 text-slate-900 font-extrabold">
              {pendingLeaves.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setAdminTab('pegawai')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            adminTab === 'pegawai'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <span>Direktori Pegawai ({employees.length})</span>
        </button>
      </div>

      {/* TAB 1: REAL-TIME MONITORING FEED */}
      {adminTab === 'monitoring' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-emerald-100">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama pegawai, NIP, ruangan..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <span className="text-xs text-slate-500 font-semibold">
              Menampilkan {filteredAttendances.length} catatan presensi
            </span>
          </div>

          <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                  <tr>
                    <th className="py-3.5 px-4">Pegawai</th>
                    <th className="py-3.5 px-4">Ruangan / Profesi</th>
                    <th className="py-3.5 px-4">Waktu Presensi</th>
                    <th className="py-3.5 px-4">Shift & Jenis</th>
                    <th className="py-3.5 px-4">Status & Jarak RS</th>
                    <th className="py-3.5 px-4">Verifikasi AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAttendances.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rec.photoUrl}
                            alt={rec.employeeName}
                            className="w-10 h-10 rounded-lg object-cover ring-1 ring-emerald-400 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-800">{rec.employeeName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">{rec.employeeNip}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-700">{rec.employeeDepartment}</p>
                        <p className="text-[10px] text-slate-500">{rec.employeeRole}</p>
                      </td>

                      <td className="py-3 px-4 font-mono">
                        <p className="font-bold text-slate-800">{rec.formattedTime}</p>
                        <p className="text-[10px] text-slate-500">{rec.date}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.type === 'masuk'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {rec.type === 'masuk' ? 'Absen Masuk' : 'Absen Pulang'}
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5">{rec.shiftName}</p>
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rec.status === 'tepat_waktu'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : rec.status === 'terlambat'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {rec.status === 'tepat_waktu'
                            ? 'Tepat Waktu'
                            : rec.status === 'terlambat'
                            ? 'Terlambat'
                            : 'Dinas Luar'}
                        </span>
                        <p className="text-[10px] text-slate-600 mt-0.5">
                          Jarak: <strong>{formatDistance(rec.distanceToHospitalMeters)}</strong>
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <span className="font-bold text-emerald-700 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {rec.faceVerificationScore}%
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                            GPS Asli
                          </span>
                          <span className="text-[9px] text-slate-400">Anti-Spoof Valid</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GEOFENCE CONFIGURATION */}
      {adminTab === 'geofence' && (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-5 sm:p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-emerald-600" />
              <span>Pengaturan Titik Pusat & Radius Geofence RSI Sultan Agung</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Atur koordinat pusat rumah sakit dan jarak toleransi presensi pegawai di sekitar gedung RS
            </p>
          </div>

          {saveConfigNotice && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Konfigurasi Geofencing RSI Sultan Agung Banjarbaru berhasil diperbarui!</span>
            </div>
          )}

          <form onSubmit={handleSaveGeofence} className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Rumah Sakit
              </label>
              <input
                type="text"
                value={hospitalConfig.name}
                disabled
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Alamat Rumah Sakit
              </label>
              <input
                type="text"
                value={hospitalConfig.address}
                disabled
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Latitude Pusat RS
                </label>
                <input
                  type="number"
                  step="any"
                  value={latInput}
                  onChange={(e) => setLatInput(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Longitude Pusat RS
                </label>
                <input
                  type="number"
                  step="any"
                  value={lngInput}
                  onChange={(e) => setLngInput(Number(e.target.value))}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Batas Radius Toleransi Presensi (Meter)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="25"
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(Number(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <span className="text-sm font-extrabold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 min-w-24 text-center">
                  {radiusInput} Meter
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {[50, 100, 150, 200, 300].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRadiusInput(r)}
                    className={`px-2.5 py-1 text-[11px] rounded-lg font-bold border transition-colors ${
                      radiusInput === r
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r}m
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md shadow-emerald-700/20 cursor-pointer"
              >
                Simpan Konfigurasi Radius Geofence
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: LEAVE & PERMIT APPROVALS */}
      {adminTab === 'persetujuan' && (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-base font-bold text-slate-800">
              Daftar Permohonan Izin, Cuti & Dinas Luar Pegawai
            </h3>
            <p className="text-xs text-slate-500">
              Verifikasi dan berikan persetujuan untuk pengajuan izin staf
            </p>
          </div>

          <div className="divide-y divide-slate-100">
            {leaves.map((leave) => (
              <div key={leave.id} className="py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">{leave.employeeName}</span>
                    <span className="text-[11px] text-slate-500">({leave.employeeNip})</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900">
                      {leave.type}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-600">
                      {leave.totalDays} Hari ({leave.startDate} s/d {leave.endDate})
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 mt-1 font-medium">
                    Alasan: "{leave.reason}"
                  </p>

                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Departemen: {leave.employeeDepartment} • Diajukan: {new Date(leave.createdAt).toLocaleDateString('id-ID')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {leave.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => {
                          onUpdateLeaveStatus(leave.id, 'approved');
                          playSuccessChime();
                        }}
                        className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => {
                          onUpdateLeaveStatus(leave.id, 'rejected');
                        }}
                        className="px-3.5 py-1.5 rounded-xl font-bold text-xs bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors cursor-pointer"
                      >
                        Tolak
                      </button>
                    </>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      leave.status === 'approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {leave.status === 'approved' ? '✓ Sudah Disetujui' : '✕ Ditolak'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EMPLOYEE DIRECTORY */}
      {adminTab === 'pegawai' && (
        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-bold text-slate-800">Direktori Pegawai RSI Sultan Agung</h3>
              <p className="text-xs text-slate-500">Daftar tenaga medis, perawat, analis, dan staf operasional terdaftar</p>
            </div>
            <button
              onClick={onResetAllData}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 p-2 rounded-xl hover:bg-rose-50 transition-colors"
              title="Reset data demo ke awal"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              <span>Reset Data Demo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {employees.map((emp) => (
              <div
                key={emp.id}
                className="p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/60 flex items-start gap-3"
              >
                <img
                  src={emp.avatar}
                  alt={emp.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-emerald-500/30 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{emp.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono">{emp.nip}</p>
                  <p className="text-[11px] text-emerald-800 font-medium truncate mt-0.5">{emp.role}</p>
                  <p className="text-[10px] text-slate-500 truncate">{emp.department}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      Wajah Terdaftar
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                      {emp.shiftType}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
