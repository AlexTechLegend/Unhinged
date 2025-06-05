let sidebar;

function createSidebar() {
  if (sidebar) return;
  sidebar = document.createElement('div');
  sidebar.id = 'sc-sidebar';
  sidebar.innerHTML = `
    <header>
      <span>Stock Analyzer</span>
      <button id="sc-close">✕</button>
    </header>
    <div id="sc-body" class="p-2">
      <button id="sc-capture" class="bg-blue-500 text-white rounded px-2 py-1">Capture Snippet</button>
      <div id="sc-result" class="my-2"></div>
      <div id="sc-notes" class="my-2">
        <textarea id="sc-note" placeholder="Add note" class="w-full border"></textarea>
        <button id="sc-save" class="bg-green-500 text-white rounded px-2 py-1">Save Note</button>
        <div id="sc-notes-list" class="mt-2"></div>
      </div>
    </div>
  `;
  document.body.appendChild(sidebar);
  document.getElementById('sc-close').onclick = toggleSidebar;
  document.getElementById('sc-capture').onclick = startSelection;
  document.getElementById('sc-save').onclick = saveCurrentNote;
  loadNotes();
}

function toggleSidebar() {
  createSidebar();
  sidebar.classList.toggle('open');
}

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'toggle_sidebar') {
    toggleSidebar();
  }
});

function startSelection() {
  const overlay = document.createElement('div');
  overlay.id = 'sc-overlay';
  const rectEl = document.createElement('div');
  rectEl.id = 'sc-rect';
  overlay.appendChild(rectEl);
  document.body.appendChild(overlay);
  let startX, startY;
  function onMouseDown(e) {
    startX = e.clientX;
    startY = e.clientY;
    rectEl.style.left = startX + 'px';
    rectEl.style.top = startY + 'px';
    overlay.addEventListener('mousemove', onMouseMove);
    overlay.addEventListener('mouseup', onMouseUp);
  }
  function onMouseMove(e) {
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    rectEl.style.left = x + 'px';
    rectEl.style.top = y + 'px';
    rectEl.style.width = w + 'px';
    rectEl.style.height = h + 'px';
  }
  function onMouseUp(e) {
    overlay.removeEventListener('mousemove', onMouseMove);
    overlay.removeEventListener('mouseup', onMouseUp);
    overlay.remove();
    const x = Math.min(e.clientX, startX);
    const y = Math.min(e.clientY, startY);
    const w = Math.abs(e.clientX - startX);
    const h = Math.abs(e.clientY - startY);
    captureRect({ x, y, w, h });
  }
  overlay.addEventListener('mousedown', onMouseDown, { once: true });
}

function captureRect(rect) {
  chrome.runtime.sendMessage({ action: 'capture_screen' }, (res) => {
    if (chrome.runtime.lastError) {
      console.error('capture_screen failed:', chrome.runtime.lastError);
      alert('Capture failed: ' + chrome.runtime.lastError.message);
      return;
    }
    if (!res || res.error) {
      const msg = res && res.error ? res.error : 'Unknown error';
      alert('Capture failed: ' + msg);
      return;
    }
    const img = new Image();
    img.src = res.dataUrl;
    img.onload = () => {
      const scale = window.devicePixelRatio;
      const canvas = document.createElement('canvas');
      canvas.width = rect.w * scale;
      canvas.height = rect.h * scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(
        img,
        rect.x * scale,
        rect.y * scale,
        rect.w * scale,
        rect.h * scale,
        0,
        0,
        rect.w * scale,
        rect.h * scale
      );
      const snippet = canvas.toDataURL('image/png');
      showResult(snippet);
    };
  });
}

function showResult(dataUrl) {
  const res = document.getElementById('sc-result');
  res.innerHTML = '';
  const img = document.createElement('img');
  img.src = dataUrl;
  img.className = 'my-2 max-w-full';
  res.appendChild(img);
  const analysis = analyzeChart();
  const analysisDiv = document.createElement('div');
  analysisDiv.className = 'text-sm bg-gray-100 p-2 mt-2';
  analysisDiv.textContent = analysis.join('\n');
  res.appendChild(analysisDiv);
  res.dataset.currentImage = dataUrl;
}

function analyzeChart() {
  const data = window.StockAnalyzer.sampleData();
  const result = window.StockAnalyzer.analyzeData(data);
  const rr = window.StockAnalyzer.riskReward(
    data[data.length - 1].close,
    result.levels.support,
    result.levels.resistance
  );
  const lines = [];
  lines.push('Support: ' + result.levels.support.toFixed(2));
  lines.push('Resistance: ' + result.levels.resistance.toFixed(2));
  if (result.patterns.length) lines.push('Patterns: ' + result.patterns.join(', '));
  lines.push('RSI: ' + result.rsi.toFixed(2));
  lines.push(...result.signals);
  lines.push('Backtest PnL: ' + result.backtest.pnl.toFixed(2));
  lines.push('Risk/Reward Ratio: ' + rr.ratio);
  return lines;
}

function saveCurrentNote() {
  const img = document.getElementById('sc-result').dataset.currentImage;
  if (!img) return;
  const noteText = document.getElementById('sc-note').value;
  const analysis = analyzeChart().join('\n');
  chrome.storage.sync.get({ notes: [] }, (data) => {
    data.notes.push({ image: img, analysis, note: noteText });
    chrome.storage.sync.set({ notes: data.notes }, loadNotes);
  });
}

function loadNotes() {
  chrome.storage.sync.get({ notes: [] }, (data) => {
    const list = document.getElementById('sc-notes-list');
    list.innerHTML = '';
    data.notes.forEach((n) => {
      const div = document.createElement('div');
      div.className = 'border my-1 p-1';
      const im = document.createElement('img');
      im.src = n.image;
      const text = document.createElement('pre');
      text.textContent = n.analysis + '\n' + n.note;
      div.appendChild(im);
      div.appendChild(text);
      list.appendChild(div);
    });
  });
}

// Inject Tailwind for styling
(function () {
  if (!document.getElementById('tailwind-inject')) {
    const link = document.createElement('link');
    link.id = 'tailwind-inject';
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css';
    document.head.appendChild(link);
  }
})();
