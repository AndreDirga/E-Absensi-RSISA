import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink, 
  UploadCloud, 
  Download, 
  FolderPlus,
  ShieldCheck,
  User,
  LogOut,
  Sparkles,
  FileText,
  Clock
} from 'lucide-react';
import { AttendanceRecord, Employee } from '../types';
import { 
  initAuth, 
  googleSignIn, 
  googleLogout, 
  getAccessToken,
  exportAttendancesToGoogleSheet, 
  uploadTextFileToDrive, 
  listDriveFiles, 
  DriveFileItem,
  CreatedSheetResult
} from '../utils/googleWorkspace';
import { User as FirebaseUser } from 'firebase/auth';

interface GoogleWorkspaceModalProps {
  attendances: AttendanceRecord[];
  activeEmployee: Employee;
  onClose: () => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  attendances,
  activeEmployee,
  onClose,
}) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'sheets' | 'drive'>('sheets');

  // Action states
  const [isExportingSheet, setIsExportingSheet] = useState<boolean>(false);
  const [createdSheet, setCreatedSheet] = useState<CreatedSheetResult | null>(null);
  const [isBackingUpDrive, setIsBackingUpDrive] = useState<boolean>(false);
  const [uploadedDriveFile, setUploadedDriveFile] = useState<DriveFileItem | null>(null);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [loadingDriveFiles, setLoadingDriveFiles] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation dialog for data export / mutation
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Filter records for employee or all
  const filteredRecords = attendances.filter(
    (a) => a.employeeId === activeEmployee.id || activeEmployee.role.includes('Manajemen') || activeEmployee.role.includes('SDM')
  );

  useEffect(() => {
    initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        if (accessToken) {
          loadDriveFiles(accessToken);
        }
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setErrorMessage(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        loadDriveFiles(result.accessToken);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Gagal masuk dengan akun Google Workspace');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    await googleLogout();
    setUser(null);
    setToken(null);
    setCreatedSheet(null);
    setUploadedDriveFile(null);
    setDriveFiles([]);
  };

  const loadDriveFiles = async (accessToken: string) => {
    setLoadingDriveFiles(true);
    try {
      const files = await listDriveFiles(accessToken);
      setDriveFiles(files);
    } catch (err) {
      console.warn('Could not load drive files:', err);
    } finally {
      setLoadingDriveFiles(false);
    }
  };

  // Google Sheets Export Trigger
  const triggerExportGoogleSheet = () => {
    if (!token) {
      setErrorMessage('Silakan masuk dengan akun Google terlebih dahulu.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Ekspor ke Google Spreadsheet',
      description: `Apakah Anda yakin ingin membuat Google Spreadsheet baru dan mengekspor ${filteredRecords.length} catatan presensi pegawai ke akun Google Drive Anda?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsExportingSheet(true);
        setErrorMessage(null);
        setActionSuccessMessage(null);

        try {
          const sheetResult = await exportAttendancesToGoogleSheet(
            token,
            filteredRecords,
            `Rekap Presensi E-ABSENSI RSISA - ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`
          );
          setCreatedSheet(sheetResult);
          setActionSuccessMessage('Berhasil membuat dan menyinkronkan Google Spreadsheet!');
          loadDriveFiles(token);
        } catch (err: any) {
          setErrorMessage(err.message || 'Gagal mengekspor data ke Google Sheets');
        } finally {
          setIsExportingSheet(false);
        }
      },
    });
  };

  // Google Drive Backup Trigger
  const triggerBackupToGoogleDrive = () => {
    if (!token) {
      setErrorMessage('Silakan masuk dengan akun Google terlebih dahulu.');
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: 'Konfirmasi Cadangan ke Google Drive',
      description: `Aplikasi akan mengunggah berkas arsip CSV presensi (${filteredRecords.length} catatan) ke Google Drive Anda. Lanjutkan proses?`,
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setIsBackingUpDrive(true);
        setErrorMessage(null);
        setActionSuccessMessage(null);

        try {
          // Generate CSV content
          const headers = ['ID', 'NIP', 'Nama', 'Departemen', 'Role', 'Tanggal', 'Waktu WITA', 'Jenis', 'Shift', 'Status', 'Jarak RS (m)', 'Akurasi AI (%)', 'Alamat'];
          const rows = filteredRecords.map((r) => [
            r.id,
            r.employeeNip,
            r.employeeName,
            r.employeeDepartment,
            r.employeeRole,
            r.date,
            r.formattedTime,
            r.type,
            r.shiftName,
            r.status,
            r.distanceToHospitalMeters,
            r.faceVerificationScore,
            `"${r.locationAddress.replace(/"/g, '""')}"`,
          ]);

          const csvText = [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
          const fileName = `Presensi_RSISA_${activeEmployee.nip}_${new Date().toISOString().split('T')[0]}.csv`;

          const uploaded = await uploadTextFileToDrive(token, fileName, csvText, 'text/csv');
          setUploadedDriveFile(uploaded);
          setActionSuccessMessage(`Berkas '${fileName}' berhasil dicadangkan ke Google Drive!`);
          loadDriveFiles(token);
        } catch (err: any) {
          setErrorMessage(err.message || 'Gagal mengunggah berkas ke Google Drive');
        } finally {
          setIsBackingUpDrive(false);
        }
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-linear-to-r from-emerald-800 via-teal-800 to-emerald-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 ring-2 ring-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Google Workspace Integration</h3>
              <p className="text-xs text-emerald-200">
                Google Sheets™ & Google Drive™ Sinkronisasi Presensi RSISA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          
          {/* User Auth Banner */}
          {!user ? (
            <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-center space-y-3">
              <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                Hubungkan dengan Akun Google Anda
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Sinkronkan rekap presensi pegawai langsung ke <strong>Google Spreadsheet</strong> dan cadangkan berkas rekap absensi ke <strong>Google Drive</strong> secara aman.
              </p>

              {/* Official styled Sign in with Google Button */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  disabled={isSigningIn}
                  onClick={handleSignIn}
                  className="inline-flex items-center justify-center gap-3 px-5 py-3 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-sm transition-all hover:shadow cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isSigningIn ? 'Menghubungkan...' : 'Sign in with Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img src={user.photoURL} alt={user.displayName || 'Google User'} className="w-10 h-10 rounded-full ring-2 ring-emerald-500" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold">
                    {user.email?.charAt(0).toUpperCase() || 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-800">{user.displayName || 'Akun Google Terhubung'}</p>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.2 rounded-full">
                      Terhubung
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="px-3 py-1.5 rounded-xl text-xs text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Putuskan Akun</span>
              </button>
            </div>
          )}

          {/* Success / Error alerts */}
          {actionSuccessMessage && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccessMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Tabs Navigation */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('sheets')}
              className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'sheets'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Google Sheets™</span>
            </button>

            <button
              onClick={() => setActiveTab('drive')}
              className={`pb-3 px-4 text-xs font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                activeTab === 'drive'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <HardDrive className="w-4 h-4 text-teal-600" />
              <span>Google Drive™</span>
            </button>
          </div>

          {/* TAB 1: GOOGLE SHEETS */}
          {activeTab === 'sheets' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Ekspor Data Presensi ke Google Spreadsheet
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Buat lembar kerja spreadsheet baru secara otomatis dengan kolom detail NIP, Nama, Shift, Jam Masuk/Pulang, Jarak Geofence, Skor AI Biometrik, dan Validasi GPS.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    disabled={!user || isExportingSheet}
                    onClick={triggerExportGoogleSheet}
                    className="w-full sm:w-auto px-5 py-3 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                  >
                    {isExportingSheet ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Membuat Spreadsheet...</span>
                      </>
                    ) : (
                      <>
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Buat Google Spreadsheet Baru</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-slate-500">
                    {filteredRecords.length} baris presensi siap diekspor
                  </span>
                </div>
              </div>

              {/* Created Sheet Card */}
              {createdSheet && (
                <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{createdSheet.title}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">Spreadsheet ID: {createdSheet.spreadsheetId}</p>
                  </div>

                  <a
                    href={createdSheet.spreadsheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <span>Buka di Google Sheets</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                  Cadangkan Berkas Presensi ke Google Drive
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">
                  Simpan cadangan data arsip presensi rumah sakit ke dalam Google Drive Anda secara terstruktur.
                </p>

                <button
                  disabled={!user || isBackingUpDrive}
                  onClick={triggerBackupToGoogleDrive}
                  className="px-5 py-3 rounded-xl font-bold text-xs bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer uppercase tracking-wider"
                >
                  {isBackingUpDrive ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Mengunggah ke Drive...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-4 h-4" />
                      <span>Unggah Cadangan ke Google Drive</span>
                    </>
                  )}
                </button>
              </div>

              {/* Uploaded File Notification */}
              {uploadedDriveFile && (
                <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-200 flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="text-xs font-bold text-teal-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>{uploadedDriveFile.name}</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Tersimpan di Google Drive</p>
                  </div>

                  {uploadedDriveFile.webViewLink && (
                    <a
                      href={uploadedDriveFile.webViewLink}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <span>Buka di Google Drive</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Recent Drive Files List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-xs font-bold text-slate-700">Berkas Terakhir di Google Drive:</h5>
                  {token && (
                    <button
                      onClick={() => loadDriveFiles(token)}
                      className="text-[11px] text-emerald-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingDriveFiles ? 'animate-spin' : ''}`} />
                      <span>Segarkan</span>
                    </button>
                  )}
                </div>

                {driveFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    {user ? 'Belum ada berkas presensi yang diunggah ke Google Drive.' : 'Masuk dengan Google untuk melihat daftar berkas.'}
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {driveFiles.slice(0, 5).map((file) => (
                      <div key={file.id} className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                        </div>
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-emerald-600 hover:underline flex items-center gap-1 shrink-0 font-bold"
                          >
                            <span>Buka</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer uppercase tracking-wider"
          >
            Tutup
          </button>
        </div>
      </div>

      {/* Confirmation Dialog (Mandatory for Workspace mutations) */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <h4 className="font-bold text-slate-800 text-sm">{confirmDialog.title}</h4>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmDialog.description}</p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer"
              >
                Ya, Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
