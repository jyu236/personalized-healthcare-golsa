const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
//const { HttpsProxyAgent } = require('https-proxy-agent');
const mysql = require('mysql2/promise');

// 数据库连接池
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

//const proxyAgent = new HttpsProxyAgent('http://127.0.0.1:10809');

const openai = new OpenAI({
  baseURL: "https://xiaoai.plus/v1",
  apiKey: OPENAI_API_KEY,
  //httpAgent: proxyAgent
});

// 
console.log('Initializing OpenAI with API key:', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');

router.post('/api/chat', async (req, res) => {
  try {
    const { message, patientData } = req.body;

    // prepare the health context of patient.
    const healthSummary = prepareHealthContext(patientData);

    const prompt = `
      As a healthcare assistant, please provide advice based on the following patient data and question.
      
      Patient Health Context:
      ${healthSummary}

      Patient Question: ${message}

      Please provide a helpful, accurate, and compassionate response based on the patient's specific health situation.
      Focus on evidence-based recommendations while maintaining a friendly tone.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a knowledgeable healthcare assistant providing personalized health advice based on patient data. Always consider the patient's full health context when giving advice."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    
    // 保存聊天记录到数据库
    try {
      const patientId = patientData.patient_id || 'unknown';
      await pool.execute(
        'INSERT INTO chat_history (patient_id, question, response_text) VALUES (?, ?, ?)',
        [patientId, message, aiResponse]
      );
      console.log('Chat history saved to database');
    } catch (dbError) {
      console.error('Database error:', dbError);
      // 不中断响应，即使数据库保存失败
    }

    res.json({ response: aiResponse });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Failed to get response from AI' });
  }
});

// 获取患者历史聊天记录的新端点
router.get('/api/chat-history/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const [rows] = await pool.execute(
      'SELECT question, response_text, DATE(created_at) as date, TIME(created_at) as time FROM chat_history WHERE patient_id = ? ORDER BY created_at DESC',
      [patientId]
    );
    
    // 按日期分组
    const groupedByDate = {};
    rows.forEach(row => {
      if (!groupedByDate[row.date]) {
        groupedByDate[row.date] = [];
      }
      groupedByDate[row.date].push({
        question: row.question,
        response: row.response_text,
        time: row.time
      });
    });
    
    res.json(groupedByDate);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

function prepareHealthContext(patientData) {
  return `
    Key Health Indicators:
    - Age: ${patientData.patient_age}
    - Gender: ${patientData.patient_gender}
    - BMI: ${patientData.vital_bmi}
    - Blood Pressure: ${patientData.vital_systolic_bp}/${patientData.vital_diastolic_bp}
    - Heart Rate: ${patientData.vital_heart_rate}
    - Diabetes Status: ${patientData.cad_diabetes ? 'Yes' : 'No'}
    - Hypertension: ${patientData.ckd_hypertension ? 'Yes' : 'No'}
    - Cholesterol Levels:
      * Total: ${patientData.blood_tc}
      * HDL: ${patientData.blood_hdl}
      * LDL: ${patientData.blood_ldl}
    - Blood Glucose: ${patientData.cad_glucose}
    
    Recent Health Metrics:
    - Blood Pressure Medication: ${patientData.cad_bp_meds ? 'Yes' : 'No'}
    - Hemoglobin: ${patientData.ckd_haemoglobin}
    - Kidney Function:
      * Creatinine: ${patientData.ckd_serum_creatinine}
      * Albumin: ${patientData.ckd_albumin}
  `;
}

module.exports = router; 