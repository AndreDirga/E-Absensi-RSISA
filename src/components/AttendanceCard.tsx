import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  LogIn, 
  LogOut, 
  Clock, 
  AlertCircle, 
  FileText, 
  Send, 
  Sparkles, 
  ShieldCheck, 
  Briefcase,
  Layers,
  MapPin,
  Camera,
  AlertTriangle
} from 'lucide-react';
import { 
  AttendanceRecord, 
  AttendanceType, 
  Employee, 
  HospitalLocation, 
  ShiftDefinition 
} from '../types';
import { FaceScanner } from './FaceScanner';
import { LocationRadar } from './LocationRadar';
import { SuccessModal } from './SuccessModal';
import { evaluateGeofence, GeoCoordinate, AntiSpoofReport } from '../utils/geo';
import { playSuccessChime, playWarningSound, speakNotification } from '../utils/audio';

interface AttendanceCardProps {
  employee: Employee;
  hospitalConfig: HospitalLocation;
  shifts: ShiftDefinition[];
  onRecordAdded: (record: AttendanceRecord) => void;
  recentAttendances: AttendanceRecord[];
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({
  employee,
  hospitalConfig,
  shifts,
  onRecordAdded,
  recentAttendances,
}) => {
  const [attendanceType, setAttendanceType] = useState<AttendanceType>('masuk');
  const [selectedShiftId, setSelectedShiftId] = useState<string>(employee.currentShiftId || 'shift-pagi');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [faceScore, setFaceScore] = useState<number>(0);
  
  // Geolocation & Anti-Fake GPS state
  const [currentCoord, setCurrentCoord] = useState<GeoCoordinate>({
    latitude: hospitalConfig.latitude,
    longitude: hospitalConfig.longitude,
  });
  const [locationAddress, setLocationAddress] = useState<string>('Gedung Utama RSI Sultan Agung Banjarbaru');
  const [locationAccuracy, setLocationAccuracy] = useState<number>(8);
  const [antiSpoofReport, setAntiSpoofReport] = useState<AntiSpoofReport | null>(null);
  const [isGpsLive, setIsGpsLive] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [latestSuccessRecord, setLatestSuccessRecord] = useState<AttendanceRecord | null>(null);

  const selectedShift = shifts.find((s) => s.id === selectedShiftId) || shifts[0];
  const isDinasLuar = selectedShiftId === 'shift-dinas-luar';

  // Evaluate geofence
  const geofence = evaluateGeofence(
    currentCoord,
    { latitude: hospitalConfig.latitude, longitude: hospitalConfig.longitude },
    hospitalConfig.allowedRadiusMeters,
    locationAccuracy
  );

  // Check validity for submission with strict Anti-Fake GPS enforcement
  const isFaceValid = Boolean(capturedPhoto);
  const isMockLocationBlocked = Boolean(antiSpoofReport?.isMockDetected);
  const isLocationValid = (geofence.isInside || isDinasLuar) && !isMockLocationBlocked;
  const canSubmit = isFaceValid && isLocationValid && !isMockLocationBlocked && !submitting;

  const handleFaceCaptured = (dataUrl: string, score: number) => {
    setCapturedPhoto(dataUrl);
    setFaceScore(score);
  };

  const handleResetPhoto = () => {
    setCapturedPhoto(null);
    setFaceScore(0);
  };

  const handleCoordChange = (
    coord: GeoCoordinate, 
    addressLabel: string, 
    accuracy: number,
    report?: AntiSpoofReport,
    liveGps: boolean = true
  ) => {
    setCurrentCoord(coord);
    setLocationAddress(addressLabel);
    setLocationAccuracy(accuracy);
    if (report) {
      setAntiSpoofReport(report);
    }
    setIsGpsLive(liveGps);
  };

  // Submit Attendance Record
  const handleSubmitAttendance = () => {
    if (isMockLocationBlocked) {
      playWarningSound();
      alert('Presensi DITOLAK: Terdeteksi penggunaan aplikasi Fake Location / Mock GPS pihak ketiga. Harap nonaktifkan dan gunakan GPS perangkat asli.');
      return;
    }

    if (!canSubmit) {
      playWarningSound();
      return;
    }

    setSubmitting(true);
    const now = new Date();
    
    // Determine status (tepat waktu vs terlambat)
    let status: AttendanceRecord['status'] = 'tepat_waktu';
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const [shiftH, shiftM] = selectedShift.startTime.split(':').map(Number);
    const shiftStartMinutes = shiftH * 60 + shiftM;
    const currentMinutes = currentHour * 60 + currentMin;

    if (attendanceType === 'masuk') {
      if (currentMinutes > shiftStartMinutes + selectedShift.toleranceLateMinutes) {
        status = 'terlambat';
      }
    }

    if (isDinasLuar) {
      status = 'dinas_luar';
    }

    const formattedTime = now.toLocaleTimeString('id-ID', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }) + ' WITA';

    const newRecord: AttendanceRecord = {
      id: `att-${Date.now()}`,
      employeeId: employee.id,
      employeeName: employee.name,
      employeeNip: employee.nip,
      employeeDepartment: employee.department,
      employeeRole: employee.role,
      employeeAvatar: employee.avatar,
      date: now.toISOString().split('T')[0],
      type: attendanceType,
      timestamp: now.toISOString(),
      formattedTime,
      photoUrl: capturedPhoto || employee.avatar,
      faceVerificationScore: faceScore || 98.2,
      livenessVerified: true,
      latitude: currentCoord.latitude,
      longitude: currentCoord.longitude,
      distanceToHospitalMeters: geofence.distanceMeters,
      isWithinRadius: geofence.isInside,
      locationAccuracyMeters: locationAccuracy,
      locationAddress: locationAddress,
      isRealGpsHardware: isGpsLive && !isMockLocationBlocked,
      antiFakeGpsPassed: !isMockLocationBlocked,
      mockLocationDetected: isMockLocationBlocked,
      gpsSignalQuality: antiSpoofReport?.satelliteQuality || 'Optimal',
      shiftId: selectedShift.id,
      shiftName: `${selectedShift.name} (${selectedShift.startTime} - ${selectedShift.endTime})`,
      status,
      notes: notes.trim() || undefined,
      isOutsideDuty: isDinasLuar,
      verifiedByAI: true,
    };

    // Trigger celebration effects
    playSuccessChime();
    
    // Voice prompt
    const greeting = attendanceType === 'masuk' 
      ? `Presensi Masuk Berhasil untuk ${employee.name}. Selamat bertugas dengan ikhlas di Rumah Sakit Islam Sultan Agung Banjarbaru.`
      : `Presensi Pulang Berhasil. Terima kasih atas dedikasi pelayanan Anda hari ini di Rumah Sakit Islam Sultan Agung.`;
    speakNotification(greeting);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#059669', '#10b981', '#34d399', '#f59e0b', '#3b82f6'],
      });
    } catch {
      // ignore
    }

    onRecordAdded(newRecord);
    setLatestSuccessRecord(newRecord);
    setSubmitting(false);
  };

  // Check today's existing attendance for active employee
  const todayStr = new Date().toISOString().split('T')[0];
  const userTodayRecords = recentAttendances.filter(
    (a) => a.employeeId === employee.id && a.date === todayStr
  );
  const alreadyClockedIn = userTodayRecords.some((a) => a.type === 'masuk');
  const alreadyClockedOut = userTodayRecords.some((a) => a.type === 'pulang');

  // Real-time clock for the hero card
  const [liveHeroTime, setLiveHeroTime] = useState<string>('');
  const [liveHeroDate, setLiveHeroDate] = useState<string>('');

  React.useEffect(() => {
    const updateHeroClock = () => {
      const now = new Date();
      setLiveHeroTime(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Makassar',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
      setLiveHeroDate(
        now.toLocaleDateString('id-ID', {
          timeZone: 'Asia/Makassar',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      );
    };
    updateHeroClock();
    const timer = setInterval(updateHeroClock, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left Column (Flex 1.5): Biometric Scanner & Validation Status Cards */}
      <div className="w-full lg:flex-[1.4] flex flex-col gap-6">
        
        {/* Verification 1: AI Face Scanner matching Theme */}
        <FaceScanner
          employee={employee}
          onFaceCaptured={handleFaceCaptured}
          capturedPhoto={capturedPhoto}
          onResetPhoto={handleResetPhoto}
        />

        {/* 2-Column Grid: Location Validation & Shift Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Validation Card 1: Lokasi */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Validasi Lokasi</p>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">
                  {isDinasLuar ? 'Dinas Luar RS' : geofence.isInside ? 'Area Rumah Sakit' : 'Di Luar Area RS'}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Radius: <span className={`font-semibold ${geofence.isInside ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {geofence.distanceMeters} meter
                  </span> (Maks {hospitalConfig.allowedRadiusMeters}m)
                </p>
                <span className="text-[10px] text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-wider border border-blue-100">
                  {isDinasLuar ? 'DISPENSASI RADIUS' : 'PRESISI TINGGI (GPS)'}
                </span>
              </div>
            </div>
          </div>

          {/* Validation Card 2: Status Shift Kehadiran */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Status Kehadiran</p>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{selectedShift.name}</p>
                <p className="text-xs text-slate-500 mt-1">{selectedShift.startTime} — {selectedShift.endTime} WITA</p>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded mt-2 inline-block uppercase tracking-wider border border-emerald-100">
                  TOLERANSI {selectedShift.toleranceLateMinutes} MENIT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Verification 2: GPS Hospital Geofence Radar Details */}
        <LocationRadar
          hospitalConfig={hospitalConfig}
          currentCoord={currentCoord}
          onCoordChange={handleCoordChange}
          isDinasLuar={isDinasLuar}
        />
      </div>

      {/* Right Column (Flex 1): Primary Emerald Hero Box & Today's Attendance Feed */}
      <div className="w-full lg:flex-1 flex flex-col gap-6">
        
        {/* Emerald Hero Box matching Theme */}
        <div className="bg-emerald-900 rounded-2xl p-6 text-white shadow-lg shadow-emerald-900/20 flex flex-col justify-between overflow-hidden relative border border-emerald-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-800/50 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Waktu Saat Ini</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700 uppercase">
                WITA (UTC+8)
              </span>
            </div>
            <h3 className="text-4xl font-light mt-1.5 font-mono tracking-tight">
              {liveHeroTime || '07:19:42'} <span className="text-lg opacity-60 font-sans font-normal">WITA</span>
            </h3>
            <p className="text-sm text-emerald-300 mt-1 font-medium">{liveHeroDate}</p>
          </div>

          {/* Attendance Type Selector */}
          <div className="mt-6 pt-4 border-t border-emerald-800/80">
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-2">Pilih Jenis Absen</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAttendanceType('masuk')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  attendanceType === 'masuk'
                    ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-white/30'
                    : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-950'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceType('pulang')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  attendanceType === 'pulang'
                    ? 'bg-rose-600 text-white shadow-sm ring-2 ring-white/30'
                    : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-950'
                }`}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Pulang</span>
              </button>

              <button
                type="button"
                onClick={() => setAttendanceType('lembur_masuk')}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  attendanceType === 'lembur_masuk'
                    ? 'bg-amber-500 text-slate-900 shadow-sm ring-2 ring-white/30 font-extrabold'
                    : 'bg-emerald-950/60 text-emerald-200 hover:bg-emerald-950'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lembur</span>
              </button>
            </div>
          </div>

          {/* Shift selector dropdown in hero */}
          <div className="mt-3">
            <p className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider mb-1">Pilih Shift</p>
            <select
              value={selectedShiftId}
              onChange={(e) => setSelectedShiftId(e.target.value)}
              className="w-full bg-emerald-950/90 text-white text-xs px-3 py-2 rounded-xl border border-emerald-700/80 focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-white">
                  {s.name} ({s.startTime} - {s.endTime})
                </option>
              ))}
            </select>
          </div>

          {/* Notes input */}
          <div className="mt-3">
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan (opsional)..."
              className="w-full bg-emerald-950/70 text-white placeholder:text-emerald-400/60 text-xs px-3 py-2 rounded-xl border border-emerald-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
            />
          </div>

          {/* Anti-Mock / Fake GPS Alert if detected */}
          {isMockLocationBlocked && (
            <div className="mt-3 p-3 bg-rose-950/90 border border-rose-500 rounded-xl text-xs text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-300">Presensi Dikunci: Fake GPS Terdeteksi</p>
                <p className="text-[11px] text-slate-300 mt-0.5">
                  Dilarang menggunakan aplikasi pihak ketiga. Nonaktifkan Mock Location untuk melanjutkan.
                </p>
              </div>
            </div>
          )}

          {/* Big Action Button matching Theme */}
          <button
            id="btn-submit-attendance"
            disabled={!canSubmit}
            onClick={handleSubmitAttendance}
            className={`w-full py-4 rounded-xl font-bold text-base shadow-inner mt-4 transition-all uppercase tracking-wider cursor-pointer ${
              canSubmit
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white border-b-4 border-emerald-700 active:translate-y-1 active:border-b-0'
                : 'bg-emerald-950/80 text-emerald-400/50 border border-emerald-800 cursor-not-allowed'
            }`}
          >
            {submitting
              ? 'MEMPROSES PRESENSI...'
              : isMockLocationBlocked
              ? 'DILARANG FAKE GPS'
              : !isFaceValid
              ? 'AMBIL FOTO WAJAH DAHULU'
              : !isLocationValid
              ? 'DI LUAR RADIUS RS'
              : `PRESENSI ${attendanceType === 'masuk' ? 'MASUK' : 'PULANG'}`}
          </button>
        </div>

        {/* Riwayat Hari Ini Card matching Theme */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-tight">Riwayat Hari Ini</h3>
            <span className="text-[10px] text-emerald-600 font-bold uppercase">
              {todayStr}
            </span>
          </div>

          <div className="p-4 space-y-3">
            {/* Clock-in log row */}
            {userTodayRecords.find((a) => a.type === 'masuk') ? (
              (() => {
                const rec = userTodayRecords.find((a) => a.type === 'masuk')!;
                return (
                  <div className="flex gap-4 items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-10 bg-emerald-500 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 uppercase">MASUK KERJA</p>
                      <p className="text-[10px] text-slate-400 uppercase truncate">
                        Diterima • Facial ID ({rec.faceVerificationScore}%) • {rec.distanceToHospitalMeters}m
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-700 font-mono">{rec.formattedTime.split(' ')[0]}</p>
                      <p className="text-[10px] text-emerald-600 font-bold uppercase">
                        {rec.status === 'tepat_waktu' ? 'ON TIME' : 'TERLAMBAT'}
                      </p>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex gap-4 items-center p-3 rounded-xl border border-slate-100 opacity-60">
                <div className="w-2 h-10 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800 uppercase">MASUK KERJA</p>
                  <p className="text-[10px] text-slate-400 uppercase">Belum Tercatat</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-300 font-mono">--:--</p>
                </div>
              </div>
            )}

            {/* Clock-out log row */}
            {userTodayRecords.find((a) => a.type === 'pulang') ? (
              (() => {
                const rec = userTodayRecords.find((a) => a.type === 'pulang')!;
                return (
                  <div className="flex gap-4 items-center p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                    <div className="w-2 h-10 bg-rose-500 rounded-full shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 uppercase">PULANG KERJA</p>
                      <p className="text-[10px] text-slate-400 uppercase truncate">
                        Selesai Shift • Facial ID ({rec.faceVerificationScore}%)
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-slate-700 font-mono">{rec.formattedTime.split(' ')[0]}</p>
                      <p className="text-[10px] text-teal-600 font-bold uppercase">SELESAI</p>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="flex gap-4 items-center p-3 rounded-xl border border-slate-100 opacity-60">
                <div className="w-2 h-10 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-slate-800 uppercase">KELUAR KERJA</p>
                  <p className="text-[10px] text-slate-400 uppercase">Belum Tersedia</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-300 font-mono">--:--</p>
                </div>
              </div>
            )}
          </div>

          {/* Work Hours Progress footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100">
            <div className="flex justify-between items-center text-xs font-medium text-slate-500">
              <span>Status Kehadiran Hari Ini</span>
              <span className="text-slate-900 font-bold">
                {alreadyClockedIn && alreadyClockedOut ? 'Lengkap (Masuk & Pulang)' : alreadyClockedIn ? 'Sedang Bertugas' : 'Belum Absen'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  alreadyClockedIn && alreadyClockedOut
                    ? 'w-full bg-emerald-500'
                    : alreadyClockedIn
                    ? 'w-1/2 bg-amber-500'
                    : 'w-0'
                }`}
              />
            </div>
          </div>
        </div>

      </div>

      {/* Success Modal Receipt Popup */}
      {latestSuccessRecord && (
        <SuccessModal
          record={latestSuccessRecord}
          onClose={() => {
            setLatestSuccessRecord(null);
            handleResetPhoto();
          }}
        />
      )}
    </div>
  );
};
