const navLinks = [...document.querySelectorAll("#nav a")];
const sections = [...document.querySelectorAll(".page-section")];
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        navLinks.forEach((a) =>
          a.classList.toggle(
            "active",
            a.getAttribute("href") === "#" + e.target.id,
          ),
        );
      }
    });
  },
  { rootMargin: "-25% 0px -65% 0px" },
);
sections.forEach((s) => observer.observe(s));

const sidebar = document.getElementById("sidebar");
document
  .getElementById("menuBtn")
  .addEventListener("click", () => sidebar.classList.toggle("open"));
navLinks.forEach((a) =>
  a.addEventListener("click", () => sidebar.classList.remove("open")),
);

document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  document.body.classList.toggle("searching", !!q);
  navLinks.forEach((a) => {
    const target = document.querySelector(a.getAttribute("href"));
    const hay = (
      (a.dataset.title || "") +
      " " +
      (target?.innerText || "")
    ).toLowerCase();
    a.classList.toggle("hidden", !!q && !hay.includes(q));
  });
});

function center(el) {
  const r = el.getBoundingClientRect(),
    p = el.parentElement.getBoundingClientRect();
  return {
    x: r.left - p.left + r.width / 2,
    y: r.top - p.top + r.height / 2,
    left: r.left - p.left,
    right: r.right - p.left,
    top: r.top - p.top,
    bottom: r.bottom - p.top,
    width: r.width,
    height: r.height,
  };
}
function getNode(chart, id) {
  const prefix = chart.closest(".playbook").id;
  return document.getElementById(`${prefix}-${id}`);
}

function layoutStreamDown(chart) {
  const prefix = "stream-down-";
  const pos = {
    start: [410, 25],
    q1: [410, 120],
    q2: [410, 235],
    q3: [410, 350],
    q4: [410, 465],
    viewer: [70, 235],
    digital: [70, 355],
    engineering: [750, 330],
    master: [750, 500],
  };
  const widths = {
    start: 176,
    q1: 176,
    q2: 176,
    q3: 176,
    q4: 176,
    viewer: 176,
    digital: 176,
    engineering: 176,
    master: 176,
  };
  Object.entries(pos).forEach(([id, [x, y]]) => {
    const n = document.getElementById(prefix + id);
    if (!n) return;
    n.style.left = x + "px";
    n.style.top = y + "px";
    n.style.width = (widths[id] || 176) + "px";
    n.style.minHeight = "61px";
    n.dataset.fixed = "true";
  });
  chart.style.minHeight = "610px";
}

function layoutFlowchart(chart) {
  if (chart.closest(".playbook")?.id === "stream-down") {
    layoutStreamDown(chart);
    return;
  }
  const edges = JSON.parse(chart.dataset.edges || "[]");
  const prefix = chart.closest(".playbook").id + "-";
  const nodes = [...chart.querySelectorAll(".flow-node")];
  const nodeMap = new Map(nodes.map((n) => [n.id.slice(prefix.length), n]));
  const incoming = new Map(),
    outgoing = new Map();
  edges.forEach(([a, b, label]) => {
    if (!outgoing.has(a)) outgoing.set(a, []);
    if (!incoming.has(b)) incoming.set(b, []);
    outgoing.get(a).push({ id: b, label });
    incoming.get(b).push({ id: a, label });
  });

  // Follow the primary question chain from start. Outcomes occupy side lanes.
  const startId = nodeMap.has("start")
    ? "start"
    : nodes[0]?.id.slice(prefix.length);
  const main = [];
  const mainSet = new Set();
  let current = startId;
  while (current && !mainSet.has(current)) {
    main.push(current);
    mainSet.add(current);
    const outs = outgoing.get(current) || [];
    const next =
      outs.find((e) => nodeMap.get(e.id)?.classList.contains("question")) ||
      outs.find((e) => nodeMap.get(e.id)?.classList.contains("start")) ||
      (outs.length === 1 &&
      !["danger", "success", "info"].some((c) =>
        nodeMap.get(outs[0].id)?.classList.contains(c),
      )
        ? outs[0]
        : null);
    current = next?.id;
  }

  const w = chart.clientWidth;
  const nodeW = Math.min(176, Math.max(150, w * 0.19));
  const nodeH = 61;
  const centerX = (w - nodeW) / 2;
  const leftX = 24;
  const rightX = w - nodeW - 24;
  const top = 35;
  const rowGap = 105;

  main.forEach((id, i) => {
    const n = nodeMap.get(id);
    if (!n) return;
    n.style.width = nodeW + "px";
    n.style.minHeight = nodeH + "px";
    n.style.left = centerX + "px";
    n.style.top = top + i * rowGap + "px";
    n.dataset.lane = "center";
    n.dataset.row = String(i);
  });

  // Place each non-main outcome beside the source question.
  const leftCount = new Map(),
    rightCount = new Map();
  edges.forEach(([from, to, label]) => {
    if (mainSet.has(to)) return;
    const source = nodeMap.get(from),
      target = nodeMap.get(to);
    if (!source || !target) return;
    const sourceRow = Number(source.dataset.row || 0);
    const preferLeft = (label || "").toUpperCase() === "NO";
    const counter = preferLeft ? leftCount : rightCount;
    const count = counter.get(sourceRow) || 0;
    counter.set(sourceRow, count + 1);
    const lane = preferLeft ? "left" : "right";
    const x = preferLeft ? leftX : rightX;
    const y = top + sourceRow * rowGap + count * 76;
    target.style.width = nodeW + "px";
    target.style.minHeight = nodeH + "px";
    target.style.left = x + "px";
    target.style.top = y + "px";
    target.dataset.lane = lane;
    target.dataset.row = String(sourceRow);
  });

  // Handle any nodes not reached above.
  nodes.forEach((n, i) => {
    if (n.style.left) return;
    n.style.width = nodeW + "px";
    n.style.minHeight = nodeH + "px";
    n.style.left = (i % 2 ? rightX : leftX) + "px";
    n.style.top = top + (main.length + i) * rowGap + "px";
    n.dataset.lane = i % 2 ? "right" : "left";
    n.dataset.row = String(main.length + i);
  });

  const rows = Math.max(
    main.length,
    ...nodes.map((n) => Number(n.dataset.row || 0) + 1),
  );
  chart.style.minHeight = Math.max(600, top + rows * rowGap + 55) + "px";
}

function drawStreamDownConnectors(chart, svg, markerId) {
  const ns = "http://www.w3.org/2000/svg";
  function node(id) {
    return document.getElementById("stream-down-" + id);
  }
  function c(id) {
    return center(node(id));
  }
  const edges = [
    ["start", "q1", "down", ""],
    ["q1", "q2", "down", "YES"],
    ["q1", "q3", "rightDown", "NO"],
    ["q2", "viewer", "left", "YES"],
    ["q2", "digital", "leftDown", "NO"],
    ["q3", "q4", "down", "YES"],
    ["q3", "engineering", "right", "NO"],
    ["q4", "master", "right", "NO"],
  ];
  edges.forEach(([from, to, dir, label], idx) => {
    const sourceNode = node(from);
    if (!sourceNode) return;
    const isTerminal =
      sourceNode.classList.contains("danger") ||
      sourceNode.classList.contains("success") ||
      sourceNode.classList.contains("info");
    if (isTerminal) return;
    const A = c(from),
      B = c(to);
    let d = "",
      lx = 0,
      ly = 0;
    if (dir === "down") {
      // Direct vertical branch into the top edge of the next question.
      d = `M ${A.x} ${A.bottom} L ${B.x} ${B.top}`;
      lx = A.x + 28;
      ly = A.bottom + 15;
    } else if (dir === "left") {
      const channel = A.left - 70 - idx * 6;
      d = `M ${A.left} ${A.y} L ${channel} ${A.y} L ${channel} ${B.y} L ${B.right} ${B.y}`;
      lx = A.left - 28;
      ly = A.y - 9;
    } else if (dir === "leftDown") {
      const channel = A.left - 95 - idx * 6;
      d = `M ${A.left} ${A.y} L ${channel} ${A.y} L ${channel} ${B.top - 26} L ${B.x} ${B.top - 26} L ${B.x} ${B.top}`;
      lx = A.left - 30;
      ly = A.y - 9;
    } else if (dir === "rightDown") {
      const channel = A.right + 100 + idx * 6;
      d = `M ${A.right} ${A.y} L ${channel} ${A.y} L ${channel} ${B.top - 28} L ${B.x} ${B.top - 28} L ${B.x} ${B.top}`;
      lx = A.right + 30;
      ly = A.y - 9;
    } else {
      // Clean terminal route (no continuation beyond destination)
      d = `M ${A.right} ${A.y} H ${B.left - 28} V ${B.y} H ${B.left}`;
      lx = A.right + 30;
      ly = A.y - 9;
    }
    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#555");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "butt");
    path.setAttribute("stroke-linejoin", "miter");
    path.setAttribute("marker-end", `url(#${markerId})`);
    svg.appendChild(path);
    const sourceIsQuestion = sourceNode.classList.contains("question");
    if (label && sourceIsQuestion) {
      const bg = document.createElementNS(ns, "rect");
      bg.setAttribute("x", lx - 18);
      bg.setAttribute("y", ly - 12);
      bg.setAttribute("width", "36");
      bg.setAttribute("height", "18");
      bg.setAttribute("rx", "4");
      bg.setAttribute("fill", "#fff");
      bg.setAttribute("stroke", "#c8cdd2");
      svg.appendChild(bg);
      const tx = document.createElementNS(ns, "text");
      tx.textContent = label;
      tx.setAttribute("x", lx);
      tx.setAttribute("y", ly + 1);
      tx.setAttribute("text-anchor", "middle");
      tx.setAttribute("font-size", "9");
      tx.setAttribute("font-weight", "700");
      tx.setAttribute("fill", "#222");
      svg.appendChild(tx);
    }
  });
}

function drawWrongProgramConnectors(chart, svg, markerId) {
  const ns = "http://www.w3.org/2000/svg";
  function node(id) {
    return document.getElementById("wrong-program-" + id);
  }
  function c(id) {
    return center(node(id));
  }
  const edges = JSON.parse(chart.dataset.edges || "[]");

  edges.forEach(([from, to, label]) => {
    const a = node(from),
      b = node(to);
    if (!a || !b) return;
    const A = c(from),
      B = c(to);
    let d, lx, ly;

    if (to === "engineering") {
      // Dedicated straight response line into Contact Engineering.
      const sx = A.right,
        sy = A.y,
        ex = B.left,
        ey = B.y;
      d = `M ${sx} ${sy} H ${ex}`;
      lx = sx + 28;
      ly = sy - 9;
    } else if (A.x === B.x) {
      d = `M ${A.x} ${A.bottom} V ${B.top}`;
      lx = A.x + 28;
      ly = A.bottom + 14;
    } else {
      const goLeft = B.x < A.x;
      const sx = goLeft ? A.left : A.right;
      const ex = goLeft ? B.right : B.left;
      const channel = goLeft
        ? Math.min(sx - 48, ex + 48)
        : Math.max(sx + 48, ex - 48);
      d = `M ${sx} ${A.y} H ${channel} V ${B.y} H ${ex}`;
      lx = goLeft ? sx - 25 : sx + 25;
      ly = A.y - 9;
    }

    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#555");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "butt");
    path.setAttribute("stroke-linejoin", "miter");
    path.setAttribute("marker-end", `url(#${markerId})`);
    svg.appendChild(path);

    if (label && a.classList.contains("question")) {
      const bg = document.createElementNS(ns, "rect");
      bg.setAttribute("x", lx - 18);
      bg.setAttribute("y", ly - 12);
      bg.setAttribute("width", "36");
      bg.setAttribute("height", "18");
      bg.setAttribute("rx", "4");
      bg.setAttribute("fill", "#fff");
      bg.setAttribute("stroke", "#c8cdd2");
      svg.appendChild(bg);
      const tx = document.createElementNS(ns, "text");
      tx.textContent = label;
      tx.setAttribute("x", lx);
      tx.setAttribute("y", ly + 1);
      tx.setAttribute("text-anchor", "middle");
      tx.setAttribute("font-size", "9");
      tx.setAttribute("font-weight", "700");
      tx.setAttribute("fill", "#222");
      svg.appendChild(tx);
    }
  });
}

function drawConnectors(chart) {
  layoutFlowchart(chart);
  const svg = chart.querySelector(".connectors");
  if (!svg) return;
  const edges = JSON.parse(chart.dataset.edges || "[]");
  svg.innerHTML = "";
  const w = chart.clientWidth,
    h = chart.clientHeight;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const ns = "http://www.w3.org/2000/svg",
    prefix = chart.closest(".playbook").id;
  const markerId = `arrow-${prefix}`;
  const defs = document.createElementNS(ns, "defs"),
    marker = document.createElementNS(ns, "marker");
  marker.setAttribute("id", markerId);
  marker.setAttribute("markerWidth", "8");
  marker.setAttribute("markerHeight", "8");
  marker.setAttribute("refX", "7");
  marker.setAttribute("refY", "4");
  marker.setAttribute("orient", "auto");
  const mp = document.createElementNS(ns, "path");
  mp.setAttribute("d", "M0,0 L8,4 L0,8 Z");
  mp.setAttribute("fill", "#555");
  marker.appendChild(mp);
  defs.appendChild(marker);
  svg.appendChild(defs);
  if (prefix === "stream-down") {
    drawStreamDownConnectors(chart, svg, markerId);
    return;
  }
  if (prefix === "wrong-program") {
    drawWrongProgramConnectors(chart, svg, markerId);
    return;
  }

  // Dedicated routing channels. One channel per edge prevents any overlap.
  let leftChannel = 18,
    rightChannel = w - 18;
  const usedLabelBoxes = [];

  function reserveLabel(x, y) {
    let box = { x: x - 18, y: y - 11, w: 36, h: 18 };
    let tries = 0;
    // Only make small local shifts so the tag remains attached visually to its question.
    while (
      usedLabelBoxes.some(
        (b) =>
          !(
            box.x + box.w < b.x ||
            b.x + b.w < box.x ||
            box.y + box.h < b.y ||
            b.y + b.h < box.y
          ),
      ) &&
      tries < 6
    ) {
      box.y += tries % 2 === 0 ? 16 : -16;
      box.x += tries < 2 ? 0 : tries % 2 === 0 ? 12 : -12;
      tries++;
    }
    usedLabelBoxes.push(box);
    return { x: box.x + box.w / 2, y: box.y + 12 };
  }

  edges.forEach(([from, to, label], idx) => {
    const a = getNode(chart, from),
      b = getNode(chart, to);
    if (!a || !b) return;
    const isTerminal =
      a.classList.contains("danger") ||
      a.classList.contains("success") ||
      a.classList.contains("info");
    if (isTerminal) return;
    const A = center(a),
      B = center(b);
    const sameLane = a.dataset.lane === b.dataset.lane;
    let d, labelX, labelY;

    const targetIsTerminal =
      b.classList.contains("danger") ||
      b.classList.contains("success") ||
      b.classList.contains("info");
    if (sameLane) {
      // Pure vertical connector terminating exactly at the destination edge.
      const sx = A.x,
        sy = A.bottom,
        ex = B.x,
        ey = B.top;
      d = `M ${sx} ${sy} L ${ex} ${ey}`;
      const sourceIsQuestion = a.classList.contains("question");
      labelX = sx + 28;
      labelY = sourceIsQuestion ? sy + 13 : sy + 18;
    } else {
      const goLeft = B.x < A.x;
      const sx = goLeft ? A.left : A.right;
      const sy = A.y;
      const ex = goLeft ? B.right : B.left;
      const ey = B.y;
      if (targetIsTerminal) {
        // Terminal boxes get a short, clean orthogonal route with no line beyond the box.
        const nearX = goLeft ? ex + 28 : ex - 28;
        d = `M ${sx} ${sy} H ${nearX} V ${ey} H ${ex}`;
      } else {
        const channel = goLeft ? leftChannel : rightChannel;
        if (goLeft) leftChannel += 14;
        else rightChannel -= 14;
        // Question-to-question branches retain dedicated outside channels.
        d = `M ${sx} ${sy} L ${channel} ${sy} L ${channel} ${ey} L ${ex} ${ey}`;
      }
      // Put YES/NO directly beside the question geometry at the branch origin.
      labelX = goLeft ? sx - 25 : sx + 25;
      labelY = sy - 8;
    }

    const path = document.createElementNS(ns, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", "#555");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linecap", "butt");
    path.setAttribute("stroke-linejoin", "miter");
    path.setAttribute("marker-end", `url(#${markerId})`);
    svg.appendChild(path);

    const sourceIsQuestion = a.classList.contains("question");
    if (label && sourceIsQuestion) {
      const pos = reserveLabel(labelX, labelY);
      const bg = document.createElementNS(ns, "rect");
      bg.setAttribute("x", pos.x - 18);
      bg.setAttribute("y", pos.y - 12);
      bg.setAttribute("width", "36");
      bg.setAttribute("height", "18");
      bg.setAttribute("rx", "4");
      bg.setAttribute("fill", "#fff");
      bg.setAttribute("stroke", "#c8cdd2");
      svg.appendChild(bg);
      const tx = document.createElementNS(ns, "text");
      tx.textContent = label;
      tx.setAttribute("x", pos.x);
      tx.setAttribute("y", pos.y + 1);
      tx.setAttribute("text-anchor", "middle");
      tx.setAttribute("font-size", "9");
      tx.setAttribute("font-weight", "700");
      tx.setAttribute("fill", "#222");
      svg.appendChild(tx);
    }
  });
}
function redraw() {
  document.querySelectorAll(".flowchart").forEach(drawConnectors);
}
window.addEventListener("load", () => requestAnimationFrame(redraw));
window.addEventListener("resize", () => requestAnimationFrame(redraw));
window.addEventListener("beforeprint", redraw);
document.querySelectorAll(".print-section").forEach((btn) =>
  btn.addEventListener("click", () => {
    document.body.classList.remove("print-all");
    document
      .querySelectorAll(".page-section")
      .forEach((s) => s.classList.remove("printing"));
    btn.closest(".page-section").classList.add("printing");
    window.print();
  }),
);
document.getElementById("printBtn").addEventListener("click", () => {
  document.body.classList.remove("print-all");
  document
    .querySelectorAll(".page-section")
    .forEach((s) => s.classList.remove("printing"));
  const id = location.hash.slice(1) || "home";
  (
    document.getElementById(id) || document.getElementById("home")
  ).classList.add("printing");
  window.print();
});
document.getElementById("printAllBtn").addEventListener("click", () => {
  document.body.classList.add("print-all");
  window.print();
});

const form = document.getElementById("incidentForm");
const storageKey = "streaming-runbook-incident";
function formData() {
  const obj = {};
  new FormData(form).forEach((v, k) => {
    if (obj[k]) obj[k] = [].concat(obj[k], v);
    else obj[k] = v;
  });
  return obj;
}
document.getElementById("saveIncident").addEventListener("click", () => {
  localStorage.setItem(storageKey, JSON.stringify(formData()));
  alert("Incident worksheet saved in this browser.");
});
document.getElementById("downloadIncident").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(formData(), null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `streaming-incident-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
const saved = localStorage.getItem(storageKey);
if (saved) {
  try {
    const data = JSON.parse(saved);
    Object.entries(data).forEach(([k, v]) => {
      const els = form.elements[k];
      if (!els) return;
      if (els.length && !els.tagName) {
        [...els].forEach((el) => {
          if (el.type === "checkbox")
            el.checked = [].concat(v).includes(el.value);
        });
      } else els.value = Array.isArray(v) ? v[0] : v;
    });
  } catch (e) {}
}
