import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
} from "firebase/auth";

const REQUIRED = {
  apiKey: "FIREBASE_API_KEY",
  authDomain: "FIREBASE_AUTH_DOMAIN",
  projectId: "FIREBASE_PROJECT_ID",
  appId: "FIREBASE_APP_ID",
};

const MESSAGES = {
  "auth/email-already-in-use": "An account with this email already exists. Switch to Sign in.",
  "auth/invalid-email": "That email address is not valid.",
  "auth/weak-password": "Password is too weak (min. 6 characters).",
  "auth/invalid-credential": "Email or password is incorrect.",
  "auth/wrong-password": "Email or password is incorrect.",
  "auth/user-not-found": "No account found for this email.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/too-many-requests": "Too many attempts. Please wait a moment and try again.",
  "auth/network-request-failed": "Network error — check your internet connection.",
  "auth/operation-not-allowed": "Email/Password sign-in is not enabled in the Firebase console.",
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": "Firebase API key is invalid — check your .env file.",
  "auth/invalid-api-key": "Firebase API key is invalid — check your .env file.",
};

export class AuthService {
  static fromEnv(env = process.env) {
    const config = Object.fromEntries(Object.entries(REQUIRED).map(([k, envKey]) => [k, env[envKey]?.trim()]));
    if (env.FIREBASE_MESSAGING_SENDER_ID) config.messagingSenderId = env.FIREBASE_MESSAGING_SENDER_ID.trim();
    return new AuthService(config);
  }

  constructor(config) {
    this.missing = Object.entries(REQUIRED)
      .filter(([k]) => !config[k])
      .map(([, envKey]) => envKey);
    this.auth = this.missing.length ? null : getAuth(initializeApp(config));
  }

  get configured() {
    return this.auth !== null;
  }

  async signUp({ name, email, password }) {
    const { user } = await createUserWithEmailAndPassword(this.auth, email.trim(), password);
    if (name?.trim()) await updateProfile(user, { displayName: name.trim() });
    return AuthService.toUser(user, name);
  }

  async signIn({ email, password }) {
    const { user } = await signInWithEmailAndPassword(this.auth, email.trim(), password);
    return AuthService.toUser(user);
  }

  async resetPassword(email) {
    await sendPasswordResetEmail(this.auth, email.trim());
  }

  async signOut() {
    if (this.auth) await signOut(this.auth);
  }

  static toUser(user, fallbackName) {
    return { uid: user.uid, email: user.email, name: user.displayName || fallbackName || user.email };
  }

  static messageFor(err) {
    const code = err?.code || "";
    return MESSAGES[code] || err?.message?.replace(/^Firebase:\s*/, "") || "Something went wrong.";
  }
}
