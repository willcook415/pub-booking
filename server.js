require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors({
  origin: [
    'https://thecuriouscatpub.netlify.app',       // customer booking page
    'https://thecuriouscatadmin.netlify.app'      // admin dashboard
  ],
  credentials: true,
}));
app.use(bodyParser.json());
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

// 📬 Public booking endpoint (handles non-logged-in bookings)
app.post('/api/book', async (req, res) => {
  console.log('📥 Booking request received:', req.body);
    const { name, email, date, time, partySize, specialRequests } = req.body;

    try {

        if (parseInt(partySize) > 8) {
            return res.status(400).json({ message: 'For groups of 9 or more, please call us directly to book.' });
        }

        const allowedTimes = [
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

        if (!allowedTimes.includes(time)) {
            return res.status(400).json({ message: 'Invalid booking time. Please choose a valid slot during opening hours.' });
        }


    // ✅ Save to DB
    const { Booking } = require('./models');
    await Booking.create({
      name,
      email,
      date,
      time,
      partySize,
      specialRequests
    });

    // ✅ Send confirmation email
    const msg = {
      to: email,
      from: process.env.FROM_EMAIL,
      subject: `Booking Confirmation - The Curious Cat Pub`,
      text: `Hi ${name},\n\nThank you for your booking at The Curious Cat Pub! Here are your details:\n\nDate: ${date}\nTime: ${time}\nParty Size: ${partySize}\nSpecial Requests: ${specialRequests || 'None'}\n\nWe look forward to seeing you!\n\nCheers,\nThe Curious Cat Pub Team`,
      html: `<p>Hi ${name},</p>
             <p>Thank you for your booking at <strong>The Curious Cat Pub</strong>! Here are your details:</p>
             <ul>
               <li><strong>Date:</strong> ${date}</li>
               <li><strong>Time:</strong> ${time}</li>
               <li><strong>Party Size:</strong> ${partySize}</li>
               <li><strong>Special Requests:</strong> ${specialRequests || 'None'}</li>
             </ul>
             <p>We look forward to seeing you!</p>
             <p>Cheers,<br>The Curious Cat Pub Team</p>`
    };

    await sgMail.send(msg);
    console.log('✅ Confirmation email sent.');
    res.status(200).json({ message: 'Booking successful and confirmation email sent!' });
  } catch (error) {
    console.error('❌ Booking failed:', error.response?.body || error.toString());
    res.status(500).json({ message: 'Booking failed. Please try again later.' });
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
