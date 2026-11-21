import React from "react";
import { Text, useInput } from "ink";
import { Panel } from "../Layout/Panel.jsx";
import { chip } from "../Layout/chips.js";
import { theme } from "../../styles/theme.js";

export function SetupNotice({ width, missing, onGuest, onQuit }) {
  useInput((input, key) => {
    if (input === "q" || key.escape || (key.ctrl && input === "c")) onQuit();
    if (input === "g" || key.return) onGuest();
  });

  return (
    <Panel
      width={width}
      height={missing.length + 9}
      color={theme.box.auth}
      title={{ left: [chip("binaire", { bold: true })], right: [chip("setup", { color: theme.warn })] }}
      footer={{ left: [chip("guest", { hot: 0 })], right: [chip("quit", { hot: 0 })] }}
    >
      <Text> </Text>
      <Text color={theme.text}> Firebase is not configured, so sign in is disabled.</Text>
      <Text> </Text>
      <Text color={theme.dim}> Missing in .env:</Text>
      {missing.map((name) => (
        <Text key={name} color={theme.warn}>
          {"   - " + name}
        </Text>
      ))}
      <Text> </Text>
      <Text color={theme.dim}> Copy .env.example to .env, fill it in and restart.</Text>
    </Panel>
  );
}
