import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { connectSocket } from './websocket/socket';

if (localStorage.getItem('accessToken')) {
  connectSocket();
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
