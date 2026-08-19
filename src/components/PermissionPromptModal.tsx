import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Lock, 
  ArrowRight,
  RefreshCw,
  Building2,
  X
} from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface PermissionPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsGranted: (cameraGranted: boolean, locationGranted: boolean) => void;
}

export const PermissionPromptModal: React.FC<PermissionPromptModalProps> = ({
  isOpen,
  onClose,
  onPermissionsGranted,
}) => {
  const [cameraStatus, setCameraStatus] = useState<'pending' | 'requesting' | 'granted' | 'denied'>('pending');
  const [locationStatus, setLocationStatus] = useState<'pending' | 'requesting' | 'granted' | 'denied'>('pending');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepMessage, setStepMessage] = useState<string>('');

  // Check initial permission status if supported
  useEffect(() => {
    if (!isOpen) return;

    // Check camera permission if available
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'camera' as PermissionName })
        .then((res) => {
          if (res.state === 'granted') setCameraStatus('granted');
          else if (res.state === 'denied') setCameraStatus('denied');
        })
        .catch(() => {});

      navigator.permissions.query({ name: 'geolocation' as PermissionName })
        .then((res) => {
          if (res.state === 'granted') setLocationStatus('granted');
          else if (res.state === 'denied') setLocationStatus('denied');
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const requestAllPermissions = async () => {
    setIsProcessing(true);
    let camOk = false;
    let locOk = false;

    // 1. Request Camera Access
    setStepMessage('Meminta izin kamera perangkat...');
    setCameraStatus('requesting');
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: false,
        });
        // Stop stream immediately after permission is granted
        stream.getTracks().forEach((track) => track.stop());
        setCameraStatus('granted');
        camOk = true;
      } else {
        setCameraStatus('denied');
      }
    } catch (err) {
      console.warn('Camera permission denied or failed:', err);
      setCameraStatus('denied');
    }

    // 2. Request Geolocation Access
    setStepMessage('Meminta izin akses lokasi GPS...');
    setLocationStatus('requesting');
    try {
      if (navigator.geolocation) {
        await new Promise<void>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            () => {
              setLocationStatus('granted');
              locOk = true;
              resolve();
            },
            (geoErr) => {
              console.warn('Geolocation permission denied:', geoErr);
              setLocationStatus('denied');
              resolve();
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      } else {
        setLocationStatus('denied');
      }
    } catch {
      setLocationStatus('denied');
    }

    setIsProcessing(false);
    setStepMessage(
      camOk && locOk 
        ? 'Semua izin berhasil diaktifkan!' 
        : 'Izin telah diproses. Anda dapat melanjutkan ke aplikasi.'
    );

    if (camOk || locOk) {
      playSuccessChime();
    }

    onPermissionsGranted(camOk, locOk);

    // Auto close after 1.2s if both granted
    if (camOk && locOk) {
      setTimeout(() => {
        onClose();
      }, 1200);
    }
  };

  const allGranted = cameraStatus === 'granted' && locationStatus === 'granted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header with Islamic Hospital Polish Design */}
        <div className="bg-slate-900 px-6 py-5 text-white flex justify-between items-center relative overflow-hidden border-b border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest leading-none">
                E-ABSENSI RESMI
              </p>
              <h3 className="text-base font-bold text-white leading-tight mt-1">
                Izin Akses Kamera & Lokasi GPS
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Untuk memastikan presensi pegawai <strong>RSI Sultan Agung Banjarbaru</strong> tercatat valid dan terverifikasi, aplikasi memerlukan izin akses berikut pada perangkat Anda:
          </p>

          {/* Cards for Permissions */}
          <div className="space-y-3">
            {/* Camera Permission Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              cameraStatus === 'granted' 
                ? 'bg-emerald-50/80 border-emerald-200' 
                : cameraStatus === 'denied'
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    cameraStatus === 'granted' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      1. Akses Kamera (Biometrik Wajah)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Digunakan untuk verifikasi kontur wajah & anti-spoofing saat melakukan presensi masuk/pulang.
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                  cameraStatus === 'granted'
                    ? 'bg-emerald-600 text-white'
                    : cameraStatus === 'requesting'
                    ? 'bg-amber-500 text-white animate-pulse'
                    : cameraStatus === 'denied'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {cameraStatus === 'granted' && '✓ Diizinkan'}
                  {cameraStatus === 'requesting' && 'Meminta Izin...'}
                  {cameraStatus === 'denied' && 'Perlu Izin Manual'}
                  {cameraStatus === 'pending' && 'Belum Aktif'}
                </span>
              </div>
            </div>

            {/* GPS Location Permission Card */}
            <div className={`p-4 rounded-2xl border transition-all ${
              locationStatus === 'granted' 
                ? 'bg-emerald-50/80 border-emerald-200' 
                : locationStatus === 'denied'
                ? 'bg-amber-50/80 border-amber-200'
                : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    locationStatus === 'granted' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-200 text-slate-700'
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      2. Akses Lokasi GPS Asli (Anti-Fake Location)
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-normal">
                      Wajib menggunakan GPS perangkat asli terkini untuk memvalidasi posisi Anda dalam radius RSI Sultan Agung Banjarbaru. Dilarang menggunakan fake location atau aplikasi pihak ketiga.
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase shrink-0 ${
                  locationStatus === 'granted'
                    ? 'bg-emerald-600 text-white'
                    : locationStatus === 'requesting'
                    ? 'bg-amber-500 text-white animate-pulse'
                    : locationStatus === 'denied'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {locationStatus === 'granted' && '✓ Diizinkan'}
                  {locationStatus === 'requesting' && 'Mendeteksi...'}
                  {locationStatus === 'denied' && 'Perlu Izin Manual'}
                  {locationStatus === 'pending' && 'Belum Aktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Helper Tips if Denied */}
          {(cameraStatus === 'denied' || locationStatus === 'denied') && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Jika browser memblokir otomatis, silakan klik ikon <strong>Gembok / Pengaturan Situs</strong> di kiri bilah alamat URL peramban Anda dan ubah status Kamera serta Lokasi menjadi <strong>"Izinkan"</strong>.
              </span>
            </div>
          )}

          {stepMessage && (
            <p className="text-center text-xs font-semibold text-emerald-700">
              {stepMessage}
            </p>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
          {!allGranted ? (
            <button
              id="btn-grant-all-permissions"
              disabled={isProcessing}
              onClick={requestAllPermissions}
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Memproses Izin...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Izinkan Akses Kamera & GPS</span>
                </>
              )}
            </button>
          ) : (
            <button
              id="btn-finish-permissions"
              onClick={onClose}
              className="flex-1 py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Izin Lengkap • Lanjutkan Presensi</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors uppercase tracking-wider cursor-pointer text-center"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
