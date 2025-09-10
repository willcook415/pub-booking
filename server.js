require('dotenv').config();
const SEND_EMAILS = process.env.SEND_EMAILS !== 'false';
const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 10000;

// ---- capacity config ----
const CAPACITY_PER_SLOT = Number(process.env.CAPACITY_PER_SLOT || 24);
const SLOT_LENGTH_MIN = 15;
const BOOKING_DURATION_MIN = 180; // 3 hours
const SLOTS_PER_BOOKING = BOOKING_DURATION_MIN / SLOT_LENGTH_MIN;

// if you already have ALLOWED_TIMES, re-use it; otherwise:
const ALLOWED_TIMES = [
    "11:00", "11:15", "11:30", "11:45",
    "12:00", "12:15", "12:30", "12:45",
    "13:00", "13:15", "13:30", "13:45",
    "14:00", "14:15", "14:30", "14:45",
    "15:00", "15:15", "15:30", "15:45",
    "16:00", "16:15", "16:30", "16:45",
    "17:00", "17:15", "17:30", "17:45",
    "18:00", "18:15", "18:30", "18:45",
    "19:00", "19:15", "19:30", "19:45",
    "20:00", "20:15", "20:30", "20:45",
    "21:00"
];


function slotsCoveredBy(start, times = ALLOWED_TIMES) {
    const idx = times.indexOf(start);
    if (idx < 0) return [];
    return times.slice(idx, idx + SLOTS_PER_BOOKING); // clamps at array end
}

async function wouldExceedCapacity({ date, time, partySize }) {
    const { Booking } = require('./models');
    const sameDay = await Booking.findAll({ where: { date } });

    // build current loads per slot
    const load = Object.fromEntries(ALLOWED_TIMES.map(t => [t, 0]));
    for (const b of sameDay) {
        for (const s of slotsCoveredBy(b.time)) {
            load[s] += Number(b.partySize || 0);
        }
    }

    // test with the new booking layered in
    for (const s of slotsCoveredBy(time)) {
        const after = load[s] + Number(partySize || 0);
        if (after > CAPACITY_PER_SLOT) {
            return { exceeds: true, slot: s, load: after, cap: CAPACITY_PER_SLOT };
        }
    }
    return { exceeds: false };
}


// Middleware
const allowedOrigins = [
    'https://thecuriouscatpub.netlify.app',
    'https://thecuriouscatadmin.netlify.app',
    'https://thecuriouscatpub.com',
    'https://www.thecuriouscatpub.com',
    'http://localhost:3000',     // React dev
    'http://localhost:5173',     // Vite dev
    'http://127.0.0.1:5500',     // VSCode Live Server (common)
];

// Allow localhost and file:// (Origin === null) in dev
const corsOptions = {
    origin(origin, cb) {
        if (!origin) return cb(null, true); // allow curl/Postman/file:// during dev
        return cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 204
};

// ⬇️ mount BEFORE routes
app.use(cors(corsOptions));
// explicitly handle preflight for every path
app.options('*', cors(corsOptions));

app.get('/api/health', (req, res) => {
    res.json({ ok: true, uptime: process.uptime() });
});

app.get('/api/ping', (_req, res) => res.json({ ok: true, ts: Date.now() }));

app.use(express.json());
// app.use(express.static('public'));

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 📌 Import auth middleware and routes
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/booking');

app.use('/api/auth', authRoutes);
app.use('/api/booking', bookingRoutes);

// ✅ Example protected route
app.get('/api/secret', authMiddleware, (req, res) => {
  res.json({ message: `Welcome, user ID: ${req.user.userId}. This route is protected.` });
});

// 🧪 Test route
app.post('/api/test', (req, res) => {
  console.log('✅ /api/test hit!');
  res.json({ message: 'Test successful!' });
});

const closedDaysRouter = require('./routes/closedDays');
const authenticateToken = require('./middleware/auth');

app.use('/api/closed-days', (req, res, next) => {
      if (req.method === 'GET') return next();   // list is public
      return authenticateToken(req, res, next);  // add/remove requires token
    }, closedDaysRouter)

const { Booking } = require('./models');

// 📬 Public booking endpoint (handles non-logged-in bookings)
app.post('/api/book', async (req, res) => {
    const { name, email, date, time, partySize, specialRequests } = req.body;
    console.log('📥 Booking request received:', { name, email, date, time, partySize });

    try {
        // --- Validation ---
        if (!name || !email || !date || !time || !partySize) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        if (parseInt(partySize, 10) > 8) {
            return res.status(400).json({ message: 'For groups of 9 or more, please call us directly to book.' });
        }

        
        if (!ALLOWED_TIMES.includes(time)) {
            return res.status(400).json({ message: 'Invalid booking time. Please choose a valid slot during opening hours.' });
        }

        // capacity check (3-hour window across 12×15min slots)
        const cap = await wouldExceedCapacity({ date, time, partySize });
        if (cap.exceeds) {
            return res.status(409).json({
                message: `Capacity exceeded at ${cap.slot} (${cap.load}/${cap.cap}). Please choose another time.`,
                slot: cap.slot, load: cap.load, capacity: cap.cap
            });
        }


        // --- Save to DB first ---
        const { Booking } = require('./models');
        const created = await Booking.create({
            name,
            email,
            date,
            time,
            partySize,
            specialRequests
        });

        let emailSent = false;
        if (SEND_EMAILS) {
            try {
                const msg = {
                    to: email,
                    from: process.env.FROM_EMAIL, // verified sender in SendGrid
                    subject: 'Booking Confirmation - The Curious Cat Pub',
                    text: `Hi ${name} ...`, // your text
                    html: `<p>Hi ${name} ...</p>` // your html
                };
                await sgMail.send(msg);
                emailSent = true;
                console.log('✅ Confirmation email sent.');
            } catch (mailErr) {
                console.error('❌ SendGrid error (booking saved):', mailErr?.response?.body || mailErr?.message || String(mailErr));
            }
        } else {
            console.log('✉️ Emails disabled via SEND_EMAILS=false');
        }

        return res.status(201).json({
            message: emailSent ? 'Booking successful and confirmation email sent!' : 'Booking successful. (Email not sent)',
            emailSent
        });



    } catch (error) {
        console.error('❌ Booking failed before save:', error?.message || error);
        return res.status(500).json({ message: 'Booking failed. Please try again later.' });
    }
});


// ✅ Sync DB & Start server
const { sequelize } = require('./models');

sequelize.sync().then(() => {
  console.log('Database synced ✅');
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
});
