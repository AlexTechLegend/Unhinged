(function() {
  if (window.StockAnalyzerLoaded) return;
  window.StockAnalyzerLoaded = true;

  let sidebar;
  let dragOffsetX = 0;
  let dragOffsetY = 0;

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
        <button id="sc-capture" class="rounded px-2 py-1">Capture Snippet</button>
        <div id="sc-result" class="my-2"></div>
        <div id="sc-notes" class="my-2">
          <textarea id="sc-note" placeholder="Add note" class="w-full border text-black"></textarea>
          <button id="sc-save" class="rounded px-2 py-1 bg-green-600 text-white">Save Note</button>
          <div id="sc-notes-list" class="mt-2"></div>
        </div>
      </div>
    `;
    document.body.appendChild(sidebar);
    sidebar.querySelector('header').addEventListener('mousedown', startDrag);
    document.getElementById('sc-close').onclick = toggleSidebar;
    document.getElementById('sc-capture').onclick = startSelection;
    document.getElementById('sc-save').onclick = saveCurrentNote;
    loadNotes();
  }

function toggleSidebar() {
  createSidebar();
  if (sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
    sidebar.style.right = '-320px';
    sidebar.style.left = 'auto';
    sidebar.style.top = '0px';
  } else {
    sidebar.classList.add('open');
    sidebar.style.right = '0px';
  }
}

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'toggle_sidebar') {
      toggleSidebar();
    }
  });

  function startDrag(e) {
    const rect = sidebar.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('mouseup', endDrag);
  }

  function onDrag(e) {
    sidebar.style.left = e.clientX - dragOffsetX + 'px';
    sidebar.style.top = e.clientY - dragOffsetY + 'px';
    sidebar.style.right = 'auto';
  }

  function endDrag() {
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('mouseup', endDrag);
  }

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
  img.onload = () => {
    const analysis = analyzeChart(img);
    const analysisDiv = document.createElement('div');
    analysisDiv.className = 'text-sm bg-gray-700 p-2 mt-2';
    analysisDiv.textContent = analysis.join('\n');
    res.appendChild(analysisDiv);
    res.dataset.analysis = analysis.join('\n');
  };
  res.dataset.currentImage = dataUrl;
}

function analyzeChart(imgEl) {
  const info = window.StockAnalyzer.analyzeImage(imgEl);
  const lines = [];
  lines.push('Trend: ' + info.trend);
  lines.push('Support level: ' + (info.support * 100).toFixed(1) + '%');
  lines.push('Resistance level: ' + (info.resistance * 100).toFixed(1) + '%');
  return lines;
}

function saveCurrentNote() {
  const img = document.getElementById('sc-result').dataset.currentImage;
  if (!img) return;
  const noteText = document.getElementById('sc-note').value;
  const analysis = document.getElementById('sc-result').dataset.analysis || '';
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

})();
