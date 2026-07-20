# XHAMU SHOP

Página informativa de catálogo: tipos de camiseta, precios y cómo hacer un pedido (contacto directo con el vendedor, pago por PayPal o transferencia).

---

## Estructura de archivos

```
xhamu-shop/
├── index.html      ← página única (catálogo + info)
├── style.css       ← estilos
└── README.md
```

No hay carrito ni checkout: el cliente elige de la lista de precios y contacta directamente para cerrar el pedido.

---

## Editar precios o secciones

Todo el contenido vive en `index.html`. Cada tipo de prenda es una tarjeta `.price-card` dentro de `.price-grid`:

```html
<div class="price-card"><span class="price-name">⚽ Fans</span><span class="price-value">6 €</span></div>
```

Para añadir o cambiar un precio, edita o duplica esa línea. Las demás secciones (cómo comprar, tipos, tallas, cuidado, FAQ, envío) son listas simples de texto en el mismo archivo.

---

## Publicar en GitHub Pages (gratis)

1. Crea una cuenta en [github.com](https://github.com) si no tienes
2. Crea un repositorio nuevo, por ejemplo `xhamu-shop` (puede ser público)
3. Sube todos los archivos:
   ```bash
   git init
   git add .
   git commit -m "Lanzamiento tienda Xhamu"
   git branch -M main
   git remote add origin https://github.com/TU_USUARIO/xhamu-shop.git
   git push -u origin main
   ```
4. Ve a **Settings → Pages** del repo
5. En "Source", selecciona `Deploy from a branch` → rama `main` → carpeta `/root`
6. Guarda. En 1-2 minutos tu tienda estará en:
   `https://TU_USUARIO.github.io/xhamu-shop/`

### Dominio personalizado (opcional)
Si tienes un dominio propio (ej: `xhamu.com`):
- En GitHub Pages, escribe tu dominio en "Custom domain"
- En tu proveedor de dominio, crea un registro CNAME apuntando a `TU_USUARIO.github.io`

---

## Preguntas frecuentes

**¿Funciona en móvil?**
Sí, el diseño es 100% responsivo.
