export type EmployeeRole = 
  | 'Dokter Spesialis'
  | 'Dokter Umum'
  | 'Perawat Rawat Inap'
  | 'Perawat IGD & ICU'
  | 'Bidan'
  | 'Apoteker / Farmasi'
  | 'Analis Laboratorium'
  | 'Radiografer'
  | 'Nutrisionis / Gizi'
  | 'Rekam Medis'
  | 'Manajemen & SDM'
  | 'Keuangan & Kasir'
  | 'Keamanan (Satpam)'
  | 'Sanitasi & Driver Medis';

export type Department = 
  | 'Instalasi Gawat Darurat (IGD)'
  | 'Intensive Care Unit (ICU)'
  | 'Rawat Inap Shofa & Marwah'
  | 'Poliklinik Spesialis'
  | 'Instalasi Farmasi'
  | 'Laboratorium Patologi'
  | 'Radiologi & Diagnostik'
  | 'Instalasi Kebidanan & VK'
  | 'Direksi & SDM'
  | 'Keuangan & Akuntansi'
  | 'Pelayanan Umum & Keamanan';

export type ShiftType = '3-Shift' | 'Non-Shift';

export interface ShiftDefinition {
  id: string;
  name: string;
  code: string;
  startTime: string; // "07:00"
  endTime: string;   // "14:00"
  toleranceLateMinutes: number;
  description: string;
  color: string;
}

export interface Employee {
  id: string;
  nip: string; // Nomor Induk Pegawai RSI Sultan Agung
  name: string;
  title: string;
  role: EmployeeRole;
  department: Department;
  avatar: string;
  phone: string;
  email: string;
  shiftType: ShiftType;
  currentShiftId: string;
  joinDate: string;
  status: 'active' | 'on_leave' | 'off';
  faceRegistered: boolean;
  registeredFacePhoto?: string;
  isAdmin?: boolean;
  password?: string; // PIN / Kata Sandi Login
}

export interface HospitalLocation {
  name: string;
  shortName: string;
  address: string;
  latitude: number;
  longitude: number;
  allowedRadiusMeters: number; // default e.g. 150m
  city: string;
  timezone: string; // WITA
}

export type AttendanceType = 'masuk' | 'pulang' | 'lembur_masuk' | 'lembur_pulang';

export type AttendanceStatus = 
  | 'tepat_waktu' 
  | 'terlambat' 
  | 'pulang_awal' 
  | 'diluar_radius' 
  | 'dinas_luar' 
  | 'izin' 
  | 'sakit' 
  | 'cuti';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  employeeDepartment: Department;
  employeeRole: EmployeeRole;
  employeeAvatar: string;
  date: string; // YYYY-MM-DD
  type: AttendanceType;
  timestamp: string; // ISO string
  formattedTime: string; // "06:54:12 WITA"
  
  // Facial verification details
  photoUrl: string; // selfie snapshot
  faceVerificationScore: number; // 0 - 100%
  livenessVerified: boolean;
  
  // Geolocation details
  latitude: number;
  longitude: number;
  distanceToHospitalMeters: number;
  isWithinRadius: boolean;
  locationAccuracyMeters: number;
  locationAddress: string;
  isRealGpsHardware?: boolean;
  antiFakeGpsPassed?: boolean;
  mockLocationDetected?: boolean;
  gpsSignalQuality?: 'Optimal' | 'Baik' | 'Cukup' | 'Rendah' | 'Anomali';
  
  // Shift & Attendance state
  shiftId: string;
  shiftName: string;
  status: AttendanceStatus;
  notes?: string;
  isOutsideDuty?: boolean; // Dinas Luar
  verifiedByAI: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeNip: string;
  employeeDepartment: Department;
  type: 'Cuti Tahunan' | 'Izin Sakit' | 'Izin Dinas Luar' | 'Izin Keperluan Pribadi' | 'Cuti Melahirkan' | 'Tugas Belajar';
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentName?: string;
  status: 'pending' | 'approved' | 'rejected';
  approverName?: string;
  approvalDate?: string;
  rejectionReason?: string;
  createdAt: string;
}

export interface PrayerTimeInfo {
  subuh: string;
  terbit: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
  nextPrayer: string;
  timeRemaining: string;
}

export interface SystemStats {
  totalEmployees: number;
  presentToday: number;
  onTimeToday: number;
  lateToday: number;
  onLeaveToday: number;
  attendanceRate: number; // percentage
}
