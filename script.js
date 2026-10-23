document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initCalculator();
});

/* ── PESTAÑAS: marca la sección visible ─────────── */
function initTabs() {
  const tabs = Array.from(document.querySelectorAll('.tab'));
  const sections = tabs
    .map((t) => document.querySelector(t.getAttribute('href')))
    .filter(Boolean);
  if (!sections.length || !('IntersectionObserver' in window)) return;

  function setActive(id) {
    tabs.forEach((t) => {
      const on = t.getAttribute('href') === `#${id}`;
      t.classList.toggle('active', on);
      if (on) {
        t.setAttribute('aria-current', 'true');
        // mantiene la pestaña activa visible en la barra horizontal del móvil
        const track = t.parentElement;
        track.scrollTo({ left: t.offsetLeft - 16, behavior: 'smooth' });
      } else {
        t.removeAttribute('aria-current');
      }
    });
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-30% 0px -60% 0px' });

  sections.forEach((s) => observer.observe(s));
}

/* ── CALCULADORA ────────────────────────────────── */
function initCalculator() {
  const productEls = Array.from(document.querySelectorAll('.product[data-calc-id]'));
  if (!productEls.length) return;

  const PRODUCTS = productEls.map((el) => ({
    id: el.dataset.calcId,
    name: el.querySelector('.product-name').textContent.trim(),
    price: parseFloat(el.dataset.price),
    el,
  }));

  const PERSONALIZE_PRICE = 3;
  const PARCHE_PRICE = 1;
  const MAX_PARCHES = 4;
  const CUSTOMS_FEE = 3;
  const STORAGE_KEY = 'xhamuCalcState';

  const sheet = document.getElementById('order');
  const orderbar = document.getElementById('orderbar');
  const orderbarLabel = document.getElementById('orderbar-label');
  const orderbarMeta = document.getElementById('orderbar-meta');
  const orderbarTotal = document.getElementById('orderbar-total');
  const closeBtn = document.getElementById('order-close');
  const rowsEl = document.getElementById('calc-rows');
  const clearBtn = document.getElementById('calc-clear-btn');
  const emptyMsg = document.getElementById('calc-empty');
  const subProductsEl = document.getElementById('calc-sub-products');
  const subShippingEl = document.getElementById('calc-sub-shipping');
  const subCustomsEl = document.getElementById('calc-sub-customs');
  const totalEl = document.getElementById('calc-total');

  let rows = [];
  let rowIdSeq = 0;
  let lastTotal = 0;

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
    return { productsTotal, shipping, customs, totalUnits, total: productsTotal + shipping + customs };
  }

  /* cantidad de cada producto en la lista de precios */
  function addUnit(productId) {
    const existing = rows.find((r) => r.productId === productId);
    if (existing) {
      existing.units.push(makeUnit());
    } else {
      rows.push({ id: ++rowIdSeq, productId, units: [makeUnit()] });
    }
  }

  function removeUnit(productId) {
    const row = rows.find((r) => r.productId === productId);
    if (!row) return;
    row.units.pop();
    if (!row.units.length) rows = rows.filter((r) => r !== row);
  }

  PRODUCTS.forEach((p) => {
    const ctrl = document.createElement('div');
    ctrl.className = 'qty';
    ctrl.innerHTML = `
      <button type="button" class="qty-btn qty-dec" data-action="dec" aria-label="Quitar una ${escapeHtml(p.name)}">
        <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-minus"/></svg>
      </button>
      <span class="qty-val" aria-live="polite"></span>
      <button type="button" class="qty-btn qty-inc" data-action="inc" aria-label="Añadir ${escapeHtml(p.name)}">
        <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-plus"/></svg>
      </button>`;
    p.el.appendChild(ctrl);
    ctrl.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      if (btn.dataset.action === 'inc') addUnit(p.id);
      else removeUnit(p.id);
      render();
    });
  });

  function updateList() {
    PRODUCTS.forEach((p) => {
      const row = rows.find((r) => r.productId === p.id);
      const count = row ? row.units.length : 0;
      p.el.classList.toggle('in-order', count > 0);
      p.el.querySelector('.qty-val').textContent = count ? count : '';
    });
  }

  function updateSummary() {
    const { productsTotal, shipping, customs, totalUnits, total } = calcTotals();
    subProductsEl.textContent = formatEUR(productsTotal);
    subShippingEl.textContent = rows.length ? (shipping ? formatEUR(shipping) : 'Gratis') : '—';
    subCustomsEl.textContent = rows.length ? formatEUR(customs) : '—';
    totalEl.textContent = formatEUR(total);

    orderbarTotal.textContent = formatEUR(total);
    orderbar.classList.toggle('has-items', rows.length > 0);
    orderbarLabel.textContent = rows.length
      ? `Ver pedido (${totalUnits} ${totalUnits === 1 ? 'prenda' : 'prendas'})`
      : 'Total estimado';
    orderbarMeta.textContent = rows.length
      ? 'Envío y arancel incluidos'
      : 'Toca + en una prenda para empezar';

    if (total !== lastTotal) {
      orderbarTotal.classList.remove('bump');
      void orderbarTotal.offsetWidth; // reinicia la animación
      orderbarTotal.classList.add('bump');
      lastTotal = total;
    }
  }

  function renderUnit(u, i) {
    return `
      <div class="unit" data-unit-index="${i}">
        <div class="unit-top">
          <span class="unit-label">Unidad ${i + 1}</span>
          <label class="switch">
            <input type="checkbox" class="unit-personalize" ${u.personalize ? 'checked' : ''}>
            <span class="switch-track" aria-hidden="true"></span>
            Nombre y número <small>+${PERSONALIZE_PRICE} €</small>
          </label>
        </div>
        ${u.personalize ? `
        <div class="unit-fields">
          <input type="text" class="unit-name" placeholder="Nombre" maxlength="15" autocomplete="off" value="${escapeHtml(u.nombre)}" aria-label="Nombre unidad ${i + 1}">
          <input type="text" class="unit-number" placeholder="Nº" maxlength="2" inputmode="numeric" autocomplete="off" value="${escapeHtml(u.numero)}" aria-label="Número unidad ${i + 1}">
        </div>` : ''}
        <div class="unit-parches">
          <span>Parches <small>${PARCHE_PRICE} € c/u, máx. ${MAX_PARCHES}</small></span>
          <div class="qty qty-sm">
            <button type="button" class="qty-btn parche-btn" data-action="dec" aria-label="Quitar parche" ${u.parches <= 0 ? 'disabled' : ''}>
              <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-minus"/></svg>
            </button>
            <span class="qty-val">${u.parches}</span>
            <button type="button" class="qty-btn parche-btn" data-action="inc" aria-label="Añadir parche" ${u.parches >= MAX_PARCHES ? 'disabled' : ''}>
              <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-plus"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }

  function renderRows() {
    emptyMsg.hidden = rows.length > 0;
    clearBtn.hidden = rows.length === 0;
    rowsEl.innerHTML = rows.map((r) => {
      const p = PRODUCTS.find((x) => x.id === r.productId);
      return `
        <div class="line" data-row-id="${r.id}">
          <div class="line-head">
            <div class="line-name">${escapeHtml(p.name)}<small>${formatEUR(p.price)} por unidad</small></div>
            <div class="qty">
              <button type="button" class="qty-btn" data-action="dec" aria-label="Quitar una ${escapeHtml(p.name)}">
                <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-minus"/></svg>
              </button>
              <span class="qty-val">${r.units.length}</span>
              <button type="button" class="qty-btn" data-action="inc" aria-label="Añadir ${escapeHtml(p.name)}">
                <svg class="icon" aria-hidden="true" focusable="false"><use href="#i-plus"/></svg>
              </button>
            </div>
            <span class="line-subtotal">${formatEUR(rowSubtotal(r))}</span>
          </div>
          <div class="units">${r.units.map(renderUnit).join('')}</div>
        </div>`;
    }).join('');
  }

  function render() {
    if (sheet.open) renderRows();
    updateList();
    updateSummary();
    saveState();
  }

  /* panel "Tu pedido" */
  function openSheet() {
    renderRows();
    if (typeof sheet.showModal === 'function') sheet.showModal();
    else sheet.setAttribute('open', '');
    document.documentElement.classList.add('sheet-open');
  }

  function closeSheet() {
    if (typeof sheet.close === 'function') sheet.close();
    else sheet.removeAttribute('open');
  }

  orderbar.addEventListener('click', openSheet);
  closeBtn.addEventListener('click', closeSheet);
  sheet.addEventListener('close', () => document.documentElement.classList.remove('sheet-open'));
  // tocar fuera del panel lo cierra
  sheet.addEventListener('click', (e) => {
    if (e.target === sheet) closeSheet();
  });

  rowsEl.addEventListener('click', (e) => {
    const rowEl = e.target.closest('.line');
    if (!rowEl) return;
    const row = rows.find((r) => r.id === Number(rowEl.dataset.rowId));
    if (!row) return;

    const parcheBtn = e.target.closest('.parche-btn');
    if (parcheBtn) {
      const unit = row.units[Number(parcheBtn.closest('.unit').dataset.unitIndex)];
      if (parcheBtn.dataset.action === 'inc' && unit.parches < MAX_PARCHES) unit.parches += 1;
      if (parcheBtn.dataset.action === 'dec' && unit.parches > 0) unit.parches -= 1;
      render();
      return;
    }
    const qtyBtn = e.target.closest('.line-head [data-action]');
    if (qtyBtn) {
      if (qtyBtn.dataset.action === 'inc') addUnit(row.productId);
      else removeUnit(row.productId);
      render();
    }
  });

  rowsEl.addEventListener('change', (e) => {
    if (!e.target.classList.contains('unit-personalize')) return;
    const rowId = Number(e.target.closest('.line').dataset.rowId);
    const unitIndex = Number(e.target.closest('.unit').dataset.unitIndex);
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    const checked = e.target.checked;
    row.units[unitIndex].personalize = checked;
    render();
    if (checked) {
      const nameInput = rowsEl.querySelector(
        `.line[data-row-id="${rowId}"] .unit[data-unit-index="${unitIndex}"] .unit-name`
      );
      if (nameInput) nameInput.focus();
    }
  });

  rowsEl.addEventListener('input', (e) => {
    const isName = e.target.classList.contains('unit-name');
    const isNumber = e.target.classList.contains('unit-number');
    if (!isName && !isNumber) return;
    const row = rows.find((r) => r.id === Number(e.target.closest('.line').dataset.rowId));
    if (!row) return;
    const unit = row.units[Number(e.target.closest('.unit').dataset.unitIndex)];
    if (isName) {
      unit.nombre = e.target.value;
    } else {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
      if (digits !== e.target.value) e.target.value = digits;
      unit.numero = digits;
    }
    saveState();
  });

  clearBtn.addEventListener('click', () => {
    rows = [];
    render();
  });

  loadState();
  lastTotal = calcTotals().total;
  render();
}
