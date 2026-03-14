// admin.js — TravelBeez Admin Dashboard Logic
(function() {
  const API = '';
  let token = localStorage.getItem('tb_admin_token') || null;

  // DOM Elements
  const els = {
    loginScreen: document.getElementById('login-screen'),
    dashboard: document.getElementById('dashboard'),
    loginForm: document.getElementById('login-form'),
    pwdInput: document.getElementById('login-password'),
    loginErr: document.getElementById('login-error'),
    logoutBtn: document.getElementById('logout-btn'),
    
    sections: {
      bookings: document.getElementById('section-bookings'),
      slots: document.getElementById('section-slots')
    },
    navLinks: document.querySelectorAll('.sidebar-link[data-section]'),
    pageTitle: document.getElementById('page-title'),
    pageSub: document.getElementById('page-sub'),
    
    // Stats
    sTotal: document.getElementById('stat-total'),
    sPending: document.getElementById('stat-pending'),
    sConfirmed: document.getElementById('stat-confirmed'),
    sCancelled: document.getElementById('stat-cancelled'),
    
    // Table & Filters
    tbody: document.getElementById('bookings-tbody'),
    count: document.getElementById('table-count'),
    fStatus: document.getElementById('filter-status'),
    fService: document.getElementById('filter-service'),
    fDate: document.getElementById('filter-date'),
    search: document.getElementById('search-input'),
    applyBtn: document.getElementById('apply-filters'),
    clearBtn: document.getElementById('clear-filters'),
    refreshBtn: document.getElementById('refresh-btn'),
    
    // Block Slots
    bDate: document.getElementById('block-date'),
    bSlot: document.getElementById('block-slot'),
    bReason: document.getElementById('block-reason'),
    bBlockBtn: document.getElementById('do-block'),
    bUnblockBtn: document.getElementById('do-unblock'),
    bMsg: document.getElementById('block-msg'),

    // Modal
    modal: document.getElementById('detail-overlay'),
    mClose: document.getElementById('detail-close'),
    mBody: document.getElementById('detail-body')
  };

  let allBookings = [];

  // ─── AUTHENTICATION ───────────────────────────────────────────────────────
  function checkAuth() {
    if (token) {
      els.loginScreen.style.display = 'none';
      els.dashboard.style.display = 'flex';
      loadDashboard();
    } else {
      els.loginScreen.style.display = 'flex';
      els.dashboard.style.display = 'none';
    }
  }

  els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = els.pwdInput.value;
    if (!password) return;
    
    try {
      const res = await fetch(`${API}/api/admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      
      if (res.ok && data.token) {
        token = data.token;
        localStorage.setItem('tb_admin_token', token);
        els.pwdInput.value = '';
        els.loginErr.textContent = '';
        checkAuth();
      } else {
        els.loginErr.textContent = data.error || 'Invalid password';
      }
    } catch {
      els.loginErr.textContent = 'Server connection failed.';
    }
  });

  els.logoutBtn.addEventListener('click', () => {
    token = null;
    localStorage.removeItem('tb_admin_token');
    checkAuth();
  });

  // ─── NAVIGATION ───────────────────────────────────────────────────────────
  els.navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sec = link.dataset.section;
      
      els.navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      Object.keys(els.sections).forEach(k => {
        els.sections[k].style.display = k === sec ? 'block' : 'none';
      });
      
      if (sec === 'bookings') {
        els.pageTitle.textContent = 'Bookings';
        els.pageSub.textContent = 'Manage all consultation appointments';
        loadBookings();
      } else {
        els.pageTitle.textContent = 'Block Slots';
        els.pageSub.textContent = 'Manage availability calendar';
      }
    });
  });

  // ─── DATA FETCHING ────────────────────────────────────────────────────────
  async function authFetch(url, options = {}) {
    if (!options.headers) options.headers = {};
    options.headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, options);
    if (res.status === 401) { token = null; localStorage.removeItem('tb_admin_token'); checkAuth(); throw new Error('Unauthorized'); }
    return res;
  }

  async function loadDashboard() {
    if (els.sections.bookings.style.display !== 'none') {
      await loadStats();
      await loadBookings();
    }
  }

  async function loadStats() {
    try {
      const res = await authFetch(`${API}/api/admin/stats`);
      const data = await res.json();
      els.sTotal.textContent = data.total || 0;
      els.sPending.textContent = data.pending || 0;
      els.sConfirmed.textContent = data.confirmed || 0;
      els.sCancelled.textContent = data.cancelled || 0;
    } catch (err) { console.error('Stats load failed', err); }
  }

  async function loadBookings() {
    els.tbody.innerHTML = `<tr><td colspan="10" class="table-loading">Loading bookings...</td></tr>`;
    
    // Build query
    const params = new URLSearchParams();
    if (els.fStatus.value) params.append('status', els.fStatus.value);
    if (els.fService.value) params.append('service', els.fService.value);
    if (els.fDate.value) params.append('date', els.fDate.value);
    
    try {
      const res = await authFetch(`${API}/api/admin/bookings?${params.toString()}`);
      allBookings = await res.json();
      renderTable();
    } catch (err) {
      els.tbody.innerHTML = `<tr><td colspan="10" class="table-loading" style="color:#ef4444">Error loading bookings.</td></tr>`;
    }
  }

  function renderTable() {
    const q = els.search.value.toLowerCase();
    const filtered = allBookings.filter(b => 
      b.name.toLowerCase().includes(q) || 
      b.phone.includes(q) || 
      (b.destination && b.destination.toLowerCase().includes(q))
    );
    
    els.count.textContent = `${filtered.length} Bookings found`;
    
    if (filtered.length === 0) {
      els.tbody.innerHTML = `<tr><td colspan="10" class="table-loading">No bookings found.</td></tr>`;
      return;
    }
    
    els.tbody.innerHTML = filtered.map(b => {
      const created = new Date(b.created_at).toLocaleDateString('en-GB', {day:'numeric', month:'short'});
      const bDate = new Date(b.date).toLocaleDateString('en-GB', {day:'numeric', month:'short', year:'numeric'});
      const bSlot = formatTime(b.time_slot);
      
      return `
      <tr>
        <td style="font-weight:600">#${b.id}</td>
        <td><strong>${b.name}</strong>${b.email ? `<br><span style="font-size:0.75rem;color:var(--text-muted)">${b.email}</span>` : ''}</td>
        <td>${b.phone}</td>
        <td>${b.service}</td>
        <td>${b.destination || '<span style="color:var(--text-muted)">—</span>'}</td>
        <td style="font-weight:600">${bDate}</td>
        <td>${bSlot}</td>
        <td><span class="badge ${b.status}">${b.status}</span></td>
        <td style="color:var(--text-muted)">${created}</td>
        <td>
          <div class="td-actions">
            <button class="btn-icon" onclick="viewBooking(${b.id})" title="View Details"><i data-lucide="eye"></i></button>
            ${b.status !== 'confirmed' ? `<button class="btn-icon" style="color:var(--success)" onclick="updateStatus(${b.id}, 'confirmed')" title="Confirm"><i data-lucide="check"></i></button>` : ''}
            ${b.status !== 'cancelled' ? `<button class="btn-icon" style="color:var(--warning)" onclick="updateStatus(${b.id}, 'cancelled')" title="Cancel"><i data-lucide="x"></i></button>` : ''}
            <button class="btn-icon" style="color:var(--danger)" onclick="deleteBooking(${b.id})" title="Delete"><i data-lucide="trash-2"></i></button>
          </div>
        </td>
      </tr>
      `;
    }).join('');
    
    lucide.createIcons();
  }

  // ─── ACTIONS ──────────────────────────────────────────────────────────────
  window.updateStatus = async function(id, status) {
    if (!confirm(`Are you sure you want to mark booking #${id} as ${status}?`)) return;
    try {
      await authFetch(`${API}/api/admin/bookings/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      loadDashboard();
    } catch (err) { alert('Failed to update status'); }
  };

  window.deleteBooking = async function(id) {
    if (!confirm(`DANGER: Are you sure you want to permanently delete booking #${id}?`)) return;
    try {
      await authFetch(`${API}/api/admin/bookings/${id}`, { method: 'DELETE' });
      loadDashboard();
    } catch (err) { alert('Failed to delete booking'); }
  };

  window.viewBooking = function(id) {
    const b = allBookings.find(x => x.id === id);
    if (!b) return;
    
    const created = new Date(b.created_at).toLocaleString('en-IN');
    const bDate = new Date(b.date).toLocaleDateString('en-IN', {weekday:'long', year:'numeric', month:'long', day:'numeric'});
    const bSlot = formatTime(b.time_slot);
    
    els.mBody.innerHTML = `
      <div class="detail-row"><div class="detail-label">Status</div><div class="detail-val"><span class="badge ${b.status}">${b.status}</span></div></div>
      <div class="detail-row"><div class="detail-label">Name</div><div class="detail-val"><p>${b.name}</p></div></div>
      <div class="detail-row"><div class="detail-label">Contact</div><div class="detail-val"><p>📞 ${b.phone}</p>${b.email ? `<p>✉️ ${b.email}</p>` : ''}</div></div>
      <div class="detail-row"><div class="detail-label">Service</div><div class="detail-val"><p>${b.service}</p></div></div>
      <div class="detail-row"><div class="detail-label">Destination</div><div class="detail-val"><p>${b.destination || 'Not specified'}</p></div></div>
      <div class="detail-row"><div class="detail-label">Appointment</div><div class="detail-val"><p style="font-weight:700;color:var(--primary)">${bDate}</p><p>${bSlot}</p></div></div>
      ${b.message ? `<div class="detail-row"><div class="detail-label">Client Notes</div><div class="detail-val"><p style="font-style:italic">"${b.message}"</p></div></div>` : ''}
      <div class="detail-row"><div class="detail-label">Created On</div><div class="detail-val"><p style="font-size:0.85rem">${created}</p></div></div>
      
      <div style="margin-top:24px;display:flex;gap:12px">
        <a href="https://wa.me/91${b.phone.replace(/\D/g,'')}?text=Hi%20${encodeURIComponent(b.name)},%20this%20is%20TravelBeez%20regarding%20your%20consultation." 
           target="_blank" class="btn-primary" style="background:#25d366;text-decoration:none;flex:1"><i data-lucide="message-circle"></i> Message on WhatsApp</a>
        <a href="tel:${b.phone}" class="btn-outline" style="flex:1;text-decoration:none;text-align:center"><i data-lucide="phone"></i> Call</a>
      </div>
    `;
    lucide.createIcons();
    els.modal.classList.add('open');
  };

  els.mClose.addEventListener('click', () => els.modal.classList.remove('open'));

  // ─── FILTER & EVENT LISTENERS ─────────────────────────────────────────────
  els.applyBtn.addEventListener('click', loadBookings);
  els.refreshBtn.addEventListener('click', loadDashboard);
  els.search.addEventListener('input', renderTable);
  els.clearBtn.addEventListener('click', () => {
    els.fStatus.value = ''; els.fService.value = ''; els.fDate.value = ''; els.search.value = '';
    loadBookings();
  });

  // ─── BLOCK SLOTS LOGIC ────────────────────────────────────────────────────
  function showBlockMsg(msg, isErr = false) {
    els.bMsg.textContent = msg;
    els.bMsg.className = 'block-msg ' + (isErr ? 'error' : 'success');
    setTimeout(() => { els.bMsg.textContent = ''; }, 4000);
  }

  els.bBlockBtn.addEventListener('click', async () => {
    const date = els.bDate.value, time_slot = els.bSlot.value, reason = els.bReason.value;
    if(!date) return showBlockMsg('Please select a date', true);
    try {
      await authFetch(`${API}/api/admin/block-slot`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time_slot, reason })
      });
      showBlockMsg(`✅ Slot blocked successfully.`);
    } catch { showBlockMsg('❌ Failed to block slot', true); }
  });

  els.bUnblockBtn.addEventListener('click', async () => {
    const date = els.bDate.value, time_slot = els.bSlot.value;
    if(!date) return showBlockMsg('Please select a date', true);
    try {
      await authFetch(`${API}/api/admin/block-slot`, {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, time_slot })
      });
      showBlockMsg(`✅ Slot unblocked successfully.`);
    } catch { showBlockMsg('❌ Failed to unblock slot', true); }
  });

  // ─── UTILS ────────────────────────────────────────────────────────────────
  function formatTime(slot) {
    const [h] = slot.split(':').map(Number);
    return h < 12 ? `${h}:00 AM` : h === 12 ? `12:00 PM` : `${h-12}:00 PM`;
  }

  // ─── INIT ─────────────────────────────────────────────────────────────────
  checkAuth();
})();
