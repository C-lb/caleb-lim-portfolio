const $ = (s) => document.querySelector(s);
const state = { editing: null, cover: null, gallery: [], pdf: { stagingId: null, thumbs: [], selected: [] } };

function wireDrop(dropId, inputId, onFiles) {
  const drop = $(dropId), input = $(inputId);
  drop.addEventListener('click', () => input.click());
  input.addEventListener('change', () => onFiles([...input.files]));
  ['dragover', 'dragenter'].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((e) => drop.addEventListener(e, () => drop.classList.remove('over')));
  drop.addEventListener('drop', (ev) => { ev.preventDefault(); onFiles([...ev.dataTransfer.files]); });
}

// Cover: a new File replaces; in edit mode an existing cover shows as a URL preview.
wireDrop('#cover-drop', '#cover-input', (files) => {
  state.cover = files[0] || null;
  if (state.cover) $('#cover-preview').innerHTML = `<img src="${URL.createObjectURL(state.cover)}" />`;
});

// Gallery tiles carry kind: 'keep' (name + url) or 'new' (file).
wireDrop('#gallery-drop', '#gallery-input', (files) => {
  for (const f of files.filter((f) => f.type.startsWith('image/'))) state.gallery.push({ kind: 'new', file: f });
  renderGallery();
});

function tileSrc(item) { return item.kind === 'new' ? URL.createObjectURL(item.file) : item.url; }

function renderGallery() {
  const list = $('#gallery-list'); list.innerHTML = '';
  state.gallery.forEach((item, i) => {
    const tile = document.createElement('div');
    tile.className = 'tile'; tile.draggable = true;
    tile.innerHTML = `<img src="${tileSrc(item)}" />${item.kind === 'keep' ? '<span class="kept">saved</span>' : ''}<button type="button" class="x">×</button>`;
    tile.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', i));
    tile.addEventListener('dragover', (e) => e.preventDefault());
    tile.addEventListener('drop', (e) => {
      e.preventDefault();
      const from = +e.dataTransfer.getData('text/plain');
      const [m] = state.gallery.splice(from, 1); state.gallery.splice(i, 0, m); renderGallery();
    });
    tile.querySelector('.x').addEventListener('click', () => { state.gallery.splice(i, 1); renderGallery(); });
    list.appendChild(tile);
  });
}

// PDF picker (shared by new + edit). pdfChanged tracks whether the user touched it.
let pdfRemoved = false;
wireDrop('#pdf-drop', '#pdf-input', async (files) => {
  const pdf = files[0]; if (!pdf) return;
  pdfRemoved = false;
  $('#pdf-drop').textContent = 'Reading PDF…';
  const fd = new FormData(); fd.set('pdf', pdf);
  const res = await fetch('/api/pdf/preview', { method: 'POST', body: fd });
  if (!res.ok) { $('#pdf-drop').textContent = 'Could not read that PDF. Try another.'; return; }
  const data = await res.json();
  state.pdf = { stagingId: data.stagingId, thumbs: data.thumbs, selected: [], replaced: true };
  $('#pdf-drop').textContent = `${data.pageCount} pages. Click the ones to feature, in order.`;
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

// ---- Mode switching ----
function setMode(mode) {
  $('#mode-new').classList.toggle('active', mode === 'new');
  $('#mode-edit').classList.toggle('active', mode !== 'new');
  $('#edit-list').classList.toggle('hidden', mode !== 'edit');
  $('#piece-form').classList.toggle('hidden', mode === 'edit');
  if (mode === 'new') resetForm();
}

function resetForm() {
  state.editing = null; state.cover = null; state.gallery = []; state.pdf = { stagingId: null, thumbs: [], selected: [] }; pdfRemoved = false;
  $('#piece-form').reset(); $('#cover-preview').innerHTML = ''; $('#gallery-list').innerHTML = ''; $('#pdf-pages').innerHTML = ''; $('#pdf-clear')?.remove();
  $('#pdf-drop').textContent = 'Drag a PDF here, then click the pages to feature';
  $('#form-title').textContent = 'New piece'; $('#create').textContent = 'Create piece';
  $('#result').classList.add('hidden'); $('#form-msg').textContent = '';
}

$('#mode-new').addEventListener('click', () => setMode('new'));
$('#mode-edit').addEventListener('click', async () => { setMode('edit'); await loadList(); });

async function loadList() {
  const box = $('#pieces'); box.innerHTML = 'Loading…';
  const list = await (await fetch('/api/pieces')).json();
  box.innerHTML = '';
  for (const p of list) {
    const row = document.createElement('div');
    row.className = 'piece-row';
    row.innerHTML = `<span>${p.title} <span class="cat">${p.category}</span>${p.draft ? '<span class="badge">draft</span>' : ''}</span><span>edit →</span>`;
    row.addEventListener('click', () => loadPiece(p.slug));
    box.appendChild(row);
  }
  if (!list.length) box.textContent = 'No pieces yet.';
}

async function loadPiece(slug) {
  const p = await (await fetch(`/api/pieces/${slug}`)).json();
  resetForm();
  state.editing = slug;
  const f = $('#piece-form');
  f.title.value = p.title; f.category.value = p.category; f.context.value = p.context;
  f.role.value = p.role; f.outcome.value = p.outcome; f.year.value = p.year || '';
  $('#deliverables').value = (p.deliverables || []).join(', ');
  f.pullQuote.value = p.pullQuote || '';
  $('#draft').checked = !!p.draft;
  $('#cover-preview').innerHTML = `<img src="${p.heroUrl}" />`;
  state.gallery = p.gallery.map((name, i) => ({ kind: 'keep', name, url: p.galleryUrls[i] }));
  renderGallery();
  if (p.pdf && p.pdf.present) {
    const t = await (await fetch(`/api/pieces/${slug}/pdf-thumbs`)).json();
    state.pdf = { stagingId: null, thumbs: t.thumbs, selected: t.selected, replaced: false };
    $('#pdf-drop').textContent = `${t.pageCount} pages. Click to change which feature. Drag a new PDF to replace, or clear below.`;
    renderPdf();
    ensurePdfClearButton();
  }
  $('#form-title').textContent = `Editing: ${p.title}`;
  $('#create').textContent = 'Save changes';
  setMode('edit-loaded');
}

function ensurePdfClearButton() {
  if ($('#pdf-clear')) return;
  const btn = document.createElement('button');
  btn.type = 'button'; btn.id = 'pdf-clear'; btn.textContent = 'Remove PDF';
  btn.addEventListener('click', () => {
    pdfRemoved = true; state.pdf = { stagingId: null, thumbs: [], selected: [], replaced: false };
    $('#pdf-pages').innerHTML = ''; $('#pdf-drop').textContent = 'PDF will be removed on save. Drag a new one to keep a deck.';
    btn.remove();
  });
  $('#pdf-pages').after(btn);
}

// ---- Build the gallery plan + pdf plan for submit ----
// Single pass so a 'new' tile's plan idx matches the Nth appended gallery file
// (the PUT endpoint maps idx -> uploaded file by this same order).
function galleryPlanAndFiles(fd) {
  let newIdx = 0;
  return state.gallery.map((item) => {
    if (item.kind === 'keep') return { kind: 'keep', name: item.name };
    fd.append('gallery', item.file, item.file.name);
    return { kind: 'new', idx: newIdx++ };
  });
}
function pdfPlan() {
  if (state.editing) {
    if (pdfRemoved) return { action: 'remove' };
    if (state.pdf.replaced && state.pdf.stagingId) return { action: 'replace', stagingId: state.pdf.stagingId, pages: state.pdf.selected };
    if (state.pdf.thumbs.length) return { action: 'repick', pages: state.pdf.selected };
    return { action: 'keep' };
  }
  return null; // create path uses pdfStagingId/pdfPages directly
}

$('#piece-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const msg = $('#form-msg'); msg.className = 'msg'; msg.textContent = '';
  const f = e.target; const fd = new FormData();
  ['title', 'category', 'context', 'role', 'outcome', 'year', 'pullQuote'].forEach((k) => fd.set(k, f[k]?.value || ''));
  fd.set('draft', $('#draft').checked ? 'true' : 'false');
  fd.set('deliverables', JSON.stringify(($('#deliverables').value || '').split(',').map((s) => s.trim()).filter(Boolean)));

  if (state.editing) {
    const plan = galleryPlanAndFiles(fd);
    fd.set('galleryPlan', JSON.stringify(plan));
    fd.set('pdfPlan', JSON.stringify(pdfPlan()));
    if (state.cover) fd.set('cover', state.cover, state.cover.name);
    $('#create').disabled = true; msg.textContent = 'Saving…';
    try {
      const res = await fetch(`/api/pieces/${state.editing}`, { method: 'PUT', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      showResult(data, f.title.value, 'update');
      msg.classList.add('ok'); msg.textContent = `Saved ${data.slug}.`;
    } catch (err) { msg.classList.add('err'); msg.textContent = err.message; }
    finally { $('#create').disabled = false; refreshStatus(); }
    return;
  }

  // ---- create path (unchanged behavior) ----
  if (!state.cover) { msg.classList.add('err'); msg.textContent = 'A cover image is required.'; return; }
  fd.set('cover', state.cover, state.cover.name);
  state.gallery.forEach((item) => { if (item.kind === 'new') fd.append('gallery', item.file, item.file.name); });
  if (state.pdf.stagingId && state.pdf.selected.length) {
    fd.set('pdfStagingId', state.pdf.stagingId);
    fd.set('pdfPages', JSON.stringify(state.pdf.selected));
  }
  $('#create').disabled = true; msg.textContent = 'Creating…';
  try {
    const res = await fetch('/api/piece', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed');
    showResult(data, f.title.value, 'create');
    msg.classList.add('ok'); msg.textContent = `Created ${data.slug}.`;
  } catch (err) { msg.classList.add('err'); msg.textContent = err.message; }
  finally { $('#create').disabled = false; refreshStatus(); }
});

function showResult(data, title, mode) {
  $('#preview-link').href = data.previewUrl;
  $('#warnings').textContent = (data.warnings || []).join(' ');
  $('#result').dataset.title = title; $('#result').dataset.mode = mode;
  $('#result').classList.remove('hidden');
}

$('#publish').addEventListener('click', async () => {
  const m = $('#publish-msg'); m.className = 'msg'; m.textContent = 'Publishing…';
  $('#publish').disabled = true;
  try {
    const res = await fetch('/api/publish', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: $('#result').dataset.title || '', mode: $('#result').dataset.mode || 'create' }),
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
