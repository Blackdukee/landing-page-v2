const { google } = require("googleapis");
const http = require("http");
const { URL } = require("url");

// Configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error("❌ Please provide GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your .env.local first!");
  process.exit(1);
}

async function getAccessToken() {
  const oAuth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    "http://localhost:3001" // This is the redirect URI
  );

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent", // This forces a Refresh Token to be generated
    scope: ["https://www.googleapis.com/auth/drive.file"],
  });

  console.log("🚀 Authorize this app by visiting this url:");
  console.log(authUrl);

  const server = http.createServer(async (req, res) => {
    try {
      if (req.url.includes("code=")) {
        const urlObj = new URL(req.url, "http://localhost:3001");
        const code = urlObj.searchParams.get("code");
        
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("✅ Auth success! Check your terminal.");

        const { tokens } = await oAuth2Client.getToken(code);
        console.log("\n✅ YOUR REFRESH TOKEN IS:");
        console.log(tokens.refresh_token);
        console.log("\nCopy this into your GOOGLE_REFRESH_TOKEN in .env.local");
        
        server.close();
        process.exit(0);
      }
    } catch (e) {
      console.error("❌ Error retrieving token:", e);
      res.end("❌ Error—check console.");
    }
  }).listen(3001);

  console.log("⏳ Waiting for code on http://localhost:3001...");
}

getAccessToken();
