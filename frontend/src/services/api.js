import axios from 'axios';

// Update to your new backend URL
const API_URL = 'https://d_task_managent.vercel.app/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;