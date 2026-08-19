import React from 'react';
import { 
  Moon, 
  Sun, 
  Sparkles, 
  Clock, 
  HeartHandshake, 
  Layers, 
  Building2, 
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { getBanjarbaruPrayerTimes, ISLAMIC_HOSPITAL_DUAS } from '../utils/prayerTimes';
import { ISLAMIC_MEDICAL_QUOTES, SHIFT_DEFINITIONS } from '../data/mockData';

export const ShiftAndIslamicInfo: React.FC = () => {
  const prayerTimes = getBanjarbaruPrayerTimes();

  return (
    <div className="space-y-6">
      {/* Banjarbaru Prayer Times Header Card matching Professional Polish Theme */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-800/40 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 uppercase tracking-widest">
                WAKTU SHOLAT BANJARBARU (WITA)
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 tracking-tight">
              Jadwal Sholat & Ibadah Pegawai
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Masjid RSI Sultan Agung • Komplek Kota Citra Graha Banjarbaru
            </p>
          </div>

          <div className="p-3.5 bg-slate-800/80 backdrop-blur-md rounded-xl border border-slate-700 text-center min-w-36">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Sholat Berikutnya</span>
            <p className="text-lg font-bold text-white mt-0.5">{prayerTimes.nextPrayer}</p>
            <span className="text-[11px] text-slate-400">{prayerTimes.timeRemaining} lagi</span>
          </div>
        </div>

        {/* Prayer Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mt-6 relative z-10">
          <div className={`p-3 rounded-xl border text-center transition-all ${
            prayerTimes.nextPrayer.includes('Subuh')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
              : 'bg-slate-800/60 border-slate-700/60 text-white'
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Subuh</p>
            <p className="text-base font-bold font-mono mt-1">{prayerTimes.subuh}</p>
          </div>

          <div className="p-3 rounded-xl border bg-slate-800/60 border-slate-700/60 text-white text-center">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Terbit</p>
            <p className="text-base font-bold font-mono mt-1">{prayerTimes.terbit}</p>
          </div>

          <div className={`p-3 rounded-xl border text-center transition-all ${
            prayerTimes.nextPrayer.includes('Dzuhur')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
              : 'bg-slate-800/60 border-slate-700/60 text-white'
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dzuhur</p>
            <p className="text-base font-bold font-mono mt-1">{prayerTimes.dzuhur}</p>
          </div>

          <div className={`p-3 rounded-xl border text-center transition-all ${
            prayerTimes.nextPrayer.includes('Ashar')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
              : 'bg-slate-800/60 border-slate-700/60 text-white'
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ashar</p>
            <p className="text-base font-bold font-mono mt-1">{prayerTimes.ashar}</p>
          </div>

          <div className={`p-3 rounded-xl border text-center transition-all ${
            prayerTimes.nextPrayer.includes('Maghrib')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
              : 'bg-slate-800/60 border-slate-700/60 text-white'
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Maghrib</p>
            <p className="text-base font-bold font-mono mt-1">{prayerTimes.maghrib}</p>
          </div>

          <div className={`p-3 rounded-xl border text-center transition-all ${
            prayerTimes.nextPrayer.includes('Isya')
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
              : 'bg-slate-800/60 border-slate-700/60 text-white'
          }`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Isya</p>
            <p className="text-base font-bold font-mono mt-1">{prayerTimes.isya}</p>
          </div>
        </div>
      </div>

      {/* Islamic Medical Duas Collection */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Spiritualitas RS</p>
            <h3 className="text-sm font-bold text-slate-800 mt-0.5">
              Kumpulan Doa Pelayanan Medis Islami
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ISLAMIC_HOSPITAL_DUAS.map((d, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between"
            >
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 uppercase tracking-wider">
                  {d.category}
                </span>
                <h4 className="text-xs font-bold text-slate-800 mt-2">{d.title}</h4>
                <p className="font-serif text-right text-base text-slate-900 my-2 leading-relaxed">
                  {d.arabic}
                </p>
                <p className="text-[11px] text-slate-700 font-medium italic mb-1">
                  "{d.latin}"
                </p>
              </div>
              <p className="text-[10px] text-slate-500 border-t border-slate-200 pt-2 mt-2">
                <strong>Artinya:</strong> {d.meaning}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Hospital Shift Schedule Guide */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-5 h-5 text-emerald-600" />
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Jadwal Kerja</p>
            <h3 className="text-sm font-bold text-slate-800 mt-0.5">
              Struktur Shift Pelayanan 24 Jam RSI Sultan Agung Banjarbaru
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {SHIFT_DEFINITIONS.map((shift) => (
            <div
              key={shift.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">{shift.name}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-mono">
                  {shift.startTime} - {shift.endTime}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium">{shift.description}</p>
              <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200 pt-2">
                <span>Toleransi: <strong className="text-slate-700">{shift.toleranceLateMinutes} Menit</strong></span>
                <span className="text-emerald-600 font-bold uppercase tracking-wider text-[10px]">WITA (UTC+8)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
