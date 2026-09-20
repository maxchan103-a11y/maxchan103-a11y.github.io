import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js';
import { getAuth, signInAnonymously, getIdToken } from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js';
import {
  initializeAppCheck,
  ReCaptchaEnterpriseProvider,
  getToken,
  getLimitedUseToken
} from 'https://www.gstatic.com/firebasejs/12.19.0/firebase-app-check.js';

const cfg = window.READING_COACH_CONFIG || {};
const firebaseCfg = cfg.firebase || {};
const appCheckCfg = cfg.appCheck || {};

function configured() {
  return Boolean(
    firebaseCfg.apiKey && !firebaseCfg.apiKey.startsWith('REPLACE_') &&
    firebaseCfg.projectId &&
    firebaseCfg.appId && !firebaseCfg.appId.startsWith('REPLACE_') &&
    appCheckCfg.siteKey && !appCheckCfg.siteKey.startsWith('REPLACE_')
  );
}

let initPromise = null;
let securityApp = null;
let authInstance = null;
let appCheckInstance = null;

async function initializeSecurity() {
  if (!configured()) throw new Error('SECURITY_CONFIG_NOT_READY');

  // Reuse initialized Firebase objects after a transient App Check/Auth error.
  // Calling initializeApp() again would otherwise leave later read attempts in
  // a permanent duplicate-app failure state.
  securityApp ||= getApps().find(item => item.name === '[DEFAULT]') || initializeApp(firebaseCfg);
  authInstance ||= getAuth(securityApp);
  appCheckInstance ||= initializeAppCheck(securityApp, {
    // Invisible, score-based protection. No checkbox/image challenge is shown
    // during normal use.
    provider: new ReCaptchaEnterpriseProvider(appCheckCfg.siteKey),
    isTokenAutoRefreshEnabled: true
  });
  const auth = authInstance;
  const appCheck = appCheckInstance;

  // Invisible anonymous identity. There is no sign-in screen for the user.
  if (!auth.currentUser) await signInAnonymously(auth);

  // Warm App Check in the background so the first TTS request has less delay.
  await getToken(appCheck, false);
  return { auth, appCheck };
}

async function ensureReady() {
  if (!initPromise) {
    initPromise = initializeSecurity().catch((err) => {
      // A transient App Check/Auth failure must not permanently poison all
      // later TTS attempts. The next user action can initialize afresh.
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

async function getHeaders() {
  const { auth, appCheck } = await ensureReady();
  if (!auth.currentUser) await signInAnonymously(auth);

  const idToken = await getIdToken(auth.currentUser, false);

  // Fresh limited-use token for each protected TTS request. The backend consumes
  // it once to reduce replay abuse.
  const appCheckToken = await getLimitedUseToken(appCheck);

  return {
    Authorization: `Bearer ${idToken}`,
    'X-Firebase-AppCheck': appCheckToken.token
  };
}

window.AI_READING_SECURITY = Object.freeze({
  configured: configured(),
  ensureReady,
  getHeaders
});

// Start silently after page load. Failure does not expose secrets or fall back
// to an unprotected endpoint; TTS remains unavailable until security is ready.
if (configured()) {
  ensureReady().catch((err) => console.warn('Background security warm-up failed:', err?.message || err));
}
