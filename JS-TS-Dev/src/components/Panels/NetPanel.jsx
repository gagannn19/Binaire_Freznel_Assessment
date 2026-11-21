import React from "react";
import { Box } from "ink";
import { Panel, Lines } from "../Layout/Panel.jsx";
import { chip, rawChip, SUP } from "../Layout/chips.js";
import { theme } from "../../styles/theme.js";
import { paint } from "../../utils/ansi.js";
import { graphRows } from "../../utils/graph.js";
import { formatBytes, formatRate, niceCeiling, pad } from "../../utils/format.js";

function withLabel(row, label) {
  return paint(theme.graphText, label) + paint(row.color, row.text.slice(label.length));
}

function StatsBox({ net, width, height }) {
  const w = width - 2;
  const line = (arrow, color, left, right) =>
    paint(color, arrow + " ") + paint(theme.title, pad(left, w - 2 - right.length)) + paint(theme.text, right);

  const down = theme.gradient.download[80];
  const up = theme.gradient.upload[80];
  const lines = [line("▼", down, "Speed:", formatRate(net.rx)), line("▼", down, "Total:", formatBytes(net.rxTotal))];
  while (lines.length < height - 4) lines.push("");
  lines.push(line("▲", up, "Speed:", formatRate(net.tx)), line("▲", up, "Total:", formatBytes(net.txTotal)));

  return (
    <Panel
      width={width}
      height={height}
      color={theme.box.net}
      title={{ left: [chip("download", { color: theme.text })] }}
      footer={{ left: [chip("upload", { color: theme.text })] }}
    >
      <Lines lines={lines} width={w} />
    </Panel>
  );
}

export function NetPanel({ width, height, snap }) {
  const { net } = snap;
  const innerW = width - 2;
  const innerH = height - 2;
  const statsW = innerW >= 48 ? 28 : 0;
  const graphW = statsW ? innerW - statsW - 1 : innerW;
  const downH = Math.ceil(innerH / 2);
  const upH = innerH - downH;

  const rx = net.rxHistory.toArray(graphW);
  const tx = net.txHistory.toArray(graphW);
  const rxMax = niceCeiling(Math.max(1, ...rx));
  const txMax = niceCeiling(Math.max(1, ...tx));

  const down = graphRows(rx.map((v) => v / rxMax), graphW, downH, theme.gradient.download);
  const up = graphRows(tx.map((v) => v / txMax), graphW, upH, theme.gradient.upload, { inverted: true });
  const lines = [
    ...down.map((r, i) => (i === 0 ? withLabel(r, formatBytes(rxMax, { short: true })) : paint(r.color, r.text))),
    ...up.map((r, i) => (i === up.length - 1 ? withLabel(r, formatBytes(txMax, { short: true })) : paint(r.color, r.text))),
  ];

  return (
    <Panel
      width={width}
      height={height}
      color={theme.box.net}
      title={{
        left: [chip("net", { sup: SUP[3] }), ...(net.ip ? [chip(net.ip)] : [])],
        right: [
          rawChip([
            { text: "<b ", color: theme.hotkey },
            { text: net.iface, color: theme.title },
            { text: " n>", color: theme.hotkey },
          ]),
        ],
      }}
    >
      <Box flexDirection="row">
        <Lines lines={lines} width={graphW} />
        {statsW > 0 && (
          <Box marginLeft={1} flexShrink={0} flexDirection="column" justifyContent="flex-end" height={innerH}>
            <StatsBox net={net} width={statsW} height={Math.min(innerH, 8)} />
          </Box>
        )}
      </Box>
    </Panel>
  );
}
