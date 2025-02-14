// const express = require("express");
// const cors = require("cors");
// const crypto = require("crypto");

// const app = express();
// app.use(express.json());
// app.use(cors());

// const trustedCredentials = new Set();

// // Generate a secure challenge for WebAuthn
// app.get("/challenge", (req, res) => {
//      const challenge = crypto.randomBytes(32).toString("base64");
//      res.json({ challenge });
// });

// app.post("/authenticate", async (req, res) => {
//      const { email, credentialId } = req.body;

//      if (!email || !credentialId) {
//           return res.status(400).json({ message: "Invalid request." });
//      }

//      // Check if the credentialId has been previously trusted
//      if (!trustedCredentials.has(credentialId)) {
//           trustedCredentials.add(credentialId); // Trust this credential for now
//      }

//      return res.json({ message: `Authentication successful for ${email}.` });
// });

// const PORT = 5001;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//---------------------------------------------------------------------------------------

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(bodyParser.json());

// Use CORS middleware:
app.use(cors()); // <-- This enables ALL cross-origin requests for dev

// Dummy "trusted" device set
const trustedDeviceIds = new Set(['my-laptop-123']);

app.post('/api/submit-email', (req, res) => {
     console.log('\n====================================');
     console.log('[SERVER] POST /api/submit-email called');
     console.log('[SERVER] Request body:', JSON.stringify(req.body, null, 2));

     const { email, deviceToken } = req.body;

     console.log('[STEP 1] Check if email is provided');
     if (!email) {
          console.log('[RESULT] Missing email');
          return res.status(400).send('Email is required');
     }

     console.log('[STEP 2] Check if deviceToken is provided');
     if (!deviceToken) {
          console.log('[RESULT] Missing device token');
          return res.status(403).send('Missing device token');
     }

     const { deviceId, expires } = deviceToken;
     console.log('[STEP 3] Check if deviceId is trusted');
     console.log(`         deviceId = ${deviceId}`);
     if (!trustedDeviceIds.has(deviceId)) {
          console.log(`[RESULT] Unrecognized deviceId: ${deviceId}`);
          return res.status(403).send(`Unrecognized deviceId ${deviceId}`);
     }

     console.log('[STEP 4] Check if token is expired');
     const now = Date.now();
     console.log(`         now = ${now}, expires = ${expires}`);
     if (now > expires) {
          console.log('[RESULT] Device token expired');
          return res.status(403).send('Device token expired');
     }

     // All checks pass
     console.log(`[STEP 5] All checks passed. Email: ${email}, deviceId: ${deviceId}`);
     console.log('[RESULT] Email submitted successfully!');
     console.log('====================================\n');
     res.status(200).send('Email submitted successfully');
});

const PORT = 3001;
app.listen(PORT, () => {
     console.log(`Server listening on port ${PORT}`);
});
