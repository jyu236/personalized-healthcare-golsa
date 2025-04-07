const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const chatController = require('./chatController');
const { HttpsProxyAgent } = require('https-proxy-agent');
const fileUpload = require('express-fileupload');
const mysql = require('mysql2');

// set up agent
//const proxyUrl = 'http://127.0.0.1:10809'; // change port based on agent
//const httpsAgent = new HttpsProxyAgent(proxyUrl);

// configure axios 
axios.defaults.proxy = false;
//axios.defaults.httpsAgent = httpsAgent;

// add log
console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Not set');
console.log('NODE_ENV:', process.env.NODE_ENV);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 限制10MB
}));

// get the information of patient
app.get('/api/patient-health-summary/:patientId', async (req, res) => {
  try {
    // send axios request
    const response = await axios.get('https://e-react-node-backend-22ed6864d5f3.herokuapp.com/table/unified_patient_info', {
      //httpsAgent: httpsAgent,
      //proxy: false
    });
    
    const allPatients = response.data;
    
    // find the specific patient based on id
    const patientData = allPatients.find(patient => patient.patient_id === parseInt(req.params.patientId));

    if (patientData) {
      return res.json(patientData);
    }

    // using mock data if not found
    console.log('Patient not found, using mock data');
    return res.json(getMockPatientData(req.params.patientId));

  } catch (error) {
    console.error('Error fetching patient data, falling back to mock data:', error);
    return res.json(getMockPatientData(req.params.patientId));
  }
});

// mock data
function getMockPatientData(patientId) {
  return {
    patient_id: parseInt(patientId),
    first_name: "John",
    last_name: "Doe",
    patient_age: 45,
    patient_gender: "Male",
    vital_bmi: 24.5,
    vital_systolic_bp: 120,
    vital_diastolic_bp: 80,
    vital_heart_rate: 72,
    vital_temperature: 36.6,
    cad_diabetes: 0,
    ckd_hypertension: 0,
    blood_tc: 180,
    blood_hdl: 50,
    blood_ldl: 100,
    cad_glucose: 95,
    cad_bp_meds: 0,
    ckd_haemoglobin: 14,
    ckd_serum_creatinine: 1.0,
    ckd_albumin: 4.0
  };
}

// using chat controller route
app.use(chatController);

// 在生产环境中提供前端构建文件
if (process.env.NODE_ENV === 'production') {
  // 静态文件
  app.use(express.static(path.join(__dirname, '../../build')));
  
  // 所有未匹配的请求返回index.html
  app.get('*', (req, res) => {
    // 排除API路由
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../../build', 'index.html'));
    }
  });
}

// error process
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 修改端口配置以适应Heroku
const PORT = process.env.PORT || process.env.SERVER_PORT || 3000;

// start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// deal with Promise rejection
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
});

// 正确的连接池配置
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 所有数据库操作使用promise()包装
const promisePool = pool.promise();

// 修复数据库连接测试函数
async function testDatabaseConnection() {
  let conn;
  try {
    console.log('Testing database connection...');
    // 使用promise()包装来确保使用Promise API
    conn = await pool.promise().getConnection();
    console.log('Database connection successful!');
  } catch (err) {
    console.error('Database connection failed:', err);
  } finally {
    // 确保只在conn存在时才释放连接
    if (conn) conn.release();
  }
}

// 或者更简单的测试方式
async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    // 直接执行简单查询测试连接
    const [result] = await pool.promise().query('SELECT 1');
    console.log('Database connection successful!', result);
  } catch (err) {
    console.error('Database connection failed:', err);
  }
}

module.exports = app; 