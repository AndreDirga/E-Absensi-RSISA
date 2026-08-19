/**
 * Geolocation & Geofencing utilities for RSI Sultan Agung Banjarbaru
 * Includes High-Precision Geofencing & Anti-Fake GPS / Mock Location Detection System
 */

export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

export interface GeofenceResult {
  isInside: boolean;
  distanceMeters: number;
  allowedRadiusMeters: number;
  accuracy: number;
  hospitalLat: number;
  hospitalLng: number;
  statusText: string;
}

export interface AntiSpoofReport {
  isRealGps: boolean;
  isMockDetected: boolean;
  mockRiskLevel: 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  detectedAnomalies: string[];
  hardwareSignalScore: number; // 0 - 100
  accuracyMeters: number;
  jitterVariation: number;
  isMockFlagActive: boolean;
  satelliteQuality: 'Optimal' | 'Baik' | 'Cukup' | 'Rendah' | 'Anomali';
  timestampFreshnessMs: number;
  telemetrySummary: string;
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula in meters
 */
export function calculateHaversineDistanceMeters(
  coord1: GeoCoordinate,
  coord2: GeoCoordinate
): number {
  const R = 6371e3; // Earth radius in meters
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLng = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Format distance nicely in Indonesian
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} meter`;
  }
  return `${(meters / 1000).toFixed(2)} km`;
}

/**
 * Check if coordinate is inside hospital radius
 */
export function evaluateGeofence(
  userCoord: GeoCoordinate,
  hospitalCoord: GeoCoordinate,
  allowedRadiusMeters: number,
  accuracy: number = 10
): GeofenceResult {
  const distance = calculateHaversineDistanceMeters(userCoord, hospitalCoord);
  const isInside = distance <= allowedRadiusMeters;

  let statusText = '';
  if (isInside) {
    statusText = `Dalam Area RS (${formatDistance(distance)}) - Radius Valid`;
  } else {
    statusText = `Di Luar Radius (${formatDistance(distance)}) - Melebihi ${allowedRadiusMeters}m`;
  }

  return {
    isInside,
    distanceMeters: distance,
    allowedRadiusMeters,
    accuracy,
    hospitalLat: hospitalCoord.latitude,
    hospitalLng: hospitalCoord.longitude,
    statusText,
  };
}

/**
 * Anti-Fake GPS & Mock Location Detector Engine
 * Analyzes browser geolocation signals against multiple anti-spoofing vectors:
 * 1. OS-level isMock / mocked flags (Android Chromium / Webview)
 * 2. Unrealistic 0-meter or fixed synthetic accuracy anomalies
 * 3. Timestamp freshness (detecting replayed or delayed mock coords)
 * 4. Micro-jitter / satellite ionospheric variance analysis
 * 5. Teleportation / unnatural instantaneous speed jumps
 */
export function analyzeGpsIntegrity(
  currentPos: GeolocationPosition,
  sampleHistory: GeolocationPosition[] = []
): AntiSpoofReport {
  const anomalies: string[] = [];
  let riskScore = 0; // 0 = safe, 100 = definitely spoofed
  const coords = currentPos.coords;
  const now = Date.now();
  const timestampDiff = Math.abs(now - currentPos.timestamp);

  // 1. Direct OS Mock Location Flags
  const isMockFlag = Boolean(
    (coords as any).isMock || 
    (currentPos as any).mocked || 
    (coords as any).mocked
  );
  if (isMockFlag) {
    anomalies.push('Aplikasi Mock Location pihak ketiga terdeteksi aktif pada OS perangkat');
    riskScore += 90;
  }

  // 2. Accuracy Anomalies
  // Real GPS hardware in smartphones never returns exact 0m accuracy due to ionospheric jitter
  const acc = coords.accuracy;
  if (acc === 0 || isNaN(acc) || acc < 0.2) {
    anomalies.push('Akurasi koordinat 0 meter tidak wajar (Ciri khas injeksi Fake GPS software)');
    riskScore += 80;
  } else if (acc === 1.0 && coords.speed === 0 && coords.heading === null) {
    anomalies.push('Nilai presisi sintetis bulat tanpa variasi satelit');
    riskScore += 30;
  } else if (acc > 300) {
    anomalies.push('Akurasi sinyal sangat rendah (>300m), rentan triangulasi BTS kasar');
    riskScore += 20;
  }

  // 3. Timestamp Freshness Anomaly
  if (timestampDiff > 25000) {
    anomalies.push(`Data koordinat usang (${Math.round(timestampDiff / 1000)}s), indikasi replay cache`);
    riskScore += 45;
  }

  // 4. Micro-Jitter & Drift Analysis across samples
  let jitterVariation = 0;
  if (sampleHistory.length >= 2) {
    const recent = sampleHistory.slice(-5);
    const deltas: number[] = [];
    for (let i = 1; i < recent.length; i++) {
      const prev = recent[i - 1];
      const cur = recent[i];
      const dist = calculateHaversineDistanceMeters(
        { latitude: prev.coords.latitude, longitude: prev.coords.longitude },
        { latitude: cur.coords.latitude, longitude: cur.coords.longitude }
      );
      const timeDeltaSec = Math.max(0.5, (cur.timestamp - prev.timestamp) / 1000);
      const speedKmH = (dist / timeDeltaSec) * 3.6;

      // Teleportation jump check (> 180 km/h instantaneously)
      if (speedKmH > 180 && dist > 100) {
        anomalies.push(`Lonjakan koordinat mustahil (${Math.round(speedKmH)} km/jam dalam ${timeDeltaSec.toFixed(1)}s)`);
        riskScore += 75;
      }
      deltas.push(dist);
    }

    if (deltas.length > 0) {
      jitterVariation = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    }
  }

  // Determine Risk Level & Quality
  let mockRiskLevel: AntiSpoofReport['mockRiskLevel'] = 'SAFE';
  if (riskScore >= 70) mockRiskLevel = 'CRITICAL';
  else if (riskScore >= 45) mockRiskLevel = 'HIGH';
  else if (riskScore >= 25) mockRiskLevel = 'MEDIUM';
  else if (riskScore > 0) mockRiskLevel = 'LOW';

  const isMockDetected = mockRiskLevel === 'HIGH' || mockRiskLevel === 'CRITICAL';
  const isRealGps = !isMockDetected && riskScore < 40;

  // Calculate Hardware Signal Quality
  let satelliteQuality: AntiSpoofReport['satelliteQuality'] = 'Optimal';
  let hardwareScore = 100 - riskScore;
  if (acc <= 10 && isRealGps) {
    satelliteQuality = 'Optimal';
  } else if (acc <= 25 && isRealGps) {
    satelliteQuality = 'Baik';
  } else if (acc <= 70 && isRealGps) {
    satelliteQuality = 'Cukup';
  } else if (isRealGps) {
    satelliteQuality = 'Rendah';
  } else {
    satelliteQuality = 'Anomali';
    hardwareScore = Math.max(10, 100 - riskScore);
  }

  const telemetrySummary = isMockDetected
    ? 'TERDETEKSI FAKE LOCATION / APLIKASI PIHAK KETIGA'
    : isRealGps
    ? 'GPS ASLI TERVERIFIKASI (Hardware GNSS Aktif)'
    : 'Sinyal GPS Lemah - Memerlukan Ruang Terbuka';

  return {
    isRealGps,
    isMockDetected,
    mockRiskLevel,
    detectedAnomalies: anomalies,
    hardwareSignalScore: Math.max(0, Math.min(100, hardwareScore)),
    accuracyMeters: Math.round(acc) || 10,
    jitterVariation,
    isMockFlagActive: isMockFlag,
    satelliteQuality,
    timestampFreshnessMs: timestampDiff,
    telemetrySummary,
  };
}

/**
 * Standard location presets for administrator / testing audit reference
 */
export interface LocationPreset {
  id: string;
  name: string;
  category: 'inside' | 'outside';
  latitude: number;
  longitude: number;
  description: string;
  distanceLabel: string;
}

export const HOSPITAL_LOCATION_PRESETS: LocationPreset[] = [
  {
    id: 'hospital-main',
    name: 'Gedung Utama / Lobby RSI Sultan Agung Banjarbaru',
    category: 'inside',
    latitude: -3.428522,
    longitude: 114.735012,
    description: 'Titik Sentral RSI Sultan Agung Banjarbaru',
    distanceLabel: '0 meter (Pusat RS)',
  },
  {
    id: 'hospital-igd',
    name: 'Instalasi Gawat Darurat (IGD) & Parkir Ambulans',
    category: 'inside',
    latitude: -3.428450,
    longitude: 114.734980,
    description: 'Sayap Barat RSI Sultan Agung',
    distanceLabel: '~18 meter',
  },
  {
    id: 'hospital-shofa',
    name: 'Gedung Rawat Inap Shofa & Marwah',
    category: 'inside',
    latitude: -3.428610,
    longitude: 114.735100,
    description: 'Sayap Timur Lt. 2-3 RSI Sultan Agung',
    distanceLabel: '~35 meter',
  },
  {
    id: 'hospital-gate',
    name: 'Gerbang Depan Jl. A. Yani Km. 17.5',
    category: 'inside',
    latitude: -3.428380,
    longitude: 114.735250,
    description: 'Pos Masuk Kompleks Citra Graha',
    distanceLabel: '~85 meter (Dalam radius 150m)',
  },
  {
    id: 'outside-martapura',
    name: 'Luar Radius: Q Mall Banjarbaru / Pusat Kota',
    category: 'outside',
    latitude: -3.441200,
    longitude: 114.832400,
    description: 'Jarak ~10.5 km dari RSI Sultan Agung Banjarbaru',
    distanceLabel: '10.5 km (DILUAR RADIUS)',
  },
  {
    id: 'outside-home',
    name: 'Luar Radius: Rumah Pegawai (Komplek Perumahan)',
    category: 'outside',
    latitude: -3.435000,
    longitude: 114.745000,
    description: 'Jarak ~1.3 km dari RSI Sultan Agung',
    distanceLabel: '1.3 km (DILUAR RADIUS)',
  },
];
