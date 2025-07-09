const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader) return res.status(401).json({ message: 'Access denied. No token provided.' });

  const token = authHeader.split(' ')[1]; // Assuming: "Bearer <token>"

  if (!token) return res.status(401).json({ message: 'No token found in Authorization header' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // You can access req.user in next middleware/route
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};
