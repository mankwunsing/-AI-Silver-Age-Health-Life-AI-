const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');

/**
 * @file 代理伺服器：將前端請求轉發到 DeepSeek Chat Completions API
 * @description 提供 /api/chat POST 路由；並加入 GET 健康檢查與友善提示。
 */

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 提供當前資料夾的靜態資源（讓 /chart_renderer.js、/ai_chat.js 可被以絕對路徑載入）
app.use(express.static(path.resolve(__dirname)));

/**
 * @typedef {Object} ChatMessage
 * @property {('system'|'user'|'assistant')} role 角色
 * @property {string} content 內容
 */

/**
 * GET 根路由健康檢查
 */
app.get('/', (req, res) => {
    res.status(200).json({
        ok: true,
        message: 'Proxy server is running. Use POST /api/chat to send messages.'
    });
});

/**
 * GET /api/chat 友善提示（此端點僅支援 POST，GET 用於讓瀏覽器 "打開" 有回應）
 */
app.get('/api/chat', (req, res) => {
    res.status(405).json({
        ok: false,
        message: 'Method Not Allowed. Please POST to /api/chat with { model, messages }.'
    });
});

/**
 * POST /api/chat 將請求轉發到 DeepSeek API
 * @param {{model:string, messages:ChatMessage[]}} req.body 請求負載
 */
app.post('/api/chat', async (req, res) => {
    try {
        console.log('收到请求:', {
            body: req.body,
            authorization: req.headers.authorization
        });
        
        const response = await axios.post(
            'https://api.deepseek.com/v1/chat/completions',
            req.body,
            {
                headers: {
                    'Content-Type': 'application/json',
                    // 直接轉傳前端的 Authorization（請在前端以 Bearer <API_KEY> 形式提供）
                    'Authorization': req.headers.authorization
                }
            }
        );
        
        console.log('API响应成功:', response.data);
        res.json(response.data);
    } catch (error) {
        console.error('Error proxying to DeepSeek API:', error.response ? error.response.data : error.message);
        res.status(error.response ? error.response.status : 500).json({
            message: 'Error proxying to DeepSeek API',
            error: error.response ? error.response.data : error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Proxy server listening at http://localhost:${port}`);
});