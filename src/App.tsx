/**
 * E-ABSENSI RSI Sultan Agung Banjarbaru
 * Sistem Absensi Online Pegawai dengan Verifikasi Wajah AI, Geofencing Jarak Rumah Sakit, & Rekap Kehadiran
 */

import React, { useState, useEffect } from 'react';
import { 
  getStoredEmployees, 
  getStoredAttendances, 
  getStoredLeaves, 
  getStoredHospitalConfig, 
  getStoredShifts, 
  getStoredActiveUserId, 
  saveStoredActiveUserId, 
  getStoredAuthSession,
  saveStoredAuthSession,
  registerNewEmployee,
  addAttendanceRecord, 
  addLeaveRequest, 
  updateLeaveStatus, 
  saveStoredHospitalConfig, 
  resetAllDataToDefault 
} from './utils/storage';
import { AttendanceRecord, Employee, HospitalLocation, LeaveRequest, ShiftDefinition } from './types';
import { AuthPage } from './components/AuthPage';
import { Navbar } from './components/Navbar';
import { AttendanceCard } from './components/AttendanceCard';
import { AttendanceHistory } from './components/AttendanceHistory';
import { LeaveRequestModal } from './components/LeaveRequestModal';
import { AdminDashboard } from './components/AdminDashboard';
import { ShiftAndIslamicInfo } from './components/ShiftAndIslamicInfo';
import { PermissionPromptModal } from './components/PermissionPromptModal';
import { MobileBottomNav } from './components/MobileBottomNav';
import { Building2, Heart, Sparkles, ShieldAlert, Lock, UserCheck, ArrowRight } from 'lucide-react';

export default function App() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [activeEmployeeId, setActiveEmployeeId] = useState<string>('emp-002');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Check if session token exists in localStorage
    return Boolean(getStoredAuthSession());
  });
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [hospitalConfig, setHospitalConfig] = useState<HospitalLocation>(getStoredHospitalConfig());
  const [shifts, setShifts] = useState<ShiftDefinition[]>(getStoredShifts());
  const [activeTab, setActiveTab] = useState<'presensi' | 'riwayat' | 'izin' | 'admin' | 'jadwal_doa'>('presensi');
  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(false);

  // Load initial stored data & check permissions prompt for new users
  useEffect(() => {
    const loadedEmps = getStoredEmployees();
    setEmployees(loadedEmps);

    const loadedAttendances = getStoredAttendances();
    setAttendances(loadedAttendances);

    const loadedLeaves = getStoredLeaves();
    setLeaves(loadedLeaves);

    const sessionUserId = getStoredAuthSession();
    if (sessionUserId && loadedEmps.some((e) => e.id === sessionUserId)) {
      setActiveEmployeeId(sessionUserId);
      setIsAuthenticated(true);
    } else {
      const storedUserId = getStoredActiveUserId();
      if (loadedEmps.some((e) => e.id === storedUserId)) {
        setActiveEmployeeId(storedUserId);
      } else if (loadedEmps.length > 0) {
        setActiveEmployeeId(loadedEmps[0].id);
      }
    }

    // Auto-prompt permission dialog for every new visitor
    const hasPrompted = localStorage.getItem('rsisa_permissions_prompted');
    if (!hasPrompted) {
      // Delay slightly for smooth entering experience
      const timer = setTimeout(() => {
        setShowPermissionModal(true);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handlePermissionsGranted = (camGranted: boolean, locGranted: boolean) => {
    localStorage.setItem('rsisa_permissions_prompted', 'true');
    localStorage.setItem('rsisa_camera_granted', String(camGranted));
    localStorage.setItem('rsisa_location_granted', String(locGranted));
  };

  const activeEmployee =
    employees.find((e) => e.id === activeEmployeeId) || employees[0] || {
      id: 'emp-002',
      nip: 'RSISA-2020-02118',
      name: 'Ns. Ahmad Fauzi, S.Kep',
      title: 'Kepala Tim Keperawatan Gawat Darurat',
      role: 'Perawat IGD & ICU',
      department: 'Instalasi Gawat Darurat (IGD)',
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=256',
      phone: '0813-4890-3321',
      email: 'ahmad.fauzi@rsisultanagung-bjb.co.id',
      shiftType: '3-Shift',
      currentShiftId: 'shift-pagi',
      joinDate: '2020-06-15',
      status: 'active',
      faceRegistered: true,
      isAdmin: false,
    };

  const isHRD = Boolean(activeEmployee.isAdmin || activeEmployee.role === 'Manajemen & SDM');

  // Handle Login & Signup Callbacks
  const handleLoginSuccess = (emp: Employee) => {
    setActiveEmployeeId(emp.id);
    saveStoredActiveUserId(emp.id);
    saveStoredAuthSession(emp.id);
    setIsAuthenticated(true);
    setActiveTab('presensi');
  };

  const handleRegisterSuccess = (newEmployeeData: Omit<Employee, 'id'>) => {
    const res = registerNewEmployee(newEmployeeData);
    if (res.success && res.employee) {
      setEmployees(getStoredEmployees());
      setActiveEmployeeId(res.employee.id);
      saveStoredActiveUserId(res.employee.id);
      saveStoredAuthSession(res.employee.id);
    }
    return res;
  };

  const handleLogout = () => {
    saveStoredAuthSession(null);
    setIsAuthenticated(false);
  };

  const handleAddAttendance = (record: AttendanceRecord) => {
    const updated = addAttendanceRecord(record);
    setAttendances(updated);
  };

  const handleAddLeave = (leave: LeaveRequest) => {
    const updated = addLeaveRequest(leave);
    setLeaves(updated);
  };

  const handleUpdateLeaveStatus = (leaveId: string, status: 'approved' | 'rejected') => {
    const approver = 'Dewi Sartika, S.E. (Kabag SDM)';
    const updated = updateLeaveStatus(leaveId, status, approver);
    setLeaves(updated);
  };

  const handleUpdateHospitalConfig = (newConfig: HospitalLocation) => {
    saveStoredHospitalConfig(newConfig);
    setHospitalConfig(newConfig);
  };

  const handleResetAllData = () => {
    if (confirm('Kembalikan semua data demo ke setelan awal?')) {
      const reset = resetAllDataToDefault();
      setEmployees(reset.employees);
      setAttendances(reset.attendances);
      setLeaves(reset.leaves);
      setHospitalConfig(reset.hospitalConfig);
      setShifts(reset.shifts);
      setActiveEmployeeId(reset.activeUserId);
      setIsAuthenticated(false);
    }
  };

  // Today's attendance count for badge
  const todayStr = new Date().toISOString().split('T')[0];
  const todayClockInCount = attendances.filter((a) => a.date === todayStr && a.type === 'masuk').length;

  // If not authenticated, render Login/Sign Up gateway page
  if (!isAuthenticated) {
    return (
      <AuthPage
        employees={employees}
        hospitalConfig={hospitalConfig}
        onLoginSuccess={handleLoginSuccess}
        onRegisterSuccess={handleRegisterSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Top App Bar & Switcher */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeEmployee={activeEmployee}
        hospitalConfig={hospitalConfig}
        todayCount={todayClockInCount}
        onOpenPermissions={() => setShowPermissionModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-3.5 sm:py-7 pb-28 sm:pb-8">
        {activeTab === 'presensi' && (
          <AttendanceCard
            employee={activeEmployee}
            hospitalConfig={hospitalConfig}
            shifts={shifts}
            onRecordAdded={handleAddAttendance}
            recentAttendances={attendances}
          />
        )}

        {activeTab === 'riwayat' && (
          <AttendanceHistory
            attendances={attendances}
            activeEmployee={activeEmployee}
          />
        )}

        {activeTab === 'izin' && (
          <LeaveRequestModal
            activeEmployee={activeEmployee}
            leaves={leaves}
            onAddLeave={handleAddLeave}
          />
        )}

        {activeTab === 'admin' && (
          isHRD ? (
            <AdminDashboard
              employees={employees}
              attendances={attendances}
              leaves={leaves}
              hospitalConfig={hospitalConfig}
              onUpdateHospitalConfig={handleUpdateHospitalConfig}
              onUpdateLeaveStatus={handleUpdateLeaveStatus}
              onResetAllData={handleResetAllData}
            />
          ) : (
            <div className="max-w-xl mx-auto my-8 bg-white rounded-3xl p-6 sm:p-8 border border-rose-200 shadow-xl text-center">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-8 ring-rose-50/50">
                <Lock className="w-8 h-8 text-rose-600" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 uppercase tracking-wider mb-3">
                <ShieldAlert className="w-3.5 h-3.5" />
                Akses Dibatasi — Khusus HRD
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
                Halaman Khusus Bagian SDM & HRD
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Akun saat ini <strong>{activeEmployee.name}</strong> ({activeEmployee.role}) berstatus sebagai pegawai umum dan tidak memiliki hak akses ke menu pengelolaan Geofence, rekapitulasi presensi seluruh karyawan, atau persetujuan cuti.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={handleLogout}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Keluar & Login dengan Akun HRD</span>
                </button>
                <button
                  onClick={() => setActiveTab('presensi')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Kembali ke Menu Presensi
                </button>
              </div>
            </div>
          )
        )}

        {activeTab === 'jadwal_doa' && (
          <ShiftAndIslamicInfo />
        )}
      </main>

      {/* Onboarding / Permission Request Modal for Camera & GPS */}
      <PermissionPromptModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        onPermissionsGranted={handlePermissionsGranted}
      />

      {/* Sticky Mobile Bottom Navigation Bar (Thumb ergonomic) */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        todayCount={todayClockInCount}
        isAdmin={isHRD}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-emerald-100 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-col sm:items-start text-center sm:text-left gap-0.5">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 font-medium text-slate-700">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Rumah Sakit Islam Sultan Agung Banjarbaru</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Jl. A. Yani Km. 17.5 Kompleks Kota Citra Graha, Liang Anggang, Banjarbaru, Kalimantan Selatan 70722 • Banjarbaru, Kalimantan Selatan
            </p>
            <p className="text-[11px] font-medium text-emerald-700 pt-0.5">
              created & powered by <span className="font-bold text-emerald-800">Borneo Dev</span>
            </p>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-emerald-800 font-semibold shrink-0">
            <span>Sistem Presensi Wajah AI & Geofencing GPS v2.4</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
