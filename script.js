document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('.nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  initSpotlight();
  initPriceSplit();
  initScrollProgress();
  initNavActiveLink();
  initReveal();
  initTilt();
  initMagnetic();
  initCalculator();
});

/* ── SPOTLIGHT: halo que sigue el cursor ──────── */
function initSpotlight() {
  const spot = document.getElementById('spotlight');
  if (!spot) return;
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let raf = null;
  window.addEventListener('pointermove', (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      spot.style.setProperty('--mx', `${e.clientX}px`);
      spot.style.setProperty('--my', `${e.clientY}px`);
      spot.classList.add('is-active');
      raf = null;
    });
  }, { passive: true });
}

/* ── PRECIOS: separa número y moneda para tipografía grande + conteo ── */
function initPriceSplit() {
  document.querySelectorAll('.price-value').forEach((el) => {
    const raw = el.textContent.trim();
    const match = raw.match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/);
    if (!match) return;
    const [, num, cur] = match;
    el.dataset.target = parseFloat(num.replace(',', '.'));
    el.innerHTML = `<span class="num">${num}</span><span class="cur">${cur}</span>`;
  });
}

/* ── BARRA DE PROGRESO DE SCROLL ──────────────── */
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  let ticking = false;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    bar.style.transform = `scaleX(${pct / 100})`;
    ticking = false;
  };
  update();
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }, { passive: true });
  window.addEventListener('resize', update);
}

/* ── NAV: resaltar sección activa ─────────────── */
function initNavActiveLink() {
  const links = Array.from(document.querySelectorAll('.nav-link'));
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map();
  links.forEach((link) => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) map.set(section, link);
  });
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = map.get(entry.target);
      if (!link) return;
      link.classList.toggle('active', entry.isIntersecting);
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  map.forEach((_link, section) => io.observe(section));
}

/* ── REVEAL AL HACER SCROLL (secciones + tarjetas en cascada) ── */
function initReveal() {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!('IntersectionObserver' in window) || reduceMotion) return;

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

  const cardIo = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      cardIo.unobserve(entry.target);
      const value = entry.target.querySelector('.price-value[data-target]');
      if (value) animateCountUp(value);
    });
  }, { threshold: 0.2, rootMargin: '0px 0px -40px 0px' });

  const groups = document.querySelectorAll('.price-grid, .type-grid, .info-list');
  groups.forEach((group) => {
    Array.from(group.children).forEach((card, i) => {
      card.classList.add('reveal-card');
      card.style.setProperty('--i', i % 8);
      cardIo.observe(card);
    });
  });
}

function formatNum(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

function animateCountUp(el) {
  const target = Number(el.dataset.target);
  if (!Number.isFinite(target)) return;
  const numEl = el.querySelector('.num') || el;
  const duration = 700;
  const start = performance.now();
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  function frame(now) {
    const p = Math.min(1, (now - start) / duration);
    const value = target * ease(p);
    numEl.textContent = formatNum(p >= 1 ? target : Math.round(value * 10) / 10);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

/* ── TILT 3D EN TARJETAS (solo con puntero fino) ── */
function initTilt() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.price-card, .type-card');
  cards.forEach((card) => {
    let raf = null;
    card.addEventListener('pointermove', (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty('--rx', `${(-py * 10).toFixed(2)}deg`);
        card.style.setProperty('--ry', `${(px * 14).toFixed(2)}deg`);
        raf = null;
      });
    });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
}

/* ── BOTÓN MAGNÉTICO ──────────────────────────── */
function initMagnetic() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  document.querySelectorAll('.btn-calc-add').forEach((btn) => {
    btn.addEventListener('pointermove', (e) => {
      const r = btn.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.25;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = `translate(${x}px, ${y}px)`;
    });
    btn.addEventListener('pointerleave', () => {
      btn.style.transform = '';
    });
  });
}

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
  const STORAGE_KEY = 'xhamuCalcState';

  const productSelect = document.getElementById('calc-product-select');
  const addBtn = document.getElementById('calc-add-btn');
  const clearBtn = document.getElementById('calc-clear-btn');
  const emptyMsg = document.getElementById('calc-empty');
  const subProductsEl = document.getElementById('calc-sub-products');
  const subShippingEl = document.getElementById('calc-sub-shipping');
  const subCustomsEl = document.getElementById('calc-sub-customs');
  const totalEl = document.getElementById('calc-total');

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

  function updateSummary() {
    const { productsTotal, shipping, customs, total } = calcTotals();
    subProductsEl.textContent = formatEUR(productsTotal);
    subShippingEl.textContent = rows.length ? formatEUR(shipping) : '—';
    subCustomsEl.textContent = rows.length ? formatEUR(customs) : '—';
    totalEl.textContent = formatEUR(total);
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
    saveState();
  });

  clearBtn.addEventListener('click', () => {
    rows = [];
    render();
  });

  loadState();
  render();
}
