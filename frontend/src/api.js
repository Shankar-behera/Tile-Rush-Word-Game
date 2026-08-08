import axios from 'axios';

// In dev this falls back to your local backend. For a production/mobile build,
// set REACT_APP_API_URL in a .env file (see README) so the app points at your
// deployed backend instead of localhost.
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

export default API;
