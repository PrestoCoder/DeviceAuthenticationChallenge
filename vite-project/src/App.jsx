
import React, { useState } from 'react';

function App() {
  const [email, setEmail] = useState('');
  const [deviceVerified, setDeviceVerified] = useState(false);
  const [deviceToken, setDeviceToken] = useState(null);
  const [message, setMessage] = useState('');

  // Helper to generate random bytes for the "challenge"
  function generateRandomChallenge(length = 32) {
    const randomValues = new Uint8Array(length);
    window.crypto.getRandomValues(randomValues);
    return randomValues;
  }

  // Called when user clicks "Verify Device"
  const handleVerifyDevice = async () => {
    setMessage('Verifying your device...');
    try {
      // Create dummy "publicKey" options with userVerification = "required"
      const publicKey = {
        challenge: generateRandomChallenge(),
        userVerification: 'required',
      };

      // Trigger WebAuthn to prompt for biometrics
      const credential = await navigator.credentials.get({ publicKey });

      if (!credential) {
        setMessage('Biometric verification failed or was cancelled.');
        setDeviceVerified(false);
        return;
      }

      // If we get here, the user passed biometrics
      setMessage('Device verified successfully!');

      // Generate a time-bound token (not cryptographically signed)
      const deviceId = 'my-laptop-123'; // Example device identifier
      const expiresInMs = 5 * 60 * 1000; // 5 seconds
      const tokenObject = {
        deviceId,
        expires: Date.now() + expiresInMs,
      };

      setDeviceToken(tokenObject);
      setDeviceVerified(true);
    } catch (error) {
      console.error('Biometric verification error:', error);
      setMessage('Error verifying device. Make sure biometrics is set up.');
      setDeviceVerified(false);
    }
  };

  // Called when user clicks "Submit Email"
  const handleSubmitEmail = async () => {
    if (!deviceVerified || !deviceToken) {
      setMessage('Device has not been verified. Please verify your device first.');
      return;
    }

    // Prepare data to send
    const payload = {
      email,
      deviceToken,
    };

    try {
      const response = await fetch('http://localhost:3001/api/submit-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Server returned an error.');
      }

      setMessage('Email submitted successfully!');
    } catch (err) {
      console.error('Error submitting email:', err);
      setMessage(`Submission failed: ${err.message}`);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '2rem' }}>
      <h1>Desktop Biometric Email Submission</h1>

      <label htmlFor="email-input">Email:</label>
      <input
        id="email-input"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: '100%', marginBottom: '1rem' }}
      />

      <button onClick={handleVerifyDevice}>Verify Device</button>
      <button
        onClick={handleSubmitEmail}
        disabled={!deviceVerified}
        style={{ marginLeft: '1rem' }}
      >
        Submit Email
      </button>

      {message && (
        <div style={{ marginTop: '1rem', fontWeight: 'bold' }}>{message}</div>
      )}
    </div>
  );
}

export default App;
