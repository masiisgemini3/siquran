const { initializeApp } = require("firebase/app");
const { 
  getFirestore, 
  collection, 
  getDocs, 
  writeBatch, 
  doc, 
  setDoc
} = require("firebase/firestore");
const fs = require("fs");

const firebaseConfig = {
  apiKey: "AIzaSyCqjsEExe1U0DqtoW6daXKB2LNtVedqnkQ",
  authDomain: "crypto-plexus-498915-c8.firebaseapp.com",
  projectId: "crypto-plexus-498915-c8",
  storageBucket: "crypto-plexus-498915-c8.firebasestorage.app",
  messagingSenderId: "1090984979568",
  appId: "1:1090984979568:web:b24f2e91cbb895b2b998b5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-3538a2cc-a5b6-4c75-96a3-1cad3ebcaca5");

async function main() {
  console.log("Reading parsed_students.json...");
  const students = JSON.parse(fs.readFileSync("./parsed_students.json", "utf-8"));
  console.log(`Loaded ${students.length} students from parsed_students.json`);

  console.log("Fetching existing students to wipe...");
  const snapshot = await getDocs(collection(db, "students"));
  console.log(`Found ${snapshot.size} existing students to delete.`);

  // Delete in batches of 500
  let deleteCount = 0;
  let batch = writeBatch(db);
  for (const docSnap of snapshot.docs) {
    batch.delete(docSnap.ref);
    deleteCount++;
    if (deleteCount % 500 === 0) {
      await batch.commit();
      batch = writeBatch(db);
      console.log(`Committed deletion of ${deleteCount} students...`);
    }
  }
  if (deleteCount % 500 !== 0) {
    await batch.commit();
    console.log(`Committed final deletion batch. Total deleted: ${deleteCount}`);
  }

  console.log("Uploading new students...");
  batch = writeBatch(db);
  let uploadCount = 0;
  for (const student of students) {
    const studentRef = doc(db, "students", student.id);
    batch.set(studentRef, {
      ...student,
      updatedAt: new Date().toISOString()
    });
    uploadCount++;
    if (uploadCount % 500 === 0) {
      await batch.commit();
      batch = writeBatch(db);
      console.log(`Committed upload of ${uploadCount} students...`);
    }
  }
  if (uploadCount % 500 !== 0) {
    await batch.commit();
    console.log(`Committed final upload batch. Total uploaded: ${uploadCount}`);
  }

  // Also update the config seeding_status to force it not to re-seed from old seedDatabaseIfEmpty
  console.log("Updating seeding_status to reflect custom CSV data import...");
  await setDoc(doc(db, "configs", "seeding_status"), {
    id: "seeding_status",
    hasSeeded: true,
    seededAt: new Date().toISOString(),
    isCustomCsvImported: true,
    customCount: uploadCount
  });

  // Create clean initial log
  console.log("Creating initialization log...");
  await setDoc(doc(db, "logs", "custom_csv_import"), {
    id: "custom_csv_import",
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    user: "PJ Kenaikan Kelas",
    action: "Inisialisasi Database",
    details: `Hapus seluruh database lama, dan impor ${uploadCount} data santri baru Kelas 7 & 8 dari excel.`
  });

  console.log("DATABASE WIPE AND RE-IMPORT COMPLETED SUCCESSFULLY!");
}

main().catch(err => {
  console.error("Error running import:", err);
  process.exit(1);
});
