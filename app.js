const contenedorProductos = document.getElementById("productos");
const contenedorCategorias = document.getElementById("categorias");
const inputBuscar = document.getElementById("busqueda");

let productos = [];
let categoriaSeleccionada = "all";
let categoriaMap = {};
// Cargar productos desde la API
async function cargarProductos() {
    try {
        mostrarMensajeCargando();
        const respuesta = await fetch("http://127.0.0.1:8000/api/productos");
        if (!respuesta.ok) {
            throw new Error("Error en la respuesta de la API");
        }
        productos = await respuesta.json();
        if (productos.length === 0) {
            mostrarMensajeError("No se encontraron productos en la API");
        } else {
            mostrarProductos(productos);
        }
    } catch (error) {
        console.error("Error al cargar los productos: ", error);
        mostrarMensajeError();
    }
}

// Filtrar productos por búsqueda y categoría
function filtrarProductos() {
    let filtrados = productos;
    const textoBusqueda = inputBuscar.value.toLowerCase();
    if (textoBusqueda.trim() !== "") {
        filtrados = filtrados.filter((p) =>
            p.title.toLowerCase().includes(textoBusqueda) ||
            p.description.toLowerCase().includes(textoBusqueda)
        );
    }
    if (categoriaSeleccionada !== "all") {
        const categoriaId = categoriaMap[categoriaSeleccionada];
        filtrados = filtrados.filter((p) => {
            // Si el producto tiene un array de categorias relacionadas
            if (Array.isArray(p.categorias)) {
                // Asegurarse de que los IDs sean numéricos para la comparación
                return p.categorias.some(cat => Number(cat.id) === Number(categoriaId));
            }
            return false;
        });
    }
    mostrarProductos(filtrados);
}

// Cargar categorías desde la API
async function cargarCategorias() {
    try {
        const respuesta = await fetch("http://127.0.0.1:8000/api/categoria");
        if (!respuesta.ok) {
            throw new Error("Error en la respuesta de la API");
        }
        const categorias = await respuesta.json();
        // Crear el mapa slug -> id
        categoriaMap = {};
        categorias.forEach(cat => {
            categoriaMap[cat.slug] = cat.id;
        });
        mostrarCategorias([{ slug: "all", nombre: "Todas" }, ...categorias]);
    } catch (error) {
        console.error("Error al cargar las categorias: ", error);
    }
}

// Mostrar productos en el contenedor
function mostrarProductos(productosAMostrar) {
    contenedorProductos.innerHTML = "";
    if (productosAMostrar.length === 0) {
        contenedorProductos.innerHTML =
            "<p class='text-2xl font-bold text-center text-gray-800 col-span-full m-4'>No se encontraron productos.</p>";
    } else {
        productosAMostrar.forEach((producto) => {
            const productoDiv = document.createElement("div");
            productoDiv.className =
                "bg-white rounded-lg shadow-md p-4 flex flex-col items-center hover:shadow-lg transition-shadow duration-300";
            productoDiv.innerHTML = `
                <img src="${producto.imagen}" alt="${producto.titulo}" class="w-32 h-32 object-contain m-4">
                <h2 class="text-lg font-bold mb-2">${producto.titulo}</h2>
                <p class="text-gray-700 mb-2">$${producto.precio}</p>
                ${localStorage.getItem('rol') !== 'admin' ? `<button class=\"bg-green-400 text-white px-4 py-2 rounded hover:bg-green-450 transition-colors duration-300 btn-agregar-carrito\" data-producto='${JSON.stringify({id: producto.id, titulo: producto.titulo, precio: Number(producto.precio), imagen: producto.imagen})}'>Agregar al carrito</button>` : ''}
                <a href="detalle.html?id=${producto.id}" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-300 transition-colors duration-300 mt-2 block text-center">Detalles</a>
                ${localStorage.getItem('rol') === 'admin' ? `
                    <button onclick=\"window.location.href='crud.html?edit=${producto.id}'\" class=\"bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 transition-colors duration-300 mt-2\">Actualizar</button>
                    <button onclick=\"eliminarProducto('${producto.id}', '${producto.imagen}')\" class=\"bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors duration-300 mt-2\">Eliminar</button>
                ` : ''}
            `;
            contenedorProductos.appendChild(productoDiv);
        });
    }
    // Asignar eventos a los botones de agregar al carrito después de renderizar
    document.querySelectorAll('.btn-agregar-carrito').forEach(btn => {
        btn.onclick = function() {
            const prod = JSON.parse(this.dataset.producto);
            if (typeof prod.precio === 'string') prod.precio = Number(prod.precio);
            let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
            const idx = carrito.findIndex(p => p.id === prod.id);
            if (idx !== -1) {
                carrito[idx].cantidad += 1;
            } else {
                carrito.push({ ...prod, cantidad: 1 });
            }
            localStorage.setItem('carrito', JSON.stringify(carrito));
            if (typeof actualizarCarritoUI === 'function') actualizarCarritoUI();
        };
    });
}

// Mostrar botones de categorías
function mostrarCategorias(categorias) {
    contenedorCategorias.innerHTML = "";
    categorias.forEach((categoria) => {
        const categoriaButton = document.createElement("button");
        categoriaButton.className = `
            px-8 py-2 rounded-full ${categoriaSeleccionada === categoria.slug ? "bg-green-800 text-white" : "bg-gray-200 text-gray-800"} 
            font-bold hover:bg-green-800 hover:text-white transition-colors duration-300`;
        categoriaButton.textContent = categoria.nombre;
        categoriaButton.addEventListener("click", () => {
            categoriaSeleccionada = categoria.slug;
            mostrarCategorias(categorias);
            filtrarProductos();
        });
        contenedorCategorias.appendChild(categoriaButton);
    });
}

// Mensaje de carga
function mostrarMensajeCargando() {
    contenedorProductos.innerHTML =
        "<p class='text-2xl font-bold text-center text-gray-800 col-span-full m-4'>Cargando productos...</p>";
}

// Mensaje de error
function mostrarMensajeError(mensaje = "Error al cargar los productos. Por favor, inténtalo de nuevo más tarde.") {
    contenedorProductos.innerHTML =
        `<p class='text-2xl font-bold text-center text-gray-800 col-span-full m-4'>${mensaje}</p>`;
}

// Eliminar producto de la base de datos y de Firebase Storage
async function eliminarProducto(id, imagenUrl) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;
    try {
        // Eliminar de la base de datos
        const res = await fetch(`http://127.0.0.1:8000/api/productos/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': 'Bearer ' + localStorage.getItem('authToken')
            }
        });
        if (res.ok) {
            // Eliminar de Firebase Storage
            if (imagenUrl) {
                try {
                    const storageRef = firebase.storage().refFromURL(imagenUrl);
                    await storageRef.delete();
                } catch (e) {
                    // Si falla la eliminación de la imagen, solo muestra un warning
                    alert('Producto eliminado, pero no se pudo borrar la imagen de Firebase.');
                }
            }
            alert('Producto eliminado correctamente.');
            window.location.reload();
        } else {
            alert('Error al eliminar el producto de la base de datos.');
        }
    } catch (err) {
        alert('Error al eliminar el producto.');
    }
}

// Eventos
inputBuscar.addEventListener("input", filtrarProductos);

document.addEventListener("DOMContentLoaded", () => {
    cargarCategorias();
    cargarProductos();
});