import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Heart, 
  ShieldCheck, 
  UserCheck, 
  Lock, 
  Mail, 
  User, 
  KeyRound, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Phone, 
  Briefcase, 
  MapPin, 
  ArrowRight,
  ShieldAlert,
  Moon,
  Clock,
  Fingerprint
} from 'lucide-react';
import { Department, Employee, EmployeeRole, HospitalLocation, ShiftType } from '../types';
import { playSuccessChime } from '../utils/audio';
import { RsiLogo } from './RsiLogo';

interface AuthPageProps {
  employees: Employee[];
  hospitalConfig: HospitalLocation;
  onLoginSuccess: (employee: Employee) => void;
  onRegisterSuccess: (newEmployeeData: Omit<Employee, 'id'>) => { success: boolean; employee?: Employee; error?: string };
}

const ROLES: EmployeeRole[] = [
  'Dokter Spesialis',
  'Dokter Umum',
  'Perawat IGD & ICU',
  'Perawat Rawat Inap',
  'Bidan',
  'Apoteker / Farmasi',
  'Analis Laboratorium',
  'Radiografer',
  'Nutrisionis / Gizi',
  'Rekam Medis',
  'Manajemen & SDM',
  'Keuangan & Kasir',
  'Keamanan (Satpam)',
  'Sanitasi & Driver Medis',
];

const DEPARTMENTS: Department[] = [
  'Instalasi Gawat Darurat (IGD)',
  'Intensive Care Unit (ICU)',
  'Rawat Inap Shofa & Marwah',
  'Poliklinik Spesialis',
  'Instalasi Farmasi',
  'Laboratorium Patologi',
  'Radiologi & Diagnostik',
  'Instalasi Kebidanan & VK',
  'Direksi & SDM',
  'Keuangan & Akuntansi',
  'Pelayanan Umum & Keamanan',
];

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1594824813681-30c005d54832?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256',
];

export const AuthPage: React.FC<AuthPageProps> = ({
  employees,
  hospitalConfig,
  onLoginSuccess,
  onRegisterSuccess,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up Form States
  const [name, setName] = useState<string>('');
  const [nip, setNip] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [role, setRole] = useState<EmployeeRole>('Perawat Rawat Inap');
  const [department, setDepartment] = useState<Department>('Rawat Inap Shofa & Marwah');
  const [shiftType, setShiftType] = useState<ShiftType>('3-Shift');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVATAR_PRESETS[1]);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [agreeTerms, setAgreeTerms] = useState<boolean>(true);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupSuccessNotice, setSignupSuccessNotice] = useState<string | null>(null);

  // Webcam snapshot for biometric registration
  const [showWebcamCapture, setShowWebcamCapture] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Auto-generate sample NIP for ease
  const handleGenerateNip = () => {
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const year = new Date().getFullYear();
    setNip(`RSISA-${year}-${randomNum}`);
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const query = loginIdentifier.trim().toLowerCase();
    if (!query) {
      setLoginError('Silakan masukkan NIP atau Email pegawai Anda.');
      return;
    }

    // Find employee by NIP or Email
    const found = employees.find(
      (emp) =>
        emp.nip.toLowerCase() === query ||
        emp.email.toLowerCase() === query ||
        emp.name.toLowerCase().includes(query)
    );

    if (!found) {
      setLoginError(
        'Akun tidak ditemukan. Pastikan NIP atau Email yang Anda masukkan sudah terdaftar di RSI Sultan Agung.'
      );
      return;
    }

    // Check password if set on employee; default password accepted: '123456' or any if empty
    if (found.password && loginPassword && found.password !== loginPassword && loginPassword !== '123456') {
      setLoginError('Kata Sandi / PIN tidak sesuai. Silakan masukkan kata sandi akun Anda yang terdaftar.');
      return;
    }

    playSuccessChime();
    onLoginSuccess(found);
  };

  // Start Webcam for biometric face capture
  const handleStartCamera = async () => {
    try {
      setShowWebcamCapture(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 640 } },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      alert('Tidak dapat mengakses kamera. Pastikan Anda memberikan izin kamera.');
      setShowWebcamCapture(false);
    }
  };

  const handleCaptureFace = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = 300;
      canvas.height = 300;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Center crop square
        const size = Math.min(video.videoWidth, video.videoHeight);
        const startX = (video.videoWidth - size) / 2;
        const startY = (video.videoHeight - size) / 2;
        ctx.drawImage(video, startX, startY, size, size, 0, 0, 300, 300);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCapturedPhoto(dataUrl);
        setSelectedAvatar(dataUrl);
        handleStopCamera();
      }
    }
  };

  const handleStopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowWebcamCapture(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Sign Up Submission handler
  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);
    setSignupSuccessNotice(null);

    if (!name.trim()) {
      setSignupError('Nama lengkap wajib diisi beserta gelar.');
      return;
    }
    if (!nip.trim()) {
      setSignupError('NIP pegawai wajib diisi. Klik "Buat NIP" jika belum memiliki format.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setSignupError('Format alamat email tidak valid.');
      return;
    }
    if (!password || password.length < 5) {
      setSignupError('Kata sandi minimal 5 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setSignupError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!agreeTerms) {
      setSignupError('Anda harus menyetujui komitmen pelayanan Islami RSI Sultan Agung.');
      return;
    }

    const isHRDAdmin = role === 'Manajemen & SDM';
    const currentShift = shiftType === 'Non-Shift' ? 'shift-office' : 'shift-pagi';

    const newEmpData: Omit<Employee, 'id'> = {
      name: name.trim(),
      nip: nip.trim().toUpperCase(),
      title: title.trim() || `${role} - ${department}`,
      role,
      department,
      shiftType,
      currentShiftId: currentShift,
      phone: phone.trim() || '0812-3456-7890',
      email: email.trim().toLowerCase(),
      avatar: capturedPhoto || selectedAvatar,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      faceRegistered: true,
      registeredFacePhoto: capturedPhoto || selectedAvatar,
      isAdmin: isHRDAdmin,
      password,
    };

    const result = onRegisterSuccess(newEmpData);
    if (!result.success) {
      setSignupError(result.error || 'Pendaftaran gagal. Periksa kembali data Anda.');
      return;
    }

    playSuccessChime();
    setSignupSuccessNotice(`Selamat Datang, ${name}! Pendaftaran berhasil.`);
    setTimeout(() => {
      if (result.employee) {
        onLoginSuccess(result.employee);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-emerald-500 selection:text-white">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-700/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Banner with Official RSI Sultan Agung Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 mb-6 sm:mb-8 flex flex-col items-center">
        {/* Official Hospital Logo Card */}
        <div className="p-3 bg-white rounded-2xl shadow-xl ring-4 ring-emerald-500/20 mb-4 transition-transform hover:scale-[1.02] duration-200">
          <RsiLogo className="w-full max-w-[320px] sm:max-w-[380px]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
          E-ABSENSI RSISA
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-emerald-400 uppercase tracking-widest mt-1">
          RSI Sultan Agung Banjarbaru
        </p>
        <p className="text-[11px] text-slate-400 mt-1 italic">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ • Portal Akses Pegawai
        </p>
      </div>

      {/* Main Container Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-xl md:max-w-4xl z-10">
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden">
          
          {/* Header Switcher: Masuk vs Daftar */}
          <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/80 p-1.5">
            <button
              id="tab-auth-login"
              type="button"
              onClick={() => {
                setAuthMode('login');
                setLoginError(null);
              }}
              className={`py-3 sm:py-3.5 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <KeyRound className="w-4 h-4 text-emerald-600" />
              <span>Masuk (Login Pegawai)</span>
            </button>

            <button
              id="tab-auth-signup"
              type="button"
              onClick={() => {
                setAuthMode('signup');
                setSignupError(null);
                if (!nip) handleGenerateNip();
              }}
              className={`py-3 sm:py-3.5 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
                authMode === 'signup'
                  ? 'bg-white text-emerald-800 shadow-xs ring-1 ring-slate-200/80'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>Pendaftaran Akun Baru</span>
            </button>
          </div>

          <div className="p-5 sm:p-8">
            {/* ========================================================= */}
            {/* 1. LOGIN FORM MODE */}
            {/* ========================================================= */}
            {authMode === 'login' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Selamat Datang di Portal Presensi
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Silakan masukkan NIP atau Email pegawai RSI Sultan Agung Banjarbaru untuk melakukan presensi wajah & lokasi.
                  </p>
                </div>

                {loginError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-800 font-medium leading-relaxed">{loginError}</p>
                  </div>
                )}

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  {/* NIP or Email */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      NIP atau Email Pegawai
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        id="input-login-identifier"
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder="Contoh: RSISA-2020-02118 atau ahmad.fauzi@..."
                        className="w-full pl-10 pr-4 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        autoComplete="username"
                        required
                      />
                    </div>
                  </div>

                  {/* Password / PIN */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Kata Sandi / PIN
                      </label>
                      <span className="text-[11px] text-slate-400 font-normal">
                        (Default demo: 123456)
                      </span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        id="input-login-password"
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Masukkan kata sandi / PIN"
                        className="w-full pl-10 pr-11 py-2.5 sm:py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                        title={showLoginPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                      >
                        {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 font-medium">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
                      />
                      <span>Ingat Sesi Saya</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signup');
                        if (!nip) handleGenerateNip();
                      }}
                      className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
                    >
                      Belum punya akun? Daftar
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="btn-submit-login"
                    type="submit"
                    className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <Fingerprint className="w-4 h-4" />
                    <span>Masuk ke Beranda Presensi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Security Guarantee Banner (Single User Policy) */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3">
                    <div className="p-2 bg-emerald-100/80 rounded-xl text-emerald-700 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-800">
                        Kebijakan Keamanan Akun Tunggal (Single-User)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                        Satu akun kepegawaian hanya dapat digunakan oleh 1 (satu) orang pegawai terdaftar. Dilarang keras membagikan kredensial login atau melakukan presensi atas nama orang lain.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* 2. SIGN UP / REGISTER NEW EMPLOYEE MODE */}
            {/* ========================================================= */}
            {authMode === 'signup' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Formulir Pendaftaran Pegawai Baru
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Daftarkan profil kepegawaian Anda untuk mendapatkan hak akses presensi biometrik di RSI Sultan Agung Banjarbaru.
                  </p>
                </div>

                {signupError && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                    <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-rose-800 font-medium leading-relaxed">{signupError}</p>
                  </div>
                )}

                {signupSuccessNotice && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-800 font-bold leading-relaxed">{signupSuccessNotice}</p>
                  </div>
                )}

                <form onSubmit={handleSignupSubmit} className="space-y-4">
                  {/* Photo & Biometric Face Selection */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                          Foto Wajah Registrasi Biometrik
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Digunakan untuk pencocokan AI saat Verifikasi Presensi Masuk/Pulang
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleStartCamera}
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Foto Webcam</span>
                      </button>
                    </div>

                    {/* Camera Modal / View if active */}
                    {showWebcamCapture && (
                      <div className="p-3 bg-slate-900 rounded-2xl text-center space-y-2.5">
                        <div className="relative w-48 h-48 mx-auto rounded-xl overflow-hidden bg-black ring-2 ring-emerald-500">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <canvas ref={canvasRef} className="hidden" />
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={handleCaptureFace}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <Camera className="w-4 h-4" />
                            <span>Ambil Foto Wajah</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleStopCamera}
                            className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-medium rounded-xl cursor-pointer"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Avatar Preset Selector */}
                    <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                      {AVATAR_PRESETS.map((av, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setSelectedAvatar(av);
                            setCapturedPhoto(null);
                          }}
                          className={`relative rounded-full p-0.5 transition-all shrink-0 cursor-pointer ${
                            (selectedAvatar === av && !capturedPhoto)
                              ? 'ring-3 ring-emerald-600 scale-105'
                              : 'opacity-70 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="Preset Avatar" className="w-10 h-10 rounded-full object-cover" />
                          {selectedAvatar === av && !capturedPhoto && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 absolute -top-1 -right-1 bg-white rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Name & NIP */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nama Lengkap & Gelar *
                      </label>
                      <input
                        id="input-signup-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Contoh: Ns. Farhan Maulana, S.Kep"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          NIP Pegawai *
                        </label>
                        <button
                          type="button"
                          onClick={handleGenerateNip}
                          className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          Buat Otomatis
                        </button>
                      </div>
                      <input
                        id="input-signup-nip"
                        type="text"
                        value={nip}
                        onChange={(e) => setNip(e.target.value)}
                        placeholder="RSISA-2024-XXXXX"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold text-emerald-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Role & Department */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Profesi / Jabatan *
                      </label>
                      <select
                        id="select-signup-role"
                        value={role}
                        onChange={(e) => setRole(e.target.value as EmployeeRole)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Unit / Departemen Kerja *
                      </label>
                      <select
                        id="select-signup-dept"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value as Department)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Shift Type & Phone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Skema Jadwal Kerja *
                      </label>
                      <select
                        id="select-signup-shift"
                        value={shiftType}
                        onChange={(e) => setShiftType(e.target.value as ShiftType)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="3-Shift">3-Shift (Pagi / Siang / Malam - IGD & Rawat Inap)</option>
                        <option value="Non-Shift">Non-Shift / Kantor (08:00 - 16:30 WITA)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Nomor WhatsApp / HP
                      </label>
                      <input
                        id="input-signup-phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="Contoh: 0812-3456-7890"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Email & Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Email Pegawai *
                    </label>
                    <input
                      id="input-signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nama.pegawai@rsisultanagung-bjb.co.id"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Kata Sandi Akun *
                      </label>
                      <div className="relative">
                        <input
                          id="input-signup-password"
                          type={showSignupPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Minimal 5 karakter"
                          className="w-full px-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showSignupPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Ulangi Kata Sandi *
                      </label>
                      <input
                        id="input-signup-confirm-password"
                        type={showSignupPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ketik ulang kata sandi"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Ethics and Syariah Agreement */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 leading-relaxed">
                      <input
                        id="checkbox-signup-terms"
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500 mt-0.5 shrink-0"
                      />
                      <span>
                        Saya menyatakan bahwa data yang diisi adalah benar, mematuhi tata tertib presensi kedisiplinan kerja, serta menjaga etika pelayanan Islami di RSI Sultan Agung Banjarbaru.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="btn-submit-signup"
                    type="submit"
                    className="w-full py-3.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs hover:shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Daftarkan Akun & Masuk Aplikasi</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer info in login */}
        <div className="mt-6 text-center text-xs text-slate-400 space-y-1">
          <div className="flex items-center justify-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-slate-300">{hospitalConfig.name}</span>
          </div>
          <p className="text-[11px] text-slate-400">
            {hospitalConfig.address} • Banjarbaru, Kalimantan Selatan
          </p>
          <p className="text-[11px] font-medium text-emerald-400/90 tracking-wide pt-1">
            created & powered by <span className="font-bold text-emerald-300">Borneo Dev</span>
          </p>
        </div>
      </div>
    </div>
  );
};
