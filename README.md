# Desktop Biometric Auth Challenge

This project demonstrates a **desktop biometric**-protected flow for submitting an email. Instead of using full **WebAuthn** passkeys, we only trigger the platform’s biometric prompt (e.g., **Touch ID**, **Windows Hello**) and treat success/failure as a **boolean**. We then send a **time-bound, device-bound token** to the server, which checks the token before allowing the action (submitting an email).

## Table of Contents

1. [Overview](#overview)  
2. [Key Technologies](#key-technologies)  
3. [How It Works (Technical Flow)](#how-it-works-technical-flow)  
4. [Project Structure](#project-structure)  
5. [Setup & Installation](#setup--installation)  
6. [Usage](#usage)  
7. [Security & Limitations](#security--limitations)  
8. [Acknowledgments](#acknowledgments)

---

## 1. Overview

- **Objective**: Ensure only the legitimate device owner (with **local biometrics**) can submit an email.  
- **Approach**:  
  1. **Prompt** the user for **Touch ID** / **Windows Hello** via the WebAuthn API (`navigator.credentials.get()` with `userVerification: 'required'`).  
  2. **If success**, generate a **device token** (`{ deviceId, expires }`) and store it locally for a short time (e.g., 5 minutes).  
  3. **Submit email** + **token** to the server.  
  4. **Server checks** if `deviceId` is trusted and `expires` is valid.  

**No passkeys** or credential signatures are stored. We’re simply using local biometrics as a yes/no check.

---

## 2. Key Technologies

- **Front End**:  
  - [React](https://reactjs.org/) (JavaScript)  
  - [WebAuthn API (navigator.credentials.get)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)

- **Back End**:  
  - [Node.js](https://nodejs.org/)  
  - [Express.js](https://expressjs.com/) for the REST API  
  - [CORS](https://www.npmjs.com/package/cors) if front-end and back-end are on different ports

---

## 3. How It Works (Technical Flow)

**Diagram of the flow**:

```
[User] --requests--> [Browser App (React)]
     \--(1)--> triggers WebAuthn [Device OS Biometric Prompt]
     (2) <-- success or fail -- [Device OS]
     (3) -> upon success, store a token { deviceId, expires } in React state
     (4) -> user clicks "Submit Email", sends { email, deviceToken } to server

[Server (Express)]
  1) Checks deviceId is "trusted"
  2) Checks expires is still valid (not expired)
  -> If valid, accept email
  -> Else, 403 error
```

1. **User initiates** verification:  
   - Calls `navigator.credentials.get({ publicKey: { userVerification: 'required' } })`.  
   - OS-level prompt for biometrics.
   
2. **Boolean success**:  
   - If the user passes Touch ID / Windows Hello, the OS returns a `PublicKeyCredential`.  
   - We don’t use the cryptographic data inside—just treat it as a sign of local presence.

3. **Device Token**:  
   - In the **React state**, we store a **short-lived token**, e.g.:
     ```js
     { deviceId: 'my-laptop-123', expires: <timestamp + 5 minutes> }
     ```
     
4. **Sending Email**:  
   - When the user clicks **Submit**, we `POST` to `/api/submit-email` with:
     ```json
     {
       "email": "user@example.com",
       "deviceToken": {
         "deviceId": "my-laptop-123",
         "expires": 1699999999999
       }
     }
     ```

5. **Server Verification**:  
   - Checks if `deviceId` is in a **trusted** list (hard-coded in this demo).  
   - Checks if `expires` is still in the future.  
   - If valid, logs or stores the email; otherwise sends a 403 error.

---

## 4. Project Structure

A possible directory layout:

```
biometric-auth-challenge/
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   └── ...
│   ├── public/
│   ├── package.json
│   └── ...
└── backend/
    ├── server.js
    ├── package.json
    └── ...
```

- **frontend/src/App.js**: Main React component that handles:
  - Biometric prompt with `navigator.credentials.get()`
  - Storing `deviceToken` in state
  - Submitting email + token to server
- **backend/server.js**: Express server verifying the device token and logging or handling the email submission.

---

## 5. Setup & Installation

### Prerequisites

1. **Node.js** (14+ recommended)  
2. **npm** or **yarn**  
3. A **desktop device** with a **built-in biometric** authenticator (e.g., Windows Hello, MacBook with Touch ID).

### Steps

1. **Clone** this repo:
   ```bash
   git clone https://github.com/<your-username>/biometric-auth-challenge.git
   cd biometric-auth-challenge
   ```

2. **Front End** (React):
   ```bash
   cd frontend
   npm install
   npm start
   ```
   - By default, React runs at `http://localhost:3000`.

3. **Back End** (Express):
   ```bash
   cd ../backend
   npm install
   node server.js
   ```
   - By default, this server listens at `http://localhost:3001`.

4. **CORS** or Proxy:
   - If you fetch directly from `<http://localhost:3001>`, you may need to enable [CORS](https://www.npmjs.com/package/cors) on the server or configure a **proxy** in the React app.

---

## 6. Usage

1. **Open** the React app in your browser: <http://localhost:3000>  
2. **Enter an email** into the form.  
3. **Click “Verify Device”**:
   - This triggers a biometric prompt (e.g., Touch ID).  
   - If successful, “Device verified successfully!” appears.  
4. **Click “Submit Email”**:
   - The front end sends `{ email, deviceToken }` to `/api/submit-email`.  
   - The server checks if `deviceId` is in the trusted set and if `expires` is valid.  
   - If both checks pass, you’ll see “Email submitted successfully!” in the UI.

### Watch the Server Logs

- In the backend terminal, you should see logs like:
  ```text
  [SERVER] POST /api/submit-email called
  [SERVER] Request body: { "email": "test@example.com", "deviceToken": { "deviceId": "my-laptop-123", "expires": 1699999999999 } }
  [STEP 3] Check if deviceId is trusted
  [STEP 4] Check if token is expired
  [RESULT] Email submitted successfully!
  ```

---

## 7. Security & Limitations

- **Non-Cryptographic**: We are not using **passkeys** or real WebAuthn credential signatures. We only rely on `userVerification: 'required'` for a local yes/no outcome.  
- **Trusted Devices**: The example uses a **hard-coded** device set (`my-laptop-123`). In production, you’d store device registrations in a database and verify cryptographically.  
- **Token**: The `{ deviceId, expires }` token is **not** signed. A malicious user could theoretically tamper with it. In a real system, you’d sign or encrypt it, or use a secure session.  
- **Browser/OS Support**: Desktop biometrics with WebAuthn require a compatible OS + hardware (e.g., Windows Hello, Mac Touch ID). If not available, the prompt fails.  
- **Expiry**: The code uses a short time-bound token (like 5 minutes) to allow multiple submissions if needed. Real flows might prompt for biometrics on each sensitive action or store sessions differently.

---

## 8. Acknowledgments

- [Web Authentication API (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API)
- [React Docs](https://reactjs.org/docs/getting-started.html)
- [Express](https://expressjs.com/) for the simple back-end framework

Feel free to contribute or open issues if you have suggestions or improvements!
