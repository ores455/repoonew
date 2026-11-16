// ---------- Utilidades ----------
const $ = id => document.getElementById(id);
const show = (el, visible) => el.classList.toggle('hidden', !visible);
const DB_KEY = 'bastian_usuarios';
const SESSION_KEY = 'bastian_sesion';
const enc = new TextEncoder();

let users = JSON.parse(localStorage.getItem(DB_KEY) || '[]');

function saveUsers() {
  localStorage.setItem(DB_KEY, JSON.stringify(users));
}

function findUser(name) {
  const n = name.trim().toLowerCase();
  return users.find(u => u.user.toLowerCase() === n) || null;
}

function randomSalt() {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ---------- Hash SHA-256 (con respaldo si crypto.subtle no está disponible) ----------
const SHA_K = [
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
];

function sha256Js(str) {
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));
  const bytes = enc.encode(str);
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 4, bitLen >>> 0);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));

  let H = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
  const W = new Array(64);

  for (let off = 0; off < padded.length; off += 64) {
    for (let i = 0; i < 16; i++) W[i] = dv.getUint32(off + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(W[i-15], 7) ^ rotr(W[i-15], 18) ^ (W[i-15] >>> 3);
      const s1 = rotr(W[i-2], 17) ^ rotr(W[i-2], 19) ^ (W[i-2] >>> 10);
      W[i] = (W[i-16] + s0 + W[i-7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA_K[i] + W[i]) | 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + t1) | 0;
      d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    H = [a, b, c, d, e, f, g, h].map((v, i) => (H[i] + v) | 0);
  }
  return H.map(v => (v >>> 0).toString(16).padStart(8, '0')).join('');
}

async function hash(text, salt) {
  const data = salt + text;
  if (window.crypto && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', enc.encode(data));
    return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Js(data);
}

// ---------- Mensajes ----------
function msg(text, ok = false) {
  const el = $('msg');
  el.textContent = text;
  el.className = 'msg ' + (ok ? 'ok' : 'error');
}

function clearMsg() {
  $('msg').textContent = '';
  $('msg').className = 'msg';
}

// ---------- Pestañas ----------
const forms = { login: $('formLogin'), register: $('formRegister'), recover: $('formRecover') };

function showTab(tab) {
  for (const [name, form] of Object.entries(forms)) show(form, name === tab);
  document.querySelectorAll('.tabs button').forEach(b =>
    b.classList.toggle('active', b.dataset.tab === tab)
  );
  clearMsg();
}

document.querySelectorAll('[data-tab]').forEach(btn =>
  btn.addEventListener('click', () => showTab(btn.dataset.tab))
);

// ---------- Registro ----------
$('formRegister').addEventListener('submit', async e => {
  e.preventDefault();
  clearMsg();

  const user = $('regUser').value.trim();
  const pass = $('regPass').value;
  const pass2 = $('regPass2').value;
  const question = $('regQuestion').value;
  const answer = $('regAnswer').value.trim().toLowerCase();
  const role = $('regRole').value;

  if (!user || !pass || !pass2 || !answer)
    return msg('Completá todos los campos obligatorios *');
  if (pass.length < 4)
    return msg('La contraseña debe tener mínimo 4 caracteres');
  if (pass !== pass2)
    return msg('Las contraseñas no coinciden');
  if (!$('regConfirm').checked)
    return msg('Tenés que tildar la confirmación para registrarte');
  if (findUser(user))
    return msg('Ese usuario ya existe, elegí otro');

  const salt = randomSalt();
  users.push({
    user,
    salt,
    pass: await hash(pass, salt),
    question,
    answer: await hash(answer, salt),
    role,
    created: new Date().toLocaleString('es-AR'),
  });
  saveUsers();

  $('formRegister').reset();
  msg('¡Cuenta creada! Ahora podés iniciar sesión.', true);
  setTimeout(() => {
    showTab('login');
    $('loginUser').value = user;
  }, 800);
});

// ---------- Login ----------
$('formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  clearMsg();

  const user = $('loginUser').value.trim();
  const pass = $('loginPass').value;
  if (!user || !pass) return msg('Ingresá usuario y contraseña');

  const found = findUser(user);
  if (!found || (await hash(pass, found.salt)) !== found.pass)
    return msg('Usuario o contraseña incorrectos');

  localStorage.setItem(SESSION_KEY, found.user);
  $('loginPass').value = '';
  showPanel(found);
});

// ---------- Recuperar contraseña (2 pasos) ----------
let recoverUser = null;

function resetRecover() {
  recoverUser = null;
  $('formRecover').reset();
  $('recUser').disabled = false;
  show($('recoverStep2'), false);
  show($('btnFind'), true);
}

$('formRecover').addEventListener('submit', async e => {
  e.preventDefault();
  clearMsg();

  // Paso 1: buscar la pregunta
  if (!recoverUser) {
    const found = findUser($('recUser').value);
    if (!found) return msg('No existe ese usuario');

    recoverUser = found;
    $('recQuestionText').textContent = found.question;
    $('recUser').disabled = true;
    show($('btnFind'), false);
    show($('recoverStep2'), true);
    return;
  }

  // Paso 2: validar respuesta y cambiar contraseña
  const answer = $('recAnswer').value.trim().toLowerCase();
  const np = $('recNewPass').value;
  const np2 = $('recNewPass2').value;

  if ((await hash(answer, recoverUser.salt)) !== recoverUser.answer)
    return msg('Respuesta incorrecta');
  if (np.length < 4)
    return msg('La nueva contraseña debe tener mínimo 4 caracteres');
  if (np !== np2)
    return msg('La confirmación no coincide');

  recoverUser.pass = await hash(np, recoverUser.salt);
  saveUsers();

  const username = recoverUser.user;
  resetRecover();
  msg('¡Contraseña cambiada! Ya podés entrar.', true);
  setTimeout(() => {
    showTab('login');
    $('loginUser').value = username;
  }, 800);
});

// ---------- Panel ----------
function infoRow(label, value) {
  const p = document.createElement('div');
  const b = document.createElement('b');
  b.textContent = label + ': ';
  p.append(b, document.createTextNode(value));
  return p;
}

function renderUserList() {
  const list = $('userList');
  list.replaceChildren();

  for (const x of users) {
    const item = document.createElement('div');
    item.className = 'user-item';

    const name = document.createElement('span');
    name.textContent = x.user;
    name.style.fontWeight = '700';

    const role = document.createElement('small');
    role.textContent = ` (${x.role === 'admin' ? 'administrador' : 'usuario'})`;
    name.append(role);

    const date = document.createElement('small');
    date.textContent = x.created;

    item.append(name, date);
    list.append(item);
  }
}

function showPanel(u) {
  show($('authCard'), false);
  show($('panelCard'), true);

  $('panelUser').textContent = u.user;

  const isAdmin = u.role === 'admin';
  const badge = $('panelBadge');
  badge.textContent = isAdmin ? 'ADMINISTRADOR' : 'USUARIO';
  badge.className = 'badge ' + (isAdmin ? 'badge-admin' : 'badge-user');

  $('panelInfo').replaceChildren(
    infoRow('Usuario', u.user),
    infoRow('Rol', isAdmin ? 'Administrador' : 'Usuario normal'),
    infoRow('Pregunta de seguridad', u.question),
    infoRow('Creado', u.created)
  );

  show($('adminSection'), isAdmin);
  show($('userSection'), !isAdmin);
  if (isAdmin) renderUserList();
}

$('btnDeleteAll').addEventListener('click', () => {
  const me = findUser(localStorage.getItem(SESSION_KEY) || '');
  if (!me || me.role !== 'admin') return;
  if (!confirm('¿Seguro que querés borrar todos los demás usuarios?')) return;

  users = users.filter(u => u.user === me.user);
  saveUsers();
  renderUserList();
  alert('Usuarios borrados, solo quedaste vos.');
});

$('btnLogout').addEventListener('click', () => {
  localStorage.removeItem(SESSION_KEY);
  show($('panelCard'), false);
  show($('authCard'), true);
  showTab('login');
});

// ---------- Inicio: mantener sesión si existe ----------
const savedSession = findUser(localStorage.getItem(SESSION_KEY) || '');
if (savedSession) showPanel(savedSession);

// ---------- Errores visibles en pantalla ----------
window.addEventListener('error', e => msg('Error: ' + e.message));
window.addEventListener('unhandledrejection', e =>
  msg('Error: ' + (e.reason?.message || e.reason))
);