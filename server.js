require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sgMail = require('@sendgrid/mail');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'https://thecuriouscatpub.netlify.app'
}));
app.use(bodyParser.json());
app.use(express.static('public'));

// Set SendGrid API Key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// 📌 Import auth middleware and routes
const authMiddleware = require('./middleware/auth');
const authRoutes = require('./routes/auth');

const bookingRoutes = require('./routes/booking');
app.use('/api/booking', bookingRoutes);

// 📌 Mount auth routes at /api/auth (e.g., /api/auth/register and /api/auth/login)
app.use('/api/auth', authRoutes);

// ✅ Example protected route (test this with JWT)
app.get('/api/secret', authMiddleware, (req, res) => {
  res.json({ message: `Welcome, user ID: ${req.user.userId}. This route is protected.` });
});

app.post('/api/test', (req, res) => {
  console.log('✅ /api/test hit!');
  res.json({ message: 'Test successful!' });
});


// 📬 Booking endpoint (public for now, can be protected later)
app.post('/api/book', async (req, res) => {
  console.log('📥 Booking request received:');
  console.log(req.body);

  const { name, email, date, time, partySize, specialRequests } = req.body;

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

  try {
    await sgMail.send(msg);
    console.log('✅ Confirmation email sent.');
    res.status(200).json({ message: 'Booking successful and confirmation email sent!' });
  } catch (error) {
    console.error('❌ Email sending failed:', error.response?.body || error.toString());
    res.status(500).json({ message: 'Booking failed. Please try again later.' });
  }
});

const db = require('./models');

const { sequelize } = require('./models');

// Force Sequelize to sync the models to the DB
sequelize.sync({ force: true }).then(() => {
  console.log('Database synced ✅');
});


db.sequelize.sync().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
  });
});

