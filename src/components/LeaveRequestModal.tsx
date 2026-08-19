import React, { useState } from 'react';
import { 
  Calendar, 
  FileText, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Upload, 
  Paperclip, 
  PlusCircle, 
  X,
  ShieldCheck
} from 'lucide-react';
import { Employee, LeaveRequest } from '../types';
import { playSuccessChime } from '../utils/audio';

interface LeaveRequestModalProps {
  activeEmployee: Employee;
  leaves: LeaveRequest[];
  onAddLeave: (leave: LeaveRequest) => void;
}

export const LeaveRequestModal: React.FC<LeaveRequestModalProps> = ({
  activeEmployee,
  leaves,
  onAddLeave,
}) => {
  const [showForm, setShowForm] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<LeaveRequest['type']>('Cuti Tahunan');
  const [startDate, setStartDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
  );
  const [reason, setReason] = useState<string>('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Filter leaves for this employee
  const myLeaves = leaves.filter((l) => l.employeeId === activeEmployee.id);

  // Calculate days
  const calculateDays = () => {
    const s = new Date(startDate);
    const e = new Date(endDate);
    const diff = Math.ceil((e.getTime() - s.getTime()) / (1000 * 3600 * 24)) + 1;
    return diff > 0 ? diff : 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Harap isi alasan permohonan izin/cuti.');
      return;
    }

    const totalDays = calculateDays();
    const newLeave: LeaveRequest = {
      id: `leave-${Date.now()}`,
      employeeId: activeEmployee.id,
      employeeName: activeEmployee.name,
      employeeNip: activeEmployee.nip,
      employeeDepartment: activeEmployee.department,
      type: leaveType,
      startDate,
      endDate,
      totalDays,
      reason: reason.trim(),
      attachmentName: attachmentName || undefined,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    onAddLeave(newLeave);
    playSuccessChime();
    setSuccessNotice(`Pengajuan ${leaveType} berhasil dikirim ke Bagian SDM & Kepala Ruangan.`);
    setShowForm(false);
    setReason('');
    setAttachmentName('');

    setTimeout(() => {
      setSuccessNotice(null);
    }, 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner matching Theme */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Layanan Kepegawaian</p>
          <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>Pengajuan Izin, Cuti & Dinas Luar</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Layanan perizinan digital pegawai RSI Sultan Agung Banjarbaru
          </p>
        </div>

        <button
          id="btn-open-leave-form"
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
        >
          {showForm ? <X className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />}
          <span>{showForm ? 'Tutup Formulir' : '+ Ajukan Izin / Cuti Baru'}</span>
        </button>
      </div>

      {/* Success Alert */}
      {successNotice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Leave Application Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Formulir</p>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5">
                Permohonan Izin / Cuti Pegawai
              </h3>
            </div>
            <span className="text-[10px] text-slate-700 font-bold bg-slate-100 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {activeEmployee.name} ({activeEmployee.nip})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Jenis Izin */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jenis Permohonan
              </label>
              <select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value as LeaveRequest['type'])}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-800 bg-slate-50"
              >
                <option value="Cuti Tahunan">Cuti Tahunan (Tahunan Reguler)</option>
                <option value="Izin Sakit">Izin Sakit (Dengan Surat Dokter)</option>
                <option value="Izin Dinas Luar">Izin Dinas Luar / Tugas Luar RS</option>
                <option value="Izin Keperluan Pribadi">Izin Keperluan Mendesak / Keluarga</option>
                <option value="Cuti Melahirkan">Cuti Melahirkan</option>
                <option value="Tugas Belajar">Tugas Belajar / Pelatihan Medis</option>
              </select>
            </div>

            {/* Total Hari */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Durasi Hari
              </label>
              <div className="text-xs px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-emerald-800">
                {calculateDays()} Hari Kerja
              </div>
            </div>

            {/* Tanggal Mulai */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                required
              />
            </div>

            {/* Tanggal Selesai */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                required
              />
            </div>
          </div>

          {/* Alasan */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Alasan & Keterangan Lengkap
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Jelaskan alasan pengajuan secara jelas..."
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 bg-slate-50"
              required
            />
          </div>

          {/* Lampiran */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Lampiran Dokumen (Surat Dokter / Surat Tugas jika ada)
            </label>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-600" />
                <span>Pilih File Surat / Dokumen</span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachmentName(e.target.files[0].name);
                    }
                  }}
                />
              </label>
              {attachmentName && (
                <span className="text-xs text-slate-600 flex items-center gap-1 font-mono">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                  {attachmentName}
                </span>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs flex items-center gap-2 uppercase tracking-wider cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Kirim Permohonan ke HRD</span>
            </button>
          </div>
        </form>
      )}

      {/* Leave Requests Table / Cards */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Daftar Permohonan Izin & Cuti Saya
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Riwayat status persetujuan dari Kepala Bagian SDM
            </p>
          </div>
          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 uppercase tracking-wider">
            {myLeaves.length} Permohonan
          </span>
        </div>

        {myLeaves.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Belum Ada Pengajuan Izin / Cuti</p>
            <p className="text-xs text-slate-400 mt-1">
              Klik tombol "+ Ajukan Izin / Cuti Baru" di atas untuk membuat pengajuan.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {myLeaves.map((leave) => (
              <div key={leave.id} className="p-4 sm:p-5 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {leave.type}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {leave.totalDays} Hari ({leave.startDate} s/d {leave.endDate})
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1.5 font-medium">
                      "{leave.reason}"
                    </p>

                    {leave.attachmentName && (
                      <p className="text-[11px] text-emerald-700 flex items-center gap-1 mt-1 font-mono">
                        <Paperclip className="w-3 h-3" />
                        <span>Lampiran: {leave.attachmentName}</span>
                      </p>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div className="sm:text-right shrink-0">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      leave.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        : leave.status === 'rejected'
                        ? 'bg-rose-50 text-rose-700 border border-rose-100'
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {leave.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                      {leave.status === 'rejected' && <AlertCircle className="w-3.5 h-3.5 text-rose-600" />}
                      {leave.status === 'pending' && <Clock className="w-3.5 h-3.5 text-amber-600" />}
                      <span>
                        {leave.status === 'approved'
                          ? 'Disetujui SDM'
                          : leave.status === 'rejected'
                          ? 'Ditolak'
                          : 'Menunggu Persetujuan'}
                      </span>
                    </span>

                    {leave.approverName && (
                      <p className="text-[10px] text-slate-400 mt-1">
                        Oleh: {leave.approverName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
