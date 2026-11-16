function actualizarNombreUsuario() {
  const usuarioActivo = sessionStorage.getItem('bastian_sesion');
  
  if (usuarioActivo) {
    // Busca el enlace que lleva a ingresar.html dentro de la caja .usuario
    const enlaceUsuario = document.querySelector('.usuario a');
    
    if (enlaceUsuario) {
      enlaceUsuario.textContent = '👤 ' + usuarioActivo;
      enlaceUsuario.style.color = 'white';
      enlaceUsuario.style.textDecoration = 'none';
    }
  }
}

// Se ejecuta tanto al terminar de cargar como de inmediato por si ya cargó
document.addEventListener('DOMContentLoaded', actualizarNombreUsuario);
actualizarNombreUsuario();

