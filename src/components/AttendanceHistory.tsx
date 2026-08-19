import React, { useState } from 'react';
import { 
  FileText, 
  Calendar, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Filter, 
  Download, 
  Eye, 
  Search, 
  CheckCircle2, 
  AlertTriangle,
  X,
  Printer,
  ChevronRight
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../types';
import { formatDistance } from '../utils/geo';

interface AttendanceHistoryProps {
  attendances: AttendanceRecord[];
  activeEmployee: Employee;
}

export const AttendanceHistory: React.FC<AttendanceHistoryProps> = ({
  attendances,
  activeEmployee,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPhotoRecord, setSelectedPhotoRecord] = useState<AttendanceRecord | null>(null);

  // Filter records for active employee
  const employeeRecords = attendances.filter(
    (item) => item.employeeId === activeEmployee.id
  );

  const filteredRecords = employeeRecords.filter((record) => {
    const matchesSearch =
      record.shiftName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.locationAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date.includes(searchTerm);

    if (filterType === 'all') return matchesSearch;
    if (filterType === 'masuk') return matchesSearch && record.type === 'masuk';
    if (filterType === 'pulang') return matchesSearch && record.type === 'pulang';
    if (filterType === 'terlambat') return matchesSearch && record.status === 'terlambat';
    return matchesSearch;
  });

  // Calculate stats
  const totalHadir = employeeRecords.filter((r) => r.type === 'masuk').length;
  const tepatWaktu = employeeRecords.filter(
    (r) => r.type === 'masuk' && r.status === 'tepat_waktu'
  ).length;
  const terlambat = employeeRecords.filter(
    (r) => r.type === 'masuk' && r.status === 'terlambat'
  ).length;
  const avgDistance =
    employeeRecords.length > 0
      ? Math.round(
          employeeRecords.reduce((acc, r) => acc + r.distanceToHospitalMeters, 0) /
            employeeRecords.length
        )
      : 0;

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'ID Presensi',
      'NIP',
      'Nama Pegawai',
      'Departemen',
      'Tanggal',
      'Waktu WITA',
      'Jenis Presensi',
      'Shift',
      'Status',
      'Jarak RS (Meter)',
      'Akurasi AI (%)',
      'Alamat Lokasi',
    ];

    const rows = filteredRecords.map((r) => [
      r.id,
      r.employeeNip,
      r.employeeName,
      r.employeeDepartment,
      r.date,
      r.formattedTime,
      r.type,
      r.shiftName,
      r.status,
      r.distanceToHospitalMeters,
      r.faceVerificationScore,
      `"${r.locationAddress.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_presensi_${activeEmployee.nip}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header & Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Total Hadir
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-2 font-mono">{totalHadir}</p>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-wider border border-emerald-100">
            Bulan Ini
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            Tepat Waktu
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-2 font-mono">{tepatWaktu}</p>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-wider border border-emerald-100">
            Sesuai Shift
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Terlambat
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-2 font-mono">{terlambat}</p>
          <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-wider border border-amber-100">
            &gt; 15 Menit
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            Rata-rata Jarak
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-2 font-mono">{formatDistance(avgDistance)}</p>
          <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-wider border border-blue-100">
            Radius RS
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari shift, lokasi, tanggal..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterType === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Semua ({employeeRecords.length})
          </button>
          <button
            onClick={() => setFilterType('masuk')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterType === 'masuk'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Masuk
          </button>
          <button
            onClick={() => setFilterType('pulang')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
              filterType === 'pulang'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            Pulang
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors ml-auto cursor-pointer"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Attendance History List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Riwayat Presensi: {activeEmployee.name}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              NIP: {activeEmployee.nip} • {activeEmployee.department}
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
            {filteredRecords.length} Catatan
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Belum Ada Riwayat Presensi</p>
            <p className="text-xs text-slate-400 mt-1">
              Silakan lakukan presensi wajah & GPS di menu Presensi Utama.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 sm:p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                {/* Left: Thumbnail & Main Info */}
                <div className="flex items-center gap-3.5">
                  <div
                    onClick={() => setSelectedPhotoRecord(record)}
                    className="relative cursor-pointer group shrink-0"
                    title="Klik untuk lihat foto selfie presensi"
                  >
                    <img
                      src={record.photoUrl}
                      alt="Selfie Presensi"
                      className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-200 group-hover:ring-emerald-500 transition-all shadow-xs"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition-opacity text-white">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        record.type === 'masuk'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          : record.type === 'pulang'
                          ? 'bg-rose-50 text-rose-700 border border-rose-100'
                          : 'bg-amber-50 text-amber-700 border border-amber-100'
                      }`}>
                        {record.type === 'masuk'
                          ? 'Masuk'
                          : record.type === 'pulang'
                          ? 'Pulang'
                          : 'Lembur'}
                      </span>

                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {record.shiftName}
                      </span>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        record.status === 'tepat_waktu'
                          ? 'bg-emerald-50 text-emerald-700'
                          : record.status === 'terlambat'
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-blue-50 text-blue-700'
                      }`}>
                        {record.status === 'tepat_waktu'
                          ? 'Tepat Waktu'
                          : record.status === 'terlambat'
                          ? 'Terlambat'
                          : 'Dinas Luar'}
                      </span>
                    </div>

                    <p className="text-sm font-bold text-slate-800 mt-1 font-mono">
                      {record.date} • {record.formattedTime}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-xs sm:max-w-md">{record.locationAddress}</span>
                    </p>
                  </div>
                </div>

                {/* Right: AI Score & Distance Badges */}
                <div className="flex sm:flex-col items-center sm:items-end gap-1.5 w-full sm:w-auto justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>AI Match: {record.faceVerificationScore}%</span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-semibold px-1.5 py-0.2 rounded border border-slate-200">
                      GPS Asli
                    </span>
                    <span>Jarak: <strong className="text-slate-800">{formatDistance(record.distanceToHospitalMeters)}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Photo Detail Modal */}
      {selectedPhotoRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 bg-emerald-800 text-white flex items-center justify-between">
              <span className="text-xs font-bold">Bukti Foto Biometrik Presensi</span>
              <button
                onClick={() => setSelectedPhotoRecord(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 space-y-3">
              <img
                src={selectedPhotoRecord.photoUrl}
                alt="Foto Selfie"
                className="w-full aspect-square rounded-2xl object-cover ring-2 ring-emerald-500"
              />

              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                <p><strong>Pegawai:</strong> {selectedPhotoRecord.employeeName} ({selectedPhotoRecord.employeeNip})</p>
                <p><strong>Waktu:</strong> {selectedPhotoRecord.date} {selectedPhotoRecord.formattedTime}</p>
                <p><strong>Lokasi:</strong> {selectedPhotoRecord.locationAddress} (Jarak: {formatDistance(selectedPhotoRecord.distanceToHospitalMeters)})</p>
                <p><strong>Verifikasi AI:</strong> {selectedPhotoRecord.faceVerificationScore}% (Anti-Spoofing Valid)</p>
                {selectedPhotoRecord.notes && (
                  <p><strong>Catatan:</strong> {selectedPhotoRecord.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
