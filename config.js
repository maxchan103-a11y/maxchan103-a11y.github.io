// AI Reading frictionless secure deployment configuration.
// Firebase Web config + App Check site key are PUBLIC client configuration values.
// Never put service-account JSON, private keys or Google Cloud credentials here.
window.READING_COACH_CONFIG = Object.freeze({
  // Public HTTPS endpoint only. All credentials remain server-side.
  ttsEndpoint: 'https://asia-southeast1-project-211636fb-a7f1-4ac9-8eb.cloudfunctions.net/generateMandarinSpeech',

  // Firebase Spark security project: ai-reading-security
  // Anonymous Authentication is invisible to the user: no login form is shown.
  firebase: {
    apiKey: 'AIzaSyCWP3N8EM6HhcJI_EhsRQKndw3DlN3wiLs',
    authDomain: 'ai-reading-security.firebaseapp.com',
    projectId: 'ai-reading-security',
    appId: '1:828314138271:web:66984c5f82024699e654aa'
  },

  // reCAPTCHA Enterprise App Check: invisible score-based verification.
  // Normal users do not need to click "I am not a robot" or select images.
  appCheck: {
    siteKey: '6Ld87MQtAAAAABmlBjyL4oy171DE0-gD_PXWcBY3'
  }
});
