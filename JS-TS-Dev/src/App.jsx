import React, { useState } from "react";
import { Box, Text, useApp, useWindowSize } from "ink";
import { AuthForm } from "./components/Auth/AuthForm.jsx";
import { SetupNotice } from "./components/Auth/SetupNotice.jsx";
import { Dashboard } from "./pages/Dashboard.jsx";
import { theme } from "./styles/theme.js";

const GUEST = { uid: "guest", email: "guest", name: "Guest" };

export function App({ auth, session }) {
  const { exit } = useApp();
  const { columns, rows } = useWindowSize();
  const [user, setUser] = useState(null);

  function login(newUser) {
    session.save({ email: newUser.email });
    setUser(newUser);
  }

  async function logout() {
    await auth.signOut().catch(() => {});
    setUser(null);
  }

  if (user) {
    return <Dashboard user={user} onSignOut={logout} />;
  }

  const width = Math.max(30, Math.min(64, columns - 4));

  return (
    <Box width={columns} height={rows} flexDirection="column" alignItems="center" justifyContent="center">
      <Text color={theme.title} bold>
        binaire <Text color={theme.dim}>system monitor</Text>
      </Text>
      <Text> </Text>
      {auth.configured ? (
        <AuthForm width={width} auth={auth} initialEmail={session.load().email || ""} onLogin={login} onQuit={exit} />
      ) : (
        <SetupNotice width={width} missing={auth.missing} onGuest={() => setUser(GUEST)} onQuit={exit} />
      )}
    </Box>
  );
}
