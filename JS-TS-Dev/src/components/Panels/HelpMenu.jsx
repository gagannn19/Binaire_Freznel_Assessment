import React from "react";
import { Box, Text } from "ink";
import { Panel } from "../Layout/Panel.jsx";
import { chip } from "../Layout/chips.js";
import { theme } from "../../styles/theme.js";

export const KEYMAP = [
  ["Global", ""],
  ["m / esc", "Toggle this menu"],
  ["q / ctrl+c", "Quit"],
  ["1 2 3 4", "Show/hide cpu, mem, net, proc boxes"],
  ["+ / -", "Increase / decrease update interval"],
  ["L", "Sign out"],
  ["Processes", ""],
  ["↑ ↓ pgup pgdn", "Select process / scroll"],
  ["home / end", "Jump to first / last"],
  ["← →", "Change sort column"],
  ["r", "Reverse sort order"],
  ["e", "Toggle tree view"],
  ["f", "Filter (enter = keep, esc = clear)"],
  ["i / enter", "Show process details"],
  ["t / k", "Terminate (SIGTERM) / kill (SIGKILL)"],
  ["Network", ""],
  ["b / n", "Previous / next interface"],
];

export function HelpMenu({ width, height, user }) {
  const w = Math.min(64, width - 4);
  const h = Math.min(KEYMAP.length + 4, height - 2);
  return (
    <Box position="absolute" width={width} height={height} alignItems="center" justifyContent="center">
      <Panel
        width={w}
        height={h}
        color={theme.box.menu}
        title={{ center: [chip("menu", { hot: 0, bold: true })] }}
        footer={{ center: [chip(`signed in as ${user.email}`, { color: theme.dim })] }}
      >
        <Box flexDirection="column">
          {KEYMAP.slice(0, h - 2).map(([k, v]) =>
            v ? (
              <Text key={k} wrap="truncate">
                <Text color={theme.hotkey}>{(" " + k).padEnd(17)}</Text>
                <Text color={theme.text}>{v.padEnd(w - 19)}</Text>
              </Text>
            ) : (
              <Text key={k} color={theme.title} bold wrap="truncate">
                {(" " + k).padEnd(w - 2)}
              </Text>
            ),
          )}
        </Box>
      </Panel>
    </Box>
  );
}
