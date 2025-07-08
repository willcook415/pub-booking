require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to serve frontend and parse data
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Booking route
app.post("/book", async (req, res) => {
    const { name, email, date, time, partySize, specialRequests } = req.body;

    console.log("📥 Booking request received:");
    console.log(req.body);

    // Email setup
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Pub Booking" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Pub Booking Confirmation",
        text: `Hi ${name},\n\nYour booking for ${partySize} on ${date} at ${time} has been received.\n\nSpecial requests: ${specialRequests || "None"}\n\nCheers! 🍻`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log("✅ Email sent successfully");
        res.json({ message: "Booking confirmed!" });
    } catch (err) {
        console.error("❌ Email sending failed:", err);
        res.status(500).json({ message: "Booking failed. Try again later." });
    }
});

// Fallback to index.html for any unknown routes
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
