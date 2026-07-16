const STORAGE_KEY = 'kelas_lobby_v1';

/** @typedef {{id:string, name:string, desc:string, photoDataUrl:string, createdAt:number}} KelasItem */

const els = {
  form: document.getElementById('formAddClass'),
  inputName: document.getElementById('inputClassName'),
  inputDesc: document.getElementById('inputClassDesc'),
  inputPhoto: document.getElementById('inputClassPhoto'),
  imgPreview: document.getElementById('imgPreview'),
  btnResetForm: document.getElementById('btnResetForm'),
  formMsg: document.getElementById('formMsg'),
  grid: document.getElementById('grid'),
  emptyState: document.getElementById('emptyState'),
  classCount: document.getElementById('classCount'),
  btnClearAll: document.getElementById('btnClearAll'),
};

let state = {
  items: /** @type {KelasItem[]} */ ([]),
};

let photoDataUrl = '';

function uid() {
  return Math.random().toString(16).slice(2) + '-' + Date.now().toString(16);
}

function setMsg(text, type = 'info') {
  els.formMsg.textContent = text;
  els.formMsg.style.color =
    type === 'error' ? 'var(--danger)' : 'var(--muted)';
}

function normalizeName(v) {
  return (v || '').trim().replace(/\s+/g, ' ');
}

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function writeStorage(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function render() {
  els.grid.innerHTML = '';
  const items = state.items.slice().sort((a, b) => b.createdAt - a.createdAt);

  els.emptyState.hidden = items.length !== 0;
  els.classCount.textContent = items.length + ' kelas';

  for (const item of items) {
    const card = document.createElement('article');
    card.className = 'card';

    const top = document.createElement('div');
    top.className = 'cardTop';

    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.textContent = 'Kelas';

    const img = document.createElement('img');
    img.alt = 'Foto ' + item.name;
    img.src = item.photoDataUrl;

    top.appendChild(badge);
    top.appendChild(img);

    const body = document.createElement('div');
    body.className = 'cardBody';

    const title = document.createElement('h3');
    title.className = 'cardTitle';
    title.textContent = item.name;

    const desc = document.createElement('p');
    desc.className = 'cardDesc';
    desc.textContent = item.desc ? item.desc : '—';

    const actions = document.createElement('div');
    actions.className = 'cardActions';

    const btnDel = document.createElement('button');
    btnDel.type = 'button';
    btnDel.className = 'smallBtn btn btn--danger';
    btnDel.textContent = 'Hapus';
    btnDel.addEventListener('click', () => {
      const ok = confirm('Hapus kelas "' + item.name + '"?');
      if (!ok) return;
      state.items = state.items.filter(x => x.id !== item.id);
      writeStorage(state.items);
      render();
    });

    actions.appendChild(btnDel);

    body.appendChild(title);
    body.appendChild(desc);
    body.appendChild(actions);

    card.appendChild(top);
    card.appendChild(body);
    els.grid.appendChild(card);
  }
}

function resetForm() {
  els.form.reset();
  photoDataUrl = '';
  els.imgPreview.src = '';
  els.imgPreview.hidden = false;
  setMsg('');
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function handlePhotoChange(file) {
  if (!file) {
    photoDataUrl = '';
    els.imgPreview.removeAttribute('src');
    return;
  }

  // Batas ukuran agar tidak terlalu berat di LocalStorage
  const maxBytes = 800 * 1024; // 800KB
  if (file.size > maxBytes) {
    setMsg('Ukuran foto terlalu besar (maks ~800KB). Pilih foto lain.', 'error');
    photoDataUrl = '';
    els.imgPreview.removeAttribute('src');
    return;
  }

  photoDataUrl = await fileToDataUrl(file);
  els.imgPreview.src = photoDataUrl;
}

els.inputPhoto.addEventListener('change', async (e) => {
  setMsg('');
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    await handlePhotoChange(file);
  } catch (err) {
    setMsg('Gagal memproses foto.', 'error');
  }
});

els.btnResetForm.addEventListener('click', () => resetForm());

els.form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const name = normalizeName(els.inputName.value);
  const desc = (els.inputDesc.value || '').trim().replace(/\s+/g, ' ');

  if (!name) {
    setMsg('Nama kelas wajib diisi.', 'error');
    return;
  }

  if (!photoDataUrl) {
    setMsg('Foto kelas wajib diunggah.', 'error');
    return;
  }

  const item = {
    id: uid(),
    name,
    desc,
    photoDataUrl,
    createdAt: Date.now(),
  };

  state.items.push(item);
  writeStorage(state.items);
  render();
  resetForm();
  setMsg('Kelas berhasil ditambahkan!', 'info');
});

els.btnClearAll.addEventListener('click', () => {
  const ok = confirm('Hapus semua kelas di lobby ini?');
  if (!ok) return;
  state.items = [];
  writeStorage(state.items);
  render();
  resetForm();
});

// init
state.items = readStorage();
render();
resetForm();

