import React from "react";
import { render } from "ink";
import { loadEnv } from "./config/env.js";
import { AuthService } from "./auth/AuthService.js";
import { SessionStore } from "./auth/SessionStore.js";
import { App } from "./App.jsx";

loadEnv();

const auth = AuthService.fromEnv();
const session = new SessionStore();

const app = render(<App auth={auth} session={session} />, {
  alternateScreen: true,
  exitOnCtrlC: false,
  maxFps: 30,
});

await app.waitUntilExit();
process.exit(0);
