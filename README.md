<p align="center">
  <img src="og-image.jpg" alt="XHAMU.SHOP, camisetas de fútbol" width="720" />
</p>

<h1 align="center">XHAMU.SHOP</h1>

<p align="center">
  Lista de precios y calculadora de pedidos de camisetas de fútbol.<br />
  <a href="https://xhamu.github.io/xhamu.shop/"><strong>xhamu.github.io/xhamu.shop</strong></a>
</p>

---

## Qué es

Una página pensada para el móvil donde los clientes consultan los precios y calculan cuánto les sale su pedido antes de hacerlo. No hay carrito ni pagos: el pedido se cierra hablando directamente con la tienda.

- **Precios claros** de camisetas Fan, Player y Retro, manga larga, NBA, pantalones y conjuntos infantiles.
- **Calculadora integrada:** se toca **+** en cada prenda y el total aparece abajo, con envío y arancel incluidos.
- **Personalización por unidad:** nombre y número, y hasta 4 parches.
- **El pedido se recuerda** al volver a abrir la página en el mismo móvil.
- **Lista para compartir:** vista previa con imagen y precios en WhatsApp, Telegram y redes, y datos estructurados para buscadores.

## Tecnología

HTML, CSS y JavaScript sin dependencias ni paso de compilación. Tipografías Barlow y Barlow Condensed de Google Fonts. Publicada con GitHub Pages desde la rama `main`.

```
index.html     página única: precios, información y metadatos
style.css      estilos
script.js      calculadora y pestañas
og-image.jpg   imagen de la vista previa al compartir
```

Para verla en local basta con abrir `index.html` en el navegador.

## Cambiar precios

Cada prenda es una línea en `index.html`:

```html
<li class="product" data-calc-id="fan" data-price="15">
  <span class="product-name">Fan version</span><span class="price">15<small>€</small></span>
</li>
```

`data-price` es el precio que usa la calculadora y `data-calc-id` un identificador único. Sin esos dos atributos la línea se muestra, pero sin botón **+**.

Al cambiar un precio, actualízalo también en:

- el bloque `application/ld+json` del `<head>`, que leen los buscadores;
- los textos `og:` y `twitter:` y la imagen `og-image.jpg`, si es Fan, Retro o Player.

Los extras, el envío y el arancel se calculan en `script.js` (`PERSONALIZE_PRICE`, `PARCHE_PRICE`, `CUSTOMS_FEE` y `shippingFor`).
