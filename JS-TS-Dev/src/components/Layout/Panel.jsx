import React from "react";
import { Box, Text } from "ink";
import { BorderLine } from "./BorderLine.jsx";

export function Panel({ width, height, color, title = {}, footer = {}, children }) {
  if (width < 4 || height < 2) return null;
  return (
    <Box flexDirection="column" width={width} height={height} flexShrink={0}>
      <BorderLine width={width} color={color} edge="top" {...title} />
      <Box
        width={width}
        height={height - 2}
        borderStyle="round"
        borderTop={false}
        borderBottom={false}
        borderColor={color}
        flexDirection="column"
        overflow="hidden"
      >
        {children}
      </Box>
      <BorderLine width={width} color={color} edge="bottom" {...footer} />
    </Box>
  );
}

export function Lines({ lines, width }) {
  return (
    <Box flexDirection="column" width={width} flexShrink={0}>
      {lines.map((line, i) => (
        <Text key={i} wrap="truncate">
          {line || " "}
        </Text>
      ))}
    </Box>
  );
}
