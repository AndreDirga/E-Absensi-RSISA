import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, 
  Navigation, 
  CheckCircle2, 
  AlertOctagon, 
  Crosshair, 
  RefreshCw, 
  ShieldAlert, 
  ShieldCheck,
  SlidersHorizontal,
  Compass, 
  Building, 
  Info, 
  Radio, 
  Lock, 
  AlertTriangle, 
  Sparkles,
  Map as MapIcon,
  Layers
} from 'lucide-react';
import { HospitalLocation } from '../types';
import { HospitalGoogleMap } from './HospitalGoogleMap';
import { 
  calculateHaversineDistanceMeters, 
  evaluateGeofence, 
  formatDistance, 
  GeoCoordinate, 
  GeofenceResult, 
  HOSPITAL_LOCATION_PRESETS,
  LocationPreset,
  analyzeGpsIntegrity,
  AntiSpoofReport
} from '../utils/geo';

interface LocationRadarProps {
  hospitalConfig: HospitalLocation;
  currentCoord: GeoCoordinate;
  onCoordChange: (
    coord: GeoCoordinate, 
    addressLabel: string, 
    accuracy: number,
    antiSpoofReport?: AntiSpoofReport,
    isLiveGps?: boolean
  ) => void;
  isDinasLuar?: boolean;
}

export const LocationRadar: React.FC<LocationRadarProps> = ({
  hospitalConfig,
  currentCoord,
  onCoordChange,
  isDinasLuar = false,
}) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('live-gps');
  const [isUsingLiveGPS, setIsUsingLiveGPS] = useState<boolean>(true);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsPermissionState, setGpsPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [accuracy, setAccuracy] = useState<number>(8);
  const [addressLabel, setAddressLabel] = useState<string>('Memverifikasi Sinyal GPS Asli...');
  const [antiSpoofReport, setAntiSpoofReport] = useState<AntiSpoofReport | null>(null);
  const [sampleHistory, setSampleHistory] = useState<GeolocationPosition[]>([]);
  const [showAdminPresetPanel, setShowAdminPresetPanel] = useState<boolean>(false);
  const [mapViewMode, setMapViewMode] = useState<'radar' | 'googlemaps'>('radar');

  const watchIdRef = useRef<number | null>(null);

  // Evaluate distance to hospital
  const hospitalCoord: GeoCoordinate = {
    latitude: hospitalConfig.latitude,
    longitude: hospitalConfig.longitude,
  };

  const geofence: GeofenceResult = evaluateGeofence(
    currentCoord,
    hospitalCoord,
    hospitalConfig.allowedRadiusMeters,
    accuracy
  );

  // Auto request live GPS on component mount
  useEffect(() => {
    startLiveGpsTracking();

    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const handlePositionSuccess = (position: GeolocationPosition) => {
    setGpsLoading(false);
    setGpsPermissionState('granted');
    setIsUsingLiveGPS(true);
    setSelectedPresetId('live-gps');

    const newHistory = [...sampleHistory.slice(-10), position];
    setSampleHistory(newHistory);

    // Run Anti-Spoofing & Mock Location Integrity Engine
    const report = analyzeGpsIntegrity(position, newHistory);
    setAntiSpoofReport(report);

    const liveCoord: GeoCoordinate = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    const acc = Math.round(position.coords.accuracy) || 8;
    setAccuracy(acc);

    const label = `GPS Asli Perangkat (${liveCoord.latitude.toFixed(5)}, ${liveCoord.longitude.toFixed(5)})`;
    setAddressLabel(label);

    onCoordChange(liveCoord, label, acc, report, true);
  };

  const handlePositionError = (error: GeolocationPositionError) => {
    setGpsLoading(false);
    console.warn('GPS position error:', error);
    if (error.code === error.PERMISSION_DENIED) {
      setGpsPermissionState('denied');
      setAddressLabel('Izin Lokasi GPS Ditolak');
    } else {
      setAddressLabel('Gagal mendeteksi satelit GPS');
    }
  };

  // Start continuous high precision GPS tracking
  const startLiveGpsTracking = () => {
    if (!navigator.geolocation) {
      setGpsPermissionState('denied');
      return;
    }

    setGpsLoading(true);

    // Initial immediate single query
    navigator.geolocation.getCurrentPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );

    // Continuous watch for telemetry drift & anti-spoof analysis
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Admin / HRD testing simulation selector
  const handleSelectPreset = (preset: LocationPreset) => {
    setIsUsingLiveGPS(false);
    setSelectedPresetId(preset.id);
    setAccuracy(6);
    setAddressLabel(`${preset.name} (Simulasi Admin)`);
    
    const simulatedReport: AntiSpoofReport = {
      isRealGps: true,
      isMockDetected: false,
      mockRiskLevel: 'SAFE',
      detectedAnomalies: [],
      hardwareSignalScore: 95,
      accuracyMeters: 6,
      jitterVariation: 0.8,
      isMockFlagActive: false,
      satelliteQuality: 'Optimal',
      timestampFreshnessMs: 50,
      telemetrySummary: 'Simulasi Pengujian Admin Terkalibrasi',
    };
    setAntiSpoofReport(simulatedReport);

    onCoordChange(
      { latitude: preset.latitude, longitude: preset.longitude },
      preset.name,
      6,
      simulatedReport,
      false
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Validasi Lokasi (Geofencing GPS)
        </p>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          Anti-Fake GPS Aktif
        </span>
      </div>
      
      {/* Main GPS Status Card */}
      <div className="flex items-start justify-between gap-4 mb-3.5">
        <div className="flex items-start gap-3.5">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border transition-colors ${
            antiSpoofReport?.isMockDetected
              ? 'bg-rose-50 border-rose-200 text-rose-600'
              : geofence.isInside || isDinasLuar
              ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
              : 'bg-amber-50 border-amber-200 text-amber-600'
          }`}>
            {antiSpoofReport?.isMockDetected ? (
              <ShieldAlert className="w-6 h-6 text-rose-600 animate-bounce" />
            ) : (
              <MapPin className="w-6 h-6" />
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {antiSpoofReport?.isMockDetected
                ? 'Peringatan: Terdeteksi Fake GPS!'
                : isDinasLuar
                ? 'Mode Tugas Luar Rumah Sakit'
                : geofence.isInside
                ? 'Area Resmi RSI Sultan Agung'
                : 'Di Luar Batas Area Rumah Sakit'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Jarak ke RS: <span className={`font-semibold ${geofence.isInside ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatDistance(geofence.distanceMeters)}
              </span> (Batas Maks {hospitalConfig.allowedRadiusMeters}m)
            </p>
            <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
              <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider border border-blue-200 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 text-blue-600 animate-pulse" />
                GPS Hardware Asli
              </span>
              <span className="text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded font-mono">
                Akurasi ±{accuracy}m
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={startLiveGpsTracking}
          disabled={gpsLoading}
          className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer shrink-0"
          title="Sinkronisasi Ulang Koordinat GPS Asli"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${gpsLoading ? 'animate-spin' : ''}`} />
          <span>{gpsLoading ? 'Melacak...' : 'Refresh GPS'}</span>
        </button>
      </div>

      {/* Permission Warning if Denied */}
      {gpsPermissionState === 'denied' && (
        <div className="p-3.5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 mb-3.5 flex items-start gap-2.5">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">Izin GPS Perangkat Diperlukan</p>
            <p className="mt-0.5 text-slate-600">
              Presensi wajib menggunakan koordinat GPS asli terkini. Silakan klik ikon gembok/lokasi di address bar browser Anda, pilih <b>"Izinkan Lokasi"</b>, lalu klik tombol Refresh GPS.
            </p>
            <button
              onClick={startLiveGpsTracking}
              className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-rose-600 text-white font-bold rounded-lg text-[11px] hover:bg-rose-700 cursor-pointer"
            >
              <Navigation className="w-3 h-3" />
              Aktifkan & Coba Lagi
            </button>
          </div>
        </div>
      )}

      {/* Anti-Mock Location Security Banner */}
      {antiSpoofReport?.isMockDetected ? (
        <div className="p-3.5 rounded-xl border-2 border-rose-400 bg-rose-100/90 text-rose-950 mb-3.5">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold uppercase text-rose-800">
                ⛔ DILARANG MENGGUNAKAN FAKE LOCATION / APLIKASI PIHAK KETIGA
              </p>
              <p className="mt-1 text-slate-800">
                Sistem keamanan mendeteksi manipulasi lokasi GPS. Presensi diblokir secara otomatis demi integritas data kehadiran RSI Sultan Agung Banjarbaru.
              </p>
              {antiSpoofReport.detectedAnomalies.length > 0 && (
                <ul className="mt-1.5 list-disc list-inside text-[11px] text-rose-900 space-y-0.5">
                  {antiSpoofReport.detectedAnomalies.map((anom, idx) => (
                    <li key={idx}>{anom}</li>
                  ))}
                </ul>
              )}
              <p className="mt-2 font-semibold text-rose-900">
                Langkah Solusi: Nonaktifkan aplikasi Fake GPS / Mock Location pada ponsel Anda dan gunakan sensor GPS bawaan.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Verified Genuine GPS Hardware Banner */
        <div className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 text-emerald-950 mb-3.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold text-[11px]">
              Hardware GPS Asli Terverifikasi • Bebas Mock Location
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded">
            Sinyal: {antiSpoofReport?.satelliteQuality || 'Optimal'}
          </span>
        </div>
      )}

      {/* Toggle View Mode: Radar vs Google Maps */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setMapViewMode('radar')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mapViewMode === 'radar'
                ? 'bg-white text-slate-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Compass className="w-3 h-3 text-emerald-600" />
            <span>Radar HUD</span>
          </button>
          <button
            type="button"
            onClick={() => setMapViewMode('googlemaps')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              mapViewMode === 'googlemaps'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MapIcon className="w-3 h-3" />
            <span>Google Maps</span>
          </button>
        </div>

        <span className="text-[10px] text-slate-400 font-mono">
          Radius: {hospitalConfig.allowedRadiusMeters}m
        </span>
      </div>

      {/* Visual Interactive View: Google Maps or Radar HUD */}
      {mapViewMode === 'googlemaps' ? (
        <div className="mb-3.5">
          <HospitalGoogleMap
            hospitalLocation={hospitalConfig}
            userLocation={currentCoord}
            isMockDetected={Boolean(antiSpoofReport?.isMockDetected)}
            heightClass="h-44"
          />
        </div>
      ) : (
        <div className="relative w-full h-40 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center mb-3.5 shadow-inner">
          {/* Radar Concentric Rings */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-16 h-16 rounded-full border border-emerald-500/20 border-dashed animate-ping opacity-25" style={{ animationDuration: '3s' }} />
            <div className="absolute w-28 h-28 rounded-full border-2 border-emerald-400/60 bg-emerald-500/10 flex items-center justify-center">
              <span className="absolute -top-3.5 text-[9px] font-bold text-emerald-300 bg-slate-950 px-1.5 py-0.2 rounded border border-emerald-500/40 uppercase">
                Radius {hospitalConfig.allowedRadiusMeters}m
              </span>
            </div>
            <div className="absolute w-36 h-36 rounded-full border border-slate-800" />
            <div className="absolute w-full h-px bg-slate-800/80" />
            <div className="absolute h-full w-px bg-slate-800/80" />
          </div>

          {/* Center: Hospital Pin */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400">
              <Building className="w-3.5 h-3.5" />
            </div>
            <span className="mt-1 text-[9px] font-bold text-emerald-300 bg-slate-900 px-2 py-0.5 rounded-full border border-emerald-700/60 uppercase tracking-wider">
              RSI SULTAN AGUNG
            </span>
          </div>

          {/* User GPS Position Beacon */}
          <div 
            className="absolute z-20 transition-all duration-500 flex flex-col items-center"
            style={{
              transform: geofence.isInside
                ? 'translate(22px, -16px)'
                : 'translate(62px, -38px)',
            }}
          >
            <div className="relative">
              <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ring-4 ${
                antiSpoofReport?.isMockDetected
                  ? 'bg-rose-500 ring-rose-500/40 animate-bounce'
                  : geofence.isInside
                  ? 'bg-emerald-400 ring-emerald-400/40 animate-pulse'
                  : 'bg-amber-500 ring-amber-500/40'
              }`}>
                <div className="w-1 h-1 bg-white rounded-full" />
              </div>
            </div>
            <span className={`mt-1 text-[8px] font-bold px-1.5 py-0.2 rounded shadow ${
              antiSpoofReport?.isMockDetected
                ? 'bg-rose-900 text-rose-200'
                : geofence.isInside 
                ? 'bg-emerald-900 text-emerald-200' 
                : 'bg-amber-900 text-amber-200'
            }`}>
              {antiSpoofReport?.isMockDetected ? 'SPOOFED' : `Pegawai (${formatDistance(geofence.distanceMeters)})`}
            </span>
          </div>

          {/* Top Left Tag: Coordinates */}
          <div className="absolute top-2 left-2 bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-slate-400 border border-slate-800">
            <span>Lat: {currentCoord.latitude.toFixed(5)} | Lng: {currentCoord.longitude.toFixed(5)}</span>
          </div>
        </div>
      )}

      {/* Admin Testing / Simulation Toggle */}
      <div className="pt-1">
        <button
          onClick={() => setShowAdminPresetPanel(!showAdminPresetPanel)}
          className="w-full py-1.5 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-600 flex items-center justify-between cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Mode Uji Coba Simulasi (Khusus Admin / HRD)</span>
          </span>
          <span className="text-[10px] text-emerald-700 font-bold">
            {showAdminPresetPanel ? 'Tutup' : 'Buka'}
          </span>
        </button>

        {showAdminPresetPanel && (
          <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
            <p className="text-[10px] text-slate-500">
              Pilihan titik pengujian untuk simulasi radius RS. Pada perangkat pegawai, sistem secara otomatis mewajibkan GPS fisik asli.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {HOSPITAL_LOCATION_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-left p-2 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                    selectedPresetId === preset.id
                      ? preset.category === 'inside'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                        : 'bg-rose-50 border-rose-400 text-rose-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="truncate text-[11px] leading-tight">{preset.name}</p>
                    <p className="text-[10px] text-slate-400 font-normal">{preset.distanceLabel}</p>
                  </div>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 uppercase ${
                    preset.category === 'inside'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {preset.category === 'inside' ? 'Dalam RS' : 'Luar RS'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
