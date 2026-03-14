// booking.js – TravelBeez Booking Modal Logic
(function () {
  const API = ''; // Same origin — served by Express

  const SERVICES = [
    'Visa Consultation',
    'Holiday Package',
    'Flight Booking',
    'Hotel Booking',
    'Custom Tour',
    'Travel Insurance'
  ];

  // ─── Inject Modal HTML ────────────────────────────────────────────────────
  const modalHtml = `
  <div class="bk-overlay" id="bk-overlay" role="dialog" aria-modal="true" aria-label="Book Consultation">
    <div class="bk-modal">
      <!-- Header -->
      <div class="bk-header">
        <div class="bk-logo">🐝 TravelBeez Booking</div>
        <button class="bk-close" id="bk-close" aria-label="Close">✕</button>
      </div>

      <!-- Progress bar -->
      <div class="bk-progress">
        <div class="bk-step-indicator" id="bk-steps">
          <div class="bk-step active" data-step="1"><span>1</span> Details</div>
          <div class="bk-step-line"></div>
          <div class="bk-step" data-step="2"><span>2</span> Pick Slot</div>
          <div class="bk-step-line"></div>
          <div class="bk-step" data-step="3"><span>3</span> Confirm</div>
        </div>
      </div>

      <!-- Step 1: Personal Details + Service -->
      <div class="bk-panel" id="bk-panel-1">
        <h3>Your Details & Service</h3>
        <p class="bk-panel-sub">Tell us what you need and how to reach you.</p>

        <div class="bk-form-grid">
          <div class="bk-field">
            <label>Full Name *</label>
            <input type="text" id="bk-name" placeholder="Your full name" />
          </div>
          <div class="bk-field">
            <label>Phone *</label>
            <input type="tel" id="bk-phone" placeholder="+91 98765 43210" />
          </div>
          <div class="bk-field bk-full">
            <label>Email</label>
            <input type="email" id="bk-email" placeholder="you@email.com" />
          </div>
          <div class="bk-field">
            <label>Service *</label>
            <select id="bk-service">
              <option value="">Select a service...</option>
              ${SERVICES.map(s => `<option>${s}</option>`).join('')}
            </select>
          </div>
          <div class="bk-field">
            <label>Destination</label>
            <input type="text" id="bk-dest" placeholder="e.g. Paris, Dubai, Bali" />
          </div>
          <div class="bk-field bk-full">
            <label>Notes / Travel Details</label>
            <textarea id="bk-message" rows="2" placeholder="Preferred travel dates, group size, special requirements..."></textarea>
          </div>
        </div>
        <p class="bk-error" id="bk-err-1"></p>
        <div class="bk-footer">
          <button class="bk-btn-primary" id="bk-next-1">Next — Choose a Slot →</button>
        </div>
      </div>

      <!-- Step 2: Date + Time Slot -->
      <div class="bk-panel" id="bk-panel-2" style="display:none">
        <h3>Choose Your Appointment</h3>
        <p class="bk-panel-sub">Pick a date and available time slot. Mon–Sat, 9am–7pm.</p>

        <div class="bk-date-row">
          <div class="bk-field">
            <label>Date *</label>
            <input type="date" id="bk-date" />
          </div>
          <button class="bk-btn-secondary" id="bk-load-slots">Check Slots</button>
        </div>

        <div id="bk-slots-area" style="display:none">
          <p class="bk-slots-label">Available time slots:</p>
          <div class="bk-slots-grid" id="bk-slots-grid"></div>
        </div>
        <div id="bk-slots-loading" style="display:none" class="bk-loading">
          <div class="bk-spinner"></div> Loading slots...
        </div>
        <div id="bk-slots-empty" style="display:none" class="bk-empty-msg">
          😔 No slots available on this date. Try another day.
        </div>

        <p class="bk-error" id="bk-err-2"></p>
        <div class="bk-footer">
          <button class="bk-btn-ghost" id="bk-back-2">← Back</button>
          <button class="bk-btn-primary" id="bk-next-2">Review Booking →</button>
        </div>
      </div>

      <!-- Step 3: Confirm -->
      <div class="bk-panel" id="bk-panel-3" style="display:none">
        <h3>Review & Confirm</h3>
        <p class="bk-panel-sub">Please verify your booking details before confirming.</p>

        <div class="bk-summary" id="bk-summary"></div>

        <p class="bk-error" id="bk-err-3"></p>
        <div class="bk-footer">
          <button class="bk-btn-ghost" id="bk-back-3">← Back</button>
          <button class="bk-btn-primary" id="bk-confirm-btn">
            <span id="bk-confirm-text">Confirm Booking ✓</span>
          </button>
        </div>
      </div>

      <!-- Step 4: Success -->
      <div class="bk-panel" id="bk-panel-4" style="display:none; text-align:center;">
        <div class="bk-success-icon">✈️</div>
        <h3>Booking Confirmed!</h3>
        <p class="bk-panel-sub" id="bk-success-msg"></p>
        <div class="bk-success-details" id="bk-success-details"></div>
        <div class="bk-footer" style="justify-content:center; gap:12px; flex-wrap:wrap;">
          <a id="bk-whatsapp-link" href="#" target="_blank" class="bk-btn-whatsapp">
            💬 Confirm via WhatsApp
          </a>
          <button class="bk-btn-ghost" id="bk-close-success">Close</button>
        </div>
      </div>

    </div>
  </div>`;

  // ─── Inject CSS ───────────────────────────────────────────────────────────
  const css = `
  .bk-overlay {
    position:fixed; inset:0; background:rgba(15,25,40,0.75); z-index:10000;
    display:flex; align-items:center; justify-content:center;
    opacity:0; pointer-events:none; transition:opacity .3s ease;
    backdrop-filter:blur(4px); padding:16px;
  }
  .bk-overlay.open { opacity:1; pointer-events:all; }
  .bk-modal {
    background:#fff; border-radius:20px; width:100%; max-width:620px;
    max-height:90vh; overflow-y:auto; box-shadow:0 24px 80px rgba(0,0,0,0.35);
    transform:scale(.94); transition:transform .3s ease;
    scrollbar-width:thin;
  }
  .bk-overlay.open .bk-modal { transform:scale(1); }
  .bk-header {
    display:flex; align-items:center; justify-content:space-between;
    padding:20px 24px 0; position:sticky; top:0; background:#fff;
    z-index:1; border-bottom:1px solid #f1f5f9; padding-bottom:16px;
  }
  .bk-logo { font-weight:800; color:#1A2B3C; font-size:1rem; }
  .bk-close {
    width:32px; height:32px; border-radius:50%; border:none;
    background:#f1f5f9; cursor:pointer; font-size:1rem;
    display:flex; align-items:center; justify-content:center;
    transition:.2s; color:#64748b;
  }
  .bk-close:hover { background:#e2e8f0; color:#1A2B3C; }
  .bk-progress { padding:20px 24px 0; }
  .bk-step-indicator {
    display:flex; align-items:center; margin-bottom:4px;
  }
  .bk-step {
    display:flex; align-items:center; gap:6px;
    font-size:.82rem; font-weight:600; color:#94a3b8; transition:.3s;
  }
  .bk-step span {
    width:26px; height:26px; border-radius:50%; background:#e2e8f0;
    display:flex; align-items:center; justify-content:center;
    font-size:.78rem; font-weight:700; transition:.3s;
  }
  .bk-step.active { color:#00AEEF; }
  .bk-step.active span { background:#00AEEF; color:#fff; }
  .bk-step.done span { background:#10b981; color:#fff; }
  .bk-step.done { color:#10b981; }
  .bk-step-line { flex:1; height:2px; background:#e2e8f0; margin:0 8px; border-radius:2px; }
  .bk-panel { padding:20px 24px 24px; }
  .bk-panel h3 { font-size:1.25rem; font-weight:800; color:#1A2B3C; margin-bottom:4px; }
  .bk-panel-sub { font-size:.87rem; color:#64748b; margin-bottom:20px; }
  .bk-form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .bk-field { display:flex; flex-direction:column; gap:5px; }
  .bk-field.bk-full { grid-column:span 2; }
  .bk-field label { font-size:.8rem; font-weight:600; color:#475569; }
  .bk-field input, .bk-field select, .bk-field textarea {
    border:1.5px solid #e2e8f0; border-radius:10px; padding:10px 14px;
    font-size:.9rem; font-family:inherit; color:#1A2B3C;
    transition:.2s; background:#fff; resize:vertical;
  }
  .bk-field input:focus, .bk-field select:focus, .bk-field textarea:focus {
    outline:none; border-color:#00AEEF; box-shadow:0 0 0 3px rgba(0,174,239,.1);
  }
  .bk-date-row { display:flex; align-items:flex-end; gap:12px; margin-bottom:20px; }
  .bk-date-row .bk-field { flex:1; }
  .bk-slots-label { font-size:.85rem; font-weight:600; color:#475569; margin-bottom:12px; }
  .bk-slots-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(110px,1fr)); gap:10px; }
  .slot-btn {
    padding:10px 8px; border-radius:10px; border:2px solid #e2e8f0;
    font-size:.85rem; font-weight:600; cursor:pointer; text-align:center;
    transition:.2s; background:#f8fafc; color:#334155;
    display:flex; flex-direction:column; align-items:center; gap:2px;
  }
  .slot-btn:hover:not(.slot-full) { border-color:#00AEEF; background:#e6f7fd; color:#00AEEF; }
  .slot-btn.selected { border-color:#00AEEF; background:#00AEEF; color:#fff; }
  .slot-btn.slot-full { opacity:.45; cursor:not-allowed; background:#f1f5f9; color:#94a3b8; }
  .slot-avail { font-size:.7rem; font-weight:500; opacity:.75; }
  .bk-loading { display:flex; align-items:center; gap:10px; color:#64748b; padding:20px 0; }
  .bk-spinner {
    width:20px; height:20px; border:2px solid #e2e8f0;
    border-top-color:#00AEEF; border-radius:50%;
    animation:bk-spin .7s linear infinite;
  }
  @keyframes bk-spin { to { transform:rotate(360deg); } }
  .bk-empty-msg { text-align:center; color:#64748b; padding:20px 0; font-size:.9rem; }
  .bk-summary {
    background:#f8fafc; border:1.5px solid #e2e8f0; border-radius:14px;
    padding:20px; display:flex; flex-direction:column; gap:12px; margin-bottom:16px;
  }
  .bk-summary-row { display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
  .bk-summary-row .label { font-size:.8rem; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:.3px; }
  .bk-summary-row .value { font-size:.92rem; color:#1A2B3C; font-weight:600; text-align:right; }
  .bk-summary-row .value.highlight { color:#00AEEF; font-size:1.05rem; }
  .bk-error { color:#ef4444; font-size:.82rem; margin-top:8px; min-height:20px; }
  .bk-footer { display:flex; justify-content:space-between; align-items:center; margin-top:20px; gap:10px; }
  .bk-btn-primary {
    background:linear-gradient(135deg,#00AEEF,#0093cc); color:#fff;
    border:none; padding:13px 28px; border-radius:50px; font-weight:700;
    font-size:.92rem; cursor:pointer; transition:.2s; font-family:inherit;
  }
  .bk-btn-primary:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(0,174,239,.4); }
  .bk-btn-primary:disabled { opacity:.6; cursor:not-allowed; transform:none; }
  .bk-btn-secondary {
    background:#e6f7fd; color:#00AEEF; border:2px solid #00AEEF;
    padding:10px 20px; border-radius:50px; font-weight:600;
    font-size:.85rem; cursor:pointer; transition:.2s; font-family:inherit;
    white-space:nowrap;
  }
  .bk-btn-secondary:hover { background:#00AEEF; color:#fff; }
  .bk-btn-ghost {
    background:none; color:#64748b; border:2px solid #e2e8f0;
    padding:11px 22px; border-radius:50px; font-weight:600;
    font-size:.88rem; cursor:pointer; transition:.2s; font-family:inherit;
  }
  .bk-btn-ghost:hover { border-color:#1A2B3C; color:#1A2B3C; }
  .bk-btn-whatsapp {
    background:#25d366; color:#fff; border:none;
    padding:12px 24px; border-radius:50px; font-weight:700;
    font-size:.9rem; cursor:pointer; transition:.2s; font-family:inherit;
    text-decoration:none; display:inline-flex; align-items:center;
  }
  .bk-btn-whatsapp:hover { background:#128c3e; transform:translateY(-1px); }
  .bk-success-icon { font-size:3.5rem; margin-bottom:12px; }
  .bk-success-details {
    background:#f0fdf4; border:1.5px solid #bbf7d0; border-radius:12px;
    padding:16px; margin:16px 0; font-size:.88rem; color:#166534; line-height:1.7;
  }
  @media (max-width:500px) {
    .bk-form-grid { grid-template-columns:1fr; }
    .bk-field.bk-full { grid-column:span 1; }
    .bk-date-row { flex-direction:column; }
    .bk-footer { flex-direction:column; }
    .bk-btn-primary, .bk-btn-ghost { width:100%; text-align:center; justify-content:center; }
  }`;

  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  document.body.insertAdjacentHTML('beforeend', modalHtml);

  // ─── State ────────────────────────────────────────────────────────────────
  let selectedSlot = null;
  let currentStep  = 1;

  // ─── DOM refs ─────────────────────────────────────────────────────────────
  const overlay    = document.getElementById('bk-overlay');
  const panels     = [1,2,3,4].map(n => document.getElementById(`bk-panel-${n}`));
  const steps      = document.querySelectorAll('.bk-step');

  // ─── Open / Close ─────────────────────────────────────────────────────────
  function openModal(service = '') {
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    showPanel(1);
    if (service) {
      const sel = document.getElementById('bk-service');
      if (sel) [...sel.options].forEach(o => { o.selected = o.text === service; });
    }
  }

  function closeModal() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  document.getElementById('bk-close').addEventListener('click', closeModal);
  document.getElementById('bk-close-success')?.addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ─── Panel Navigation ─────────────────────────────────────────────────────
  function showPanel(n) {
    currentStep = n;
    panels.forEach((p, i) => { p.style.display = i === n - 1 ? '' : 'none'; });
    steps.forEach((s, i) => {
      s.classList.remove('active','done');
      if (i + 1 === n) s.classList.add('active');
      else if (i + 1 < n) s.classList.add('done');
    });
  }

  function getErr(n) { return document.getElementById(`bk-err-${n}`); }
  function setErr(n, msg) { const el = getErr(n); if (el) el.textContent = msg; }
  function clearErr(n) { setErr(n, ''); }

  // ─── Step 1 → 2 ───────────────────────────────────────────────────────────
  document.getElementById('bk-next-1').addEventListener('click', () => {
    clearErr(1);
    const name    = document.getElementById('bk-name').value.trim();
    const phone   = document.getElementById('bk-phone').value.trim();
    const service = document.getElementById('bk-service').value;
    if (!name)    return setErr(1, '⚠ Please enter your name.');
    if (!phone)   return setErr(1, '⚠ Please enter your phone number.');
    if (!service) return setErr(1, '⚠ Please select a service.');
    showPanel(2);
    // Set min date to today (Mon–Sat check done server-side)
    const dateInput = document.getElementById('bk-date');
    const today = new Date().toISOString().slice(0,10);
    dateInput.min = today;
    if (!dateInput.value) dateInput.value = today;
  });

  // ─── Load Slots ───────────────────────────────────────────────────────────
  document.getElementById('bk-back-2').addEventListener('click', () => showPanel(1));

  document.getElementById('bk-load-slots').addEventListener('click', loadSlots);
  document.getElementById('bk-date').addEventListener('change', () => {
    selectedSlot = null;
    document.getElementById('bk-slots-area').style.display = 'none';
  });

  async function loadSlots() {
    clearErr(2);
    selectedSlot = null;
    const date = document.getElementById('bk-date').value;
    if (!date) return setErr(2, '⚠ Please pick a date first.');

    document.getElementById('bk-slots-area').style.display   = 'none';
    document.getElementById('bk-slots-empty').style.display  = 'none';
    document.getElementById('bk-slots-loading').style.display = 'flex';

    try {
      const res  = await fetch(`${API}/api/slots?date=${date}`);
      const data = await res.json();
      document.getElementById('bk-slots-loading').style.display = 'none';

      if (!res.ok) return setErr(2, data.error || 'Could not load slots.');

      const available = data.slots.filter(s => s.available);
      if (!available.length) {
        document.getElementById('bk-slots-empty').style.display = 'block';
        return;
      }

      renderSlots(data.slots);
      document.getElementById('bk-slots-area').style.display = 'block';
    } catch {
      document.getElementById('bk-slots-loading').style.display = 'none';
      setErr(2, '⚠ Could not reach the server. Is it running?');
    }
  }

  function renderSlots(slots) {
    const grid = document.getElementById('bk-slots-grid');
    grid.innerHTML = '';
    slots.forEach(({ time_slot, available, booked }) => {
      const btn = document.createElement('button');
      btn.className = 'slot-btn' + (!available ? ' slot-full' : '');
      btn.disabled  = !available;
      const [h] = time_slot.split(':').map(Number);
      const label = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h-12}:00 PM`;
      const left  = available ? `${3 - booked} left` : 'Full';
      btn.innerHTML = `<span>${label}</span><span class="slot-avail">${left}</span>`;
      btn.addEventListener('click', () => selectSlot(time_slot, btn));
      grid.appendChild(btn);
    });
  }

  function selectSlot(slot, btn) {
    selectedSlot = slot;
    document.querySelectorAll('.slot-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    clearErr(2);
  }

  // ─── Step 2 → 3 ───────────────────────────────────────────────────────────
  document.getElementById('bk-next-2').addEventListener('click', () => {
    clearErr(2);
    if (!selectedSlot) return setErr(2, '⚠ Please select a time slot.');
    buildSummary();
    showPanel(3);
  });

  function buildSummary() {
    const name    = document.getElementById('bk-name').value.trim();
    const phone   = document.getElementById('bk-phone').value.trim();
    const email   = document.getElementById('bk-email').value.trim();
    const service = document.getElementById('bk-service').value;
    const dest    = document.getElementById('bk-dest').value.trim();
    const date    = document.getElementById('bk-date').value;
    const [h]     = selectedSlot.split(':').map(Number);
    const timeLabel = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h-12}:00 PM`;
    const dateLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' });

    document.getElementById('bk-summary').innerHTML = `
      <div class="bk-summary-row"><span class="label">Name</span><span class="value">${name}</span></div>
      <div class="bk-summary-row"><span class="label">Phone</span><span class="value">${phone}</span></div>
      ${email ? `<div class="bk-summary-row"><span class="label">Email</span><span class="value">${email}</span></div>` : ''}
      <div class="bk-summary-row"><span class="label">Service</span><span class="value">${service}</span></div>
      ${dest ? `<div class="bk-summary-row"><span class="label">Destination</span><span class="value">${dest}</span></div>` : ''}
      <div class="bk-summary-row"><span class="label">Date</span><span class="value highlight">${dateLabel}</span></div>
      <div class="bk-summary-row"><span class="label">Time</span><span class="value highlight">${timeLabel}</span></div>
    `;
  }

  // ─── Step 3 → Submit ──────────────────────────────────────────────────────
  document.getElementById('bk-back-3').addEventListener('click', () => showPanel(2));

  document.getElementById('bk-confirm-btn').addEventListener('click', async () => {
    clearErr(3);
    const btn = document.getElementById('bk-confirm-btn');
    const txt = document.getElementById('bk-confirm-text');
    btn.disabled = true;
    txt.textContent = '⏳ Booking...';

    const payload = {
      name:        document.getElementById('bk-name').value.trim(),
      phone:       document.getElementById('bk-phone').value.trim(),
      email:       document.getElementById('bk-email').value.trim(),
      service:     document.getElementById('bk-service').value,
      destination: document.getElementById('bk-dest').value.trim(),
      date:        document.getElementById('bk-date').value,
      time_slot:   selectedSlot,
      message:     document.getElementById('bk-message').value.trim()
    };

    try {
      const res  = await fetch(`${API}/api/bookings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (!res.ok) {
        setErr(3, `⚠ ${data.error}`);
        btn.disabled = false;
        txt.textContent = 'Confirm Booking ✓';
        return;
      }

      // Success!
      const [h] = selectedSlot.split(':').map(Number);
      const tl  = h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h-12}:00 PM`;
      const dl  = new Date(payload.date + 'T00:00:00').toLocaleDateString('en-IN',
                    { weekday:'long', year:'numeric', month:'long', day:'numeric' });

      document.getElementById('bk-success-msg').textContent =
        `Your consultation for "${payload.service}" has been booked. Booking ID: #${data.bookingId}`;
      document.getElementById('bk-success-details').innerHTML =
        `📅 <strong>${dl}</strong> at <strong>${tl}</strong><br>📞 We'll call <strong>${payload.phone}</strong> to confirm your appointment.`;

      const wa = `https://wa.me/919778742816?text=${encodeURIComponent(
        `Hi TravelBeez! I just booked a "${payload.service}" consultation.\nBooking ID: #${data.bookingId}\nDate: ${dl} at ${tl}\nName: ${payload.name}\nPhone: ${payload.phone}`
      )}`;
      document.getElementById('bk-whatsapp-link').href = wa;
      showPanel(4);
    } catch {
      setErr(3, '⚠ Could not connect to server. Please try again.');
      btn.disabled = false;
      txt.textContent = 'Confirm Booking ✓';
    }
  });

  // ─── Hook all "Book Now" buttons ──────────────────────────────────────────
  window.openBookingModal = openModal;

  document.addEventListener('click', e => {
    const btn = e.target.closest('#book-now-btn, .pkg-book-btn, #consult-fab, .learn-more-btn');
    if (btn) {
      if (btn.classList.contains('learn-more-btn') || btn.id === 'book-now-btn' || btn.id === 'consult-fab') {
        e.preventDefault();
        openModal();
      } else if (btn.classList.contains('pkg-book-btn')) {
        e.preventDefault();
        const card = btn.closest('.package-card');
        const pkgName = card?.querySelector('.pkg-name')?.textContent || '';
        openModal(pkgName.includes('Visa') ? 'Visa Consultation' : 'Holiday Package');
      }
    }
  });

})();
