// ===== CARRITO =====
const CARRITO_KEY = 'zone_phone_carrito';

function getCarrito() {
  return JSON.parse(localStorage.getItem(CARRITO_KEY) || '[]');
}
function saveCarrito(items) {
  localStorage.setItem(CARRITO_KEY, JSON.stringify(items));
}

function tieneSesion() {
  return sessionStorage.getItem('bastian_sesion') !== null;
}

function avisarSesion() {
  alert('⚠️ Iniciá sesión para usar el carrito.');
  window.location.href = 'ingresar.html';
}

function agregarAlCarrito(nombre, precio) {
  if (!tieneSesion()) return avisarSesion();

  const items = getCarrito();
  const existe = items.find(i => i.nombre === nombre && i.precio === precio);
  if (existe) {
    existe.cantidad++;
  } else {
    items.push({ nombre, precio, cantidad: 1 });
  }
  saveCarrito(items);
}

function quitarDelCarrito(index) {
  if (!tieneSesion()) return avisarSesion();
  const items = getCarrito();
  items.splice(index, 1);
  saveCarrito(items);
  renderCarrito();
}

function cambiarCantidad(index, delta) {
  if (!tieneSesion()) return avisarSesion();
  const items = getCarrito();
  items[index].cantidad += delta;
  if (items[index].cantidad <= 0) items.splice(index, 1);
  saveCarrito(items);
  renderCarrito();
}

function pagar() {
  if (!tieneSesion()) return avisarSesion();
  const items = getCarrito();
  if (items.length === 0) return alert('Tu carrito está vacío');
  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  alert(`¡Gracias por tu compra!\nTotal: $${total.toLocaleString('es-AR')}\n\n(Implementá el pago real acá)`);
  saveCarrito([]);
  renderCarrito();
}

function renderCarrito() {
  const items = getCarrito();
  const cont = document.getElementById('itemsCarrito');
  const totalEl = document.getElementById('totalCarrito');

  if (!tieneSesion()) {
    cont.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px 0;font-size:16px">Iniciá sesión para ver tu carrito 🛒</p>';
    totalEl.textContent = 'Total: $0';
    return;
  }

  if (items.length === 0) {
    cont.innerHTML = '<p style="text-align:center;color:#9ca3af;padding:40px 0;font-size:16px">Tu carrito está vacío 🛒</p>';
  } else {
    cont.innerHTML = items.map((item, i) => `
      <div class="item-carrito">
        <div class="info">
          <b>${item.nombre}</b>
          <small>$${item.precio.toLocaleString('es-AR')} c/u</small>
        </div>
        <div class="cantidad">
          <button onclick="cambiarCantidad(${i}, -1)">−</button>
          <span>${item.cantidad}</span>
          <button onclick="cambiarCantidad(${i}, 1)">+</button>
        </div>
        <div class="subtotal">$${(item.precio * item.cantidad).toLocaleString('es-AR')}</div>
        <button class="quitar" onclick="quitarDelCarrito(${i})">✕</button>
      </div>
    `).join('');
  }

  const total = items.reduce((s, i) => s + i.precio * i.cantidad, 0);
  totalEl.textContent = 'Total: $' + total.toLocaleString('es-AR');
}

// ===== INICIALIZAR =====
document.addEventListener('DOMContentLoaded', () => {

  document.querySelectorAll('.boton').forEach(b => {
    b.addEventListener('click', () => {
      const producto = b.closest('.producto');
      if (!producto) return;

      const nombre = producto.querySelector('h3').textContent.trim();
      const precioTexto = producto.querySelector('.precio').textContent.trim();
      const precio = parseInt(precioTexto.replace(/[^0-9]/g, ''));

      agregarAlCarrito(nombre, precio);

      b.textContent = '✓ Agregado';
      setTimeout(() => b.textContent = 'Agregar al carrito', 1200);
    });
  });

  const lista = document.getElementById('itemsCarrito');
  if (lista) {
    renderCarrito();
  }
});   