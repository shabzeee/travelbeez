// database.js – Pure JSON File Storage
const fs = require('fs');
const path = require('path');

const dbFile = path.join(__dirname, 'travelbeez_db.json');

// ─── Initialize DB ─────────────────────────────────────────────────────────
function initDB() {
  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify({ bookings: [], blocked_slots: [], nextId: 1 }, null, 2));
  }
}
initDB();

function readDB() {
  const data = fs.readFileSync(dbFile, 'utf8');
  return JSON.parse(data);
}

function writeDB(data) {
  fs.writeFileSync(dbFile, JSON.stringify(data, null, 2));
}

// ─── Configuration ─────────────────────────────────────────────────────────
const SLOT_HOURS   = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
const MAX_PER_SLOT = 3;

// ─── Helpers ───────────────────────────────────────────────────────────────

/**
 * Returns array of { time_slot, available, booked } for a date.
 * Excludes slots in the past for today.
 */
function getAvailableSlots(dateStr) {
  const db = readDB();
  const now        = new Date();
  const isToday    = dateStr === now.toISOString().slice(0, 10);
  
  const blockedSet = new Set(
    db.blocked_slots.filter(b => b.date === dateStr).map(b => b.time_slot)
  );

  return SLOT_HOURS.map(slot => {
    if (blockedSet.has(slot)) return { time_slot: slot, available: false, booked: MAX_PER_SLOT };

    // Skip past slots for today
    if (isToday) {
      const [h, m] = slot.split(':').map(Number);
      const slotDate = new Date(now);
      slotDate.setHours(h, m, 0, 0);
      if (slotDate <= now) return { time_slot: slot, available: false, booked: MAX_PER_SLOT };
    }

    const cnt = db.bookings.filter(b => b.date === dateStr && b.time_slot === slot && b.status !== 'cancelled').length;
    return { time_slot: slot, available: cnt < MAX_PER_SLOT, booked: cnt };
  });
}

// ─── CRUD ──────────────────────────────────────────────────────────────────
const insertBooking = {
  run: (fields) => {
    const db = readDB();
    const id = db.nextId++;
    const newBooking = {
      id,
      ...fields,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    db.bookings.push(newBooking);
    writeDB(db);
    return { lastInsertRowid: id };
  }
};

const getAllBookings = {
  all: () => {
    const db = readDB();
    // Sort descending by date + time_slot
    return db.bookings.sort((a, b) => {
      const tA = a.date + ' ' + a.time_slot;
      const tB = b.date + ' ' + b.time_slot;
      return tB.localeCompare(tA);
    });
  }
};

const getBookingById = {
  get: (id) => readDB().bookings.find(b => b.id === id)
};

const updateStatus = {
  run: (status, id) => {
    const db = readDB();
    const idx = db.bookings.findIndex(b => b.id === id);
    if (idx !== -1) {
      db.bookings[idx].status = status;
      writeDB(db);
    }
  }
};

const deleteBooking = {
  run: (id) => {
    const db = readDB();
    db.bookings = db.bookings.filter(b => b.id !== id);
    writeDB(db);
  }
};

const getStats = {
  get: () => {
    const db = readDB();
    let pending = 0, confirmed = 0, cancelled = 0;
    db.bookings.forEach(b => {
      if (b.status === 'pending') pending++;
      else if (b.status === 'confirmed') confirmed++;
      else if (b.status === 'cancelled') cancelled++;
    });
    return { total: db.bookings.length, pending, confirmed, cancelled };
  }
};

const blockSlot = {
  run: (date, time_slot, reason) => {
    const db = readDB();
    // Remove if already exists
    db.blocked_slots = db.blocked_slots.filter(b => !(b.date === date && b.time_slot === time_slot));
    db.blocked_slots.push({ id: Date.now(), date, time_slot, reason });
    writeDB(db);
  }
};

const unblockSlot = {
  run: (date, time_slot) => {
    const db = readDB();
    db.blocked_slots = db.blocked_slots.filter(b => !(b.date === date && b.time_slot === time_slot));
    writeDB(db);
  }
};

module.exports = {
  SLOT_HOURS,
  MAX_PER_SLOT,
  getAvailableSlots,
  insertBooking,
  getAllBookings,
  getBookingById,
  updateStatus,
  deleteBooking,
  getStats,
  blockSlot,
  unblockSlot
};
