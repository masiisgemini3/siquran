const fs = require('fs');

const rawData = `No.,NIPD,NISN,Nama,KLS,Jilid/Juz,Hal/ayat dan surat,Materi tambahan,Asatidz,,CP,7A,7B,7C,7D,8A,8B,8C,8D,9A,9B,9C,9D,Total
1,1,#N/A,Aghna Imtiyaz Alifa,VII A,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams-Al-Qoriah, dan Doa.1-27 (doa sesudah adzan)",Nisa,,1A,0,0,0,0,0,0,0,0,0,0,0,0,0
2,Azka Humayra Firzanah,#N/A,Ahlam,VII A,AQ,QS. Qof,"Q.S. Asy-Syams-An-Nas, dan Doa.1-27 (doa sesudah adzan)",Nisa,,1B,0,0,0,0,0,0,0,0,0,0,0,0,0
3,Azka Humayra Firzanah,#N/A,Alisha Rosmelia Nurfedisha,VII A,AQ,QS. Qof,"Q.S. Asy-Syams-Al-Humazah, dan Doa.1-35 (doa setelah sholat dhuha)",Nisa,,2A,0,0,0,0,0,0,0,0,0,0,0,0,0
4,Azka Humayra Firzanah,#N/A,Amra Husen,VII A,TAHSIN J.27,QS. Qof,"Q.S. Asy-Syams-An-Nas, dan Doa.1-21 (doa sesudah wudhu)",Nisa,,2B,0,0,2,0,0,0,0,1,0,0,0,0,3
5,Naila Husna,#N/A,Hadijah Khairunnisa,VII A,TG,QS. Qof,"Q.S. Asy-Syams-An-Nas, dan Doa.1-30 (doa menghadapi musibah)",Nisa,,3A,0,0,2,1,0,0,0,0,0,0,0,0,3
6,Nasya Kieran Adzkiya,#N/A,Jasmine Putri Aisyah,VII A,TG,QS. Qof,"Q.S. Asy-Syams-At-Takatsur, dan Doa.1-34 (doa menjelang sore)",Nisa,,3B,0,0,2,0,4,0,0,0,0,0,0,0,6
7,Shanum Radinka Cassidy,#N/A,Malaeka Falilah,VII A,AQ,QS. Qof,"Q.S. Asy-Syams-An-Nas, dan Doa.1-26 (doa naik kendaraan)",Nisa,,4A,7,0,1,0,3,0,1,0,0,0,0,0,12
8,Felicia Salsabila,#N/A,Nashwa Fadya Izzati Syakira,VII A,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams-An-Nas, dan Doa.1-32 (doa turun hujan)",Nisa,,4B,4,1,5,0,2,0,10,0,0,0,6,0,28
9,Moh Faqih Hidayatullah,#N/A,Brata Tirta Winata,VII C,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams-Al-Lail, dan Doa.1-22 (doa masuk masjid)",Nisa,,TAHSIN J.27,7,0,8,0,8,1,6,0,6,0,7,0,43
10,Elzo Haidar Arash,#N/A,Darrel Haidar Alzam,VII C,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams-An-Nas, dan Doa.1-35 (doa setelah sholat dhuha)",Nisa,,AQ,3,0,3,0,3,1,11,0,13,0,5,0,39
11,Parvez Kresna Andhika,#N/A,Muhammad Devan Adixxie,VII C,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams-Al-Alaq, dan Doa.1-21(doa sesudah wudhu)",Nisa,,TG,8,1,4,4,4,4,0,2,9,0,7,1,44
12,Sean Paundra Putrakiyan,#N/A,Raditya Alaric Nurfattah,VII C,AQ,QS. Qof,"Q.S. Asy-Syams-An-Nas, dan Doa.1-12 (doa berserah diri kepada Allah)",Nisa,,J.30,2,1,0,9,1,2,1,4,3,4,5,11,43
13,Aisyara Miranda Kristiono,#N/A,Muhammad Nafis Nafasat,VII C,AQ,QS. Qof,"Q.S. Asy-Syams-Al-Lail, dan Doa.1-21 (doa bangun tidur)",Nisa,,J.29,1,15,0,8,1,9,1,11,0,8,0,6,60
14,Nadhifa Nugraha,#N/A,Muhammad Raihan El Azzam,VII C,AQ,QS. Qof,"Q.S. Asy-Syams-Al-Qodr, dan Doa.1-15 (doa melepas pakaian)",Nisa,,J.28,0,6,0,2,1,1,0,4,0,4,0,3,21
15,Qyara Anjani Putri,#N/A,Naura Althafunnisa,VIII B,J.30,1/4 Juz kesatu,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.27,0,5,0,2,0,2,0,0,0,8,0,4,21
16,Sheryl Aira Sabella,#N/A,Nada Salsabila Indahati,VIII B,J.30,1/4 Juz kesatu,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.26,0,3,0,0,0,1,0,3,0,1,0,1,9
17,A'Eni Zafina Aaleyah,#N/A,Aretha Rayya Sabrina Maulana,VIII A ,J.30,1/4 Juz kesatu,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.25,0,0,0,0,0,0,0,0,0,0,0,0,0
18,Anggraeni Putri,#N/A,Raisa Safaraz Azalia,VIII A ,J.29,1/4 Juz kesatu,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.24,0,0,0,0,0,0,0,0,0,0,0,0,0
19,Rhaisa Aurelygina,#N/A,Darrell Octavian Putra Setyono,VIII D,J.30,1/4 Juz kesatu,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.23,0,0,0,0,0,0,0,0,0,0,0,0,0
20,Ghayda Filzah,#N/A,Muhamad Raka Iskandar,VIII D,J.30,1/4 Juz keempat,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.22,0,0,0,0,0,0,0,0,0,0,0,0,0
21,Ghaisan Abidzar Rahman,#N/A,Muhammad Arsyad Adharesyandi,VIII D,J.29,Lulus EBTAQ Tahfizh Juz 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.21,0,0,0,0,0,0,0,1,0,0,0,0,1
22,Raffa Cahya Ramadhan,#N/A,Muhammad Radhyar Yahdi Al-Haq,VIII D,J.30,1/4 Juz kesatu,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.20,0,0,0,0,0,0,0,0,0,0,0,0,0
23,Anindia Putri Maritza,#N/A,Jabbaar Dwi Istanto,VIII D,J.30,1/4 Juz ketiga,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.19,0,0,0,0,0,0,0,0,0,0,0,0,0
24,Faradiba,#N/A,Mohammad Hafizh Pharama Artha,VIII C,J.30,1/4 Juz kesatu,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Nisa,,J.18,0,0,0,0,0,0,0,0,0,1,0,0,1
25,Hafizah Nur Anisa,#N/A,Jasmine Arda Ramadhani,IX A,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Humazah, dan Doa.1-21(sesudah wudhu)",Nisa,,J.17,0,0,0,0,0,0,0,0,0,0,0,0,0
26,Khansa Nur Aini,#N/A,Kayla Laksmi,IX A,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Adiyat, dan Doa.1-21 (doa sesudah wudhu)",Nisa,,J.16,0,0,0,0,0,0,0,0,0,0,0,0,0
27,Naura Khairunnisa Azzahra,#N/A,Keisya Izzatunasyifa,IX A,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Adiyat, dan Doa.1-21(doa sesudah wudhu)",Nisa,,J.15,0,0,0,0,0,0,0,0,0,0,0,0,0
28,Rayna Nur Safitri,#N/A,Kara Lintang Supriyadi,IX A,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Lail, dan Doa.1-11 (doa kebaikan dunia akhirat)",Nisa,,J.14,0,0,0,0,0,0,0,0,0,0,0,0,0
29,Rifdah,#N/A,Haifa Farhanah,IX A,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Lail, dan Doa.1-15 (doa melepas pakaian)",Nisa,,J.13,0,0,0,0,0,0,0,0,0,0,0,0,0
30,Syifa Aulia,#N/A,Najwa Caroline,IX A,AQ,QS. As-Shofat,"Q.S. Asy-Syams-Quraisy, dan Doa.1-35(doa setelah sholat dhuha)",Nisa,,J.12,0,0,0,0,0,0,0,0,0,0,0,0,0
31,Tsauqifa Aisyah Noureen,#N/A,Nizieta Azzahra Effendi,IX A,AQ,QS. As-Shofat,"Q.S. Asy-Syams-Al-Zalzalah, dan Doa.1-27 (doa sesudah adzan)",Nisa,,J.11,0,0,0,0,0,0,0,0,0,0,0,0,0
32,Adyaraka Azka Wibowo,#N/A,Nurul Azijah,IX A,AQ,QS. As-Shofat,"Q.S. Asy-Syams-Al-Bayyinah, dan Doa.1-21 (doa sesudah wudhu)",Nisa,,J.10,0,0,0,0,0,0,0,0,0,0,0,0,0
33,Muhammad Rafa Alfarizqi,#N/A,Ratu Trie Agustina Rhamadani,IX A,AQ,QS. As-Shofat,"Q.S. Asy-Syams-Al-Bayyinah, dan Doa.1-21(doa sesudah wudhu)",Nisa,,J.9,0,0,0,0,0,0,0,0,0,0,0,0,0
34,Muhammad Raffa Chaidar,#N/A,Ahmad Yusuf Gunawan,IX C,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Lail, dan Doa.1-11 (doa kebaikan dunia akhirat)",Nisa,,J.8,0,0,0,0,0,0,0,0,0,0,0,0,0
35,Nizam Mudzaki Sofyan,#N/A,Aisyah Adji Ayu Wandira,IX A,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Humazah, dan Doa.1-21 (doa sesudah wudhu)",Nisa,,J.7,0,0,0,0,0,0,0,0,0,0,0,0,0
36,Noya Naufal Fajlurahman,#N/A,Faeyza Kaindra Ramadian,IX C,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams, dan Doa.1-17 (doa keluar WC)",Nisa,,J.6,0,0,0,0,0,0,0,0,0,0,0,0,0
37,Hisyam Akhdan Assyafi,#N/A,Arya Dwi Syahputra,IX C,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Lail, dan Doa.1-21 (doa sesudah wudhu)",Nisa,,J.5,0,0,0,0,0,0,0,0,0,0,0,0,0
38,Adi Putra Hardigaluh,#N/A,Fadhil Putra Abdi,IX C,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Ashr, dan Doa.1-27 (doa sesudah adzan)",Nisa,,J.4,0,0,0,0,0,0,0,0,0,0,0,1,1
39,,,Mario Muhammad Arthur,IX C,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-At-Tin, dan Doa.1-7 (doa bangun tidur)",Nisa,,J.3,0,0,0,0,0,0,0,0,0,0,0,0,0
40,,,Emir Sarif Achsan,IX C,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams, dan Doa.1-11 (doa kebaikan dunia akhirat)",Nisa,,J.2,0,0,0,0,0,0,0,0,0,0,0,0,0
41,,,Arfa Hakan Asydda,IX C,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Lail, dan Doa.1-7 (doa bangun tidur)",Nisa,,J.1,0,0,0,0,2,0,0,0,2,0,0,4
42,,,Abdurrahman Sudaes Al Fatih,IX C,TAHSIN J.27,QS. At-Thur,"Q.S. Asy-Syams-Al-Lail, dan Doa.1-7 (doa bangun tidur)",Nisa,,,,,,,,,,,,,,,
43,,,Alif Rushan Abbasyof,VII C,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams, dan doa 1-11 (doa kebaikan dunia akhirat)",Nisa,,Total,32,32,27,26,27,23,30,26,31,28,30,27,339
44,,,Ramadhan Ilham Nasrullah,VII C,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams-Al-lail, dan doa 1-13 (doa mohon keteguhan hati)",Nisa,,,,,,,,,,,,,,,
45,,,Yopi Dwi Kurniawan,VII C,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams-At-Tin, dan doa 1-7(doa bangun tidur)",Nisa,,,N,H,M,W,hr,K,Ns,I,R,Hb,,,Total
46,,,Adyasta Dityo Firzatullah,VII C,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams-Al-Fil, dan doa 1-7(doa bangun tidur)",Nisa,,1A,0,0,0,0,0,0,0,0,,0,,,0
47,,,Annisa Naura Salsabilla Hakim,VII C,TAHSIN J.27,QS. Al-Hadid,"Q.S. Asy-Syams, dan doa 1-13 (doa mohon keteguhan hati)",Nisa,,1B,0,0,0,0,0,0,0,0,,0,,,0
,,,#REF!,#REF!,#REF!,#REF!,#REF!,Nisa,,2A,0,0,0,0,0,0,0,0,,0,,,0
,,,#REF!,#REF!,#REF!,#REF!,#REF!,#REF!,,2B,0,0,0,2,0,1,0,0,,0,,,3
,,,#REF!,#REF!,#REF!,#REF!,#REF!,#REF!,,3A,0,0,0,3,0,0,0,0,,0,,,3
,,,#REF!,#REF!,#REF!,#REF!,#REF!,#REF!,,3B,0,0,0,2,0,4,0,0,,0,,,6
,,,#REF!,#REF!,#REF!,#REF!,#REF!,#REF!,,4A,0,0,0,2,0,3,0,0,,0,,,5
,,,#REF!,#REF!,#REF!,#REF!,#REF!,#REF!,,4B,0,0,0,0,0,3,0,12,,0,,,15
,,,#REF!,#REF!,#REF!,#REF!,#REF!,#REF!,,TAHSIN J.27,0,0,0,0,0,0,25,15,,0,,,40
,,,#REF!,#REF!,#REF!,#REF!,#REF!,#REF!,,AQ,0,0,14,0,0,0,10,0,,15,,,39
,,,,,,,,,,TG,15,27,0,0,0,0,2,0,,0,,,44
1,,,Adzkiyaa Ramiiza Putri,VII A,TG,Lulus EBTAQ Tahsin,"QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.30,9,0,0,0,0,12,8,14,,0,,,43
2,,,Alya Nuraini,VII A,TG,Lulus EBTAQ Tahsin,"QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.29,0,12,10,10,0,14,2,0,,12,,,60
3,,,Amanda Hafiza Queenshania,VII A,TG,Lulus EBTAQ Tahsin,"QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.28,0,0,1,2,14,0,0,0,,7,,,24
4,,,Ghaziyah Alzeina Kurniadi,VII A,TG,Lulus EBTAQ Tahsin,"QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.27,0,0,5,10,7,0,0,0,,0,,,22
5,,,Kinanthi Amira Priambodo,VII A,TG,"Tajwid, Pelajaran 13","QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.26,0,0,3,0,6,0,0,0,,0,,,9
6,,,Syakira Raihanah Humaira,VII A,TG,Lulus EBTAQ Tahsin,"QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.25,0,0,0,0,0,0,0,0,,0,,,0
7,,,Ratu Balqis Al Humaira,VII B,TG,Lulus EBTAQ Tahsin,"QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.24,0,0,0,0,0,0,0,0,,0,,,0
8,,,Ihsan Nurfaisal,VII C,TG,Lulus EBTAQ Tahsin,"QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.23,0,0,0,0,0,0,0,0,,0,,,0
9,,,Muhammad Fathan Ibnu Salman,VII C,TG,Lulus EBTAQ Tahsin,"QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.22,0,0,0,0,0,0,0,0,,0,,,0
10,,,Auda Malik Ibrahim,VII C,TG,"Tajwid, Pelajaran 5","QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.21,0,0,0,0,1,0,0,0,,0,,,1
11,,,Daffa Abyan Rafif,VII C,TG,"Tajwid, Pelajaran 13","QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.20,0,0,0,0,0,0,0,0,,0,,,0
12,,,Gibran Adhyasta Jandrya,VII D,TG,"Tajwid, Pelajaran 13","QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.19,0,0,0,0,0,0,0,0,,0,,,0
13,,,Muhammad Rizqi,VII D,TG,"Tajwid, Pelajaran 13","QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.18,0,0,0,0,1,0,0,0,,0,,,1
14,,,Rassya Muhammad Aqila,VII D,TG,"Tajwid, Pelajaran 13","QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.17,0,0,0,0,0,0,0,0,,0,,,0
15,,,Yudha Dwi Pangestu,VII D,TG,"Tajwid, Pelajaran 13","QS. Asy-Syams - An Naas, Doa 1-35 (Doa sesudah sholat Dhuha)",Najiyyah,,J.16,0,0,0,0,0,0,0,0,,0,,,0
16,,,Dara Ayu Ramadina,IX B,J.30,Lulus EBTAQ Tahfizh Juz 30,"Bacaan sholat, dzikir,  doa 1-31",Najiyyah,,J.15,0,0,0,0,0,0,0,0,,0,,,0
17,,,Nazira Riza Abdat,IX B,J.30,Lulus EBTAQ Tahfizh Juz 30,"Bacaan sholat, dzikir,  doa 1-31",Najiyyah,,J.14,0,0,0,0,0,0,0,0,,0,,,0
18,,,Naida Syakira Zaini,IX B,J.30,Lulus EBTAQ Tahfizh Juz 30,"Bacaan sholat, dzikir,  doa 1-31",Najiyyah,,J.13,0,0,0,0,0,0,0,0,,0,,,0
19,,,Rumaisha Muhammad Baisa,IX B,J.30,Lulus EBTAQ Tahfizh Juz 30,"Bacaan sholat, dzikir,  doa 1-31",Najiyyah,,J.12,0,0,0,0,0,0,0,0,,0,,,0
20,,,Ayman Muhammad,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,"Bacaan sholat, dzikir,  doa 1-31",Najiyyah,,J.11,0,0,0,0,0,0,0,0,,0,,,0
21,,,Fa'Iz Zulfan Athallah,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,"Bacaan sholat, dzikir,  doa 1-31",Najiyyah,,J.10,0,0,0,0,0,0,0,0,,0,,,0
22,,,Ridwan Ali,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,"Bacaan sholat, dzikir,  doa 1-31",Najiyyah,,J.9,0,0,0,0,0,0,0,0,,0,,,0
23,,,Sidqi,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,"Bacaan sholat, dzikir,  doa 1-31",Najiyyah,,J.8,0,0,0,0,0,0,0,0,,0,,,0
24,,,Muhammad Althof,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,"Bacaan sholat, dzikir,  doa 1-31",Najiyyah,,J.7,0,0,0,0,0,0,0,0,,0,,,0
25,,,,#N/A,,,,,,J.6,0,0,0,0,0,0,0,0,,0,,,0
26,,,,#N/A,,,,,,J.5,0,0,0,0,0,0,0,0,,0,,,0
27,,,,#N/A,,,,,,J.4,0,0,0,0,1,0,0,0,,0,,,1
28,,,,#N/A,,,,,,J.3,0,0,0,0,0,0,0,0,,0,,,0
29,,,,#N/A,,,,,,J.2,0,0,0,0,0,0,0,0,,0,,,0
30,,,,#N/A,,,,,,J.1,0,0,0,0,4,0,,0,,0,,,4
31,,,,#N/A,,,,,,,,,,,,,,,,,,,
32,,,,#N/A,,,,,,Total,24,39,33,31,34,37,47,41,0,34,,,320
33,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
1,,,Alfathunissa Syalabiyyah Shanum,VII B,J.29,QS. Nuh : 20,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
2,,,Azka Humayra Firzanah,VII B,J.29,QS. Al-Qolam : 45,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
3,,,Balqis,VII B,J.29,Lulus EBTAQ Tahfizh juz 29,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
4,,,Nabila Khairunnisa Salima,VII B,J.29,QS. Al-Muzzammil : 15,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
5,,,Naila Husna,VII B,J.29,Lulus EBTAQ Tahfizh juz 29,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
6,,,Nasya Kieran Adzkiya,VII B,J.29,QS. Al-Ma'arij : 44,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
7,,,Shanum Radinka Cassidy,VII B,J.29,QS. Al-Qiyamah : 20,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
8,,,Felicia Salsabila,VII A,J.29,QS. Nuh : 28,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
9,,,Moh Faqih Hidayatullah,VII D,J.29,QS. Nuh : 15,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
10,,,Elzo Haidar Arash,VII D,J.29,QS. Al- Ma'arij : 30,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
11,,,Parvez Kresna Andhika,VII D,J.29,QS. Al-Mulk - Nuh,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
12,,,Sean Paundra Putrakiyan,VII D,J.29,QS. Al-Qolam : 30,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
13,,,Aisyara Miranda Kristiono,VIII A ,TG,"Tajwid Pelajaran ke-13, Ghorib Halaman 44",Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
14,,,Nadhifa Nugraha,VIII A ,TG,"Tajwid Pelajaran ke-8,Ghorib Halaman 40",Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
15,,,Qyara Anjani Putri,VIII A ,TG,"Tajwid Pelajaran ke-13, Ghorib Halaman 44",Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
16,,,Sheryl Aira Sabella,VIII A ,TG,"Tajwid Pelajaran ke-13, Ghorib Halaman 44",Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
17,,,A'Eni Zafina Aaleyah,VIII B,TG,"Tajwid Pelajaran ke-13, Ghorib Halaman 44",Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
18,,,Anggraeni Putri,VIII B,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
19,,,Rhaisa Aurelygina,VIII B,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
20,,,Ghayda Filzah,VIII B,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
21,,,Ghaisan Abidzar Rahman,VIII D,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
22,,,Raffa Cahya Ramadhan,VIII D,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
23,,,Anindia Putri Maritza,IX A,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
24,,,Faradiba,IX A,TG,"Tajwid Pelajaran ke-4, Ghorib Halaman 25",Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
25,,,Hafizah Nur Anisa,IX A,TG,Finishing,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
26,,,Khansa Nur Aini,IX A,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
27,,,Naura Khairunnisa Azzahra,IX A,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
28,,,Rayna Nur Safitri,IX A,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
29,,,Rifdah,IX A,TG,finishing,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
30,,,Syifa Aulia,IX A,TG,finishing,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
31,,,Tsauqifa Aisyah Noureen,IX A,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
32,,,Adyaraka Azka Wibowo,IX C,TG,"Tajwid Pelajaran ke-4, Ghorib Halaman 25",Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
33,,,Bassam Solahudin,IX C,TG,"Tajwid Pelajaran ke-3, Ghorib Halaman 25",Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
34,,,Muhammad Rafa Alfarizqi,IX C,TG,"Tajwid Pelajaran ke-3, Ghorib Halaman 25",Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
35,,,Muhammad Raffa Chaidar,IX C,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
36,,,Nizam Mudzaki Sofyan,IX C,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
37,,,Noya Naufal Fajlurahman,IX C,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
38,,,Hisyam Akhdan Assyafi,IX C,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
39,,,Adi Putra Hardigaluh,IX D,TG,Lulus EBTAQ Tahsin,Doa 1 (Memulai pekerjaan) -35 (setelah solat Dhuha),Hayu,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,, ,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
1,,,Aisha Hafizhah Fatin,VII B,J.26,Al-Ahqaf ayat 12,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
2,,,Alifia Salma Fakhira,VII B,J.26,Al-Fath ayat 26,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
3,,,Aulia Hasnaa Alesha,VII B,J.26,Al-Ahqaf ayat 18,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
4,,,Aurora Khansa Aulia,VII B,J.27,Al-Hadid ayat 15,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
5,,,Gelsy Adiva Nayra Achmad,VII B,J.27,Al-Hadid ayat 20,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
6,,,Nuansa Ameera Aji,VII B,J.27,Al-Hadid ayat 13,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
7,,,Quinsha Hazna Camila,VII B,J.27,Al-Hadid ayat 10,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
8,,,Vladislav Nava Syahla,VII B,J.27,An-Najm ayat 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
9,,,Fayza Adila Elysia,VIII B,J.28,Al-Mujadilah ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
10,,,Jihan Maulida Sandrica,VIII B,J.29,Nuh,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
11,,,Najiyyah,VIII B,J.29,Al-Mursalat ,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
12,,,Tazqia Ranyanisa Fauziah,VIII B,J.29,Nuh ,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
13,,,Zafirah Farid Hatrash,VIII B,J.29,Al-Qalam ayat 16,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
14,,,Azra Muhammad Zahwan,VIII D,J.29,Al-Qiyamah,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
15,,,Muhammad Abrar Al Baihaqi,VIII D,J.29,Al-Qalam ayat 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
16,,,Muhammad Hanif Zafirrudin,VIII D,J.29,Al-Haqqah ayat 8,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
17,,,Nizam Ibrahim Suranuraga,VIII D,J.29,Al-Mursalat,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
18,,,Ricardo Pratama Rakhadiansyah,VIII D,J.29,Al-Haqqah ayat 18,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
19,,,Fakhri Rausan Fikriwijaya,VIII D,J.29,Nuh,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
20,,,Azzahra Muhammad Zimah,IX A,AQ,QS.Fathir ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
21,,,Callysta Marseille Riyadi,IX A,AQ,QS.Fathir ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
22,,,Diandra Paramitha Sudiono,IX A,AQ,QS.Fathir ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
23,,,Kaisya Fathiyya Sabrina,IX A,AQ,QS.Fathir ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
24,,,Khanza Aulia Risti,IX A,AQ,QS.Fathir ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
25,,,Nizzah,IX A,AQ,QS.Fathir ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
26,,,Tania Putri Anindya,IX A,AQ,QS.Fathir ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
27,,,Hazira Ghaniah Zahra Izzati,IX A,AQ,QS.Fathir ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha),Miftah,,,,,,,,,,,,,,,
28,,,Nadhifa ,IX A,AQ,QS.Fathir ayat 3,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Miftah,,,,,,,,,,,,,,,
29,,,Akbar Abigail Asmadiwangsa,IX C,AQ,QS.Fathir ayat 3,Doa 1-15(doa memulai pekerjaan hingga doa melepas pakaian),Miftah,,,,,,,,,,,,,,,
30,,,Mhd Azzam Wafi Affandi,IX C,AQ,QS.Fathir ayat 3,Doa 1-10(doa memulai pekerjaan hingga doa kedua orang tua),Miftah,,,,,,,,,,,,,,,
31,,,Muhammad Yazid Ilmany Suhendar,IX C,AQ,QS.Fathir ayat 3,Doa 1-24(doa memulai pekerjaan hingga doa berbuka puasa),Miftah,,,,,,,,,,,,,,,
32,,,Muhammad Asyam Nadhif,IX C,AQ,QS.Fathir ayat 3,Doa 1-15(doa memulai pekerjaan hingga doa melepas pakaian),Miftah,,,,,,,,,,,,,,,
33,,,Ramadhika Arsyad Naraya,IX C,AQ,QS.Fathir ayat 3,Doa 1-15(doa memulai pekerjaan hingga doa melepas pakaian),Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,#N/A,,,,Miftah,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
1,,,Fani Aziza Rahman,VII A,4A,Halaman 1,Q.S. Al-l-'Alaq - Do'a memulai suatu pekerjaan hingga do'a keluar WC,Wahidin,,,,,,,,,,,,,,,
2,,,Rafi Faaris Ristanto,VII C,3A,Halaman 1-20,Q.S.At-Tin - Do'a memulai suatu pekerjaan hingga do'a Mau belajar,Wahidin,,,,,,,,,,,,,,,
3,,,Uwais Zamiota Yusup,VII C,2B,Halaman 32-60,Q.S.Al-insyiroh - Do'a memulai suatu pekerjaan hingga do'a Melepas pakaian,Wahidin,,,,,,,,,,,,,,,
4,,,Alexander Rahmanov,VII C,3A,Halaman 1-31,Q.S.Al-insyiroh - Do'a memulai suatu pekerjaan hingga do'a Melepas pakaian,Wahidin,,,,,,,,,,,,,,,
5,,,Muhammad Aufar Hafizhan,VII C,3B,Halaman 32-60,Q.S. Al-Lail - Do'a memulai suatu pekerjaan hingga do'a Masuk Rumah,Wahidin,,,,,,,,,,,,,,,
6,,,Moch Raffa Yohandri,VII C,4A,Halaman 1-31,Q.S. Al-l-'Alaq 1-5 - Do'a memulai suatu pekerjaan hingga do'a keteguhan hati,Wahidin,,,,,,,,,,,,,,,
7,,,Wiky Lubada Pratama,VII C,2B,Halaman 32-60,Q.S. Al-Lail - Do'a memulai suatu pekerjaan hingga do'a Mau Makan,Wahidin,,,,,,,,,,,,,,,
8,,,Muhammad Jami Azfar Rayyan,VII C,3B,Halaman 32-60,Q.S.Al-insyiroh - Do'a memulai suatu pekerjaan hingga do'a berserah diri,Wahidin,,,,,,,,,,,,,,,
9,,,Syafiq Fadhil Akhtar,VII D,3A,Halaman 1-4,Q.S.Al-insyiroh - Do'a memulai suatu pekerjaan hingga do'a Masuk rumah,Wahidin,,,,,,,,,,,,,,,
10,,,Daffa Azmi Khairan,VIII D,J.29,Q.S. Al-Muzammil 1-20,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
11,,,Farzan Ahza Argani,VIII D,J.29,Q.S. Al-Mursalat 1-50,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
12,,,Muhammad Husein,VIII D,J.29,Q.S. Al-Qolam 1-22,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
13,,,Muhammad Kamal,VIII D,J.29,Q.S. Al-jin 1-26,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
14,,,Naufal Azka Dhiyaelfajr,VIII D,J.28,Q.S. Al-Mujadalah 1-3,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
15,,,Heru Cakrabuana,VIII C,J.29,Q.S. Al-Qolam 1-37,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
16,,,Annisa Cira Alana,VIII B,J.29,Q.S. Al-Muzammil 1-15,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
17,,,Afiqa Salsabila Kadarusman,VIII B,J.29,Q.S. Al-Qolam 1-15,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
18,,,Naevandra Kamea Moana Legi,VIII B,J.29,Q.S. Al-Ma'arij 1-44,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
19,,,Naura Anditha Permana,VIII B,J.29,Q.S. Al-Ma'arij 1-44,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
20,,,Stefhanie Nur Hidayanti,VIII B,J.29,Q.S. Al-Jin 1-28,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
21,,,Faza Nuril Khafiyya,VIII A ,J.28,Q.S. Al-Mujadalah 1-6,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
22,,,Aulia Talitha Athaya,IX B,J.29,Q.S. Al-Mursalat 1-40,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
23,,,Dzakiyah Nur Hanifah,IX B,J.27,Lulus  EBTAQ,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
24,,,Kamila Hasanah Javda,IX B,J.27,Q.S. An-Najm 1-62,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
25,,,Monica Sheffa Refasya,IX B,J.27,Q.S. An-Najm 1-26,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
26,,,Nariswari Ahnaf Fakhira,IX B,J.27,Lulus  EBTAQ,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
27,,,Quinsha Jasmine Zahirah,IX B,J.27,Q.S. An-Najm 1-20,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
28,,,Affan Anhar Baihaky,IX D,J.27,Q.S. An-Najm 1-49,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
29,,,Hafiyyandika Ahnaf Putra,IX D,J.27,Q.S. An-Najm 1-26,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
30,,,Mirza Rizqi Pratama,IX D,J.27,Q.S. Al-Qomar 1-27,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
31,,,Muhammad Dzaka Alif Al Abiyyu,IX D,J.27,Q.S. An-Najm 1-23,Do'a 1-32 (Do'a Memulai suatu pekerjaan  hingga do'a  turun Hujan),Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,#N/A,,,,Wahidin,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
1,,,Aisha Mughny Shaliha,VII B,J.28,QS. Al-Munafiqun: 7,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
2,,,Anisya Septunainti,VII B,J.28,QS. At-Taghabun: 6,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
3,,,Khayla Almeera Yudha Maritza,VII B,J.28,QS. Al-Hasyr: 9,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
4,,,Larissa Mahdatifa,VII B,J.28,QS. As-Shaff,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
5,,,Tantika Putri Hermawan,VII B,J.28,QS. Al-Hasyr: 14,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
6,,,Albirru Rano Ibrahim,VII D,J.28,QS. At-Taghabun: 9,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
7,,,Dimas Akhdan Sutanto,VII D,J.27,QS. Ad-Dzariyat: 51,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
8,,,Muhammad Khiar Musyafa,VII D,J.27,QS. Ad-Dzariyat: 60,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
9,,,Muhammad Rifid Nadhif,VII D,J.28,QS. As-Shaff: 5,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
10,,,Aisyah Shafa Camilla Ansori,VIII B,J.26,QS. Qaf: 38,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
11,,,Nadhifa Askana Salsabil,VIII B,J.27,QS. At-Tur: 27,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
12,,,Nayla Luthfi Fatina,VIII B,J.27,QS. At-Tur: 28,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
13,,,Qonita Ahnaf Gaswara,VIII B,J.1,QS. Al-Baqarah: 76,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
14,,,Rifa Rihana,VIII B,J.1,QS. Al-Baqarah: 108,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
15,,,Abdullah,VIII D,J.21,QS. Ar-Rum: 5,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
16,,,Ahmad Fauzan Rajab,VIII D,J.28,QS. Al-Munafiqun: 7,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
17,,,Mohamad Raffa Al Gian,VIII D,J.26,QS. Qaf: 15,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
18,,,Muhammad Mirza Asy Syauqi,VIII D,J.26,QS. Al-Ahqaf: 14,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
19,,,Muhammad Raezqa Arkharega,VIII D,J.26,QS. Al-Ahqaf: 17,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
20,,,Reyhan Dzaky Almair,VIII D,J.28,QS. Al-Hasyr: 4,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
21,,,Rifqi Zidan Farras,VIII D,J.28,QS. At-Tahrim: 8,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
22,,,Jessenia Meira Elzyra,IX B,J.26,QS. Muhammad: 19,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
23,,,Maulidya Zidny Rachmany,IX B,J.1,QS. Al-Baqarah: 83,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
24,,,Nadjwa Azzahra,IX B,J.18,Lulus EBTAQ Tahfizh Juz 18,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
25,,,Nida Ulhaq Nur Syifa,IX B,J.27,Lulus EBTAQ Tahfizh Juz 27,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
26,,,Salsabila Khansa Fitriani,IX B,J.1,QS. Al-Baqarah: 93,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
27,,,Vadelya Nazifa Syahla,IX B,J.27,Lulus EBTAQ Tahfizh Juz 27,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
28,,,Ghailan Kevan Dhiaurahman,IX D,J.4,Lulus EBTAQ Tahfizh Juz 4,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
29,,,Raikha Latief Wijaya,IX D,J.26,Lulus EBTAQ Tahfizh Juz 26,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
30,,,Kayla Adzkia Sasikirani,IX B,J.27,Lulus EBTAQ Tahfizh Juz 27,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
,,,Balqis,VII B,J.28,QS. Al-Mujadalah: 11,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
,,,Naila Husna,VII B,J.28,QS. Al-Mujadalah: 11,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
,,,Zahrana Fatimah,VII B,J.28,QS. Al-Mujadalah,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
,,,Naufal Azka Dhiyaelfajr,VIII D,J.28,QS. Al-Mujadalah,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Harits,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
1,,,Putri Shayla Azzahra,VII B,J.30,QS. An-Naba - QS. Al-A'la,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
2,,,Naurah,VII B,J.30,QS. An-Naba - QS. Al-A'la,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
3,,,Abdul Rasyid Muhammad Baisa,VII D,J.30,QS. An-Naba - QS. An-Nas,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
4,,,Arafat,VII D,J.30,QS. An-Naba - QS. At-Takwir,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
5,,,Azka Nur Raditya,VII D,J.30,QS. An-Naba - QS. Al-Insyiroh,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
6,,,Faeyza Alvaro Nurfeto,VII D,J.30,QS. An-Naba - QS. At-Thoriq,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
7,,,Jabbar Putra Sugiyantoro,VII D,J.30,QS. An-Naba - QS. Al-A'la,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
8,,,Muhammad Faiz Akbar,VII D,J.30,QS. An-Naba - QS. An-Nas,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
9,,,Muhammad Hafiz Rusyaidi,VIII A ,J.30,QS. An-Naba - QS. At-Takwir,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
10,,,Rifky Ikhsan Ramadhan,VIII A ,J.30,QS. An-Naba - QS. Al-Insyiroh,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
11,,,Aina Farah Aulia,VIII A ,4A,QS. An-Naba - QS. At-Thoriq,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
12,,,Aslah Husen,VIII A ,3B,QS. An-Naba - QS. Al-A'la,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
13,,,Gaung Intan Nurhakiki,VIII A ,3B,QS. An-Naba - QS. An-Nas,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
14,,,Jihan Shafwa Raihanah,VIII A ,4A,QS. An-Naba - QS. Al-A'la,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
15,,,Khaira Nisa Muaddiba,VIII A ,3B,QS. An-Naba - QS. Al-Al-Insyiqoq,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
16,,,Vivi Prapanca Vidiyasih,VIII A ,3B,Halaman 1-23,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
17,,,Danny Firmansyah,VIII C,4A,Halaman 1-60,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
18,,,Wildan Irhab Nabiel,VIII D,2B,Halaman 1-60,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
19,,,Amelinda Almira Zahra,IX B,J.29,Halaman 1-34,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
20,,,Aninda Salsabil Jannah,IX B,J.29,Halaman 60,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
21,,,Hafizah Aidah Setiana,IX B,J.29,Halaman 32-59,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
22,,,Nadia Meitsania Sutanto,IX B,J.29,Halaman 1-27,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
23,,,Reissya Nadhifa Nathania,IX B,J.29,Halaman 32-60,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
24,,,Tiara Nazmiraj Dziyana,IX B,J.29,QS. Al-Mulk - QS. Al-Mursalat,"QS. Asy-Syams - QS. Al-Lail, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
25,,,Zivanna Salwa Az Zahirah,IX B,J.29,QS. Al-Mulk - QS. Al-Mursalat,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
26,,,Amr,IX D,J.29,QS. Al-Mulk - QS. Al-Mursalat,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
27,,,Andhika Trystan Nararya,IX D,J.29,QS. Al-Mulk - QS. Al-Haqqah,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
28,,,Mochamad Rizky Fidel Purnama,IX D,J.29,QS. Al-Mulk - QS. Al-Qiyamah,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
29,,,Muchsin,IX D,J.29,QS. Al-Mulk - QS. Al-Mursalat,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
30,,,Raden Faiq Danadyaksa Ibrahim,IX D,J.29,QS. Al-Mulk - QS. Al-Mursalat,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
31,,,Rey Rizqy A'Isy,IX D,J.29,QS. Al-Mulk - QS. Al-Jin,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
32,,,Khairunnisa Qutratu'Ain,VII A,J.30,Lulus EBTAQ Tahfizh Juz 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
33,,,Hilwa Ramzi Assaidi,VII B,J.29,QS. Al-Mulk - QS. Al-Mursalat,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
34,,,Rafif Azzam Assyafi,VII D,J.30,Lulus EBTAQ Tahfizh Juz 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Kukuh,,,,,,,,,,,,,,,
35,,,Fahmi Febrian Adinata,VIII C,4B,Halaman 35-60,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
36,,,Rifat Karem Benzema,VIII C,4B,Halaman 35-60,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
37,,,Salim Faalih,VIII C,4B,Halaman 35-60,"QS. Asy-Syams - QS. Al-Bayinah, Doa 1-35",Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,#N/A,,,,Kukuh,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
1,,,Baihaqi Rizal Rifaldi,IX C,J.30,QS. Al-Muthoffifin,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
2,,,Naufal Mumtaz Adzzaky Irawan,IX C,J.30,QS. At-Tiin,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
3,,,Mohammad Dzaki,IX C,J.30,QS. Al-Ghosyiyah,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
4,,,Ziggy Farras Octovian,IX C,J.30,QS. Asy-Syamsy,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
5,,,Muhammad Wildan,IX C,J.30,QS. Al-Buruuj,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
6,,,Muhamad Zhalfin Alfahridzi,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
7,,,Muhammad Kalih Sakha,IX D,J.30,QS. Al-Muthoffifin,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
8,,,Kharel Breviandra Wirawiryawan,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
9,,,Bagas Yunar Prayoga,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
10,,,Zidan Abbie Rashya,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
11,,,Rizky Azmi Nugraha,IX D,J.30,Lulus EBTAQ Tahfizh Juz 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
12,,,Abdullah Alfariski,VIII C,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
13,,,Abimanyu Putra,VIII C,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
14,,,Azka Farid Hilman,VIII C,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
15,,,Bagus Nata Utama,VIII C,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
16,,,Nabhan Adli Syafiqurrahman,VIII C,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
17,,,Aliyah Khoirunisa,VIII A ,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
18,,,Aziza Fathiyyah Putri Cahyadi,VIII A ,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
19,,,Khalisa Gendis Ayudia,VIII A ,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
20,,,Nazneen Baktir,VIII A ,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
21,,,Tiara Milannatasya Nisti,VIII A ,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
22,,,Nadhifa,VIII A ,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
23,,,Fajar Irsyad Kamil,VIII C,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
24,,,Nadia Salsabila,VII A,4B,Halaman 35-45,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
25,,,Raissa Salsabila Adzkiya,VII A,4B,Halaman 35-60 ML,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
26,,,Naziha,VII B,4B,Halaman 35-52,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
27,,,Raisya Yasmin,VIII A ,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
28,,,Adibah,VII A,4B,Lulus Jilid 4B,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
29,,,Xena Natik,VII A,4B,Lulus Jilid 4B,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
30,,,Assyifa Kamila Dayta,VII A,4B,Lulus Jilid 4B,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
31,,,Yasmin Rahman Widiasyakira,VII A,4B,Halaman 35-60 ML,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
32,,,Abdul Walid Akhirudin,VII C,4B,Halaman 35-60 ML,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
33,,,Mohammad Panji Kusumah Hidayatullah,VII C,4B,Halaman 35-60 ML,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
34,,,Muhammad Hilmi Azizan,VII C,4B,Halaman 35-36,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
35,,,Fayza Aqila Khanza,VII A,4B,Halaman 35-55,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
36,,,Filza Qorriaina Priyadi,VIII B,TAHSIN J.27,QS. Al- Hadid,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
37,,,Aliyah Mumtaz,IX A,J.30,QS. Al-Ghosyiyah,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
38,,,Freya Susana Adistira,IX A,J.30,QS. Al-Muthoffifin,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
39,,,Putri Azzahra,IX A,J.30,Lulus EBTAQ Tahfizh Juz 30,Doa 1-35 (doa memulai pekerjaan hingga doa sesudah shalat dhuha) ,Iskandar,,,,,,,,,,,,,,,
40,,,Tsania Marwah,VIII A ,TAHSIN J.27,QS. Al- Hadid,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
41,,,Tegar Aditya,VII C,4B,Halaman 35-48,"Q.S. Asy-Syams, dan Doa.1-31. (doa turun hujan)",Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,#N/A,,,,Iskandar,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
1,,,#REF!,#REF!,#REF!,#REF!,#REF!,#REF!,,,,,,,,,,,,,,,
2,,,Muhammad Hasan Al Mahdi,VII C,4B,Halaman 34-40,QS. Asy-Syamsy - QS. Adh-Dhuha dan Doa 1-13 (Do'a memulai suatu pekerjaan - Do'a Keteguhan Hati),Riyanto,,,,,,,,,,,,,,,
3,,,Electra Artha Mecca,VII A,4A,Halaman 23-28,QS. Asy-Syamsy - QS. Al-Humazah dan Doa 1-17 (Do'a memulai suatu pekerjaan - Do'a keluar WC),Riyanto,,,,,,,,,,,,,,,
4,,,Calysta Zafirah Azka,VII A,4A,Halaman 29-32,QS. Asy-Syamsy - QS. Asy-Syarh dan Doa 1-24 (Do'a memulai pekerjaan - Do'a Berbuka Puasa),Riyanto,,,,,,,,,,,,,,,
5,,,Hasnaa' Firyaal,VII A,4A,Halaman 1-34,QS. Asy-Syamsy - QS. Al-'Adiyat dan Doa 1-27 (Do'a memulai pekerjaan - Do'a sesudah adzan),Riyanto,,,,,,,,,,,,,,,
6,,,Aninda Alfatunnisa,VII A,4A,Halaman 18-20,QS. Asy-Syamsy - QS. At-Tin  dan Doa 1-11 (Do'a memulai pekerjaan - Do'a Kebaikan dunia dan akhirat),Riyanto,,,,,,,,,,,,,,,
7,,,Devia Almaqfericha Rahmawati,VII A,4A,Halaman 1-34,QS. Asy-Syamsy - QS. Al-Fil dan Doa 1-27 (Do'a memulai pekerjaan - Do'a Sesudah adzan),Riyanto,,,,,,,,,,,,,,,
8,,,Marwah Maharani,VII A,4A,Halaman 3-17,QS. Asy-Syamsy - QS. Al-Lail dan Doa 1-13 (Do'a memulai pekerjaan - Do'a mohon keteguhan hati),Riyanto,,,,,,,,,,,,,,,
9,,,Kanza Azzahra Raditya,VII A,4B,Halaman 34-60,QS. Asy-Syamsy - QS. An-Nas dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
10,,,Griselda Humeyra,VIII A ,4B,Halaman 38-45,QS. Asy-Syamsy - QS. An-Nas dan Doa 1-35 (Do'a memulai suatu pekerjaan - Do'a setelah sholat duha),Riyanto,,,,,,,,,,,,,,,
11,,,Marsya Azkadina,VIII A ,4A,Halaman 1-34,QS. Asy-Syamsy - QS. An-Nas dan Doa 1-35 (Do'a memulai suatu pekerjaan - Do'a setelah sholat duha),Riyanto,,,,,,,,,,,,,,,
12,,,Muhammad Mu'Adz Rabbani Kamal,VIII C,4B,Halaman 32-38,QS. Asy-Syamsy - QS. At-Tin dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
13,,,#REF!,#REF!,#REF!,#REF!,#REF!,#REF!,,,,,,,,,,,,,,,
14,,,Sepagaya Bayu Azhari,VIII C,4B,Halaman 1-60,QS. Asy-Syamsy - QS. An-Nas dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
15,,,Bagas Aditya Kurniawan,VIII C,4B,Halaman 38-60,QS. Asy-Syamsy - QS. At-Tin dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
16,,,Dwivanza Fahruzain Gibran,VIII C,4B,Halaman 34-60,QS. Asy-Syamsy - QS. An-Nas dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
17,,,Galang Rafasya Rezky Sanjaya,VIII C,4B,Halaman 56-60,QS. Asy-Syamsy - QS. An-Nas dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
18,,,Aldo Alfarizqi Fadhillah,VIII C,4B,Halaman 41-46,QS. Asy-Syamsy - QS. Al-Qadr dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
19,,,Achmad Andre Arsavin,VIII C,4B,Halaman 34-39,QS. Asy-Syamsy - QS. At-Tin dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
20,,,Muhamad Abiyu Fahrezi,IX C,4B,Halaman 34-60,QS. Asy-Syamsy - QS. Adh-Dhuha dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
21,,,Muhammad Ihsan,IX C,4B,Halaman 34-60,QS. Asy-Syamsy - QS. Al-Bayinah dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
22,,,Marvin Yusuf Fadhila,IX C,4B,Halaman 34-60,QS. Asy-Syamsy - QS. Al-Bayinah dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
23,,,Rayyan Satrya Al Yusuf,IX C,4B,Halaman 34-60,QS. Asy-Syamsy - QS. Adh-Dhuha dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
24,,,Rival Rizky Andrian,IX C,4B,Halaman 34-60,QS. Asy-Syamsy - QS. An-Nas dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
25,,,Muhammad Rauzan Fikri,IX C,4B,Halaman 34-60,QS. Asy-Syamsy - QS. Adh-Dhuha dan Doa 1-20 (Do'a memulai pekerjaan - Do'a jawaban orang bersin),Riyanto,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,=Riyan!$D$32,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,=Riyan!$D$34,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,#N/A,,,,,,,,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,
1,,,Adisty Intan Farzana,VII B,J.29,QS. Al-Mulk - Al-Mursalat 34,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
2,,,Azkia Nazwa Fadhilah,VII B,J.29,QS. Al-Mulk - Al-Qiyamah 40,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
3,,,Alya Talitha Athaya,VII B,J.29,QS. Al-Mulk - Al-Insan 18,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
4,,,Deajeng Ayu Nawang Wulan,VII B,J.29,QS. Al-Mulk - Al-Jin,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
5,,,Laneesha Shafa Saziah,VII B,J.29,QS. Al-Mulk - Al-Haqqah 47,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
6,,,Rufaida Sugito,VII B,J.29,QS. Al-Mulk - Al-Jin 17,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
7,,,Zahrana Fatimah,VII B,J.29,QS. Al-Mulk - Al-Mursalat (LULUS EBTAQ TAHFIZH JUZ 29),Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
8,,,Raisa Syakila Cherisaputri,VII B,J.29,QS. Al-Mulk - Al-Haqqah 38,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
9,,,Leeandry Septiar,VII D,J.29,QS. Al-Mulk - Al-Muzzammil 13,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
10,,,Madu Seno,VII D,J.29,QS. Al-Mulk - Al-Ma'arij ,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
11,,,Yaseer Akbar Arifin,VII D,J.29,QS. Al-Mulk - Al-Mursalat,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
12,,,Ibrahim Nur Habibi,VII D,J.29,QS. Al-Mulk - Al-Haqqah 39,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
13,,,Annizam Nadhif Pranaja,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - An-Nas,Habib,,,,,,,,,,,,,,,
14,,,Athar Luqman Al Hakim,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - An-Nas,Habib,,,,,,,,,,,,,,,
15,,,Kevino Javier Oman,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - At-Takatsur,Habib,,,,,,,,,,,,,,,
16,,,Muhammad Afiff,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - Al-Adiyat,Habib,,,,,,,,,,,,,,,
17,,,Muhammad Jio Fahlevi,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - Al-lahab,Habib,,,,,,,,,,,,,,,
18,,,Muhammad Rafi Dzulfiansyah,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - An-Nas,Habib,,,,,,,,,,,,,,,
19,,,Muhammad Rafiyandi,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - An-Nas,Habib,,,,,,,,,,,,,,,
20,,,Rasya Adlan Ridhabillah,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - An-Nas,Habib,,,,,,,,,,,,,,,
21,,,Razka Shifan Azhari,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - An-Nas,Habib,,,,,,,,,,,,,,,
22,,,Suparmo Brata Sentana,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams -  An-Nas,Habib,,,,,,,,,,,,,,,
23,,,Zidan Alfahredzi Hidayat,VIII C,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - An-Nas,Habib,,,,,,,,,,,,,,,
24,,,Natasya Angelin Kurniawan,VIII A ,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - An-Nas,Habib,,,,,,,,,,,,,,,
25,,,Azkya Naura Affandi,VIII A ,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - An-Nas,Habib,,,,,,,,,,,,,,,
26,,,Muhammad Fadlan Khaerul Azam,IX D,J.28,QS. Al-Mujadalah - At-Tahrim,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
27,,,Syafiq Nawawi Al Maliki,IX D,J.28,QS. Al-Mujadalah - Ath-Thalaq ,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
28,,,Regan Mirza,IX D,J.28,QS. Al-Mujadalah - At-Tahrim (LULUS EBTAQ TAHFIZH JUZ 28) ,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
29,,,Cherryl Vernita Putri,IX B,J.28,QS. Al-Mujadalah - Ath-Thalaq 1,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
30,,,Faiza Mardhiyyah,IX B,J.28,QS. Al-Mujadalah - At-Tahrim (LULUS EBTAQ TAHFIZH JUZ 28) ,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
31,,,Naufa Putri Nazhifah,IX B,J.28,QS. Al-Mujadalah - At-Tahrim (LULUS EBTAQ TAHFIZH JUZ 28) ,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
32,,,Tya Dwi Alona,IX B,J.28,QS. Al-Mujadalah - At-Taghobun 18,Bacaan Sholat dan Doa 1-35 (doa memulai pekerjaan hingga doa sesudah solat dhuha),Habib,,,,,,,,,,,,,,,
33,,,Aisyah Syifa,VIII B,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - Al-Alaq,Habib,,,,,,,,,,,,,,,
34,,,Shafira Azkadina Putri,VIII A ,AQ,QS. Al-Ahqaf ayat 14,QS. Asy-Syams - Al-Fil,Habib,,,,,,,,,,,,,,,
`;

const lines = rawData.split('\n');

const students = [];

for (let line of lines) {
  line = line.trim();
  if (!line || line.startsWith('No.,NIPD') || line.includes('Total') || line.includes('CP,7A')) continue;
  
  // Custom splitting to handle commas inside quotes
  const parts = [];
  let currentPart = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      parts.push(currentPart.trim());
      currentPart = '';
    } else {
      currentPart += char;
    }
  }
  parts.push(currentPart.trim());
  
  // Match row format: [No, NIPD, NISN, Nama, KLS, Jilid/Juz, Hal/ayat, MateriTambahan, Asatidz, ...]
  // Wait! Some rows have empty first columns or empty indexes.
  // Let's filter out rows that don't have a valid student name or are completely empty or have error markings like #REF!
  if (parts.length < 5) continue;
  
  let name = '';
  let cls = '';
  let level = '';
  let pageDetail = '';
  let materiTambahan = '';
  let asatidz = '';
  
  // Find name: it will be a string that is not empty, not #REF!, and in the first few columns
  // Let's analyze line structure:
  // Usually name is in parts[3] if parts[0] is index, or parts[1] etc.
  // Let's look at Najiyyah: "1,,,Adzkiyaa Ramiiza Putri,VII A,TG,Lulus EBTAQ Tahsin..." -> parts[0]="1", parts[1]="", parts[2]="", parts[3]="Adzkiyaa Ramiiza Putri", parts[4]="VII A"
  // Let's look at Nisa: "1,1,#N/A,Aghna Imtiyaz Alifa,VII A,TAHSIN J.27,QS. Al-Hadid..." -> parts[0]="1", parts[1]="1", parts[2]="#N/A", parts[3]="Aghna Imtiyaz Alifa", parts[4]="VII A"
  // Let's look at some others: ",,,Balqis,VII B,J.28..." -> parts[0]="", parts[1]="", parts[2]="", parts[3]="Balqis", parts[4]="VII B"
  
  // So the name is always around index 3 of the parts, and class is parts[4], level is parts[5], pageDetail is parts[6], materiTambahan is parts[7], asatidz is parts[8].
  // Let's double check this rule.
  name = parts[3];
  cls = parts[4];
  level = parts[5];
  pageDetail = parts[6];
  materiTambahan = parts[7];
  asatidz = parts[8];
  
  if (!name || name === '#REF!' || name === '#N/A' || name === 'Total' || name.startsWith('Total')) continue;
  if (!cls || cls === '#REF!' || cls === '#N/A') continue;
  
  // Check if class is 7 (VII) or 8 (VIII)
  let cleanClass = cls.toUpperCase().replace(/\s+/g, '');
  if (cleanClass.startsWith('VIIIA')) cleanClass = '8A';
  else if (cleanClass.startsWith('VIIIB')) cleanClass = '8B';
  else if (cleanClass.startsWith('VIIIC')) cleanClass = '8C';
  else if (cleanClass.startsWith('VIIID')) cleanClass = '8D';
  else if (cleanClass.startsWith('VIIA')) cleanClass = '7A';
  else if (cleanClass.startsWith('VIIB')) cleanClass = '7B';
  else if (cleanClass.startsWith('VIIC')) cleanClass = '7C';
  else if (cleanClass.startsWith('VIID')) cleanClass = '7D';
  else if (cleanClass.startsWith('VIII')) {
    // maybe "VIII A"
    const sub = cleanClass.replace('VIII', '');
    cleanClass = '8' + sub;
  } else if (cleanClass.startsWith('VII')) {
    // maybe "VII A"
    const sub = cleanClass.replace('VII', '');
    cleanClass = '7' + sub;
  }
  
  if (!cleanClass.startsWith('7') && !cleanClass.startsWith('8')) {
    // Skip class 9 or others
    continue;
  }
  
  // Clean up teacher name
  let cleanTeacher = asatidz ? asatidz.trim() : '';
  if (!cleanTeacher) {
    // Try to find if teacher name is at the end or somewhere else, let's look at parts
    // In some rows like ",,,Balqis,VII B,J.28,QS. Al-Mujadalah: 11,Doa 1-35... ,Harits"
    // The teacher is "Harits" which is the last non-empty part
    for (let i = parts.length - 1; i >= 0; i--) {
      if (parts[i] && ['Nisa', 'Najiyyah', 'Hayu', 'Miftah', 'Wahidin', 'Harits', 'Kukuh', 'Iskandar', 'Riyanto', 'Habib'].includes(parts[i].trim())) {
        cleanTeacher = parts[i].trim();
        break;
      }
    }
  }
  
  if (!cleanTeacher) {
    cleanTeacher = 'Hayu'; // Fallback
  }
  
  // Map level
  let cleanLevel = level ? level.trim().toUpperCase() : 'J.30';
  if (cleanLevel.startsWith('JILID')) {
    cleanLevel = cleanLevel.replace('JILID', '').trim();
  }
  if (cleanLevel.includes('JUZ')) {
    cleanLevel = cleanLevel.replace('JUZ', 'J.').replace(/\s+/g, '');
  }
  if (cleanLevel === 'AQ' || cleanLevel === 'AL-QURAN' || cleanLevel === 'AL QURAN') {
    cleanLevel = 'AQ';
  }
  
  // Gender
  const gender = (cleanTeacher === 'Najiyyah' || cleanTeacher === 'Nisa' || cleanTeacher === 'Hayu' || cleanTeacher === 'Miftah') ? 'P' : 'L';
  
  const index = students.length;
  let cleanNipd = parts[1] && parts[1] !== '#N/A' && parts[1] !== '1' ? parts[1].trim() : '';
  if (!cleanNipd || /[a-zA-Z]{3,}/.test(cleanNipd)) {
    cleanNipd = `NIPD-${10000 + index}`;
  }
  
  let cleanNisn = parts[2] && parts[2] !== '#N/A' ? parts[2].trim() : '';
  if (!cleanNisn || /[a-zA-Z]{3,}/.test(cleanNisn)) {
    cleanNisn = `30010${100 + index}`;
  }

  students.push({
    id: `S${10001 + index}`,
    nipd: cleanNipd,
    nisn: cleanNisn,
    name: name.trim(),
    class: cleanClass,
    level: cleanLevel,
    pageDetail: pageDetail ? pageDetail.trim() : 'QS. An-Naba : 1-10',
    materiTambahan: materiTambahan ? materiTambahan.trim() : 'Doa 1-35',
    asatidz: cleanTeacher,
    shift: (index % 3) + 1,
    naikTingkatThisMonth: false,
    gender,
    tahsinNilai: 80 + (index % 16),
    tahfizhNilai: 82 + (index % 14),
    materiTambahanNilai: 85 + (index % 11),
    tahsinPencapaian: "Sangat Baik",
    tahsinKeterangan: "Lancar makhraj, tajwid dan kelancaran membaca",
    tahfizhPencapaian: "Baik",
    tahfizhKeterangan: "Hafalan lancar dan fasih"
  });
}

console.log(`Successfully parsed ${students.length} students!`);
fs.writeFileSync('parsed_students.json', JSON.stringify(students, null, 2));
