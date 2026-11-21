export const SORT_KEYS = [
  { id: "pid", label: "pid", get: (p) => p.pid, numeric: true },
  { id: "program", label: "program", get: (p) => p.name.toLowerCase() },
  { id: "command", label: "command", get: (p) => p.command.toLowerCase() },
  { id: "user", label: "user", get: (p) => p.user.toLowerCase() },
  { id: "memory", label: "memory", get: (p) => p.memBytes, numeric: true },
  { id: "cpu", label: "cpu lazy", get: (p) => p.cpu, numeric: true },
];

export const DEFAULT_SORT = SORT_KEYS.length - 1;

export class ProcessTable {
  static comparator(sortIndex, reverse) {
    const key = SORT_KEYS[sortIndex];
    const dir = (key.numeric ? -1 : 1) * (reverse ? -1 : 1);
    return (a, b) => {
      const x = key.get(a);
      const y = key.get(b);
      if (x < y) return -dir;
      if (x > y) return dir;
      return a.pid - b.pid;
    };
  }

  static filter(list, query) {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) => p.name.toLowerCase().includes(q) || p.command.toLowerCase().includes(q) || String(p.pid) === q,
    );
  }

  static build(list, { sortIndex = DEFAULT_SORT, reverse = false, filter = "", tree = false } = {}) {
    const items = ProcessTable.filter(list, filter);
    const cmp = ProcessTable.comparator(sortIndex, reverse);
    if (!tree) return items.slice().sort(cmp).map((proc) => ({ proc, prefix: "" }));
    return ProcessTable.#flattenTree(items, cmp);
  }

  static #flattenTree(items, cmp) {
    const byPid = new Map(items.map((p) => [p.pid, p]));
    const children = new Map();
    const roots = [];
    for (const p of items) {
      if (p.ppid !== p.pid && byPid.has(p.ppid)) {
        if (!children.has(p.ppid)) children.set(p.ppid, []);
        children.get(p.ppid).push(p);
      } else {
        roots.push(p);
      }
    }
    roots.sort(cmp);
    for (const kids of children.values()) kids.sort(cmp);

    const out = [];
    const visited = new Set();
    const stack = roots.reverse().map((p) => ({ p, prefix: "", last: true, depth: 0 }));
    while (stack.length) {
      const { p, prefix, last, depth } = stack.pop();
      if (visited.has(p.pid)) continue;
      visited.add(p.pid);
      out.push({ proc: p, prefix: depth === 0 ? "" : prefix + (last ? "└─" : "├─") });
      const kids = children.get(p.pid) || [];
      const childPrefix = depth === 0 ? "" : prefix + (last ? "  " : "│ ");
      for (let i = kids.length - 1; i >= 0; i--) {
        stack.push({ p: kids[i], prefix: childPrefix, last: i === kids.length - 1, depth: depth + 1 });
      }
    }
    return out;
  }
}
