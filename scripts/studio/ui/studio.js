const $ = (s) => document.querySelector(s);
const state = { cover: null, gallery: [], pdf: { stagingId: null, thumbs: [], selected: [] } };

function wireDrop(dropId, inputId, onFiles, multiple) {
  const drop = $(dropId), input = $(inputId);
  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => onFiles([...input.files]));
  ['dragover', 'dragenter'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, () => drop.classList.remove('over')));
  drop.addEventListener('drop', (ev) => { ev.preventDefault(); onFiles([...ev.dataTransfer.files]); });
}

// Cover
wireDrop('#cover-drop', '#cover-input', (files) => {
  state.cover = files[0] || null;
  $('#cover-preview').innerHTML = state.cover ? `<img src="${URL.createObjectURL(state.cover)}" />` : '';
});

// Gallery (with drag-to-reorder)
wireDrop('#gallery-drop', '#gallery-input', (files) => {
  state.gallery.push(...files.filter((f) => f.type.startsWith('image/')));
  renderGallery();
}, true);

function renderGallery() {
  const list = $('#gallery-list');
  list.innerHTML = '';
  state.gallery.forEach((file, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile'; tile.draggable = true;
    tile.innerHTML = `<img src="${URL.createObjectURL(file)}" /><button type="button" class="x" data-i="${i}">×</button>`;
    tile.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', i));
    tile.addEventListener('dragover', (e) => e.preventDefault());
    tile.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = +e.dataTransfer.getData('text/plain');
      const [m] = state.gallery.splice(from, 1);
      state.gallery.splice(i, 0, m);
      renderGallery();
    });
    tile.querySelector('.x').addEventListener('click', () => { state.gallery.splice(i, 1); renderGallery(); });
    list.appendChild(tile);
  });
}

// PDF preview + page selection
wireDrop('#pdf-drop', '#pdf-input', async (files) => {
  const pdf = files[0]; if (!pdf) return;
  $('#pdf-drop').textContent = 'Reading PDF…';
  const fd = new FormData(); fd.set('pdf', pdf);
  const res = await fetch('/api/pdf/preview', { method: 'POST', body: fd });
  if (!res.ok) { $('#pdf-drop').textContent = 'Could not read that PDF. Try another.'; return; }
  const data = await res.json();
  state.pdf = { stagingId: data.stagingId, thumbs: data.thumbs, selected: [] };
  $('#pdf-drop').textContent = `${data.pageCount} pages — click the ones to feature (in order)`;
  renderPdf();
});

function renderPdf() {
  const box = $('#pdf-pages'); box.innerHTML = '';
  state.pdf.thumbs.forEach((t) => {
    const tile = document.createElement('div');
    const rank = state.pdf.selected.indexOf(t.n);
    tile.className = 'tile' + (rank >= 0 ? ' selected' : '');
    tile.innerHTML = `<img src="${t.url}" />${rank >= 0 ? `<span class="badge">${rank + 1}</span>` : ''}`;
    tile.addEventListener('click', () => {
      const i = state.pdf.selected.indexOf(t.n);
      if (i >= 0) state.pdf.selected.splice(i, 1); else state.pdf.selected.push(t.n);
      renderPdf();
    });
    box.appendChild(tile);
  });
}

// Submit
$('#piece-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#form-msg'); msg.className = 'msg'; msg.textContent = '';
  if (!state.cover) { msg.classList.add('err'); msg.textContent = 'A cover image is required.'; return; }
  const f = e.target;
  const fd = new FormData();
  ['title', 'category', 'context', 'role', 'outcome', 'year', 'pullQuote'].forEach((k) => fd.set(k, f[k]?.value || ''));
  fd.set('draft', $('#draft').checked ? 'true' : 'false');
  fd.set('deliverables', JSON.stringify(($('#deliverables').value || '').split(',').map((s) => s.trim()).filter(Boolean)));
  fd.set('cover', state.cover, state.cover.name);
  state.gallery.forEach((g) => fd.append('gallery', g, g.name));
  if (state.pdf.stagingId && state.pdf.selected.length) {
    fd.set('pdfStagingId', state.pdf.stagingId);
    fd.set('pdfPages', JSON.stringify(state.pdf.selected));
  }
  $('#create').disabled = true; msg.textContent = 'Creating…';
  try {
    const res = await fetch('/api/piece', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    $('#preview-link').href = data.previewUrl;
    $('#warnings').textContent = (data.warnings || []).join(' ');
    $('#result').dataset.title = f.title.value;
    $('#result').classList.remove('hidden');
    msg.classList.add('ok'); msg.textContent = `Created ${data.slug}.`;
  } catch (err) {
    msg.classList.add('err'); msg.textContent = err.message;
  } finally { $('#create').disabled = false; refreshStatus(); }
});

// Publish
$('#publish').addEventListener('click', async () => {
  const m = $('#publish-msg'); m.className = 'msg'; m.textContent = 'Publishing…';
  $('#publish').disabled = true;
  try {
    const res = await fetch('/api/publish', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: $('#result').dataset.title || '' }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    m.classList.add(data.pushed ? 'ok' : 'err'); m.textContent = data.detail;
  } catch (err) { m.classList.add('err'); m.textContent = err.message; }
  finally { $('#publish').disabled = false; refreshStatus(); }
});

async function refreshStatus() {
  try {
    const { uncommitted } = await (await fetch('/api/status')).json();
    $('#status').textContent = uncommitted ? `${uncommitted} change(s) ready to publish` : 'up to date';
  } catch { $('#status').textContent = ''; }
}
refreshStatus();
