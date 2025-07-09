// src/App.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

    const API_BASE = 'https://pub-booking-backend.onrender.com/';

  const login = async () => {
    try {
      const res = await axios.post(`${API_BASE}/api/auth/login`, { email, password });
      localStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setError('');
    } catch (err) {
      setError('Login failed');
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/booking/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(res.data);
    } catch (err) {
      setError('Failed to fetch bookings');
    }
  };

  useEffect(() => {
    if (token) fetchBookings();
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Admin Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-2 px-4 py-2 border rounded w-64"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 px-4 py-2 border rounded w-64"
        />
        <button
          onClick={login}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Log In
        </button>
        {error && <p className="mt-2 text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold mb-6">Pub Booking Admin Dashboard</h1>
      <button
        onClick={() => {
          localStorage.removeItem('token');
          setToken('');
        }}
        className="mb-4 px-4 py-2 bg-red-500 text-white rounded"
      >
        Log Out
      </button>
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Date</th>
            <th className="border p-2">Time</th>
            <th className="border p-2">Party Size</th>
            <th className="border p-2">Requests</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.id}>
              <td className="border p-2">{b.name}</td>
              <td className="border p-2">{b.email}</td>
              <td className="border p-2">{new Date(b.date).toLocaleDateString()}</td>
              <td className="border p-2">{b.time}</td>
              <td className="border p-2">{b.partySize}</td>
              <td className="border p-2">{b.specialRequests}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && <p className="mt-4 text-red-600">{error}</p>}
    </div>
  );
}

export default App;
