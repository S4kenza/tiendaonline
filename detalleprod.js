async function cargarDetalleProducto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('detalleProducto').innerHTML = '<p class="text-red-500">Producto no encontrado.</p>';
    return;
  }

  try {
    const respuesta = await fetch(`http://127.0.0.1:8000/api/productos/${id}`);
    if (!respuesta.ok) throw new Error("Error en la respuesta");

    const producto = await respuesta.json();
    let nombresCategorias = '';
    if (Array.isArray(producto.categorias)) {
      nombresCategorias = producto.categorias.map(cat => cat.nombre).join(', ');
    } else if (producto.categorias && producto.categorias.nombre) {
      nombresCategorias = producto.categorias.nombre;
    } else {
      nombresCategorias = 'Sin categoría';
    }

    document.getElementById('detalleProducto').innerHTML = `
      <img src="${producto.imagen}" alt="${producto.titulo}" class="w-full md:w-1/2 rounded-md object-contain max-h-96" />
      <div class="flex-1">
        <h2 class="text-2xl font-semibold mb-2">${producto.titulo}</h2>
        <p class="text-gray-600 mb-4">${nombresCategorias}</p>
        <p class="text-gray-700 mb-4">${producto.descripcion}</p>
        <p class="text-lg font-bold text-green-600">$${producto.precio}</p>
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar detalle:", error);
    document.getElementById('detalleProducto').innerHTML = '<p class="text-red-500">No se pudo cargar el producto.</p>';
  }
}

document.addEventListener("DOMContentLoaded", cargarDetalleProducto);