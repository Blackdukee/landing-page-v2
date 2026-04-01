const { google } = require("googleapis");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const AdmZip = require("adm-zip");

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;
const BACKUP_TEMP_DIR = process.env.BACKUP_TEMP_DIR || "./tmp-backups";

// AUTH OPTION 1: Service Account
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

// AUTH OPTION 2: OAuth2 (Personal Account)
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;

let auth;

if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
  console.log("👤 Using OAuth2 (Personal Account)");
  auth = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET);
  auth.setCredentials({ refresh_token: REFRESH_TOKEN });
} else if (SERVICE_ACCOUNT_EMAIL && PRIVATE_KEY) {
  console.log("🤖 Using Service Account");
  auth = new google.auth.GoogleAuth({
    credentials: { client_email: SERVICE_ACCOUNT_EMAIL, private_key: PRIVATE_KEY },
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });
} else {
  console.error("❌ No valid Google credentials found in .env.local");
  process.exit(1);
}

const drive = google.drive({ version: "v3", auth });

async function runBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = path.join(BACKUP_TEMP_DIR, `backup-${timestamp}`);
  const zipPath = `${backupDir}.zip`;

  try {
    console.log("🚀 Starting MongoDB backup...");
    if (!fs.existsSync(BACKUP_TEMP_DIR)) fs.mkdirSync(BACKUP_TEMP_DIR, { recursive: true });
    fs.mkdirSync(backupDir, { recursive: true });

    console.log("🔌 Connecting to MongoDB...");
    if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(MONGODB_URI);
    }
    const db = mongoose.connection.db;
    console.log(`📡 Connected to Database: ${db.databaseName}`);

    const collections = await db.listCollections().toArray();
    console.log(`📂 Found ${collections.length} collections.`);

    for (const collab of collections) {
      const name = collab.name;
      console.log(`⏳ Exporting: ${name}...`);
      const docs = await db.collection(name).find({}).toArray();
      fs.writeFileSync(path.join(backupDir, `${name}.json`), JSON.stringify(docs, null, 2));
      console.log(`✅ Exported ${name} (${docs.length} docs)`);
    }

    console.log("📦 Zipping...");
    const zip = new AdmZip();
    zip.addLocalFolder(backupDir);
    zip.writeZip(zipPath);

    console.log("☁️ Uploading to Drive...");
    const response = await drive.files.create({
      requestBody: { name: `backup-${timestamp}.zip`, parents: [FOLDER_ID] },
      media: { mimeType: "application/zip", body: fs.createReadStream(zipPath) },
    });

    console.log(`🎉 Success! File ID: ${response.data.id}`);

    fs.rmSync(backupDir, { recursive: true, force: true });
    fs.unlinkSync(zipPath);
    console.log("✨ Done!");

  } catch (err) {
    if (err.response) console.error("❌ API Error:", err.response.data);
    else console.error("❌ Error:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runBackup();
