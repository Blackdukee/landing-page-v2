const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

const MONGODB_URI = process.env.MONGODB_URI;
const RESTORE_TEMP_DIR = "./tmp-restores";

async function runRestore() {
  const inputPath = process.argv[2];

  if (!inputPath) {
    console.error("❌ Please provide the path to your backup zip file or folder.");
    process.exit(1);
  }

  if (!fs.existsSync(inputPath)) {
    console.error("❌ Path not found:", inputPath);
    process.exit(1);
  }

  const isDirectory = fs.lstatSync(inputPath).isDirectory();
  let extractPath = inputPath;
  let needsCleanup = false;

  try {
    console.log("🚀 Starting MongoDB restore...");

    // 1. Handle ZIP vs Folder
    if (!isDirectory) {
      console.log("📦 Extracting ZIP archive...");
      const zip = new AdmZip(inputPath);
      extractPath = path.join(RESTORE_TEMP_DIR, `restore-${Date.now()}`);
      zip.extractAllTo(extractPath, true);
      needsCleanup = true;
      console.log(`✅ Extracted to: ${extractPath}`);
    } else {
      console.log(`📁 Reading from directory: ${inputPath}`);
    }

    // 2. Connect to MongoDB
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;
    console.log(`📡 Connected to Database: ${db.databaseName}`);

    // 3. Find JSON files
    const files = fs.readdirSync(extractPath).filter(f => f.endsWith(".json"));
    if (files.length === 0) {
        throw new Error("No .json files found in the backup path.");
    }
    console.log(`📂 Found ${files.length} collections to restore.`);

    // 4. Restore
    for (const file of files) {
      const collectionName = path.parse(file).name;
      const data = JSON.parse(fs.readFileSync(path.join(extractPath, file), "utf-8"));
      
      console.log(`⏳ Restoring collection: ${collectionName}...`);
      
      // Wipe and Insert
      await db.collection(collectionName).deleteMany({});
      if (data.length > 0) {
        await db.collection(collectionName).insertMany(data);
        console.log(`✅ Restored ${collectionName} (${data.length} docs)`);
      } else {
        console.log(`⚠️ ${collectionName} was empty.`);
      }
    }

    // 5. Cleanup
    if (needsCleanup) {
      console.log("🧹 Cleaning up temp extraction files...");
      fs.rmSync(extractPath, { recursive: true, force: true });
    }
    console.log("✨ Restore successful!");

  } catch (error) {
    console.error("❌ Restore failed:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runRestore();
