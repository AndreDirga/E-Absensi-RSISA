import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { AttendanceRecord } from '../types';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
];

// Initialize Firebase safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
WORKSPACE_SCOPES.forEach((scope) => {
  provider.addScope(scope);
});
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Auth listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan access token dari Google Workspace Auth');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE DRIVE API INTEGRATION
// ==========================================

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  createdTime?: string;
  size?: string;
}

/**
 * List files created by this app in Google Drive
 */
export async function listDriveFiles(accessToken: string): Promise<DriveFileItem[]> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?fields=files(id,name,mimeType,webViewLink,createdTime,size)&pageSize=30&orderBy=createdTime desc',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'Gagal memuat berkas Google Drive');
    }

    const data = await response.json();
    return data.files || [];
  } catch (error) {
    console.error('Error listing Drive files:', error);
    throw error;
  }
}

/**
 * Upload a text / CSV / JSON backup to Google Drive
 */
export async function uploadTextFileToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/csv'
): Promise<DriveFileItem> {
  const metadata = {
    name: fileName,
    mimeType: mimeType,
    description: 'E-ABSENSI RSISA - Berkas Presensi Rumah Sakit Islam Sultan Agung Banjarbaru',
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}\r\n\r\n` +
    content +
    closeDelimiter;

  const response = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,createdTime',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gagal mengunggah berkas ke Google Drive');
  }

  return await response.json();
}

// ==========================================
// GOOGLE SHEETS API INTEGRATION
// ==========================================

export interface CreatedSheetResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

/**
 * Create a new Google Spreadsheet for Attendance Recap
 */
export async function createAttendanceSpreadsheet(
  accessToken: string,
  title: string = `Rekap Presensi RSISA - ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
): Promise<CreatedSheetResult> {
  const requestBody = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          title: 'Rekap Presensi Pegawai',
          gridProperties: {
            frozenRowCount: 1,
          },
        },
      },
    ],
  };

  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gagal membuat Google Spreadsheet baru');
  }

  const data = await response.json();
  const spreadsheetId = data.spreadsheetId;
  const spreadsheetUrl = data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Write header row
  const headers = [
    [
      'ID Presensi',
      'NIP',
      'Nama Pegawai',
      'Departemen / Instalasi',
      'Profesi / Role',
      'Tanggal',
      'Waktu (WITA)',
      'Jenis Presensi',
      'Shift Kerja',
      'Status Kehadiran',
      'Jarak ke RS (Meter)',
      'Akurasi Biometrik AI (%)',
      'Validasi GPS Asli',
      'Alamat Lokasi Presensi',
      'Keterangan / Catatan',
    ],
  ];

  await appendRowsToSpreadsheet(accessToken, spreadsheetId, 'Rekap Presensi Pegawai!A1', headers);

  return {
    spreadsheetId,
    spreadsheetUrl,
    title,
  };
}

/**
 * Append rows to an existing Google Spreadsheet
 */
export async function appendRowsToSpreadsheet(
  accessToken: string,
  spreadsheetId: string,
  range: string = 'Rekap Presensi Pegawai!A1',
  values: any[][]
): Promise<void> {
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(
    range
  )}:append?valueInputOption=USER_ENTERED`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      values,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Gagal menambahkan data ke Google Sheet');
  }
}

/**
 * Export full attendance records list into a new Google Spreadsheet
 */
export async function exportAttendancesToGoogleSheet(
  accessToken: string,
  records: AttendanceRecord[],
  customTitle?: string
): Promise<CreatedSheetResult> {
  const now = new Date();
  const defaultTitle = `Presensi RSISA Banjarbaru - ${now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;

  const sheet = await createAttendanceSpreadsheet(accessToken, customTitle || defaultTitle);

  if (records.length > 0) {
    const rows = records.map((r) => [
      r.id,
      r.employeeNip,
      r.employeeName,
      r.employeeDepartment,
      r.employeeRole,
      r.date,
      r.formattedTime,
      r.type === 'masuk' ? 'Presensi Masuk' : r.type === 'pulang' ? 'Presensi Pulang' : 'Lembur',
      r.shiftName,
      r.status === 'tepat_waktu' ? 'Tepat Waktu' : r.status === 'terlambat' ? 'Terlambat' : 'Dinas Luar',
      r.distanceToHospitalMeters,
      `${r.faceVerificationScore}%`,
      r.antiFakeGpsPassed ? 'GPS Asli Terverifikasi (Bebas Mock)' : 'GPS Standar',
      r.locationAddress,
      r.notes || '-',
    ]);

    await appendRowsToSpreadsheet(accessToken, sheet.spreadsheetId, 'Rekap Presensi Pegawai!A2', rows);
  }

  return sheet;
}
