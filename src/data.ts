/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import parsedStudentsRaw from '../parsed_students.json';

export interface Student {
  id: string; // NIPD / ID
  nipd: string;
  nisn: string;
  name: string;
  class: string; // 7A, 7B, 7C, 7D, 8A, 8B, 8C, 8D, 9A, 9B, 9C, 9D
  level: string; // e.g. "Jilid 1", "Jilid 2", ..., "Juz 30", "Juz 29", "Tajwid", "Ghorib"
  pageDetail: string; // Hal/ayat dan surat. e.g. "QS. Nuh : 5"
  materiTambahan: string; // e.g. "Doa 1 (Memulai pekerjaan) -35"
  asatidz: string; // Teacher name
  shift: 1 | 2 | 3;
  naikTingkatThisMonth: boolean;
  historyLevel?: string; // Level sebelum naik tingkat
  gender: 'L' | 'P';
  tahsinPencapaian?: string;
  tahsinKeterangan?: string;
  tahfizhPencapaian?: string;
  tahfizhKeterangan?: string;
  tahsinNilai?: number;
  tahfizhNilai?: number;
  materiTambahanNilai?: number;
  graduatedAt?: string;
}

export interface Teacher {
  id: string;
  name: string;
  gender: 'L' | 'P';
  phone: string;
  status: string; // e.g. "Ustadz Utama", "Ustadzah Utama"
  specialty: string; // e.g. "Jilid 1-6 & Juz 30"
  experience: string;
  linkedEmail?: string;
  username?: string;
  password?: string;
  updatedAt?: string;
  shift1Classes?: string[];
  shift1Levels?: string[];
  shift2Classes?: string[];
  shift2Levels?: string[];
  shift3Classes?: string[];
  shift3Levels?: string[];
}

export const CLASSES = [
  '7A', '7B', '7C', '7D',
  '8A', '8B', '8C', '8D',
  '9A', '9B', '9C', '9D'
];

export const SHIFTS = [1, 2, 3] as const;

export const LEVELS = [
  '1A', '1B', '2A', '2B', '3A', '3B', '4A', '4B',
  'TAHSIN J.27', 'AQ', 'TG',
  'J.30', 'J.29', 'J.28', 'J.27', 'J.26', 'J.25', 'J.24', 'J.23', 'J.22', 'J.21',
  'J.20', 'J.19', 'J.18', 'J.17', 'J.16', 'J.15', 'J.14', 'J.13', 'J.12', 'J.11',
  'J.10', 'J.9', 'J.8', 'J.7', 'J.6', 'J.5', 'J.4', 'J.3', 'J.2', 'J.1'
];

export const INITIAL_TEACHERS: Teacher[] = [
  { id: 'T1', name: 'Iskandar', gender: 'L', phone: '0812-3456-7811', status: 'Ustadz Utama', specialty: 'Al-Quran, Tahsin & Tahfizh', experience: '6 Tahun' },
  { id: 'T2', name: 'Ria Setiawati', gender: 'P', phone: '0812-3456-7812', status: 'Ustadzah Utama', specialty: 'Al-Quran, Jilid & Juz 30', experience: '5 Tahun' },
  { id: 'T3', name: 'Hayu', gender: 'P', phone: '0812-3456-7801', status: 'Ustadzah Tetap', specialty: 'Tajwid, Ghorib, Juz 29 & 30', experience: '5 Tahun' },
  { id: 'T4', name: 'Ahmad Syafii', gender: 'L', phone: '0812-3456-7802', status: 'Ustadz Tetap', specialty: 'Jilid 1-6, Tajwid & Ghorib', experience: '4 Tahun' },
  { id: 'T5', name: 'Mustofa Kamal', gender: 'L', phone: '0812-3456-7803', status: 'Ustadz Tetap', specialty: 'Al-Quran, Juz 1-30', experience: '3 Tahun' },
  { id: 'T6', name: 'Maryam Hanifa', gender: 'P', phone: '0812-3456-7804', status: 'Ustadzah Tetap', specialty: 'Jilid 1-6 & Juz 30', experience: '2 Tahun' },
  { id: 'T7', name: 'Luthfi Hakim', gender: 'L', phone: '0812-3456-7805', status: 'Ustadz Tetap', specialty: 'Tajwid & Ghorib', experience: '3 Tahun' },
  { id: 'T8', name: 'Fatimah Az-Zahra', gender: 'P', phone: '0812-3456-7806', status: 'Ustadzah Pengampu', specialty: 'Jilid 1-6', experience: '1 Tahun' }
];

export function loadTeachersFromStore(): Teacher[] {
  const data = localStorage.getItem('siquran_teachers_v1');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  localStorage.setItem('siquran_teachers_v1', JSON.stringify(INITIAL_TEACHERS));
  return INITIAL_TEACHERS;
}

export function saveTeachersToStore(teachers: Teacher[]) {
  localStorage.setItem('siquran_teachers_v1', JSON.stringify(teachers));
}

export const TEACHERS = loadTeachersFromStore().map(t => t.name);

// Seed list of initial 41 real high-fidelity Excel/PDF students to ensure 100% match
const REAL_EXCEL_STUDENTS: Omit<Student, 'id' | 'shift' | 'naikTingkatThisMonth'>[] = [
  {
    nipd: "252607100",
    nisn: "0105545008",
    name: "Baihaqi Rizal Rifaldi",
    class: "9C",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "QS. Al-Muthoffifin",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda mencapai Tahfizh Juz 30 QS. An Naba – QS. Al-Muthoffifin. Hati hati panjang pendek, dengung. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607101",
    nisn: "3117109896",
    name: "Naufal Mumtaz Adzzaky Irawan",
    class: "9C",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "QS. Asy-Syamsy – QS. At-Tiin",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda mencapai Tahfizh Juz 30 QS. Asy-Syamsy – QS. At-Tiin. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607102",
    nisn: "0107946490",
    name: "Mohammad Dzaki",
    class: "9C",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "QS. An-Naba' - QS. Al-Ghosyiyah",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda mencapai Tahfizh Juz 30 QS. An-Naba' - QS. Al-Ghosyiyah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607103",
    nisn: "0115957338",
    name: "Ziggy Farras Octovian",
    class: "9C",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "QS. An-Naba' - QS. Asy-Syamsy",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda mencapai Tahfizh Juz 30 QS. An-Naba' - QS. Asy-Syamsy. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607104",
    nisn: "0108934052",
    name: "Muhammad Wildan",
    class: "9C",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "QS. An-Naba' - QS. Al-Buruuj",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda mencapai Tahfizh Juz 30 QS. An Naba' - QS. Al-Buruuj. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607105",
    nisn: "0115945462",
    name: "Muhamad Zhalfin Alfahridzi",
    class: "9D",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "Lulus EBTAQ Tahfizh Juz 30",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Lulus EBTAQ Tahfizh Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda Lulus EBTAQ Tahfizh Juz 30. Lanjutkan semangat menghafalnya di tingkat selanjutnya. Mohon ayah dan bunda untuk terus memotivasi ananda menghafal Al-Qur'an"
  },
  {
    nipd: "252607106",
    nisn: "0107741115",
    name: "Muhammad Kalih Sakha",
    class: "9D",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "QS. An Naba – QS. Al-Muthoffifin",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda mencapai Tahfizh Juz 30 QS. An Naba – QS. Al-Muthoffifin. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607107",
    nisn: "0114063711",
    name: "Kharel Breviandra Wirawiryawan",
    class: "9D",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "Lulus EBTAQ Tahfizh Juz 30",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Lulus EBTAQ Tahfizh Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda Lulus EBTAQ Tahfizh Juz 30. Lanjutkan semangat menghafalnya di tingkat selanjutnya. Mohon ayah dan bunda untuk terus memotivasi ananda menghafal Al-Qur'an"
  },
  {
    nipd: "252607108",
    nisn: "0118842205",
    name: "Bagas Yunar Prayoga",
    class: "9D",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "Lulus EBTAQ Tahfizh Juz 30",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Lulus EBTAQ Tahfizh Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda Lulus EBTAQ Tahfizh Juz 30. Lanjutkan semangat menghafalnya di tingkat selanjutnya. Mohon ayah dan bunda untuk terus memotivasi ananda menghafal Al-Qur'an"
  },
  {
    nipd: "252607109",
    nisn: "3100406379",
    name: "Zidan Abbie Rashya",
    class: "9D",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "Lulus EBTAQ Tahfizh Juz 30",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Lulus EBTAQ Tahfizh Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda Lulus EBTAQ Tahfizh Juz 30. Lanjutkan semangat menghafalnya di tingkat selanjutnya. Mohon ayah dan bunda untuk terus memotivasi ananda menghafal Al-Qur'an"
  },
  {
    nipd: "252607110",
    nisn: "0113879205",
    name: "Rizky Azmi Nugraha",
    class: "9D",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "Lulus EBTAQ Tahfizh Juz 30",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Lulus EBTAQ Tahfizh Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda Lulus EBTAQ Tahfizh Juz 30. Lanjutkan semangat menghafalnya di tingkat selanjutnya. Mohon ayah dan bunda untuk terus memotivasi ananda menghafal Al-Qur'an"
  },
  {
    nipd: "252607111",
    nisn: "0125376968",
    name: "Abdullah Alfariski",
    class: "8C",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An-Nas)",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Hati-hati bacaan dengung, huruf kho, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An-Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607112",
    nisn: "3121890083",
    name: "Abimanyu Putra",
    class: "8C",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Jangan terlalu terburu-buru, dengung, bacaan jelas diperhatikan. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607113",
    nisn: "0121097999",
    name: "Azka Farid Hilman",
    class: "8C",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Hati-hati bacaan dengung. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607114",
    nisn: "0129065757",
    name: "Bagus Nata Utama",
    class: "8C",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Hati-hati bacaan dengung. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607115",
    nisn: "0128828019",
    name: "Nabhan Adli Syafiqurrahman",
    class: "8C",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Hati-hati bacaan dengung. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607116",
    nisn: "3112931902",
    name: "Aliyah Khoirunisa",
    class: "8A",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Hati-hati bacaan dengung. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607117",
    nisn: "0112379889",
    name: "Aziza Fathiyyah Putri Cahyadi",
    class: "8A",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Hati-hati bacaan dengung. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607118",
    nisn: "0125725130",
    name: "Khalisa Gendis Ayudia",
    class: "8A",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Hati-hati bacaan dengung. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607119",
    nisn: "0121931427",
    name: "Nazneen Baktir",
    class: "8A",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Mohon untuk angkat suaranya saat mengaji sehingga bacaan bisa lebih terdengar jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607120",
    nisn: "0128492135",
    name: "Tiara Milannatasya Nisti",
    class: "8A",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Jangan terlalu terburu-buru, dengung, bacaan jelas diperhatikan. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607121",
    nisn: "3123463761",
    name: "Nadhifa",
    class: "8A",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Jangan terlalu terburu-buru, dengung, bacaan jelas diperhatikan. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607122",
    nisn: "012595363",
    name: "Fajar Irsyad Kamil",
    class: "8C",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Jangan terlalu terburu-buru, dengung, bacaan jelas diperhatikan. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607123",
    nisn: "0132954507",
    name: "Nadia Salsabila",
    class: "7A",
    level: "4B",
    pageDetail: "Jilid 4B, Halaman 35-45",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Jilid 4B, Halaman 35-45",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Hal. 35-45. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607124",
    nisn: "0133842035",
    name: "Raissa Salsabila Adzkiya",
    class: "7A",
    level: "4B",
    pageDetail: "Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Hal. Melancarkan halaman 35-60. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607125",
    nisn: "3138847703",
    name: "Naziiha Attamimi",
    class: "7B",
    level: "4B",
    pageDetail: "Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Hal. 35-52. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607126",
    nisn: "0126226041",
    name: "Raisya Yasmin",
    class: "8A",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Jangan terlalu terburu-buru, dengung, bacaan jelas diperhatikan. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607127",
    nisn: "3133872296",
    name: "Adibah",
    class: "7A",
    level: "4B",
    pageDetail: "Lulus Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Lulus Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Lulus Jilid 4B. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607128",
    nisn: "3135855568",
    name: "Xena Nathiq Putri Agung",
    class: "7A",
    level: "4B",
    pageDetail: "Lulus Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Lulus Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Lulus Jilid 4B. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607129",
    nisn: "3126345675",
    name: "Assyifa Kamila Dayta",
    class: "7A",
    level: "4B",
    pageDetail: "Lulus Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Lulus Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Lulus Jilid 4B. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607130",
    nisn: "0125397893",
    name: "Yasmin Rahman Widiasyakira",
    class: "7A",
    level: "4B",
    pageDetail: "Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Hal. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607131",
    nisn: "0138260956",
    name: "Abdul Walid Akhirudin",
    class: "7C",
    level: "4B",
    pageDetail: "Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Hal. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607132",
    nisn: "3134387056",
    name: "Mohammad Panji Kusumah Hidayatullah",
    class: "7C",
    level: "4B",
    pageDetail: "Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Hal. Melancarkan halaman 35-60. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607133",
    nisn: "3132633372",
    name: "Muhammad Hilmi Azizan",
    class: "7C",
    level: "4B",
    pageDetail: "Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Hal. 35-36. Mohon perhatikan bacaan panjang-pendek, dengung, dan bacaan jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607134",
    nisn: "0138005334",
    name: "Fayza Aqila Khanza",
    class: "7A",
    level: "4B",
    pageDetail: "Jilid 4B",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Hal. 35-55. Perhatikan bacaan dengung. . Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607135",
    nisn: "0113885659",
    name: "Filza Qorriaina Priyadi",
    class: "8B",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Mohon untuk angkat suaranya saat mengaji sehingga bacaan bisa lebih terdengar jelas. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30 (QS. Asy-Syams - QS. An Nas)",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607136",
    nisn: "0104987416",
    name: "Aliyah Mumtaz",
    class: "9A",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "Juz 30",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda mencapai Tahfizh Juz 30 QS. An Naba' - QS. Al-Ghosyiyah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607137",
    nisn: "3105431479",
    name: "Freya Susana Adistira",
    class: "9A",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "Juz 30",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda mencapai Tahfizh Juz 30 QS. An Naba' – QS. Al-Muthoffifin. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607138",
    nisn: "0118756106",
    name: "Putri Azzahra",
    class: "9A",
    level: "J.30",
    pageDetail: "QS. Thaha ayat 76",
    materiTambahan: "Lulus EBTAQ Tahfizh Juz 30",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "QS. Thaha ayat 76",
    tahsinKeterangan: "Alhamdulillah Ananda sudah mampu membaca Al Qur'an dengan baik sesuai kaidah tajwid dan ghorib. Mohon dilanjutkan rutin terus tadarus di rumah. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "Lulus EBTAQ Tahfizh Juz 30",
    tahfizhKeterangan: "Alhamdulillah, Ananda Lulus EBTAQ Tahfizh Juz 30. Lanjutkan semangat menghafalnya di tingkat selanjutnya"
  },
  {
    nipd: "252607139",
    nisn: "0117777981",
    name: "Tsania Marwah",
    class: "8A",
    level: "J.27",
    pageDetail: "Tahsin Juz 27, QS. Al-Hadid",
    materiTambahan: "QS. Asy-Syams - An-Nas",
    asatidz: "Ria Setiawati",
    gender: "P",
    tahsinPencapaian: "Tahsin Juz 27, QS. Al-Hadid",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Juz 27 QS. Al-Hadid. Jangan terlalu terburu-buru, dengung, bacaan jelas diperhatikan. Mohon bimbingan dan motivasi selalu dari ayah dan bunda",
    tahfizhPencapaian: "QS. Asy-Syams - An-Nas",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  },
  {
    nipd: "252607140",
    nisn: "0118613224",
    name: "Tegar Aditya",
    class: "7C",
    level: "4B",
    pageDetail: "Jilid 4B",
    materiTambahan: "QS. Asy-Syams - An-Nas",
    asatidz: "Iskandar",
    gender: "L",
    tahsinPencapaian: "Jilid 4B",
    tahsinKeterangan: "Alhamdulillah, Ananda mencapai Tahsin Jilid 4B Hal. 35-48. Mohon terus istiqomah membaca bacaan dengung dan lantangkan suaranya",
    tahfizhPencapaian: "QS. Asy-Syams - An-Nas",
    tahfizhKeterangan: "Alhamdulillah Ananda sudah mampu menghafal surat pendek, mohon rutin murojaah di rumah. Lebih semangat lagi menghafalnya"
  }
];


const FIRST_NAMES_P = [
  'Alya', 'Bilqis', 'Dian', 'Eka', 'Fahira', 'Ghania', 'Humaira', 'Inayah', 
  'Jasmine', 'Kamila', 'Luthfia', 'Meidina', 'Nabila', 'Putri', 'Qonita', 
  'Rania', 'Salma', 'Syifa', 'Tsurayya', 'Ufairah', 'Warda', 'Zahra'
];

const FIRST_NAMES_L = [
  'Abdurrahman', 'Bagas', 'Dzaki', 'Fadhil', 'Gibran', 'Hafizh', 'Ihsan', 
  'Jafar', 'Khairi', 'Lukman', 'Mufid', 'Naufal', 'Othman', 'Pratama', 
  'Rafi', 'Siddiq', 'Thariq', 'Umar', 'Wahyu', 'Ziyad', 'Zulfikar', 'Hamzah'
];

const LAST_NAMES = [
  'Anwar', 'Arifin', 'Batubara', 'Dharmawan', 'Fadillah', 'Hidayat', 'Irawan', 
  'Kusuma', 'Laksana', 'Maulana', 'Nugroho', 'Prabowo', 'Ramadhan', 'Saputra', 
  'Tanjung', 'Utomo', 'Wibowo', 'Yusuf', 'Zulkarnain'
];

// Map legacy levels to the revised levels scheme of the image
export const mapToRevisedLevel = (level: string, index: number): string => {
  const norm = level.trim().toLowerCase();
  if (norm.startsWith('juz ')) {
    const juzNum = norm.replace('juz ', '');
    return `J.${juzNum}`;
  }
  if (norm === 'tajwid' || norm === 'ghorib') {
    return 'TG';
  }
  if (norm.startsWith('jilid ')) {
    const jildNum = norm.replace('jilid ', '');
    // jildNum is 1..6 or letters. Let's map 1->1A, 2->1B, 3->2A, 4->2B, 5->3A, 6->3B, etc.
    const mapping: Record<string, string> = {
      '1': '1A', '2': '1B', '3': '2A', '4': '2B', '5': '3A', '6': '3B', '7': '4A', '8': '4B'
    };
    return mapping[jildNum] || `${jildNum}A`;
  }
  return level; // already mapped, or some special value
};

// Generate exactly 339 students reliably
export function generate339Students(): Student[] {
  // Return the high fidelity real students list from parsed_students.json
  // Filter out any IX C Nadhif just in case, and return
  return (parsedStudentsRaw as any[]).filter(st => {
    const name = st.name ? st.name.toLowerCase() : '';
    const cls = st.class ? st.class.toLowerCase() : '';
    const isNadhif9c = name.includes('nadhif') && cls.includes('9');
    return !isNadhif9c;
  }) as Student[];
}

export function loadStudentsFromStore(): Student[] {
  const data = localStorage.getItem('siquran_students_v1');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // fallback
    }
  }
  const fresh = generate339Students();
  saveStudentsToStore(fresh);
  return fresh;
}

export function saveStudentsToStore(students: Student[]) {
  localStorage.setItem('siquran_students_v1', JSON.stringify(students));
}

export function resetStudentsStore(): Student[] {
  const fresh = generate339Students();
  saveStudentsToStore(fresh);
  return fresh;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
}

export function getLogs(): ActivityLog[] {
  const data = localStorage.getItem('siquran_logs_v1');
  if (data) {
    try {
      return JSON.parse(data);
    } catch {}
  }
  return [
    { id: '1', timestamp: '2026-06-22 14:32', user: 'PJ Hayu', action: 'Inisialisasi', details: 'Sistem berhasil diinisialisasi dengan 339 data peserta didik.' }
  ];
}

export function addLog(user: string, action: string, details: string) {
  const logs = getLogs();
  const newLog = {
    id: String(Date.now()),
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    user,
    action,
    details
  };
  logs.unshift(newLog);
  localStorage.setItem('siquran_logs_v1', JSON.stringify(logs.slice(0, 50)));
}
