import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import './index.css';
import App from './App';

// 根据环境配置API基础URL
const getApiBaseUrl = () => {
  // 开发环境下使用固定端口
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // 生产环境中（如Heroku），使用相同域名，不指定端口
  // Heroku会通过反向代理处理所有请求，无需指定端口
  return `${window.location.protocol}//${window.location.hostname}`;
};

// configure axios
axios.defaults.baseURL = getApiBaseUrl();
console.log('API base URL:', axios.defaults.baseURL);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 


//First, we need to start the server
//Second we need to start the frontend.
//Third, we could visit the web page for specific patient.
