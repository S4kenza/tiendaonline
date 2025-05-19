async function cargarDetalleProducto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    document.getElementById('detalleProducto').innerHTML = '<p class="text-red-500">Producto no encontrado.</p>';
    return;
  }

  try {
    const respuesta = await fetch(`https://fakestoreapi.com/products/${id}`);
    if (!respuesta.ok) throw new Error("Error en la respuesta");

    const producto = await respuesta.json();

    document.getElementById('detalleProducto').innerHTML = `
      <img src="${producto.image}" alt="${producto.title}" class="w-full md:w-1/2 rounded-md object-contain max-h-96" />
      <div class="flex-1">
        <h2 class="text-2xl font-semibold mb-2">${producto.title}</h2>
        <p class="text-gray-600 mb-4">${producto.category}</p>
        <p class="text-gray-700 mb-4">${producto.description}</p>
        <p class="text-lg font-bold text-green-600">$${producto.price}</p>
      </div>
    `;
  } catch (error) {
    console.error("Error al cargar detalle:", error);
    document.getElementById('detalleProducto').innerHTML = '<p class="text-red-500">No se pudo cargar el producto.</p>';
  }
}

document.addEventListener("DOMContentLoaded", cargarDetalleProducto);