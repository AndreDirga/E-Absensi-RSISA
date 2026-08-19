import React from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  User, 
  Download, 
  Share2, 
  X,
  Sparkles,
  Building2,
  HeartHandshake
} from 'lucide-react';
import { AttendanceRecord } from '../types';
import { formatDistance } from '../utils/geo';
import { ISLAMIC_HOSPITAL_DUAS } from '../utils/prayerTimes';

interface SuccessModalProps {
  record: AttendanceRecord;
  onClose: () => void;
}

export const SuccessModal: React.FC<SuccessModalProps> = ({ record, onClose }) => {
  const isMasuk = record.type === 'masuk' || record.type === 'lembur_masuk';
  const dua = isMasuk ? ISLAMIC_HOSPITAL_DUAS[0] : ISLAMIC_HOSPITAL_DUAS[2];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-emerald-100 animate-in zoom-in-95 duration-200">
        
        {/* Top Header Card */}
        <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 p-6 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md ring-4 ring-white/20 mb-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-300 animate-bounce" style={{ animationDuration: '2s' }} />
          </div>

          <h2 className="text-xl font-extrabold tracking-tight">
            {isMasuk ? 'Presensi Masuk Berhasil!' : 'Presensi Pulang Berhasil!'}
          </h2>
          <p className="text-xs text-emerald-200 mt-1">
            RSI Sultan Agung Banjarbaru • Sistem Presensi Terverifikasi
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          
          {/* Employee & Photo Snapshot Card */}
          <div className="flex items-center gap-4 p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <img
              src={record.photoUrl}
              alt="Bukti Selfie Presensi"
              className="w-18 h-18 rounded-xl object-cover ring-2 ring-emerald-500 shadow-md shrink-0"
            />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                {record.shiftName}
              </span>
              <h4 className="text-sm font-bold text-slate-800 truncate mt-1">
                {record.employeeName}
              </h4>
              <p className="text-xs text-slate-500 font-mono">
                {record.employeeNip}
              </p>
              <p className="text-[11px] text-slate-600 font-medium truncate">
                {record.employeeRole} • {record.employeeDepartment}
              </p>
            </div>
          </div>

          {/* Validation Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Waktu Presensi</span>
              </div>
              <p className="text-sm font-bold text-slate-800 font-mono">
                {record.formattedTime}
              </p>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                record.status === 'tepat_waktu'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {record.status === 'tepat_waktu' ? 'Tepat Waktu' : 'Terlambat'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Validasi Jarak RS</span>
              </div>
              <p className="text-sm font-bold text-slate-800">
                {formatDistance(record.distanceToHospitalMeters)}
              </p>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-800">
                {record.isWithinRadius ? 'Dalam Radius RS' : 'Dinas Luar'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Verifikasi Biometrik AI & GPS</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                    GPS Asli Terverifikasi
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    Kecocokan {record.faceVerificationScore}%
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-slate-600 mt-1">
                {record.locationAddress} • Akurasi ±{record.locationAccuracyMeters}m
              </p>
            </div>
          </div>

          {/* Islamic Hospital Doa & Motivation Box */}
          <div className="p-4 bg-linear-to-br from-emerald-900 to-teal-950 text-white rounded-2xl border border-emerald-700/50 shadow-md">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold mb-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{dua.title}</span>
            </div>
            <p className="font-serif text-right text-base text-emerald-100 my-2 leading-relaxed tracking-wider">
              {dua.arabic}
            </p>
            <p className="text-[11px] text-amber-200 italic mb-1">
              "{dua.latin}"
            </p>
            <p className="text-[10px] text-emerald-200/90">
              Artinya: {dua.meaning}
            </p>
          </div>

          {/* Button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-linear-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-lg shadow-emerald-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>Tutup & Mulai Melayani</span>
          </button>
        </div>
      </div>
    </div>
  );
};
