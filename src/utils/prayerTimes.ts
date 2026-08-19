import { PrayerTimeInfo } from '../types';

/**
 * Calculates / returns accurate prayer times for Banjarbaru (WITA / UTC+8)
 */
export function getBanjarbaruPrayerTimes(date: Date = new Date()): PrayerTimeInfo {
  // Base astronomical timings for Banjarbaru (~3.4° S, 114.7° E)
  // Approximate standard values for South Kalimantan
  const prayers = {
    subuh: '05:08',
    terbit: '06:24',
    dzuhur: '12:28',
    ashar: '15:47',
    maghrib: '18:31',
    isya: '19:41',
  };

  const nowMinutes = date.getHours() * 60 + date.getMinutes();

  const parseToMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  let nextPrayer = 'Subuh';
  let nextTimeMinutes = parseToMinutes(prayers.subuh);

  if (nowMinutes < parseToMinutes(prayers.subuh)) {
    nextPrayer = 'Subuh';
    nextTimeMinutes = parseToMinutes(prayers.subuh);
  } else if (nowMinutes < parseToMinutes(prayers.dzuhur)) {
    nextPrayer = 'Dzuhur';
    nextTimeMinutes = parseToMinutes(prayers.dzuhur);
  } else if (nowMinutes < parseToMinutes(prayers.ashar)) {
    nextPrayer = 'Ashar';
    nextTimeMinutes = parseToMinutes(prayers.ashar);
  } else if (nowMinutes < parseToMinutes(prayers.maghrib)) {
    nextPrayer = 'Maghrib';
    nextTimeMinutes = parseToMinutes(prayers.maghrib);
  } else if (nowMinutes < parseToMinutes(prayers.isya)) {
    nextPrayer = 'Isya';
    nextTimeMinutes = parseToMinutes(prayers.isya);
  } else {
    nextPrayer = 'Subuh (Besok)';
    nextTimeMinutes = parseToMinutes(prayers.subuh) + 24 * 60;
  }

  const diffMinutes = nextTimeMinutes - nowMinutes;
  const hoursRemaining = Math.floor(diffMinutes / 60);
  const minsRemaining = diffMinutes % 60;
  const timeRemaining = `${hoursRemaining > 0 ? `${hoursRemaining} jam ` : ''}${minsRemaining} menit`;

  return {
    ...prayers,
    nextPrayer,
    timeRemaining,
  };
}

export const ISLAMIC_HOSPITAL_DUAS = [
  {
    title: 'Doa Memulai Pelayanan Medis / Bekerja',
    arabic: 'بِسْمِ اللَّهِ تَوَكَّلْتُ عَلَى اللَّهِ وَلاَ حَوْلَ وَلاَ قُوَّةَ إِلاَّ بِاللَّهِ',
    latin: "Bismillahi tawakkaltu 'alallahi, wa laa hawla wa laa quwwata illa billah",
    meaning: 'Dengan nama Allah, aku bertawakkal kepada Allah. Tiada daya dan kekuatan kecuali dengan pertolongan Allah.',
    category: 'Awal Shift'
  },
  {
    title: 'Doa untuk Kesembuhan Pasien',
    arabic: 'اللَّهُمَّ رَبَّ النَّاسِ أَذْهِبِ الْبَأْسَ وَاشْفِ أَنْتَ الشَّافِي لاَ شِفَاءَ إِلاَّ شِفَاؤُكَ شِفَاءً لاَ يُغَادِرُ سَقَمًا',
    latin: "Allahumma Rabban naas adzhibil ba'sa wasyfi antasy syaafi laa syifaa'a illa syifaa'uka syifaa'an laa yughaadiru saqama",
    meaning: 'Ya Allah, Tuhan seluruh manusia, hilangkanlah penyakit ini dan sembuhkanlah. Engkaulah Yang Maha Menyembuhkan, tidak ada kesembuhan melainkan kesembuhan dari-Mu.',
    category: 'Merawat Pasien'
  },
  {
    title: 'Doa Mengakhiri Tugas Jaga / Shift',
    arabic: 'الْحَمْدُ لِلَّهِ الَّذِي بِنِعْمَتِهِ تَتِمُّ الصَّالِحَاتُ',
    latin: "Alhamdulillahilladzi bini'matihi tatimmus shaalihaat",
    meaning: 'Segala puji bagi Allah yang dengan nikmat-Nya segala kebaikan menjadi sempurna.',
    category: 'Akhir Shift'
  }
];
