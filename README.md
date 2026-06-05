# XHAMU SHOP

Tienda online de camisetas con pedido online y pago por Bizum / transferencia.

---

## Estructura de archivos

```
xhamu-shop/
├── index.html      ← página principal
├── style.css       ← estilos
├── app.js          ← lógica (productos, carrito, checkout)
├── img/            ← pon aquí tus fotos de camisetas (opcional)
└── README.md
```

---

## Personalización antes de publicar

Abre `app.js` y edita el bloque `CONFIG` al principio del archivo:

```js
const CONFIG = {
  email_pedidos: "hola@xhamu.com",      // tu email donde llegarán los pedidos
  bizum_nombre: "Tu Nombre",             // nombre visible en el Bizum
  bizum_numero: "666 000 000",           // tu número de Bizum
  iban: "ES12 3456 7890 1234 5678 9012", // tu IBAN para transferencias
  envio_precio: 3.99,                    // coste del envío en €
  envio_gratis_desde: 60,               // pedidos >= X€ tienen envío gratis (0 = siempre cobrar)
};
```

---

## Añadir / editar productos

En `app.js`, edita el array `PRODUCTS`. Cada producto tiene estos campos:

| Campo        | Descripción                                                  |
|-------------|--------------------------------------------------------------|
| `id`         | Número único                                                 |
| `name`       | Nombre de la camiseta                                        |
| `category`   | `"basica"`, `"grafica"` o `"limitada"`                      |
| `cat_label`  | Texto del filtro ("Básica", "Gráfica", "Limitada")           |
| `price`      | Precio normal en €                                           |
| `sale_price` | Precio rebajado (elimina el campo si no hay oferta)          |
| `badge`      | `"new"`, `"limited"`, `"sale"` o `null`                     |
| `sizes`      | Array de tallas disponibles, ej: `["S","M","L","XL"]`       |
| `desc`       | Descripción corta del producto                               |
| `img`        | Ruta a la imagen, ej: `"./img/camiseta1.jpg"` (vacío = SVG placeholder) |
| `tee_fill`   | Color hex para el placeholder SVG                            |

---

## Añadir imágenes reales

1. Crea la carpeta `img/` dentro del proyecto
2. Mete tus fotos (recomendado: formato 3:4, mínimo 600×800px, JPG o WebP)
3. En el producto, pon `img: "./img/nombre-del-archivo.jpg"`

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

## Cómo funciona el flujo de pedidos

1. El cliente rellena sus datos y elige Bizum o transferencia
2. Al confirmar, ve un resumen con tu número de Bizum o IBAN y una **referencia única** (ej: `XHM-A3F7K2`)
3. En tu dispositivo se abre automáticamente el cliente de email con el resumen del pedido listo para enviar (sirve de aviso para ti)
4. El cliente hace el pago usando esa referencia como concepto
5. Tú confirmas el pago y procesas el pedido

> 💡 Para automatizar los emails de confirmación al cliente, puedes conectar después un servicio como [Formspree](https://formspree.io) o [EmailJS](https://www.emailjs.com) sin necesidad de servidor.

---

## Preguntas frecuentes

**¿Puedo añadir más categorías de filtro?**
Sí. En `app.js` añade el valor en el campo `category` del producto. En `index.html`, añade el botón correspondiente en `#filter-row`.

**¿Cómo pongo el envío gratis siempre?**
Pon `envio_precio: 0` en CONFIG.

**¿Y si quiero cobrar envío siempre, sin mínimo?**
Pon `envio_gratis_desde: 0`.

**¿Funciona en móvil?**
Sí, el diseño es 100% responsivo.
