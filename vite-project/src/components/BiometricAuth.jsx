import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const BiometricAuth = () => {
     const [email, setEmail] = useState('');
     const [isLoading, setIsLoading] = useState(false);
     const [status, setStatus] = useState('');
     const [isBiometricsAvailable, setIsBiometricsAvailable] = useState(false);

     // Check if biometric authentication is available
     useEffect(() => {
          const checkBiometricSupport = async () => {
               try {
                    if (!window.PublicKeyCredential) {
                         setStatus('WebAuthn is not supported in this browser');
                         return;
                    }

                    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                    setIsBiometricsAvailable(available);
                    if (!available) {
                         setStatus('No biometric authenticator available on this device');
                    }
               } catch (error) {
                    setStatus('Error checking biometric support');
                    console.error('Error:', error);
               }
          };

          checkBiometricSupport();
     }, []);

     const createDeviceToken = () => {
          return {
               deviceId: window.navigator.userAgent,
               userId: email,
               expires: new Date().getTime() + (30 * 60 * 1000) // 30 minutes
          };
     };

     const triggerBiometricAuth = async () => {
          try {
               const publicKeyOptions = {
                    challenge: new Uint8Array(32),
                    rp: {
                         name: 'Biometric Auth Demo'
                    },
                    user: {
                         id: new Uint8Array(16),
                         name: email,
                         displayName: email
                    },
                    pubKeyCredParams: [{
                         type: 'public-key',
                         alg: -7 // ES256
                    }],
                    authenticatorSelection: {
                         authenticatorAttachment: 'platform',
                         userVerification: 'required'
                    },
                    timeout: 60000
               };

               const credential = await navigator.credentials.create({
                    publicKey: publicKeyOptions
               });

               return credential !== null;
          } catch (error) {
               console.error('Biometric auth error:', error);
               return false;
          }
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          if (!email) {
               setStatus('Please enter an email address');
               return;
          }

          setIsLoading(true);
          setStatus('Requesting biometric verification...');

          try {
               const biometricResult = await triggerBiometricAuth();

               if (biometricResult) {
                    setStatus('Biometric verification successful');
                    const token = createDeviceToken();

                    // Simulate sending to server
                    setTimeout(() => {
                         setStatus('Authentication successful! Email submitted.');
                         setIsLoading(false);
                    }, 1000);
               } else {
                    setStatus('Biometric verification failed');
                    setIsLoading(false);
               }
          } catch (error) {
               setStatus('Authentication error occurred');
               setIsLoading(false);
          }
     };

     return (
          <div style={styles.container}>
               <div style={styles.card}>
                    <h2 style={styles.title}>Secure Email Authentication</h2>
                    <form onSubmit={handleSubmit} style={styles.form}>
                         <input
                              type="email"
                              placeholder="Enter your email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              disabled={isLoading || !isBiometricsAvailable}
                              style={styles.input}
                         />

                         <button
                              type="submit"
                              disabled={isLoading || !isBiometricsAvailable}
                              style={styles.button}
                         >
                              {isLoading ? (
                                   <span style={styles.loadingText}>
                                        <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                                        Verifying...
                                   </span>
                              ) : (
                                   'Submit with Biometric Verification'
                              )}
                         </button>

                         {status && (
                              <div style={styles.status}>
                                   {status}
                              </div>
                         )}
                    </form>
               </div>
          </div>
     );
};

const styles = {
     container: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f5f5f5',
          padding: '20px',
     },
     card: {
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '400px',
     },
     title: {
          marginTop: 0,
          marginBottom: '24px',
          fontSize: '24px',
          fontWeight: '600',
     },
     form: {
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
     },
     input: {
          padding: '8px 12px',
          borderRadius: '4px',
          border: '1px solid #ddd',
          fontSize: '16px',
     },
     button: {
          padding: '10px 16px',
          backgroundColor: '#0070f3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: 'pointer',
          disabled: {
               backgroundColor: '#ccc',
          },
     },
     status: {
          padding: '12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          border: '1px solid #ddd',
     },
     loadingText: {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
     },
};

export default BiometricAuth;