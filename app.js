/* =============================================
   XHAMU SHOP — app.js
   ============================================= */

// ── CONFIGURACIÓN ────────────────────────────────────────────────────
// Edita estos datos con los tuyos antes de publicar
const CONFIG = {
  email_pedidos: "hola@xhamu.com",      // tu email donde recibirás avisos (info)
  bizum_nombre: "Tu Nombre",             // nombre que verá el cliente
  bizum_numero: "666 000 000",           // tu número de Bizum
  iban: "ES12 3456 7890 1234 5678 9012", // tu IBAN para transferencias
  envio_precio: 3.99,                    // precio de envío (0 = gratis)
  envio_gratis_desde: 60,               // envío gratis a partir de X€ (0 = siempre cobrar)
  whatsapp: "",                          // opcional: "34666000000" para botón WA en confirmación
};

// ── PRODUCTOS ────────────────────────────────────────────────────────
// Para añadir una imagen real, pon la ruta en `img`: "./img/camiseta1.jpg"
// Si no hay imagen, se muestra el placeholder SVG con el color indicado
const PRODUCTS = [
  {
    id: 1,
    name: "Essential Tee",
    category: "basica",
    cat_label: "Básica",
    price: 29,
    color: "#e8e4dc",
    tee_fill: "#1a1a1a",
    badge: "new",
    sizes: ["XS","S","M","L","XL"],
    desc: "La base de todo buen armario. Algodón 100% peso medio, corte recto con caída perfecta. Disponible en tallas XS a XL.",
    img: "",
  },
  {
    id: 2,
    name: "Shadow Box",
    category: "grafica",
    cat_label: "Gráfica",
    price: 35,
    color: "#1c1c1c",
    tee_fill: "#1c1c1c",
    badge: null,
    sizes: ["S","M","L","XL","XXL"],
    desc: "Gráfico minimalista serigrafíado a mano. Tinta blanca sobre negro. Cada unidad tiene pequeñas variaciones que la hacen única.",
    img: "",
  },
  {
    id: 3,
    name: "Washed Olive",
    category: "basica",
    cat_label: "Básica",
    price: 32,
    color: "#2d3a2e",
    tee_fill: "#2d3a2e",
    badge: null,
    sizes: ["XS","S","M","L"],
    desc: "Verde oliva lavado con efecto vintage. Algodón orgánico 180g. Cuello redondo reforzado y bajo rebajado.",
    img: "",
  },
  {
    id: 4,
    name: "Grid Line",
    category: "grafica",
    cat_label: "Gráfica",
    price: 29,
    color: "#c9d4d1",
    tee_fill: "#3b2d4a",
    badge: "new",
    sizes: ["S","M","L","XL"],
    desc: "Diseño geométrico en tono menta. Impresión DTF de alta definición, resistente a lavados. Unisex.",
    img: "",
  },
  {
    id: 5,
    name: "Sand Wash",
    category: "basica",
    cat_label: "Básica",
    price: 27,
    sale_price: 22,
    color: "#d4ccb8",
    tee_fill: "#9a8a72",
    badge: "sale",
    sizes: ["S","M","L"],
    desc: "Tono arena cálido con acabado suave. Últimas unidades disponibles en tallas S, M y L.",
    img: "",
  },
  {
    id: 6,
    name: "Noche",
    category: "limitada",
    cat_label: "Limitada",
    price: 38,
    color: "#3b2d4a",
    tee_fill: "#3b2d4a",
    badge: "limited",
    sizes: ["S","M","L","XL"],
    desc: "Edición limitada de 30 unidades. Púrpura oscuro con bordado en el pecho. Numeradas a mano.",
    img: "",
  },
  {
    id: 7,
    name: "Clay Tone",
    category: "basica",
    cat_label: "Básica",
    price: 30,
    color: "#e4d4c2",
    tee_fill: "#4a3228",
    badge: null,
    sizes: ["XS","S","M","L","XL","XXL"],
    desc: "Arcilla terrosa, neutra y versátil. Algodón peinado, corte slim sin resultar ajustado. Talla ampliada hasta XXL.",
    img: "",
  },
  {
    id: 8,
    name: "Dusk Fit",
    category: "limitada",
    cat_label: "Limitada",
    price: 35,
    sale_price: 28,
    color: "#4a3228",
    tee_fill: "#4a3228",
    badge: "sale",
    sizes: ["S","M","L"],
    desc: "Corte slim ligeramente crop, perfecto para capas. Edición limitada en oferta, últimas tallas.",
    img: "",
  },
];

// ── STATE ─────────────────────────────────────────────────────────────
let cart = [];
let currentProduct = null;
let currentQty = 1;
let currentSize = null;
let currentFilter = "all";

// ── HELPERS ───────────────────────────────────────────────────────────
function fmt(n) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function teeSVG(fill, size = "100%") {
  const isDark = fill === "#1c1c1c" || fill === "#2d3a2e" || fill === "#3b2d4a" || fill === "#4a3228";
  const detail = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";
  const text_col = isDark ? "#c8b89a" : "#9a8a72";
  return `<svg width="${size}" viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M40 60 L10 110 L40 120 L40 210 L160 210 L160 120 L190 110 L160 60 L130 40 Q100 56 70 40 Z" fill="${fill}"/>
    <path d="M70 40 Q100 56 130 40 L130 70 Q100 86 70 70 Z" fill="${detail}"/>
    <text x="100" y="150" text-anchor="middle" fill="${text_col}" font-family="DM Serif Display, serif" font-size="18" font-style="italic">xhamu</text>
  </svg>`;
}

function badgeHTML(badge) {
  if (!badge) return "";
  const map = { new: ["badge-new", "Nuevo"], limited: ["badge-limited", "Limitada"], sale: ["badge-sale", "Oferta"] };
  const [cls, label] = map[badge] || [];
  return cls ? `<span class="badge ${cls}">${label}</span>` : "";
}

// ── RENDER GRID ────────────────────────────────────────────────────────
function renderGrid(filter) {
  const grid = document.getElementById("product-grid");
  const filtered = filter === "all" ? PRODUCTS : PRODUCTS.filter(p => p.category === filter);
  if (filtered.length === 0) {
    grid.innerHTML = `<p style="color:var(--ink-mute);font-size:14px;grid-column:1/-1;">No hay productos en esta categoría.</p>`;
    return;
  }
  grid.innerHTML = filtered.map((p, i) => {
    const imgContent = p.img
      ? `<img src="${p.img}" alt="${p.name}" loading="lazy" />`
      : teeSVG(p.tee_fill, "55%");
    const priceHTML = p.sale_price
      ? `<span class="orig">${fmt(p.price)}</span><span class="sale-p">${fmt(p.sale_price)}</span>`
      : fmt(p.price);
    return `<div class="product-card" style="animation-delay:${i * 0.06}s" data-id="${p.id}" tabindex="0" role="button" aria-label="Ver ${p.name}">
      <div class="product-img-wrap">
        ${imgContent}
        ${badgeHTML(p.badge)}
      </div>
      <div class="product-meta">
        <p class="product-cat">${p.cat_label}</p>
        <p class="product-name">${p.name}</p>
        <p class="product-price">${priceHTML}</p>
      </div>
    </div>`;
  }).join("");

  grid.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => openProductModal(parseInt(card.dataset.id)));
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") openProductModal(parseInt(card.dataset.id)); });
  });
}

// ── FILTERS ───────────────────────────────────────────────────────────
document.getElementById("filter-row").addEventListener("click", e => {
  const btn = e.target.closest(".filter-btn");
  if (!btn) return;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  currentFilter = btn.dataset.filter;
  renderGrid(currentFilter);
});

// ── PRODUCT MODAL ─────────────────────────────────────────────────────
function openProductModal(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  currentProduct = p;
  currentQty = 1;
  currentSize = null;

  document.getElementById("modal-category").textContent = p.cat_label;
  document.getElementById("modal-name").textContent = p.name;
  document.getElementById("modal-desc").textContent = p.desc;

  const priceEl = document.getElementById("modal-price");
  priceEl.innerHTML = p.sale_price
    ? `<span style="text-decoration:line-through;margin-right:8px;color:var(--ink-mute)">${fmt(p.price)}</span><span style="color:#7a5c20;font-weight:500">${fmt(p.sale_price)}</span>`
    : fmt(p.price);

  const imgEl = document.getElementById("modal-img");
  imgEl.innerHTML = p.img
    ? `<img src="${p.img}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;border-radius:10px;" />`
    : teeSVG(p.tee_fill, "60%");

  const sizesEl = document.getElementById("modal-sizes");
  sizesEl.innerHTML = p.sizes.map(s =>
    `<button class="size-btn" data-size="${s}">${s}</button>`
  ).join("");
  sizesEl.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      sizesEl.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSize = btn.dataset.size;
    });
  });

  document.getElementById("qty-val").textContent = "1";
  document.getElementById("product-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

document.getElementById("modal-close").addEventListener("click", closeProductModal);
document.getElementById("product-overlay").addEventListener("click", e => {
  if (e.target === document.getElementById("product-overlay")) closeProductModal();
});
function closeProductModal() {
  document.getElementById("product-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

// Qty controls
document.getElementById("qty-minus").addEventListener("click", () => {
  currentQty = Math.max(1, currentQty - 1);
  document.getElementById("qty-val").textContent = currentQty;
});
document.getElementById("qty-plus").addEventListener("click", () => {
  currentQty = Math.min(10, currentQty + 1);
  document.getElementById("qty-val").textContent = currentQty;
});

// Add to cart
document.getElementById("modal-add").addEventListener("click", () => {
  if (!currentSize) {
    const sizesEl = document.getElementById("modal-sizes");
    sizesEl.style.outline = "2px solid #c0392b";
    sizesEl.style.borderRadius = "4px";
    setTimeout(() => { sizesEl.style.outline = ""; }, 1200);
    sizesEl.insertAdjacentHTML("afterend",
      `<p id="size-err" style="color:#c0392b;font-size:12px;margin-top:4px;">Selecciona una talla</p>`
    );
    setTimeout(() => { document.getElementById("size-err")?.remove(); }, 1500);
    return;
  }
  addToCart(currentProduct, currentSize, currentQty);
  closeProductModal();
  openCart();
});

// ── CART ──────────────────────────────────────────────────────────────
function addToCart(product, size, qty) {
  const existing = cart.find(i => i.id === product.id && i.size === size);
  if (existing) {
    existing.qty = Math.min(existing.qty + qty, 10);
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      size,
      qty,
      price: product.sale_price || product.price,
      tee_fill: product.tee_fill,
    });
  }
  updateCartUI();
}

function removeFromCart(id, size) {
  cart = cart.filter(i => !(i.id === id && i.size === size));
  updateCartUI();
}

function cartTotal() {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const envio = CONFIG.envio_gratis_desde > 0 && subtotal >= CONFIG.envio_gratis_desde
    ? 0
    : (subtotal > 0 ? CONFIG.envio_precio : 0);
  return { subtotal, envio, total: subtotal + envio };
}

function updateCartUI() {
  const total_items = cart.reduce((s, i) => s + i.qty, 0);
  const badge = document.getElementById("cart-badge");
  badge.textContent = total_items;
  badge.classList.remove("pop");
  void badge.offsetWidth;
  badge.classList.add("pop");

  const { subtotal, envio, total } = cartTotal();
  document.getElementById("cart-total-val").textContent = fmt(total);

  const list = document.getElementById("cart-items");
  if (cart.length === 0) {
    list.innerHTML = `<p class="cart-empty">Tu carrito está vacío</p>`;
    document.getElementById("cart-foot").style.display = "none";
    return;
  }

  document.getElementById("cart-foot").style.display = "block";
  list.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-thumb">${teeSVG(item.tee_fill, "100%")}</div>
      <div class="cart-item-body">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-meta">Talla ${item.size} · Cantidad ${item.qty}</p>
        <p class="cart-item-price">${fmt(item.price * item.qty)}</p>
      </div>
      <button class="cart-item-remove" data-id="${item.id}" data-size="${item.size}" aria-label="Eliminar ${item.name}">×</button>
    </div>
  `).join("") + (envio > 0
    ? `<div class="cart-item" style="border:none;padding-top:8px;padding-bottom:0"><div class="cart-item-body"><p class="cart-item-meta">Envío</p></div><p class="cart-item-price">${fmt(envio)}</p></div>`
    : (CONFIG.envio_gratis_desde > 0 && subtotal >= CONFIG.envio_gratis_desde
        ? `<div class="cart-item" style="border:none;padding:8px 0 0"><p style="font-size:12px;color:var(--ink-mute)">✓ Envío gratis</p></div>`
        : "")
  );

  list.querySelectorAll(".cart-item-remove").forEach(btn => {
    btn.addEventListener("click", () => removeFromCart(parseInt(btn.dataset.id), btn.dataset.size));
  });
}

function openCart() {
  document.getElementById("cart-drawer").classList.add("open");
  document.getElementById("cart-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}
function closeCart() {
  document.getElementById("cart-drawer").classList.remove("open");
  document.getElementById("cart-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

document.getElementById("cart-trigger").addEventListener("click", openCart);
document.getElementById("cart-close").addEventListener("click", closeCart);
document.getElementById("cart-overlay").addEventListener("click", closeCart);

// ── CHECKOUT ──────────────────────────────────────────────────────────
document.getElementById("checkout-btn").addEventListener("click", () => {
  if (cart.length === 0) return;
  closeCart();
  openCheckout();
});

function openCheckout() {
  const { subtotal, envio, total } = cartTotal();
  const summary = document.getElementById("order-summary");
  summary.innerHTML = cart.map(item => `
    <div class="order-item">
      <div>
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-detail">Talla ${item.size} × ${item.qty}</div>
      </div>
      <span class="order-item-price">${fmt(item.price * item.qty)}</span>
    </div>
  `).join("") + (envio > 0
    ? `<div class="order-item"><div class="order-item-name">Envío</div><span class="order-item-price">${fmt(envio)}</span></div>`
    : "");

  document.getElementById("checkout-total").textContent = fmt(total);
  document.getElementById("checkout-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

document.getElementById("checkout-close").addEventListener("click", () => {
  document.getElementById("checkout-overlay").classList.remove("open");
  document.body.style.overflow = "";
});
document.getElementById("checkout-overlay").addEventListener("click", e => {
  if (e.target === document.getElementById("checkout-overlay")) {
    document.getElementById("checkout-overlay").classList.remove("open");
    document.body.style.overflow = "";
  }
});

// ── PLACE ORDER ───────────────────────────────────────────────────────
document.getElementById("place-order-btn").addEventListener("click", () => {
  const name = document.getElementById("f-name").value.trim();
  const surname = document.getElementById("f-surname").value.trim();
  const email = document.getElementById("f-email").value.trim();
  const phone = document.getElementById("f-phone").value.trim();
  const address = document.getElementById("f-address").value.trim();
  const city = document.getElementById("f-city").value.trim();
  const cp = document.getElementById("f-cp").value.trim();
  const payment = document.querySelector('input[name="payment"]:checked')?.value;

  // Basic validation
  const required = [
    [name, "f-name"],
    [surname, "f-surname"],
    [email, "f-email"],
    [phone, "f-phone"],
    [address, "f-address"],
    [city, "f-city"],
    [cp, "f-cp"],
  ];
  let ok = true;
  required.forEach(([val, id]) => {
    const el = document.getElementById(id);
    if (!val) {
      el.style.borderColor = "#c0392b";
      ok = false;
    } else {
      el.style.borderColor = "";
    }
  });
  if (!email.includes("@")) {
    document.getElementById("f-email").style.borderColor = "#c0392b";
    ok = false;
  }
  if (!ok) return;

  const { total } = cartTotal();

  // Build order reference
  const ref = "XHM-" + Date.now().toString(36).toUpperCase().slice(-6);

  // Build mailto body (fallback / info)
  const items_text = cart.map(i => `${i.name} (Talla ${i.size} x${i.qty}) — ${fmt(i.price * i.qty)}`).join("\n");
  const pay_info = payment === "bizum"
    ? `Bizum al número ${CONFIG.bizum_numero} (${CONFIG.bizum_nombre})`
    : `Transferencia al IBAN ${CONFIG.iban}`;
  const body = encodeURIComponent(
    `NUEVO PEDIDO — ${ref}\n\n` +
    `Cliente: ${name} ${surname}\nEmail: ${email}\nTeléfono: ${phone}\n` +
    `Dirección: ${address}, ${cp} ${city}\n\n` +
    `PRODUCTOS:\n${items_text}\n\nTOTAL: ${fmt(total)}\n` +
    `PAGO: ${payment === "bizum" ? "Bizum" : "Transferencia"}\n\n` +
    `Referencia: ${ref}`
  );

  const mailto = `mailto:${CONFIG.email_pedidos}?subject=Nuevo pedido ${ref}&body=${body}`;

  // Show success
  document.getElementById("checkout-overlay").classList.remove("open");

  const payMsg = payment === "bizum"
    ? `Envía <strong>${fmt(total)}</strong> por Bizum al <strong>${CONFIG.bizum_numero}</strong> (${CONFIG.bizum_nombre}) con el concepto <strong>${ref}</strong>.`
    : `Realiza una transferencia de <strong>${fmt(total)}</strong> al IBAN <strong>${CONFIG.iban}</strong> con el concepto <strong>${ref}</strong>.`;

  document.getElementById("success-msg").innerHTML =
    `<strong>${name}</strong>, tu referencia es <strong>${ref}</strong>.<br/><br/>` +
    payMsg + `<br/><br/>` +
    `También recibirás un email con estos datos en <strong>${email}</strong>.`;

  document.getElementById("success-overlay").classList.add("open");

  // Open mail client for the shop owner (optional)
  setTimeout(() => { window.location.href = mailto; }, 600);

  // Clear cart
  cart = [];
  updateCartUI();
  document.body.style.overflow = "hidden";
});

document.getElementById("success-close").addEventListener("click", () => {
  document.getElementById("success-overlay").classList.remove("open");
  document.body.style.overflow = "";
  // Reset form
  ["f-name","f-surname","f-email","f-phone","f-address","f-city","f-cp","f-notes"]
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
});

// ── INIT ──────────────────────────────────────────────────────────────
renderGrid("all");
updateCartUI();
