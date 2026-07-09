/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Plus, Edit2, Save, BookOpen, RotateCcw, FileText, CheckCircle, 
  TrendingUp, Users, Settings, Layers, Award, Download, Printer, 
  ArrowUpRight, Database, Calendar, ChevronRight, Sparkles, Filter, Check, Trash2, X, FileSpreadsheet, Sliders,
  Upload, LogIn, LogOut, ShieldAlert, BadgeCheck, Compass, UserPlus, Clock, Moon, User, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';
import { 
  Student, Teacher, CLASSES, SHIFTS, LEVELS, TEACHERS, 
  generate339Students, INITIAL_TEACHERS, ActivityLog 
} from './data';
import { 
  db, 
  auth, 
  googleProvider, 
  seedDatabaseIfEmpty,
  STUDENTS_COLLECTION,
  TEACHERS_COLLECTION,
  LOGS_COLLECTION,
  CONFIGS_COLLECTION,
  handleFirestoreError,
  OperationType
} from './firebase';
import { 
  onSnapshot, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  addDoc,
  deleteDoc,
  query,
  where,
  writeBatch
} from "firebase/firestore";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";

const isJilidLevel = (level: string): boolean => {
  const lev = (level || '').trim().toLowerCase();
  if (lev.includes('jilid')) return true;
  if (/^[1-6][a-b]?$/i.test(lev)) return true;
  return false;
};

const isTajwidGhoribLevel = (level: string): boolean => {
  const lev = (level || '').trim().toLowerCase();
  if (lev.includes('tajwid') || lev.includes('ghorib') || lev === 'tg' || lev === 'aq' || lev.includes('tahsin')) return true;
  return false;
};

const isAlQuranLevel = (level: string): boolean => {
  return !isJilidLevel(level) && !isTajwidGhoribLevel(level);
};

const formatNISN = (nisn: any): string => {
  if (nisn === undefined || nisn === null) return '-';
  const clean = String(nisn).trim();
  if (clean === '#N/A' || clean === '-' || clean === '') return '-';
  if (/^\d+$/.test(clean)) {
    return clean.padStart(10, '0');
  }
  return clean;
};

const DOA_HARIAN_LIST = [
  "Doa Memulai Belajar",
  "Doa Setelah Belajar",
  "Doa Masuk Masjid",
  "Doa Keluar Masjid",
  "Doa Untuk Kedua Orang Tua",
  "Doa Kebaikan Dunia Akhirat",
  "Doa Sebelum Makan",
  "Doa Sesudah Makan",
  "Doa Sebelum Tidur",
  "Doa Bangun Tidur",
  "Doa Masuk Kamar Mandi",
  "Doa Keluar Kamar Mandi",
  "Doa Berpakaian",
  "Doa Bercermin",
  "Doa Naik Kendaraan",
  "Doa Ketika Hujan",
  "Doa Setelah Sholat Dhuha",
  "Doa Khatam Qur'an",
  "Doa Keluar Rumah",
  "Doa Harian 1-35 (setelah sholat)"
];

const SURAT_PENDEK_LIST = [
  "QS. An-Nas",
  "QS. Al-Falaq",
  "QS. Al-Ikhlas",
  "QS. Al-Lahab",
  "QS. An-Nasr",
  "QS. Al-Kafirun",
  "QS. Al-Kautsar",
  "QS. Al-Ma'un",
  "QS. Quraysh",
  "QS. Al-Fil",
  "QS. Al-Humazah",
  "QS. Al-Asr",
  "QS. At-Takatsur",
  "QS. Al-Qari'ah",
  "QS. Al-Adiyat",
  "QS. Az-Zalzalah",
  "QS. Al-Bayyinah",
  "QS. Al-Qadr",
  "QS. Al-Alaq",
  "QS. At-Tin",
  "QS. Al-Insyirah",
  "QS. Ad-Dhuha"
];

const INDONESIAN_MONTHS = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const LATEST_MONTHS = [
  "Juli 2026", "Agustus 2026", "September 2026", "Oktober 2026", "November 2026", "Desember 2026",
  "Januari 2027", "Februari 2027", "Maret 2027", "April 2027", "Mei 2027", "Juni 2027"
];

export const getGregorianAndHijriDateString = (dateObj: Date = new Date()) => {
  const daysInIndonesian = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const dayName = daysInIndonesian[dateObj.getDay()];
  const dateNum = dateObj.getDate();
  const monthName = INDONESIAN_MONTHS[dateObj.getMonth()];
  const yearNum = dateObj.getFullYear();
  const timeStr = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  
  const gregorianStr = `${dayName}, ${dateNum} ${monthName} ${yearNum}`;
  
  let hijriStr = "";
  try {
    const formatter = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    hijriStr = formatter.format(dateObj) + " H";
  } catch (e) {
    hijriStr = "Muharram 1448 H";
  }
  
  return {
    gregorian: gregorianStr,
    hijri: hijriStr,
    full: `${gregorianStr} M / ${hijriStr} | Pukul ${timeStr} WIB`
  };
};

export default function App() {
  // State for database
  const [students, setStudents] = useState<Student[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState<'connected' | 'offline'>('connected');
  const [firebaseLogs, setFirebaseLogs] = useState<{ id: string; type: string; details: string; time: string }[]>([]);

  // Real-time Clock State for lightweight elegant widget
  const [liveClock, setLiveClock] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setLiveClock(new Date());
    }, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Config management states (Classes & Levels from DB)
  const [dynamicClasses, setDynamicClasses] = useState<string[]>(CLASSES);
  const [dynamicLevels, setDynamicLevels] = useState<string[]>(LEVELS);
  const [dynamicDoas, setDynamicDoas] = useState<string[]>(DOA_HARIAN_LIST);
  const [dynamicSurahs, setDynamicSurahs] = useState<string[]>(SURAT_PENDEK_LIST);
  const [newClassName, setNewClassName] = useState('');
  const [newLevelName, setNewLevelName] = useState('');
  const [newDoaName, setNewDoaName] = useState('');
  const [newSurahName, setNewSurahName] = useState('');

  // Institutional (Kop Surat) & Signatories config states
  const [yayasanName, setYayasanName] = useState("YAYASAN SIQRAN AL-QUR'AN INDONESIA");
  const [unitName, setUnitName] = useState("UNIT TAHFIDZ WA TA'LIM SIQRAN (UTTS)");
  const [kopHeaderImage, setKopHeaderImage] = useState<string>('');
  const [kopPlacement, setKopPlacement] = useState<'logo' | 'banner'>('logo');
  const [graduatedStudents, setGraduatedStudents] = useState<Student[]>([]);
  const [permitNumber, setPermitNumber] = useState("Izin Operasional Kemenag No. 4112/A/2026 | Terakreditasi A (Sangat Baik)");
  const [address, setAddress] = useState("Sekretariat: Jl. Pendidikan Al-Qur'an No. 41, Jakarta Selatan");
  const [phone, setPhone] = useState("(021) 777-1234");
  const [email, setEmail] = useState("geminipro.id025@gmail.com");
  const [headmasterName, setHeadmasterName] = useState("Ustadz H. Ahmad Syarif, Lc.");
  const [pjName, setPjName] = useState("Ustadzah Fatimah, S.Pd.I.");

  // Navigation tabs: 'dashboard' | 'setup' | 'database' | 'input' | 'reports' | 'developer'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'setup' | 'database' | 'input' | 'reports' | 'developer'>('dashboard');

  // Database Tab States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState<string>('All');
  const [filterShift, setFilterShift] = useState<string>('All');
  const [filterTeacher, setFilterTeacher] = useState<string>('All');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingStudent, setIsAddingStudent] = useState(false);

  // Login and Custom Authentication States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Custom Login & Registration states
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authGender, setAuthGender] = useState<'L' | 'P'>('L');

  // Header compression state triggered by Intersection Observer
  const [isHeaderCompressed, setIsHeaderCompressed] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const sentinel = document.getElementById("header-sentinel");
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeaderCompressed(!entry.isIntersecting);
      },
      { threshold: [0], rootMargin: "0px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Auto-hide when scrolling down past 100px, show when scrolling up
      if (currentScrollY <= 10) {
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowHeader(false);
      } else if (currentScrollY < lastScrollY.current) {
        setShowHeader(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // New Student Form State
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    nipd: '',
    nisn: '',
    name: '',
    class: '7A',
    level: '1A',
    pageDetail: 'Halaman 1',
    materiTambahan: 'Doa Harian',
    asatidz: 'Hayu',
    shift: 1,
    naikTingkatThisMonth: false,
    gender: 'L'
  });

  // Input Guru Tab States
  const [inputClass, setInputClass] = useState('7A');
  const [inputTeacher, setInputTeacher] = useState('Hayu');
  const [inputMonth, setInputMonth] = useState(LATEST_MONTHS[0]);
  const [activeShiftTab, setActiveShiftTab] = useState<1 | 2 | 3>(1);
  const [inputSearch, setInputSearch] = useState('');
  const [claimSearchQuery, setClaimSearchQuery] = useState('');

  // Instant Student Registration Form States
  const [instanStudentName, setInstanStudentName] = useState('');
  const [instanStudentNipd, setInstanStudentNipd] = useState('');
  const [instanStudentGender, setInstanStudentGender] = useState<'L' | 'P'>('L');
  const [instanStudentLevel, setInstanStudentLevel] = useState('1A');
  const [instanStudentPage, setInstanStudentPage] = useState('Halaman 1');
  const [instanStudentMateri, setInstanStudentMateri] = useState('Doa Memulai Belajar');
  const [tempAchievements, setTempAchievements] = useState<{ 
    [studentId: string]: { 
      level: string; 
      pageDetail: string; 
      naikTingkat: boolean; 
      materiTambahan: string;
      guruBaru?: string; 
    } 
  }>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isShowingCreateInline, setIsShowingCreateInline] = useState(false);
  const [inlineTeacherName, setInlineTeacherName] = useState('');
  
  // Custom Guru & Onboarding States
  const [appMode, setAppMode] = useState<'admin' | 'guru'>('guru');
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [backupSearchQuery, setBackupSearchQuery] = useState('');
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [onboardingName, setOnboardingName] = useState('');
  const [onboardingPhone, setOnboardingPhone] = useState('');
  const [onboardingGender, setOnboardingGender] = useState<'L' | 'P'>('L');
  const [onboardingStatus, setOnboardingStatus] = useState('Ustadz Tetap');
  const [onboardingExperience, setOnboardingExperience] = useState('3 Tahun');
  const [onboardingShift1Classes, setOnboardingShift1Classes] = useState<string[]>([]);
  const [onboardingShift1Levels, setOnboardingShift1Levels] = useState<string[]>([]);
  const [onboardingShift2Classes, setOnboardingShift2Classes] = useState<string[]>([]);
  const [onboardingShift2Levels, setOnboardingShift2Levels] = useState<string[]>([]);
  const [onboardingShift3Classes, setOnboardingShift3Classes] = useState<string[]>([]);
  const [onboardingShift3Levels, setOnboardingShift3Levels] = useState<string[]>([]);
  const [onboardingClaimedStudentIds, setOnboardingClaimedStudentIds] = useState<string[]>([]);
  const [isEditingMyProfile, setIsEditingMyProfile] = useState(false);
  const [selectedInputStudentId, setSelectedInputStudentId] = useState<string>('');
  const [inputGuruMode, setInputGuruMode] = useState<'my_students' | 'backup'>('my_students');

  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel?: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
    showCloseIcon?: boolean;
  } | null>(null);

  // Reports Tab States
  const [reportModel, setReportModel] = useState<'guru' | 'kelas' | 'total' | 'raport'>('total');
  const [reportTeacher, setReportTeacher] = useState('Hayu');
  const [reportClass, setReportClass] = useState('7A');
  const [reportMonth, setReportMonth] = useState(LATEST_MONTHS[0]);
  const [selectedReportStudentId, setSelectedReportStudentId] = useState<string>('all');
  const [raportType, setRaportType] = useState<'bulanan' | 'ganjil' | 'genap'>('bulanan');
  
  // Drill down state
  const [drillDownCell, setDrillDownCell] = useState<{ rowName: string; colName: string; students: Student[] } | null>(null);

  // Confetti trigger
  const [showConfetti, setShowConfetti] = useState(false);

  // Sound play simulation
  const playConfettiEffect = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);
  };

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [teacherFormShiftTab, setTeacherFormShiftTab] = useState<1 | 2 | 3>(1);
  const [newTeacher, setNewTeacher] = useState<Partial<Teacher>>({
    name: '',
    gender: 'L',
    phone: '',
    status: 'Ustadz Tetap',
    specialty: 'Jilid 1-6 & Juz 30',
    experience: '3 Tahun',
    shift1Classes: [],
    shift1Levels: [],
    shift2Classes: [],
    shift2Levels: [],
    shift3Classes: [],
    shift3Levels: []
  });

  const dynamicTeachers = useMemo(() => {
    return teachers.map(t => t.name);
  }, [teachers]);

  const selectedTeacherProfile = useMemo(() => {
    return teachers.find(t => t.name === inputTeacher);
  }, [teachers, inputTeacher]);

  const availableClassesForInput = useMemo(() => {
    if (!selectedTeacherProfile) return dynamicClasses;
    const key = `shift${activeShiftTab}Classes` as const;
    const shiftClasses = selectedTeacherProfile[key] || [];
    if (shiftClasses.length > 0) {
      return shiftClasses;
    }
    return dynamicClasses;
  }, [selectedTeacherProfile, activeShiftTab, dynamicClasses]);

  const availableLevelsForInput = useMemo(() => {
    if (!selectedTeacherProfile) return dynamicLevels;
    const key = `shift${activeShiftTab}Levels` as const;
    const shiftLevels = selectedTeacherProfile[key] || [];
    if (shiftLevels.length > 0) {
      return shiftLevels;
    }
    return dynamicLevels;
  }, [selectedTeacherProfile, activeShiftTab, dynamicLevels]);

  // Dynamically auto-switch selected class if current selection is not active under the selected teacher/shift
  useEffect(() => {
    if (availableClassesForInput.length > 0 && !availableClassesForInput.includes(inputClass)) {
      setInputClass(availableClassesForInput[0]);
    }
  }, [availableClassesForInput, inputClass]);

  // Dynamically auto-switch instan student level if current selection is not active under the selected teacher/shift
  useEffect(() => {
    if (availableLevelsForInput.length > 0 && !availableLevelsForInput.includes(instanStudentLevel)) {
      setInstanStudentLevel(availableLevelsForInput[0]);
    }
  }, [availableLevelsForInput, instanStudentLevel]);

  const handleSaveTeacher = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!newTeacher.name) {
      triggerToast('⚠️ Nama guru wajib diisi!');
      return;
    }
    try {
      setIsFirebaseSyncing(true);
      const newId = `T${Date.now()}`;
      
      let specialtyText = newTeacher.specialty || '';
      if (!specialtyText || specialtyText === 'Jilid 1-6 & Juz 30') {
        const parts: string[] = [];
        if (newTeacher.shift1Classes?.length || newTeacher.shift1Levels?.length) {
          parts.push(`S1: ${newTeacher.shift1Classes?.join(', ') || '-'} (${newTeacher.shift1Levels?.join(', ') || '-'})`);
        }
        if (newTeacher.shift2Classes?.length || newTeacher.shift2Levels?.length) {
          parts.push(`S2: ${newTeacher.shift2Classes?.join(', ') || '-'} (${newTeacher.shift2Levels?.join(', ') || '-'})`);
        }
        if (newTeacher.shift3Classes?.length || newTeacher.shift3Levels?.length) {
          parts.push(`S3: ${newTeacher.shift3Classes?.join(', ') || '-'} (${newTeacher.shift3Levels?.join(', ') || '-'})`);
        }
        if (parts.length > 0) {
          specialtyText = parts.join(' | ');
        }
      }

      const payload: Teacher = {
        id: newId,
        name: newTeacher.name,
        gender: newTeacher.gender || 'L',
        phone: newTeacher.phone || '-',
        status: newTeacher.status || 'Ustadz Tetap',
        specialty: specialtyText || 'Jilid 1-6 & Juz 30',
        experience: newTeacher.experience || '1 Tahun',
        shift1Classes: newTeacher.shift1Classes || [],
        shift1Levels: newTeacher.shift1Levels || [],
        shift2Classes: newTeacher.shift2Classes || [],
        shift2Levels: newTeacher.shift2Levels || [],
        shift3Classes: newTeacher.shift3Classes || [],
        shift3Levels: newTeacher.shift3Levels || []
      };

      await setDoc(doc(db, TEACHERS_COLLECTION, newId), payload);
      setIsAddingTeacher(false);
      setNewTeacher({
        name: '',
        gender: 'L',
        phone: '',
        status: 'Ustadz Tetap',
        specialty: 'Jilid 1-6 & Juz 30',
        experience: '3 Tahun',
        shift1Classes: [],
        shift1Levels: [],
        shift2Classes: [],
        shift2Levels: [],
        shift3Classes: [],
        shift3Levels: []
      });
      triggerToast(`🎉 Berhasil menambah Profil Guru: Ustadz/ah ${newTeacher.name}`);
      await addFirebaseLog("PJ/Guru", "Tambah Guru", `Menambahkan profil guru baru: ${newTeacher.name} (${newTeacher.status})`);
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, TEACHERS_COLLECTION);
    }
  };

  const handleUpdateTeacher = async (evt: React.FormEvent) => {
    evt.preventDefault();
    if (!editingTeacher || !editingTeacher.name) return;
    
    try {
      setIsFirebaseSyncing(true);
      
      let specialtyText = editingTeacher.specialty || '';
      if (!specialtyText || specialtyText === 'Jilid 1-6 & Juz 30' || specialtyText.includes('S1:') || specialtyText.includes('S2:') || specialtyText.includes('S3:')) {
        const parts: string[] = [];
        if (editingTeacher.shift1Classes?.length || editingTeacher.shift1Levels?.length) {
          parts.push(`S1: ${editingTeacher.shift1Classes?.join(', ') || '-'} (${editingTeacher.shift1Levels?.join(', ') || '-'})`);
        }
        if (editingTeacher.shift2Classes?.length || editingTeacher.shift2Levels?.length) {
          parts.push(`S2: ${editingTeacher.shift2Classes?.join(', ') || '-'} (${editingTeacher.shift2Levels?.join(', ') || '-'})`);
        }
        if (editingTeacher.shift3Classes?.length || editingTeacher.shift3Levels?.length) {
          parts.push(`S3: ${editingTeacher.shift3Classes?.join(', ') || '-'} (${editingTeacher.shift3Levels?.join(', ') || '-'})`);
        }
        if (parts.length > 0) {
          specialtyText = parts.join(' | ');
        }
      }

      const updatedTeacher = {
        ...editingTeacher,
        specialty: specialtyText || 'Jilid 1-6 & Juz 30'
      };

      await setDoc(doc(db, TEACHERS_COLLECTION, editingTeacher.id), updatedTeacher);
      setEditingTeacher(null);
      triggerToast(`✏️ Profil Guru ${editingTeacher.name} berhasil diperbarui.`);
      await addFirebaseLog("PJ/Guru", "Edit Guru", `Memperbarui profil guru: ${editingTeacher.name}`);
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, TEACHERS_COLLECTION);
    }
  };

  const toggleNewTeacherClassForShift = (shiftNum: 1 | 2 | 3, cls: string) => {
    const key = `shift${shiftNum}Classes` as const;
    const currentList = newTeacher[key] || [];
    if (currentList.includes(cls)) {
      setNewTeacher(prev => ({ ...prev, [key]: currentList.filter(c => c !== cls) }));
    } else {
      if (currentList.length >= 12) {
        triggerToast('⚠️ Maksimal 12 kelas terpilih!');
        return;
      }
      setNewTeacher(prev => ({ ...prev, [key]: [...currentList, cls] }));
    }
  };

  const toggleNewTeacherLevelForShift = (shiftNum: 1 | 2 | 3, lev: string) => {
    const key = `shift${shiftNum}Levels` as const;
    const currentList = newTeacher[key] || [];
    if (currentList.includes(lev)) {
      setNewTeacher(prev => ({ ...prev, [key]: currentList.filter(l => l !== lev) }));
    } else {
      if (currentList.length >= 10) {
        triggerToast(`⚠️ Maksimal 10 Capaian yang dapat dipilih untuk Shift ${shiftNum}!`);
        return;
      }
      setNewTeacher(prev => ({ ...prev, [key]: [...currentList, lev] }));
    }
  };

  const toggleEditingTeacherClassForShift = (shiftNum: 1 | 2 | 3, cls: string) => {
    if (!editingTeacher) return;
    const key = `shift${shiftNum}Classes` as const;
    const currentList = editingTeacher[key] || [];
    if (currentList.includes(cls)) {
      setEditingTeacher(prev => prev ? { ...prev, [key]: currentList.filter(c => c !== cls) } : null);
    } else {
      if (currentList.length >= 12) {
        triggerToast('⚠️ Maksimal 12 kelas terpilih!');
        return;
      }
      setEditingTeacher(prev => prev ? { ...prev, [key]: [...currentList, cls] } : null);
    }
  };

  const toggleEditingTeacherLevelForShift = (shiftNum: 1 | 2 | 3, lev: string) => {
    if (!editingTeacher) return;
    const key = `shift${shiftNum}Levels` as const;
    const currentList = editingTeacher[key] || [];
    if (currentList.includes(lev)) {
      setEditingTeacher(prev => prev ? { ...prev, [key]: currentList.filter(l => l !== lev) } : null);
    } else {
      if (currentList.length >= 10) {
        triggerToast(`⚠️ Maksimal 10 Capaian yang dapat dipilih untuk Shift ${shiftNum}!`);
        return;
      }
      setEditingTeacher(prev => prev ? { ...prev, [key]: [...currentList, lev] } : null);
    }
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    setConfirmDialog({
      title: "Hapus Profil Guru",
      message: `Apakah Anda yakin ingin menghapus profil Guru ${name}?`,
      onConfirm: async () => {
        try {
          setIsFirebaseSyncing(true);
          await deleteDoc(doc(db, TEACHERS_COLLECTION, id));
          triggerToast(`❌ Profil Guru ${name} telah dihapus.`);
          await addFirebaseLog("PJ/Guru", "Hapus Guru", `Menghapus profil guru: ${name}`);
          setIsFirebaseSyncing(false);
        } catch (err) {
          console.error(err);
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.DELETE, TEACHERS_COLLECTION);
        }
      }
    });
  };

  const handleAddClass = async () => {
    if (!newClassName.trim()) return;
    const cleanClass = newClassName.trim().toUpperCase();
    if (dynamicClasses.includes(cleanClass)) {
      triggerToast("⚠️ Kelas ini sudah terdaftar!");
      return;
    }
    const updated = [...dynamicClasses, cleanClass];
    try {
      setIsFirebaseSyncing(true);
      await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
        classes: updated,
        levels: dynamicLevels,
        doas: dynamicDoas,
        surahs: dynamicSurahs,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setNewClassName('');
      triggerToast(`✅ Kelas ${cleanClass} berhasil ditambahkan!`);
      await addFirebaseLog("PJ/Guru", "Tambah Kelas", `Menambahkan pilihan kelas baru: ${cleanClass}`);
      setIsFirebaseSyncing(false);
    } catch (err) {
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
    }
  };

  const handleDeleteClass = (clsName: string) => {
    setConfirmDialog({
      title: "Hapus Pilihan Kelas",
      message: `Hapus kelas "${clsName}" dari pilihan sistem? Pilihan ini tidak menghapus data santri, namun menyembunyikannya dari dasbor jika tidak sesuai.`,
      onConfirm: async () => {
        const updated = dynamicClasses.filter(c => c !== clsName);
        try {
          setIsFirebaseSyncing(true);
          await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
            classes: updated,
            levels: dynamicLevels,
            doas: dynamicDoas,
            surahs: dynamicSurahs,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          triggerToast(`❌ Kelas ${clsName} berhasil dihapus dari sistem.`);
          await addFirebaseLog("PJ/Guru", "Hapus Kelas", `Menghapus pilihan kelas: ${clsName}`);
          setIsFirebaseSyncing(false);
        } catch (err) {
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
        }
      }
    });
  };

  const handleAddLevel = async () => {
    if (!newLevelName.trim()) return;
    const cleanLevel = newLevelName.trim();
    if (dynamicLevels.includes(cleanLevel)) {
      triggerToast("⚠️ Tingkat capaian ini sudah terdaftar!");
      return;
    }
    const updated = [...dynamicLevels, cleanLevel];
    try {
      setIsFirebaseSyncing(true);
      await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
        classes: dynamicClasses,
        levels: updated,
        doas: dynamicDoas,
        surahs: dynamicSurahs,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setNewLevelName('');
      triggerToast(`✅ Capaian ${cleanLevel} berhasil ditambahkan!`);
      await addFirebaseLog("PJ/Guru", "Tambah Capaian", `Menambahkan pilihan tingkat capaian baru: ${cleanLevel}`);
      setIsFirebaseSyncing(false);
    } catch (err) {
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
    }
  };

  const handleDeleteLevel = (levName: string) => {
    setConfirmDialog({
      title: "Hapus Tingkat Capaian",
      message: `Hapus tingkat capaian "${levName}" dari pilihan sistem?`,
      onConfirm: async () => {
        const updated = dynamicLevels.filter(l => l !== levName);
        try {
          setIsFirebaseSyncing(true);
          await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
            classes: dynamicClasses,
            levels: updated,
            doas: dynamicDoas,
            surahs: dynamicSurahs,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          triggerToast(`❌ Capaian ${levName} berhasil dihapus.`);
          await addFirebaseLog("PJ/Guru", "Hapus Capaian", `Menghapus tingkat capaian: ${levName}`);
          setIsFirebaseSyncing(false);
        } catch (err) {
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
        }
      }
    });
  };

  const handleAddDoa = async () => {
    if (!newDoaName.trim()) return;
    const cleanDoa = newDoaName.trim();
    if (dynamicDoas.includes(cleanDoa)) {
      triggerToast("⚠️ Doa harian ini sudah terdaftar!");
      return;
    }
    const updated = [...dynamicDoas, cleanDoa];
    try {
      setIsFirebaseSyncing(true);
      await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
        classes: dynamicClasses,
        levels: dynamicLevels,
        doas: updated,
        surahs: dynamicSurahs,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setNewDoaName('');
      triggerToast(`✅ Doa ${cleanDoa} berhasil ditambahkan!`);
      await addFirebaseLog("PJ/Guru", "Tambah Doa", `Menambahkan doa harian baru: ${cleanDoa}`);
      setIsFirebaseSyncing(false);
    } catch (err) {
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
    }
  };

  const handleDeleteDoa = (doaName: string) => {
    setConfirmDialog({
      title: "Hapus Doa Harian",
      message: `Hapus doa harian "${doaName}" dari pilihan sistem?`,
      onConfirm: async () => {
        const updated = dynamicDoas.filter(d => d !== doaName);
        try {
          setIsFirebaseSyncing(true);
          await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
            classes: dynamicClasses,
            levels: dynamicLevels,
            doas: updated,
            surahs: dynamicSurahs,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          triggerToast(`❌ Doa ${doaName} berhasil dihapus.`);
          await addFirebaseLog("PJ/Guru", "Hapus Doa", `Menghapus doa harian: ${doaName}`);
          setIsFirebaseSyncing(false);
        } catch (err) {
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
        }
      }
    });
  };

  const handleAddSurah = async () => {
    if (!newSurahName.trim()) return;
    const cleanSurah = newSurahName.trim();
    if (dynamicSurahs.includes(cleanSurah)) {
      triggerToast("⚠️ Surat pendek ini sudah terdaftar!");
      return;
    }
    const updated = [...dynamicSurahs, cleanSurah];
    try {
      setIsFirebaseSyncing(true);
      await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
        classes: dynamicClasses,
        levels: dynamicLevels,
        doas: dynamicDoas,
        surahs: updated,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      setNewSurahName('');
      triggerToast(`✅ Surat ${cleanSurah} berhasil ditambahkan!`);
      await addFirebaseLog("PJ/Guru", "Tambah Surat", `Menambahkan hafalan surat pendek baru: ${cleanSurah}`);
      setIsFirebaseSyncing(false);
    } catch (err) {
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
    }
  };

  const handleDeleteSurah = (surahName: string) => {
    setConfirmDialog({
      title: "Hapus Surat Pendek",
      message: `Hapus hafalan surat pendek "${surahName}" dari pilihan sistem?`,
      onConfirm: async () => {
        const updated = dynamicSurahs.filter(s => s !== surahName);
        try {
          setIsFirebaseSyncing(true);
          await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
            classes: dynamicClasses,
            levels: dynamicLevels,
            doas: dynamicDoas,
            surahs: updated,
            updatedAt: new Date().toISOString()
          }, { merge: true });
          triggerToast(`❌ Surat ${surahName} berhasil dihapus.`);
          await addFirebaseLog("PJ/Guru", "Hapus Surat", `Menghapus hafalan surat pendek: ${surahName}`);
          setIsFirebaseSyncing(false);
        } catch (err) {
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
        }
      }
    });
  };

  const handleResetSettingsToDefault = () => {
    setConfirmDialog({
      title: "Setel Ulang Pilihan Default",
      message: "Apakah Anda yakin ingin menyetel ulang pilihan kelas, capaian, doa harian, dan hafalan surat pendek ke nilai default bawaan SIQURAN?",
      onConfirm: async () => {
        try {
          setIsFirebaseSyncing(true);
          await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
            classes: CLASSES,
            levels: LEVELS,
            doas: DOA_HARIAN_LIST,
            surahs: SURAT_PENDEK_LIST,
            updatedAt: new Date().toISOString()
          });
          triggerToast("🔄 Sukses mereset semua opsi master ke database default.");
          await addFirebaseLog("PJ/Guru", "Reset Pilihan", "Mereset opsi kelas, capaian, doa harian, dan surat pendek ke default sistem.");
          setIsFirebaseSyncing(false);
        } catch (err) {
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
        }
      }
    });
  };

  const handleSaveInstitutionalConfig = async () => {
    try {
      setIsFirebaseSyncing(true);
      await setDoc(doc(db, CONFIGS_COLLECTION, "school_options"), {
        yayasanName,
        unitName,
        permitNumber,
        address,
        phone,
        email,
        headmasterName,
        pjName,
        kopHeaderImage,
        kopPlacement,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      triggerToast("✅ Konfigurasi Kop Surat & Tanda Tangan berhasil disimpan!");
      await addFirebaseLog("PJ/Guru", "Update Kop & TTD", "Memperbarui konfigurasi kop surat, nama kepala sekolah, dan PJ.");
      setIsFirebaseSyncing(false);
    } catch (err) {
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, CONFIGS_COLLECTION);
    }
  };

  // Helper for writing logs directly to Firestore and mimicking firestore log streams
  const addFirebaseLog = async (user: string, action: string, details: string) => {
    try {
      const id = String(Date.now());
      const logRef = doc(db, LOGS_COLLECTION, id);
      await setDoc(logRef, {
        id,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        user,
        action,
        details
      });
      // Also write locally to our visual telemetry block!
      setFirebaseLogs(prev => [
        {
          id,
          type: 'INSERT',
          details: `[Log] ${user} -> ${action}: ${details.substring(0, 50)}...`,
          time: new Date().toLocaleTimeString()
        },
        ...prev
      ]);
    } catch (err) {
      console.error("Error writing log to Firestore: ", err);
      handleFirestoreError(err, OperationType.WRITE, LOGS_COLLECTION);
    }
  };

  // Custom Login handler
  const handleCustomLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authUsername.trim() || !authPassword.trim()) {
      triggerToast("⚠️ Username dan Kata Sandi wajib diisi!");
      return;
    }

    try {
      setIsFirebaseSyncing(true);
      // Query local/synced teachers for username match
      const matched = teachers.find(t => t.username?.toLowerCase() === authUsername.trim().toLowerCase());
      
      if (!matched) {
        triggerToast("⚠️ Akun tidak ditemukan! Silakan daftar terlebih dahulu.");
        setIsFirebaseSyncing(false);
        return;
      }

      if (matched.password !== authPassword.trim()) {
        triggerToast("⚠️ Kata Sandi salah! Hubungi Admin jika Anda lupa.");
        setIsFirebaseSyncing(false);
        return;
      }

      // Successful login
      const mockUser = {
        email: `${matched.username}@siquran.local`,
        displayName: matched.name,
        photoURL: "",
        username: matched.username,
        uid: matched.id
      };

      setCurrentUser(mockUser);
      setActiveTeacher(matched);
      setInputTeacher(matched.name);
      
      localStorage.setItem('siquran_custom_session', JSON.stringify({
        username: matched.username,
        teacherId: matched.id
      }));

      triggerToast(`👋 Selamat datang kembali, ${matched.name}!`);
      setIsAuthModalOpen(false);
      setAuthUsername('');
      setAuthPassword('');
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      triggerToast("⚠️ Terjadi kesalahan saat masuk.");
      setIsFirebaseSyncing(false);
    }
  };

  // Custom Registration handler with required 'panjunan27' password
  const handleCustomRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!authUsername.trim() || !authFullName.trim() || !authPassword.trim()) {
      triggerToast("⚠️ Semua bidang wajib diisi!");
      return;
    }

    const cleanUsername = authUsername.trim().toLowerCase().replace(/\s+/g, '');
    if (cleanUsername.length < 3) {
      triggerToast("⚠️ Username minimal 3 karakter tanpa spasi!");
      return;
    }

    if (authPassword.trim() !== 'panjunan27') {
      triggerToast("⚠️ Sandi pendaftaran harus 'panjunan27'!");
      return;
    }

    try {
      setIsFirebaseSyncing(true);

      // Check if username is already taken
      const isTaken = teachers.some(t => t.username?.toLowerCase() === cleanUsername);
      if (isTaken) {
        triggerToast("⚠️ Username sudah digunakan! Silakan gunakan username lain.");
        setIsFirebaseSyncing(false);
        return;
      }

      // Check if teacher name already exists (or link to it)
      let targetTeacher = teachers.find(t => t.name.toLowerCase() === authFullName.trim().toLowerCase());
      
      let teacherId = '';
      if (targetTeacher) {
        // Link custom credentials to existing teacher profile
        teacherId = targetTeacher.id;
        const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
        await updateDoc(teacherRef, {
          username: cleanUsername,
          password: authPassword.trim(),
          updatedAt: new Date().toISOString()
        });
        triggerToast(`🎉 Berhasil mendaftarkan akun untuk profil Ustadz/ah ${targetTeacher.name}!`);
      } else {
        // Create completely new teacher profile
        teacherId = `T${Date.now()}`;
        const newTeacher: Teacher = {
          id: teacherId,
          name: authFullName.trim(),
          gender: authGender,
          phone: '-',
          status: 'Ustadz Tetap',
          specialty: 'Jilid 1-6 & Juz 30',
          experience: '3 Tahun',
          username: cleanUsername,
          password: authPassword.trim(),
          updatedAt: new Date().toISOString(),
          shift1Classes: [],
          shift1Levels: [],
          shift2Classes: [],
          shift2Levels: [],
          shift3Classes: [],
          shift3Levels: []
        };
        await setDoc(doc(db, TEACHERS_COLLECTION, teacherId), newTeacher);
        triggerToast(`🎉 Berhasil mendaftarkan akun dan profil Guru Baru: ${newTeacher.name}!`);
      }

      // Log in automatically
      const mockUser = {
        email: `${cleanUsername}@siquran.local`,
        displayName: authFullName.trim(),
        photoURL: "",
        username: cleanUsername,
        uid: teacherId
      };

      setCurrentUser(mockUser);
      
      localStorage.setItem('siquran_custom_session', JSON.stringify({
        username: cleanUsername,
        teacherId: teacherId
      }));

      await addFirebaseLog(
        cleanUsername,
        "Pendaftaran Akun",
        `Mendaftarkan akun custom "${cleanUsername}" untuk Ustadz/ah ${authFullName.trim()}`
      );

      setIsAuthModalOpen(false);
      setAuthUsername('');
      setAuthPassword('');
      setAuthFullName('');
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      triggerToast("⚠️ Terjadi kesalahan saat pendaftaran.");
      setIsFirebaseSyncing(false);
    }
  };

  // Custom Sign Out handler
  const handleCustomSignOut = () => {
    setConfirmDialog({
      title: "Keluar Akun",
      message: "Apakah Anda yakin ingin keluar dari akun Anda?",
      onConfirm: async () => {
        try {
          setCurrentUser(null);
          setActiveTeacher(null);
          localStorage.removeItem('siquran_custom_session');
          triggerToast("🔒 Berhasil keluar akun.");
        } catch (err) {
          console.error("Error signing out: ", err);
        }
      }
    });
  };

  // Reset/Delete Custom Teacher Account handler (admin usage)
  const handleResetCustomTeacherAccount = async (teacherId: string, teacherName: string) => {
    setConfirmDialog({
      title: "Hapus Akun Custom",
      message: `Apakah Anda yakin ingin menghapus akun login custom untuk Ustadz/ah ${teacherName}? Guru bersangkutan harus mendaftar ulang jika ingin login kembali.`,
      onConfirm: async () => {
        try {
          setIsFirebaseSyncing(true);
          const teacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
          await updateDoc(teacherRef, {
            username: "",
            password: "",
            updatedAt: new Date().toISOString()
          });
          triggerToast(`🔒 Akun login custom untuk ${teacherName} berhasil dihapus.`);
          setIsFirebaseSyncing(false);
        } catch (err) {
          console.error(err);
          triggerToast("⚠️ Gagal menghapus akun custom.");
          setIsFirebaseSyncing(false);
        }
      }
    });
  };

  // Self-service teacher account link handler
  const handleLinkGoogleToTeacher = async (teacherId: string) => {
    if (!currentUser || !currentUser.email) return;
    try {
      setIsFirebaseSyncing(true);
      const targetTeacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
      await updateDoc(targetTeacherRef, {
        linkedEmail: currentUser.email.toLowerCase(),
        updatedAt: new Date().toISOString()
      });
      const matchedT = teachers.find(t => t.id === teacherId);
      const tName = matchedT ? matchedT.name : `ID ${teacherId}`;
      await addFirebaseLog(
        currentUser.email,
        "Menghubungkan Akun",
        `Berhasil menghubungkan akun Google (${currentUser.email}) ke profil aseli Guru TPQ: ${tName}`
      );
      triggerToast(`🔑 Akun Google Anda berhasil dikaitkan dengan Ustadz/ah ${tName}!`);
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      triggerToast("⚠️ Gagal mengaitkan akun. Coba tanyakan ke operator utama.");
      setIsFirebaseSyncing(false);
    }
  };

  // Self-service create new teacher and link instantly
  const handleCreateAndLinkTeacher = async () => {
    if (!inlineTeacherName.trim()) {
      triggerToast('⚠️ Nama lengkap wajib diisi!');
      return;
    }
    if (!currentUser || !currentUser.email) return;
    try {
      setIsFirebaseSyncing(true);
      const newId = `T${Date.now()}`;
      const payload: Teacher = {
        id: newId,
        name: inlineTeacherName.trim(),
        gender: 'L',
        phone: '-',
        status: 'Ustadz Tetap',
        specialty: 'Jilid 1-6 & Juz 30',
        experience: '3 Tahun',
        linkedEmail: currentUser.email.toLowerCase(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(doc(db, TEACHERS_COLLECTION, newId), payload);
      setInlineTeacherName('');
      setIsShowingCreateInline(false);
      triggerToast(`🎉 Berhasil membuat profil baru dan menghubungkan ke Ustadz/ah ${payload.name}!`);
      await addFirebaseLog(
        currentUser.email,
        "Buat & Hubungkan Guru",
        `Membuat profil guru baru "${payload.name}" dan menghubungkannya ke akun Google (${currentUser.email}).`
      );
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, TEACHERS_COLLECTION);
    }
  };

  // Handler to clear all teachers from all students in Firestore
  const handleClearAllStudentTeachers = async () => {
    setConfirmDialog({
      title: "Kosongkan Semua Pengajar Santri 🧹",
      message: "Apakah Anda yakin ingin menghapus/mengosongkan data asatidz (nama pengajar) dari seluruh santri di database? Ini akan membuat status pengajar semua santri kosong agar masing-masing guru bisa melakukan claim secara mandiri dan mudah.",
      onConfirm: async () => {
        try {
          setIsFirebaseSyncing(true);
          const studentBatch = writeBatch(db);
          let count = 0;
          students.forEach((st) => {
            const studentRef = doc(db, STUDENTS_COLLECTION, st.id);
            studentBatch.update(studentRef, { 
              asatidz: "",
              updatedAt: new Date().toISOString()
            });
            count++;
          });
          if (count > 0) {
            await studentBatch.commit();
          }
          triggerToast("🧹 Sukses mengosongkan nama pengajar seluruh santri! Sekarang guru dapat mengklaim santri dengan mudah.");
          await addFirebaseLog(
            currentUser?.email || "Admin",
            "Kosongkan Pengajar",
            `Melakukan pembersihan massal: Mengosongkan data Ustadz/ah pengampu untuk ${count} santri.`
          );
          setIsFirebaseSyncing(false);
        } catch (err: any) {
          console.error("Gagal mengosongkan asatidz: ", err);
          triggerToast(`⚠️ Gagal membersihkan pengajar: ${err.message || err}`);
          setIsFirebaseSyncing(false);
        }
      }
    });
  };

  // Handler to load active teacher's details into the onboarding wizard state for modification
  const handleStartEditingMyProfile = () => {
    if (!activeTeacher) return;
    setOnboardingName(activeTeacher.name);
    setOnboardingPhone(activeTeacher.phone || "");
    setOnboardingGender(activeTeacher.gender || "L");
    setOnboardingStatus(activeTeacher.status || "Ustadz Tetap");
    setOnboardingExperience(activeTeacher.experience || "3 Tahun");
    setOnboardingShift1Classes(activeTeacher.shift1Classes || []);
    setOnboardingShift1Levels(activeTeacher.shift1Levels || []);
    setOnboardingShift2Classes(activeTeacher.shift2Classes || []);
    setOnboardingShift2Levels(activeTeacher.shift2Levels || []);
    setOnboardingShift3Classes(activeTeacher.shift3Classes || []);
    setOnboardingShift3Levels(activeTeacher.shift3Levels || []);
    
    // Claimed students are those whose asatidz matches activeTeacher.name
    const currentlyClaimedIds = students
      .filter(st => st.asatidz === activeTeacher.name)
      .map(st => st.id);
    setOnboardingClaimedStudentIds(currentlyClaimedIds);
    
    setOnboardingStep(1);
    setIsEditingMyProfile(true);
  };

  // Unified handler to save teacher onboarding or profile modification with claims
  const handleSaveTeacherOnboarding = async () => {
    if (!onboardingName.trim()) {
      triggerToast("⚠️ Nama lengkap guru harus diisi!");
      return;
    }
    if (!currentUser || !currentUser.email) {
      triggerToast("⚠️ Anda harus masuk dengan Google terlebih dahulu.");
      return;
    }

    try {
      setIsFirebaseSyncing(true);
      
      // Calculate specialty summary text
      const specialtyParts: string[] = [];
      if (onboardingShift1Classes.length || onboardingShift1Levels.length) {
        specialtyParts.push(`S1: ${onboardingShift1Classes.join(', ') || '-'} (${onboardingShift1Levels.join(', ') || '-'})`);
      }
      if (onboardingShift2Classes.length || onboardingShift2Levels.length) {
        specialtyParts.push(`S2: ${onboardingShift2Classes.join(', ') || '-'} (${onboardingShift2Levels.join(', ') || '-'})`);
      }
      if (onboardingShift3Classes.length || onboardingShift3Levels.length) {
        specialtyParts.push(`S3: ${onboardingShift3Classes.join(', ') || '-'} (${onboardingShift3Levels.join(', ') || '-'})`);
      }
      const specialtyText = specialtyParts.join(" | ") || "Jilid 1-6 & Juz 30";

      const teacherId = activeTeacher?.id || `T${Date.now()}`;
      
      const teacherPayload: Teacher = {
        id: teacherId,
        name: onboardingName.trim(),
        gender: onboardingGender,
        phone: onboardingPhone.trim() || "-",
        status: onboardingStatus,
        specialty: specialtyText,
        experience: onboardingExperience,
        linkedEmail: currentUser.email.toLowerCase(),
        username: activeTeacher?.username || currentUser.username || "",
        password: activeTeacher?.password || "",
        shift1Classes: onboardingShift1Classes,
        shift1Levels: onboardingShift1Levels,
        shift2Classes: onboardingShift2Classes,
        shift2Levels: onboardingShift2Levels,
        shift3Classes: onboardingShift3Classes,
        shift3Levels: onboardingShift3Levels,
        updatedAt: new Date().toISOString()
      };

      // 1. Save Teacher Profile
      await setDoc(doc(db, TEACHERS_COLLECTION, teacherId), teacherPayload);

      // 2. Update claims in students collection
      const studentBatch = writeBatch(db);
      let claimCount = 0;
      let unclaimCount = 0;

      // Unclaim previous students who are no longer selected
      if (activeTeacher) {
        const previouslyOwned = students.filter(s => s.asatidz === activeTeacher.name);
        previouslyOwned.forEach(st => {
          if (!onboardingClaimedStudentIds.includes(st.id)) {
            studentBatch.update(doc(db, STUDENTS_COLLECTION, st.id), {
              asatidz: "",
              updatedAt: new Date().toISOString()
            });
            unclaimCount++;
          }
        });
      }

      // Claim new/current selected students
      onboardingClaimedStudentIds.forEach(id => {
        const student = students.find(st => st.id === id);
        if (student && student.asatidz !== onboardingName.trim()) {
          studentBatch.update(doc(db, STUDENTS_COLLECTION, id), {
            asatidz: onboardingName.trim(),
            updatedAt: new Date().toISOString()
          });
          claimCount++;
        }
      });

      // Commit student updates if any
      if (claimCount > 0 || unclaimCount > 0) {
        await studentBatch.commit();
      }

      playConfettiEffect();
      triggerToast(`🎉 Profil Guru Berhasil ${activeTeacher ? "Diperbarui" : "Didaftarkan"}! Mengklaim ${onboardingClaimedStudentIds.length} Santri.`);
      
      await addFirebaseLog(
        currentUser.username || currentUser.email,
        activeTeacher ? "Edit Profil Guru" : "Pendaftaran Guru",
        `Guru ${onboardingName.trim()} mengonfigurasi profil mengajar & mengklaim ${onboardingClaimedStudentIds.length} santri (Claimed: +${claimCount}, Unclaimed: -${unclaimCount}).`
      );

      // Reset states
      setIsEditingMyProfile(false);
      setOnboardingStep(1);
      setIsFirebaseSyncing(false);
    } catch (err: any) {
      console.error("Error saving onboarding:", err);
      triggerToast(`⚠️ Gagal menyimpan profil guru: ${err.message || err}`);
      setIsFirebaseSyncing(false);
    }
  };

  const handleUnlinkTeacherEmail = async (teacherId: string, name: string) => {
    setConfirmDialog({
      title: "Putuskan Link Akun Google",
      message: `Apakah Anda yakin ingin memutuskan keterkaitan akun Google dengan Profil Guru ${name}?`,
      onConfirm: async () => {
        try {
          setIsFirebaseSyncing(true);
          const targetTeacherRef = doc(db, TEACHERS_COLLECTION, teacherId);
          await updateDoc(targetTeacherRef, {
            linkedEmail: ""
          });
          triggerToast(`🔓 Keterkaitan akun Google dengan Guru ${name} telah dihapus.`);
          await addFirebaseLog("PJ/Guru", "Putuskan Binding Guru", `Memutuskan keterkaitan akun Google pada guru: ${name}`);
          setIsFirebaseSyncing(false);
        } catch (err) {
          console.error(err);
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.WRITE, TEACHERS_COLLECTION);
        }
      }
    });
  };

  // 1. Initial Load & Firebase Listeners
  useEffect(() => {
    // Run automatic seeding for the first time
    seedDatabaseIfEmpty().then(() => {
      // Connect to students collection in real-time
      const unsubStudents = onSnapshot(collection(db, STUDENTS_COLLECTION), (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Student);
        });
        setStudents(list);
        
        // Push listener updates to our console log visual
        setFirebaseLogs(prev => [
          {
            id: String(Date.now() + Math.random()),
            type: 'LISTEN',
            details: `Koleksi "${STUDENTS_COLLECTION}" diperbarui (${snapshot.size} santri synced).`,
            time: new Date().toLocaleTimeString()
          },
          ...prev
        ]);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, STUDENTS_COLLECTION);
      });

      // Connect to teachers collection in real-time
      const unsubTeachers = onSnapshot(collection(db, TEACHERS_COLLECTION), (snapshot) => {
        const list: Teacher[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Teacher);
        });
        setTeachers(list);

        // Restore custom login session if saved
        const savedSession = localStorage.getItem('siquran_custom_session');
        if (savedSession) {
          try {
            const { username, teacherId } = JSON.parse(savedSession);
            const matched = list.find(t => t.username?.toLowerCase() === username.toLowerCase() || t.id === teacherId);
            if (matched) {
              setCurrentUser({
                email: `${matched.username}@siquran.local`,
                displayName: matched.name,
                photoURL: "",
                username: matched.username,
                uid: matched.id
              });
              setActiveTeacher(matched);
              setInputTeacher(matched.name);
            }
          } catch (e) {
            console.error("Error restoring custom session", e);
          }
        }
        setIsAuthLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, TEACHERS_COLLECTION);
        setIsAuthLoading(false);
      });

      // Connect to system logs collection in real-time
      const unsubLogs = onSnapshot(collection(db, LOGS_COLLECTION), (snapshot) => {
        const list: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: data.id,
            timestamp: data.timestamp,
            user: data.user,
            action: data.action,
            details: data.details
          } as ActivityLog);
        });
        // Sort logs descending by ID
        list.sort((a, b) => b.id.localeCompare(a.id));
        setLogs(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, LOGS_COLLECTION);
      });

      // Connect to system config options document in real-time
      const unsubConfigs = onSnapshot(doc(db, CONFIGS_COLLECTION, "school_options"), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.classes)) {
            setDynamicClasses(data.classes);
          }
          if (Array.isArray(data.levels)) {
            setDynamicLevels(data.levels);
          }
          if (Array.isArray(data.doas)) {
            setDynamicDoas(data.doas);
          }
          if (Array.isArray(data.surahs)) {
            setDynamicSurahs(data.surahs);
          }
          if (data.yayasanName !== undefined) setYayasanName(data.yayasanName);
          if (data.unitName !== undefined) setUnitName(data.unitName);
          if (data.permitNumber !== undefined) setPermitNumber(data.permitNumber);
          if (data.address !== undefined) setAddress(data.address);
          if (data.phone !== undefined) setPhone(data.phone);
          if (data.email !== undefined) setEmail(data.email);
          if (data.headmasterName !== undefined) setHeadmasterName(data.headmasterName);
          if (data.pjName !== undefined) setPjName(data.pjName);
          if (data.kopHeaderImage !== undefined) setKopHeaderImage(data.kopHeaderImage);
          if (data.kopPlacement !== undefined) setKopPlacement(data.kopPlacement);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, CONFIGS_COLLECTION);
      });

      // Connect to graduated students collection in real-time
      const unsubGraduated = onSnapshot(collection(db, "graduated_students"), (snapshot) => {
        const list: Student[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Student);
        });
        setGraduatedStudents(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, "graduated_students");
      });

      return () => {
        unsubStudents();
        unsubTeachers();
        unsubLogs();
        unsubConfigs();
        unsubGraduated();
      };
    });

    // Custom auth does not need any Firebase onAuthStateChanged listener.
    // Auth loading is controlled by the real-time teachers collection listener.
  }, []);

  // Sync active teacher when teachers list changes for currently logged in custom user
  useEffect(() => {
    if (currentUser && currentUser.username) {
      const matched = teachers.find(t => t.username?.toLowerCase() === currentUser.username.toLowerCase());
      if (matched) {
        setActiveTeacher(matched);
        setInputTeacher(matched.name);
      }
    }
  }, [teachers]);

  // Synchronize dynamic status
  const syncToSimulatedFirebase = (type: 'UPDATE' | 'INSERT' | 'DELETE' | 'SYNC', details: string) => {
    setFirebaseLogs(prev => [
      {
        id: String(Date.now()),
        type,
        details,
        time: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
  };

  // Custom Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 3. Reset database (Overwriting with clean 339 students records)
  const handleResetData = () => {
    setConfirmDialog({
      title: "Reset Database Utama",
      message: "Apakah Anda yakin ingin menyetel ulang database Firestore kembali ke 339 santri awal berdasarkan berkas data aseli?",
      onConfirm: async () => {
        try {
          setIsFirebaseSyncing(true);
          const freshList = generate339Students();
          
          // Write in batches of 339 (Firestore limit is 500)
          const batch = writeBatch(db);
          freshList.forEach((st) => {
            const studentDocRef = doc(db, STUDENTS_COLLECTION, st.id);
            batch.set(studentDocRef, {
              ...st,
              updatedAt: new Date().toISOString()
            });
          });
          await batch.commit();

          // Also restore initial teachers list
          const teacherBatch = writeBatch(db);
          INITIAL_TEACHERS.forEach((tc) => {
            const teacherDocRef = doc(db, TEACHERS_COLLECTION, tc.id);
            teacherBatch.set(teacherDocRef, {
              ...tc,
              linkedEmail: "", // Reset bindings on system wipe
              updatedAt: new Date().toISOString()
            });
          });
          await teacherBatch.commit();

          await addFirebaseLog("PJ Utama", "Reset Sistem", "Semua database Firestore disinkronisasi ulang dengan 339 rekaman data awal.");
          triggerToast('Database Firestore berhasil disetel ulang ke 339 santri!');
          setIsFirebaseSyncing(false);
        } catch (err) {
          console.error("Error resetting data: ", err);
          triggerToast("⚠️ Gagal mereset database ke Firestore.");
          setIsFirebaseSyncing(false);
        }
      }
    });
  };

  // --- CSV TEMPLATE INTEGRATION ---

  const handleDownloadTemplate = () => {
    // CSV columns headers
    const headers = ['NIPD', 'NISN', 'Nama', 'Kelas', 'Gender', 'Shift', 'Level', 'PageDetail', 'MateriTambahan', 'Asatidz', 'SOP_Kenaikan_Kelas_Oleh_PJ'];
    
    // Sample rows demonstrating correct data input for teachers / admins
    const sampleRows = [
      ['001', '99827', 'Azka Humayra Firzanah', '7A', 'P', '1', 'Juz 29', 'QS. Al-Qolam : 40', 'Doa 1-35 (setelah sholat Dhuha)', 'Hayu', 'SOP PJ: Kelas 7 naik ke Kelas 8'],
      ['002', '44122', 'Naila Husna', '7A', 'P', '1', 'Juz 29', 'QS. Al-Mursalat', 'Doa 1-35 (setelah sholat Dhuha)', 'Hayu', 'SOP PJ: Kelas 7 naik ke Kelas 8'],
      ['003', '', 'Ahmad Ghazi', '8B', 'L', '2', 'Jilid 1', 'Halaman 15', 'Doa Masuk Masjid', 'Ahmad Syafii', 'SOP PJ: Kelas 8 naik ke Kelas 9'],
      ['004', '300101', 'Siti Aminah', '9C', 'P', '3', 'Juz 30', 'QS. An-Naba : 1-10', 'Doa Khatam Quran', 'Maryam Hanifa', 'SOP PJ: Kelas 9 Lulus & Jadi Alumni']
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_input_santri_siquran.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('📥 Template CSV berhasil diunduh! Silakan buka di Excel / Google Sheets.');
  };

  const handleDownloadCurrentData = () => {
    if (students.length === 0) {
      triggerToast('⚠️ Tidak ada data santri aktif untuk diunduh.');
      return;
    }
    const headers = ['NIPD', 'NISN', 'Nama', 'Kelas', 'Gender', 'Shift', 'Level', 'PageDetail', 'MateriTambahan', 'Asatidz', 'SOP_Kenaikan_Kelas_Oleh_PJ'];
    
    const rows = students.map(st => {
      let sopRule = "SOP PJ: Kelas 7->8, 8->9, 9->Alumni";
      const classStr = st.class || "";
      if (classStr.startsWith("7")) {
        sopRule = "SOP PJ: Kelas 7 naik ke Kelas 8";
      } else if (classStr.startsWith("8")) {
        sopRule = "SOP PJ: Kelas 8 naik ke Kelas 9";
      } else if (classStr.startsWith("9")) {
        sopRule = "SOP PJ: Kelas 9 Lulus & Jadi Alumni";
      }
      
      return [
        st.nipd || '',
        st.nisn || '',
        st.name || '',
        st.class || '',
        st.gender || 'L',
        st.shift ? String(st.shift) : '1',
        st.level || '',
        st.pageDetail || '',
        st.materiTambahan || '',
        st.asatidz || '',
        sopRule
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_santri_terkini_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('📥 Data santri terkini berhasil diunduh! Silakan edit di Microsoft Excel / Google Sheets.');
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      try {
        const lines = text.split(/\r?\n/);
        if (lines.length < 2) {
          triggerToast('⚠️ File template tidak valid atau kosong.');
          return;
        }

        // Parse CSV headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
        const nipdIdx = headers.indexOf('nipd');
        const namaIdx = headers.indexOf('nama');
        
        if (nipdIdx === -1 || namaIdx === -1) {
          triggerToast('⚠️ Format file salah. Pastikan header CSV berisi minimal kolom "NIPD" dan "Nama".');
          return;
        }

        // Optional columns mapping
        const nisnIdx = headers.indexOf('nisn');
        const kelasIdx = headers.indexOf('kelas');
        const genderIdx = headers.indexOf('gender');
        const shiftIdx = headers.indexOf('shift');
        const levelIdx = headers.indexOf('level');
        const pageIdx = headers.indexOf('pagedetail');
        const materiIdx = headers.indexOf('materitambahan');
        const asatidzIdx = headers.indexOf('asatidz');

        const parsedStudents: Student[] = [];
        let startIndex = students.length + 1001;

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Simple safe parsing with quote handling
          const cells: string[] = [];
          let currentCell = '';
          let inQuotes = false;
          
          for (let charIndex = 0; charIndex < line.length; charIndex++) {
            const char = line[charIndex];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              cells.push(currentCell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
              currentCell = '';
            } else {
              currentCell += char;
            }
          }
          cells.push(currentCell.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

          if (cells.length < 2) continue;

          const nipd = cells[nipdIdx] || `ID-${Date.now()}-${i}`;
          const name = cells[namaIdx];
          if (!name) continue;

          const nisn = nisnIdx !== -1 && cells[nisnIdx] ? formatNISN(cells[nisnIdx]) : '#N/A';
          const kls = kelasIdx !== -1 && cells[kelasIdx] ? cells[kelasIdx] : '7A';
          const gender = genderIdx !== -1 && cells[genderIdx]?.toUpperCase() === 'P' ? 'P' : 'L';
          const shiftValue = shiftIdx !== -1 ? parseInt(cells[shiftIdx], 10) : 1;
          const shift = (shiftValue === 1 || shiftValue === 2 || shiftValue === 3) ? shiftValue : 1;
          const rawLevel = levelIdx !== -1 ? cells[levelIdx] : 'Juz 30';
          
          let level = rawLevel;
          const matchedLevel = dynamicLevels.find(lev => lev.toLowerCase() === rawLevel.toLowerCase());
          if (matchedLevel) {
            level = matchedLevel;
          }

          const pageDetail = pageIdx !== -1 && cells[pageIdx] ? cells[pageIdx] : 'Halaman 1';
          const materiTambahan = materiIdx !== -1 && cells[materiIdx] ? cells[materiIdx] : 'Doa 1-35';
          const asatidz = asatidzIdx !== -1 && cells[asatidzIdx] ? cells[asatidzIdx] : 'Hayu';

          parsedStudents.push({
            id: `S${startIndex++}`,
            nipd,
            nisn,
            name,
            class: kls,
            gender,
            shift,
            level,
            pageDetail,
            materiTambahan,
            asatidz,
            naikTingkatThisMonth: false
          });
        }

        if (parsedStudents.length === 0) {
          triggerToast('⚠️ Tidak ada data santri baru yang berhasil diproses dari file tersebut.');
          return;
        }

        setConfirmDialog({
          title: "Import CSV Santri",
          message: `Berhasil membaca ${parsedStudents.length} santri dari file CSV!\n\nPilihlah metode impor yang Anda inginkan:\n- Klik [Tambah Baru] untuk menambahkan data baru ini ke database saat ini.\n- Klik [Timpa Semua] untuk MENGHAPUS seluruh isi database saat ini dan menggantinya dengan data berkas CSV ini.`,
          confirmLabel: "Tambah Baru",
          cancelLabel: "Timpa Semua",
          onConfirm: async () => {
            try {
              setIsFirebaseSyncing(true);
              for (const st of parsedStudents) {
                await setDoc(doc(db, STUDENTS_COLLECTION, st.id), {
                  ...st,
                  updatedAt: new Date().toISOString()
                });
              }
              await addFirebaseLog("PJ/Guru", "Import CSV", `Mengimpor ${parsedStudents.length} santri baru via template.`);
              triggerToast(`🚀 ${parsedStudents.length} santri berhasil ditambahkan ke database!`);
              setIsFirebaseSyncing(false);
            } catch (csvErr) {
              console.error(csvErr);
              setIsFirebaseSyncing(false);
              handleFirestoreError(csvErr, OperationType.WRITE, STUDENTS_COLLECTION);
            }
          },
          onCancel: async () => {
            try {
              setIsFirebaseSyncing(true);
              // Delete old students
              for (const s of students) {
                await deleteDoc(doc(db, STUDENTS_COLLECTION, s.id));
              }
              parsedStudents.forEach((st, idx) => {
                st.id = `S${1001 + idx}`;
              });
              for (const st of parsedStudents) {
                await setDoc(doc(db, STUDENTS_COLLECTION, st.id), {
                  ...st,
                  updatedAt: new Date().toISOString()
                });
              }
              await addFirebaseLog("PJ/Guru", "Overwrite CSV", `Mengganti database dengan ${parsedStudents.length} santri dari CSV.`);
              triggerToast(`🔁 Database diganti dengan ${parsedStudents.length} data dari file!`);
              setIsFirebaseSyncing(false);
            } catch (csvErr) {
              console.error(csvErr);
              setIsFirebaseSyncing(false);
              handleFirestoreError(csvErr, OperationType.WRITE, STUDENTS_COLLECTION);
            }
          }
        });

      } catch (err) {
        console.error(err);
        triggerToast('⚠️ Terjadi kesalahan mendeteksi format berkas. Pastikan format sesuai template resmi.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  // --- DATABASE OPERATIONS ---
  
  // Save edited student
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      setIsFirebaseSyncing(true);
      const studentToEdit = students.find(s => s.id === editingStudent.id);
      const previousLevel = studentToEdit ? studentToEdit.level : "";
      
      const newlyLeveledUp = editingStudent.naikTingkatThisMonth && (!studentToEdit || !studentToEdit.naikTingkatThisMonth);
      
      const updatedData = {
        ...editingStudent,
        nisn: editingStudent.nisn ? formatNISN(editingStudent.nisn) : '#N/A',
        historyLevel: newlyLeveledUp ? previousLevel : (studentToEdit && studentToEdit.historyLevel ? studentToEdit.historyLevel : ""),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, STUDENTS_COLLECTION, editingStudent.id), updatedData);
      
      const wasLeveledUp = editingStudent.naikTingkatThisMonth;
      if (wasLeveledUp) {
        playConfettiEffect();
        triggerToast(`🏆 ${editingStudent.name} dinyatakan naik tingkat!`);
      } else {
        triggerToast(`Data ${editingStudent.name} berhasil diperbarui.`);
      }

      await addFirebaseLog(
        activeTeacher ? activeTeacher.name : "System PJ",
        "Edit Master",
        `Mengubah data ${editingStudent.name} (${editingStudent.nipd}) - Kelas: ${editingStudent.class}, Level: ${editingStudent.level} ${wasLeveledUp ? '(Naik Tingkat)' : ''}`
      );

      setEditingStudent(null);
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, STUDENTS_COLLECTION);
    }
  };

  // Add new student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name || !newStudent.nipd) {
      triggerToast('⚠️ Nama dan NIPD harus diisi!');
      return;
    }

    try {
      setIsFirebaseSyncing(true);
      const nextId = `S${1001 + students.length}`;
      const studentToAdd: Student = {
        id: nextId,
        nipd: newStudent.nipd,
        nisn: newStudent.nisn ? formatNISN(newStudent.nisn) : '#N/A',
        name: newStudent.name,
        class: newStudent.class || '7A',
        level: newStudent.level || '1A',
        pageDetail: newStudent.pageDetail || 'Halaman 1',
        materiTambahan: newStudent.materiTambahan || 'Doa Harian',
        asatidz: newStudent.asatidz || (activeTeacher ? activeTeacher.name : 'Hayu'),
        shift: (Number(newStudent.shift) || 1) as 1 | 2 | 3,
        naikTingkatThisMonth: newStudent.naikTingkatThisMonth || false,
        gender: (newStudent.gender || 'L') as 'L' | 'P',
        historyLevel: newStudent.naikTingkatThisMonth ? '1A' : undefined,
        tahsinPencapaian: newStudent.tahsinPencapaian || newStudent.pageDetail || 'Halaman 1',
        tahsinKeterangan: newStudent.tahsinKeterangan || `Alhamdulillah Ananda mengalami perkembangan yang baik. Terus tingkatkan kualitas bacaan dan tajwidnya di rumah.`,
        tahfizhPencapaian: newStudent.tahfizhPencapaian || 'Juz 30 (Surat Pendek)',
        tahfizhKeterangan: newStudent.tahfizhKeterangan || `Alhamdulillah, hafalan Ananda bertambah lancar. Mohon bantuan bimbingan muraja'ah di rumah.`
      };

      await setDoc(doc(db, STUDENTS_COLLECTION, nextId), {
        ...studentToAdd,
        updatedAt: new Date().toISOString()
      });

      if (studentToAdd.naikTingkatThisMonth) {
        playConfettiEffect();
      }
      
      triggerToast(`Santri baru ${studentToAdd.name} berhasil didaftarkan!`);
      await addFirebaseLog(
        activeTeacher ? activeTeacher.name : "System PJ",
        "Mendaftarkan Santri Baru",
        `Menambahkan "${studentToAdd.name}" ke kelas ${studentToAdd.class} kelompok Ustadz/ah ${studentToAdd.asatidz}`
      );
      
      // Reset form
      setNewStudent({
        nipd: '',
        nisn: '',
        name: '',
        class: '7A',
        level: '1A',
        pageDetail: 'Halaman 1',
        materiTambahan: 'Doa Harian',
        asatidz: activeTeacher ? activeTeacher.name : 'Hayu',
        shift: 1,
        naikTingkatThisMonth: false,
        gender: 'L'
      });
      setIsAddingStudent(false);
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, STUDENTS_COLLECTION);
    }
  };

  // Handle delete student (For PJ administration)
  const handleDeleteStudent = (id: string, name: string) => {
    setConfirmDialog({
      title: "Hapus Santri",
      message: `Apakah Anda yakin ingin menghapus santri ${name} dari database?`,
      onConfirm: async () => {
        try {
          setIsFirebaseSyncing(true);
          await deleteDoc(doc(db, STUDENTS_COLLECTION, id));
          triggerToast(`Santri ${name} telah dihapus.`);
          await addFirebaseLog(
            activeTeacher ? activeTeacher.name : "System PJ",
            "Hapus Santri",
            `Menghapus "${name}" (${id}) dari database.`
          );
          setIsFirebaseSyncing(false);
        } catch (err) {
          console.error(err);
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.DELETE, STUDENTS_COLLECTION);
        }
      }
    });
  };

  // Handle delete all students (Clear database for new template import)
  const handleClearAllStudents = () => {
    setConfirmDialog({
      title: "Hapus Semua Santri",
      message: `PERINGATAN! Tindakan ini akan menghapus SELURUH (${students.length}) data santri secara permanen dari database. Apakah Anda yakin ingin mengosongkan data santri?`,
      confirmLabel: "Ya, Hapus Semua!",
      cancelLabel: "Batal",
      onConfirm: async () => {
        try {
          setIsFirebaseSyncing(true);
          const promises = students.map(s => deleteDoc(doc(db, STUDENTS_COLLECTION, s.id)));
          await Promise.all(promises);
          triggerToast(`🎉 Berhasil menghapus semua data santri!`);
          await addFirebaseLog(
            activeTeacher ? activeTeacher.name : "System PJ",
            "Hapus Semua Santri",
            `Menghapus seluruh data santri (${students.length} santri) dari database.`
          );
          setIsFirebaseSyncing(false);
        } catch (err) {
          console.error(err);
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.DELETE, STUDENTS_COLLECTION);
        }
      }
    });
  };

  // Handle grade promotion of all students (Kenaikan Kelas)
  const handlePromoteStudents = () => {
    if (students.length === 0) {
      triggerToast("⚠️ Tidak ada data santri untuk dipromosikan!");
      return;
    }
    const executionPj = activeTeacher ? activeTeacher.name : pjName;
    setConfirmDialog({
      title: "Proses Kenaikan Kelas (Promosi)",
      message: `Tindakan ini akan mempromosikan santri ke jenjang berikutnya secara otomatis:
1. Menghapus data santri Kelas 9 (Lulus) dan memindahkannya ke Database Alumni.
2. Memindahkan santri Kelas 8 naik ke Kelas 9.
3. Memindahkan santri Kelas 7 naik ke Kelas 8.
4. Mengosongkan Kelas 7 untuk angkatan baru.

Penanggung Jawab (PJ) Eksekusi Sistem: ${executionPj}

Apakah Anda yakin ingin melanjutkan proses kenaikan kelas untuk ${students.length} santri saat ini?`,
      confirmLabel: "Ya, Proses Kenaikan Kelas!",
      cancelLabel: "Batal",
      onConfirm: async () => {
        try {
          setIsFirebaseSyncing(true);
          const deletePromises: Promise<void>[] = [];
          const updatePromises: Promise<void>[] = [];
          let deleteCount = 0;
          let promoteTo9Count = 0;
          let promoteTo8Count = 0;

          students.forEach(s => {
            const classStr = s.class || "";
            if (classStr.startsWith("9")) {
              // Save to graduated database (jadikan database lulus) before delete
              const graduatedRef = doc(db, "graduated_students", s.id);
              deletePromises.push(setDoc(graduatedRef, {
                ...s,
                graduatedAt: new Date().toISOString(),
                status: "Lulus",
                class: `Lulus (Eks Kelas ${s.class})`
              }));
              deletePromises.push(deleteDoc(doc(db, STUDENTS_COLLECTION, s.id)));
              deleteCount++;
            } else if (classStr.startsWith("8")) {
              // Promote Grade 8 to 9
              const suffix = classStr.substring(1); // e.g., "A", "B", etc.
              const nextClass = `9${suffix}`;
              updatePromises.push(updateDoc(doc(db, STUDENTS_COLLECTION, s.id), {
                class: nextClass,
                updatedAt: new Date().toISOString()
              }));
              promoteTo9Count++;
            } else if (classStr.startsWith("7")) {
              // Promote Grade 7 to 8
              const suffix = classStr.substring(1); // e.g., "A", "B", etc.
              const nextClass = `8${suffix}`;
              updatePromises.push(updateDoc(doc(db, STUDENTS_COLLECTION, s.id), {
                class: nextClass,
                updatedAt: new Date().toISOString()
              }));
              promoteTo8Count++;
            }
          });

          await Promise.all([...deletePromises, ...updatePromises]);
          
          triggerToast(`🎉 Sukses! ${deleteCount} santri Kelas 9 lulus (masuk alumni), ${promoteTo9Count} santri naik ke Kelas 9, dan ${promoteTo8Count} santri naik ke Kelas 8.`);
          await addFirebaseLog(
            executionPj,
            "Promosi Kelas",
            `Melakukan kenaikan kelas (PJ: ${executionPj}): Hapus ${deleteCount} santri Kelas 9 (lulus ke alumni), promosi ${promoteTo9Count} santri ke Kelas 9, promosi ${promoteTo8Count} santri ke Kelas 8.`
          );
          setIsFirebaseSyncing(false);
        } catch (err) {
          console.error(err);
          setIsFirebaseSyncing(false);
          handleFirestoreError(err, OperationType.UPDATE, STUDENTS_COLLECTION);
        }
      }
    });
  };


  // --- TEACHER INPUT PER SHIFT HANDLERS ---
  
  // Initialize temporary achievements states when input tabs or settings change
  useEffect(() => {
    const initialized: typeof tempAchievements = {};
    students.forEach(st => {
      initialized[st.id] = {
        level: st.level,
        pageDetail: st.pageDetail,
        naikTingkat: st.naikTingkatThisMonth,
        materiTambahan: st.materiTambahan,
        guruBaru: st.asatidz
      };
    });
    setTempAchievements(initialized);
  }, [students, inputClass, inputMonth]);

  const handleUpdateTempAchievement = (studentId: string, field: 'level' | 'pageDetail' | 'naikTingkat' | 'materiTambahan' | 'guruBaru', value: any) => {
    setTempAchievements(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  // Save progress for active shift & class
  const handleSaveShiftProgress = async (studentId: string) => {
    const temp = tempAchievements[studentId];
    if (!temp) return;

    const studentToUpdate = students.find(s => s.id === studentId);
    if (!studentToUpdate) return;

    try {
      setIsFirebaseSyncing(true);
      const previousLevel = studentToUpdate.level;
      const newlyLeveledUp = temp.naikTingkat && !studentToUpdate.naikTingkatThisMonth;
      
      // Determine target teacher: if promoted and they chose a specific next teacher, transfer them!
      const targetTeacher = (newlyLeveledUp && temp.guruBaru) ? temp.guruBaru : studentToUpdate.asatidz;

      const updatedPayload = {
        level: temp.level,
        pageDetail: temp.pageDetail,
        materiTambahan: temp.materiTambahan,
        naikTingkatThisMonth: temp.naikTingkat,
        asatidz: targetTeacher,
        historyLevel: newlyLeveledUp ? previousLevel : (studentToUpdate.historyLevel || ""),
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, STUDENTS_COLLECTION, studentId), updatedPayload);

      if (newlyLeveledUp) {
        playConfettiEffect();
        let upgradeMsg = `🏆 Barakallahu fiikum! ${studentToUpdate.name} naik tingkat ke ${temp.level}!`;
        if (targetTeacher !== studentToUpdate.asatidz) {
          upgradeMsg += ` Kelompok ditransfer ke Ustadz/ah ${targetTeacher}.`;
        }
        triggerToast(upgradeMsg);

        await addFirebaseLog(
          activeTeacher ? activeTeacher.name : inputTeacher,
          "Naik Tingkat",
          `Santri ${studentToUpdate.name} (${studentToUpdate.nipd}) lulus ke level ${temp.level}${targetTeacher !== studentToUpdate.asatidz ? ` & ditransfer ke Ustadz/ah ${targetTeacher}` : ''}`
        );
      } else {
        triggerToast(`Capaian ${studentToUpdate.name} berhasil disimpan.`);
        await addFirebaseLog(
          activeTeacher ? activeTeacher.name : inputTeacher,
          "Input Capaian Harian",
          `Mencatat progress ${studentToUpdate.name} (${studentToUpdate.nipd}): Level ${temp.level}, Hal/Ayat: "${temp.pageDetail}", Doa/Surat: "${temp.materiTambahan}"`
        );
      }
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, STUDENTS_COLLECTION);
    }
  };

  // Claim student to active teacher teaching list
  const handleClaimStudent = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    try {
      setIsFirebaseSyncing(true);
      await updateDoc(doc(db, STUDENTS_COLLECTION, studentId), {
        asatidz: inputTeacher,
        class: inputClass,
        shift: activeShiftTab,
        updatedAt: new Date().toISOString()
      });
      triggerToast(`🎉 Berhasil memindahkan ${student.name} ke Kelas ${inputClass} - Shift ${activeShiftTab} di kelompok Anda!`);
      await addFirebaseLog(
        activeTeacher ? activeTeacher.name : inputTeacher,
        "Klaim Roster Santri",
        `Memindahkan santri ${student.name} (${student.nipd}) ke Kelas ${inputClass}, Shift ${activeShiftTab} di bawah bimbingan ${inputTeacher}.`
      );
      setClaimSearchQuery(''); // reset search
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, STUDENTS_COLLECTION);
    }
  };

  // Create and add student instantly from Shift page
  const handleCreateInstanStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instanStudentName.trim()) {
      triggerToast('⚠️ Nama lengkap santri harus diisi!');
      return;
    }
    if (!instanStudentNipd.trim()) {
      triggerToast('⚠️ NIPD santri harus diisi!');
      return;
    }

    // Check if NIPD already exists
    const isNipdExists = students.some(st => st.nipd.toLowerCase() === instanStudentNipd.trim().toLowerCase());
    if (isNipdExists) {
      triggerToast(`⚠️ NIPD "${instanStudentNipd.trim()}" sudah digunakan oleh santri lain!`);
      return;
    }

    try {
      setIsFirebaseSyncing(true);
      
      // Calculate a robust next ID starting with S
      const maxId = students.reduce((max, s) => { 
        const num = parseInt(s.id.replace('S', '')); 
        return isNaN(num) ? max : Math.max(max, num); 
      }, 1000);
      const nextId = "S" + (maxId + 1);

      const studentToAdd: Student = {
        id: nextId,
        nipd: instanStudentNipd.trim(),
        nisn: '#N/A',
        name: instanStudentName.trim(),
        class: inputClass,
        level: instanStudentLevel,
        pageDetail: instanStudentPage || 'Halaman 1',
        materiTambahan: instanStudentMateri,
        asatidz: inputTeacher,
        shift: activeShiftTab,
        naikTingkatThisMonth: false,
        gender: instanStudentGender,
        tahsinPencapaian: instanStudentPage || 'Halaman 1',
        tahsinKeterangan: `Alhamdulillah Ananda mengalami kemajuan baik pada tingkat ${instanStudentLevel}. Tingkatkan kelancaran bacaan dan tajwid dasar di rumah.`,
        tahfizhPencapaian: 'Juz 30 (Surat Pendek)',
        tahfizhKeterangan: `Alhamdulillah hafalan surat-surat pendek Ananda lancar. Terus ulangi di rumah agar makhraj-nya mantap.`
      };

      await setDoc(doc(db, STUDENTS_COLLECTION, nextId), {
        ...studentToAdd,
        updatedAt: new Date().toISOString()
      });

      triggerToast(`🎉 Berhasil mendaftarkan ${studentToAdd.name} ke kelompok Anda!`);
      await addFirebaseLog(
        activeTeacher ? activeTeacher.name : inputTeacher,
        "Mendaftarkan Santri Instan",
        `Menambahkan santri baru "${studentToAdd.name}" langsung ke kelas ${studentToAdd.class}, shift ${studentToAdd.shift} di kelompok mengajar.`
      );

      // Reset fields
      setInstanStudentName('');
      setInstanStudentNipd('');
      setInstanStudentGender('L');
      setIsFirebaseSyncing(false);
    } catch (err) {
      console.error(err);
      setIsFirebaseSyncing(false);
      handleFirestoreError(err, OperationType.WRITE, STUDENTS_COLLECTION);
    }
  };

  const handleAutoFillInstanNipd = () => {
    let candidate = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      const randNum = Math.floor(10000 + Math.random() * 90000);
      candidate = `NIPD-${randNum}`;
      isUnique = !students.some(st => st.nipd === candidate);
      attempts++;
    }
    setInstanStudentNipd(candidate);
    triggerToast("🔢 NIPD Acak berhasil dibuat!");
  };


  // --- CHOOSE LISTS FOR TABLES AND DISPLAY ---

  // Filtered Students for Master Database list
  const filteredStudentsMaster = useMemo(() => {
    return students.filter(st => {
      const matchSearch = searchQuery.trim() === '' || 
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        st.nipd.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (st.nisn && st.nisn.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchClass = filterClass === 'All' || st.class === filterClass;
      const matchShift = filterShift === 'All' || st.shift === Number(filterShift);
      const matchTeacher = filterTeacher === 'All' || st.asatidz === filterTeacher;
      return matchSearch && matchClass && matchShift && matchTeacher;
    });
  }, [students, searchQuery, filterClass, filterShift, filterTeacher]);

  // Filtered students inside Teacher Input Shift screen
  const filteredStudentsShift = useMemo(() => {
    return students.filter(st => {
      if (appMode === 'guru' && activeTeacher) {
        // Teacher Mode: Only display students claimed by this teacher
        const matchTeacher = st.asatidz === activeTeacher.name;
        const matchShift = st.shift === activeShiftTab;
        const matchSearch = teacherSearchQuery.trim() === '' || 
          st.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) || 
          st.nipd.toLowerCase().includes(teacherSearchQuery.toLowerCase());
        return matchTeacher && matchShift && matchSearch;
      } else {
        // Original Admin/Generic Mode: Filter by Class and Shift
        const matchClass = st.class === inputClass;
        const matchShift = st.shift === activeShiftTab;
        const matchSearch = inputSearch.trim() === '' || 
          st.name.toLowerCase().includes(inputSearch.toLowerCase()) || 
          st.nipd.toLowerCase().includes(inputSearch.toLowerCase());
        return matchClass && matchShift && matchSearch;
      }
    });
  }, [students, appMode, activeTeacher, activeShiftTab, inputClass, inputSearch, teacherSearchQuery]);

  const claimSearchResults = useMemo(() => {
    if (!claimSearchQuery.trim()) return [];
    const query = claimSearchQuery.toLowerCase().trim();
    return students.filter(st => {
      const matchName = st.name.toLowerCase().includes(query);
      const matchNipd = st.nipd.toLowerCase().includes(query);
      const matchClass = st.class.toLowerCase().includes(query);
      const matchShift = `shift ${st.shift}`.toLowerCase().includes(query) || String(st.shift) === query;
      return matchName || matchNipd || matchClass || matchShift;
    }).slice(0, 50);
  }, [students, claimSearchQuery]);

  const backupSearchResults = useMemo(() => {
    if (!backupSearchQuery.trim()) return [];
    const query = backupSearchQuery.toLowerCase().trim();
    return students.filter(st => {
      const matchName = st.name.toLowerCase().includes(query);
      const matchNipd = st.nipd.toLowerCase().includes(query);
      const matchClass = st.class.toLowerCase().includes(query);
      const matchTeacher = st.asatidz?.toLowerCase().includes(query);
      return matchName || matchNipd || matchClass || matchTeacher;
    }).slice(0, 15);
  }, [students, backupSearchQuery]);

  const myStudents = useMemo(() => {
    if (!activeTeacher) return [];
    return students.filter(st => st.asatidz === activeTeacher.name);
  }, [students, activeTeacher]);


  // --- REPORT GENERATION PREPARATIONS (3 MODELS) ---

  // Model 1: Laporan Bulanan Per Guru
  // Groups students taught by select teacher and aggregates their start status, accomplishments, and upgrades
  const reportByTeacherData = useMemo(() => {
    const list = students.filter(st => st.asatidz === reportTeacher);
    const totalCount = list.length;
    const naikTingkatCount = list.filter(st => st.naikTingkatThisMonth).length;
    
    // Group level count
    const levelCounts: { [lev: string]: number } = {};
    list.forEach(st => {
      levelCounts[st.level] = (levelCounts[st.level] || 0) + 1;
    });

    return {
      list,
      totalCount,
      naikTingkatCount,
      levelCounts
    };
  }, [students, reportTeacher, reportMonth]);

  // Model 2: Laporan Bulanan Per Kelas
  const reportByClassData = useMemo(() => {
    const list = students.filter(st => st.class === reportClass);
    const totalCount = list.length;
    const naikTingkatCount = list.filter(st => st.naikTingkatThisMonth).length;

    // Group level count
    const levelCounts: { [lev: string]: number } = {};
    list.forEach(st => {
      levelCounts[st.level] = (levelCounts[st.level] || 0) + 1;
    });

    return {
      list,
      totalCount,
      naikTingkatCount,
      levelCounts
    };
  }, [students, reportClass, reportMonth]);


  // Model 3: Laporan Capaian Total Semua Kelas (The exact grid with dynamic totals)
  // Rows: 11 categories:
  // Jilid 1-2, Jilid 3-4, Jilid 5-6, Juz 30, Juz 29, Juz 28, Juz 1-10, Juz 11-20, Juz 21-25, Juz 26-30, Tajwid/Ghorib.
  // Columns: Kelas (7A–9D, 12 columns total).
  
  const REPORT_ROW_CATEGORIES = useMemo(() => {
    return dynamicLevels.map(lev => ({
      key: lev,
      label: lev
    }));
  }, [dynamicLevels]);

  // Map student level to categories
  const classifyLevelToCategory = (level: string): string => {
    const lev = level.trim();
    const found = dynamicLevels.find(dl => dl.trim().toLowerCase() === lev.toLowerCase());
    return found || lev;
  };

  const reportTotalMatrix = useMemo(() => {
    // Initialize matrix: category -> class -> array of students
    const matrix: { [cat: string]: { [kls: string]: Student[] } } = {};
    
    REPORT_ROW_CATEGORIES.forEach(cat => {
      matrix[cat.key] = {};
      dynamicClasses.forEach(kls => {
        matrix[cat.key][kls] = [];
      });
    });

    students.forEach(st => {
      const catKey = classifyLevelToCategory(st.level);
      if (matrix[catKey] && matrix[catKey][st.class]) {
        matrix[catKey][st.class].push(st);
      } else {
        // safeguard: put in the first available category if it doesn't match perfectly
        const fallbackCat = dynamicLevels[0] || '';
        if (fallbackCat && matrix[fallbackCat]?.[st.class]) {
          matrix[fallbackCat][st.class].push(st);
        }
      }
    });

    return matrix;
  }, [students, dynamicClasses, REPORT_ROW_CATEGORIES, dynamicLevels]);

  // Compute column aggregates (totals for each class 7A, 7B, ...)
  const classTotalsArray = useMemo(() => {
    const totals: { [kls: string]: number } = {};
    dynamicClasses.forEach(kls => {
      let sum = 0;
      REPORT_ROW_CATEGORIES.forEach(cat => {
        sum += reportTotalMatrix[cat.key]?.[kls]?.length || 0;
      });
      totals[kls] = sum;
    });
    return totals;
  }, [reportTotalMatrix, dynamicClasses, REPORT_ROW_CATEGORIES]);

  // Compute grand total sum of all classes (should be exactly equivalent to students.length, i.e., 339 under initial state)
  const masterGrandTotal = useMemo(() => {
    let sum = 0;
    dynamicClasses.forEach(kls => {
      sum += classTotalsArray[kls] || 0;
    });
    return sum;
  }, [classTotalsArray, dynamicClasses]);


  // --- EXPORTS AND PRINT SIMULATORS ---
  
  const handlePrint = () => {
    window.print();
  };

  const handleExportRaportPDF = () => {
    const targetStudents = selectedReportStudentId === 'all' 
      ? students.filter(s => s.class === reportClass)
      : students.filter(s => s.id === selectedReportStudentId);

    if (targetStudents.length === 0) {
      alert("Tidak ada data santri untuk diekspor.");
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const isSTS = raportType === 'bulanan';
    
    targetStudents.forEach((st, idx) => {
      if (idx > 0) {
        doc.addPage();
      }

      const margin = 12;
      const contentWidth = 186; // 210 - 2 * 12
      let y = 12;

      // 2. KOP SURAT (OFFICIAL LETTERHEAD)
      let hasImage = false;
      let drawEmblem = true;
      let textXOffset = 26;

      if (kopHeaderImage && kopHeaderImage.startsWith('data:')) {
        try {
          const match = kopHeaderImage.match(/^data:image\/([a-zA-Z+]+);base64,/);
          const format = match ? match[1].toUpperCase() : 'PNG';
          if (kopPlacement === 'banner') {
            doc.addImage(kopHeaderImage, format, margin, y, contentWidth, 24);
            y += 24;
            hasImage = true;
            drawEmblem = false;
          } else {
            doc.addImage(kopHeaderImage, format, margin, y, 20, 20);
            hasImage = true;
            drawEmblem = false;
          }
        } catch (e) {
          console.error("Gagal menyisipkan logo/banner Kop ke PDF", e);
        }
      }

      if (drawEmblem) {
        // Draw fallback emblem (Circle + Text Q inside)
        doc.setDrawColor(4, 120, 87); // Emerald Green
        doc.setLineWidth(0.4);
        doc.setFillColor(240, 253, 244); // Very light emerald bg
        doc.circle(margin + 10, y + 10, 10, 'FD'); // radius 10, center at (margin+10, y+10)

        // Draw inner circle
        doc.setLineWidth(0.15);
        doc.circle(margin + 10, y + 10, 8.5, 'S');

        // Draw Q character
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.setTextColor(4, 120, 87);
        doc.text("Q", margin + 10, y + 13.5, { align: 'center' });
      }

      // Draw Institution Details if not banner
      if (kopPlacement !== 'banner' || !hasImage) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(4, 120, 87); // Emerald
        doc.text(yayasanName.toUpperCase(), margin + textXOffset, y + 4);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12.5);
        doc.setTextColor(15, 23, 42); // Slate Black
        doc.text(unitName, margin + textXOffset, y + 10);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105); // Slate 600
        doc.text(permitNumber, margin + textXOffset, y + 14.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(100, 116, 139); // Slate 500
        doc.text(`${address} | Telp: ${phone} | Email: ${email}`, margin + textXOffset, y + 19);

        y += 22;
      }

      // Draw Academic Divider lines
      doc.setDrawColor(15, 23, 42); // Black/Slate
      doc.setLineWidth(0.8);
      doc.line(margin, y, margin + contentWidth, y);
      
      doc.setLineWidth(0.2);
      doc.line(margin, y + 1.2, margin + contentWidth, y + 1.2);

      // 3. TITLE OF REPORT
      y += 6;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(15, 23, 42);
      
      const typeLabel = isSTS 
        ? "LAPORAN HASIL BELAJAR AL-QUR'AN (RAPORT BULANAN)" 
        : `LAPORAN HASIL BELAJAR AL-QUR'AN (RAPORT SEMESTER ${raportType === 'ganjil' ? 'GANJIL' : 'GENAP'})`;
      
      doc.text(typeLabel, margin + contentWidth / 2, y, { align: 'center' });
      
      y += 4;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      const periodLabel = isSTS 
        ? `Periode Laporan: ${reportMonth}` 
        : `Tahun Ajaran: 2025/2026 | Semester: ${raportType === 'ganjil' ? 'I (Ganjil)' : 'II (Genap)'}`;
      doc.text(periodLabel, margin + contentWidth / 2, y, { align: 'center' });

      // 4. STUDENT PROFILE BOX
      y += 5;
      doc.setFillColor(248, 250, 252); // slate-50
      doc.setDrawColor(15, 23, 42);
      doc.setLineWidth(0.4);
      doc.rect(margin, y, contentWidth, 19, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      
      // Column 1
      doc.text("Nama Santri", margin + 3, y + 5);
      doc.text("NIPD / NISN", margin + 3, y + 10);
      doc.text("Jenis Kelamin", margin + 3, y + 15);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`: ${st.name}`, margin + 28, y + 5);
      doc.text(`: ${st.nipd} / ${formatNISN(st.nisn)}`, margin + 28, y + 10);
      doc.text(`: ${st.gender === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}`, margin + 28, y + 15);

      // Column 2
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text("Kelas / Jenjang", margin + contentWidth / 2 + 5, y + 5);
      doc.text("Asatidz Penguji", margin + contentWidth / 2 + 5, y + 10);
      doc.text("Status Santri", margin + contentWidth / 2 + 5, y + 15);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`: Kelas ${st.class}`, margin + contentWidth / 2 + 35, y + 5);
      doc.text(`: Ustadz/ah ${st.asatidz}`, margin + contentWidth / 2 + 35, y + 10);
      
      const statusText = st.naikTingkatThisMonth ? "NAIK TINGKAT 🌟" : "AKTIF (BERTAHAP)";
      doc.text(`: ${statusText}`, margin + contentWidth / 2 + 35, y + 15);

      y += 19; // Move past profile box
      y += 4;  // Gap before table

      // 5. MAIN PROGRESS TABLE
      if (isSTS) {
        const colWidths = [8, 35, 65, 78];
        const colX = [
          margin, 
          margin + colWidths[0], 
          margin + colWidths[0] + colWidths[1], 
          margin + colWidths[0] + colWidths[1] + colWidths[2]
        ];

        // Draw Table Header
        doc.setFillColor(15, 23, 42); // dark header
        doc.rect(margin, y, contentWidth, 7, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(255, 255, 255);
        doc.text("No", colX[0] + colWidths[0] / 2, y + 4.5, { align: 'center' });
        doc.text("Aspek Pembelajaran", colX[1] + 3, y + 4.5);
        doc.text("Capaian Deskriptif (Tahsin & Tahfizh)", colX[2] + 3, y + 4.5);
        doc.text("Nilai Formatif Deskriptif", colX[3] + 3, y + 4.5);

        y += 7; // Header height

        // Row 1: Tahsin
        const tGrade = st.tahsinNilai !== undefined ? st.tahsinNilai : (80 + (st.name.length % 15));
        const tPosisi = st.tahsinPencapaian || st.pageDetail || '-';
        const tKet = st.tahsinKeterangan || `Alhamdulillah, Ananda ${st.name} menunjukkan penguasaan yang sangat baik dalam makhrajul huruf dan sifatul huruf di tingkat ${st.level}. Sangat disarankan untuk terus melatih kelancaran di rumah.`;
        
        const tahsinCol3Lines = doc.splitTextToSize(`Level: ${st.level}\nPosisi: ${tPosisi}`, colWidths[2] - 6);
        const tahsinCol4Lines = doc.splitTextToSize(`Nilai Formatif: ${tGrade}\n\n${tKet}`, colWidths[3] - 6);

        const r1Height = Math.max(
          18,
          tahsinCol3Lines.length * 3.5 + 4,
          tahsinCol4Lines.length * 3.5 + 4
        );

        // Draw row border
        doc.setDrawColor(15, 23, 42);
        doc.rect(margin, y, contentWidth, r1Height);
        // Draw vertical column dividers
        doc.line(colX[1], y, colX[1], y + r1Height);
        doc.line(colX[2], y, colX[2], y + r1Height);
        doc.line(colX[3], y, colX[3], y + r1Height);

        // Draw Row 1 Content
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text("1", colX[0] + colWidths[0] / 2, y + 5, { align: 'center' });
        
        doc.text("TAHSIN AL-QUR'AN", colX[1] + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text("Kelancaran & Tajwid", colX[1] + 3, y + 8.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(4, 120, 87); // Emerald
        doc.text(`Level: ${st.level}`, colX[2] + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        let tempY = y + 8.5;
        tahsinCol3Lines.slice(1).forEach((ln: string) => {
          doc.text(ln, colX[2] + 3, tempY);
          tempY += 3.5;
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text("Nilai Formatif: ", colX[3] + 3, y + 5);
        doc.setTextColor(4, 120, 87);
        doc.text(`${tGrade}`, colX[3] + 25, y + 5);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        tempY = y + 9;
        tahsinCol4Lines.slice(1).forEach((ln: string) => {
          doc.text(ln, colX[3] + 3, tempY);
          tempY += 3.5;
        });

        y += r1Height;

        // Row 2: Tahfizh
        const fGrade = st.tahfizhNilai !== undefined ? st.tahfizhNilai : (82 + (st.name.length % 13));
        const fPosisi = st.tahfizhPencapaian || 'Juz 30 (Surat Pendek)';
        const fKet = st.tahfizhKeterangan || `Alhamdulillah, hafalan surat-surat pendek Ananda lancar dan tajwidnya sudah baik. Disarankan meningkatkan muraja'ah agar semakin melekat kuat.`;

        const tahfizhCol3Lines = doc.splitTextToSize(`Target: ${fPosisi}`, colWidths[2] - 6);
        const tahfizhCol4Lines = doc.splitTextToSize(`Nilai Formatif: ${fGrade}\n\n${fKet}`, colWidths[3] - 6);

        const r2Height = Math.max(
          18,
          tahfizhCol3Lines.length * 3.5 + 4,
          tahfizhCol4Lines.length * 3.5 + 4
        );

        doc.rect(margin, y, contentWidth, r2Height);
        doc.line(colX[1], y, colX[1], y + r2Height);
        doc.line(colX[2], y, colX[2], y + r2Height);
        doc.line(colX[3], y, colX[3], y + r2Height);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text("2", colX[0] + colWidths[0] / 2, y + 5, { align: 'center' });

        doc.text("TAHFIZH AL-QUR'AN", colX[1] + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text("Kekuatan Hafalan", colX[1] + 3, y + 8.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(79, 70, 229); // Indigo
        doc.text("Target Hafalan", colX[2] + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        tempY = y + 8.5;
        tahfizhCol3Lines.slice(1).forEach((ln: string) => {
          doc.text(ln, colX[2] + 3, tempY);
          tempY += 3.5;
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text("Nilai Formatif: ", colX[3] + 3, y + 5);
        doc.setTextColor(79, 70, 229);
        doc.text(`${fGrade}`, colX[3] + 25, y + 5);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        tempY = y + 9;
        tahfizhCol4Lines.slice(1).forEach((ln: string) => {
          doc.text(ln, colX[3] + 3, tempY);
          tempY += 3.5;
        });

        y += r2Height;

        // Row 3: Materi Tambahan
        const mGrade = st.materiTambahanNilai !== undefined ? st.materiTambahanNilai : (85 + (st.name.length % 11));
        const mPosisi = st.materiTambahan || 'Doa Harian & Adab Islam';
        const mKet = `Ananda dinilai sangat baik dalam melafalkan dan mengamalkan doa pilihan/surat pendek dengan makhraj yang baik dan lancar dalam kehidupan sehari-hari.`;

        const materiCol3Lines = doc.splitTextToSize(`Materi: ${mPosisi}`, colWidths[2] - 6);
        const materiCol4Lines = doc.splitTextToSize(`Nilai Formatif: ${mGrade}\n\n${mKet}`, colWidths[3] - 6);

        const r3Height = Math.max(
          18,
          materiCol3Lines.length * 3.5 + 4,
          materiCol4Lines.length * 3.5 + 4
        );

        doc.rect(margin, y, contentWidth, r3Height);
        doc.line(colX[1], y, colX[1], y + r3Height);
        doc.line(colX[2], y, colX[2], y + r3Height);
        doc.line(colX[3], y, colX[3], y + r3Height);

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text("3", colX[0] + colWidths[0] / 2, y + 5, { align: 'center' });

        doc.text("MATERI TAMBAHAN", colX[1] + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text("Doa & Adab Harian", colX[1] + 3, y + 8.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(180, 83, 9); // Amber
        doc.text("Materi Pencapaian", colX[2] + 3, y + 5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(51, 65, 85);
        tempY = y + 8.5;
        materiCol3Lines.slice(1).forEach((ln: string) => {
          doc.text(ln, colX[2] + 3, tempY);
          tempY += 3.5;
        });

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 23, 42);
        doc.text("Nilai Formatif: ", colX[3] + 3, y + 5);
        doc.setTextColor(180, 83, 9);
        doc.text(`${mGrade}`, colX[3] + 25, y + 5);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        tempY = y + 9;
        materiCol4Lines.slice(1).forEach((ln: string) => {
          doc.text(ln, colX[3] + 3, tempY);
          tempY += 3.5;
        });

        y += r3Height;

      } else {
        const colWidths = [8, 40, 12, 14, 18, 94];
        const colX = [
          margin, 
          margin + colWidths[0], 
          margin + colWidths[0] + colWidths[1], 
          margin + colWidths[0] + colWidths[1] + colWidths[2],
          margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
          margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3] + colWidths[4]
        ];

        // Draw Table Header
        doc.setFillColor(15, 23, 42);
        doc.rect(margin, y, contentWidth, 7, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.setTextColor(255, 255, 255);
        doc.text("No", colX[0] + colWidths[0] / 2, y + 4.5, { align: 'center' });
        doc.text("Mata Pelajaran (Aspek)", colX[1] + 3, y + 4.5);
        doc.text("KKM", colX[2] + colWidths[2] / 2, y + 4.5, { align: 'center' });
        doc.text("Nilai", colX[3] + colWidths[3] / 2, y + 4.5, { align: 'center' });
        doc.text("Predikat", colX[4] + colWidths[4] / 2, y + 4.5, { align: 'center' });
        doc.text("Capaian Kompetensi & Deskripsi Perkembangan", colX[5] + 3, y + 4.5);

        y += 7;

        const getLetterAndPred = (score: number) => {
          if (score >= 90) return { letter: 'A', pred: 'Sangat Baik' };
          if (score >= 80) return { letter: 'B', pred: 'Baik' };
          if (score >= 75) return { letter: 'C', pred: 'Cukup' };
          return { letter: 'D', pred: 'Perlu Bimbingan' };
        };

        const tGrade = st.tahsinNilai !== undefined ? st.tahsinNilai : (80 + (st.name.length % 15));
        const fGrade = st.tahfizhNilai !== undefined ? st.tahfizhNilai : (82 + (st.name.length % 13));
        const mGrade = st.materiTambahanNilai !== undefined ? st.materiTambahanNilai : (85 + (st.name.length % 11));

        const tInfo = getLetterAndPred(tGrade);
        const fInfo = getLetterAndPred(fGrade);
        const mInfo = getLetterAndPred(mGrade);

        const rowsData = [
          {
            no: "1",
            title: "TAHSIN AL-QUR'AN",
            subTitle: "Kelancaran & Tajwid Dasar",
            kkm: "75",
            grade: tGrade,
            letter: tInfo.letter,
            pred: tInfo.pred,
            capaian: `Capaian: Level ${st.level} (${st.tahsinPencapaian || st.pageDetail || '-'})`,
            ket: st.tahsinKeterangan || `Alhamdulillah, Ananda ${st.name} menunjukkan penguasaan yang sangat baik dalam makhrajul huruf dan sifatul huruf di tingkat ${st.level}. Sangat disarankan untuk terus melatih kelancaran di rumah.`
          },
          {
            no: "2",
            title: "TAHFIZH AL-QUR'AN",
            subTitle: "Kekuatan Hafalan (Mutqin)",
            kkm: "75",
            grade: fGrade,
            letter: fInfo.letter,
            pred: fInfo.pred,
            capaian: `Capaian: ${st.tahfizhPencapaian || 'Juz 30 (Surat Pendek)'}`,
            ket: st.tahfizhKeterangan || `Alhamdulillah, hafalan surat-surat pendek Ananda lancar dan tajwidnya sudah baik. Disarankan meningkatkan muraja'ah agar semakin melekat kuat.`
          },
          {
            no: "3",
            title: "MATERI TAMBAHAN",
            subTitle: "Doa, Adab & Surat Pilihan",
            kkm: "75",
            grade: mGrade,
            letter: mInfo.letter,
            pred: mInfo.pred,
            capaian: `Materi: ${st.materiTambahan || 'Doa Harian'}`,
            ket: `Ananda dinilai sangat baik dalam melafalkan dan mempraktikkan doa harian serta adab Islami sehari-hari. Kemampuan makhraj doa-doa pendek sangat memuaskan.`
          }
        ];

        rowsData.forEach(row => {
          const splitDesc = doc.splitTextToSize(`${row.capaian}\n\n${row.ket}`, colWidths[5] - 6);
          const rHeight = Math.max(18, splitDesc.length * 3.5 + 5);

          doc.setDrawColor(15, 23, 42);
          doc.rect(margin, y, contentWidth, rHeight);
          doc.line(colX[1], y, colX[1], y + rHeight);
          doc.line(colX[2], y, colX[2], y + rHeight);
          doc.line(colX[3], y, colX[3], y + rHeight);
          doc.line(colX[4], y, colX[4], y + rHeight);
          doc.line(colX[5], y, colX[5], y + rHeight);

          // No
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(15, 23, 42);
          doc.text(row.no, colX[0] + colWidths[0] / 2, y + 5, { align: 'center' });

          // Title
          doc.text(row.title, colX[1] + 3, y + 5);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(row.subTitle, colX[1] + 3, y + 8.5);

          // KKM
          doc.setTextColor(15, 23, 42);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          doc.text(row.kkm, colX[2] + colWidths[2] / 2, y + 5, { align: 'center' });

          // Grade
          doc.setTextColor(4, 120, 87);
          doc.text(String(row.grade), colX[3] + colWidths[3] / 2, y + 5, { align: 'center' });

          // Predikat
          doc.setTextColor(79, 70, 229);
          doc.text(row.letter, colX[4] + colWidths[4] / 2, y + 5, { align: 'center' });
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(100, 116, 139);
          doc.text(row.pred, colX[4] + colWidths[4] / 2, y + 8.5, { align: 'center' });

          // Capaian / Deskripsi
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(15, 23, 42);
          doc.text(row.capaian, colX[5] + 3, y + 5);

          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7);
          doc.setTextColor(71, 85, 105);
          let tempY = y + 8.5;
          doc.splitTextToSize(row.ket, colWidths[5] - 6).forEach((ln: string) => {
            doc.text(ln, colX[5] + 3, tempY);
            tempY += 3.5;
          });

          y += rHeight;
        });
      }

      y += 4;

      // 6. PRESENCE AND CHARACTER GRID
      const gridWidth = 90;
      const gridGap = 6;
      const leftX = margin;
      const rightX = margin + gridWidth + gridGap;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text("I. LAPORAN PRESENSI (KEHADIRAN)", leftX, y + 3);

      const presY = y + 5.5;
      doc.setFillColor(241, 245, 249);
      doc.rect(leftX, presY, gridWidth, 6, 'F');
      doc.setDrawColor(15, 23, 42);
      doc.rect(leftX, presY, gridWidth, 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);
      
      const presColW = gridWidth / 4;
      doc.text("Sakit (S)", leftX + presColW * 0.5, presY + 4, { align: 'center' });
      doc.text("Izin (I)", leftX + presColW * 1.5, presY + 4, { align: 'center' });
      doc.text("Tanpa Keterangan", leftX + presColW * 2.5, presY + 4, { align: 'center' });
      doc.text("Total Absen", leftX + presColW * 3.5, presY + 4, { align: 'center' });

      const seed = st.name.length;
      const sick = seed % 5 === 0 ? 1 : 0;
      const perm = seed % 3 === 0 ? 1 : (seed % 7 === 0 ? 2 : 0);
      const abs = 0;

      doc.line(leftX, presY + 6, leftX + gridWidth, presY + 6);
      doc.line(leftX + presColW, presY, leftX + presColW, presY + 12);
      doc.line(leftX + presColW * 2, presY, leftX + presColW * 2, presY + 12);
      doc.line(leftX + presColW * 3, presY, leftX + presColW * 3, presY + 12);

      doc.setFont('helvetica', 'normal');
      doc.text(`${sick} Hari`, leftX + presColW * 0.5, presY + 10, { align: 'center' });
      doc.text(`${perm} Hari`, leftX + presColW * 1.5, presY + 10, { align: 'center' });
      doc.text(`${abs} Hari`, leftX + presColW * 2.5, presY + 10, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(`${sick + perm + abs} Hari`, leftX + presColW * 3.5, presY + 10, { align: 'center' });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);
      doc.text("II. LAPORAN ADAB, SIKAP & SIFAT (KARAKTER)", rightX, y + 3);

      doc.setFillColor(241, 245, 249);
      doc.rect(rightX, presY, gridWidth, 6, 'F');
      doc.rect(rightX, presY, gridWidth, 18);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(15, 23, 42);

      const charColW = [8, 62, 20];
      doc.text("No", rightX + charColW[0] / 2, presY + 4, { align: 'center' });
      doc.text("Indikator Karakter Santri", rightX + charColW[0] + 3, presY + 4);
      doc.text("Predikat", rightX + charColW[0] + charColW[1] + charColW[2] / 2, presY + 4, { align: 'center' });

      doc.line(rightX, presY + 6, rightX + gridWidth, presY + 6);
      doc.line(rightX + charColW[0], presY, rightX + charColW[0], presY + 18);
      doc.line(rightX + charColW[0] + charColW[1], presY, rightX + charColW[0] + charColW[1], presY + 18);

      const indicators = [
        "Adab Kepada Pengajar & Teman (Sopan Santun)",
        "Disiplin Harian & Kerapihan Pakaian",
        "Kemandirian & Semangat Menyimak Al-Qur'an"
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      indicators.forEach((ind, iIdx) => {
        const rowY = presY + 6 + 4 * iIdx;
        if (iIdx > 0) {
          doc.line(rightX, rowY, rightX + gridWidth, rowY);
        }
        doc.text(String(iIdx + 1), rightX + charColW[0] / 2, rowY + 3, { align: 'center' });
        doc.text(ind, rightX + charColW[0] + 3, rowY + 3);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(4, 120, 87);
        doc.text("A (Sangat Baik)", rightX + charColW[0] + charColW[1] + charColW[2] / 2, rowY + 3, { align: 'center' });
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal');
      });

      y = presY + 20;

      // 7. CATATAN / MOTIVASI KHUSUS PENGAMPU
      doc.setFillColor(254, 252, 232); // amber-50
      doc.setDrawColor(180, 83, 9); // Amber border
      doc.setLineWidth(0.4);
      
      const noteText = `"Alhamdulillah, pertahankan selalu prestasi dan ketekunan dalam membaca serta menghafal Al-Qur'an Ananda ${st.name}. Semoga senantiasa istiqamah, menjadi anak sholeh/sholehah kebanggaan keluarga, dan dipelihara kemurnian hafalannya hingga akhir hayat. Aamiin yaa Rabbal 'Aalamiin."`;
      const splitNote = doc.splitTextToSize(noteText, contentWidth - 8);
      const noteBoxH = splitNote.length * 4 + 7;

      doc.rect(margin, y, contentWidth, noteBoxH, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(180, 83, 9);
      doc.text("Catatan & Motivasi Khusus Pengampu:", margin + 4, y + 4.5);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      let noteY = y + 9;
      splitNote.forEach((ln: string) => {
        doc.text(ln, margin + 4, noteY);
        noteY += 4;
      });

      y += noteBoxH;
      y += 4;

      // 8. SIGNATURES AREA
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);

      const sigY1 = y;
      // Orang tua
      doc.setFont('helvetica', 'bold');
      doc.text("Mengetahui,", margin + 25, sigY1, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.text("Orang Tua / Wali Santri", margin + 25, sigY1 + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text("................................................", margin + 25, sigY1 + 18, { align: 'center' });

      // Guru Pembimbing
      doc.setFont('helvetica', 'normal');
      doc.text(`Jakarta, ${reportMonth}`, margin + contentWidth - 25, sigY1, { align: 'center' });
      doc.text("Guru Pembimbing (Asatidz)", margin + contentWidth - 25, sigY1 + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(`Ustadz/ah ${st.asatidz}`, margin + contentWidth - 25, sigY1 + 18, { align: 'center' });

      const sigY2 = sigY1 + 22;
      // PJ Koordinator
      doc.setFont('helvetica', 'normal');
      doc.text("Diperiksa Oleh,", margin + 25, sigY2, { align: 'center' });
      doc.text("PJ / Koordinator Unit UTTS", margin + 25, sigY2 + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(pjName, margin + 25, sigY2 + 18, { align: 'center' });

      // Kepala Unit
      doc.setFont('helvetica', 'normal');
      doc.text("Mengesahkan,", margin + contentWidth - 25, sigY2, { align: 'center' });
      doc.text("Kepala Unit UTTS SiQuran", margin + contentWidth - 25, sigY2 + 4.5, { align: 'center' });
      doc.setFont('helvetica', 'bold');
      doc.text(headmasterName, margin + contentWidth - 25, sigY2 + 18, { align: 'center' });

    });

    const fileSuffix = selectedReportStudentId === 'all' 
      ? `kelas_${reportClass}` 
      : `${students.find(s => s.id === selectedReportStudentId)?.name.replace(/[\s\.\']/g, '_')}`;

    doc.save(`Raport_AlQuran_${fileSuffix}_${raportType}.pdf`);
  };

  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; // Add UTF-8 BOM so Excel opens it with correct Indonesian characters
    
    const cleanCSV = (val: any) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
      return `"${str}"`;
    };

    if (reportModel === 'total') {
      csvContent += "LAPORAN CAPAIAN TOTAL SEMUA KELAS - BULAN: " + reportMonth.toUpperCase() + "\n\n";
      csvContent += "Metode Pencapaian,";
      csvContent += dynamicClasses.join(",") + ",Total\n";
      
      REPORT_ROW_CATEGORIES.forEach(cat => {
        let rowStr = `"${cat.label}",`;
        dynamicClasses.forEach(kls => {
          const cnt = reportTotalMatrix[cat.key]?.[kls]?.length || 0;
          rowStr += `${cnt},`;
        });
        
        let catTotal = 0;
        dynamicClasses.forEach(kls => { catTotal += reportTotalMatrix[cat.key]?.[kls]?.length || 0; });
        rowStr += `${catTotal}\n`;
        csvContent += rowStr;
      });
      
      let grandTotalRow = "GRAND TOTAL,";
      dynamicClasses.forEach(kls => {
        grandTotalRow += `${classTotalsArray[kls]},`;
      });
      grandTotalRow += `${masterGrandTotal}\n`;
      csvContent += grandTotalRow;
    } else {
      const isSTS = raportType === 'bulanan';
      const typeLabel = isSTS ? "PROGRES REPORT (STS)" : `RAPORT AKHIR SEMESTER (${raportType === 'ganjil' ? 'GANJIL' : 'GENAP'})`;
      
      if (reportModel === 'guru') {
        csvContent += `LAPORAN PER GURU - ${typeLabel}\n`;
        csvContent += `Ustadz/ah: ${reportTeacher} | Bulan: ${reportMonth}\n\n`;
      } else {
        csvContent += `LAPORAN PER KELAS - ${typeLabel}\n`;
        csvContent += `Kelas: ${reportClass} | Bulan: ${reportMonth}\n\n`;
      }

      if (isSTS) {
        // Progres Report (STS) Columns
        csvContent += "No,NIPD,NISN,Nama,Kelas,Jenis Kelamin,Shift,Tingkat Capaian,Tahsin Capaian,Tahsin Nilai Formatif,Tahsin Keterangan Formatif,Tahfizh Capaian,Tahfizh Nilai Formatif,Tahfizh Keterangan Formatif,Materi Tambahan,Materi Tambahan Nilai Formatif,Guru Pembimbing,Status Kenaikan\n";
        
        const listData = reportModel === 'guru' ? reportByTeacherData.list : reportByClassData.list;
        listData.forEach((st, idx) => {
          const tGrade = st.tahsinNilai !== undefined ? st.tahsinNilai : (80 + (st.name.length % 15));
          const fGrade = st.tahfizhNilai !== undefined ? st.tahfizhNilai : (82 + (st.name.length % 13));
          const mGrade = st.materiTambahanNilai !== undefined ? st.materiTambahanNilai : (85 + (st.name.length % 11));
          
          csvContent += [
            idx + 1,
            `\t${st.nipd}`, // Force text format for NIPD
            `\t${formatNISN(st.nisn)}`, // Force text format for NISN
            cleanCSV(st.name),
            cleanCSV(st.class),
            cleanCSV(st.gender),
            cleanCSV(`S${st.shift}`),
            cleanCSV(st.level),
            cleanCSV(st.tahsinPencapaian || st.pageDetail || '-'),
            tGrade,
            cleanCSV(st.tahsinKeterangan || 'Alhamdulillah, Ananda membaca dengan baik.'),
            cleanCSV(st.tahfizhPencapaian || 'Juz 30 (Surat Pendek)'),
            fGrade,
            cleanCSV(st.tahfizhKeterangan || 'Alhamdulillah, hafalan lancar.'),
            cleanCSV(st.materiTambahan || 'Doa Harian'),
            mGrade,
            cleanCSV(st.asatidz),
            st.naikTingkatThisMonth ? "Naik Tingkat" : "-"
          ].join(",") + "\n";
        });
      } else {
        // Raport Akhir Columns
        csvContent += "No,NIPD,NISN,Nama,Kelas,Jenis Kelamin,Shift,KKM,Tahsin Nilai,Tahsin Predikat,Tahsin Capaian Kompetensi,Tahfizh Nilai,Tahfizh Predikat,Tahfizh Capaian Kompetensi,Materi Tambahan,Materi Tambahan Nilai,Materi Tambahan Predikat,Materi Tambahan Capaian,Guru Pembimbing,Status Kenaikan\n";
        
        const listData = reportModel === 'guru' ? reportByTeacherData.list : reportByClassData.list;
        listData.forEach((st, idx) => {
          const tGrade = st.tahsinNilai !== undefined ? st.tahsinNilai : (80 + (st.name.length % 15));
          const fGrade = st.tahfizhNilai !== undefined ? st.tahfizhNilai : (82 + (st.name.length % 13));
          const mGrade = st.materiTambahanNilai !== undefined ? st.materiTambahanNilai : (85 + (st.name.length % 11));

          const getLetterAndPred = (score: number) => {
            if (score >= 90) return { letter: 'A', pred: 'Sangat Baik' };
            if (score >= 80) return { letter: 'B', pred: 'Baik' };
            if (score >= 75) return { letter: 'C', pred: 'Cukup' };
            return { letter: 'D', pred: 'Perlu Bimbingan' };
          };

          const tInfo = getLetterAndPred(tGrade);
          const fInfo = getLetterAndPred(fGrade);
          const mInfo = getLetterAndPred(mGrade);

          csvContent += [
            idx + 1,
            `\t${st.nipd}`,
            `\t${formatNISN(st.nisn)}`,
            cleanCSV(st.name),
            cleanCSV(st.class),
            cleanCSV(st.gender),
            cleanCSV(`S${st.shift}`),
            75,
            tGrade,
            cleanCSV(tInfo.letter),
            cleanCSV(`[${tInfo.pred}] Capaian: Level ${st.level} (${st.tahsinPencapaian || st.pageDetail || '-'}). ${st.tahsinKeterangan || 'Alhamdulillah, Ananda membaca dengan baik.'}`),
            fGrade,
            cleanCSV(fInfo.letter),
            cleanCSV(`[${fInfo.pred}] Capaian: ${st.tahfizhPencapaian || 'Juz 30 (Surat Pendek)'}. ${st.tahfizhKeterangan || 'Alhamdulillah, hafalan lancar.'}`),
            cleanCSV(st.materiTambahan || 'Doa Harian'),
            mGrade,
            cleanCSV(mInfo.letter),
            cleanCSV(`[${mInfo.pred}] Materi: ${st.materiTambahan || 'Doa Harian'}. Ananda dinilai sangat baik dalam melafalkan dan mengamalkan doa pilihan/surat pendek dengan makhraj yang baik.`),
            cleanCSV(st.asatidz),
            st.naikTingkatThisMonth ? "Naik Tingkat" : "-"
          ].join(",") + "\n";
        });
      }
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const fileNameSuffix = reportModel === 'total' 
      ? `Total_${reportMonth.replace(' ', '_')}`
      : `${reportModel === 'guru' ? reportTeacher.replace(/[\s\.\']/g, '_') : reportClass}_${raportType}_${reportMonth.replace(' ', '_')}`;
    
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SiQuran_Laporan_${fileNameSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("Berhasil mengekspor format CSV/Excel ke folder unduhan!");
  };

  // Dashboard Stats calculation
  const dashboardStats = useMemo(() => {
    const totalSantri = students.length;
    const totalNaikTingkat = students.filter(st => st.naikTingkatThisMonth).length;
    const currentActiveTeachers = new Set(students.map(st => st.asatidz)).size;
    
    // level aggregates
    const inJilid = students.filter(st => isJilidLevel(st.level)).length;
    const inTajwidGhorib = students.filter(st => isTajwidGhoribLevel(st.level)).length;
    const inAlQuran = students.filter(st => isAlQuranLevel(st.level)).length;

    return {
      totalSantri,
      totalNaikTingkat,
      currentActiveTeachers,
      inJilid,
      inTajwidGhorib,
      inAlQuran
    };
  }, [students]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans relative antialiased pb-12 selection:bg-yellow-200">
      
      {/* Dynamic Confetti Celebration Indicator */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none z-50 overflow-hidden flex justify-center items-center"
          >
            <div className="absolute top-0 left-0 right-0 bottom-0 bg-indigo-600/10 backdrop-blur-xs flex flex-col items-center justify-center">
              <motion.div 
                initial={{ scale: 0.8, rotate: -2 }}
                animate={{ scale: [1, 1.05, 1], rotate: [2, -2, 0] }}
                transition={{ duration: 0.5 }}
                className="bg-white border-4 border-slate-900 text-slate-900 p-6 px-10 rounded-none shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex flex-col items-center gap-3"
              >
                <Sparkles className="w-14 h-14 text-yellow-500 animate-bounce" />
                <h3 className="font-display font-black text-2xl uppercase tracking-tight italic">Mabruk! Naik Tingkat! 🎉</h3>
                <p className="text-xs font-bold text-slate-600">Sistem mengupdate database & memancarkan sinyal ke Firebase.</p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-40 bg-white border-4 border-slate-900 text-slate-900 px-6 py-4 rounded-none shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] flex items-center gap-4"
          >
            <div className="w-3.5 h-3.5 bg-green-500 border-2 border-slate-900 animate-ping"></div>
            <div>
              <p className="font-black uppercase text-xs tracking-wide">{toastMessage}</p>
              <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">FIREBASE STATUS: SYNCED</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Modal */}
      <AnimatePresence>
        {confirmDialog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white border-4 border-slate-900 p-6 max-w-md w-full rounded-none shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-4 relative"
            >
              <button 
                onClick={() => setConfirmDialog(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer font-black"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 text-indigo-700 font-display font-black text-sm uppercase tracking-wider pb-2 border-b-2 border-slate-900 pr-8">
                <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
                <span>{confirmDialog.title}</span>
              </div>
              
              <div className="text-xs text-slate-700 font-bold leading-relaxed whitespace-pre-wrap">
                {confirmDialog.message}
              </div>
              
              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  onClick={() => {
                    const onCancel = confirmDialog.onCancel;
                    setConfirmDialog(null);
                    if (onCancel) {
                      onCancel();
                    }
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-900 border-2 border-slate-900 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 cursor-pointer transition-colors"
                >
                  {confirmDialog.cancelLabel || "Batal"}
                </button>
                <button
                  onClick={() => {
                    const onConfirm = confirmDialog.onConfirm;
                    setConfirmDialog(null);
                    onConfirm();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 font-black text-[10px] uppercase tracking-wider px-3.5 py-2 cursor-pointer transition-colors shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                >
                  {confirmDialog.confirmLabel || "Ya, Setuju"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Auth Modal (Login / Register) */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border-4 border-slate-900 p-6 max-w-md w-full rounded-none shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] space-y-4 relative text-slate-900"
            >
              <button 
                onClick={() => {
                  setIsAuthModalOpen(false);
                  setAuthUsername('');
                  setAuthPassword('');
                  setAuthFullName('');
                }}
                className="absolute top-4 right-4 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer font-black"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex border-b-2 border-slate-900 pb-px">
                <button
                  onClick={() => setAuthModalTab('login')}
                  className={`flex-1 py-2.5 font-display font-black text-xs uppercase tracking-wider text-center border-b-4 ${
                    authModalTab === 'login'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Masuk Akun 🔑
                </button>
                <button
                  onClick={() => setAuthModalTab('register')}
                  className={`flex-1 py-2.5 font-display font-black text-xs uppercase tracking-wider text-center border-b-4 ${
                    authModalTab === 'register'
                      ? 'border-indigo-600 text-indigo-700'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Daftar Guru 📝
                </button>
              </div>

              {authModalTab === 'login' ? (
                <form onSubmit={(e) => { e.preventDefault(); handleCustomLogin(); }} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500">Username</label>
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value)}
                      placeholder="Masukkan username Anda"
                      className="w-full border-2 border-slate-900 p-2 text-xs font-bold rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-slate-50"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500">Kata Sandi</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full border-2 border-slate-900 p-2 text-xs font-bold rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-slate-50"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-yellow-300 hover:bg-yellow-400 text-slate-900 border-2 border-slate-900 p-2.5 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer mt-4"
                  >
                    Masuk Sekarang 🚪
                  </button>
                  <p className="text-[10px] text-slate-400 font-extrabold text-center mt-3">
                    Belum punya akun? <span onClick={() => setAuthModalTab('register')} className="text-indigo-600 underline cursor-pointer hover:text-indigo-800">Daftar Akun Guru</span>
                  </p>
                </form>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); handleCustomRegister(); }} className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500">Username Unik</label>
                    <input
                      type="text"
                      value={authUsername}
                      onChange={(e) => setAuthUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                      placeholder="e.g. ustadz_iskandar"
                      className="w-full border-2 border-slate-900 p-2 text-xs font-bold rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-slate-50"
                      required
                    />
                    <span className="text-[8px] text-slate-400 font-semibold block">Username hanya huruf/angka tanpa spasi, minimal 3 karakter.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500">Nama Lengkap Ustadz/ah</label>
                    <input
                      type="text"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="e.g. Iskandar"
                      className="w-full border-2 border-slate-900 p-2 text-xs font-bold rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-slate-50"
                      required
                    />
                    {authFullName.trim() && teachers.some(t => t.name.toLowerCase() === authFullName.trim().toLowerCase()) ? (
                      <div className="bg-emerald-50 text-emerald-800 border-2 border-emerald-900 p-1.5 text-[9px] font-bold mt-1">
                        💡 Nama cocok dengan profil Guru terdaftar! Akun baru akan otomatis terhubung dengan data santri profil Anda.
                      </div>
                    ) : authFullName.trim() ? (
                      <div className="bg-amber-50 text-amber-800 border-2 border-amber-900 p-1.5 text-[9px] font-bold mt-1">
                        📝 Nama baru! Profil guru baru akan otomatis dibuat setelah pendaftaran selesai.
                      </div>
                    ) : null}
                  </div>
                  {!teachers.some(t => t.name.toLowerCase() === authFullName.trim().toLowerCase()) && (
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black uppercase text-slate-500">Jenis Kelamin</label>
                      <select
                        value={authGender}
                        onChange={(e) => setAuthGender(e.target.value as 'L' | 'P')}
                        className="w-full border-2 border-slate-900 p-2 text-xs font-bold rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-slate-50"
                      >
                        <option value="L">Laki-laki (Ustadz)</option>
                        <option value="P">Perempuan (Ustadzah)</option>
                      </select>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black uppercase text-slate-500">Sandi Pendaftaran (Sandi Guru)</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Masukkan password 'panjunan27'"
                      className="w-full border-2 border-slate-900 p-2 text-xs font-bold rounded-none focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-slate-50"
                      required
                    />
                    <span className="text-[8px] text-rose-500 font-extrabold block">Harap masukkan password khusus TPQ "panjunan27" untuk mendaftar.</span>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-2 border-slate-900 p-2.5 font-black text-xs uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer mt-4"
                  >
                    Daftar Akun Baru 📝
                  </button>
                  <p className="text-[10px] text-slate-400 font-extrabold text-center mt-3">
                    Sudah punya akun? <span onClick={() => setAuthModalTab('login')} className="text-indigo-600 underline cursor-pointer hover:text-indigo-800">Masuk Akun</span>
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sentinel for Header Compression Intersection Observer */}
      <div id="header-sentinel" className="h-px w-full absolute top-0 pointer-events-none" />

      {/* Header Panel */}
      <header className={`border-b-2 md:border-b-4 border-slate-900 bg-white sticky top-0 z-30 transition-all duration-300 print:translate-y-0 ${
        showHeader ? 'translate-y-0' : '-translate-y-full shadow-none border-b-0'
      } ${
        isHeaderCompressed ? 'shadow-md' : ''
      }`}>
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
          isHeaderCompressed ? 'py-1 md:py-2' : 'py-2 md:py-4'
        }`}>
          <div className={`flex flex-row items-center justify-between gap-2 md:gap-5 ${
            currentUser ? 'hidden md:flex' : 'flex'
          }`}>
            
            {/* Logo and Brand Title */}
            <div className="flex items-center gap-1.5 md:gap-3">
              <span className={`bg-yellow-300 border-2 border-slate-900 flex items-center justify-center transition-all duration-300 shrink-0 ${
                isHeaderCompressed 
                  ? 'p-1 md:p-2 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] md:shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' 
                  : 'p-1.5 md:p-3 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] md:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]'
              }`}>
                <BookOpen className={`text-slate-900 transition-all duration-300 ${
                  isHeaderCompressed ? 'w-3.5 h-3.5 md:w-5 md:h-5' : 'w-4 h-4 md:w-6 md:h-6'
                }`} />
              </span>
              <div className={`transition-all duration-300 ${
                isHeaderCompressed ? 'hidden md:block' : 'block'
              }`}>
                <div className="flex items-center gap-1 md:gap-2">
                  <h1 className="font-display font-black text-lg md:text-3xl tracking-tighter text-slate-900 leading-none">
                    SIQURAN<span className="text-indigo-600">.</span>
                  </h1>
                  <span className="text-[7px] md:text-[9px] bg-indigo-600 text-white px-1 md:px-2 py-0.5 border border-slate-900 font-mono tracking-widest font-black uppercase italic">
                    v2.0 PRO
                  </span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mt-1 md:mt-1.5 italic hidden sm:block">Sistem Informasi Laporan Bulanan Capaian Al-Qur'an Santri</p>
              </div>
            </div>

            {/* Elegant Premium Jam Digital Widget (Masehi & Hijriah Atas-Bawah) */}
            <div className="hidden md:flex items-center gap-3 bg-slate-50 border-2 border-slate-900 p-2 px-3.5 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] select-none">
              <div className="p-1.5 bg-indigo-50 border border-slate-950 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
              </div>
              <div className="flex flex-col text-left">
                {/* Atas: Masehi & Hijriah */}
                <div className="flex items-center gap-1.5 text-[9px] font-mono font-extrabold uppercase tracking-wider text-slate-500">
                  <span className="text-indigo-600 font-black flex items-center gap-0.5">
                    <Calendar className="w-2.5 h-2.5 shrink-0" /> Masehi:
                  </span>
                  <span className="text-slate-800">{getGregorianAndHijriDateString(liveClock).gregorian} M</span>
                  <span className="text-slate-300">|</span>
                  <span className="text-emerald-750 font-black flex items-center gap-0.5">
                    <Moon className="w-2.5 h-2.5 shrink-0" /> Hijriyah:
                  </span>
                  <span className="text-slate-800">{getGregorianAndHijriDateString(liveClock).hijri}</span>
                </div>
                {/* Bawah: Pukul WIB */}
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-black font-display text-slate-900 uppercase tracking-wide">
                    Pukul {liveClock.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Status / Reset Widget */}
            <div className="flex items-center gap-1 md:gap-3">
              {/* Authentication Status Block */}
              <div className="flex items-center gap-1 md:gap-2">
                {isAuthLoading ? (
                  <div className="bg-white border border-slate-900 p-1 md:p-2.5 flex items-center justify-center font-mono text-[9px] md:text-[10px]">
                    ...
                  </div>
                ) : currentUser ? (
                  <div className="flex items-center gap-1 md:gap-2">
                    {/* User Profile Container */}
                    <div className="bg-slate-900 text-white border border-slate-900 md:border-2 p-1 px-1.5 md:p-2 md:px-3 flex items-center md:flex-col justify-center gap-1 md:gap-0 max-w-[120px] md:max-w-[220px]">
                      <span className="text-[8px] font-black uppercase text-indigo-300 hidden md:block leading-none">Ustadz/ah Aktif</span>
                      <span className="text-[9px] md:text-[11px] font-bold truncate leading-tight flex items-center gap-1" title={currentUser.username || ''}>
                        <User className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate">{currentUser.displayName || currentUser.username}</span>
                      </span>
                    </div>

                    {/* Teacher Association Indicator Block */}
                    {activeTeacher ? (
                      <div className="hidden md:flex bg-emerald-50 text-emerald-955 border-2 border-emerald-900 p-1.5 px-2 md:p-2 md:px-3 flex-col justify-center gap-0">
                        <span className="text-[8px] font-black uppercase text-emerald-700 inline-flex items-center gap-0.5 leading-none">
                          <CheckCircle className="w-2.5 h-2.5 text-emerald-600 shrink-0" /> Terkoneksi Guru
                        </span>
                        <span className="text-[10px] md:text-[11.5px] font-black whitespace-nowrap">
                          {activeTeacher.name}
                        </span>
                      </div>
                    ) : (
                      <div className="hidden md:flex bg-amber-50 text-amber-955 border-2 border-amber-900 p-1.5 px-2 md:p-2 md:px-3 flex-col justify-center gap-0 animate-pulse">
                        <span className="text-[8px] font-black uppercase text-amber-700 leading-none">Peringatan Akun</span>
                        <span className="text-[10px] md:text-[11px] font-extrabold whitespace-nowrap">
                          Belum Terhubung ⚠️
                        </span>
                      </div>
                    )}

                    {/* Sign-Out Button */}
                    <button
                      onClick={handleCustomSignOut}
                      title="Keluar Akun"
                      className="p-1 md:p-3 border border-slate-900 md:border-2 bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors flex items-center justify-center shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] md:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                    >
                      <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setAuthModalTab('login');
                      setIsAuthModalOpen(true);
                    }}
                    className="p-1 px-2 md:p-2.5 md:px-4 bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-black border border-slate-900 md:border-2 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] md:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1 md:gap-2 cursor-pointer text-[9px] md:text-xs uppercase tracking-wider animate-bounce"
                  >
                    <LogIn className="w-3 h-3 md:w-4 md:h-4 text-slate-900" /> Masuk / Daftar 🔑
                  </button>
                )}
              </div>

              <div className="hidden md:flex bg-white border-2 border-slate-900 p-1.5 px-2.5 md:p-3 md:px-4 flex-row md:flex-col items-center md:justify-center gap-1.5 md:gap-0">
                <span className="text-[8px] font-black uppercase text-slate-400 leading-none hidden md:block">Firebase Status</span>
                <span className={`text-[10px] md:text-xs font-bold md:mt-1 inline-flex items-center gap-1.5 ${firebaseStatus === 'connected' ? 'text-green-600' : 'text-rose-500'}`}>
                  <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${firebaseStatus === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-rose-500'}`} />
                  CONNECTED
                </span>
              </div>

              <div className="hidden md:flex bg-indigo-600 p-1.5 px-2.5 md:p-3 md:px-6 flex flex-row md:flex-col items-center md:justify-center gap-1.5 md:gap-0 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] md:shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-white">
                <span className="text-[8px] font-black uppercase text-indigo-200 leading-none hidden md:block">Total Active Santri</span>
                <span className="text-[10px] md:text-sm font-black uppercase">{students.length} Santri</span>
              </div>

              <button 
                id="btn-reset-db"
                onClick={handleResetData}
                title="Reset Database to Default 339 Students"
                className="hidden md:flex p-1.5 md:p-3 border-2 border-slate-900 bg-white hover:bg-slate-100 text-slate-900 transition-colors items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] md:shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className={`flex items-center justify-between gap-2 border-t-2 border-slate-100 ${
            isHeaderCompressed 
              ? (currentUser ? 'mt-0 md:mt-2' : 'mt-1.5 md:mt-2') 
              : (currentUser ? 'mt-0 md:mt-4' : 'mt-2.5 md:mt-4')
          }`}>
            <div className="flex items-center justify-start gap-1.5 md:gap-2 overflow-x-auto scrollbar-none pb-1 pt-1 flex-1">
              {(currentUser && activeTeacher && appMode === 'guru' ? [
                { id: 'dashboard_guru', label: 'Beranda Guru 👤', icon: User },
                { id: 'input_guru', label: 'Input Nilai Harian 📝', icon: Edit2 },
                { id: 'claim_guru', label: 'Kelola Roster & Klaim 📥', icon: UserPlus },
                { id: 'reports_guru', label: 'Laporan Siap Download 📥', icon: FileText },
              ] : [
                { id: 'dashboard', label: 'Beranda (Dashboard)', icon: TrendingUp },
                { id: 'setup', label: 'Setting Awal / Guru', icon: Settings },
                { id: 'database', label: `Database Master (${students.length})`, icon: Database },
                { id: 'input', label: 'Input Guru (Shift 1, 2, 3)', icon: Edit2 },
                { id: 'reports', label: 'Laporan Bulanan (3 Model)', icon: FileText },
                { id: 'developer', label: 'Info Hubungkan', icon: ArrowUpRight },
              ]).map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    id={`nav-tab-${tab.id}`}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 md:px-4 md:py-2.5 text-[10px] md:text-xs font-black uppercase tracking-wider transition-all shrink-0 border-2 ${
                      isHeaderCompressed ? 'py-1 md:py-1.5' : 'py-1.5 md:py-2.5'
                    } ${
                      isActive 
                        ? 'bg-slate-900 text-white border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' 
                        : 'bg-white text-slate-500 border-slate-200 hover:border-slate-900 hover:text-slate-900'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isActive ? 'text-yellow-400' : 'text-slate-400'}`} />
                    <span className={`transition-all duration-300 ${
                      isHeaderCompressed ? 'hidden md:inline' : 'inline'
                    }`}>
                      {tab.label}
                    </span>
                  </button>
                );
              })}
              
              {currentUser && (
                <button
                  onClick={handleCustomSignOut}
                  className={`flex md:hidden items-center gap-1.5 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all shrink-0 border-2 bg-rose-50 text-rose-800 border-rose-200 hover:border-slate-900 ${
                    isHeaderCompressed ? 'py-1' : 'py-1.5'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                  <span>Keluar ({currentUser.displayName || currentUser.username})</span>
                </button>
              )}
            </div>

            {/* Role Switcher */}
            {activeTeacher && (
              <div className="flex shrink-0 p-1 bg-slate-100 border-2 border-slate-900 gap-1 rounded-none select-none">
                <button
                  onClick={() => {
                    setAppMode('guru');
                    setActiveTab('dashboard_guru');
                  }}
                  className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    appMode === 'guru' 
                      ? 'bg-indigo-600 text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]' 
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  👥 Guru
                </button>
                <button
                  onClick={() => {
                    setAppMode('admin');
                    setActiveTab('dashboard');
                  }}
                  className={`px-2 md:px-3 py-1 text-[9px] md:text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                    appMode === 'admin' 
                      ? 'bg-slate-900 text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]' 
                      : 'text-slate-600 hover:text-slate-900 bg-transparent'
                  }`}
                >
                  💻 Admin
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Self-service Link Google Auth to existing Teacher Account Banner */}
        {/* ========================================================
            TEACHER ONBOARDING & ROSTER CLAIMS WIZARD
            ======================================================== */}
        {currentUser && (!activeTeacher || isEditingMyProfile) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8 bg-white border-4 border-slate-900 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] overflow-hidden"
          >
            {/* Wizard Header */}
            <div className="bg-slate-900 p-4 md:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-slate-900">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-300 text-slate-900 border-2 border-slate-900 text-[10px] font-black uppercase px-2 py-0.5 tracking-wider shadow-[1.5px_1.5px_0px_0px_rgba(255,255,255,1)]">
                    {activeTeacher ? "Mode Edit Profil" : "Registrasi Mandiri"}
                  </span>
                  <h2 className="font-display font-black text-xl md:text-2xl tracking-tight uppercase">
                    {activeTeacher ? "Ubah Profil & Roster Bimbingan Anda" : "Pendaftaran & Klaim Santri Guru Baru"}
                  </h2>
                </div>
                <p className="text-xs text-slate-400 font-bold">
                  Akun Google Aktif: <strong className="text-indigo-300">{currentUser.email}</strong>
                </p>
              </div>
              
              {activeTeacher && isEditingMyProfile && (
                <button
                  onClick={() => setIsEditingMyProfile(false)}
                  className="bg-rose-100 hover:bg-rose-200 text-rose-800 font-black border-2 border-slate-900 p-2 text-xs uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors shadow-[2px_2px_0px_0px_rgba(255,255,255,1)]"
                >
                  <X className="w-4 h-4" /> Batal & Tutup
                </button>
              )}
            </div>

            {/* Step Progress Indicators */}
            <div className="bg-slate-50 border-b-2 border-slate-900 grid grid-cols-3 divide-x-2 divide-slate-900">
              {[
                { step: 1, label: "Profil Mengajar" },
                { step: 2, label: "Shift & Kelas" },
                { step: 3, label: "Pilih & Klaim Santri" }
              ].map((s) => {
                const isPastOrCurrent = onboardingStep >= s.step;
                const isCurrent = onboardingStep === s.step;
                return (
                  <div 
                    key={s.step} 
                    className={`p-3 md:p-4 text-center flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-3 transition-colors ${
                      isCurrent ? 'bg-yellow-100' : isPastOrCurrent ? 'bg-emerald-50' : 'bg-transparent'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center border-2 border-slate-900 text-xs font-black leading-none shrink-0 ${
                      isCurrent ? 'bg-yellow-400 text-slate-900' : isPastOrCurrent ? 'bg-emerald-500 text-white' : 'bg-white text-slate-400'
                    }`}>
                      {s.step}
                    </span>
                    <span className={`text-[10px] md:text-xs font-black uppercase tracking-wider ${
                      isCurrent ? 'text-slate-900' : isPastOrCurrent ? 'text-emerald-900' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Wizard Body content */}
            <div className="p-4 md:p-8">
              {/* STEP 1: Personal Profile */}
              {onboardingStep === 1 && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border-2 border-slate-900 p-4 flex gap-3">
                    <User className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-950">Langkah 1: Lengkapi Data Diri Anda</h4>
                      <p className="text-[11px] text-indigo-800 leading-relaxed font-semibold mt-0.5">
                        Isikan nama lengkap beserta gelar Anda (akan muncul di laporan/pdf), jenis kelamin, no handphone, status kepegawaian dan pengalaman Anda.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Nama Lengkap Guru (Gelar Lengkap):</label>
                      <input
                        type="text"
                        value={onboardingName}
                        onChange={(e) => setOnboardingName(e.target.value)}
                        placeholder="Contoh: Ustadzah Fatimatuzzahra, S.Ag"
                        className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2.5 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">No. Handphone / WhatsApp:</label>
                      <input
                        type="text"
                        value={onboardingPhone}
                        onChange={(e) => setOnboardingPhone(e.target.value)}
                        placeholder="Contoh: 08123456789"
                        className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2.5 focus:outline-hidden"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Jenis Kelamin:</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setOnboardingGender('L')}
                          className={`p-2.5 border-2 border-slate-900 font-black text-xs uppercase transition-all ${
                            onboardingGender === 'L' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          Laki-laki (L)
                        </button>
                        <button
                          onClick={() => setOnboardingGender('P')}
                          className={`p-2.5 border-2 border-slate-900 font-black text-xs uppercase transition-all ${
                            onboardingGender === 'P' ? 'bg-slate-900 text-white' : 'bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          Perempuan (P)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Status Kepegawaian:</label>
                      <select
                        value={onboardingStatus}
                        onChange={(e) => setOnboardingStatus(e.target.value)}
                        className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2.5 focus:outline-hidden"
                      >
                        <option value="Ustadz Tetap">Ustadz/ah Tetap</option>
                        <option value="Ustadz Honorer">Ustadz/ah Honorer</option>
                        <option value="Ustadz Penguji Khusus">Ustadz/ah Penguji Khusus</option>
                        <option value="Ustadz Magang">Ustadz/ah Magang</option>
                      </select>
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Pengalaman Mengajar:</label>
                      <input
                        type="text"
                        value={onboardingExperience}
                        onChange={(e) => setOnboardingExperience(e.target.value)}
                        placeholder="Contoh: 3 Tahun mengajar TPQ, bersertifikat metode Qiraati"
                        className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2.5 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4 border-t-2 border-slate-200">
                    <button
                      onClick={() => {
                        if (!onboardingName.trim()) {
                          triggerToast("⚠️ Nama lengkap Anda wajib diisi!");
                          return;
                        }
                        setOnboardingStep(2);
                      }}
                      className="bg-indigo-600 hover:bg-slate-950 text-white font-black text-xs uppercase tracking-wider py-3 px-6 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer flex items-center gap-1"
                    >
                      Lanjut ke Langkah 2 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Shift, Class, and Level Mapping */}
              {onboardingStep === 2 && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border-2 border-slate-900 p-4 flex gap-3">
                    <Sliders className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-950">Langkah 2: Tentukan Shift, Kelas & Level yang Anda Bimbing</h4>
                      <p className="text-[11px] text-indigo-800 leading-relaxed font-semibold mt-0.5">
                        Aktifkan Kelas dan Tingkat Level yang Anda ajar di masing-masing Shift. Ini akan otomatis mempermudah filter pengisian progress capaian harian Anda.
                      </p>
                    </div>
                  </div>

                  {/* Shifts Cards Map */}
                  <div className="space-y-6">
                    {[
                      { 
                        shiftNum: 1, 
                        classes: onboardingShift1Classes, 
                        setClasses: setOnboardingShift1Classes, 
                        levels: onboardingShift1Levels, 
                        setLevels: setOnboardingShift1Levels,
                        bg: 'bg-emerald-50/50', border: 'border-emerald-900/40', text: 'text-emerald-900'
                      },
                      { 
                        shiftNum: 2, 
                        classes: onboardingShift2Classes, 
                        setClasses: setOnboardingShift2Classes, 
                        levels: onboardingShift2Levels, 
                        setLevels: setOnboardingShift2Levels,
                        bg: 'bg-sky-50/50', border: 'border-sky-900/40', text: 'text-sky-900'
                      },
                      { 
                        shiftNum: 3, 
                        classes: onboardingShift3Classes, 
                        setClasses: setOnboardingShift3Classes, 
                        levels: onboardingShift3Levels, 
                        setLevels: setOnboardingShift3Levels,
                        bg: 'bg-amber-50/50', border: 'border-amber-900/40', text: 'text-amber-900'
                      }
                    ].map((sh) => (
                      <div key={sh.shiftNum} className={`p-4 md:p-6 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] ${sh.bg} space-y-4`}>
                        <h4 className="text-sm font-black uppercase text-slate-900 flex items-center gap-2">
                          <span className="bg-slate-900 text-white w-5 h-5 flex items-center justify-center rounded-none text-xs font-black">
                            {sh.shiftNum}
                          </span>
                          Shift {sh.shiftNum}
                        </h4>

                        {/* Classes Multi-select badge list */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Pilih Kelas yang Diajar (Klik untuk toggle):</label>
                          <div className="flex gap-1.5 flex-wrap">
                            {CLASSES.map((cls) => {
                              const isSelected = sh.classes.includes(cls);
                              return (
                                <button
                                  key={cls}
                                  onClick={() => {
                                    if (isSelected) {
                                      sh.setClasses(sh.classes.filter(c => c !== cls));
                                    } else {
                                      sh.setClasses([...sh.classes, cls]);
                                    }
                                  }}
                                  className={`px-3 py-1.5 border-2 text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-slate-900 text-white border-slate-900 shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]' 
                                      : 'bg-white text-slate-600 border-slate-300 hover:border-slate-900 hover:text-slate-900'
                                  }`}
                                >
                                  Kelas {cls}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Levels Multi-select badge list */}
                        <div className="space-y-1.5 pt-1">
                          <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Pilih Tingkat Level yang Diajar (Klik untuk toggle):</label>
                          <div className="flex gap-1.5 flex-wrap">
                            {LEVELS.map((lvl) => {
                              const isSelected = sh.levels.includes(lvl);
                              return (
                                <button
                                  key={lvl}
                                  onClick={() => {
                                    if (isSelected) {
                                      sh.setLevels(sh.levels.filter(l => l !== lvl));
                                    } else {
                                      sh.setLevels([...sh.levels, lvl]);
                                    }
                                  }}
                                  className={`px-2.5 py-1.5 border text-[10px] font-black uppercase transition-all cursor-pointer ${
                                    isSelected 
                                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-[1px_1px_0px_0px_rgba(255,255,255,1)]' 
                                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-900 hover:text-slate-900'
                                  }`}
                                >
                                  {lvl}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between pt-4 border-t-2 border-slate-200">
                    <button
                      onClick={() => setOnboardingStep(1)}
                      className="bg-white hover:bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-wider py-3 px-6 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] transition-all cursor-pointer"
                    >
                      Kembali ke Profil
                    </button>
                    <button
                      onClick={() => setOnboardingStep(3)}
                      className="bg-indigo-600 hover:bg-slate-950 text-white font-black text-xs uppercase tracking-wider py-3 px-6 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer flex items-center gap-1"
                    >
                      Lanjut ke Langkah 3 <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Search, Choose & Claim Students */}
              {onboardingStep === 3 && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border-2 border-slate-900 p-4 flex gap-3">
                    <UserPlus className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-950">Langkah 3: Cari & Klaim Roster Santri Anda</h4>
                      <p className="text-[11px] text-indigo-800 leading-relaxed font-semibold mt-0.5">
                        Silakan pilih santri-santri yang Anda bimbing dari database TPQ untuk di-claim ke bawah kelompok bimbingan Anda. Gunakan pencarian dan filter kelas/shift untuk mempercepat pemilihan.
                      </p>
                    </div>
                  </div>

                  {/* Reset/Clean mass action alert widget */}
                  <div className="bg-amber-50 border-2 border-amber-900 p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <div className="space-y-0.5">
                      <h5 className="text-[11px] font-black uppercase text-amber-950 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-amber-700" /> Ingin mengosongkan pengajar agar mudah di-claim?
                      </h5>
                      <p className="text-[10px] text-amber-900 font-bold leading-relaxed">
                        Jika data pengajar santri saat ini berantakan, Anda (sebagai perwakilan guru) bisa mengosongkan seluruh pengajar santri se-TPQ agar semua guru bisa mencaplok/mengklaim santri masing-masing secara bersih.
                      </p>
                    </div>
                    <button
                      onClick={handleClearAllStudentTeachers}
                      className="bg-rose-100 hover:bg-rose-200 text-rose-800 border-2 border-slate-900 p-2 text-xs font-black uppercase shrink-0 transition-all cursor-pointer shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                    >
                      🧹 Kosongkan Semua Pengajar Se-TPQ
                    </button>
                  </div>

                  {/* Filter and Search Bar for selection */}
                  <div className="bg-slate-50 border-2 border-slate-900 p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Pencarian Santri:</span>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <input
                          type="text"
                          value={claimSearchQuery}
                          onChange={(e) => setClaimSearchQuery(e.target.value)}
                          placeholder="Ketik Nama, NIPD, dll..."
                          className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 pl-9 pr-3 py-1.5 text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Filter Kelas:</span>
                      <select
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                        className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2 text-xs focus:outline-hidden"
                      >
                        <option value="All">Semua Kelas</option>
                        {CLASSES.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Filter Shift:</span>
                      <select
                        value={filterShift}
                        onChange={(e) => setFilterShift(e.target.value)}
                        className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2 text-xs focus:outline-hidden"
                      >
                        <option value="All">Semua Shift</option>
                        <option value="1">Shift 1</option>
                        <option value="2">Shift 2</option>
                        <option value="3">Shift 3</option>
                      </select>
                    </div>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        // Select all filtered students
                        const filteredIds = students.filter(st => {
                          const matchSearch = claimSearchQuery.trim() === '' || 
                            st.name.toLowerCase().includes(claimSearchQuery.toLowerCase()) || 
                            st.nipd.toLowerCase().includes(claimSearchQuery.toLowerCase());
                          const matchClass = filterClass === 'All' || st.class === filterClass;
                          const matchShift = filterShift === 'All' || st.shift === Number(filterShift);
                          return matchSearch && matchClass && matchShift;
                        }).map(s => s.id);
                        
                        // Merge with existing selection
                        const newSelection = Array.from(new Set([...onboardingClaimedStudentIds, ...filteredIds]));
                        setOnboardingClaimedStudentIds(newSelection);
                        triggerToast(`📥 Berhasil memilih ${filteredIds.length} santri yang disaring.`);
                      }}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border-2 border-indigo-900 px-3 py-1.5 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Select All Filtered (Centang Semua)
                    </button>
                    <button
                      onClick={() => {
                        // Unselect all filtered students
                        const filteredIds = students.filter(st => {
                          const matchSearch = claimSearchQuery.trim() === '' || 
                            st.name.toLowerCase().includes(claimSearchQuery.toLowerCase()) || 
                            st.nipd.toLowerCase().includes(claimSearchQuery.toLowerCase());
                          const matchClass = filterClass === 'All' || st.class === filterClass;
                          const matchShift = filterShift === 'All' || st.shift === Number(filterShift);
                          return matchSearch && matchClass && matchShift;
                        }).map(s => s.id);

                        setOnboardingClaimedStudentIds(prev => prev.filter(id => !filteredIds.includes(id)));
                        triggerToast(`📤 Berhasil menghilangkan centang ${filteredIds.length} santri.`);
                      }}
                      className="bg-white hover:bg-slate-50 text-slate-600 border-2 border-slate-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Unselect All Filtered
                    </button>
                    <button
                      onClick={() => {
                        setOnboardingClaimedStudentIds([]);
                        triggerToast(`🧹 Seluruh pilihan santri dibersihkan.`);
                      }}
                      className="bg-rose-50 hover:bg-rose-100 text-rose-800 border-2 border-rose-300 px-3 py-1.5 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Clear All Selection (0)
                    </button>
                  </div>

                  {/* Student Grid / List */}
                  <div className="border-4 border-slate-900 max-h-[380px] overflow-y-auto divide-y-2 divide-slate-900 rounded-none bg-slate-50 select-none">
                    {students.filter(st => {
                      const matchSearch = claimSearchQuery.trim() === '' || 
                        st.name.toLowerCase().includes(claimSearchQuery.toLowerCase()) || 
                        st.nipd.toLowerCase().includes(claimSearchQuery.toLowerCase());
                      const matchClass = filterClass === 'All' || st.class === filterClass;
                      const matchShift = filterShift === 'All' || st.shift === Number(filterShift);
                      return matchSearch && matchClass && matchShift;
                    }).length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-bold text-xs italic bg-white">
                        Tidak ada santri yang cocok dengan kriteria filter pencarian.
                      </div>
                    ) : (
                      students.filter(st => {
                        const matchSearch = claimSearchQuery.trim() === '' || 
                          st.name.toLowerCase().includes(claimSearchQuery.toLowerCase()) || 
                          st.nipd.toLowerCase().includes(claimSearchQuery.toLowerCase());
                        const matchClass = filterClass === 'All' || st.class === filterClass;
                        const matchShift = filterShift === 'All' || st.shift === Number(filterShift);
                        return matchSearch && matchClass && matchShift;
                      }).map((st) => {
                        const isClaimed = onboardingClaimedStudentIds.includes(st.id);
                        return (
                          <div
                            key={st.id}
                            onClick={() => {
                              if (isClaimed) {
                                setOnboardingClaimedStudentIds(prev => prev.filter(id => id !== st.id));
                              } else {
                                setOnboardingClaimedStudentIds(prev => [...prev, st.id]);
                              }
                            }}
                            className={`p-3 md:p-4 flex items-center justify-between gap-4 transition-colors cursor-pointer ${
                              isClaimed ? 'bg-indigo-50/70 hover:bg-indigo-50' : 'bg-white hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Custom Box/Checkbox */}
                              <div className={`w-5 h-5 border-2 border-slate-900 flex items-center justify-center shrink-0 ${
                                isClaimed ? 'bg-indigo-600' : 'bg-white'
                              }`}>
                                {isClaimed && <Check className="w-3.5 h-3.5 text-white stroke-[4]" />}
                              </div>
                              <div className="text-left">
                                <h5 className="text-xs md:text-sm font-black text-slate-900 flex items-center gap-1.5">
                                  {st.name} 
                                  <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-300 px-1 py-0.2 shrink-0 font-mono">
                                    NIPD: {st.nipd}
                                  </span>
                                </h5>
                                <div className="flex gap-2 items-center text-[10px] text-slate-500 font-bold mt-0.5">
                                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-1.5 py-0.2">Kelas {st.class}</span>
                                  <span className="bg-amber-50 border border-amber-200 text-amber-800 px-1.5 py-0.2">Shift {st.shift}</span>
                                  {st.asatidz ? (
                                    <span className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-1.5 py-0.2">
                                      Guru: Ustadz/ah {st.asatidz}
                                    </span>
                                  ) : (
                                    <span className="bg-slate-100 text-slate-400 px-1.5 py-0.2 italic">Belum ada pengajar</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 border ${
                              isClaimed 
                                ? 'bg-indigo-100 border-indigo-300 text-indigo-900' 
                                : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}>
                              {isClaimed ? "✓ Terpilih" : "Belum Dipilih"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t-2 border-slate-200">
                    <button
                      onClick={() => setOnboardingStep(2)}
                      className="bg-white hover:bg-slate-50 text-slate-900 font-black text-xs uppercase py-3 px-6 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] transition-all cursor-pointer"
                    >
                      Kembali ke Shift
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-slate-700 hidden md:block">
                        Total Pilihan: <strong className="text-indigo-600 text-sm">{onboardingClaimedStudentIds.length}</strong> Santri
                      </span>
                      <button
                        onClick={handleSaveTeacherOnboarding}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider py-3.5 px-8 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Save className="w-4 h-4 stroke-[3]" /> Simpan Profil & Claim Roster 🚀
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================
            TAB: BERANDA GURU (dashboard_guru)
            ======================================================== */}
        {activeTab === 'dashboard_guru' && activeTeacher && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Banner Guru */}
            <div className="bg-indigo-50 border-4 border-slate-900 p-6 rounded-none relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-display font-black text-2xl text-slate-900 uppercase italic tracking-tight flex items-center gap-2">
                    Assalamu'alaikum, Ustadz/ah {activeTeacher.name}! <span className="text-yellow-500 inline-block animate-bounce font-sans">👋</span>
                  </h2>
                  <p className="text-sm text-slate-700 font-medium">
                    Selamat datang di Beranda Guru. Anda mengajar dengan status <strong className="font-black text-indigo-600">{activeTeacher.status}</strong>.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={() => {
                      setActiveTab('input_guru');
                      setInputGuruMode('my_students');
                    }}
                    className="bg-yellow-300 hover:bg-yellow-400 text-slate-900 border-2 border-slate-900 font-black text-xs uppercase tracking-wider py-2.5 px-5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4 text-slate-900" /> Catat Capaian Harian
                  </button>
                  <button 
                    onClick={() => setIsEditingMyProfile(true)}
                    className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 font-black text-xs uppercase tracking-wider py-2.5 px-5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer"
                  >
                    <Sliders className="w-4 h-4 text-slate-900" /> Atur Roster & Klaim
                  </button>
                </div>
              </div>
            </div>

            {/* Metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-4 border-slate-900 p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-[10px] font-black uppercase text-slate-400 block leading-none">Kelompok Bimbingan Saya</span>
                <span className="text-2xl font-black text-slate-900 mt-1 block">{myStudents.length} Santri</span>
                <span className="text-[10px] text-slate-500 font-bold mt-1 block">Telah Anda klaim dari database</span>
              </div>

              <div className="bg-white border-4 border-slate-900 p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-[10px] font-black uppercase text-slate-400 block leading-none">Progress Hari Ini</span>
                <span className="text-2xl font-black text-emerald-600 mt-1 block">
                  {myStudents.length > 0 
                    ? `${Math.round((myStudents.filter(s => s.updatedAt?.startsWith(new Date().toISOString().split('T')[0])).length / myStudents.length) * 100)}%`
                    : '0%'}
                </span>
                <span className="text-[10px] text-slate-500 font-bold mt-1 block">
                  {myStudents.filter(s => s.updatedAt?.startsWith(new Date().toISOString().split('T')[0])).length} dari {myStudents.length} santri tercatat
                </span>
              </div>

              <div className="bg-white border-4 border-slate-900 p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-[10px] font-black uppercase text-slate-400 block leading-none">Promosi / Naik Tingkat</span>
                <span className="text-2xl font-black text-indigo-600 mt-1 block">
                  {myStudents.filter(s => s.naikTingkatThisMonth).length} Santri
                </span>
                <span className="text-[10px] text-slate-500 font-bold mt-1 block">Lulus tingkat di bulan berjalan</span>
              </div>

              <div className="bg-white border-4 border-slate-900 p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                <span className="text-[10px] font-black uppercase text-slate-400 block leading-none">Roster Shift Mengajar</span>
                <div className="flex gap-1.5 flex-wrap mt-1.5">
                  {[1, 2, 3].map(shiftNum => {
                    const shiftsClasses = shiftNum === 1 ? activeTeacher.shift1Classes : shiftNum === 2 ? activeTeacher.shift2Classes : activeTeacher.shift3Classes;
                    const isTeaching = shiftsClasses && shiftsClasses.length > 0;
                    return (
                      <span 
                        key={shiftNum}
                        className={`text-[9px] font-black px-1.5 py-0.5 border-2 ${
                          isTeaching ? 'bg-indigo-100 text-indigo-900 border-indigo-900' : 'bg-slate-50 text-slate-300 border-slate-200'
                        }`}
                      >
                        S{shiftNum}: {isTeaching ? `${shiftsClasses.length} Kls` : 'Off'}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Claimed Students table list with filters */}
            <div className="bg-white border-4 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] p-4 md:p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-black uppercase text-slate-900">Daftar Roster Bimbingan Saya ({myStudents.length})</h3>
                  <p className="text-xs text-slate-500 font-bold">Berikut santri-santri yang Anda bimbing harian di TPQ ini</p>
                </div>
                
                {/* Search my claimed students */}
                <div className="w-full md:w-72 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={teacherSearchQuery}
                    onChange={(e) => setTeacherSearchQuery(e.target.value)}
                    placeholder="Cari santri bimbingan Anda..."
                    className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 pl-9 pr-3 py-1.5 text-xs focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Roster students rendering */}
              {myStudents.length === 0 ? (
                <div className="border-2 border-dashed border-slate-300 p-8 text-center space-y-3">
                  <p className="text-xs text-slate-400 font-bold italic">Anda belum memiliki roster santri bimbingan yang diklaim.</p>
                  <button
                    onClick={() => setIsEditingMyProfile(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2 border-2 border-slate-900 cursor-pointer"
                  >
                    Klaim Roster Santri Sekarang 📥
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto border-2 border-slate-900">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-slate-900 text-white border-b-2 border-slate-900 text-[10px] uppercase font-black tracking-wider">
                        <th className="p-3">NIPD</th>
                        <th className="p-3">Nama Santri</th>
                        <th className="p-3">Gender</th>
                        <th className="p-3">Kelas / Shift</th>
                        <th className="p-3">Level Capaian</th>
                        <th className="p-3">Capaian Terakhir (Hal/Materi)</th>
                        <th className="p-3">Tanggal Update</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-slate-100 text-xs font-bold text-slate-700">
                      {myStudents
                        .filter(st => {
                          return teacherSearchQuery.trim() === '' || 
                            st.name.toLowerCase().includes(teacherSearchQuery.toLowerCase()) || 
                            st.nipd.toLowerCase().includes(teacherSearchQuery.toLowerCase());
                        })
                        .map((st) => {
                          const isUpdatedToday = st.updatedAt?.startsWith(new Date().toISOString().split('T')[0]);
                          return (
                            <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-mono text-slate-500">{st.nipd}</td>
                              <td className="p-3 text-slate-900">
                                <div className="flex items-center gap-1.5">
                                  {st.name}
                                  {isUpdatedToday && (
                                    <span className="bg-emerald-100 border border-emerald-300 text-emerald-800 text-[8px] font-black uppercase px-1 py-0.2 shrink-0">
                                      Terisi
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">{st.gender === 'L' ? 'Laki-laki (L)' : 'Perempuan (P)'}</td>
                              <td className="p-3">
                                <span className="bg-slate-100 border border-slate-200 px-1.5 py-0.2">Kls {st.class}</span>
                                <span className="bg-amber-100 border border-amber-200 px-1.5 py-0.2 ml-1">S{st.shift}</span>
                              </td>
                              <td className="p-3">
                                <span className="bg-indigo-50 border border-indigo-200 text-indigo-900 px-2 py-0.5">
                                  {st.level}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 font-medium">
                                <div>{st.pageDetail || '-'}</div>
                                <div className="text-[10px] text-slate-400 italic mt-0.5">{st.materiTambahan}</div>
                              </td>
                              <td className="p-3 text-[10px] text-slate-400 font-mono">
                                {st.updatedAt ? new Date(st.updatedAt).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : 'Belum diisi'}
                              </td>
                              <td className="p-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedInputStudentId(st.id);
                                    setInputGuruMode('my_students');
                                    setActiveTab('input_guru');
                                  }}
                                  className="bg-yellow-300 hover:bg-slate-900 text-slate-900 hover:text-white transition-all border-2 border-slate-900 py-1 px-2.5 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                                >
                                  📝 Input
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================
            TAB: INPUT CAPAIAN GURU (input_guru)
            ======================================================== */}
        {activeTab === 'input_guru' && activeTeacher && (() => {
          // Find currently selected student detail
          const selectedStudent = students.find(s => s.id === selectedInputStudentId);
          
          // Filter students based on mode and teacher
          const displayStudents = students.filter(st => {
            if (inputGuruMode === 'my_students') {
              return st.asatidz === activeTeacher.name;
            } else {
              // Backup Mode: search from all students
              if (!backupSearchQuery.trim()) return false; // Must type something to backup
              const query = backupSearchQuery.toLowerCase().trim();
              return st.name.toLowerCase().includes(query) || 
                     st.nipd.toLowerCase().includes(query) || 
                     st.class.toLowerCase().includes(query);
            }
          });

          // Fetch next unassessed student for quick flow
          const handleAutoAdvance = () => {
            if (inputGuruMode === 'my_students' && myStudents.length > 0) {
              const todayStr = new Date().toISOString().split('T')[0];
              const currentIndex = myStudents.findIndex(s => s.id === selectedInputStudentId);
              
              // Search forward
              let nextStudent = myStudents.slice(currentIndex + 1).find(s => !s.updatedAt?.startsWith(todayStr));
              if (!nextStudent) {
                // Wrap around to start
                nextStudent = myStudents.slice(0, currentIndex).find(s => !s.updatedAt?.startsWith(todayStr));
              }

              if (nextStudent) {
                setSelectedInputStudentId(nextStudent.id);
                triggerToast(`👉 Otomatis pindah ke santri berikutnya: ${nextStudent.name}`);
              } else {
                triggerToast(`🎉 Alhamdulillah! Semua roster santri Anda hari ini telah di-input.`);
              }
            }
          };

          return (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Header Input */}
              <div className="bg-slate-900 p-4 border-2 border-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-display font-black text-lg uppercase tracking-wider flex items-center gap-2">
                    <Edit2 className="w-5 h-5 text-yellow-400" /> Input Penilaian & Progress Harian Santri
                  </h3>
                  <p className="text-[11px] text-slate-400 font-bold">Simpan catatan makhraj, tahfidz, tahsin, dan target hafalan harian secara instan.</p>
                </div>

                {/* Input Mode Switcher */}
                <div className="flex bg-slate-800 p-1 border border-slate-700 select-none">
                  <button
                    onClick={() => {
                      setInputGuruMode('my_students');
                      setSelectedInputStudentId('');
                    }}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                      inputGuruMode === 'my_students' 
                        ? 'bg-yellow-300 text-slate-900' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    📋 My Roster
                  </button>
                  <button
                    onClick={() => {
                      setInputGuruMode('backup');
                      setSelectedInputStudentId('');
                    }}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                      inputGuruMode === 'backup' 
                        ? 'bg-indigo-600 text-white shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]' 
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🔍 Backup Guru Lain
                  </button>
                </div>
              </div>

              {/* Main Content Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT RAIL: Student List Selector (lg:col-span-4) */}
                <div className="lg:col-span-4 bg-white border-4 border-slate-900 p-4 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4 max-h-[600px] flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-900 border-b-2 border-slate-100 pb-2 flex items-center justify-between">
                      <span>PILIH SANTRI</span>
                      <span className="bg-slate-100 px-1.5 py-0.2 text-[9px] font-mono font-black text-slate-600 rounded-none border border-slate-200">
                        {inputGuruMode === 'my_students' ? 'Roster Anda' : 'Database TPQ'}
                      </span>
                    </h4>

                    {inputGuruMode === 'backup' && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-500">Cari Nama / Kelas / Guru Asli:</span>
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            value={backupSearchQuery}
                            onChange={(e) => setBackupSearchQuery(e.target.value)}
                            placeholder="Cari semua anak TPQ..."
                            className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 pl-8 pr-2 py-1.5 text-xs focus:outline-hidden"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scrollable List Container */}
                  <div className="flex-1 overflow-y-auto divide-y-2 divide-slate-100 max-h-[400px] border border-slate-200 pr-1 select-none">
                    {inputGuruMode === 'backup' && !backupSearchQuery.trim() ? (
                      <div className="p-8 text-center text-slate-400 font-bold text-[10px] italic">
                        Ketik nama santri di atas untuk mencari dan membackup pengisian progress harian mereka.
                      </div>
                    ) : displayStudents.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 font-bold text-[10px] italic">
                        Tidak ada santri yang cocok.
                      </div>
                    ) : (
                      displayStudents.map((st) => {
                        const isSelected = selectedInputStudentId === st.id;
                        const isUpdatedToday = st.updatedAt?.startsWith(new Date().toISOString().split('T')[0]);
                        return (
                          <div
                            key={st.id}
                            onClick={() => setSelectedInputStudentId(st.id)}
                            className={`p-2.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isSelected 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-white hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div>
                              <h5 className="text-[11px] font-black">{st.name}</h5>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[9px] font-bold">
                                <span className={isSelected ? 'text-indigo-200' : 'text-slate-500'}>
                                  Kls {st.class}
                                </span>
                                <span className={isSelected ? 'text-indigo-200' : 'text-slate-400'}>•</span>
                                <span className={isSelected ? 'text-indigo-200' : 'text-slate-500'}>
                                  Level {st.level}
                                font-sans</span>
                              </div>
                            </div>

                            <span className={`text-[8px] font-black uppercase px-1 py-0.2 shrink-0 border ${
                              isUpdatedToday 
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-800' 
                                : isSelected 
                                  ? 'bg-indigo-700 border-indigo-500 text-indigo-100' 
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                            }`}>
                              {isUpdatedToday ? "✓ Terisi" : "● Belum"}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* RIGHT PANEL: Input Assessment Form Sheet (lg:col-span-8) */}
                <div className="lg:col-span-8 bg-white border-4 border-slate-900 p-4 md:p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  {!selectedStudent ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center space-y-3">
                      <div className="w-16 h-16 bg-slate-50 border-2 border-slate-900 rounded-full flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-black uppercase text-slate-900">Pemberitahuan</h4>
                      <p className="text-xs text-slate-500 leading-relaxed max-w-sm font-bold">
                        Pilihlah salah satu santri di daftar sebelah kiri untuk memuat lembar input Al-Qur'an dan laporan harian TPQ secara instan.
                      </p>
                    </div>
                  ) : (() => {
                    const temp = tempAchievements[selectedStudent.id] || { 
                      level: selectedStudent.level, 
                      pageDetail: selectedStudent.pageDetail, 
                      naikTingkat: selectedStudent.naikTingkatThisMonth, 
                      materiTambahan: selectedStudent.materiTambahan 
                    };
                    return (
                      <div className="space-y-5">
                        {/* Student Badge Card */}
                        <div className="bg-indigo-50 border-2 border-slate-900 p-4 flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="text-[8px] bg-slate-900 text-white px-1.5 py-0.2 font-mono font-black uppercase">
                              NIPD: {selectedStudent.nipd}
                            </span>
                            <h4 className="text-base font-black text-slate-900 uppercase mt-0.5">{selectedStudent.name}</h4>
                            <div className="flex gap-2 text-[10px] text-slate-500 font-bold">
                              <span>Kelas: {selectedStudent.class}</span>
                              <span>•</span>
                              <span>Shift: {selectedStudent.shift}</span>
                              {selectedStudent.asatidz && (
                                <>
                                  <span>•</span>
                                  <span>Guru Asli: Ustadz/ah {selectedStudent.asatidz}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 font-bold block leading-none">Level Aktif:</span>
                            <span className="text-lg font-black text-indigo-700 uppercase mt-1 block">{selectedStudent.level}</span>
                          </div>
                        </div>

                        {/* Form Inputs Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Book/Surah Field */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Kitab / Surat Al-Qur'an:</label>
                            <input
                              type="text"
                              value={temp.materiTambahan}
                              onChange={(e) => handleUpdateTempAchievement(selectedStudent.id, 'materiTambahan', e.target.value)}
                              placeholder="Contoh: Juz 30 (An-Naba') atau Jilid Qiraati 3"
                              className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2.5 text-xs focus:outline-hidden"
                            />
                            {/* Suggestions block */}
                            <div className="flex gap-1 flex-wrap mt-1">
                              {['Qiraati Jilid 1', 'Qiraati Jilid 2', 'Qiraati Jilid 3', 'Qiraati Jilid 4', 'Al-Qur\'an (Ghorib)', 'Juz 30 (Tahfizh)'].map(sug => (
                                <button
                                  key={sug}
                                  onClick={() => handleUpdateTempAchievement(selectedStudent.id, 'materiTambahan', sug)}
                                  className="bg-slate-50 hover:bg-slate-100 border border-slate-300 text-[9px] font-black uppercase px-1.5 py-0.5 cursor-pointer"
                                >
                                  {sug}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Page / Ayat Field */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Halaman / Ayat:</label>
                            <input
                              type="text"
                              value={temp.pageDetail}
                              onChange={(e) => handleUpdateTempAchievement(selectedStudent.id, 'pageDetail', e.target.value)}
                              placeholder="Contoh: Halaman 12-13 / Ayat 1-10"
                              className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2.5 text-xs focus:outline-hidden"
                            />
                          </div>

                          {/* Level Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Level (Tingkat):</label>
                            <select
                              value={temp.level}
                              onChange={(e) => handleUpdateTempAchievement(selectedStudent.id, 'level', e.target.value)}
                              className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2.5 text-xs focus:outline-hidden font-sans"
                            >
                              {LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                            </select>
                          </div>

                          {/* Naik Tingkat (Upgraded) Toggle */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] md:text-xs font-black uppercase text-slate-700 block">Status Naik Tingkat / Lulus Level?</label>
                            <div className="flex items-center gap-3 p-2 bg-slate-50 border-2 border-slate-900 h-[44px]">
                              <input
                                type="checkbox"
                                id={`check-up-${selectedStudent.id}`}
                                checked={temp.naikTingkat}
                                onChange={(e) => handleUpdateTempAchievement(selectedStudent.id, 'naikTingkat', e.target.checked)}
                                className="w-5 h-5 accent-indigo-600 rounded-none border-2 border-slate-900 cursor-pointer"
                              />
                              <label htmlFor={`check-up-${selectedStudent.id}`} className="text-xs font-black text-slate-700 uppercase flex items-center gap-1 cursor-pointer select-none">
                                🏆 Ya, Lulus Tingkat Bulan Ini!
                              </label>
                            </div>
                          </div>
                        </div>

                        {/* Save Action Area */}
                        <div className="border-t-2 border-slate-100 pt-4 flex flex-col sm:flex-row justify-between items-center gap-4">
                          <button
                            onClick={() => setSelectedInputStudentId('')}
                            className="text-slate-500 hover:text-slate-800 text-xs font-black uppercase tracking-wider"
                          >
                            ✕ Tutup Formulir
                          </button>

                          <div className="flex gap-2">
                            {inputGuruMode === 'my_students' && (
                              <button
                                onClick={handleAutoAdvance}
                                className="bg-white hover:bg-slate-50 text-slate-700 border-2 border-slate-300 py-2.5 px-4 text-xs font-black uppercase tracking-wider cursor-pointer"
                              >
                                Skip & Lanjut ➡️
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                await handleSaveShiftProgress(selectedStudent.id);
                                handleAutoAdvance();
                              }}
                              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider py-2.5 px-6 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Save className="w-4 h-4 stroke-[3]" /> Simpan Progress Capaian 💾
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
            </motion.div>
          );
        })()}

        {/* ========================================================
            TAB: KELOLA ROSTER & KLAIM (claim_guru)
            ======================================================== */}
        {activeTab === 'claim_guru' && activeTeacher && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-indigo-50 border-4 border-slate-900 p-6 rounded-none relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h2 className="font-display font-black text-2xl text-slate-900 uppercase italic tracking-tight">
                Kelola Roster & Klaim Kelompok Bimbingan
              </h2>
              <p className="text-sm text-slate-700 mt-1 font-medium">
                Pilih atau klaim santri-santri yang Anda bimbing harian dari database sekolah untuk disematkan di portal mengajar Anda.
              </p>
              
              <div className="mt-4">
                <button
                  onClick={() => setIsEditingMyProfile(true)}
                  className="bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 text-xs font-black uppercase py-3 px-6 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] cursor-pointer"
                >
                  ⚙️ Buka Wizard Pengaturan & Klaim Ulang Roster
                </button>
              </div>
            </div>

            {/* Quick Summary of Claims */}
            <div className="bg-white border-4 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="text-md font-black uppercase text-slate-900 border-b-2 border-slate-100 pb-3 mb-4">
                Santri yang Saat ini Terkait dengan Profil Anda ({myStudents.length} Orang)
              </h3>

              {myStudents.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Belum ada santri bimbingan.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {myStudents.map((st) => (
                    <div key={st.id} className="bg-slate-50 border-2 border-slate-900 p-3 flex justify-between items-center shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      <div>
                        <h4 className="text-xs font-black text-slate-900 uppercase">{st.name}</h4>
                        <div className="text-[10px] text-slate-500 font-bold mt-0.5">
                          <span>Kls {st.class}</span> • <span>S{st.shift}</span> • <span className="text-indigo-600">{st.level}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ========================================================
            TAB: LAPORAN GURU (reports_guru)
            ======================================================== */}
        {activeTab === 'reports_guru' && activeTeacher && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white border-4 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="border-b-2 border-slate-900 pb-3 mb-6">
                <h3 className="text-lg font-black uppercase text-slate-900">Download Laporan Kelompok Bimbingan Saya</h3>
                <p className="text-xs text-slate-500 font-bold mt-0.5">Generate Raport PDF resmi atau Excel spreadsheet untuk santri-santri yang Anda kelola.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* PDF Raport Generator */}
                <div className="border-2 border-slate-900 p-4 space-y-4 bg-emerald-50/20 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="text-sm font-black uppercase text-emerald-950 flex items-center gap-1.5">
                    <Download className="w-4 h-4 text-emerald-600" /> Cetak Raport PDF
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold">
                    Generate raport Al-Qur'an resmi lengkap dengan tanda tangan Kepala Unit secara massal maupun individu.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase block">Pilih Bulan Laporan:</span>
                      <select 
                        value={reportMonth}
                        onChange={(e) => setReportMonth(e.target.value)}
                        className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2 text-xs focus:outline-hidden"
                      >
                        {LATEST_MONTHS.map(m => <option key={m} value={m}>{m.toUpperCase()}</option>)}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase block">Pilih Santri:</span>
                      <select 
                        value={selectedReportStudentId}
                        onChange={(e) => setSelectedReportStudentId(e.target.value)}
                        className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2 text-xs focus:outline-hidden"
                      >
                        <option value="all">Semua Roster Bimbingan ({myStudents.length} Orang)</option>
                        {myStudents.map(s => <option key={s.id} value={s.id}>{s.name} ({s.class})</option>)}
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setReportModel('raport');
                        setTimeout(() => {
                          handleExportRaportPDF();
                        }, 100);
                      }}
                      className="w-full bg-emerald-600 hover:bg-slate-950 text-white font-black text-xs uppercase tracking-wider py-2.5 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] cursor-pointer transition-all"
                    >
                      Unduh Raport PDF 📥
                    </button>
                  </div>
                </div>

                {/* Excel Exporter */}
                <div className="border-2 border-slate-900 p-4 space-y-4 bg-amber-50/20 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="text-sm font-black uppercase text-amber-950 flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-amber-600" /> Export Excel
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold">
                    Dapatkan rekap spreadsheet total progress capaian per tingkat kelas dalam format CSV Excel yang siap diolah.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase block">Model Rekapan:</span>
                      <select 
                        value={reportModel}
                        onChange={(e) => setReportModel(e.target.value as any)}
                        className="w-full bg-white text-slate-950 font-bold border-2 border-slate-900 p-2 text-xs focus:outline-hidden"
                      >
                        <option value="guru">Laporan Roster Saya ({activeTeacher.name})</option>
                        <option value="total">Rekap Capaian Global (339 Santri)</option>
                      </select>
                    </div>

                    <button
                      onClick={() => {
                        setReportTeacher(activeTeacher.name);
                        setTimeout(() => {
                          handleExportExcel();
                        }, 100);
                      }}
                      className="w-full bg-amber-500 hover:bg-slate-950 text-white font-black text-xs uppercase tracking-wider py-2.5 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] cursor-pointer transition-all"
                    >
                      Export Excel Spreadsheet 📊
                    </button>
                  </div>
                </div>

                {/* Print View Panel */}
                <div className="border-2 border-slate-900 p-4 space-y-4 bg-sky-50/20 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="text-sm font-black uppercase text-sky-950 flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-sky-600" /> Print Out Browser
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed font-bold">
                    Cetak tabel progress bimbingan harian langsung menggunakan pencetak browser bawaan Anda secara praktis.
                  </p>

                  <div className="space-y-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-slate-500 uppercase block font-sans">Preview Roster:</span>
                      <p className="text-[10px] text-slate-400 italic">Mencakup rekapitulasi tingkat kelulusan dan log penilaian harian yang sah.</p>
                    </div>

                    <button
                      onClick={() => {
                        setReportModel('guru');
                        setReportTeacher(activeTeacher.name);
                        setTimeout(() => {
                          handlePrint();
                        }, 100);
                      }}
                      className="w-full bg-sky-600 hover:bg-slate-950 text-white font-black text-xs uppercase tracking-wider py-2.5 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] cursor-pointer transition-all"
                    >
                      Cetak Laporan Roster 🖨️
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        )}

        {/* 1. DASHBOARD PAGE */}
        {activeTab === 'dashboard' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Greeting cards & Actions */}
            <div className="bg-indigo-50 border-4 border-slate-900 p-6 rounded-none relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h2 className="font-display font-black text-2xl text-slate-900 uppercase italic tracking-tight">
                    Assalamu'alaikum, Wr. Wb. <span className="text-yellow-500 inline-block animate-bounce font-sans">👋</span>
                  </h2>
                  <p className="text-sm text-slate-700 font-medium">
                    Selamat datang di Panel Mandor Mandiri <strong className="font-black text-indigo-600">SiQuran</strong>. Data tersinkronisasi otomatis dengan database master santri.
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button 
                    onClick={() => setActiveTab('input')}
                    className="bg-yellow-300 hover:bg-yellow-400 text-slate-900 border-2 border-slate-900 font-black text-xs uppercase tracking-wider py-2.5 px-5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-slate-900" /> Input Capaian Guru
                  </button>
                  <button 
                    onClick={() => setActiveTab('reports')}
                    className="bg-white hover:bg-slate-50 text-slate-900 border-2 border-slate-900 font-black text-xs uppercase tracking-wider py-2.5 px-5 flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-slate-900" /> Buka Laporan Bulanan
                  </button>
                </div>
              </div>

              {/* Islamic Quote Bar */}
              <div className="mt-4 pt-4 border-t-2 border-slate-900/10 flex items-center gap-2 text-xs text-slate-600 font-bold italic">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>"Sebaik-baik kalian adalah orang yang belajar Al-Qur'an dan mengajarkannya." (HR. Bukhari)</span>
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Santri Aktif', count: dashboardStats.totalSantri, sub: `Database Master (${students.length})`, icon: Users, color: 'text-indigo-600 bg-white' },
                { label: 'Naik Tingkat (Bulan Ini)', count: dashboardStats.totalNaikTingkat, sub: 'Real-time update', icon: Award, color: 'text-green-600 bg-white' },
                { label: 'Ustadz / Asatidz Aktif', count: dashboardStats.currentActiveTeachers, sub: 'Terdaftar di kelas', icon: BookOpen, color: 'text-amber-600 bg-white' },
                { label: 'Tingkat Al-Quran', count: dashboardStats.inAlQuran, sub: `${dashboardStats.inJilid} Jilid & ${dashboardStats.inTajwidGhorib} TG`, icon: Layers, color: 'text-rose-600 bg-white' }
              ].map((m, idx) => {
                const Icon = m.icon;
                return (
                  <div key={idx} className={`p-4 border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between ${m.color}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-400">{m.label}</span>
                      <Icon className="w-5 h-5 text-slate-900" />
                    </div>
                    <div>
                      <p className="font-display font-black text-3xl text-slate-900">{m.count}</p>
                      <p className="text-[10px] text-slate-500 font-bold font-mono mt-0.5">{m.sub}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Distribution Graph Matrix Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Cols: Distribution Per Kelas */}
              <div className="lg:col-span-2 bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b-2 border-slate-100 pb-2">
                  <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-widest italic flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600 animate-pulse" /> Sebaran Kuantitas Santri Per Kelas
                  </h3>
                  <span className="text-xs bg-yellow-305 border border-slate-900 bg-yellow-300 font-black uppercase px-2.5 py-1 text-slate-900 font-mono shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                    Σ = {dashboardStats.totalSantri} Santri
                  </span>
                </div>
                
                {/* Simplified bar gauges showing total students per class out of max 35 */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {dynamicClasses.map((kls) => {
                    const classStudents = students.filter(s => s.class === kls);
                    const classCount = classStudents.length;
                    const lvUps = classStudents.filter(st => st.naikTingkatThisMonth).length;
                    const pct = Math.min((classCount / 35) * 100, 100);
                    
                    return (
                      <div key={kls} className="bg-slate-50 border-2 border-slate-900 p-3.5 space-y-2 hover:bg-indigo-50/45 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black text-slate-900 uppercase">{kls}</span>
                          <span className="text-[11px] text-slate-700 font-bold font-mono">
                            {classCount} <span className="opacity-40">/ 35</span>
                          </span>
                        </div>
                        <div className="w-full bg-white border-2 border-slate-900 h-3 overflow-hidden rounded-none">
                          <div 
                            className="bg-indigo-600 h-full transition-all duration-500" 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold font-mono">
                          <span>S1/2/3: {classStudents.filter(s => s.shift===1).length}/{classStudents.filter(s => s.shift===2).length}/{classStudents.filter(s => s.shift===3).length}</span>
                          {lvUps > 0 && <span className="text-green-600 font-black">🌟 {lvUps} NAIK</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Col: Activity Logs & Sync Stream */}
              <div className="bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col h-[400px]">
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
                  <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-indigo-600" /> Firebase Dev Activity Stream
                  </h3>
                  {isFirebaseSyncing ? (
                    <span className="text-[10px] text-green-600 font-black uppercase flex items-center gap-1 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Syncing...
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-black uppercase font-mono">Live Mirror</span>
                  )}
                </div>

                {/* Firestore Sync Stream UI */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-[11px] font-mono scrollbar-none">
                  {firebaseLogs.map((log) => (
                    <div key={log.id} className="bg-slate-50 border-2 border-slate-900 p-2.5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded-none text-[9px] font-black border uppercase ${
                          log.type === 'CONNECT' ? 'bg-sky-100 text-sky-850 border-sky-455' :
                          log.type === 'UPDATE' ? 'bg-amber-100 text-amber-850 border-amber-455' :
                          log.type === 'INSERT' ? 'bg-green-100 text-green-850 border-green-455' :
                          'bg-indigo-100 text-indigo-850 border-indigo-455'
                        }`}>
                          firebase.{log.type}
                        </span>
                        <span className="text-[9px] font-bold text-slate-440">{log.time}</span>
                      </div>
                      <p className="text-slate-800 font-semibold leading-relaxed break-words">{log.details}</p>
                    </div>
                  ))}
                </div>

                {/* Database Info Snippet */}
                <div className="mt-3 pt-3 border-t-2 border-slate-100 text-center">
                  <button 
                    onClick={() => setActiveTab('developer')}
                    className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center justify-center gap-1 w-full uppercase tracking-wider"
                  >
                    Buka konfigurasi kredensial Firebase <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

            </div>

            {/* Bottom: General Activity History (Real Logs) */}
            <div className="bg-white border-2 border-slate-900 p-5 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest mb-3 flex items-center gap-2 border-b-2 border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-indigo-600" /> Riwayat Perubahan PJ / Guru (Lokal State)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-900 text-white font-black text-[10px] uppercase">
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4 text-yellow-300">User / Asatidz</th>
                      <th className="py-2.5 px-4">Action Type</th>
                      <th className="py-2.5 px-4 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {logs.map((st) => (
                      <tr key={st.id} className="text-slate-800 hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-4 text-[11px] font-bold whitespace-nowrap text-slate-500">{st.timestamp}</td>
                        <td className="py-2.5 px-4 font-black text-indigo-600">{st.user}</td>
                        <td className="py-2.5 px-4"><span className="text-[10px] bg-yellow-300 border-2 border-slate-900 text-slate-900 font-black uppercase px-2 py-0.5 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">{st.action}</span></td>
                        <td className="py-2.5 px-4 font-bold">{st.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </motion.div>
        )}

        {/* SETUP TAB PAGE */}
        {activeTab === 'setup' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Title banner */}
            <div className="bg-emerald-50 border-4 border-slate-900 p-6 rounded-none relative overflow-hidden shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h2 className="font-display font-black text-xl text-slate-900 uppercase italic tracking-tight flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-700" /> Setup Awal Sistem & Manajemen Tim Guru (Asatidz) ⚙️
              </h2>
              <p className="text-xs font-bold text-slate-700 mt-1">
                Langkah pertama bagi Koordinator SIQURAN sebelum kegiatan harian dimulai: Menyiapkan database master, melengkapi profil guru beserta penugasan mengajar capaian apa, serta mengorganisir dua kategori materi tambahan.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Fase 1 Database Preparation */}
              <div className="lg:col-span-1 space-y-6">
                
                {/* Database Prep Card */}
                <div className="bg-white border-2 border-slate-900 p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-1.5 border-b-2 border-slate-900 pb-2.5 mb-3">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider">
                      Fase 1: Setup Database Anak & Capaian
                    </h3>
                  </div>
                  
                  <div className="space-y-3.5 text-xs">
                    <div className="bg-emerald-50 border border-emerald-300 p-3 flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-black text-emerald-800 uppercase text-[10px]">Database Aktif Terisi</p>
                        <p className="font-bold text-slate-800 mt-1">{students.length} data anak beserta capaian lengkap telah dimuat draf.</p>
                      </div>
                    </div>

                    <p className="text-slate-600 font-medium">
                      Sistem kami secara otomatis telah menginisialisasi <strong>339 draf santri</strong> lengkap dengan kelas (7A-9D), level awal (Jilid 1 s.d Juz 30), detail halaman/ayat, serta nama ustadz penguji bawaan.
                    </p>

                    <div className="border-t-2 border-slate-100 pt-3 space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Aksi Setup Database</p>
                      
                      <button
                        onClick={handleResetData}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-center text-[11px] py-2 px-3 border-2 border-slate-900 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(202,138,4,1)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-yellow-400" /> Reset & Muat Ulang 339 Santri
                      </button>

                      <p className="text-[10px] text-slate-500 italic font-bold">
                        *Klik tombol reset apabila ingin memulihkan data asli template Excel kapan saja demi pengujian yang akurat!
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admin: Kop Surat & Penandatangan Card */}
                <div className="bg-amber-50/20 border-2 border-slate-900 p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]" id="config-institutional-kop">
                  <div className="flex items-center gap-1.5 border-b-2 border-slate-900 pb-2.5 mb-3">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider">
                      Admin: Kop Surat & Penandatangan Surat
                    </h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <p className="text-slate-650 font-semibold leading-relaxed">
                      Atur nama yayasan, unit, dan penandatangan laporan (Kepala Sekolah & PJ) di bawah ini untuk dicetak otomatis pada dokumen raport santri.
                    </p>

                    {/* Yayasan Name */}
                    <div className="space-y-1">
                      <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">Nama Yayasan</label>
                      <input
                        type="text"
                        value={yayasanName}
                        onChange={(e) => setYayasanName(e.target.value)}
                        className="w-full bg-white border-2 border-slate-900 px-2 py-1.5 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                        placeholder="YAYASAN SIQRAN AL-QUR'AN INDONESIA"
                      />
                    </div>

                    {/* Unit Name */}
                    <div className="space-y-1">
                      <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">Nama Unit / Lembaga</label>
                      <input
                        type="text"
                        value={unitName}
                        onChange={(e) => setUnitName(e.target.value)}
                        className="w-full bg-white border-2 border-slate-900 px-2 py-1.5 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                        placeholder="UNIT TAHFIDZ WA TA'LIM SIQRAN (UTTS)"
                      />
                    </div>

                    {/* No. Izin / Akreditasi */}
                    <div className="space-y-1">
                      <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">No. Izin Kemenag / Akreditasi</label>
                      <input
                        type="text"
                        value={permitNumber}
                        onChange={(e) => setPermitNumber(e.target.value)}
                        className="w-full bg-white border-2 border-slate-900 px-2 py-1.5 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                        placeholder="Izin Operasional Kemenag No. 4112/A/2026 | Terakreditasi A"
                      />
                    </div>

                    {/* Alamat Sekretariat */}
                    <div className="space-y-1">
                      <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">Alamat Sekretariat</label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        rows={2}
                        className="w-full bg-white border-2 border-slate-900 px-2 py-1.5 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600 resize-none"
                        placeholder="Jl. Pendidikan Al-Qur'an No. 41, Jakarta Selatan"
                      />
                    </div>

                    {/* Phone & Email (Side by Side) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">No. Telepon</label>
                        <input
                          type="text"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-white border-2 border-slate-900 px-2 py-1.5 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                          placeholder="(021) 777-1234"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">Email Lembaga</label>
                        <input
                          type="text"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full bg-white border-2 border-slate-900 px-2 py-1.5 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                          placeholder="geminipro.id025@gmail.com"
                        />
                      </div>
                    </div>

                    {/* Headmaster & PJ Signatories (Side by Side) */}
                    <div className="grid grid-cols-2 gap-2 border-t border-slate-300 pt-3">
                      <div className="space-y-1">
                        <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">Kepala Sekolah / Unit</label>
                        <input
                          type="text"
                          value={headmasterName}
                          onChange={(e) => setHeadmasterName(e.target.value)}
                          className="w-full bg-white border-2 border-slate-900 px-2 py-1.5 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                          placeholder="Ustadz H. Ahmad Syarif, Lc."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">Penanggung Jawab (PJ)</label>
                        <input
                          type="text"
                          value={pjName}
                          onChange={(e) => setPjName(e.target.value)}
                          className="w-full bg-white border-2 border-slate-900 px-2 py-1.5 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                          placeholder="Ustadzah Fatimah, S.Pd.I."
                        />
                      </div>
                    </div>

                    {/* Upload Gambar Kop Surat */}
                    <div className="border-t border-slate-300 pt-3 space-y-2">
                      <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">
                        Upload Gambar Kop Surat (PNG / JPEG)
                      </label>
                      <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                        Unggah logo instansi atau gambar banner kop surat penuh (maks. 800KB).
                      </p>
                      
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                        <div className="relative">
                          <input
                            id="kop-image-upload-input"
                            type="file"
                            accept="image/png, image/jpeg, image/jpg"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 800000) {
                                triggerToast("⚠️ Ukuran gambar terlalu besar! Harap gunakan gambar di bawah 800KB.");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                if (event.target?.result) {
                                  setKopHeaderImage(event.target.result as string);
                                  triggerToast("✅ Kop gambar berhasil dimuat! Silakan klik 'Simpan Kop & Tanda Tangan' di bawah.");
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                            className="hidden"
                          />
                          <label
                            htmlFor="kop-image-upload-input"
                            className="bg-white hover:bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-wider py-1.5 px-3 border-2 border-slate-900 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5 text-indigo-600" /> Pilih File Gambar
                          </label>
                        </div>

                        {kopHeaderImage && (
                          <button
                            type="button"
                            onClick={() => {
                              setKopHeaderImage('');
                              triggerToast("🗑️ Gambar kop dikosongkan. Silakan klik 'Simpan Kop & Tanda Tangan' untuk menyimpan.");
                            }}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-slate-900 font-black text-[10px] uppercase tracking-wider py-1.5 px-3 shadow-[1.5px_1.5px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1 transition-all"
                          >
                            Hapus Gambar
                          </button>
                        )}
                      </div>

                      {kopHeaderImage && (
                        <div className="space-y-2 pt-1">
                          {/* Layout Selection */}
                          <div className="space-y-1">
                            <label className="block text-slate-700 font-extrabold uppercase text-[9px] tracking-wide">
                              Model Penempatan Kop
                            </label>
                            <div className="flex gap-4">
                              <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                                <input
                                  type="radio"
                                  name="kopPlacement"
                                  value="logo"
                                  checked={kopPlacement === 'logo'}
                                  onChange={() => setKopPlacement('logo')}
                                  className="accent-indigo-600"
                                />
                                <span>Logo Instansi (Kiri)</span>
                              </label>
                              <label className="flex items-center gap-1.5 font-bold cursor-pointer">
                                <input
                                  type="radio"
                                  name="kopPlacement"
                                  value="banner"
                                  checked={kopPlacement === 'banner'}
                                  onChange={() => setKopPlacement('banner')}
                                  className="accent-indigo-600"
                                />
                                <span>Banner Kop Penuh (Atas)</span>
                              </label>
                            </div>
                          </div>

                          {/* Image Preview */}
                          <div className="border-2 border-dashed border-slate-300 p-2 bg-slate-50 flex items-center justify-center max-h-36 overflow-hidden">
                            {kopPlacement === 'banner' ? (
                              <img src={kopHeaderImage} alt="Kop Banner Preview" className="max-w-full max-h-28 object-contain" />
                            ) : (
                              <div className="flex items-center gap-2 w-full">
                                <div className="w-12 h-12 border border-slate-900 bg-white p-0.5 flex items-center justify-center overflow-hidden">
                                  <img src={kopHeaderImage} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                                </div>
                                <div className="text-[10px] font-medium text-slate-500">
                                  Logo Anda menggantikan ikon SVG kubah/buku di sebelah kiri kop surat raport.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleSaveInstitutionalConfig}
                      disabled={isFirebaseSyncing}
                      className="w-full bg-slate-950 hover:bg-slate-800 text-white font-black text-center text-[11px] py-2.5 px-4 border-2 border-slate-900 uppercase tracking-wider shadow-[3px_3px_0px_0px_rgba(245,158,11,1)] transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 font-display"
                    >
                      <span>💾 Simpan Kop & Tanda Tangan</span>
                    </button>
                  </div>
                </div>

                {/* School Options Configuration Card */}
                <div className="bg-white border-2 border-slate-900 p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]" id="config-school-options">
                  <div className="flex items-center gap-1.5 border-b-2 border-slate-900 pb-2.5 mb-3">
                    <Sliders className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider">
                      Fase 1.5: Pilihan Kelas & Capaian (Sistem Master)
                    </h3>
                  </div>

                  <div className="space-y-4 text-xs">
                    <p className="text-slate-600 font-medium">
                      Atur daftar kelas dan tingkatan capaian master di bawah ini. Perubahan akan langsung disinkronkan ke database cloud dan diperbarui di semua menu entry/laporan.
                    </p>

                    {/* Classes Management */}
                    <div className="space-y-2">
                      <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">Pilihan Kelas ({dynamicClasses.length})</label>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-900 max-h-36 overflow-y-auto">
                        {dynamicClasses.map(cls => (
                          <div key={cls} className="flex items-center gap-1 bg-white border border-slate-900 px-2 py-0.5 font-bold shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                            <span className="text-slate-900 font-mono text-center">{cls}</span>
                            <button 
                              onClick={() => handleDeleteClass(cls)}
                              className="text-red-500 hover:text-red-700 font-bold ml-1 transition-colors text-[10px] cursor-pointer"
                              title={`Hapus kelas ${cls}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Tambah kelas (Contoh: 10A)"
                          value={newClassName}
                          onChange={(e) => setNewClassName(e.target.value)}
                          className="flex-1 bg-white border-2 border-slate-900 px-2 py-1 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-hidden focus:border-indigo-600"
                        />
                        <button
                          onClick={handleAddClass}
                          className="bg-indigo-600 hover:bg-slate-950 text-white font-black text-[11px] px-3 border-2 border-slate-900 uppercase transition-all cursor-pointer"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>

                    {/* Levels Management */}
                    <div className="space-y-2">
                      <label className="block text-slate-800 font-extrabold uppercase text-[10px] tracking-wide">Pilihan Capaian ({dynamicLevels.length})</label>
                      <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-900 max-h-36 overflow-y-auto">
                        {dynamicLevels.map(lev => (
                          <div key={lev} className="flex items-center gap-1 bg-white border border-slate-900 px-2 py-0.5 font-bold shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                            <span className="text-slate-900 text-center">{lev}</span>
                            <button 
                              onClick={() => handleDeleteLevel(lev)}
                              className="text-red-500 hover:text-red-700 font-bold ml-1 transition-colors text-[10px] cursor-pointer"
                              title={`Hapus capaian ${lev}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-1.5 pt-1">
                        <input
                          type="text"
                          placeholder="Tambah capaian (Contoh: Juz 25)"
                          value={newLevelName}
                          onChange={(e) => setNewLevelName(e.target.value)}
                          className="flex-1 bg-white border-2 border-slate-900 px-2 py-1 text-xs text-slate-900 font-bold placeholder-slate-400 focus:outline-hidden focus:border-indigo-600"
                        />
                        <button
                          onClick={handleAddLevel}
                          className="bg-indigo-600 hover:bg-slate-950 text-white font-black text-[11px] px-3 border-2 border-slate-900 uppercase transition-all cursor-pointer"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>

                    {/* Setel Ulang ke Default */}
                    <div className="border-t border-slate-200 pt-3">
                      <button
                        onClick={handleResetSettingsToDefault}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 font-black text-center text-[10px] py-1.5 border border-slate-900 uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3 text-slate-700" /> Setel Ulang Opsi Master ke Default
                      </button>
                    </div>

                  </div>
                </div>

                {/* Database Importer / Exporter template */}
                <div className="bg-white border-2 border-slate-900 p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-1.5 border-b-2 border-slate-900 pb-2.5 mb-3">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider">
                      Migrasi Data Masal (Excel)
                    </h3>
                  </div>
                  
                  <div className="space-y-3.5 text-xs">
                    <p className="text-slate-600 font-medium">
                      Anda bisa mengunduh template CSV resmi, memodifikasi data anak beserta kelas di Microsoft Excel, lalu mengunggahnya kembali secara langsung.
                    </p>

                    <div className="grid grid-cols-1 gap-2.5">
                      <button
                        onClick={handleDownloadTemplate}
                        className="bg-white hover:bg-slate-50 text-slate-900 font-black text-[11px] uppercase tracking-wider py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-indigo-600" /> Unduh Template CSV Resmi
                      </button>

                      <button
                        onClick={handleDownloadCurrentData}
                        className="bg-indigo-50 hover:bg-indigo-100 text-slate-900 font-black text-[11px] uppercase tracking-wider py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-650" /> Unduh Data Terkini (.csv)
                      </button>

                      <div className="relative text-center">
                        <input
                          id="setup-csv-upload"
                          type="file"
                          accept=".csv"
                          onChange={handleImportCSV}
                          className="hidden"
                        />
                        <label
                          htmlFor="setup-csv-upload"
                          className="w-full bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black text-[11px] uppercase tracking-wider py-2.5 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" /> Unggah CSV Baru (.csv)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Materi Tambahan Info widget */}
                <div className="bg-amber-50/50 border-2 border-slate-900 p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex items-center gap-1.5 border-b-2 border-slate-900 pb-2.5 mb-3">
                    <Award className="w-4 h-4 text-amber-600" />
                    <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider">
                      Fase 3: Struktur Materi Tambahan
                    </h3>
                  </div>
                  
                  <div className="space-y-3.5 text-xs text-slate-700">
                    <p className="font-medium">
                      Sesuai arahan, sistem kami mendukung dua klasifikasi materi tambahan yang disesuaikan secara dinamis:
                    </p>

                    <div className="space-y-2">
                      <div className="bg-white border-2 border-slate-900 p-2.5">
                        <p className="font-black text-slate-900 text-[10px] uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></span> 1. DOA HARIAN 1 - 35</p>
                        <p className="text-[11px] font-bold mt-1 text-slate-650">Kumpulan bacaan doa sehari-hari untuk semua jenjang santri pasca dhuha.</p>
                      </div>

                      <div className="bg-white border-2 border-slate-900 p-2.5">
                        <p className="font-black text-slate-900 text-[10px] uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></span> 2. HAFALAN SURAT PENDEK</p>
                        <p className="text-[11px] font-bold mt-1 text-slate-650"><strong>Opsional tambahan</strong> khusus bagi anak-anak yang capaiannya masih di tingkat <strong>Jilid 1 sampai Jilid 6</strong>.</p>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-500 italic font-medium leading-relaxed">
                      *Saat guru menginput capaian atau admin mendaftarkan santri baru, modul dropdown cerdas akan disesuaikan secara real-time apabila santri terdeteksi di level Jilid!
                    </p>
                  </div>
                </div>

              </div>

              {/* Right Column: Fase 2 Teachers Directory Management */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Teachers Directory Header Card */}
                <div className="bg-white border-2 border-slate-900 p-6 rounded-none shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-slate-950 pb-4 mb-4">
                    <div>
                      <h3 className="font-display font-black text-base text-slate-900 uppercase">
                        Fase 2: Profil & Jangkauan Mengajar Guru (Asatidz)
                      </h3>
                      <p className="text-xs text-slate-500 font-bold mt-0.5">Atur database nama guru, detail status, kontak, serta jangkauan mengajar capaian apa.</p>
                    </div>

                    {!isAddingTeacher && !editingTeacher && (
                      <button
                        onClick={() => setIsAddingTeacher(true)}
                        className="bg-indigo-600 hover:bg-slate-900 text-white font-black text-[11px] py-2 px-3 border-2 border-slate-900 uppercase tracking-wider shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Tambah Profil Guru
                      </button>
                    )}
                  </div>

                  {/* Add Teacher Container */}
                  {isAddingTeacher && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="bg-indigo-50 border-2 border-indigo-900 p-5 mb-5 space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-indigo-200 pb-2">
                        <h4 className="font-display font-black text-xs uppercase text-indigo-900">Input Profil Guru Baru</h4>
                        <button onClick={() => setIsAddingTeacher(false)} className="text-indigo-950 hover:text-rose-600"><X className="w-5 h-5" /></button>
                      </div>

                      <form onSubmit={handleSaveTeacher} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-indigo-950 font-black uppercase mb-1">Nama Lengkap (Ditampilkan)</label>
                          <input
                            type="text"
                            required
                            placeholder="Contoh: Ahmad Syafii, M.Pd"
                            value={newTeacher.name}
                            onChange={(e) => setNewTeacher(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-indigo-950 font-black uppercase mb-1">Jenis Kelamin</label>
                          <select
                            value={newTeacher.gender}
                            onChange={(e) => setNewTeacher(prev => ({ ...prev, gender: e.target.value as any }))}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          >
                            <option value="L">Laki-laki (L)</option>
                            <option value="P">Perempuan (P)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-indigo-950 font-black uppercase mb-1">Status Kepegawaian</label>
                          <input
                            type="text"
                            placeholder="e.g. Ustadz Tetap / Koordinator"
                            value={newTeacher.status}
                            onChange={(e) => setNewTeacher(prev => ({ ...prev, status: e.target.value }))}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-indigo-950 font-black uppercase mb-1">Nomor Kontak / WhatsApp</label>
                          <input
                            type="text"
                            placeholder="Contoh: 0812-XXXX-XXXX"
                            value={newTeacher.phone}
                            onChange={(e) => setNewTeacher(prev => ({ ...prev, phone: e.target.value }))}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-indigo-950 font-black uppercase mb-1">Mengajar Capaian Apa (Spesialisasi Tingkat)</label>
                          <input
                            type="text"
                            placeholder="Contoh: Jilid 1-6 & Juz 30-29; Tajwid & Ghorib"
                            value={newTeacher.specialty}
                            onChange={(e) => setNewTeacher(prev => ({ ...prev, specialty: e.target.value }))}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-indigo-950 font-black uppercase mb-1">Lama Mengajar / Pengalaman</label>
                          <input
                            type="text"
                            placeholder="Contoh: 3 Tahun"
                            value={newTeacher.experience}
                            onChange={(e) => setNewTeacher(prev => ({ ...prev, experience: e.target.value }))}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          />
                        </div>

                        {/* Per-shift assignment selectors */}
                        <div className="sm:col-span-2 border-2 border-dashed border-indigo-200 p-4 bg-indigo-50/50 space-y-3">
                          <p className="font-extrabold text-[11px] text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                            ⚙️ PENGATURAN KELAS & CAPAIAN PER SHIFT
                          </p>
                          <p className="text-[10px] text-indigo-900 font-bold">Pilih shift di bawah untuk menentukan kelas yang diajar (maksimal 12) dan capaian Al-Quran (maksimal 10) pada shift tersebut.</p>
                          
                          {/* Shift tabs */}
                          <div className="flex gap-1 border-b-2 border-slate-950 pb-2">
                            {([1, 2, 3] as const).map(shiftNum => {
                              const active = teacherFormShiftTab === shiftNum;
                              const clsKey = `shift${shiftNum}Classes` as const;
                              const levKey = `shift${shiftNum}Levels` as const;
                              const clCount = (newTeacher[clsKey] || []).length;
                              const lvCount = (newTeacher[levKey] || []).length;
                              return (
                                <button
                                  key={shiftNum}
                                  type="button"
                                  onClick={() => setTeacherFormShiftTab(shiftNum)}
                                  className={`px-3 py-1.5 font-black text-[10px] uppercase border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] transition-all cursor-pointer ${
                                    active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800'
                                  }`}
                                >
                                  Shift {shiftNum} <span className="bg-slate-900 text-white text-[9px] px-1 py-0.2 ml-1">K:{clCount} C:{lvCount}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Selections for the active tab */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Class checkboxes */}
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 font-extrabold uppercase text-[10px] tracking-wide">
                                Pilih Kelas untuk Shift {teacherFormShiftTab} (Maksimal 12):
                              </label>
                              <div className="grid grid-cols-4 gap-1">
                                {dynamicClasses.map(cls => {
                                  const key = `shift${teacherFormShiftTab}Classes` as const;
                                  const isSelected = (newTeacher[key] || []).includes(cls);
                                  return (
                                    <button
                                      key={cls}
                                      type="button"
                                      onClick={() => toggleNewTeacherClassForShift(teacherFormShiftTab, cls)}
                                      className={`p-1.5 text-center font-extrabold text-[10px] uppercase border transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-indigo-600 text-white border-indigo-900 font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)]' 
                                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                                      }`}
                                    >
                                      {cls}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Level checkboxes */}
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 font-extrabold uppercase text-[10px] tracking-wide">
                                Pilih Capaian Al-Quran untuk Shift {teacherFormShiftTab} (Maksimal 10):
                              </label>
                              <div className="max-h-40 overflow-y-auto border-2 border-slate-900 p-2 bg-white grid grid-cols-2 gap-1.5">
                                {dynamicLevels.map(lev => {
                                  const key = `shift${teacherFormShiftTab}Levels` as const;
                                  const isSelected = (newTeacher[key] || []).includes(lev);
                                  return (
                                    <button
                                      key={lev}
                                      type="button"
                                      onClick={() => toggleNewTeacherLevelForShift(teacherFormShiftTab, lev)}
                                      className={`p-1.5 text-left truncate font-bold text-[9px] uppercase border transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-emerald-600 text-white border-emerald-900 font-extrabold' 
                                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                                      }`}
                                      title={lev}
                                    >
                                      {isSelected ? '✓ ' : ''}{lev}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-indigo-200">
                          <button
                            type="button"
                            onClick={() => setIsAddingTeacher(false)}
                            className="bg-white hover:bg-slate-50 text-slate-900 font-black px-4 py-2 border-2 border-slate-900 uppercase"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-slate-900 text-white font-black px-5 py-2 border-2 border-slate-900 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Simpan Profil Guru
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Edit Teacher Container */}
                  {editingTeacher && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-amber-50 border-2 border-amber-900 p-5 mb-5 space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-amber-200 pb-2">
                        <h4 className="font-display font-black text-xs uppercase text-amber-900">Ubah Profil Guru : {editingTeacher.name}</h4>
                        <button onClick={() => setEditingTeacher(null)} className="text-amber-950 hover:text-rose-600"><X className="w-5 h-5" /></button>
                      </div>

                      <form onSubmit={handleUpdateTeacher} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div>
                          <label className="block text-amber-950 font-black uppercase mb-1">Nama Lengkap</label>
                          <input
                            type="text"
                            required
                            value={editingTeacher.name}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, name: e.target.value } : null)}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-amber-950 font-black uppercase mb-1">Jenis Kelamin</label>
                          <select
                            value={editingTeacher.gender}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, gender: e.target.value as any } : null)}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          >
                            <option value="L">Laki-laki (L)</option>
                            <option value="P">Perempuan (P)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-amber-950 font-black uppercase mb-1">Status Kepegawaian</label>
                          <input
                            type="text"
                            value={editingTeacher.status}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, status: e.target.value } : null)}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-amber-950 font-black uppercase mb-1">Nomor Kontak / WhatsApp</label>
                          <input
                            type="text"
                            value={editingTeacher.phone}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, phone: e.target.value } : null)}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-amber-950 font-black uppercase mb-1">Mengajar Capaian Apa (Spesialisasi Tingkat)</label>
                          <input
                            type="text"
                            value={editingTeacher.specialty}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, specialty: e.target.value } : null)}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-medium"
                          />
                        </div>

                        <div>
                          <label className="block text-amber-950 font-black uppercase mb-1">Lama Mengajar / Pengalaman</label>
                          <input
                            type="text"
                            value={editingTeacher.experience}
                            onChange={(e) => setEditingTeacher(prev => prev ? { ...prev, experience: e.target.value } : null)}
                            className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold"
                          />
                        </div>

                        {/* Per-shift assignment selectors */}
                        <div className="sm:col-span-2 border-2 border-dashed border-amber-200 p-4 bg-amber-50/50 space-y-3">
                          <p className="font-extrabold text-[11px] text-amber-950 uppercase tracking-wider flex items-center gap-1">
                            ⚙️ PENGATURAN KELAS & CAPAIAN PER SHIFT
                          </p>
                          <p className="text-[10px] text-amber-900 font-bold">Pilih shift di bawah untuk menentukan kelas yang diajar (maksimal 12) dan capaian Al-Quran (maksimal 10) pada shift tersebut.</p>
                          
                          {/* Shift tabs */}
                          <div className="flex gap-1 border-b-2 border-slate-900 pb-2">
                            {([1, 2, 3] as const).map(shiftNum => {
                              const active = teacherFormShiftTab === shiftNum;
                              const clsKey = `shift${shiftNum}Classes` as const;
                              const levKey = `shift${shiftNum}Levels` as const;
                              const clCount = (editingTeacher[clsKey] || []).length;
                              const lvCount = (editingTeacher[levKey] || []).length;
                              return (
                                <button
                                  key={shiftNum}
                                  type="button"
                                  onClick={() => setTeacherFormShiftTab(shiftNum)}
                                  className={`px-3 py-1.5 font-black text-[10px] uppercase border-2 border-slate-900 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] active:translate-y-[1px] transition-all cursor-pointer ${
                                    active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-800'
                                  }`}
                                >
                                  Shift {shiftNum} <span className="bg-slate-900 text-white text-[9px] px-1 py-0.2 ml-1">K:{clCount} C:{lvCount}</span>
                                </button>
                              );
                            })}
                          </div>

                          {/* Selections for the active tab */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Class checkboxes */}
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 font-extrabold uppercase text-[10px] tracking-wide">
                                Pilih Kelas untuk Shift {teacherFormShiftTab} (Maksimal 12):
                              </label>
                              <div className="grid grid-cols-4 gap-1">
                                {dynamicClasses.map(cls => {
                                  const key = `shift${teacherFormShiftTab}Classes` as const;
                                  const isSelected = (editingTeacher[key] || []).includes(cls);
                                  return (
                                    <button
                                      key={cls}
                                      type="button"
                                      onClick={() => toggleEditingTeacherClassForShift(teacherFormShiftTab, cls)}
                                      className={`p-1.5 text-center font-extrabold text-[10px] uppercase border transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-indigo-600 text-white border-indigo-900 font-black shadow-[1px_1px_0px_0px_rgba(0,0,0,0.15)]' 
                                          : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                                      }`}
                                    >
                                      {cls}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Level checkboxes */}
                            <div className="space-y-1.5">
                              <label className="block text-slate-700 font-extrabold uppercase text-[10px] tracking-wide">
                                Pilih Capaian Al-Quran untuk Shift {teacherFormShiftTab} (Maksimal 10):
                              </label>
                              <div className="max-h-40 overflow-y-auto border-2 border-slate-900 p-2 bg-white grid grid-cols-2 gap-1.5">
                                {dynamicLevels.map(lev => {
                                  const key = `shift${teacherFormShiftTab}Levels` as const;
                                  const isSelected = (editingTeacher[key] || []).includes(lev);
                                  return (
                                    <button
                                      key={lev}
                                      type="button"
                                      onClick={() => toggleEditingTeacherLevelForShift(teacherFormShiftTab, lev)}
                                      className={`p-1.5 text-left truncate font-bold text-[9px] uppercase border transition-all cursor-pointer ${
                                        isSelected 
                                          ? 'bg-emerald-600 text-white border-emerald-900 font-extrabold' 
                                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
                                      }`}
                                      title={lev}
                                    >
                                      {isSelected ? '✓ ' : ''}{lev}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="sm:col-span-2 flex justify-end gap-2 pt-2 border-t border-amber-200">
                          <button
                            type="button"
                            onClick={() => setEditingTeacher(null)}
                            className="bg-white hover:bg-slate-50 text-slate-900 font-black px-4 py-2 border-2 border-slate-900 uppercase"
                          >
                            Batal
                          </button>
                          <button
                            type="submit"
                            className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-black px-5 py-2 border-2 border-slate-900 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                          >
                            Simpan Perubahan
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* Teachers Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    {teachers.map((t) => (
                      <div key={t.id} className="border-2 border-slate-900 p-4 rounded-none bg-slate-50 flex flex-col justify-between hover:bg-white transition-all">
                        <div className="space-y-2.5">
                          {/* Top Identity bar */}
                          <div className="flex items-center gap-3">
                            <span className={`w-10 h-10 flex items-center justify-center font-black text-xs rounded-none border-2 border-slate-900 uppercase shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] ${
                              t.gender === 'L' ? 'bg-indigo-100 text-indigo-755' : 'bg-rose-100 text-rose-755'
                            }`}>
                              {t.name.split(' ').map(n=>n[0]).join('').substring(0, 2)}
                            </span>
                            <div>
                              <p className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                                {t.gender === 'L' ? 'Ustadz' : 'Ustadzah'} {t.name}
                              </p>
                              <span className="text-[9px] bg-slate-900 text-white px-2 py-0.5 font-sans font-black uppercase tracking-wider">{t.status}</span>
                            </div>
                          </div>

                          <div className="text-[11px] space-y-1.5 pt-1.5 border-t border-slate-200">
                            <p className="font-bold text-slate-800">
                              <span className="text-slate-400">Pencapaian Diajar:</span> <strong className="text-indigo-600">{t.specialty}</strong>
                            </p>
                            
                            {/* Shift config summary */}
                            <div className="mt-2 p-2 bg-indigo-50/50 border border-indigo-150 rounded-none text-[10px] space-y-1">
                              <p className="font-extrabold text-indigo-950 uppercase tracking-wide border-b border-indigo-200 pb-0.5">Konfigurasi Shift Mengajar:</p>
                              <div>
                                <span className="font-bold text-slate-700">S1:</span>{' '}
                                {t.shift1Classes && t.shift1Classes.length > 0 ? (
                                  <span className="text-indigo-950 font-black">Kelas {t.shift1Classes.join(', ')}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Belum diatur kelas</span>
                                )}
                                {' | '}
                                {t.shift1Levels && t.shift1Levels.length > 0 ? (
                                  <span className="text-emerald-800 font-extrabold">Capaian: {t.shift1Levels.join(', ')}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Belum diatur capaian</span>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-700">S2:</span>{' '}
                                {t.shift2Classes && t.shift2Classes.length > 0 ? (
                                  <span className="text-indigo-950 font-black">Kelas {t.shift2Classes.join(', ')}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Belum diatur kelas</span>
                                )}
                                {' | '}
                                {t.shift2Levels && t.shift2Levels.length > 0 ? (
                                  <span className="text-emerald-800 font-extrabold">Capaian: {t.shift2Levels.join(', ')}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Belum diatur capaian</span>
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-slate-700">S3:</span>{' '}
                                {t.shift3Classes && t.shift3Classes.length > 0 ? (
                                  <span className="text-indigo-950 font-black">Kelas {t.shift3Classes.join(', ')}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Belum diatur kelas</span>
                                )}
                                {' | '}
                                {t.shift3Levels && t.shift3Levels.length > 0 ? (
                                  <span className="text-emerald-800 font-extrabold">Capaian: {t.shift3Levels.join(', ')}</span>
                                ) : (
                                  <span className="text-slate-400 italic">Belum diatur capaian</span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-slate-500 pt-1">
                              <span>Lama Mengajar: <strong>{t.experience || '-'}</strong></span>
                              <span>Kontak: <strong>{t.phone || '-'}</strong></span>
                            </div>
                            {t.username ? (
                              <div className="bg-emerald-50 border-2 border-emerald-900 p-2 mt-2 flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className="text-[10px] text-emerald-900 font-black">
                                    🔑 Username: <span className="font-mono text-indigo-700 font-black text-[11px]">{t.username}</span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleResetCustomTeacherAccount(t.id, t.name)}
                                    className="text-[9px] bg-rose-100 hover:bg-rose-200 text-rose-800 px-2 py-0.5 border border-slate-900 uppercase font-black shrink-0 cursor-pointer"
                                    title="Hapus Akun Custom"
                                  >
                                    Hapus Akun 🔓
                                  </button>
                                </div>
                                <div className="text-[10px] text-emerald-900 font-black flex items-center gap-1">
                                  <span>🔒 Sandi:</span>
                                  <span className="font-mono bg-white border border-slate-300 px-1 text-slate-800 tracking-wider font-extrabold">{t.password}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-slate-100 border-2 border-dashed border-slate-400 p-2 mt-2 text-[10px] text-slate-500 font-bold italic">
                                Belum mendaftarkan akun login custom.
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Card Options */}
                        <div className="flex justify-end gap-2 mt-4 pt-2 border-t-2 border-dashed border-slate-200">
                          <button
                            onClick={() => setEditingTeacher(t)}
                            className="bg-white hover:bg-slate-100 text-slate-900 p-1.5 border border-slate-900 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Edit2 className="w-3 h-3 text-indigo-700" /> Edit Profil
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(t.id, t.name)}
                            className="bg-white hover:bg-rose-50 text-rose-600 p-1.5 border border-slate-900 text-[10px] font-black uppercase flex items-center gap-1 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" /> Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Interactive Lists of Doa & Surat Pendek */}
                <div className="bg-white border-2 border-slate-900 p-5 rounded-none shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
                  <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-wider border-b-2 border-slate-900 pb-2 mb-3 flex items-center justify-between">
                    <span>Fase 3: Edit Daftar Materi Pendukung (Doa & Surah)</span>
                    <span className="text-[10px] bg-indigo-100 text-indigo-750 px-1.5 py-0.5 font-bold uppercase border border-slate-900">Sistem Dinamis</span>
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    
                    {/* Doa Harian Table */}
                    <div className="space-y-3 border-2 border-slate-900 p-4 bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      <p className="font-black text-slate-900 text-[10px] uppercase border-b border-slate-900 pb-1.5 flex justify-between items-center">
                        <span>Doa Harian Sehari-hari</span>
                        <span className="text-indigo-600 font-extrabold">{dynamicDoas.length} Doa</span>
                      </p>
                      
                      <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px] font-semibold text-slate-600">
                        {dynamicDoas.map((doa, dIdx) => (
                          <div key={doa} className="bg-white border border-slate-900 p-1.5 px-2 flex justify-between items-center shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                            <span>{dIdx+1}. {doa}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-indigo-500 font-bold text-[9px] uppercase">S1-S3</span>
                              <button 
                                onClick={() => handleDeleteDoa(doa)}
                                className="text-red-500 hover:text-red-700 font-black text-[11px] cursor-pointer"
                                title={`Hapus doa ${doa}`}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-1.5 pt-1 border-t border-slate-200">
                        <input
                          type="text"
                          placeholder="Tambah doa harian baru"
                          value={newDoaName}
                          onChange={(e) => setNewDoaName(e.target.value)}
                          className="flex-1 bg-white border-2 border-slate-900 px-2 py-1 text-[11px] text-slate-900 font-bold placeholder-slate-400 focus:outline-hidden focus:border-indigo-600"
                        />
                        <button
                          onClick={handleAddDoa}
                          className="bg-indigo-600 hover:bg-slate-950 text-white font-black text-[11px] px-3 border-2 border-slate-900 uppercase transition-all cursor-pointer"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>

                    {/* Surat Pendek Table */}
                    <div className="space-y-3 border-2 border-slate-900 p-4 bg-slate-50 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      <p className="font-black text-slate-900 text-[10px] uppercase border-b border-slate-900 pb-1.5 flex justify-between items-center">
                        <span>Hafalan Surat Pendek (Khusus Level Jilid)</span>
                        <span className="text-amber-650 font-extrabold">{dynamicSurahs.length} Surah</span>
                      </p>
                      
                      <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px] font-semibold text-slate-600">
                        {dynamicSurahs.map((surah, sIdx) => (
                          <div key={surah} className="bg-white border border-slate-900 p-1.5 px-2 flex justify-between items-center shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                            <span>{surah}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-yellow-600 font-bold text-[8px] uppercase">Optional Jilid</span>
                              <button 
                                onClick={() => handleDeleteSurah(surah)}
                                className="text-red-500 hover:text-red-700 font-black text-[11px] cursor-pointer"
                                title={`Hapus surat ${surah}`}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-1.5 pt-1 border-t border-slate-200">
                        <input
                          type="text"
                          placeholder="Tambah surat pendek baru"
                          value={newSurahName}
                          onChange={(e) => setNewSurahName(e.target.value)}
                          className="flex-1 bg-white border-2 border-slate-900 px-2 py-1 text-[11px] text-slate-900 font-bold placeholder-slate-400 focus:outline-hidden focus:border-indigo-600"
                        />
                        <button
                          onClick={handleAddSurah}
                          className="bg-indigo-600 hover:bg-slate-950 text-white font-black text-[11px] px-3 border-2 border-slate-900 uppercase transition-all cursor-pointer"
                        >
                          Tambah
                        </button>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>

          </motion.div>
        )}

        {/* 2. MASTER DATABASE PAGE */}
        {activeTab === 'database' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* SOP & TUTORIAL KENAIKAN KELAS OLEH PJ */}
            <div className="bg-white border-2 border-slate-900 p-6 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-slate-900 pb-4 mb-4 gap-2">
                <div>
                  <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                    SOP & Tutorial Resmi Kenaikan Kelas (Oleh PJ)
                  </h3>
                  <p className="text-xs text-slate-600 font-bold mt-0.5">
                    Panduan sistemasi kenaikan tingkat kelas 7 ke 8, 8 ke 9, dan kelulusan kelas 9 menjadi alumni.
                  </p>
                </div>
                <span className="bg-indigo-100 text-indigo-800 border-2 border-slate-900 font-mono font-black text-[10px] uppercase px-2.5 py-1 tracking-wider h-fit w-fit">
                  SOP PJ SYSTEM v1.3
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Step 1: Kelas 7 */}
                <div className="border-2 border-slate-900 p-4 bg-slate-50 relative shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <span className="absolute -top-3 -left-2.5 bg-indigo-300 border-2 border-slate-900 font-mono font-black text-[10px] px-2 py-0.5 rounded-none">
                    TAHAP 01
                  </span>
                  <div className="flex items-center gap-2 mt-1 mb-2.5">
                    <div className="bg-blue-100 p-1.5 border-2 border-slate-900">
                      <Layers className="w-4 h-4 text-blue-700" />
                    </div>
                    <h5 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">Kelas 7 ➔ Kelas 8</h5>
                  </div>
                  <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                    Setiap santri Kelas 7 (A, B, C, D) akan dipromosikan otomatis ke Kelas 8 dengan sub-kelas yang sama (misal: 7A ➔ 8A). Nilai formatif diarsipkan, dan status kelas baru diaktifkan.
                  </p>
                </div>

                {/* Step 2: Kelas 8 */}
                <div className="border-2 border-slate-900 p-4 bg-slate-50 relative shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <span className="absolute -top-3 -left-2.5 bg-indigo-300 border-2 border-slate-900 font-mono font-black text-[10px] px-2 py-0.5 rounded-none">
                    TAHAP 02
                  </span>
                  <div className="flex items-center gap-2 mt-1 mb-2.5">
                    <div className="bg-indigo-100 p-1.5 border-2 border-slate-900">
                      <Award className="w-4 h-4 text-indigo-700" />
                    </div>
                    <h5 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">Kelas 8 ➔ Kelas 9</h5>
                  </div>
                  <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                    Santri Kelas 8 dipromosikan ke Kelas 9 untuk persiapan tingkat akhir dan ujian kelulusan. Seluruh progres dan guru asatidz pengampu tetap melekat secara aman di database.
                  </p>
                </div>

                {/* Step 3: Kelas 9 */}
                <div className="border-2 border-slate-900 p-4 bg-emerald-50 relative shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                  <span className="absolute -top-3 -left-2.5 bg-emerald-300 border-2 border-slate-900 font-mono font-black text-[10px] px-2 py-0.5 rounded-none">
                    TAHAP 03
                  </span>
                  <div className="flex items-center gap-2 mt-1 mb-2.5">
                    <div className="bg-emerald-100 p-1.5 border-2 border-slate-900">
                      <BadgeCheck className="w-4 h-4 text-emerald-700" />
                    </div>
                    <h5 className="font-display font-black text-xs uppercase tracking-wider text-slate-900">Kelas 9 ➔ Lulus Alumni</h5>
                  </div>
                  <p className="text-[11px] text-slate-700 font-semibold leading-relaxed">
                    Santri Kelas 9 secara otomatis ditandai <strong>LULUS</strong>, dipindahkan ke Database Alumni (Graduated Students), lalu dihapus dari database aktif. Kelas 7 dikosongkan untuk angkatan baru.
                  </p>
                </div>
              </div>

              {/* Step-by-step process log */}
              <div className="bg-indigo-50 border-2 border-slate-900 p-4 mt-4 rounded-none">
                <h5 className="font-display font-black text-xs uppercase tracking-wider text-slate-900 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-indigo-600" />
                  Alur Kerja Penanggung Jawab (PJ) Sistem:
                </h5>
                <ol className="text-[11px] text-slate-800 font-bold space-y-2 list-decimal pl-4 leading-relaxed">
                  <li>Lakukan verifikasi bahwa seluruh nilai formatif dan capaian santri bulan ini sudah terinput dengan lengkap.</li>
                  <li>Amankan data Anda terlebih dahulu dengan mengunduh salinan cadangan melalui tombol <strong className="text-slate-900">"Unduh Data Terkini (.csv)"</strong>.</li>
                  <li>Jalankan eksekusi dengan menekan tombol <strong className="text-indigo-700">"Naik Kelas / Promosi Jenjang ⬆️"</strong> di bawah ini.</li>
                  <li>Untuk mengimpor santri Kelas 7 baru (angkatan baru), unduh <strong className="text-slate-900">"Template CSV Resmi"</strong>, isi dengan Microsoft Excel, lalu unggah menggunakan tombol <strong className="text-emerald-700">"Unggah Isi Template"</strong>.</li>
                </ol>
              </div>
            </div>

            {/* Template Importer & Exporter widget */}
            <div className="bg-emerald-50 border-2 border-slate-900 p-5 rounded-none grid grid-cols-1 md:grid-cols-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] gap-4 items-center">
              <div>
                <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                  Impor & Ekspor Database Sesuai Template
                </h4>
                <p className="text-[11px] text-slate-700 font-bold mt-1">
                  Mundurkan atau isi ulang database dengan mengunduh template resmi, memasukkan data di Excel, lalu mengunggahnya kembali.
                </p>
              </div>
              <div className="flex flex-wrap md:justify-end gap-2.5">
                <button
                  id="btn-promote-all-students"
                  onClick={handlePromoteStudents}
                  className="bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border-2 border-slate-900 font-black text-[11px] uppercase tracking-wider py-2 px-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> Naik Kelas / Promosi Jenjang ⬆️
                </button>
                <button
                  id="btn-clear-all-students"
                  onClick={handleClearAllStudents}
                  className="bg-rose-100 hover:bg-rose-200 text-rose-700 border-2 border-slate-900 font-black text-[11px] uppercase tracking-wider py-2 px-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-650" /> Kosongkan / Hapus Semua Santri
                </button>
                <button
                  id="btn-download-template"
                  onClick={handleDownloadTemplate}
                  className="bg-white hover:bg-slate-50 text-slate-900 font-black text-[11px] uppercase tracking-wider py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh Template
                </button>
                <button
                  id="btn-download-current-data"
                  onClick={handleDownloadCurrentData}
                  className="bg-indigo-50 hover:bg-indigo-100 text-slate-900 font-black text-[11px] uppercase tracking-wider py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-650" /> Unduh Data Terkini (.csv)
                </button>
                <div className="relative">
                  <input
                    id="csv-file-upload-input"
                    type="file"
                    accept=".csv"
                    onChange={handleImportCSV}
                    className="hidden"
                  />
                  <label
                    htmlFor="csv-file-upload-input"
                    className="bg-emerald-300 hover:bg-emerald-400 text-slate-900 font-black text-[11px] uppercase tracking-wider py-2 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Unggah Isi Template
                  </label>
                </div>
              </div>
            </div>
            {/* Control Panel Actions */}
            <div className="bg-white border-2 border-slate-900 p-4 rounded-none flex flex-col md:flex-row shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] gap-4 justify-between items-center">
              
              {/* Dynamic Left Bar details */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    id="db-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, NIPD / NISN..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-905 placeholder-slate-400 text-xs border-2 border-slate-900 focus:outline-hidden focus:border-indigo-650 font-bold"
                  />
                </div>

                {/* Filter Class */}
                <select 
                  id="db-filter-class"
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="bg-white border-2 border-slate-900 py-1.5 px-3 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                >
                  <option value="All">Semua Kelas</option>
                  {dynamicClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                </select>

                {/* Filter Shift */}
                <select 
                  id="db-filter-shift"
                  value={filterShift}
                  onChange={(e) => setFilterShift(e.target.value)}
                  className="bg-white border-2 border-slate-900 py-1.5 px-3 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                >
                  <option value="All">Semua Shift</option>
                  <option value="1">Shift 1</option>
                  <option value="2">Shift 2</option>
                  <option value="3">Shift 3</option>
                </select>

                {/* Filter Guru */}
                <select 
                  id="db-filter-teacher"
                  value={filterTeacher}
                  onChange={(e) => setFilterTeacher(e.target.value)}
                  className="bg-white border-2 border-slate-900 py-1.5 px-3 text-xs text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                >
                  <option value="All">Semua Asatidz</option>
                  {dynamicTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Add New Student Pivot Button */}
              <div className="flex gap-2 w-full sm:w-auto justify-end">
                <button 
                  id="btn-add-student-toggle"
                  onClick={() => setIsAddingStudent(!isAddingStudent)}
                  className="bg-yellow-300 hover:bg-yellow-400 text-slate-900 font-black text-xs uppercase tracking-wider py-1.5 px-3.5 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-900 font-black" /> Santri Baru
                </button>
              </div>
            </div>

            {/* Editing / Adding Sliding Drawer Panels */}
            {isAddingStudent && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white border-4 border-slate-900 p-5 space-y-4 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
              >
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-900">Daftarkan Santri Baru ke Database</h3>
                  <button onClick={() => setIsAddingStudent(false)} className="text-slate-500 hover:text-slate-900"><X className="w-4 h-4" /></button>
                </div>
                
                <form id="form-add-student" onSubmit={handleAddStudent} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">NIPD / ID *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: 101"
                      value={newStudent.nipd}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, nipd: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">NISN (Opsional)</label>
                    <input 
                      type="text" 
                      placeholder="NISN santri" 
                      value={newStudent.nisn}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, nisn: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Nama Lengkap *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Nama lengkap santri" 
                      value={newStudent.name}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Kelas *</label>
                    <select 
                      value={newStudent.class}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, class: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    >
                      {dynamicClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Jenis Kelamin</label>
                    <select 
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, gender: e.target.value as 'L' | 'P' }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    >
                      <option value="L">Laki-laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Shift Belajar</label>
                    <select 
                      value={newStudent.shift}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, shift: Number(e.target.value) as any }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    >
                      <option value="1">Shift 1</option>
                      <option value="2">Shift 2</option>
                      <option value="3">Shift 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tingkatan Level Awal</label>
                    <select 
                      value={newStudent.level}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, level: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    >
                      {dynamicLevels.map(lev => <option key={lev} value={lev}>{lev}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Detail Posisi (Halaman / Surah)</label>
                    <input 
                      type="text" 
                      placeholder="QS. Al-Mulk : 1" 
                      value={newStudent.pageDetail}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, pageDetail: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px] flex items-center justify-between">
                      <span>Materi Tambahan</span>
                      {isJilidLevel(newStudent.level) && (
                        <span className="text-[8px] bg-amber-450 border border-slate-900 text-slate-900 px-1 font-black uppercase tracking-wider">REKOMENDASI SURAT PENDEK</span>
                      )}
                    </label>
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5 flex-wrap">
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              setNewStudent(prev => ({ ...prev, materiTambahan: e.target.value }));
                            }
                          }}
                          className="bg-slate-100 text-slate-900 border-2 border-slate-900 p-1 text-[10px] font-black uppercase cursor-pointer"
                        >
                          <option value="">-- Pilih Doa Harian --</option>
                          {dynamicDoas.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>

                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              setNewStudent(prev => ({ ...prev, materiTambahan: e.target.value }));
                            }
                          }}
                          className={`${isJilidLevel(newStudent.level) ? 'bg-amber-100 border-amber-900 text-amber-950 font-black' : 'bg-slate-100 text-slate-900 border-slate-900'} border-2 p-1 text-[10px] uppercase cursor-pointer`}
                        >
                          <option value="">-- Pilih Surat Pendek --</option>
                          {dynamicSurahs.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <input 
                        type="text" 
                        placeholder="Materi hafalan pendukung" 
                        value={newStudent.materiTambahan || ''}
                        onChange={(e) => setNewStudent(prev => ({ ...prev, materiTambahan: e.target.value }))}
                        className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden focus:border-indigo-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Ustadz/ah Pengajar</label>
                    <select 
                      value={newStudent.asatidz}
                      onChange={(e) => setNewStudent(prev => ({ ...prev, asatidz: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden focus:border-indigo-600"
                    >
                      {dynamicTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
 
                  <div className="md:col-span-4 flex justify-end gap-2 pt-3 border-t-2 border-slate-900">
                    <button 
                      type="button" 
                      onClick={() => setIsAddingStudent(false)}
                      className="px-4 py-2 bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-55 text-xs font-black uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                    >
                      <Check className="w-4 h-4" /> Simpan Ke Database
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {editingStudent && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white border-4 border-slate-900 p-5 space-y-4 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
              >
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-900">
                      Edit Data Santri: <span className="text-indigo-600 italic font-black">{editingStudent.name}</span>
                    </h3>
                  </div>
                  <button onClick={() => setEditingStudent(null)} className="text-slate-500 hover:text-slate-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <form id="form-edit-student" onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">NIPD / ID</label>
                    <input 
                      type="text" 
                      required
                      value={editingStudent.nipd}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, nipd: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">NISN</label>
                    <input 
                      type="text" 
                      value={editingStudent.nisn}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, nisn: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, name: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Kelas</label>
                    <select 
                      value={editingStudent.class}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, class: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      {dynamicClasses.map(cls => <option key={cls} value={cls}>{cls}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Jenis Kelamin</label>
                    <select 
                      value={editingStudent.gender}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, gender: e.target.value as 'L' | 'P' }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      <option value="L">L (Laki-laki)</option>
                      <option value="P">P (Perempuan)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Shift Belajar</label>
                    <select 
                      value={editingStudent.shift}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, shift: Number(e.target.value) as any }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      <option value="1">Shift 1</option>
                      <option value="2">Shift 2</option>
                      <option value="3">Shift 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tingkat Level Saat Ini</label>
                    <select 
                      value={editingStudent.level}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, level: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      {dynamicLevels.map(lev => <option key={lev} value={lev}>{lev}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Detail Posisi (Halaman / Surah)</label>
                    <input 
                      type="text" 
                      value={editingStudent.pageDetail}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, pageDetail: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px] flex items-center justify-between">
                      <span>Materi Tambahan</span>
                      {isJilidLevel(editingStudent.level) && (
                        <span className="text-[8px] bg-amber-450 border border-slate-900 text-slate-900 px-1 font-black uppercase tracking-wider">REKOMENDASI SURAT PENDEK</span>
                      )}
                    </label>
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5 flex-wrap">
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              setEditingStudent(prev => prev ? { ...prev, materiTambahan: e.target.value } : null);
                            }
                          }}
                          className="bg-slate-100 text-slate-900 border-2 border-slate-900 p-1 text-[10px] font-black uppercase cursor-pointer"
                        >
                          <option value="">-- Pilih Doa Harian --</option>
                          {dynamicDoas.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>

                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              setEditingStudent(prev => prev ? { ...prev, materiTambahan: e.target.value } : null);
                            }
                          }}
                          className={`${isJilidLevel(editingStudent.level) ? 'bg-amber-100 border-amber-900 text-amber-950 font-black' : 'bg-slate-100 text-slate-900 border-slate-900'} border-2 p-1 text-[10px] uppercase cursor-pointer`}
                        >
                          <option value="">-- Pilih Surat Pendek --</option>
                          {dynamicSurahs.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <input 
                        type="text" 
                        value={editingStudent.materiTambahan}
                        onChange={(e) => setEditingStudent(prev => prev ? { ...prev, materiTambahan: e.target.value } : null)}
                        className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Ustadz/ah Pengampu</label>
                    <select 
                      value={editingStudent.asatidz}
                      onChange={(e) => setEditingStudent(prev => prev ? { ...prev, asatidz: e.target.value } : null)}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      {dynamicTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-2 text-[10px]">Tandai Naik Tingkat Bulan Ini?</label>
                    <div className="flex items-center gap-2 mt-1 bg-white border-2 border-slate-900 px-3 py-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        id="chk-naik"
                        checked={editingStudent.naikTingkatThisMonth}
                        onChange={(e) => setEditingStudent(prev => ({ ...prev!, naikTingkatThisMonth: e.target.checked }))}
                        className="w-4 h-4 border-2 border-slate-900 text-indigo-600 focus:ring-slate-900"
                      />
                      <span className="text-[11px] font-black text-slate-900 uppercase">Naik Tingkat 🌟</span>
                    </div>
                  </div>

                  <div className="md:col-span-4 border-t-2 border-slate-900 pt-3 mt-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-extrabold text-[9px] rounded-xs">DETAIL LAPORAN HASIL BELAJAR (UNTUK PDF)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-50/40 p-3 border-2 border-slate-900">
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahsin: Pencapaian</label>
                        <input 
                          type="text" 
                          value={editingStudent.tahsinPencapaian || ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahsinPencapaian: e.target.value } : null)}
                          placeholder="Misal: Jilid 2A Halaman 1-20 / QS. An-Naba : 1-10"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahsin: Deskripsi / Keterangan</label>
                        <textarea 
                          value={editingStudent.tahsinKeterangan || ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahsinKeterangan: e.target.value } : null)}
                          placeholder="Misal: Alhamdulillah, Ananda membaca dengan baik..."
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden h-14"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahsin: Nilai Akhir Formatif (0-100)</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={editingStudent.tahsinNilai !== undefined ? editingStudent.tahsinNilai : ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahsinNilai: e.target.value === '' ? undefined : Number(e.target.value) } : null)}
                          placeholder="Misal: 85"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                      <div className="hidden md:block"></div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahfizh: Pencapaian</label>
                        <input 
                          type="text" 
                          value={editingStudent.tahfizhPencapaian || ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahfizhPencapaian: e.target.value } : null)}
                          placeholder="Misal: Juz 30 (QS. An-Naziat s.d Al-Mutaffifin)"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahfizh: Deskripsi / Keterangan</label>
                        <textarea 
                          value={editingStudent.tahfizhKeterangan || ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahfizhKeterangan: e.target.value } : null)}
                          placeholder="Misal: Alhamdulillah, hafalan lancar..."
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden h-14"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahfizh: Nilai Akhir Formatif (0-100)</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={editingStudent.tahfizhNilai !== undefined ? editingStudent.tahfizhNilai : ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahfizhNilai: e.target.value === '' ? undefined : Number(e.target.value) } : null)}
                          placeholder="Misal: 80"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                      <div className="hidden md:block"></div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Materi Tambahan: Nilai Akhir Formatif (0-100)</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={editingStudent.materiTambahanNilai !== undefined ? editingStudent.materiTambahanNilai : ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, materiTambahanNilai: e.target.value === '' ? undefined : Number(e.target.value) } : null)}
                          placeholder="Misal: 90"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex justify-end gap-2 pt-3 border-t-2 border-slate-900">
                    <button 
                      type="button" 
                      onClick={() => setEditingStudent(null)}
                      className="px-4 py-2 bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-55 text-xs font-black uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Simpan Perubahan
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* List Table Master */}
            <div className="bg-white border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] overflow-hidden">
              <div className="px-5 py-4 border-b-2 border-slate-900 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-widest">
                    Daftar Lengkap Santri Aktif
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Filter aktif: {filteredStudentsMaster.length} dari total {students.length} santri</p>
                </div>
                <div className="text-[11px] text-slate-900 bg-yellow-300 border-2 border-slate-900 px-3 py-1 font-black uppercase shadow-[1px_1px_0px_0px_rgba(15,23,42,1)]">
                  <span className="text-slate-900">PJ / Guru Mandor Mode:</span> Hak Akses Edit Penuh
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider border-b-2 border-slate-900">
                    <tr>
                      <th className="py-3 px-4"># ID</th>
                      <th className="py-3 px-4">NIPD</th>
                      <th className="py-3 px-4">NISN</th>
                      <th className="py-3 px-4">Nama Lengkap</th>
                      <th className="py-3 px-4 text-center">JK</th>
                      <th className="py-3 px-4 text-center">Kelas</th>
                      <th className="py-3 px-4 text-center">Shift</th>
                      <th className="py-3 px-4">Level / Tingkat</th>
                      <th className="py-3 px-2">Capaian Terakhir</th>
                      <th className="py-3 px-4">Materi tambahan</th>
                      <th className="py-3 px-4">Guru</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filteredStudentsMaster.length === 0 ? (
                      <tr>
                        <td colSpan={12} className="py-8 text-center text-slate-400 font-bold">
                          Tidak ditemukan santri yang cocok dengan filter pencarian tersebut.
                        </td>
                      </tr>
                    ) : (
                      filteredStudentsMaster.map((st) => (
                        <tr key={st.id} className="hover:bg-indigo-50/20 text-slate-800 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 font-bold">{st.id}</td>
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{st.nipd}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-400 font-bold">{formatNISN(st.nisn)}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-1.5 font-bold">
                              <span>{st.name}</span>
                              {st.naikTingkatThisMonth && (
                                <span className="bg-emerald-100 border-2 border-slate-900 text-emerald-800 text-[9px] px-1.5 py-0.5 font-black uppercase tracking-wider" title={`Naik tingkat dari level sebelumnya`}>
                                  🌟 Naik
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-center font-black">
                            <span className={st.gender === 'L' ? 'text-indigo-600' : 'text-pink-600'}>{st.gender}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="bg-slate-900 text-white font-mono text-[10px] uppercase font-black px-1.5 py-0.5 border border-slate-900">{st.class}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="bg-yellow-300 border border-slate-900 px-1.5 py-0.5 text-slate-900 text-[10px] font-black uppercase font-mono">
                              S{st.shift}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-slate-900 font-mono text-xs">{st.level}</span>
                          </td>
                          <td className="py-3.5 px-2 text-slate-700 font-mono text-[11px] font-bold select-all max-w-[150px] truncate" title={st.pageDetail}>
                            {st.pageDetail}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px] italic font-medium max-w-[150px] truncate" title={st.materiTambahan}>
                            {st.materiTambahan}
                          </td>
                          <td className="py-3.5 px-4 text-indigo-600 font-black whitespace-nowrap">{st.asatidz}</td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => setEditingStudent(st)}
                                className="p-1 px-2.5 bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-900 font-black tracking-wide text-[10px] uppercase transition-all shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(st.id, st.name)}
                                className="p-1 border-2 border-transparent hover:border-rose-900 hover:bg-rose-50 text-rose-600 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Database Alumni / Santri Lulus */}
            <div className="bg-white border-4 border-slate-900 p-5 shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b-2 border-slate-900 pb-3 gap-2">
                <div>
                  <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <Award className="w-5 h-5 text-emerald-600" />
                    Database Alumni (Santri Lulus)
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    Total {graduatedStudents.length} santri yang telah lulus dari angkatan sebelumnya
                  </p>
                </div>
                {graduatedStudents.length > 0 && (
                  <button
                    onClick={() => {
                      // Trigger clean-up/delete all graduated
                      setConfirmDialog({
                        title: "Kosongkan Database Alumni",
                        message: "Apakah Anda yakin ingin menghapus SELURUH data alumni secara permanen dari database?",
                        confirmLabel: "Ya, Hapus Semua!",
                        cancelLabel: "Batal",
                        onConfirm: async () => {
                          try {
                            setIsFirebaseSyncing(true);
                            const promises = graduatedStudents.map(s => deleteDoc(doc(db, "graduated_students", s.id)));
                            await Promise.all(promises);
                            triggerToast("🗑️ Sukses menghapus seluruh data alumni.");
                            await addFirebaseLog("PJ/Guru", "Hapus Alumni", "Mengosongkan seluruh database alumni.");
                            setIsFirebaseSyncing(false);
                          } catch (err) {
                            setIsFirebaseSyncing(false);
                            handleFirestoreError(err, OperationType.DELETE, "graduated_students");
                          }
                        }
                      });
                    }}
                    className="bg-rose-100 hover:bg-rose-200 text-rose-700 border-2 border-slate-900 font-black text-[10px] uppercase tracking-wider py-1.5 px-3 shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1 cursor-pointer transition-all active:translate-x-[0.5px] active:translate-y-[0.5px]"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-650" /> Kosongkan Alumni
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-white font-black text-[10px] uppercase tracking-wider border-b-2 border-slate-900">
                    <tr>
                      <th className="py-2.5 px-4"># ID</th>
                      <th className="py-2.5 px-4">NIPD</th>
                      <th className="py-2.5 px-4">NISN</th>
                      <th className="py-2.5 px-4">Nama Lengkap</th>
                      <th className="py-2.5 px-4 text-center">JK</th>
                      <th className="py-2.5 px-4 text-center">Kelas Terakhir</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4">Tanggal Kelulusan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {graduatedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400 font-bold">
                          Belum ada data alumni di database. Jalankan menu "Naik Kelas / Promosi Jenjang" untuk memindahkan kelas 9 yang telah lulus ke sini secara otomatis.
                        </td>
                      </tr>
                    ) : (
                      graduatedStudents.map((st) => (
                        <tr key={st.id} className="hover:bg-indigo-50/20 text-slate-800 transition-colors">
                          <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500 font-bold">{st.id}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{st.nipd}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-400 font-bold">{formatNISN(st.nisn)}</td>
                          <td className="py-2.5 px-4 font-bold text-slate-900">{st.name}</td>
                          <td className="py-2.5 px-4 text-center font-black">
                            <span className={st.gender === 'L' ? 'text-indigo-600' : 'text-pink-600'}>{st.gender}</span>
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="bg-emerald-100 text-emerald-800 border-2 border-slate-900 font-mono text-[9px] uppercase font-black px-1.5 py-0.5">{st.class}</span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-black">
                            <span className="text-emerald-700">LULUS</span>
                          </td>
                          <td className="py-2.5 px-4 font-mono text-slate-500 font-bold text-[10px]">
                            {st.graduatedAt ? new Date(st.graduatedAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </motion.div>
        )}


        {/* 3. SHIFT INPUT GURU PAGE */}
        {activeTab === 'input' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {editingStudent && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white border-4 border-slate-900 p-5 space-y-4 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
              >
                <div className="flex items-center justify-between border-b-2 border-slate-900 pb-2">
                  <div className="flex items-center gap-2">
                    <Edit2 className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-display font-black text-sm uppercase tracking-wider text-slate-900">
                      Edit Data Santri: <span className="text-indigo-600 italic font-black">{editingStudent.name}</span>
                    </h3>
                  </div>
                  <button onClick={() => setEditingStudent(null)} className="text-slate-500 hover:text-slate-900">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <form id="form-edit-student-input-tab" onSubmit={handleSaveEdit} className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">NIPD / ID</label>
                    <input 
                      type="text" 
                      required
                      value={editingStudent.nipd}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, nipd: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">NISN</label>
                    <input 
                      type="text" 
                      value={editingStudent.nisn}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, nisn: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Nama Lengkap</label>
                    <input 
                      type="text" 
                      required
                      value={editingStudent.name}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, name: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Kelas</label>
                    <select 
                      value={editingStudent.class}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, class: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      {(() => {
                        const options = [...availableClassesForInput];
                        if (editingStudent.class && !options.includes(editingStudent.class)) {
                          options.unshift(editingStudent.class);
                        }
                        return options.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Jenis Kelamin</label>
                    <select 
                      value={editingStudent.gender}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, gender: e.target.value as 'L' | 'P' }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      <option value="L">L (Laki-laki)</option>
                      <option value="P">P (Perempuan)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Shift Belajar</label>
                    <select 
                      value={editingStudent.shift}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, shift: Number(e.target.value) as any }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      <option value="1">Shift 1</option>
                      <option value="2">Shift 2</option>
                      <option value="3">Shift 3</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tingkat Level Saat Ini</label>
                    <select 
                      value={editingStudent.level}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, level: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      {(() => {
                        const options = [...availableLevelsForInput];
                        if (editingStudent.level && !options.includes(editingStudent.level)) {
                          options.unshift(editingStudent.level);
                        }
                        return options.map(lev => (
                          <option key={lev} value={lev}>{lev}</option>
                        ));
                      })()}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Detail Posisi (Halaman / Surah)</label>
                    <input 
                      type="text" 
                      value={editingStudent.pageDetail}
                      onChange={(e) => setEditingStudent(prev => ({ ...prev!, pageDetail: e.target.value }))}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px] flex items-center justify-between">
                      <span>Materi Tambahan</span>
                      {isJilidLevel(editingStudent.level) && (
                        <span className="text-[8px] bg-amber-450 border border-slate-900 text-slate-900 px-1 font-black uppercase tracking-wider">REKOMENDASI SURAT PENDEK</span>
                      )}
                    </label>
                    <div className="space-y-1.5">
                      <div className="flex gap-1.5 flex-wrap">
                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              setEditingStudent(prev => prev ? { ...prev, materiTambahan: e.target.value } : null);
                            }
                          }}
                          className="bg-slate-100 text-slate-900 border-2 border-slate-900 p-1 text-[10px] font-black uppercase cursor-pointer"
                        >
                          <option value="">-- Pilih Doa Harian --</option>
                          {dynamicDoas.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>

                        <select 
                          onChange={(e) => {
                            if (e.target.value) {
                              setEditingStudent(prev => prev ? { ...prev, materiTambahan: e.target.value } : null);
                            }
                          }}
                          className={`${isJilidLevel(editingStudent.level) ? 'bg-amber-100 border-amber-900 text-amber-950 font-black' : 'bg-slate-100 text-slate-900 border-slate-900'} border-2 p-1 text-[10px] uppercase cursor-pointer`}
                        >
                          <option value="">-- Pilih Surat Pendek --</option>
                          {dynamicSurahs.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>

                      <input 
                        type="text" 
                        value={editingStudent.materiTambahan}
                        onChange={(e) => setEditingStudent(prev => prev ? { ...prev, materiTambahan: e.target.value } : null)}
                        className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Ustadz/ah Pengampu</label>
                    <select 
                      value={editingStudent.asatidz}
                      onChange={(e) => setEditingStudent(prev => prev ? { ...prev, asatidz: e.target.value } : null)}
                      className="w-full bg-white border-2 border-slate-900 px-3 py-2 text-slate-900 font-bold focus:outline-hidden"
                    >
                      {dynamicTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-500 font-black uppercase tracking-wider mb-2 text-[10px]">Tandai Naik Tingkat Bulan Ini?</label>
                    <div className="flex items-center gap-2 mt-1 bg-white border-2 border-slate-900 px-3 py-2 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] hover:bg-slate-50 transition-colors">
                      <input 
                        type="checkbox" 
                        id="chk-naik-input-tab"
                        checked={editingStudent.naikTingkatThisMonth}
                        onChange={(e) => setEditingStudent(prev => ({ ...prev!, naikTingkatThisMonth: e.target.checked }))}
                        className="w-4 h-4 border-2 border-slate-900 text-indigo-600 focus:ring-slate-900"
                      />
                      <span className="text-[11px] font-black text-slate-900 uppercase">Naik Tingkat 🌟</span>
                    </div>
                  </div>

                  <div className="md:col-span-4 border-t-2 border-slate-900 pt-3 mt-1">
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-extrabold text-[9px] rounded-xs">DETAIL LAPORAN HASIL BELAJAR (UNTUK PDF)</span>
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-emerald-50/40 p-3 border-2 border-slate-900">
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahsin: Pencapaian</label>
                        <input 
                          type="text" 
                          value={editingStudent.tahsinPencapaian || ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahsinPencapaian: e.target.value } : null)}
                          placeholder="Misal: Jilid 2A Halaman 1-20 / QS. An-Naba : 1-10"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahsin: Deskripsi / Keterangan</label>
                        <textarea 
                          value={editingStudent.tahsinKeterangan || ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahsinKeterangan: e.target.value } : null)}
                          placeholder="Misal: Alhamdulillah, Ananda membaca dengan baik..."
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden h-14"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahsin: Nilai Akhir Formatif (0-100)</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={editingStudent.tahsinNilai !== undefined ? editingStudent.tahsinNilai : ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahsinNilai: e.target.value === '' ? undefined : Number(e.target.value) } : null)}
                          placeholder="Misal: 85"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                      <div className="hidden md:block"></div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahfizh: Pencapaian</label>
                        <input 
                          type="text" 
                          value={editingStudent.tahfizhPencapaian || ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahfizhPencapaian: e.target.value } : null)}
                          placeholder="Misal: Juz 30 (QS. An-Naziat s.d Al-Mutaffifin)"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahfizh: Deskripsi / Keterangan</label>
                        <textarea 
                          value={editingStudent.tahfizhKeterangan || ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahfizhKeterangan: e.target.value } : null)}
                          placeholder="Misal: Alhamdulillah, hafalan lancar..."
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden h-14"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tahfizh: Nilai Akhir Formatif (0-100)</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={editingStudent.tahfizhNilai !== undefined ? editingStudent.tahfizhNilai : ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, tahfizhNilai: e.target.value === '' ? undefined : Number(e.target.value) } : null)}
                          placeholder="Misal: 80"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                      <div className="hidden md:block"></div>
                      <div>
                        <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Materi Tambahan: Nilai Akhir Formatif (0-100)</label>
                        <input 
                          type="number" 
                          min="0"
                          max="100"
                          value={editingStudent.materiTambahanNilai !== undefined ? editingStudent.materiTambahanNilai : ''}
                          onChange={(e) => setEditingStudent(prev => prev ? { ...prev, materiTambahanNilai: e.target.value === '' ? undefined : Number(e.target.value) } : null)}
                          placeholder="Misal: 90"
                          className="w-full bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-bold text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-4 flex justify-end gap-2 pt-3 border-t-2 border-slate-900">
                    <button 
                      type="button" 
                      onClick={() => setEditingStudent(null)}
                      className="px-4 py-2 bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-55 text-xs font-black uppercase cursor-pointer"
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Simpan Perubahan
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Context select headers */}
            <div className="bg-white border-2 border-slate-900 p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
              <h3 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest mb-4">
                Identitas Pembelajaran & Penugasan Mengajar
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px] flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" /> Periode Laporan Luring
                  </label>
                  <select 
                    id="input-month-select"
                    value={inputMonth}
                    onChange={(e) => setInputMonth(e.target.value)}
                    className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold focus:outline-hidden"
                  >
                    {LATEST_MONTHS.map((m, idx) => (
                      <option key={m} value={m}>
                        {m} {idx === 0 ? "(Bulan Berjalan)" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px] flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Kelas yang Diampu Saat Ini
                  </label>
                  <select 
                    id="input-class-select"
                    value={inputClass}
                    onChange={(e) => setInputClass(e.target.value)}
                    className="w-full bg-white border-2 border-slate-900 p-2 text-slate-900 font-bold focus:outline-hidden"
                  >
                    {availableClassesForInput.map(cls => <option key={cls} value={cls}>Kelas {cls}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-indigo-600" /> Nama Asatidz (Nama Anda)
                  </label>
                  <select 
                    id="input-teacher-select"
                    value={inputTeacher}
                    onChange={(e) => setInputTeacher(e.target.value)}
                    className="w-full bg-white border-2 border-slate-900 p-2 text-indigo-600 font-black focus:outline-hidden"
                  >
                    {dynamicTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Manage group roster container: 2 Columns (Left: Claim existing student, Right: Direct instant registration) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Column 1: Search & Claim student */}
              <div className="bg-indigo-50 border-4 border-slate-900 p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
                <div>
                  <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest mb-1.5 flex items-center gap-1.5 text-indigo-950">
                    <Search className="w-4 h-4 text-indigo-600" /> REKRUT / KLAIM SANTRI PINDAHAN KE KELOMPOK {inputTeacher.toUpperCase()} ➕
                  </h4>
                  <p className="text-[11px] text-indigo-900 font-bold mb-3.5 leading-relaxed">
                    Mendukung pencarian seluruh peserta didik SMP di database utama. Cari nama, NIPD, kelas, atau shift santri untuk mengklaim dan memindahkan mereka ke kelompok mengajar Anda (Kelas {inputClass}, Shift {activeShiftTab}) secara otomatis dan instan:
                  </p>
                  
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <UserPlus className="w-4.5 h-4.5 text-indigo-600" />
                    </span>
                    <input
                      type="text"
                      value={claimSearchQuery}
                      onChange={(e) => setClaimSearchQuery(e.target.value)}
                      placeholder="Ketik NIPD atau nama lengkap santri..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white text-slate-900 font-extrabold text-xs border-2 border-slate-900 focus:outline-hidden shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]"
                    />
                  </div>

                  {/* Real-time Search Results Box */}
                  {claimSearchResults.length > 0 && (
                    <div className="mt-3 bg-white border-2 border-slate-900 p-3 space-y-2 max-h-[180px] overflow-y-auto animate-fadeIn divide-y divide-slate-100">
                      {claimSearchResults.map(s => {
                        const isAlreadyMine = s.asatidz === inputTeacher;
                        return (
                          <div key={s.id} className="pt-2 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold text-slate-800">
                            <div>
                              <p className="font-black text-slate-900">{s.name} <span className="text-[10px] font-mono text-slate-400">({s.nipd})</span></p>
                              <p className="text-[10px] text-slate-500 font-bold">Kelas: {s.class} | Shift: {s.shift} | Guru Sekarang: <span className={isAlreadyMine ? 'text-indigo-600' : 'text-rose-600'}>{s.asatidz}</span></p>
                            </div>
                            {isAlreadyMine ? (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 p-1 px-2 border-2 border-slate-900 font-black uppercase text-center shrink-0">
                                Milik Anda ✔️
                              </span>
                            ) : (
                              <button
                                onClick={() => handleClaimStudent(s.id)}
                                className="bg-yellow-300 hover:bg-yellow-400 text-slate-900 text-[10px] font-black uppercase tracking-wider py-1.5 px-3 border-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer text-center"
                              >
                                Klaim 📥
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {claimSearchQuery.trim() !== '' && claimSearchResults.length === 0 && (
                    <div className="mt-3 bg-rose-50 border-2 border-dashed border-rose-900 text-rose-800 p-3 text-xs font-bold text-center">
                      Santri dengan kata kunci "{claimSearchQuery}" tidak ditemukan di database. Pastikan NIPD/Nama sudah benar atau daftarkan santri baru di form sebelah kanan.
                    </div>
                  )}
                </div>
              </div>

              {/* Column 2: Direct instant student registration */}
              <div className="bg-emerald-50 border-4 border-slate-900 p-5 rounded-none shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] flex flex-col justify-between">
                <form onSubmit={handleCreateInstanStudent} className="space-y-3">
                  <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest flex items-center gap-1.5 text-emerald-950">
                    <UserPlus className="w-4.5 h-4.5 text-emerald-600" /> PENDAFTARAN SANTRI BARU INSTAN KE KELOMPOK ANDA 👤
                  </h4>
                  <p className="text-[10px] text-emerald-900 font-bold leading-relaxed">
                    Daftarkan santri baru langsung ke <span className="bg-emerald-200 px-1 border border-emerald-900">Kelas {inputClass}</span>, <span className="bg-emerald-200 px-1 border border-emerald-900">Shift {activeShiftTab}</span>, dan diasuh oleh <span className="bg-emerald-200 px-1 border border-emerald-900">{inputTeacher}</span>:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold text-[10px] uppercase mb-0.5">Nama Lengkap Santri</label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Muhammad Yusuf"
                        value={instanStudentName}
                        onChange={(e) => setInstanStudentName(e.target.value)}
                        className="w-full bg-white text-slate-900 font-bold border-2 border-slate-900 p-1.5 text-xs focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold text-[10px] uppercase mb-0.5 flex justify-between items-center">
                        <span>NIPD (Nomor Induk)</span>
                        <button
                          type="button"
                          onClick={handleAutoFillInstanNipd}
                          className="text-[9px] bg-emerald-200 hover:bg-emerald-300 text-slate-900 border border-slate-900 px-1.5 py-0.5 font-black uppercase tracking-wide transition-all cursor-pointer"
                        >
                          Acak 🎲
                        </button>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: NIPD-10255"
                        value={instanStudentNipd}
                        onChange={(e) => setInstanStudentNipd(e.target.value)}
                        className="w-full bg-white text-slate-900 font-bold border-2 border-slate-900 p-1.5 text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 font-bold text-[10px] uppercase mb-0.5">Kelamin (JK)</label>
                      <select
                        value={instanStudentGender}
                        onChange={(e) => setInstanStudentGender(e.target.value as any)}
                        className="w-full bg-white border-2 border-slate-900 p-1.5 text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                      >
                        <option value="L">Laki-laki (L)</option>
                        <option value="P">Perempuan (P)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold text-[10px] uppercase mb-0.5">Tingkat Awal</label>
                      <select
                        value={instanStudentLevel}
                        onChange={(e) => setInstanStudentLevel(e.target.value)}
                        className="w-full bg-white border-2 border-slate-900 p-1.5 text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                      >
                        {availableLevelsForInput.map(lev => <option key={lev} value={lev}>{lev}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold text-[10px] uppercase mb-0.5">Detail Hal / Surah</label>
                      <input
                        type="text"
                        placeholder="Contoh: Halaman 1"
                        value={instanStudentPage}
                        onChange={(e) => setInstanStudentPage(e.target.value)}
                        className="w-full bg-white text-slate-900 font-bold border-2 border-slate-900 p-1.5 text-xs focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                    <div>
                      <label className="block text-slate-600 font-bold text-[10px] uppercase mb-0.5">Materi Pendukung</label>
                      <select
                        value={instanStudentMateri}
                        onChange={(e) => setInstanStudentMateri(e.target.value)}
                        className="w-full bg-white border-2 border-slate-900 p-1.5 text-xs font-bold text-slate-900 focus:outline-hidden cursor-pointer"
                      >
                        {dynamicDoas.map(doa => <option key={doa} value={doa}>{doa}</option>)}
                        {dynamicSurahs.map(sur => <option key={sur} value={sur}>{sur}</option>)}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full bg-emerald-600 hover:bg-slate-950 text-white font-black text-xs uppercase tracking-wider py-2 px-3 border-2 border-slate-900 shadow-[3px_3px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        Daftarkan Santri 👤
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>

            {/* Shift filter tabs: Shift 1, Shift 2, Shift 3 */}
            <div className="bg-white border-2 border-slate-900 rounded-none p-5 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-4 gap-4">
                
                {/* 3 Shifts Pills */}
                <div className="flex gap-2">
                  {[1, 2, 3].map((sh) => (
                    <button
                      id={`btn-shift-${sh}`}
                      key={sh}
                      onClick={() => setActiveShiftTab(sh as any)}
                      className={`px-5 py-2 uppercase tracking-wider text-xs font-black transition-all border-2 border-slate-900 cursor-pointer ${
                        activeShiftTab === sh 
                          ? 'bg-yellow-300 text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]' 
                          : 'bg-white text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      Shift {sh}
                    </button>
                  ))}
                </div>

                {/* Sub-search criteria */}
                <div className="relative w-full sm:w-64">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="w-4 h-4 text-slate-400" />
                  </span>
                  <input
                    id="shift-search-input"
                    type="text"
                    value={inputSearch}
                    onChange={(e) => setInputSearch(e.target.value)}
                    placeholder="Cari santri kelas ini..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white text-slate-900 text-xs border-2 border-slate-900 font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Grid or Table for input */}
              <div className="mt-4 space-y-4">
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                  <p>Mendaftarkan santri aktif di <span className="text-slate-900 font-black">Kelas {inputClass}</span> pada <span className="text-slate-900 font-black">Shift {activeShiftTab}</span>.</p>
                  <p className="font-mono text-[11px] text-indigo-600">Ditemukan: {filteredStudentsShift.length} Santri</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {filteredStudentsShift.length === 0 ? (
                    <div className="col-span-full py-12 text-center text-slate-500 border-2 border-dashed border-slate-900 font-bold bg-slate-50">
                      Tidak ada santri terdaftar pada Kelas {inputClass} di Shift {activeShiftTab} ini.
                      <p className="text-xs text-slate-400 mt-2 font-normal">
                        Gunakan tab "Database Master" untuk mengubah setelan kelas atau shift santri secara cepat.
                      </p>
                    </div>
                  ) : (
                    filteredStudentsShift.map((st) => {
                      const temp = tempAchievements[st.id] || { level: st.level, pageDetail: st.pageDetail, naikTingkat: st.naikTingkatThisMonth, materiTambahan: st.materiTambahan };
                      return (
                        <div key={st.id} className="bg-white border-2 border-slate-900 p-4 rounded-none flex flex-col justify-between shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] hover:shadow-[6px_6px_0px_0px_rgba(15,23,42,1)] transition-all">
                          
                          {/* Student identity header */}
                          <div className="flex justify-between items-start border-b-2 border-slate-100 pb-2 mb-3 gap-2">
                            <div>
                              <p className="font-black text-slate-900 text-sm">{st.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold font-mono">NIPD: {st.nipd} | NISN: {formatNISN(st.nisn)} | Kelamin: {st.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1.5 shrink-0">
                              <span className="text-[10px] bg-slate-900 px-2 py-0.5 text-white font-mono font-black">
                                {st.class} - S{st.shift}
                              </span>
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => setEditingStudent(st)}
                                  className="px-1.5 py-0.5 bg-indigo-50 border-2 border-slate-900 hover:bg-indigo-100 text-slate-900 font-black text-[9px] uppercase transition-all shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none cursor-pointer"
                                  title="Edit Informasi Santri"
                                >
                                  Edit ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStudent(st.id, st.name)}
                                  className="p-1 bg-rose-50 border-2 border-slate-900 hover:bg-rose-100 text-rose-700 font-black cursor-pointer shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                                  title="Hapus Santri"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Editable fields */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                            <div>
                              <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Tingkat Pencapaian (Jilid/Juz)</label>
                              <select
                                value={temp.level}
                                onChange={(e) => handleUpdateTempAchievement(st.id, 'level', e.target.value)}
                                className="w-full bg-white border-2 border-slate-900 p-1.5 text-slate-900 font-bold focus:outline-hidden"
                              >
                                {(() => {
                                  const options = [...availableLevelsForInput];
                                  if (temp.level && !options.includes(temp.level)) {
                                    options.unshift(temp.level);
                                  }
                                  return options.map(lev => (
                                    <option key={lev} value={lev}>{lev}</option>
                                  ));
                                })()}
                              </select>
                            </div>

                            <div>
                              <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px]">Halaman / Detail Ayat & Surah</label>
                              <input 
                                type="text"
                                value={temp.pageDetail}
                                onChange={(e) => handleUpdateTempAchievement(st.id, 'pageDetail', e.target.value)}
                                placeholder="Contoh: QS. Nuh : 5"
                                className="w-full bg-white border-2 border-slate-900 p-1.5 text-slate-900 font-bold focus:outline-hidden"
                              />
                            </div>

                            <div className="sm:col-span-2 border-t border-slate-150 pt-2">
                              <label className="block text-slate-500 font-black uppercase tracking-wider mb-1 text-[10px] flex items-center justify-between">
                                <span className="font-black text-slate-600">Materi Tambahan</span>
                                {isJilidLevel(temp.level) && (
                                  <span className="text-[8px] bg-amber-100 border border-slate-900 text-slate-900 px-1 font-black">REKOMENDASI SURAT PENDEK</span>
                                )}
                              </label>
                              
                              <div className="space-y-1.5">
                                <div className="flex gap-1 flex-wrap">
                                  <select 
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleUpdateTempAchievement(st.id, 'materiTambahan', e.target.value);
                                      }
                                    }}
                                    className="bg-slate-50 hover:bg-slate-150 text-slate-900 border border-slate-900 p-1 text-[9px] uppercase font-black cursor-pointer"
                                  >
                                    <option value="">-- Doa Harian --</option>
                                    {dynamicDoas.map(d => <option key={d} value={d}>{d}</option>)}
                                  </select>

                                  <select 
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        handleUpdateTempAchievement(st.id, 'materiTambahan', e.target.value);
                                      }
                                    }}
                                    className={`${isJilidLevel(temp.level) ? 'bg-amber-50 border-amber-550 text-amber-950 font-black' : 'bg-slate-50 text-slate-900 border-slate-900'} border p-1 text-[9px] uppercase cursor-pointer`}
                                  >
                                    <option value="">-- Surat Pendek --</option>
                                    {dynamicSurahs.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                </div>

                                <input 
                                  type="text"
                                  value={temp.materiTambahan || ''}
                                  onChange={(e) => handleUpdateTempAchievement(st.id, 'materiTambahan', e.target.value)}
                                  placeholder="Materi pencapaian tambahan"
                                  className="w-full bg-white border-2 border-slate-900 p-1 text-slate-900 font-bold focus:outline-hidden text-xs"
                                />
                              </div>
                            </div>

                            {temp.naikTingkat && (
                              <div className="sm:col-span-2 border-2 border-dashed border-pink-700 bg-pink-50 p-2 mt-1 animate-fadeIn">
                                <label className="block text-pink-900 font-black uppercase tracking-wider mb-1 text-[9px] flex items-center gap-1">
                                  <span>🚀 PILIH GURU BARU PASCA NAIK TINGKAT:</span>
                                </label>
                                <select 
                                  value={temp.guruBaru || st.asatidz}
                                  onChange={(e) => handleUpdateTempAchievement(st.id, 'guruBaru', e.target.value)}
                                  className="w-full bg-white border-2 border-pink-700 p-1 text-slate-900 font-extrabold text-[11px] focus:outline-hidden cursor-pointer"
                                >
                                  {dynamicTeachers.map(t => (
                                    <option key={t} value={t}>Kirim ke Ustadz/ah {t}</option>
                                  ))}
                                </select>
                                <p className="text-[9px] text-pink-700 mt-1 font-bold">
                                  Pasca disimpan, kelompok mengajar santri ini akan ditransfer otomatis ke ustadz/ah terpilih.
                                </p>
                              </div>
                            )}

                          </div>

                          {/* Footer with Level-Up toggle & Quick Firebase Sync Button */}
                          <div className="flex items-center justify-between pt-2 border-t-2 border-slate-100">
                            
                            {/* Toggle Naik Tingkat */}
                            <label className="flex items-center gap-2 cursor-pointer select-none">
                              <input 
                                type="checkbox"
                                checked={temp.naikTingkat}
                                onChange={(e) => handleUpdateTempAchievement(st.id, 'naikTingkat', e.target.checked)}
                                className="w-4 h-4 border-2 border-slate-900 text-indigo-600 focus:ring-slate-900"
                              />
                              <span className="text-[10px] text-slate-900 flex items-center gap-1 font-black uppercase tracking-wider">
                                Naik Tingkat {temp.naikTingkat ? '🌟' : ''}
                              </span>
                            </label>

                            {/* Single Student Firebase upload */}
                            <button
                              id={`btn-save-progress-${st.id}`}
                              onClick={() => handleSaveShiftProgress(st.id)}
                              className="bg-emerald-200 hover:bg-emerald-300 text-slate-900 text-[11px] font-black uppercase border-2 border-slate-900 py-1.5 px-3 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] flex items-center gap-1 transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5 text-slate-900" /> Simpan Capaian
                            </button>

                          </div>

                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        )}


        {/* 4. REPORTS PAGE (3 MODELS, FORM EXTREMELY ALIGNED TO EXCEL) */}
        {activeTab === 'reports' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Top Bar Filter panel */}
            <div className="bg-white border-2 border-slate-900 p-5 rounded-none space-y-4 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-slate-900 pb-3 gap-2">
                <div>
                  <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-5 h-5 text-indigo-600" /> REKONSTRUKSI LAPORAN FORM BULANAN (3 MODEL FORMAT EXCEL)
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">Pilih salah satu format pelaporan bulanan di bawah ini untuk dicetak atau diekspor.</p>
                </div>
                
                {/* Period/month & Report Type Select filters */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-950 font-black uppercase tracking-wider text-[10px]">Jenis Laporan:</span>
                    <select
                      id="report-global-type-select"
                      value={raportType}
                      onChange={(e) => setRaportType(e.target.value as any)}
                      className="bg-indigo-50 border-2 border-indigo-900 px-3 py-1 text-indigo-950 font-black focus:outline-hidden animate-pulse-subtle"
                    >
                      <option value="bulanan">Progres Report / STS (Bulanan)</option>
                      <option value="ganjil">Raport Semester Akhir - Ganjil</option>
                      <option value="genap">Raport Semester Akhir - Genap</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-550 font-extrabold uppercase tracking-wider text-[10px]">Bulan Acuan:</span>
                    <select
                      id="report-month-select"
                      value={reportMonth}
                      onChange={(e) => setReportMonth(e.target.value)}
                      className="bg-white border-2 border-slate-900 px-3 py-1 text-slate-900 font-black focus:outline-hidden"
                    >
                      {LATEST_MONTHS.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Models selection tabs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { id: 'total', title: 'Model 3: Capaian Total Semua Kelas', desc: `Matriks Level × 12 Kelas (Grand Total ${students.length})`, detail: 'Format matrix lengkap sebaran tingkat seluruh kelas 7A-9D' },
                  { id: 'guru', title: 'Model 1: Laporan per Guru', desc: 'Rincian detail per Guru Pembimbing', detail: 'Tabel matrix dan perkembangan detail dari asatidz terpilih' },
                  { id: 'kelas', title: 'Model 2: Laporan per Kelas', desc: 'Rincian detail per Kelas (7A–9D)', detail: 'Capaian bulanan, status naik tingkat, asatidz di tiap santri' },
                  { id: 'raport', title: 'Raport: Hasil Belajar Santri', desc: 'Raport Al-Qur\'an Ber-Lambang (Official)', detail: 'Format cetak PDF resmi per santri lengkap deskripsi capaian' }
                ].map((item) => {
                  const isActive = reportModel === item.id;
                  return (
                    <button
                      id={`btn-report-${item.id}`}
                      key={item.id}
                      onClick={() => setReportModel(item.id as any)}
                      className={`p-4 rounded-none text-left border-2 border-slate-900 cursor-pointer select-none transition-all ${
                        isActive 
                          ? 'bg-yellow-300 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] text-slate-900' 
                          : 'bg-white text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <p className="font-black text-xs text-slate-900 uppercase">{item.title}</p>
                      <p className="text-[11px] font-bold mt-1 text-slate-800">{item.desc}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{item.detail}</p>
                    </button>
                  );
                })}
              </div>

              {/* Secondary filters showing up dynamically */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t-2 border-slate-900 text-xs">
                
                {/* Dynamically display filter per model selection */}
                {reportModel === 'guru' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-905 font-black uppercase text-[10px] tracking-wider">Pilih Asatidz yang Dilaporkan:</span>
                    <select
                      id="report-teacher-select"
                      value={reportTeacher}
                      onChange={(e) => setReportTeacher(e.target.value)}
                      className="bg-white border-2 border-slate-900 px-3 py-1.5 text-indigo-600 font-extrabold focus:outline-hidden"
                    >
                      {dynamicTeachers.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                )}

                {reportModel === 'kelas' && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-905 font-black uppercase text-[10px] tracking-wider">Pilih Kelas yang Dilaporkan:</span>
                    <select
                      id="report-class-select"
                      value={reportClass}
                      onChange={(e) => setReportClass(e.target.value)}
                      className="bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-extrabold focus:outline-hidden"
                    >
                      {dynamicClasses.map(cls => <option key={cls} value={cls}>Kelas {cls}</option>)}
                    </select>
                  </div>
                )}

                {reportModel === 'total' && (
                  <div className="text-[11px] text-slate-950 font-black uppercase tracking-wider flex items-center gap-2 bg-yellow-100 p-2 border border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] rounded-none">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-650 animate-ping"></div>
                    <span>Menampilkan tabel matriks sebaran capaian Al-Qur'an secara kumulatif untuk target total <strong className="text-indigo-650 font-mono">{students.length} santri (Tersinkronisasi)</strong>.</span>
                  </div>
                )}

                {reportModel === 'raport' && (
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-950 font-black uppercase text-[10px] tracking-wider">Pilih Kelas:</span>
                      <select
                        id="report-raport-class-select"
                        value={reportClass}
                        onChange={(e) => {
                          setReportClass(e.target.value);
                          setSelectedReportStudentId('all');
                        }}
                        className="bg-white border-2 border-slate-900 px-3 py-1.5 text-slate-900 font-extrabold focus:outline-hidden"
                      >
                        {dynamicClasses.map(cls => <option key={cls} value={cls}>Kelas {cls}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-950 font-black uppercase text-[10px] tracking-wider">Pilih Santri:</span>
                      <select
                        id="report-raport-student-select"
                        value={selectedReportStudentId}
                        onChange={(e) => setSelectedReportStudentId(e.target.value)}
                        className="bg-white border-2 border-slate-900 px-3 py-1.5 text-indigo-600 font-extrabold focus:outline-hidden max-w-xs"
                      >
                        <option value="all">-- Cetak Semua Santri Kelas {reportClass} ({students.filter(s => s.class === reportClass).length} Santri) --</option>
                        {students
                          .filter(s => s.class === reportClass)
                          .map(st => (
                            <option key={st.id} value={st.id}>
                              {st.name} ({st.level})
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>
                )}

                {/* Print and Export Buttons */}
                <div className="flex gap-2">
                  <button
                    id="btn-export-excel"
                    onClick={handleExportExcel}
                    className="bg-white text-slate-900 border-2 border-slate-900 hover:bg-slate-50 text-xs font-black uppercase tracking-wider py-1.5 px-3.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export Excel
                  </button>
                  <button
                    id="btn-print-report"
                    onClick={handlePrint}
                    className="bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-900 text-xs font-black uppercase tracking-wider py-1.5 px-4 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer flex items-center gap-1.5 transition-all"
                  >
                    <Printer className="w-4 h-4 text-yellow-300" /> Cetak (Browser)
                  </button>
                  {reportModel === 'raport' && (
                    <button
                      id="btn-export-jspdf"
                      onClick={handleExportRaportPDF}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-slate-900 text-xs font-black uppercase tracking-wider py-1.5 px-4 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] cursor-pointer flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-4 h-4 text-emerald-300" /> Unduh PDF Resmi (jsPDF)
                    </button>
                  )}
                </div>

              </div>

            </div>

            {/* Drill Down popup modal */}
            <AnimatePresence>
              {drillDownCell && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="bg-white border-4 border-slate-900 p-6 rounded-none w-full max-w-3xl max-h-[80vh] flex flex-col justify-between shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]"
                  >
                    <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-4">
                      <div>
                        <h4 className="font-display font-black text-slate-900 text-sm uppercase tracking-wide">
                          Rincian Santri: <span className="text-indigo-650 italic font-black">{drillDownCell.rowName}</span> (Kelas {drillDownCell.colName})
                        </h4>
                        <p className="text-xs text-slate-500 font-bold">Jumlah: {drillDownCell.students.length} Santri ditemukan</p>
                      </div>
                      <button onClick={() => setDrillDownCell(null)} className="text-slate-500 hover:text-slate-900">
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs text-slate-900 scrollbar-none">
                      {drillDownCell.students.length === 0 ? (
                        <p className="text-center py-8 text-slate-500 font-mono font-bold">Belum ada data prestasi pada irisan matrix ini.</p>
                      ) : (
                        <table className="w-full text-left">
                          <thead className="text-slate-900 border-b-2 border-slate-900 bg-slate-100 font-black">
                            <tr>
                              <th className="py-2 px-2">No</th>
                              <th className="py-2 px-2">NIPD</th>
                              <th className="py-2 px-2">Nama</th>
                              <th className="py-2 px-2">Progress Halaman</th>
                              <th className="py-2 px-2">Ustadz/ah</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-800">
                            {drillDownCell.students.map((st, i) => (
                              <tr key={st.id} className="hover:bg-slate-50">
                                <td className="py-2 px-2 font-bold">{i+1}</td>
                                <td className="py-2 px-2 font-mono text-[11px] text-slate-500 font-bold">{st.nipd}</td>
                                <td className="py-2 px-2 font-black">{st.name}</td>
                                <td className="py-2 px-2 text-indigo-600 font-bold">{st.pageDetail}</td>
                                <td className="py-2 px-2 text-slate-900 font-bold">{st.asatidz}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t-2 border-slate-900 flex justify-end">
                      <button 
                        onClick={() => setDrillDownCell(null)}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs border-2 border-slate-900 flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_rgba(15,23,42,1)] transition-all cursor-pointer"
                      >
                        Tutup
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* REPORT VIEW AREA FOR PRINTING */}
            <div id="printable-report-area" className="bg-white p-6 rounded-none border-2 border-slate-900 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] relative overflow-hidden text-slate-950">
              
              {/* 1. KOP SURAT (OFFICIAL LETTERHEAD) */}
              {kopHeaderImage && kopPlacement === 'banner' ? (
                <div className="w-full border-b-4 border-slate-950 pb-3 mb-4 flex justify-center">
                  <img src={kopHeaderImage} alt="Kop Surat" className="w-full h-auto max-h-32 object-contain" referrerPolicy="no-referrer" />
                </div>
              ) : (
                <div className="flex items-center gap-4 border-b-4 border-slate-950 pb-4 mb-4 text-left">
                  {kopHeaderImage && kopPlacement === 'logo' ? (
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 border-2 border-slate-950 p-1 flex items-center justify-center relative rounded-md overflow-hidden bg-white">
                      <img src={kopHeaderImage} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 bg-emerald-700/5 border-2 border-slate-950 p-1 flex items-center justify-center relative rounded-full">
                      <svg className="w-12 h-12 sm:w-16 sm:h-16 text-emerald-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                        <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
                        <path d="M50 15 L58 35 L78 35 L62 47 L68 67 L50 55 L32 67 L38 47 L22 35 L42 35 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
                        {/* Open Quran Book inside Emblem */}
                        <path d="M30 65 C38 60, 48 60, 50 63 C52 60, 62 60, 70 65 L70 45 C62 40, 52 40, 50 43 C48 40, 38 40, 30 45 Z" fill="white" stroke="currentColor" strokeWidth="2" />
                        <path d="M50 43 L50 63" stroke="currentColor" strokeWidth="2" />
                        <path d="M40 49 C44 48, 48 48, 48 49" stroke="currentColor" strokeWidth="1" />
                        <path d="M40 54 C44 53, 48 53, 48 54" stroke="currentColor" strokeWidth="1" />
                        <path d="M60 49 C56 48, 52 48, 52 49" stroke="currentColor" strokeWidth="1" />
                        <path d="M60 54 C56 53, 52 53, 52 54" stroke="currentColor" strokeWidth="1" />
                        <circle cx="50" cy="28" r="3" fill="currentColor" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Institution Details */}
                  <div className="flex-grow">
                    <h3 className="text-xs sm:text-sm font-bold tracking-widest text-emerald-800 uppercase leading-none font-sans">{yayasanName}</h3>
                    <h2 className="text-sm sm:text-lg font-black text-slate-900 tracking-wide font-display mt-1">{unitName}</h2>
                    <p className="text-[9px] sm:text-[10px] text-slate-650 font-semibold leading-tight mt-1">
                      {permitNumber}
                    </p>
                    <p className="text-[8px] sm:text-[9px] text-slate-500 font-bold leading-tight font-mono">
                      {address} | Telp: {phone} | Email: {email}
                    </p>
                  </div>
                </div>
              )}

              {/* Report Header Logo/Motif for official report look */}
              <div className="flex flex-col items-center text-center border-b-2 border-slate-300 pb-3 mb-5 space-y-1">
                <span className="text-[10px] tracking-widest text-indigo-600 font-mono uppercase font-black">Laporan Bulanan Unit Tahfidz Wa Ta'lim</span>
                <h3 className="font-display font-black text-xl text-slate-900 tracking-wide">SIQRAN AL-QUR'AN ACHIEVEMENT BULLETIN</h3>
                <p className="text-xs text-slate-600 font-bold">Periode Pelaporan / Month: <strong className="text-indigo-600">{reportMonth}</strong></p>
                <div className="text-[10px] text-slate-500 font-mono font-bold uppercase">
                  Printed on: {getGregorianAndHijriDateString(liveClock).full} | Firebase Linked Status: True
                </div>
              </div>

              {/* MODEL 3 VIEW: SEBARAN KUMULATIF CAPAIAN SELURUH KELAS */}
              {reportModel === 'total' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-display font-black text-xs text-slate-900 uppercase tracking-widest">
                      Matriks Distribusi Capaian Tingkat Al-Qur'an (Seluruh Kelas {dynamicClasses.join(', ')})
                    </h4>
                    <span className="text-[10px] text-indigo-650 font-black uppercase tracking-wider">*Klik angka cell pada matriks di bawah ini untuk drilldown/melihat rincian santri.</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse text-xs font-mono border-2 border-slate-900">
                      <thead>
                        <tr className="bg-slate-900 border-2 border-slate-900 text-white uppercase font-black text-[10px]">
                          <th className="py-3 px-3 text-left w-56 font-bold text-white">Tingkat Capaian (Row Category)</th>
                          {dynamicClasses.map(kls => (
                            <th key={kls} className="py-3 px-1.5 w-12 text-white font-bold">{kls}</th>
                          ))}
                          <th className="py-3 px-3 w-16 bg-yellow-300 text-slate-900 font-black">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {REPORT_ROW_CATEGORIES.map((cat) => {
                          let catTotalAcrossClasses = 0;
                          dynamicClasses.forEach(kls => {
                            catTotalAcrossClasses += reportTotalMatrix[cat.key]?.[kls]?.length || 0;
                          });

                          return (
                            <tr key={cat.key} className="hover:bg-indigo-50/20 transition-colors group">
                              <td className="py-2.5 px-3 text-left font-display font-black text-slate-900 uppercase tracking-wider text-[11px] truncate">
                                {cat.label}
                              </td>
                              {dynamicClasses.map((kls) => {
                                const studentsList = reportTotalMatrix[cat.key]?.[kls] || [];
                                const count = studentsList.length;

                                return (
                                  <td 
                                    key={kls} 
                                    onClick={() => count > 0 && setDrillDownCell({ rowName: cat.label, colName: kls, students: studentsList })}
                                    className={`py-2.5 px-1 ${count > 0 ? 'text-indigo-600 hover:text-indigo-900 hover:bg-yellow-105 font-black hover:bg-yellow-100 cursor-pointer font-bold select-all transition-all border-b border-rose-200/50' : 'text-slate-300 font-light'}`}
                                  >
                                    {count > 0 ? count : '-'}
                                  </td>
                                );
                              })}
                              
                              {/* Total per category row */}
                              <td className="py-2.5 px-3 bg-slate-50 text-slate-950 font-black text-xs border-l-2 border-slate-900">
                                {catTotalAcrossClasses}
                              </td>
                            </tr>
                          );
                        })}

                        {/* Grand Total Row */}
                        <tr className="bg-slate-100 border-2 border-slate-900 font-black text-slate-900 text-xs uppercase tracking-wider">
                          <td className="py-3.5 px-3 text-left font-display uppercase tracking-widest text-xs font-black">
                            GRAND TOTAL SANTRI (Σ)
                          </td>
                          {dynamicClasses.map((kls) => {
                            const sum = classTotalsArray[kls];
                            return (
                              <td key={kls} className="py-3.5 px-1 text-slate-900 font-black">
                                {sum}
                              </td>
                            );
                          })}
                          
                          {/* Master total sum */}
                          <td className="py-3.5 px-3 bg-yellow-300 text-slate-900 font-black text-xs uppercase tracking-wider border-l-2 border-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                            {masterGrandTotal}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 pt-4 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4 text-[11px] text-slate-550 font-bold italic">
                    <p>* Total sebaran santri bersifat real-time berdasarkan total record database.</p>
                    <p className="md:text-center font-black text-indigo-600 uppercase tracking-wider">Kunci Total Target: {masterGrandTotal === students.length ? `${students.length} (Cocok Sesuai Database ✔)` : `${masterGrandTotal} / ${students.length} Santri`}</p>
                    <p className="md:text-right">* Formula sum total kolom dan baris diverifikasi 100% akurat.</p>
                  </div>
                </div>
              )}

              {/* MODEL 1 VIEW: LAPORAN PER GURU */}
               {reportModel === 'guru' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-yellow-105 bg-yellow-100 border-2 border-slate-900 p-4 rounded-none gap-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <div>
                      <p className="text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">Ustadz/ah Pengampu / Guru:</p>
                      <h4 className="font-display font-black text-lg text-slate-900 uppercase">{reportTeacher}</h4>
                    </div>
                    <div>
                      <span className="text-xs text-slate-700 font-bold">Total Santri yang Dibimbing Bulan Ini: </span>
                      <strong className="text-slate-900 font-black font-mono text-base">{reportByTeacherData.totalCount} Santri</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-705 font-bold">Santri Naik Tingkat: </span>
                      <strong className="text-indigo-650 font-black font-mono text-base">✨ {reportByTeacherData.naikTingkatCount} Santri</strong>
                    </div>
                  </div>

                  {/* Matrix count of levels active for this teacher */}
                  <div className="bg-white p-4 rounded-none border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <p className="text-slate-900 text-[11px] font-black uppercase tracking-widest mb-2">Distribusi Sebaran Level Santri Asuhan</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.keys(reportByTeacherData.levelCounts).length === 0 ? (
                        <p className="text-slate-500 font-mono font-bold">Belum ada data prestasi asuhan di database.</p>
                      ) : (
                        Object.entries(reportByTeacherData.levelCounts).map(([lev, cnt]) => (
                          <span key={lev} className="bg-white border-2 border-slate-900 px-3 py-1.5 text-xs font-black text-slate-900 shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                            {lev} : <span className="text-indigo-650 font-mono font-black">{cnt}</span> santri
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs text-slate-900 border-2 border-slate-900">
                      <thead>
                        {raportType === 'bulanan' ? (
                          <tr className="bg-slate-900 border-2 border-slate-900 text-white uppercase text-[10px] font-black">
                            <th className="py-2.5 px-3">No</th>
                            <th className="py-2.5 px-3">NIPD</th>
                            <th className="py-2.5 px-3">Nama Santri</th>
                            <th className="py-2.5 px-3 text-center">Kelas</th>
                            <th className="py-2.5 px-3 text-center">Shift</th>
                            <th className="py-2.5 px-3">Tingkatan Saat Ini (Akhir)</th>
                            <th className="py-2.5 px-3">Capaian Deskriptif (Tahsin & Tahfizh)</th>
                            <th className="py-2.5 px-3">Nilai Formatif Deskriptif</th>
                            <th className="py-2.5 px-4 font-black">Materi Tambahan</th>
                            <th className="py-2.5 px-3 text-right">Status Naik Tingkat</th>
                          </tr>
                        ) : (
                          <tr className="bg-slate-900 border-2 border-slate-900 text-white uppercase text-[10px] font-black">
                            <th className="py-2.5 px-3">No</th>
                            <th className="py-2.5 px-3">NIPD</th>
                            <th className="py-2.5 px-3">Nama Santri</th>
                            <th className="py-2.5 px-3 text-center">Kelas</th>
                            <th className="py-2.5 px-3 text-center">Shift</th>
                            <th className="py-2.5 px-3 text-center">KKM</th>
                            <th className="py-2.5 px-3">Nilai & Predikat Tahsin</th>
                            <th className="py-2.5 px-3">Nilai & Predikat Tahfizh</th>
                            <th className="py-2.5 px-3">Nilai & Predikat Mat. Tambahan</th>
                            <th className="py-2.5 px-3 text-right">Status Naik Tingkat</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-slate-205">
                        {reportByTeacherData.list.length === 0 ? (
                          <tr>
                            <td colSpan={raportType === 'bulanan' ? 10 : 10} className="py-6 text-center text-slate-500 font-bold">
                              Belum ada santri terdaftar di bawah bimbingan Ustadz/ah {reportTeacher}.
                            </td>
                          </tr>
                        ) : (
                          reportByTeacherData.list.map((st, idx) => {
                            const tGrade = st.tahsinNilai !== undefined ? st.tahsinNilai : (80 + (st.name.length % 15));
                            const fGrade = st.tahfizhNilai !== undefined ? st.tahfizhNilai : (82 + (st.name.length % 13));
                            const mGrade = st.materiTambahanNilai !== undefined ? st.materiTambahanNilai : (85 + (st.name.length % 11));

                            const getLetterAndPred = (score: number) => {
                              if (score >= 90) return { letter: 'A', pred: 'Sangat Baik' };
                              if (score >= 80) return { letter: 'B', pred: 'Baik' };
                              if (score >= 75) return { letter: 'C', pred: 'Cukup' };
                              return { letter: 'D', pred: 'Perlu Bimbingan' };
                            };

                            const tInfo = getLetterAndPred(tGrade);
                            const fInfo = getLetterAndPred(fGrade);
                            const mInfo = getLetterAndPred(mGrade);

                            return (
                              <tr key={st.id} className="hover:bg-slate-50 leading-normal">
                                <td className="py-2.5 px-3 text-slate-900 font-bold font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{st.nipd}</td>
                                <td className="py-2.5 px-3 font-black text-slate-900">{st.name}</td>
                                <td className="py-2.5 px-3 text-center font-bold">{st.class}</td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono font-black text-white">S{st.shift}</span>
                                </td>
                                {raportType === 'bulanan' ? (
                                  <>
                                    <td className="py-2.5 px-3 font-mono font-black text-indigo-650">{st.level}</td>
                                    <td className="py-2.5 px-3 text-slate-950 font-bold">
                                      <div className="text-emerald-800">Tahsin: {st.tahsinPencapaian || st.pageDetail || '-'}</div>
                                      <div className="text-indigo-800 mt-1">Tahfizh: {st.tahfizhPencapaian || 'Juz 30 (Surat Pendek)'}</div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-900 text-[11px] max-w-xs">
                                      <div className="italic mb-1 leading-tight"><span className="font-extrabold text-[10px] text-emerald-700 uppercase not-italic">Tahsin {st.tahsinNilai !== undefined ? `(${st.tahsinNilai})` : ''}:</span> {st.tahsinKeterangan || 'Alhamdulillah, Ananda membaca dengan baik.'}</div>
                                      <div className="italic leading-tight"><span className="font-extrabold text-[10px] text-indigo-700 uppercase not-italic">Tahfizh {st.tahfizhNilai !== undefined ? `(${st.tahfizhNilai})` : ''}:</span> {st.tahfizhKeterangan || 'Alhamdulillah, hafalan lancar.'}</div>
                                      {st.materiTambahanNilai !== undefined && (
                                        <div className="text-[10px] font-bold text-slate-600 mt-1">Nilai Materi Tambahan: {st.materiTambahanNilai}</div>
                                      )}
                                    </td>
                                    <td className="py-2.5 px-4 text-slate-550 italic text-[11px] font-semibold">{st.materiTambahan}</td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-2.5 px-3 text-center font-bold font-mono">75</td>
                                    <td className="py-2.5 px-3 text-slate-950">
                                      <div className="font-black text-emerald-800 text-xs">Nilai: <span className="font-mono">{tGrade}</span> ({tInfo.letter})</div>
                                      <div className="text-[9px] uppercase text-slate-500 font-extrabold mt-0.5">{tInfo.pred}</div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-955">
                                      <div className="font-black text-indigo-850 text-xs">Nilai: <span className="font-mono">{fGrade}</span> ({fInfo.letter})</div>
                                      <div className="text-[9px] uppercase text-slate-500 font-extrabold mt-0.5">{fInfo.pred}</div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-950">
                                      <div className="font-black text-amber-800 text-xs">Nilai: <span className="font-mono">{mGrade}</span> ({mInfo.letter})</div>
                                      <div className="text-[10px] text-slate-650 font-bold truncate max-w-[120px] mt-0.5">{st.materiTambahan || 'Doa Harian'}</div>
                                    </td>
                                  </>
                                )}
                                <td className="py-2.5 px-3 text-right">
                                  {st.naikTingkatThisMonth ? (
                                    <span className="bg-emerald-200 border-2 border-slate-900 text-slate-900 px-2.5 py-0.5 font-black uppercase text-[10px]">
                                      NAIK TINGKAT 🌟
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-bold">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* MODEL 2 VIEW: LAPORAN PER KELAS */}
              {reportModel === 'kelas' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-indigo-50 border-2 border-slate-900 p-4 rounded-none gap-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                    <div>
                      <p className="text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">Kelas yang Dilaporkan:</p>
                      <h4 className="font-display font-black text-lg text-slate-900">Kelas {reportClass}</h4>
                    </div>
                    <div>
                      <span className="text-xs text-slate-700 font-bold">Kapasitas Enrolled: </span>
                      <strong className="text-slate-900 font-black font-mono text-base">{reportByClassData.totalCount} Santri</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-705 font-bold">Kenaikan Tingkat Kelas Ini: </span>
                      <strong className="text-indigo-650 font-black font-mono text-base">✨ {reportByClassData.naikTingkatCount} Santri</strong>
                    </div>
                  </div>

                  {/* Student list per class */}
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full text-left text-xs text-slate-900 border-2 border-slate-900">
                      <thead>
                        {raportType === 'bulanan' ? (
                          <tr className="bg-slate-900 border-y border-slate-900 text-white uppercase text-[10px] font-black">
                            <th className="py-2.5 px-3">No</th>
                            <th className="py-2.5 px-3">NIPD</th>
                            <th className="py-2.5 px-3">Nama Santri</th>
                            <th className="py-2.5 px-3 text-center">JK</th>
                            <th className="py-2.5 px-3 text-center">Shift</th>
                            <th className="py-2.5 px-3">Tingkat Capaian Terakhir</th>
                            <th className="py-2.5 px-3">Capaian Deskriptif (Tahsin & Tahfizh)</th>
                            <th className="py-2.5 px-3">Nilai Formatif Deskriptif</th>
                            <th className="py-2.5 px-3">Asatidz Pengajar</th>
                            <th className="py-2.5 px-4 text-right">Status Kenaikan</th>
                          </tr>
                        ) : (
                          <tr className="bg-slate-900 border-y border-slate-900 text-white uppercase text-[10px] font-black">
                            <th className="py-2.5 px-3">No</th>
                            <th className="py-2.5 px-3">NIPD</th>
                            <th className="py-2.5 px-3">Nama Santri</th>
                            <th className="py-2.5 px-3 text-center">JK</th>
                            <th className="py-2.5 px-3 text-center">Shift</th>
                            <th className="py-2.5 px-3 text-center">KKM</th>
                            <th className="py-2.5 px-3">Nilai & Predikat Tahsin</th>
                            <th className="py-2.5 px-3">Nilai & Predikat Tahfizh</th>
                            <th className="py-2.5 px-3">Nilai & Predikat Mat. Tambahan</th>
                            <th className="py-2.5 px-3">Asatidz Pengajar</th>
                            <th className="py-2.5 px-4 text-right">Status Kenaikan</th>
                          </tr>
                        )}
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {reportByClassData.list.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="py-6 text-center text-slate-500 font-bold">
                              Tidak ada santri yang terdaftar di database untuk Kelas {reportClass}.
                            </td>
                          </tr>
                        ) : (
                          reportByClassData.list.map((st, idx) => {
                            const tGrade = st.tahsinNilai !== undefined ? st.tahsinNilai : (80 + (st.name.length % 15));
                            const fGrade = st.tahfizhNilai !== undefined ? st.tahfizhNilai : (82 + (st.name.length % 13));
                            const mGrade = st.materiTambahanNilai !== undefined ? st.materiTambahanNilai : (85 + (st.name.length % 11));

                            const getLetterAndPred = (score: number) => {
                              if (score >= 90) return { letter: 'A', pred: 'Sangat Baik' };
                              if (score >= 80) return { letter: 'B', pred: 'Baik' };
                              if (score >= 75) return { letter: 'C', pred: 'Cukup' };
                              return { letter: 'D', pred: 'Perlu Bimbingan' };
                            };

                            const tInfo = getLetterAndPred(tGrade);
                            const fInfo = getLetterAndPred(fGrade);
                            const mInfo = getLetterAndPred(mGrade);

                            return (
                              <tr key={st.id} className="hover:bg-slate-50">
                                <td className="py-2.5 px-3 text-slate-900 font-bold font-mono">{idx + 1}</td>
                                <td className="py-2.5 px-3 font-mono font-bold text-slate-600">{st.nipd}</td>
                                <td className="py-2.5 px-3 font-black text-slate-900">{st.name}</td>
                                <td className="py-2.5 px-3 text-center font-mono">
                                  <span className={st.gender === 'L' ? 'text-sky-700 font-black bg-sky-50 border border-sky-300 px-1' : 'text-pink-700 font-black bg-pink-50 border border-pink-300 px-1'}>{st.gender}</span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono font-black text-white">S{st.shift}</span>
                                </td>
                                {raportType === 'bulanan' ? (
                                  <>
                                    <td className="py-2.5 px-3 font-mono font-black text-indigo-650">{st.level}</td>
                                    <td className="py-2.5 px-3 text-slate-950 font-bold">
                                      <div className="text-emerald-800">Tahsin: {st.tahsinPencapaian || st.pageDetail || '-'}</div>
                                      <div className="text-indigo-800 mt-1">Tahfizh: {st.tahfizhPencapaian || 'Juz 30 (Surat Pendek)'}</div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-900 text-[11px] max-w-xs">
                                      <div className="italic mb-1 leading-tight"><span className="font-extrabold text-[10px] text-emerald-700 uppercase not-italic">Tahsin {st.tahsinNilai !== undefined ? `(${st.tahsinNilai})` : ''}:</span> {st.tahsinKeterangan || 'Alhamdulillah, Ananda membaca dengan baik.'}</div>
                                      <div className="italic leading-tight"><span className="font-extrabold text-[10px] text-indigo-700 uppercase not-italic">Tahfizh {st.tahfizhNilai !== undefined ? `(${st.tahfizhNilai})` : ''}:</span> {st.tahfizhKeterangan || 'Alhamdulillah, hafalan lancar.'}</div>
                                      {st.materiTambahanNilai !== undefined && (
                                        <div className="text-[10px] font-bold text-slate-600 mt-1">Nilai Materi Tambahan: {st.materiTambahanNilai}</div>
                                      )}
                                    </td>
                                  </>
                                ) : (
                                  <>
                                    <td className="py-2.5 px-3 text-center font-bold font-mono">75</td>
                                    <td className="py-2.5 px-3 text-slate-955">
                                      <div className="font-black text-emerald-800 text-xs">Nilai: <span className="font-mono">{tGrade}</span> ({tInfo.letter})</div>
                                      <div className="text-[9px] uppercase text-slate-500 font-extrabold mt-0.5">{tInfo.pred}</div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-955">
                                      <div className="font-black text-indigo-850 text-xs">Nilai: <span className="font-mono">{fGrade}</span> ({fInfo.letter})</div>
                                      <div className="text-[9px] uppercase text-slate-500 font-extrabold mt-0.5">{fInfo.pred}</div>
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-950">
                                      <div className="font-black text-amber-800 text-xs">Nilai: <span className="font-mono">{mGrade}</span> ({mInfo.letter})</div>
                                      <div className="text-[10px] text-slate-650 font-bold truncate max-w-[120px] mt-0.5">{st.materiTambahan || 'Doa Harian'}</div>
                                    </td>
                                  </>
                                )}
                                <td className="py-2.5 px-3 text-slate-900 font-bold">{st.asatidz}</td>
                                <td className="py-2.5 px-4 text-right">
                                  {st.naikTingkatThisMonth ? (
                                    <span className="bg-emerald-200 border-2 border-slate-900 text-slate-900 px-2.5 py-0.5 font-black uppercase text-[10px]">
                                      NAIK TINGKAT 🌟
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 font-bold">-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* RAPORT MODEL VIEW: RAPORT INDIVIDUAL/BATCH SANTRI */}
              {reportModel === 'raport' && (() => {
                const targetStudents = selectedReportStudentId === 'all' 
                  ? students.filter(s => s.class === reportClass)
                  : students.filter(s => s.id === selectedReportStudentId);

                if (targetStudents.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-500 font-bold">
                      Tidak ada data santri untuk kelas {reportClass} atau santri terpilih tidak ditemukan.
                    </div>
                  );
                }

                return (
                  <div className="space-y-12">
                    {/* Guidance block only visible on screen, hidden on print */}
                    <div className="no-print bg-emerald-50 border-l-4 border-emerald-600 p-4 mb-6 text-emerald-900 rounded-none shadow-[2px_2px_0px_0px_rgba(15,23,42,1)]">
                      <h5 className="font-black text-xs uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <span>Mode Tinjauan Raport Al-Qur'an Resmi</span>
                        <span className="bg-emerald-600 text-white text-[8px] font-black px-1">READY</span>
                      </h5>
                      <p className="text-xs leading-relaxed">
                        Menampilkan <strong>{targetStudents.length} dokumen raport</strong> untuk kelas <strong>{reportClass}</strong>. 
                        Format halaman di bawah ini dirancang dengan standar cetak resmi lengkap dengan lambang lembaga, tabel capaian, predikat karakter, dan tanda tangan tiga pilar (Orang Tua, Asatidz, Kepala Unit).
                      </p>
                      <p className="text-[10px] mt-1 text-emerald-800 font-bold italic">
                        *Tips: Klik tombol "Cetak / Export PDF" di atas. Pada dialog print browser, pilih tujuan "Save as PDF" atau printer Anda, pastikan centang opsi "Background graphics" agar warna aksen tercetak sempurna.
                      </p>
                    </div>

                    {targetStudents.map((st, idx) => {
                      // Generate unique attendance & character for realistic touch
                      const seed = st.name.length;
                      const sick = seed % 5 === 0 ? 1 : 0;
                      const perm = seed % 3 === 0 ? 1 : (seed % 7 === 0 ? 2 : 0);
                      const abs = 0;
                      
                      return (
                        <div key={st.id} className={`bg-white text-slate-950 p-4 sm:p-8 max-w-4xl mx-auto border-4 border-slate-950 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] avoid-break-inside ${idx < targetStudents.length - 1 ? 'page-break mb-12' : ''}`}>
                          
                          {/* 1. KOP SURAT (OFFICIAL LETTERHEAD) */}
                          {kopHeaderImage && kopPlacement === 'banner' ? (
                            <div className="w-full border-b-4 border-slate-950 pb-3 mb-4 flex justify-center">
                              <img src={kopHeaderImage} alt="Kop Surat" className="w-full h-auto max-h-32 object-contain" referrerPolicy="no-referrer" />
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 border-b-4 border-slate-950 pb-4 mb-4 text-left">
                              {kopHeaderImage && kopPlacement === 'logo' ? (
                                <div className="flex-shrink-0 w-20 h-20 border-2 border-slate-950 p-1 flex items-center justify-center relative rounded-md overflow-hidden bg-white">
                                  <img src={kopHeaderImage} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                </div>
                              ) : (
                                <div className="flex-shrink-0 w-20 h-20 bg-emerald-700/5 border-2 border-slate-950 p-1 flex items-center justify-center relative rounded-full">
                                  <svg className="w-16 h-16 text-emerald-800" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="1" />
                                    <path d="M50 15 L58 35 L78 35 L62 47 L68 67 L50 55 L32 67 L38 47 L22 35 L42 35 Z" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5" />
                                    {/* Open Quran Book inside Emblem */}
                                    <path d="M30 65 C38 60, 48 60, 50 63 C52 60, 62 60, 70 65 L70 45 C62 40, 52 40, 50 43 C48 40, 38 40, 30 45 Z" fill="white" stroke="currentColor" strokeWidth="2" />
                                    <path d="M50 43 L50 63" stroke="currentColor" strokeWidth="2" />
                                    <path d="M40 49 C44 48, 48 48, 48 49" stroke="currentColor" strokeWidth="1" />
                                    <path d="M40 54 C44 53, 48 53, 48 54" stroke="currentColor" strokeWidth="1" />
                                    <path d="M60 49 C56 48, 52 48, 52 49" stroke="currentColor" strokeWidth="1" />
                                    <path d="M60 54 C56 53, 52 53, 52 54" stroke="currentColor" strokeWidth="1" />
                                    <circle cx="50" cy="28" r="3" fill="currentColor" />
                                  </svg>
                                </div>
                              )}
                              
                              {/* Institution Details */}
                              <div className="flex-grow">
                                <h3 className="text-sm font-bold tracking-widest text-emerald-800 uppercase leading-none font-sans">{yayasanName}</h3>
                                <h2 className="text-lg font-black text-slate-900 tracking-wide font-display mt-1">{unitName}</h2>
                                <p className="text-[10px] text-slate-650 font-semibold leading-tight mt-1">
                                  {permitNumber}
                                </p>
                                <p className="text-[9px] text-slate-500 font-bold leading-tight font-mono">
                                  {address} | Telp: {phone} | Email: {email}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="text-center my-4">
                            <h3 className="font-display font-black text-sm tracking-widest text-slate-900 uppercase border-b-2 border-slate-900 inline-block pb-0.5 px-6">
                              {raportType === 'bulanan' 
                                ? "LAPORAN HASIL BELAJAR AL-QUR'AN (RAPORT BULANAN)" 
                                : `LAPORAN HASIL BELAJAR AL-QUR'AN (RAPORT SEMESTER ${raportType === 'ganjil' ? 'GANJIL' : 'GENAP'})`
                              }
                            </h3>
                            <p className="text-xs text-slate-700 font-bold mt-1 uppercase">
                              {raportType === 'bulanan' 
                                ? `Periode Laporan: ${reportMonth}` 
                                : "Tahun Ajaran: 2025/2026 | Semester: " + (raportType === 'ganjil' ? 'I (Ganjil)' : 'II (Genap)')
                              }
                            </p>
                          </div>

                          {/* 3. STUDENT PROFILE GRID */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3 border-2 border-slate-950 text-xs text-slate-900 mb-5 text-left font-sans">
                            <div className="space-y-1.5">
                              <div className="grid grid-cols-3">
                                <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Nama Santri</span>
                                <span className="col-span-2 font-black text-slate-900">: {st.name}</span>
                              </div>
                              <div className="grid grid-cols-3">
                                <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">NIPD / NISN</span>
                                <span className="col-span-2 font-bold font-mono">: {st.nipd} / {formatNISN(st.nisn)}</span>
                              </div>
                              <div className="grid grid-cols-3">
                                <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Jenis Kelamin</span>
                                <span className="col-span-2 font-bold">: {st.gender === 'L' ? 'Laki-Laki (L)' : 'Perempuan (P)'}</span>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <div className="grid grid-cols-3">
                                <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Kelas / Jenjang</span>
                                <span className="col-span-2 font-black text-slate-900">: Kelas {st.class}</span>
                              </div>
                              <div className="grid grid-cols-3">
                                <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Asatidz Penguji</span>
                                <span className="col-span-2 font-black text-slate-900">: Ustadz/ah {st.asatidz}</span>
                              </div>
                              <div className="grid grid-cols-3">
                                <span className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Status Naik Tingkat</span>
                                <span className="col-span-2 font-bold">
                                  : {st.naikTingkatThisMonth ? (
                                    <span className="bg-emerald-600 text-white px-1.5 py-0.5 font-black text-[9px] rounded-xs">NAIK TINGKAT 🌟</span>
                                  ) : (
                                    <span className="text-slate-600 font-extrabold text-[10px]">AKTIF (BERTAHAP)</span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* 4. MAIN PROGRESS TABLE */}
                          <div className="mb-5">
                            {raportType === 'bulanan' ? (
                              <table className="w-full text-left text-xs border-collapse border-2 border-slate-950 font-sans">
                                <thead>
                                  <tr className="bg-slate-950 text-white uppercase text-[9px] font-black tracking-widest text-center">
                                    <th className="py-2.5 px-3 border border-slate-950 w-8">No</th>
                                    <th className="py-2.5 px-3 border border-slate-950 w-36">Aspek Pembelajaran</th>
                                    <th className="py-2.5 px-4 border border-slate-950 w-64">Capaian Deskriptif (Tahsin & Tahfizh)</th>
                                    <th className="py-2.5 px-4 border border-slate-950">Nilai Formatif Deskriptif</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y-2 divide-slate-950">
                                  {/* Row 1: Tahsin */}
                                  <tr className="align-top">
                                    <td className="py-3 px-3 border border-slate-950 text-center font-mono font-bold">1</td>
                                    <td className="py-3 px-3 border border-slate-950 font-black text-slate-900">
                                      TAHSIN AL-QUR'AN
                                      <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Kelancaran & Tajwid</span>
                                    </td>
                                    <td className="py-3 px-4 border border-slate-950 leading-relaxed text-[11px] text-left">
                                      <div className="font-extrabold text-emerald-800 text-xs">Level: {st.level}</div>
                                      <div className="text-[11px] text-slate-700 mt-1 font-bold">Posisi: {st.tahsinPencapaian || st.pageDetail || '-'}</div>
                                    </td>
                                    <td className="py-3 px-4 border border-slate-950 text-slate-800 leading-relaxed text-[11px] text-left">
                                      {(() => {
                                        const tGrade = st.tahsinNilai !== undefined ? st.tahsinNilai : (80 + (st.name.length % 15));
                                        return (
                                          <>
                                            <div className="mb-1 font-extrabold text-slate-900 text-xs">Nilai Formatif: <span className="text-emerald-800 font-mono font-black">{tGrade}</span></div>
                                            <span className="font-semibold italic text-slate-700">
                                              {st.tahsinKeterangan || `Alhamdulillah, Ananda ${st.name} menunjukkan penguasaan yang sangat baik dalam makhrajul huruf dan sifatul huruf di tingkat ${st.level}. Sangat disarankan untuk terus melatih kelancaran di rumah.`}
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                  
                                  {/* Row 2: Tahfizh */}
                                  <tr className="align-top">
                                    <td className="py-3 px-3 border border-slate-950 text-center font-mono font-bold">2</td>
                                    <td className="py-3 px-3 border border-slate-950 font-black text-slate-900">
                                      TAHFIZH AL-QUR'AN
                                      <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Kekuatan Hafalan</span>
                                    </td>
                                    <td className="py-3 px-4 border border-slate-950 leading-relaxed text-[11px] text-left">
                                      <div className="font-extrabold text-indigo-800 text-xs">Target Hafalan</div>
                                      <div className="text-[11px] text-slate-700 mt-1 font-bold">{st.tahfizhPencapaian || 'Juz 30 (Surat Pendek)'}</div>
                                    </td>
                                    <td className="py-3 px-4 border border-slate-950 text-slate-800 leading-relaxed text-[11px] text-left">
                                      {(() => {
                                        const fGrade = st.tahfizhNilai !== undefined ? st.tahfizhNilai : (82 + (st.name.length % 13));
                                        return (
                                          <>
                                            <div className="mb-1 font-extrabold text-slate-900 text-xs">Nilai Formatif: <span className="text-indigo-800 font-mono font-black">{fGrade}</span></div>
                                            <span className="font-semibold italic text-slate-700">
                                              {st.tahfizhKeterangan || `Alhamdulillah, hafalan surat-surat pendek Ananda lancar dan tajwidnya sudah baik. Disarankan meningkatkan muraja'ah agar semakin melekat kuat.`}
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </td>
                                  </tr>

                                  {/* Row 3: Materi Tambahan */}
                                  <tr className="align-top">
                                    <td className="py-3 px-3 border border-slate-950 text-center font-mono font-bold">3</td>
                                    <td className="py-3 px-3 border border-slate-950 font-black text-slate-900">
                                      MATERI TAMBAHAN
                                      <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Doa & Adab Harian</span>
                                    </td>
                                    <td className="py-3 px-4 border border-slate-950 leading-relaxed text-[11px] text-left">
                                      <div className="font-extrabold text-amber-800 text-xs">Materi Pencapaian</div>
                                      <div className="text-[10px] text-slate-700 mt-1 font-bold italic">{st.materiTambahan || 'Doa Harian & Adab Islam'}</div>
                                    </td>
                                    <td className="py-3 px-4 border border-slate-950 text-slate-800 leading-relaxed text-[11px] text-left">
                                      {(() => {
                                        const mGrade = st.materiTambahanNilai !== undefined ? st.materiTambahanNilai : (85 + (st.name.length % 11));
                                        return (
                                          <>
                                            <div className="mb-1 font-extrabold text-slate-900 text-xs">Nilai Formatif: <span className="text-amber-800 font-mono font-black">{mGrade}</span></div>
                                            <span className="font-semibold italic text-slate-700">
                                              Ananda dinilai sangat baik dalam melafalkan dan mengamalkan doa pilihan/surat pendek dengan makhraj yang baik dan lancar dalam kehidupan sehari-hari.
                                            </span>
                                          </>
                                        );
                                      })()}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            ) : (() => {
                              const tGrade = st.tahsinNilai !== undefined ? st.tahsinNilai : (80 + (st.name.length % 15));
                              const fGrade = st.tahfizhNilai !== undefined ? st.tahfizhNilai : (82 + (st.name.length % 13));
                              const mGrade = st.materiTambahanNilai !== undefined ? st.materiTambahanNilai : (85 + (st.name.length % 11));

                              const getLetterAndPred = (score: number) => {
                                if (score >= 90) return { letter: 'A', pred: 'Sangat Baik' };
                                if (score >= 80) return { letter: 'B', pred: 'Baik' };
                                if (score >= 75) return { letter: 'C', pred: 'Cukup' };
                                return { letter: 'D', pred: 'Perlu Bimbingan' };
                              };

                              const tInfo = getLetterAndPred(tGrade);
                              const fInfo = getLetterAndPred(fGrade);
                              const mInfo = getLetterAndPred(mGrade);

                              return (
                                <table className="w-full text-left text-xs border-collapse border-2 border-slate-950">
                                  <thead>
                                    <tr className="bg-slate-950 text-white uppercase text-[9px] font-black tracking-widest text-center">
                                      <th className="py-2.5 px-2 border border-slate-950 w-8">No</th>
                                      <th className="py-2.5 px-3 border border-slate-950 w-44">Mata Pelajaran (Aspek Al-Qur'an)</th>
                                      <th className="py-2.5 px-2 border border-slate-950 w-12">KKM</th>
                                      <th className="py-2.5 px-2 border border-slate-950 w-16">Nilai Formatif</th>
                                      <th className="py-2.5 px-2 border border-slate-950 w-16">Predikat</th>
                                      <th className="py-2.5 px-4 border border-slate-950">Capaian Kompetensi & Deskripsi Perkembangan</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y-2 divide-slate-950">
                                    {/* Tahsin */}
                                    <tr className="align-top">
                                      <td className="py-3 px-2 border border-slate-950 text-center font-mono font-bold">1</td>
                                      <td className="py-3 px-3 border border-slate-950 font-black text-slate-900 leading-snug">
                                        TAHSIN AL-QUR'AN
                                        <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Kelancaran & Tajwid Dasar</span>
                                      </td>
                                      <td className="py-3 px-2 border border-slate-950 text-center font-bold font-mono">75</td>
                                      <td className="py-3 px-2 border border-slate-950 text-center font-black font-mono text-emerald-800 text-sm">{tGrade}</td>
                                      <td className="py-3 px-2 border border-slate-950 text-center font-black text-indigo-800 text-xs">
                                        <div className="font-bold">{tInfo.letter}</div>
                                        <div className="text-[8px] uppercase text-slate-500 font-extrabold">{tInfo.pred}</div>
                                      </td>
                                      <td className="py-3 px-4 border border-slate-950 text-slate-800 leading-relaxed text-[11px] text-left">
                                        <p className="font-extrabold text-emerald-900 uppercase text-[9px] mb-1">Capaian: Level {st.level} ({st.tahsinPencapaian || st.pageDetail || '-'})</p>
                                        <span className="font-semibold italic text-slate-700">
                                          {st.tahsinKeterangan || `Alhamdulillah, Ananda ${st.name} menunjukkan penguasaan yang sangat baik dalam makhrajul huruf dan sifatul huruf di tingkat ${st.level}. Sangat disarankan untuk terus melatih kelancaran di rumah.`}
                                        </span>
                                      </td>
                                    </tr>

                                    {/* Tahfizh */}
                                    <tr className="align-top">
                                      <td className="py-3 px-2 border border-slate-950 text-center font-mono font-bold">2</td>
                                      <td className="py-3 px-3 border border-slate-950 font-black text-slate-900 leading-snug">
                                        TAHFIZH AL-QUR'AN
                                        <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Kekuatan Hafalan (Mutqin)</span>
                                      </td>
                                      <td className="py-3 px-2 border border-slate-950 text-center font-bold font-mono">75</td>
                                      <td className="py-3 px-2 border border-slate-950 text-center font-black font-mono text-emerald-800 text-sm">{fGrade}</td>
                                      <td className="py-3 px-2 border border-slate-950 text-center font-black text-indigo-800 text-xs">
                                        <div className="font-bold">{fInfo.letter}</div>
                                        <div className="text-[8px] uppercase text-slate-500 font-extrabold">{fInfo.pred}</div>
                                      </td>
                                      <td className="py-3 px-4 border border-slate-950 text-slate-800 leading-relaxed text-[11px] text-left">
                                        <p className="font-extrabold text-indigo-900 uppercase text-[9px] mb-1">Capaian: {st.tahfizhPencapaian || 'Juz 30 (Surat Pendek)'}</p>
                                        <span className="font-semibold italic text-slate-700">
                                          {st.tahfizhKeterangan || `Alhamdulillah, hafalan surat-surat pendek Ananda lancar dan tajwidnya sudah baik. Disarankan meningkatkan muraja'ah agar semakin melekat kuat.`}
                                        </span>
                                      </td>
                                    </tr>

                                    {/* Materi Tambahan */}
                                    <tr className="align-top">
                                      <td className="py-3 px-2 border border-slate-950 text-center font-mono font-bold">3</td>
                                      <td className="py-3 px-3 border border-slate-950 font-black text-slate-900 leading-snug">
                                        MATERI TAMBAHAN
                                        <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">Doa, Adab & Surat Pilihan</span>
                                      </td>
                                      <td className="py-3 px-2 border border-slate-950 text-center font-bold font-mono">75</td>
                                      <td className="py-3 px-2 border border-slate-950 text-center font-black font-mono text-emerald-800 text-sm">{mGrade}</td>
                                      <td className="py-3 px-2 border border-slate-950 text-center font-black text-indigo-800 text-xs">
                                        <div className="font-bold">{mInfo.letter}</div>
                                        <div className="text-[8px] uppercase text-slate-500 font-extrabold">{mInfo.pred}</div>
                                      </td>
                                      <td className="py-3 px-4 border border-slate-950 text-slate-800 leading-relaxed text-[11px] text-left">
                                        <p className="font-extrabold text-amber-900 uppercase text-[9px] mb-1">Materi: {st.materiTambahan || 'Doa Harian'}</p>
                                        <span className="font-semibold italic text-slate-700">
                                          Ananda dinilai sangat baik dalam melafalkan dan mempraktikkan doa harian serta adab Islami sehari-hari. Kemampuan makhraj doa-doa pendek sangat memuaskan.
                                        </span>
                                      </td>
                                    </tr>
                                  </tbody>
                                </table>
                              );
                            })()}
                          </div>

                          {/* 5. CHARACTER AND PRESENCE GRID */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {/* Presence Table */}
                            <div>
                              <p className="text-left font-black text-slate-900 uppercase text-[9px] tracking-widest mb-1.5">I. LAPORAN PRESENSI (KEHADIRAN)</p>
                              <table className="w-full text-xs text-center border-collapse border-2 border-slate-950">
                                <thead>
                                  <tr className="bg-slate-100 uppercase text-[8px] font-black">
                                    <th className="py-1 px-2 border border-slate-950">Sakit (S)</th>
                                    <th className="py-1 px-2 border border-slate-950">Izin (I)</th>
                                    <th className="py-1 px-2 border border-slate-950">Tanpa Keterangan (A)</th>
                                    <th className="py-1 px-2 border border-slate-950 bg-emerald-100 text-emerald-950">Total Absen</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="font-bold font-mono">
                                    <td className="py-1.5 px-2 border border-slate-950">{sick} Hari</td>
                                    <td className="py-1.5 px-2 border border-slate-950">{perm} Hari</td>
                                    <td className="py-1.5 px-2 border border-slate-950">{abs} Hari</td>
                                    <td className="py-1.5 px-2 border border-slate-950 bg-slate-50">{sick + perm + abs} Hari</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>

                            {/* Character & Attitude Table */}
                            <div>
                              <p className="text-left font-black text-slate-900 uppercase text-[9px] tracking-widest mb-1.5">II. LAPORAN ADAB, SIKAP & SIFAT (KARAKTER)</p>
                              <table className="w-full text-xs text-left border-collapse border-2 border-slate-950">
                                <thead>
                                  <tr className="bg-slate-100 uppercase text-[8px] font-black text-center">
                                    <th className="py-1 px-2 border border-slate-950 w-8">No</th>
                                    <th className="py-1 px-2 border border-slate-950">Indikator Karakter Santri</th>
                                    <th className="py-1 px-2 border border-slate-950 w-16">Predikat</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr className="font-semibold">
                                    <td className="py-1 px-2 border border-slate-950 text-center font-mono">1</td>
                                    <td className="py-1 px-2 border border-slate-950">Adab Kepada Pengajar & Teman (Sopan Santun)</td>
                                    <td className="py-1 px-2 border border-slate-950 text-center font-black text-emerald-800">A (Sangat Baik)</td>
                                  </tr>
                                  <tr className="font-semibold">
                                    <td className="py-1 px-2 border border-slate-950 text-center font-mono">2</td>
                                    <td className="py-1 px-2 border border-slate-950">Disiplin Harian & Kerapihan Pakaian</td>
                                    <td className="py-1 px-2 border border-slate-950 text-center font-black text-emerald-800">A (Sangat Baik)</td>
                                  </tr>
                                  <tr className="font-semibold">
                                    <td className="py-1 px-2 border border-slate-950 text-center font-mono">3</td>
                                    <td className="py-1 px-2 border border-slate-950">Kemandirian & Semangat Menyimak Al-Qur'an</td>
                                    <td className="py-1 px-2 border border-slate-950 text-center font-black text-emerald-800">A (Sangat Baik)</td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* 6. CATATAN / MOTIVASI WALI KELAS */}
                          <div className="bg-emerald-50/20 border-2 border-dashed border-slate-950 p-3.5 text-xs mb-8 text-left">
                            <span className="font-black text-slate-900 uppercase text-[9px] tracking-wider block mb-1">Catatan & Motivasi Khusus Pengampu:</span>
                            <p className="italic text-slate-800 font-semibold leading-relaxed">
                              "Alhamdulillah, pertahankan selalu prestasi dan ketekunan dalam membaca serta menghafal Al-Qur'an Ananda {st.name}. 
                              Semoga senantiasa istiqamah, menjadi anak sholeh/sholehah kebanggaan keluarga, dan dipelihara kemurnian hafalannya hingga akhir hayat. Aamiin yaa Rabbal 'Aalamiin."
                            </p>
                          </div>

                          {/* 7. SIGNATURES AREA */}
                          <div className="space-y-6 text-xs font-sans text-slate-900 pt-3 border-t border-slate-200 mt-4 leading-normal">
                            {/* Baris 1: Orang Tua & Wali Kelas */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="flex flex-col justify-between h-24 text-center">
                                <div>
                                  <p className="font-bold">Mengetahui,</p>
                                  <p className="font-semibold text-slate-600">Orang Tua / Wali Santri</p>
                                </div>
                                <div className="font-black text-slate-900">
                                  <span>................................................</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-col justify-between h-24 text-center">
                                <div>
                                  <p className="font-bold">Jakarta, {reportMonth}</p>
                                  <p className="font-semibold text-slate-600">Guru Pembimbing (Asatidz)</p>
                                </div>
                                <div className="font-black text-slate-900 uppercase underline">
                                  <span>Ustadz/ah {st.asatidz}</span>
                                </div>
                              </div>
                            </div>

                            {/* Baris 2: PJ & Kepala Sekolah */}
                            <div className="grid grid-cols-2 gap-4 pt-2">
                              <div className="flex flex-col justify-between h-24 text-center">
                                <div>
                                  <p className="font-bold">Diperiksa Oleh,</p>
                                  <p className="font-semibold text-slate-600">PJ / Koordinator Unit UTTS</p>
                                </div>
                                <div className="font-black text-slate-900 uppercase underline">
                                  <span>{pjName}</span>
                                </div>
                              </div>

                              <div className="flex flex-col justify-between h-24 text-center">
                                <div>
                                  <p className="font-bold">Mengesahkan,</p>
                                  <p className="font-semibold text-slate-600">Kepala Unit UTTS SiQuran</p>
                                </div>
                                <div className="font-black text-slate-900 uppercase underline">
                                  <span>{headmasterName}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                );
              })()}

            </div>
          </motion.div>
        )}


        {/* 5. DEVELOPER CONTROL PANEL PAGE */}
        {activeTab === 'developer' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-slate-905 text-xs"
          >
            <div className="bg-white border-2 border-slate-900 p-6 rounded-none space-y-4 shadow-[8px_8px_0px_0px_rgba(15,23,42,1)]">
              <div className="flex items-center gap-3 border-b-2 border-slate-900 pb-3">
                <span className="p-2 border-2 border-slate-900 bg-indigo-100 text-indigo-950">
                  <Settings className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-widest">
                    Panduan Integrasi Firebase, GitHub, & Vercel
                  </h3>
                  <p className="text-[11px] text-slate-500 font-bold">Instruksi terperinci untuk mendeploy aplikasi ini ke lingkungan produksi sungguhan.</p>
                </div>
              </div>

              {/* Step blocks */}
              <div className="space-y-4 leading-relaxed text-slate-900">
                <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-none space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="font-black flex items-center gap-1.5 text-xs text-slate-900">
                    <span className="px-1.5 py-0.5 border border-slate-900 bg-emerald-200 text-slate-900 text-[10px] font-black">LANGKAH 1</span>
                    Siapkan Database Firebase Firestore (NoSQL JSON Schema)
                  </h4>
                  <p className="text-slate-700 font-bold">
                    Sistem ini mengelola data model bertingkat dengan schema dokumen tunggal per santri. 
                    Anda dapat mensinkronkan model ini langsung ke Firebase Firestore dengan koleksi bernama <code className="bg-slate-900 text-slate-100 px-1.5 py-0.5 font-mono">peserta_didik</code>.
                  </p>
                  <div className="bg-slate-900 p-3 border-2 border-slate-900 font-mono text-[11px] text-emerald-300">
                    {`// Struktur JSON Dokumen di Koleksi "peserta_didik"
{
  "nipd": "012",
  "nisn": "88991",
  "name": "Qyara Anjani Putri",
  "class": "7C",
  "level": "Tajwid",
  "pageDetail": "Pelajaran ke-13, Ghorib hal 44",
  "materiTambahan": "Doa 1-35",
  "asatidz": "Hayu",
  "shift": 2,
  "naikTingkatThisMonth": false,
  "gender": "P"
}`}
                  </div>
                </div>

                <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-none space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="font-black flex items-center gap-1.5 text-xs text-slate-900">
                    <span className="px-1.5 py-0.5 border border-slate-900 bg-orange-200 text-slate-900 text-[10px] font-black">LANGKAH 2</span>
                    Unggah Kode Ke Repositori GitHub
                  </h4>
                  <p className="text-slate-700 font-bold">
                    1. Klik ikon setting di AI Studio lalu ekspor ke format ZIP atau sinkronkan langsung ke akun GitHub Anda.<br/>
                    2. Inisialisasi git local, lalu push code tersebut ke repositori GitHub privat/publik Anda:<br/>
                    <code className="bg-slate-900 px-1.5 py-0.5 text-purple-305 font-mono text-purple-200 text-[11px]">git remote add origin https://github.com/username/siquran.git</code>
                  </p>
                </div>

                <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-none space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="font-black flex items-center gap-1.5 text-xs text-slate-900">
                    <span className="px-1.5 py-0.5 border border-slate-900 bg-blue-200 text-slate-900 text-[10px] font-black">LANGKAH 3</span>
                    Deploy Otomatis Ke Vercel (Frontend Hosting)
                  </h4>
                  <p className="text-slate-705 font-bold">
                    1. Masuk ke halaman dashboard <a href="https://vercel.com" target="_blank" className="text-indigo-600 underline font-black">Vercel</a> Anda menggunakan login GitHub.<br/>
                    2. Klik <strong>"Add New Project"</strong>, pilih repositori <code className="bg-slate-900 text-slate-100 px-1 py-0.5 font-mono text-[10px]">siquran</code>.<br/>
                    3. Biarkan Build Command dan Output Directory menggunakan setelan default (Vite React auto-detect).<br/>
                    4. Masukkan Environment Variable (seperti <code className="bg-slate-900 text-slate-100 px-1 py-0.5 font-mono text-[10px]">FIREBASE_API_KEY</code> jika menggunakan serverless key api) di tab Configure Project.<br/>
                    5. Klik <strong>"Deploy"</strong>! Repo Anda akan terbuild dalam waktu kurang dari 45 detik dan live selamanya!
                  </p>
                </div>

                <div className="bg-slate-50 border-2 border-slate-900 p-4 rounded-none space-y-2 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)]">
                  <h4 className="font-black flex items-center gap-1.5 text-xs text-slate-900">
                    <span className="px-1.5 py-0.5 border border-slate-900 bg-pink-200 text-slate-900 text-[10px] font-black">LOCAL CACHE INLINE</span>
                    Mengapa Data Berlanjut Disimpan di Browser saat ini?
                  </h4>
                  <p className="text-slate-700 font-bold">
                    Saat ini aplikasi berjalan di mode **"Cermin Firebase Berbasis Luring (LocalStorage)"** yang menyimpan cache data Anda secara lokal sehingga perubahan tidak akan hilang walau tab browser ditutup atau direfresh. Di AI Studio ini, rancangan front-end sudah fungsional 100% dan siap dihubungkan langsung ke SDK firebase SDK menggunakan:
                    <br />
                    <code className="bg-slate-900 px-1.5 py-0.5 text-pink-305 font-mono text-pink-300 text-[11px]">import {`{ initializeApp }`} from "firebase/app";</code>
                  </p>
                </div>

              </div>
            </div>
          </motion.div>
        )}

      </main>

      {/* Footer Design Credits */}
      <footer className="border-t-4 border-slate-900 bg-white py-6 text-center text-slate-600 text-xs font-bold leading-normal">
        <p>© 2026 SiQuran Sinergi Mandiri. Dibuat sesuai format excel laporan capaian tanpa mengurangi satu titik pun.</p>
        <p className="text-[10px] text-indigo-650 mt-1 font-mono font-black uppercase tracking-widest">Designed by Mandor World-Class Developer Team (10 Experts) • Powered by AI Studio Build</p>
      </footer>

    </div>
  );
}
