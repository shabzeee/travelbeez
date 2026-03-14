// server.js – TravelBeez Express Backend
require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const bcrypt   = require('bcryptjs');
const path     = require('path');

const {
  getAvailableSlots,
  insertBooking,
  getAllBookings,
  getBookingById,
  updateStatus,
  deleteBooking,
  getStats,
  blockSlot,
  unblockSlot
} = require('./database');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Admin credentials ─────────────────────────────────────────────────────
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_TOKEN    = Buffer.from(`travelbeez:${ADMIN_PASSWORD}`).toString('base64');

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname))); // Serve frontend files

// ─── Auth Middleware ────────────────────────────────────────────────────────
function adminAuth(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth || auth !== `Bearer ${ADMIN_TOKEN}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// ─── Validation helpers ────────────────────────────────────────────────────
const SERVICES = [
  'Visa Consultation', 'Holiday Package', 'Flight Booking',
  'Hotel Booking', 'Custom Tour', 'Travel Insurance'
];
const VALID_STATUSES = ['pending', 'confirmed', 'cancelled'];

function isValidDate(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const day = d.getDay(); // 0=Sun,6=Sat
  if (day === 0) return false; // No Sundays
  const today = new Date(); today.setHours(0,0,0,0);
  return d >= today;
}

// ─── PUBLIC ROUTES ──────────────────────────────────────────────────────────

/**
 * GET /api/slots?date=YYYY-MM-DD
 * Returns all slots with availability for the given date
 */
app.get('/api/slots', (req, res) => {
  const { date } = req.query;
  if (!date || !isValidDate(date)) {
    return res.status(400).json({ error: 'Invalid or past date. Must be a future Mon–Sat.' });
  }
  try {
    const slots = getAvailableSlots(date);
    res.json({ date, slots });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch slots', detail: err.message });
  }
});

/**
 * POST /api/bookings
 * Body: { name, email, phone, service, destination, date, time_slot, message }
 */
app.post('/api/bookings', (req, res) => {
  const { name, email, phone, service, destination, date, time_slot, message } = req.body;

  // — Validate required fields —
  const missing = [];
  if (!name?.trim())        missing.push('name');
  if (!phone?.trim())       missing.push('phone');
  if (!service?.trim())     missing.push('service');
  if (!date?.trim())        missing.push('date');
  if (!time_slot?.trim())   missing.push('time_slot');
  if (missing.length)       return res.status(400).json({ error: `Missing fields: ${missing.join(', ')}` });

  if (!SERVICES.includes(service)) return res.status(400).json({ error: 'Invalid service type' });
  if (!isValidDate(date))          return res.status(400).json({ error: 'Invalid or past date (Mon–Sat only)' });

  // — Check slot availability —
  const slots = getAvailableSlots(date);
  const slot  = slots.find(s => s.time_slot === time_slot);
  if (!slot)              return res.status(400).json({ error: 'Invalid time slot' });
  if (!slot.available)    return res.status(409).json({ error: 'This slot is fully booked. Please choose another time.' });

  try {
    const result = insertBooking.run({ name, email: email || '', phone, service, destination: destination || '', date, time_slot, message: message || '' });
    res.status(201).json({
      success: true,
      message: 'Booking confirmed! We will contact you shortly.',
      bookingId: result.lastInsertRowid
    });
  } catch (err) {
    res.status(500).json({ error: 'Booking failed', detail: err.message });
  }
});

// ─── ADMIN ROUTES ───────────────────────────────────────────────────────────

/**
 * POST /api/admin/login
 * Body: { password }
 */
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  if (!password || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid password' });
  }
  res.json({ token: ADMIN_TOKEN, message: 'Login successful' });
});

/**
 * GET /api/admin/stats  [protected]
 */
app.get('/api/admin/stats', adminAuth, (req, res) => {
  try { res.json(getStats.get()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * GET /api/admin/bookings?status=&date=&service=  [protected]
 */
app.get('/api/admin/bookings', adminAuth, (req, res) => {
  try {
    let bookings = getAllBookings.all();
    const { status, date, service } = req.query;
    if (status)  bookings = bookings.filter(b => b.status === status);
    if (date)    bookings = bookings.filter(b => b.date === date);
    if (service) bookings = bookings.filter(b => b.service === service);
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * PATCH /api/admin/bookings/:id  [protected]
 * Body: { status: 'confirmed'|'cancelled'|'pending' }
 */
app.patch('/api/admin/bookings/:id', adminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const existing = getBookingById.get(id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });

  try {
    updateStatus.run(status, id);
    res.json({ success: true, id, status });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * DELETE /api/admin/bookings/:id  [protected]
 */
app.delete('/api/admin/bookings/:id', adminAuth, (req, res) => {
  const id = parseInt(req.params.id);
  const existing = getBookingById.get(id);
  if (!existing) return res.status(404).json({ error: 'Booking not found' });

  try {
    deleteBooking.run(id);
    res.json({ success: true, message: `Booking #${id} deleted` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * POST /api/admin/block-slot  [protected]
 * Body: { date, time_slot, reason }
 */
app.post('/api/admin/block-slot', adminAuth, (req, res) => {
  const { date, time_slot, reason } = req.body;
  if (!date || !time_slot) return res.status(400).json({ error: 'date and time_slot required' });
  try {
    blockSlot.run(date, time_slot, reason || '');
    res.json({ success: true, message: `Slot ${date} ${time_slot} blocked` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

/**
 * DELETE /api/admin/block-slot  [protected]
 * Body: { date, time_slot }
 */
app.delete('/api/admin/block-slot', adminAuth, (req, res) => {
  const { date, time_slot } = req.body;
  try {
    unblockSlot.run(date, time_slot);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── 404 fallback ───────────────────────────────────────────────────────────
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  } else {
    res.sendFile(path.join(__dirname, 'index.html'));
  }
});

// ─── Start ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🐝 TravelBeez Backend running at http://localhost:${PORT}`);
  console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin.html`);
  console.log(`🔑 Admin password: ${ADMIN_PASSWORD}\n`);
});
