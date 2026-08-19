import React, { useState, useEffect } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Compass, 
  Navigation, 
  ShieldCheck, 
  Maximize2,
  RefreshCw,
  ExternalLink,
  Key
} from 'lucide-react';
import { HospitalLocation } from '../types';
import { GeoCoordinate, formatDistance } from '../utils/geo';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

export const hasValidGoogleMapsKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface HospitalGoogleMapProps {
  hospitalConfig: HospitalLocation;
  userCoord: GeoCoordinate;
  distanceMeters: number;
  isWithinRadius: boolean;
  accuracyMeters: number;
  onRefreshGps?: () => void;
}

export const HospitalGoogleMap: React.FC<HospitalGoogleMapProps> = ({
  hospitalConfig,
  userCoord,
  distanceMeters,
  isWithinRadius,
  accuracyMeters,
  onRefreshGps,
}) => {
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('hybrid');
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: hospitalConfig.latitude,
    lng: hospitalConfig.longitude,
  });
  const [zoom, setZoom] = useState<number>(17);

  // Center coordinate
  const hospitalPos = { lat: hospitalConfig.latitude, lng: hospitalConfig.longitude };
  const userPos = { lat: userCoord.latitude, lng: userCoord.longitude };

  const handleCenterHospital = () => {
    setCenter(hospitalPos);
    setZoom(18);
  };

  const handleCenterUser = () => {
    setCenter(userPos);
    setZoom(18);
  };

  if (!hasValidGoogleMapsKey) {
    return (
      <div className="w-full h-full min-h-[320px] rounded-2xl bg-slate-900 border border-slate-800 p-6 flex flex-col items-center justify-center text-center text-white relative overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

        <div className="w-12 h-12 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-3 z-10 shadow-lg">
          <MapPin className="w-6 h-6 animate-bounce" />
        </div>

        <h3 className="text-base font-bold text-white z-10">Google Maps Platform Diaktifkan</h3>
        <p className="text-xs text-slate-300 max-w-md mt-1 mb-4 z-10 leading-relaxed">
          Peta satelit Google Maps Platform terintegrasi untuk memantau geofence RSI Sultan Agung Banjarbaru. Masukkan API Key Anda untuk membuka tampilan satelit Google Maps beresolusi tinggi.
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-left text-xs max-w-md w-full space-y-2 z-10 mb-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold">
            <Key className="w-4 h-4" />
            <span>Cara Menambahkan API Key Google Maps:</span>
          </div>
          <ol className="list-decimal list-inside text-slate-300 space-y-1 text-[11px] leading-relaxed">
            <li>Buka <strong>Settings</strong> (ikon ⚙️ di pojok kanan atas) → <strong>Secrets</strong></li>
            <li>Ketik <code>GOOGLE_MAPS_PLATFORM_KEY</code> lalu tekan <strong>Enter</strong></li>
            <li>Tempelkan API Key Google Maps Anda lalu tekan <strong>Enter</strong></li>
          </ol>
        </div>

        {/* Live Fallback Radar Summary */}
        <div className="flex items-center gap-4 text-xs font-mono bg-emerald-900/40 border border-emerald-500/30 px-4 py-2 rounded-xl text-emerald-300 z-10">
          <span>Jarak ke RS: <strong>{formatDistance(distanceMeters)}</strong></span>
          <span>•</span>
          <span>Status: <strong className={isWithinRadius ? 'text-emerald-400' : 'text-rose-400'}>{isWithinRadius ? 'Dalam Radius RS' : 'Di Luar Radius'}</strong></span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[320px] rounded-2xl overflow-hidden border border-slate-700 shadow-inner bg-slate-950 flex flex-col">
      {/* Top Floating Controls */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Status Pill */}
        <div className={`px-3 py-1.5 rounded-xl backdrop-blur-md border text-xs font-bold flex items-center gap-1.5 shadow-lg pointer-events-auto ${
          isWithinRadius 
            ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300' 
            : 'bg-rose-950/90 border-rose-500/60 text-rose-300'
        }`}>
          <ShieldCheck className="w-4 h-4" />
          <span>{isWithinRadius ? 'Dalam Radius RS' : 'Di Luar Radius RS'}</span>
          <span className="opacity-60">({formatDistance(distanceMeters)})</span>
        </div>

        {/* Map Type Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700 shadow-lg pointer-events-auto">
          <button
            onClick={() => setMapType('roadmap')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
              mapType === 'roadmap' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Peta
          </button>
          <button
            onClick={() => setMapType('hybrid')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
              mapType === 'hybrid' ? 'bg-emerald-600 text-white' : 'text-slate-300 hover:text-white'
            }`}
          >
            Satelit
          </button>
        </div>
      </div>

      {/* Google Maps Container */}
      <div className="w-full h-full flex-1">
        <APIProvider apiKey={API_KEY} version="weekly">
          <Map
            defaultCenter={hospitalPos}
            center={center}
            zoom={zoom}
            mapTypeId={mapType}
            mapId="DEMO_MAP_ID"
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
            gestureHandling="greedy"
            disableDefaultUI={true}
          >
            {/* Hospital Advanced Marker */}
            <AdvancedMarker position={hospitalPos} title={hospitalConfig.name}>
              <Pin
                background="#059669"
                borderColor="#10b981"
                glyphColor="#ffffff"
                scale={1.2}
              />
            </AdvancedMarker>

            {/* User Live GPS Marker */}
            <AdvancedMarker position={userPos} title="Posisi Anda Terkini">
              <div className="relative flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-emerald-400 opacity-75" />
                <Pin
                  background={isWithinRadius ? '#10b981' : '#f43f5e'}
                  borderColor="#ffffff"
                  glyphColor="#ffffff"
                  scale={1.0}
                />
              </div>
            </AdvancedMarker>
          </Map>
        </APIProvider>
      </div>

      {/* Bottom Floating Navigation Buttons */}
      <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none">
        <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700 text-[11px] text-white flex items-center gap-2 shadow-lg pointer-events-auto">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold truncate max-w-[180px] sm:max-w-xs">{hospitalConfig.name}</span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={handleCenterHospital}
            className="p-2 rounded-xl bg-slate-900/90 text-emerald-400 hover:text-white hover:bg-slate-800 border border-slate-700 shadow-lg backdrop-blur-md transition-all cursor-pointer"
            title="Pusatkan ke RSI Sultan Agung"
          >
            <Building2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleCenterUser}
            className="p-2 rounded-xl bg-slate-900/90 text-emerald-400 hover:text-white hover:bg-slate-800 border border-slate-700 shadow-lg backdrop-blur-md transition-all cursor-pointer"
            title="Pusatkan ke Posisi GPS Saya"
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
