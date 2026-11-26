import { writeFileSync } from "node:fs";
import assert from "node:assert/strict";
const rect = (x, y, w, h, fill, r = 0, stroke = "none") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const text = (x, y, label, size = 18, fill = "#667085", weight = 400) =>
  `<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}">${label}</text>`;
const line = (x, y, w) => `<path d="M${x} ${y}h${w}" stroke="#e4e8ef"/>`;
const frame = (bg, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900" viewBox="0 0 1200 900">${rect(0, 0, 1200, 900, bg)}${body}</svg>`;
const chrome = (name) =>
  rect(100, 130, 1000, 640, "#fff", 14, "#d8dfe9") +
  rect(100, 130, 1000, 56, "#f8fafc", 14) +
  text(133, 166, "●  ●  ●", 16, "#b5bfce") +
  text(475, 166, name, 15, "#667085") +
  line(100, 186, 1000);
const notes =
  chrome("Commonplace / Personal workspace") +
  rect(101, 187, 214, 582, "#f8fafc") +
  text(130, 235, "COMMONPLACE", 15, "#39465b", 700) +
  text(130, 295, "⌕  Find a note", 17) +
  rect(118, 331, 178, 42, "#e5edfa", 6) +
  text(136, 359, "All notes", 17, "#315bc9", 700) +
  text(136, 413, "Collections", 17) +
  text(136, 465, "Saved links", 17) +
  text(136, 688, "LOCAL WORKSPACE", 12) +
  text(355, 244, "A place for your ideas.", 31, "#253249", 700) +
  text(355, 282, "Capture first. Connect the dots later.", 17) +
  rect(355, 314, 700, 49, "#f7f9fc", 7, "#e2e7ef") +
  text(375, 345, "Write a thought, paste a link…", 17) +
  text(355, 412, "RECENT NOTES", 12, "#667085", 700) +
  [
    ["Designing for focus", "Ideas / 3 linked notes"],
    ["What makes a tool useful?", "Product / 2 linked notes"],
    ["Small steps, working software", "Engineering / 4 linked notes"],
  ]
    .map(
      (a, i) =>
        rect(355, 436 + i * 91, 700, 77, "#fff", 7, "#e2e7ef") +
        rect(372, 454 + i * 91, 8, 8, ["#7e9ed1", "#9aac85", "#c4a078"][i], 2) +
        text(395, 465 + i * 91, a[0], 20, "#344054", 700) +
        text(395, 493 + i * 91, a[1], 14),
    )
    .join("");
const trace =
  rect(100, 130, 1000, 640, "#1c2432", 14) +
  rect(100, 130, 1000, 56, "#252f40", 14) +
  text(130, 166, "●  ●  ●", 16, "#8e9cae") +
  text(490, 166, "trace / pipeline inspector", 15, "#bac7d8") +
  text(145, 245, "$ trace inspect ./sample.json", 25, "#e0e9f6") +
  text(145, 286, "ILLUSTRATIVE OUTPUT · NO LIVE PROCESS", 12, "#9eb0c7") +
  ["SOURCE", "TRANSFORM", "OUTPUT"]
    .map(
      (s, i) =>
        rect(
          145 + i * 310,
          330,
          280,
          120,
          i === 1 ? "#243b57" : "#252f40",
          8,
          "#46576d",
        ) +
        text(167 + i * 310, 364, `0${i + 1} / ${s}`, 13, "#abbcd2") +
        text(
          167 + i * 310,
          408,
          ["sample.json", "normalize()", "result.json"][i],
          23,
          "#e1eaf5",
          700,
        ),
    )
    .join("") +
  text(145, 512, "✓  Source loaded", 19, "#aacdbb") +
  text(145, 554, "✓  Fields normalized", 19, "#aacdbb") +
  text(145, 596, "→  Inspect changes at each step", 19, "#c5d4e9") +
  rect(145, 642, 900, 66, "#18202d", 6) +
  text(165, 681, "input → transformation → output", 21, "#b3c6df");
const garden =
  chrome("Latent Garden / Image exploration") +
  text(140, 246, "Find connections, not just matches.", 29, "#253249", 700) +
  rect(140, 278, 920, 50, "#f4f7fb", 7, "#dce3ed") +
  text(162, 310, "Search a visual idea…", 18) +
  text(140, 371, "SIMILAR IMAGES", 12, "#667085", 700) +
  Array.from({ length: 6 }, (_, i) => {
    const x = 140 + (i % 3) * 310,
      y = 399 + Math.floor(i / 3) * 163;
    return (
      rect(x, y, 290, 145, ["#dce6e0", "#d4e2eb", "#e5ded2"][i % 3], 8) +
      `<path d="M${x + 20} ${y + 119}l65 -70 55 43 48 -62 80 89Z" fill="${["#87a294", "#799aaf", "#b2a18a"][i % 3]}"/>` +
      `<circle cx="${x + 230}" cy="${y + 32}" r="14" fill="#fff" opacity=".8"/>` +
      rect(x + 10, y + 10, 86, 23, "#fff", 4) +
      text(x + 18, y + 26, ["Landscape", "Waterside", "Terrain"][i % 3], 11)
    );
  }).join("");
let field =
  chrome("Field Study / Pattern experiments") +
  text(140, 246, "One rule. Many outcomes.", 31, "#253249", 700) +
  text(140, 284, "Comparing frequency and amplitude in generated curves.", 17);
for (let panel = 0; panel < 3; panel++) {
  const x = 140 + panel * 310;
  field +=
    rect(x, 330, 290, 340, "#f5f7fa", 8, "#e0e6ee") +
    text(x + 18, 365, `STUDY 0${panel + 1}`, 13, "#59667c", 700);
  for (let i = 0; i < 18; i++) {
    const pts = Array.from(
      { length: 81 },
      (_, j) =>
        `${x + 20 + j * 3.1},${435 + i * 9 + Math.sin((j / 80) * Math.PI * (2 + panel) + i * 0.07) * 35}`,
    ).join(" ");
    field += `<polyline points="${pts}" fill="none" stroke="${["#5f7ea5", "#688d80", "#9d7d66"][panel]}" stroke-width="1.3"/>`;
  }
  field += text(x + 18, 639, `frequency ${panel + 2} / amplitude 35`, 13);
}
for (const [name, bg, body] of [
  ["commonplace", "#e9eef6", notes],
  ["trace", "#e8edf3", trace],
  ["latent-garden", "#eaf0ed", garden],
  ["field-notes", "#f0ede8", field],
]) {
  const svg = frame(bg, body);
  assert(!/NaN|undefined/.test(svg));
  writeFileSync(`public/images/${name}.svg`, svg);
}
console.log("Generated four explanatory project previews.");
