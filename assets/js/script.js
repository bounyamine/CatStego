// ══════════════════════════════════════════════════════
// CLOCK
// ══════════════════════════════════════════════════════
function updateClock() {
  const now = new Date();
  const h = now.getHours().toString().padStart(2,'0');
  const m = now.getMinutes().toString().padStart(2,'0');
  const t = `${h}:${m}`;
  document.querySelectorAll('[id^="clock"]').forEach(el => el.textContent = t);
}
updateClock();
setInterval(updateClock, 10000);

// ══════════════════════════════════════════════════════
// NAVIGATION
// ══════════════════════════════════════════════════════
function goTo(screenId) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(screenId);
  target.classList.add('active');
  target.querySelector('.screen-content')?.scrollTo(0,0);
  if (screenId === 'screen-encode' && catGallery.length === 0) {
    loadCatGallery();
  }
}

// ══════════════════════════════════════════════════════
// CAT API
// ══════════════════════════════════════════════════════
const CAT_API = 'https://api.thecatapi.com/v1';
// Fallback placeholder images (generated data URIs won't work for pixels,
// so we use picsum-style public cat images)
const FALLBACK_CATS = [
  'https://cataas.com/cat?width=600&height=400&ts=1',
  'https://cataas.com/cat?width=600&height=400&ts=2',
  'https://cataas.com/cat?width=600&height=400&ts=3',
  'https://cataas.com/cat?width=600&height=400&ts=4',
  'https://cataas.com/cat?width=600&height=400&ts=5',
  'https://cataas.com/cat?width=600&height=400&ts=6',
];

let catGallery = []; // [{url, w, h, capacity}]
let selectedCatIdx = -1;
let encodedImageDataUrl = null;

async function loadCatGallery() {
  const btn = document.getElementById('refresh-cats-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="cat-loading"><span>🐱</span><span>🐱</span><span>🐱</span></span> Chargement...`;

  // Show skeletons
  const carousel = document.getElementById('cat-carousel');
  carousel.innerHTML = Array(6).fill('<div class="cat-thumb skeleton" style="height:72px;width:80px"></div>').join('');

  catGallery = [];
  selectedCatIdx = -1;
  document.getElementById('cat-preview-img').style.display = 'none';
  document.getElementById('cat-preview-overlay').style.display = 'none';
  document.querySelector('#cat-preview-box .cat-placeholder').style.display = 'flex';

  try {
    // Use cataas API
    catGallery = [];
    for (let i = 0; i < 6; i++) {
      catGallery.push({
        url: `https://cataas.com/cat?width=800&height=600&random=${Date.now()+i}`,
        w: 800, h: 600
      });
    }
  } catch(e) {
    // Fallback to local or something
    catGallery = FALLBACK_CATS.map((url, i) => ({
      url: `https://cataas.com/cat?width=800&height=600&random=${Date.now()+i}`,
      w: 800, h: 600
    }));
  }

  // Calculate capacities and render
  carousel.innerHTML = '';
  catGallery.forEach((cat, idx) => {
    const cap = Math.floor((cat.w * cat.h * 3) / 8) - 20; // bytes for payload
    cat.capacity = cap;

    const div = document.createElement('div');
    div.className = 'cat-thumb';
    div.dataset.idx = idx;
    div.innerHTML = `
      <img src="${cat.url}" crossorigin="anonymous" alt="Chat ${idx+1}" onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'80\\' height=\\'72\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23131C2E\\'/><text x=\\'50%\\' y=\\'50%\\' font-size=\\'28\\' text-anchor=\\'middle\\' dominant-baseline=\\'middle\\'>🐱</text></svg>'">
      <div class="cat-thumb-check">✓</div>
      <div class="cat-cap-badge">${formatCap(cap)}</div>
    `;
    div.addEventListener('click', () => selectCat(idx));
    carousel.appendChild(div);
  });

  btn.disabled = false;
  btn.innerHTML = '<span>🐱</span> Générer de nouveaux chats';
}

function formatCap(bytes) {
  if (bytes < 1000) return `${bytes}c`;
  return `${(bytes/1000).toFixed(1)}k c`;
}

function selectCat(idx) {
  selectedCatIdx = idx;
  const cat = catGallery[idx];

  // Update carousel selection
  document.querySelectorAll('.cat-thumb').forEach((el, i) => {
    el.classList.toggle('selected', i === idx);
  });

  // Update preview
  const imgEl = document.getElementById('cat-preview-img');
  const placeholder = document.querySelector('#cat-preview-box .cat-placeholder');
  const overlay = document.getElementById('cat-preview-overlay');

  imgEl.src = cat.url;
  imgEl.crossOrigin = 'anonymous';
  imgEl.style.display = 'block';
  placeholder.style.display = 'none';
  overlay.style.display = 'flex';

  document.getElementById('cat-preview-info').textContent = `${cat.w}×${cat.h} · PNG`;
  document.getElementById('cat-capacity-badge').textContent = `≈ ${formatCap(cat.capacity)}`;

  updateCharCounter();
  resetEncodeResult();
}

// Load home cat - commented out to use static image
async function loadHomeDecorCat() {
  try {
    const resp = await fetch(`${CAT_API}/images/search?limit=1`, { signal: AbortSignal.timeout(4000) });
    const data = await resp.json();
    document.getElementById('home-cat-img').src = data[0].url;
  } catch {
    document.getElementById('home-cat-img').src = `https://cataas.com/cat?width=300&random=${Date.now()}`;
  }
}
loadHomeDecorCat();

// ══════════════════════════════════════════════════════
// XOR ENCRYPTION
// ══════════════════════════════════════════════════════
const DELIMITER = '###END###';

function xorEncrypt(message, key) {
  if (!key || key.length === 0) return message;
  const msgBytes = new TextEncoder().encode(message);
  const keyBytes = new TextEncoder().encode(key);
  const enc = msgBytes.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
  return Array.from(enc).map(b => b.toString(16).padStart(2,'0')).join('');
}

function xorDecrypt(hexMsg, key) {
  try {
    if (!key || key.length === 0) return hexMsg;
    const enc = new Uint8Array(hexMsg.match(/.{1,2}/g).map(h => parseInt(h, 16)));
    const keyBytes = new TextEncoder().encode(key);
    const dec = enc.map((b, i) => b ^ keyBytes[i % keyBytes.length]);
    return new TextDecoder().decode(dec);
  } catch { return null; }
}

function evaluateKeyStrength(key) {
  let score = 0;
  if (key.length >= 6) score++;
  if (key.length >= 12) score++;
  if (/[0-9]/.test(key)) score++;
  if (/[A-Z]/.test(key)) score++;
  if (/[^a-zA-Z0-9]/.test(key)) score++;
  const levels = [
    { label: 'Faible', color: '#EF4444' },
    { label: 'Faible', color: '#EF4444' },
    { label: 'Moyenne', color: '#F59E0B' },
    { label: 'Forte', color: '#10B981' },
    { label: 'Très forte', color: '#00D4FF' },
    { label: 'Très forte', color: '#00D4FF' },
  ];
  return { score, ...levels[Math.min(score, 5)] };
}

// ══════════════════════════════════════════════════════
// LSB STEGANOGRAPHY (Canvas-based)
// ══════════════════════════════════════════════════════
function stringToBits(str) {
  const bits = [];
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    for (let b = 7; b >= 0; b--) bits.push((c >> b) & 1);
  }
  return bits;
}

function bitsToString(bits) {
  let str = '';
  for (let i = 0; i < bits.length - 7; i += 8) {
    let c = 0;
    for (let b = 0; b < 8; b++) c = (c << 1) | bits[i + b];
    if (c === 0) break; // null terminator
    str += String.fromCharCode(c);
  }
  return str;
}

/**
 * Encodes a message into an image using LSB steganography
 * Returns a data URL of the encoded PNG image
 */
async function lsbEncode(imageUrl, message, key) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.getElementById('work-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data; // RGBA array

        // Encrypt + append delimiter
        const encrypted = xorEncrypt(message, key);
        const payload = encrypted + DELIMITER;
        const bits = stringToBits(payload);

        // Check capacity (3 channels per pixel, skip alpha)
        const maxBits = Math.floor((pixels.length / 4) * 3);
        if (bits.length > maxBits) {
          reject(new Error(`Message trop long (${bits.length} bits > ${maxBits} max)`));
          return;
        }

        // Embed bits in R, G, B (not A) of each pixel
        let bitIdx = 0;
        for (let i = 0; i < pixels.length && bitIdx < bits.length; i++) {
          if ((i + 1) % 4 === 0) continue; // skip alpha
          pixels[i] = (pixels[i] & 0xFE) | bits[bitIdx++];
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch(e) { reject(e); }
    };
    img.onerror = () => reject(new Error("Impossible de charger l'image du chat. CORS ou réseau ?"));
    img.src = imageUrl;
  });
}

/**
 * Decodes a message from an image using LSB steganography
 */
async function lsbDecode(imageDataUrl, key) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.getElementById('work-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;

        // Extract LSBs from RGB channels
        const bits = [];
        for (let i = 0; i < pixels.length; i++) {
          if ((i + 1) % 4 === 0) continue;
          bits.push(pixels[i] & 1);
        }

        // Convert bits to string until delimiter
        const raw = bitsToString(bits);
        const delimIdx = raw.indexOf(DELIMITER);
        if (delimIdx === -1) { resolve(null); return; }

        const encrypted = raw.substring(0, delimIdx);
        const decrypted = xorDecrypt(encrypted, key);
        resolve(decrypted);
      } catch(e) { reject(e); }
    };
    img.onerror = () => reject(new Error("Impossible de lire l'image"));
    img.src = imageDataUrl;
  });
}

// ══════════════════════════════════════════════════════
// UI HELPERS
// ══════════════════════════════════════════════════════
function toggleKeyVis(inputId, btn) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

function updateKeyStrength() {
  const key = document.getElementById('encode-key').value;

  // Easter egg
  const egg = document.getElementById('meow-egg');
  egg.classList.toggle('active', key.toLowerCase() === 'meow');

  const { score, label, color } = evaluateKeyStrength(key);
  const bars = ['sb1','sb2','sb3','sb4'];
  const thresholds = [1, 2, 3, 5]; // score needed to light bar
  bars.forEach((id, i) => {
    const el = document.getElementById(id);
    el.style.background = score >= thresholds[i] ? color : 'var(--bg-elevated)';
  });
  const labelEl = document.getElementById('strength-label');
  labelEl.textContent = key.length === 0 ? '—' : label;
  labelEl.style.color = key.length === 0 ? 'var(--text-muted)' : color;
}

function updateCharCounter() {
  const msg = document.getElementById('encode-message').value;
  const usedChars = msg.length;
  // Encrypt doubles length (hex), then delimiter
  const usedBytes = xorEncrypt(msg, 'x').length + DELIMITER.length; // estimate
  const usedBits = usedBytes * 8;

  document.getElementById('char-used').textContent = usedChars;

  if (selectedCatIdx < 0) {
    document.getElementById('char-total').textContent = '/ sélectionnez un chat';
    document.getElementById('capacity-fill').style.width = '0%';
    return;
  }

  const cat = catGallery[selectedCatIdx];
  const maxBits = cat.w * cat.h * 3;
  const pct = Math.min(100, (usedBits / maxBits) * 100);

  document.getElementById('char-total').textContent = `/ ≈ ${formatCap(cat.capacity)}`;
  const fill = document.getElementById('capacity-fill');
  fill.style.width = pct + '%';
  fill.className = 'capacity-fill' + (pct > 80 ? ' high' : pct > 50 ? ' medium' : '');
}

function resetEncodeResult() {
  document.getElementById('encode-result-success').classList.remove('visible');
  document.getElementById('encode-result-error').classList.remove('visible');
  document.getElementById('encode-progress').classList.remove('visible');
}

function showToast(msg, duration=2500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), duration);
}

// ══════════════════════════════════════════════════════
// ENCODE ACTION
// ══════════════════════════════════════════════════════
async function doEncode() {
  resetEncodeResult();

  const message = document.getElementById('encode-message').value.trim();
  const key = document.getElementById('encode-key').value;

  // Validations
  if (selectedCatIdx < 0) {
    showError('encode', '🐱 Veuillez d\'abord sélectionner un chat !'); return;
  }
  if (!message) {
    showError('encode', '✏️ Entrez un message à cacher.'); return;
  }
  if (!key || key.trim().length === 0) {
    showError('encode', '🔑 La clé secrète est requise.'); return;
  }

  const btn = document.getElementById('encode-btn');
  btn.disabled = true;
  const progress = document.getElementById('encode-progress');
  const fill = document.getElementById('encode-fill');
  const progressText = document.getElementById('encode-progress-text');
  progress.classList.add('visible');

  // Animated progress
  const steps = [
    [10, 'Chiffrement XOR du message...'],
    [30, 'Chargement de l\'image...'],
    [60, 'Le chat cache votre message...'],
    [85, 'Finalisation PNG...'],
  ];
  let stepIdx = 0;
  const progressInterval = setInterval(() => {
    if (stepIdx < steps.length) {
      fill.style.width = steps[stepIdx][0] + '%';
      progressText.textContent = steps[stepIdx][1];
      stepIdx++;
    }
  }, 400);

  try {
    const catUrl = catGallery[selectedCatIdx].url;
    const dataUrl = await lsbEncode(catUrl, message, key);
    encodedImageDataUrl = dataUrl;

    clearInterval(progressInterval);
    fill.style.width = '100%';
    progressText.textContent = '✅ Terminé !';

    setTimeout(() => {
      progress.classList.remove('visible');
      fill.style.width = '0%';
      const successEl = document.getElementById('encode-result-success');
      const msgEl = document.getElementById('encode-success-msg');
      msgEl.textContent = `Message de ${message.length} caractères caché dans votre chat ! Partagez cette innocente photo pour transmettre votre secret 🐱`;
      successEl.classList.add('visible');
      btn.disabled = false;
      showToast('🐱 Message caché avec succès !');
    }, 600);

  } catch(e) {
    clearInterval(progressInterval);
    progress.classList.remove('visible');
    showError('encode', e.message || 'Erreur lors du traitement.');
    btn.disabled = false;
  }
}

function showError(screen, msg) {
  const el = document.getElementById(`${screen}-result-error`);
  document.getElementById(`${screen}-error-msg`).textContent = msg;
  el.classList.add('visible');
}

function downloadEncodedImg() {
  if (!encodedImageDataUrl) return;
  const a = document.createElement('a');
  a.href = encodedImageDataUrl;
  a.download = `catstego_${Date.now()}.png`;
  a.click();
  showToast('💾 Image téléchargée !');
}

// ══════════════════════════════════════════════════════
// DECODE ACTION
// ══════════════════════════════════════════════════════
let decodeImageDataUrl = null;

function triggerFilePick() {
  document.getElementById('file-input').click();
}

function handleFilePick(event) {
  const file = event.target.files[0];
  if (!file) return;
  event.target.value = '';

  const reader = new FileReader();
  reader.onload = (e) => {
    decodeImageDataUrl = e.target.result;

    const preview = document.getElementById('decode-preview');
    const previewImg = document.getElementById('decode-preview-img');
    previewImg.src = decodeImageDataUrl;
    preview.classList.add('visible');

    document.getElementById('decode-hint').style.display = 'flex';
    document.getElementById('decode-img-info').textContent = `${file.name} · ${(file.size/1024).toFixed(1)} KB`;

    document.getElementById('decode-result-success').classList.remove('visible');
    document.getElementById('decode-result-error').classList.remove('visible');
  };
  reader.readAsDataURL(file);
}

async function doDecode() {
  document.getElementById('decode-result-success').classList.remove('visible');
  document.getElementById('decode-result-error').classList.remove('visible');

  const key = document.getElementById('decode-key').value;

  if (!decodeImageDataUrl) {
    showDecodeError('❌ Erreur', '🖼 Veuillez d\'abord choisir une image depuis la galerie.'); return;
  }
  if (!key || key.trim().length === 0) {
    showDecodeError('❌ Erreur', '🔑 Entrez la clé secrète pour décoder.'); return;
  }

  const btn = document.getElementById('decode-btn');
  btn.disabled = true;
  const progress = document.getElementById('decode-progress');
  const fill = document.getElementById('decode-fill');
  progress.classList.add('visible');

  // Scan animation
  const scanOverlay = document.getElementById('scan-overlay');
  scanOverlay.classList.add('scanning');

  // Progress animation
  let p = 0;
  const progInt = setInterval(() => {
    p = Math.min(90, p + 15);
    fill.style.width = p + '%';
  }, 200);

  try {
    const message = await lsbDecode(decodeImageDataUrl, key);

    clearInterval(progInt);
    fill.style.width = '100%';
    scanOverlay.classList.remove('scanning');

    setTimeout(() => {
      progress.classList.remove('visible');
      btn.disabled = false;
      fill.style.width = '0%';

      if (message === null || message === undefined || message.trim() === '') {
        showDecodeError('😿 Aucun message', 'Aucun message trouvé dans ce chat. Cette image n\'a peut-être pas été encodée avec CatStego. 😿');
      } else {
        // Try to detect if message looks garbled (likely wrong key)
        const printable = message.split('').filter(c => c.charCodeAt(0) >= 32 && c.charCodeAt(0) < 127).length;
        const ratio = printable / message.length;
        if (ratio < 0.4 && message.length > 4) {
          showDecodeError('🙀 Clé incorrecte', 'Clé incorrecte. Ce chat ne vous révèle rien. 🙀\n\nEssayez avec la clé exacte utilisée lors de l\'encodage.');
        } else {
          document.getElementById('decoded-msg-text').textContent = message;
          document.getElementById('decode-result-success').classList.add('visible');
          document.getElementById('copy-btn').className = 'copy-btn';
          document.getElementById('copy-btn').textContent = '📋 Copier';
          showToast('🔓 Message révélé !');
        }
      }
    }, 400);

  } catch(e) {
    clearInterval(progInt);
    scanOverlay.classList.remove('scanning');
    progress.classList.remove('visible');
    btn.disabled = false;
    showDecodeError('❌ Erreur', e.message || 'Erreur lors de l\'analyse.');
  }
}

function showDecodeError(title, msg) {
  document.getElementById('decode-error-title').textContent = title;
  document.getElementById('decode-error-msg').textContent = msg;
  document.getElementById('decode-result-error').classList.add('visible');
}

function copyDecoded() {
  const text = document.getElementById('decoded-msg-text').textContent;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = document.getElementById('copy-btn');
      btn.className = 'copy-btn copied';
      btn.textContent = '✅ Copié !';
      setTimeout(() => {
        btn.className = 'copy-btn';
        btn.textContent = '📋 Copier';
      }, 2000);
    });
  } else {
    showToast('📋 Copie non disponible dans ce navigateur');
  }
}