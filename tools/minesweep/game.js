import { placeMines, computeAdjacency, floodReveal, checkWin } from "./logic.js";

const gridEl = document.getElementById("grid");
const minesEl = document.getElementById("mines");
const timeEl = document.getElementById("time");
const msgEl = document.getElementById("msg");

let rows, cols, mineCount, mineSet, adj, revealed, flagged, started, over, timer, seconds;

function config() {
  const [r, c, m] = document.getElementById("level").value.split(",").map(Number);
  return { r, c, m };
}

function start() {
  const { r, c, m } = config();
  rows = r; cols = c; mineCount = m;
  mineSet = new Set();
  adj = [];
  revealed = new Set();
  flagged = new Set();
  started = false;
  over = false;
  seconds = 0;
  clearInterval(timer);
  timeEl.textContent = "0";
  msgEl.textContent = "";
  gridEl.style.gridTemplateColumns = `repeat(${cols}, 30px)`;
  render();
}

function firstClick(idx) {
  mineSet = placeMines(rows, cols, mineCount, idx);
  adj = computeAdjacency(rows, cols, mineSet);
  started = true;
  timer = setInterval(() => {
    seconds++;
    timeEl.textContent = String(seconds);
  }, 1000);
}

function reveal(idx) {
  if (over || flagged.has(idx) || revealed.has(idx)) return;
  if (!started) firstClick(idx);
  if (mineSet.has(idx)) return lose();
  floodReveal(rows, cols, adj, idx, revealed, flagged);
  if (checkWin(rows, cols, mineSet, revealed)) return win();
  render();
}

function toggleFlag(idx) {
  if (over || revealed.has(idx) || !started) return;
  if (flagged.has(idx)) flagged.delete(idx);
  else flagged.add(idx);
  render();
}

function lose() {
  over = true;
  clearInterval(timer);
  for (const m of mineSet) revealed.add(m);
  msgEl.textContent = "💥 Boom! Novo jogo?";
  msgEl.style.color = "#ef4444";
  render();
}

function win() {
  over = true;
  clearInterval(timer);
  msgEl.textContent = `🎉 Venceu em ${seconds}s!`;
  msgEl.style.color = "#22c55e";
  render();
}

function render() {
  minesEl.textContent = String(mineCount - flagged.size);
  gridEl.innerHTML = "";
  for (let i = 0; i < rows * cols; i++) {
    const cell = document.createElement("div");
    cell.className = "c";
    if (flagged.has(i)) {
      cell.classList.add("flag");
      cell.textContent = "🚩";
    } else if (revealed.has(i)) {
      cell.classList.add("rev");
      if (mineSet.has(i)) {
        cell.classList.add("mine");
        cell.textContent = "💣";
      } else if (adj[i] > 0) {
        cell.textContent = String(adj[i]);
        cell.classList.add("n" + adj[i]);
      }
    }
    cell.addEventListener("click", () => reveal(i));
    cell.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      toggleFlag(i);
    });
    // long-press to flag (touch)
    let lp;
    cell.addEventListener("pointerdown", () => {
      lp = setTimeout(() => {
        toggleFlag(i);
        lp = null;
      }, 400);
    });
    cell.addEventListener("pointerup", () => {
      if (lp) clearTimeout(lp);
    });
    gridEl.appendChild(cell);
  }
}

document.getElementById("new").addEventListener("click", start);
document.getElementById("level").addEventListener("change", start);
start();
