
/* ══════════════════════════════════
   STATE
══════════════════════════════════ */
let zoom = 0.65;
let photoDataUrl = null;
let sigDataUrl   = null;

/* ══════════════════════════════════
   TABS
══════════════════════════════════ */
function switchTab(name) {
  document.querySelectorAll('.panel-tab').forEach((t, i) => {
    const names = ['personal','card','media'];
    t.classList.toggle('active', names[i] === name);
  });
  document.querySelectorAll('.form-section').forEach(s => {
    s.classList.toggle('active', s.id === 'tab-' + name);
  });
}

/* ══════════════════════════════════
   ZOOM
══════════════════════════════════ */
function applyZoom() {

  const front = document.getElementById('card-front-wrapper');
  const back  = document.getElementById('card-back-wrapper');

  const z = Math.min(Math.max(zoom, 0.2), 1.5);

  front.style.transform = `scale(${z})`;
  back.style.transform  = `scale(${z})`;

  // dimensions réelles carte
  const cardWidth  = 1011;
  const cardHeight = 638;

  // hauteur dynamique du wrapper
  front.style.height = `${cardHeight * z}px`;
  back.style.height  = `${cardHeight * z}px`;

  document.getElementById('zoom-display').textContent =
    Math.round(z * 100) + '%';
}
function changeZoom(delta) {
  zoom = Math.min(Math.max(zoom + delta, 0.2), 1.5);
  applyZoom();
}
function fitZoom() {
  const pw = document.getElementById('preview-panel').offsetWidth - 80;
  zoom = Math.min(pw / 856, 1.0);
  zoom = Math.round(zoom * 10) / 10;
  applyZoom();
}

/* ══════════════════════════════════
   UPDATE CARD (live)
══════════════════════════════════ */
function v(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

function update() {
  // Front
  document.getElementById('c-title').textContent    = v('f-cardtitle');
  document.getElementById('c-username').textContent = v('f-username');
  document.getElementById('c-idnum').textContent    = v('f-idnum');
  document.getElementById('c-dob').textContent      = v('f-dob');
  document.getElementById('c-expiry').textContent   = v('f-expiry');
  document.getElementById('c-nationality').textContent = v('f-nationality').toUpperCase();
  document.getElementById('c-sex').textContent      = v('f-sex');
  document.getElementById('c-docnum').textContent   = v('f-docnum');
  // Place of birth peut être sur 2 lignes
  const pob = v('f-pob');
  document.getElementById('c-pob').innerHTML = pob.includes(',')
    ? pob.replace(',', ',<br>')
    : pob;
  // Signature texte fallback
  if (!sigDataUrl) {
    document.getElementById('sig-placeholder').textContent = v('f-sig-text');
  }

  // Back
  document.getElementById('b-height').textContent   = v('f-height');
  document.getElementById('b-dob').textContent      = v('f-dob');
  document.getElementById('b-pob').textContent      = v('f-pob');
  document.getElementById('b-vertnum').textContent  = v('f-idnum');
  document.getElementById('b-nation-label').textContent = v('f-nationality').toUpperCase();

  // MRZ
  document.getElementById('b-mrz1').textContent = v('f-mrz1');
  document.getElementById('b-mrz2').textContent = v('f-mrz2');
  document.getElementById('b-mrz3').textContent = v('f-mrz3');
}


/* ══════════════════════════════════
   PRINT
══════════════════════════════════ */
async function printCard() {

  toast('⏳ Preparing print...');

  const frontEl = document.getElementById('card-front');
  const backEl  = document.getElementById('card-back');

  try {

    // Capture FRONT
    const frontCanvas = await html2canvas(frontEl, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null
    });

    // Capture BACK
    const backCanvas = await html2canvas(backEl, {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: null
    });

    const frontImg = frontCanvas.toDataURL('image/png');
    const backImg  = backCanvas.toDataURL('image/png');

    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <html>
      <head>
        <title>Print ID Card</title>

        <style>

          *{
            box-sizing:border-box;
          }

          body{
            margin:0;
            padding:20mm;
            background:white;

            display:flex;
            flex-direction:column;
            align-items:center;
            gap:12mm;

            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .card-print{
            width:85.6mm;
            height:53.98mm;

            object-fit:cover;

            image-rendering:high-quality;
            page-break-inside:avoid;

            box-shadow:none;
            border:none;
          }

          @page{
            size:A4;
            margin:10mm;
          }

        </style>
      </head>

      <body>

        <img src="${frontImg}" class="card-print">
        <img src="${backImg}" class="card-print">

        <script>
          window.onload = () => {
            window.print();
          }
        <\/script>

      </body>
      </html>
    `);

    printWindow.document.close();

    toast('✅ Ready for printing', 'success');

  } catch(err) {

    console.error(err);

    toast('❌ Print failed', 'error');
  }
}
/* ══════════════════════════════════
   PHOTO
══════════════════════════════════ */
function triggerPhotoUpload() {
  document.getElementById('photo-input').click();
}
function loadPhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    photoDataUrl = e.target.result;
    // Mise à jour preview formulaire
    const wrap = document.getElementById('photo-preview-wrap');
    wrap.innerHTML = `<img src="${photoDataUrl}" alt="ID Photo" style="width:120px;height:150px;object-fit:cover;border-radius:6px;">`;
    // Mise à jour carte
    const cardPhoto = document.getElementById('card-photo');
    cardPhoto.innerHTML = `<img src="${photoDataUrl}" alt="ID Photo" style="width:100%;height:100%;object-fit:cover;object-position:center top;">`;
    toast('✅ Photo uploaded successfully', 'success');
  };
  reader.readAsDataURL(file);
}
function clearPhoto() {
  photoDataUrl = null;
  document.getElementById('photo-preview-wrap').innerHTML = `
    <div class="photo-placeholder">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
      <span>Upload photo</span>
    </div>`;
  document.getElementById('card-photo').innerHTML = `<div class="card-photo-placeholder" id="photo-placeholder">👤</div>`;
  document.getElementById('photo-input').value = '';
  toast('Photo removed', 'success');
}

/* ══════════════════════════════════
   SIGNATURE
══════════════════════════════════ */
function triggerSigUpload() {
  document.getElementById('sig-input').click();
}
function loadSignature(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    sigDataUrl = e.target.result;
    document.getElementById('sig-preview-wrap').innerHTML =
      `<img src="${sigDataUrl}" alt="Signature" style="max-width:100%;max-height:60px;object-fit:contain;">`;
    document.getElementById('card-signature').innerHTML =
      `<img src="${sigDataUrl}" alt="Signature" style="max-width:140px;max-height:50px;object-fit:contain;filter:contrast(1.1);">`;
    toast('✅ Signature uploaded', 'success');
  };
  reader.readAsDataURL(file);
}
function clearSignature() {
  sigDataUrl = null;
  document.getElementById('sig-preview-wrap').innerHTML =
    `<span style="font-size:.75rem;color:var(--text2)">+ Click to upload signature</span>`;
  document.getElementById('card-signature').innerHTML =
    `<div class="card-sig-placeholder" id="sig-placeholder">${v('f-sig-text') || 'Signature'}</div>`;
  document.getElementById('sig-input').value = '';
  toast('Signature removed', 'success');
}

/* ══════════════════════════════════
   RESET
══════════════════════════════════ */
function resetForm() {
  if (!confirm('Reset all fields to default values?')) return;
  document.getElementById('f-username').value  = ' Ngawang Thupten Jigme Gyatso ';
  document.getElementById('f-firstname').value = 'Ngawang';
  document.getElementById('f-middlename').value= 'Thupten';
  document.getElementById('f-lastname').value  = 'Jigme';
  document.getElementById('f-dob').value       = '15.11.1955';
  document.getElementById('f-sex').value       = 'M';
  document.getElementById('f-pob').value       = 'Gyantse-Samade, TIBET';
  document.getElementById('f-nationality').value = 'TIBET';
  document.getElementById('f-height').value    = '1.68 m';
  document.getElementById('f-idnum').value     = '1234 4567 8900 1100';
  document.getElementById('f-docnum').value    = 'AA1234567';
  document.getElementById('f-expiry').value    = '20.01.2028';
  document.getElementById('f-cardtitle').value = 'ID CARD TIBET';
  document.getElementById('f-mrz1').value      = 'IDTIBX4RTBPFW46<<<<<<<<<<<<<<<<<';
  document.getElementById('f-mrz2').value      = '<Ngawang<<<<<<<<<<<<Thupten <<<<<<<<';
  document.getElementById('f-mrz3').value      = 'Jigme<<<<<<<<<<<<<<<<<<<<<<<<<<';
  document.getElementById('f-sig-text').value  = 'Lhakpa T';
  clearPhoto();
  clearSignature();
  update();
  toast('♻ Form reset to defaults', 'success');
}

/* ══════════════════════════════════
   EXPORT
══════════════════════════════════ */
async function exportCard(side) {
  const el = document.getElementById(side === 'front' ? 'card-front' : 'card-back');
  toast(`⏳ Generating ${side} image…`);
  try {
    // Temporairement désactiver le zoom pour le rendu
    const wrapper = document.getElementById(side === 'front' ? 'card-front-wrapper' : 'card-back-wrapper');
    const prevTransform = wrapper.style.transform;
    wrapper.style.transform = 'scale(1)';

    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: null,
      useCORS: true,
      allowTaint: false,
      logging: false,
    });

    wrapper.style.transform = prevTransform;

    const link = document.createElement('a');
    const name = (v('f-lastname') || 'card').replace(/\s+/g,'_').toUpperCase();
    link.download = `TibetID_${side}_${name}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast(`✅ ${side.charAt(0).toUpperCase()+side.slice(1)} exported as PNG`, 'success');
  } catch(e) {
    console.error(e);
    toast('❌ Export failed — see console', 'error');
  }
}

async function exportBoth() {
  await exportCard('front');
  setTimeout(() => exportCard('back'), 800);
}

/* ══════════════════════════════════
   TOAST
══════════════════════════════════ */
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateY(6px)';
    t.style.transition = 'all .3s';
    setTimeout(() => t.remove(), 300);
  }, 2800);
}

/* ══════════════════════════════════
   INIT
══════════════════════════════════ */
window.addEventListener('DOMContentLoaded', () => {
  update();
  setTimeout(fitZoom, 100);
  window.addEventListener('resize', fitZoom);
});
