import React from "react";
import { Text } from "ink";
import { chipWidth } from "./chips.js";

export function BorderLine({ width, color, edge = "top", left = [], center = [], right = [], centerAt }) {
  const [cl, cr] = edge === "top" ? ["╭", "╮"] : ["╰", "╯"];
  const [open, close] = edge === "top" ? ["┐", "┌"] : ["┘", "└"];
  const inner = Math.max(0, width - 2);

  const L = [...left];
  const R = [...right];
  const sum = (arr) => arr.reduce((n, c) => n + chipWidth(c), 0);
  const leftLen = () => (L.length ? 1 + sum(L) : 0);
  const rightLen = () => (R.length ? 1 + sum(R) : 0);
  while (leftLen() + rightLen() > inner && (R.length || L.length)) {
    if (R.length) R.pop();
    else L.pop();
  }

  let C = center;
  let cPos = -1;
  const cLen = sum(C);
  if (C.length) {
    cPos = centerAt != null ? centerAt - 1 : Math.floor((inner - cLen) / 2);
    if (cPos < leftLen() || cPos + cLen > inner - rightLen()) C = [];
  }

  const out = [];
  let key = 0;
  const border = (s) => s && out.push(<Text key={key++} color={color}>{s}</Text>);
  const renderChip = (c) => {
    border(open);
    for (const p of c.parts) {
      out.push(
        <Text key={key++} color={p.color} bold={p.bold}>
          {p.text}
        </Text>,
      );
    }
    border(close);
  };

  border(cl);
  let col = 0;
  if (L.length) {
    border("─");
    L.forEach(renderChip);
    col = leftLen();
  }
  if (C.length) {
    border("─".repeat(cPos - col));
    C.forEach(renderChip);
    col = cPos + cLen;
  }
  const rl = rightLen();
  border("─".repeat(Math.max(0, inner - rl - col)));
  if (R.length) {
    R.forEach(renderChip);
    border("─");
  }
  border(cr);

  return <Text wrap="truncate">{out}</Text>;
}
