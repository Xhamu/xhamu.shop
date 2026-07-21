document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.section, .alert-banner').forEach((el) => {
      el.classList.add('reveal');
      io.observe(el);
    });
  }

  initCalculator();
});

function initCalculator() {
  const rowsEl = document.getElementById('calc-rows');
  if (!rowsEl) return;

  function parsePrice(text) {
    return parseFloat(text.replace(/[^\d,.-]/g, '').replace(',', '.'));
  }

  const PRODUCTS = Array.from(
    document.querySelectorAll('#catalogo .price-grid:not(.price-grid-extras) .price-card[data-calc-id]')
  ).map((card) => ({
    id: card.dataset.calcId,
    name: card.querySelector('.price-name').textContent.trim(),
    price: parsePrice(card.querySelector('.price-value').textContent),
  }));
  if (!PRODUCTS.length) return;

  const PERSONALIZE_PRICE = 3;
  const PARCHE_PRICE = 1;
  const MAX_PARCHES = 4;
  const CUSTOMS_FEE = 3;
  const WHATSAPP_NUMBER = '34609437510';
  const STORAGE_KEY = 'xhamuCalcState';

  const productSelect = document.getElementById('calc-product-select');
  const addBtn = document.getElementById('calc-add-btn');
  const clearBtn = document.getElementById('calc-clear-btn');
  const emptyMsg = document.getElementById('calc-empty');
  const subProductsEl = document.getElementById('calc-sub-products');
  const subShippingEl = document.getElementById('calc-sub-shipping');
  const subCustomsEl = document.getElementById('calc-sub-customs');
  const totalEl = document.getElementById('calc-total');
  const whatsappLink = document.getElementById('calc-whatsapp');

  let rows = [];
  let rowIdSeq = 0;

  productSelect.innerHTML = PRODUCTS.map(
    (p) => `<option value="${p.id}">${p.name} — ${formatEUR(p.price)}</option>`
  ).join('');

  function formatEUR(n) {
    return `${Number.isInteger(n) ? n : n.toFixed(2)} €`;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function makeUnit() {
    return { personalize: false, nombre: '', numero: '', parches: 0 };
  }

  function saveState() {
    try {
      const data = rows.map((r) => ({ productId: r.productId, units: r.units }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) { /* localStorage unavailable (private mode, quota) — skip persistence */ }
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      rows = parsed
        .filter((r) => PRODUCTS.some((p) => p.id === r.productId) && Array.isArray(r.units) && r.units.length)
        .map((r) => ({
          id: ++rowIdSeq,
          productId: r.productId,
          units: r.units.map((u) => ({
            personalize: !!u.personalize,
            nombre: typeof u.nombre === 'string' ? u.nombre.slice(0, 15) : '',
            numero: typeof u.numero === 'string' ? u.numero.replace(/\D/g, '').slice(0, 2) : '',
            parches: Math.min(MAX_PARCHES, Math.max(0, Number(u.parches) || 0)),
          })),
        }));
    } catch (e) { /* corrupt or unavailable storage — start fresh */ }
  }

  function shippingFor(units) {
    if (units <= 0) return 0;
    if (units === 1) return 4;
    if (units === 2) return 3;
    if (units === 3) return 2;
    return 0;
  }

  function unitPrice(basePrice, unit) {
    return basePrice + (unit.personalize ? PERSONALIZE_PRICE : 0) + unit.parches * PARCHE_PRICE;
  }

  function rowSubtotal(row) {
    const p = PRODUCTS.find((x) => x.id === row.productId);
    return row.units.reduce((sum, u) => sum + unitPrice(p.price, u), 0);
  }

  function calcTotals() {
    let productsTotal = 0;
    let totalUnits = 0;
    rows.forEach((r) => {
      productsTotal += rowSubtotal(r);
      totalUnits += r.units.length;
    });
    const shipping = rows.length ? shippingFor(totalUnits) : 0;
    const customs = rows.length ? CUSTOMS_FEE : 0;
    return { productsTotal, shipping, customs, total: productsTotal + shipping + customs };
  }

  function buildWhatsAppMessage() {
    if (!rows.length) return 'Hola, quiero hacer un pedido';
    const { productsTotal, shipping, customs, total } = calcTotals();
    const lines = ['Hola, quiero hacer este pedido:', ''];
    rows.forEach((r) => {
      const p = PRODUCTS.find((x) => x.id === r.productId);
      lines.push(`${r.units.length}x ${p.name} — ${formatEUR(rowSubtotal(r))}`);
      r.units.forEach((u, i) => {
        const details = [];
        if (u.personalize) {
          const nombre = u.nombre.trim();
          const numero = u.numero.trim();
          details.push(nombre || numero
            ? `${nombre || '(nombre pendiente)'} / ${numero || '(número pendiente)'}`
            : 'personalización pendiente de indicar');
        }
        if (u.parches > 0) details.push(`${u.parches} parche${u.parches > 1 ? 's' : ''}`);
        if (details.length) lines.push(`  · Unidad ${i + 1}: ${details.join(', ')}`);
      });
    });
    lines.push('');
    lines.push(`Subtotal productos: ${formatEUR(productsTotal)}`);
    lines.push(`Envío: ${formatEUR(shipping)}`);
    lines.push(`Arancel: ${formatEUR(customs)}`);
    lines.push(`Total: ${formatEUR(total)}`);
    return lines.join('\n');
  }

  function updateWhatsAppLink() {
    const text = encodeURIComponent(buildWhatsAppMessage());
    whatsappLink.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;
    whatsappLink.classList.toggle('is-disabled', rows.length === 0);
  }

  function updateSummary() {
    const { productsTotal, shipping, customs, total } = calcTotals();
    subProductsEl.textContent = formatEUR(productsTotal);
    subShippingEl.textContent = rows.length ? formatEUR(shipping) : '—';
    subCustomsEl.textContent = rows.length ? formatEUR(customs) : '—';
    totalEl.textContent = formatEUR(total);
    updateWhatsAppLink();
  }

  function renderUnit(u, i) {
    return `
      <div class="calc-unit" data-unit-index="${i}">
        <div class="calc-unit-top">
          <span class="calc-unit-label">Unidad ${i + 1}</span>
          <label class="calc-unit-toggle">
            <input type="checkbox" class="calc-unit-personalize" ${u.personalize ? 'checked' : ''}>
            Nombre y número (+${PERSONALIZE_PRICE} €)
          </label>
        </div>
        ${u.personalize ? `
        <div class="calc-unit-fields">
          <input type="text" class="calc-unit-name" placeholder="Nombre" maxlength="15" value="${escapeHtml(u.nombre)}" aria-label="Nombre unidad ${i + 1}">
          <input type="text" class="calc-unit-number" placeholder="Nº" maxlength="2" inputmode="numeric" value="${escapeHtml(u.numero)}" aria-label="Número unidad ${i + 1}">
        </div>` : ''}
        <div class="calc-unit-parches">
          <span>Parches</span>
          <div class="calc-qty calc-qty-sm">
            <button type="button" class="calc-parche-btn" data-action="dec" aria-label="Quitar parche" ${u.parches <= 0 ? 'disabled' : ''}>−</button>
            <span class="calc-parche-val">${u.parches}</span>
            <button type="button" class="calc-parche-btn" data-action="inc" aria-label="Añadir parche" ${u.parches >= MAX_PARCHES ? 'disabled' : ''}>+</button>
          </div>
          <small>(${PARCHE_PRICE} €/parche, máx. ${MAX_PARCHES})</small>
        </div>
      </div>`;
  }

  function render() {
    emptyMsg.style.display = rows.length ? 'none' : '';
    clearBtn.classList.toggle('visible', rows.length > 0);
    rowsEl.innerHTML = rows.map((r) => {
      const p = PRODUCTS.find((x) => x.id === r.productId);
      return `
        <div class="calc-row" data-row-id="${r.id}">
          <div class="calc-row-head">
            <span class="calc-row-name">${escapeHtml(p.name)} <small>${formatEUR(p.price)}/ud.</small></span>
            <div class="calc-qty">
              <button type="button" class="calc-qty-btn" data-action="dec" aria-label="Quitar unidad" ${r.units.length <= 1 ? 'disabled' : ''}>−</button>
              <span class="calc-qty-val">${r.units.length}</span>
              <button type="button" class="calc-qty-btn" data-action="inc" aria-label="Añadir unidad">+</button>
            </div>
            <span class="calc-row-subtotal">${formatEUR(rowSubtotal(r))}</span>
            <button type="button" class="calc-row-remove" aria-label="Quitar ${escapeHtml(p.name)}">
              <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-x"/></svg>
            </button>
          </div>
          <div class="calc-units">${r.units.map(renderUnit).join('')}</div>
        </div>`;
    }).join('');
    updateSummary();
    saveState();
  }

  addBtn.addEventListener('click', () => {
    const productId = productSelect.value;
    const existing = rows.find((r) => r.productId === productId);
    if (existing) {
      existing.units.push(makeUnit());
    } else {
      rows.push({ id: ++rowIdSeq, productId, units: [makeUnit()] });
    }
    render();
  });

  rowsEl.addEventListener('click', (e) => {
    const rowEl = e.target.closest('.calc-row');
    if (!rowEl) return;
    const rowId = Number(rowEl.dataset.rowId);
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;

    if (e.target.closest('.calc-row-remove')) {
      rows = rows.filter((r) => r.id !== rowId);
      render();
      return;
    }
    if (e.target.closest('.calc-row-head [data-action="inc"]')) {
      row.units.push(makeUnit());
      render();
      return;
    }
    if (e.target.closest('.calc-row-head [data-action="dec"]')) {
      if (row.units.length > 1) row.units.pop();
      render();
      return;
    }
    const parcheBtn = e.target.closest('.calc-parche-btn');
    if (parcheBtn) {
      const unitEl = parcheBtn.closest('.calc-unit');
      const unit = row.units[Number(unitEl.dataset.unitIndex)];
      if (parcheBtn.dataset.action === 'inc' && unit.parches < MAX_PARCHES) unit.parches += 1;
      if (parcheBtn.dataset.action === 'dec' && unit.parches > 0) unit.parches -= 1;
      render();
    }
  });

  rowsEl.addEventListener('change', (e) => {
    if (!e.target.classList.contains('calc-unit-personalize')) return;
    const rowEl = e.target.closest('.calc-row');
    const unitEl = e.target.closest('.calc-unit');
    const rowId = Number(rowEl.dataset.rowId);
    const unitIndex = Number(unitEl.dataset.unitIndex);
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const checked = e.target.checked;
    row.units[unitIndex].personalize = checked;
    render();
    if (checked) {
      const nameInput = rowsEl.querySelector(
        `.calc-row[data-row-id="${rowId}"] .calc-unit[data-unit-index="${unitIndex}"] .calc-unit-name`
      );
      if (nameInput) nameInput.focus();
    }
  });

  rowsEl.addEventListener('input', (e) => {
    const isName = e.target.classList.contains('calc-unit-name');
    const isNumber = e.target.classList.contains('calc-unit-number');
    if (!isName && !isNumber) return;
    const rowEl = e.target.closest('.calc-row');
    const unitEl = e.target.closest('.calc-unit');
    const row = rows.find((r) => r.id === Number(rowEl.dataset.rowId));
    if (!row) return;
    const unit = row.units[Number(unitEl.dataset.unitIndex)];
    if (isName) {
      unit.nombre = e.target.value;
    } else if (isNumber) {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
      if (digits !== e.target.value) e.target.value = digits;
      unit.numero = digits;
    }
    updateWhatsAppLink();
    saveState();
  });

  whatsappLink.addEventListener('click', (e) => {
    if (whatsappLink.classList.contains('is-disabled')) e.preventDefault();
  });

  clearBtn.addEventListener('click', () => {
    rows = [];
    render();
  });

  loadState();
  render();
}
