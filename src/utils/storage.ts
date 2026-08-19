import { AttendanceRecord, Employee, HospitalLocation, LeaveRequest, ShiftDefinition } from '../types';
import {
  INITIAL_ATTENDANCES,
  INITIAL_EMPLOYEES,
  INITIAL_LEAVE_REQUESTS,
  RSI_SULTAN_AGUNG_LOCATION,
  SHIFT_DEFINITIONS,
} from '../data/mockData';

const KEYS = {
  EMPLOYEES: 'rsisa_presensi_employees_v1',
  ATTENDANCES: 'rsisa_presensi_attendances_v1',
  LEAVES: 'rsisa_presensi_leaves_v1',
  HOSPITAL_CONFIG: 'rsisa_presensi_hospital_v1',
  CURRENT_USER_ID: 'rsisa_presensi_current_user_v1',
  AUTH_SESSION: 'rsisa_presensi_auth_session_v1',
  SHIFTS: 'rsisa_presensi_shifts_v1',
};

export function getStoredEmployees(): Employee[] {
  try {
    const raw = localStorage.getItem(KEYS.EMPLOYEES);
    if (!raw) {
      localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_EMPLOYEES;
  }
}

export function saveStoredEmployees(employees: Employee[]) {
  try {
    localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
  } catch {
    // ignore quota errors
  }
}

export function getStoredAttendances(): AttendanceRecord[] {
  try {
    const raw = localStorage.getItem(KEYS.ATTENDANCES);
    if (!raw) {
      localStorage.setItem(KEYS.ATTENDANCES, JSON.stringify(INITIAL_ATTENDANCES));
      return INITIAL_ATTENDANCES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_ATTENDANCES;
  }
}

export function saveStoredAttendances(attendances: AttendanceRecord[]) {
  try {
    localStorage.setItem(KEYS.ATTENDANCES, JSON.stringify(attendances));
  } catch {
    // ignore
  }
}

export function addAttendanceRecord(record: AttendanceRecord): AttendanceRecord[] {
  const current = getStoredAttendances();
  const updated = [record, ...current];
  saveStoredAttendances(updated);
  return updated;
}

export function getStoredLeaves(): LeaveRequest[] {
  try {
    const raw = localStorage.getItem(KEYS.LEAVES);
    if (!raw) {
      localStorage.setItem(KEYS.LEAVES, JSON.stringify(INITIAL_LEAVE_REQUESTS));
      return INITIAL_LEAVE_REQUESTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_LEAVE_REQUESTS;
  }
}

export function saveStoredLeaves(leaves: LeaveRequest[]) {
  try {
    localStorage.setItem(KEYS.LEAVES, JSON.stringify(leaves));
  } catch {
    // ignore
  }
}

export function addLeaveRequest(leave: LeaveRequest): LeaveRequest[] {
  const current = getStoredLeaves();
  const updated = [leave, ...current];
  saveStoredLeaves(updated);
  return updated;
}

export function updateLeaveStatus(
  leaveId: string,
  status: 'approved' | 'rejected',
  approverName: string,
  rejectionReason?: string
): LeaveRequest[] {
  const current = getStoredLeaves();
  const updated = current.map((item) =>
    item.id === leaveId
      ? {
          ...item,
          status,
          approverName,
          approvalDate: new Date().toISOString(),
          rejectionReason: rejectionReason || item.rejectionReason,
        }
      : item
  );
  saveStoredLeaves(updated);
  return updated;
}

export function getStoredHospitalConfig(): HospitalLocation {
  try {
    const raw = localStorage.getItem(KEYS.HOSPITAL_CONFIG);
    if (!raw) {
      localStorage.setItem(KEYS.HOSPITAL_CONFIG, JSON.stringify(RSI_SULTAN_AGUNG_LOCATION));
      return RSI_SULTAN_AGUNG_LOCATION;
    }
    return JSON.parse(raw);
  } catch {
    return RSI_SULTAN_AGUNG_LOCATION;
  }
}

export function saveStoredHospitalConfig(config: HospitalLocation) {
  try {
    localStorage.setItem(KEYS.HOSPITAL_CONFIG, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function getStoredShifts(): ShiftDefinition[] {
  try {
    const raw = localStorage.getItem(KEYS.SHIFTS);
    if (!raw) {
      localStorage.setItem(KEYS.SHIFTS, JSON.stringify(SHIFT_DEFINITIONS));
      return SHIFT_DEFINITIONS;
    }
    return JSON.parse(raw);
  } catch {
    return SHIFT_DEFINITIONS;
  }
}

export function getStoredActiveUserId(): string {
  try {
    const saved = localStorage.getItem(KEYS.CURRENT_USER_ID);
    return saved || 'emp-002'; // Default Ns. Ahmad Fauzi (IGD Nurse)
  } catch {
    return 'emp-002';
  }
}

export function saveStoredActiveUserId(userId: string) {
  try {
    localStorage.setItem(KEYS.CURRENT_USER_ID, userId);
  } catch {
    // ignore
  }
}

export function getStoredAuthSession(): string | null {
  try {
    return localStorage.getItem(KEYS.AUTH_SESSION);
  } catch {
    return null;
  }
}

export function saveStoredAuthSession(userId: string | null) {
  try {
    if (userId) {
      localStorage.setItem(KEYS.AUTH_SESSION, userId);
      localStorage.setItem(KEYS.CURRENT_USER_ID, userId);
    } else {
      localStorage.removeItem(KEYS.AUTH_SESSION);
    }
  } catch {
    // ignore
  }
}

export function registerNewEmployee(newEmpData: Omit<Employee, 'id'>): { success: boolean; employee?: Employee; error?: string } {
  const employees = getStoredEmployees();
  
  // Check duplicate NIP
  const duplicateNip = employees.find(
    (e) => e.nip.trim().toLowerCase() === newEmpData.nip.trim().toLowerCase()
  );
  if (duplicateNip) {
    return { success: false, error: `NIP '${newEmpData.nip}' sudah terdaftar atas nama ${duplicateNip.name}` };
  }

  // Check duplicate Email
  const duplicateEmail = employees.find(
    (e) => e.email.trim().toLowerCase() === newEmpData.email.trim().toLowerCase()
  );
  if (duplicateEmail) {
    return { success: false, error: `Email '${newEmpData.email}' sudah terdaftar atas nama ${duplicateEmail.name}` };
  }

  const newId = `emp-${String(Date.now()).slice(-6)}`;
  const createdEmployee: Employee = {
    ...newEmpData,
    id: newId,
    status: 'active',
    faceRegistered: Boolean(newEmpData.registeredFacePhoto || newEmpData.faceRegistered),
  };

  const updatedEmployees = [createdEmployee, ...employees];
  saveStoredEmployees(updatedEmployees);
  saveStoredAuthSession(createdEmployee.id);

  return { success: true, employee: createdEmployee };
}

export function resetAllDataToDefault() {
  localStorage.clear();
  return {
    employees: INITIAL_EMPLOYEES,
    attendances: INITIAL_ATTENDANCES,
    leaves: INITIAL_LEAVE_REQUESTS,
    hospitalConfig: RSI_SULTAN_AGUNG_LOCATION,
    shifts: SHIFT_DEFINITIONS,
    activeUserId: 'emp-002',
  };
}
