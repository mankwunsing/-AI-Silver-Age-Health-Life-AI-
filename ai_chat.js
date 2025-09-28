document.addEventListener('DOMContentLoaded', () => {
    const openChatModalBtn = document.getElementById('open-ai-chat-modal-btn');

    const chatModalHTML = `
        <div id="ai-chat-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-2xl shadow-xl w-[90vw] max-w-2xl h-[80vh] flex flex-col transform transition-all duration-300 ease-in-out scale-95">
                <div class="p-4 border-b flex justify-between items-center bg-primary text-white rounded-t-2xl">
                    <h3 class="text-lg font-semibold">AI健康助手</h3>
                    <button id="close-ai-chat-modal-btn" class="text-white hover:text-gray-200">
                        <i class="fa fa-times"></i>
                    </button>
                </div>
                <div id="chat-box" class="flex-1 p-4 overflow-y-auto">
                    <div class="text-center text-gray-500">
                        <p>随时向我提问！</p>
                    </div>
                </div>
                <div class="p-4 border-t">
                    <div class="flex">
                        <input type="text" id="chat-input" class="flex-1 p-3 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary" placeholder="输入您的问题...">
                        <button id="send-chat-btn" class="bg-primary text-white px-6 py-3 rounded-r-lg hover:bg-primary-dark">
                            <i class="fa fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    let currentChatModal = null;

    function openChatModal() {
        // Remove any existing modal to prevent duplicates
        if (currentChatModal) {
            currentChatModal.remove();
        }

        // Create a new modal element
        const modalWrapper = document.createElement('div');
        modalWrapper.innerHTML = chatModalHTML;
        currentChatModal = modalWrapper.firstElementChild;
        document.body.appendChild(currentChatModal);

        // Attach event listeners to the new modal elements
        const closeAiChatModalBtn = currentChatModal.querySelector('#close-ai-chat-modal-btn');
        const sendChatBtn = currentChatModal.querySelector('#send-chat-btn');
        const chatInput = currentChatModal.querySelector('#chat-input');

        if (closeAiChatModalBtn) {
            closeAiChatModalBtn.addEventListener('click', closeChatModal);
        }
        if (sendChatBtn) {
            sendChatBtn.addEventListener('click', sendMessage);
        }
        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    }

    function closeChatModal() {
        if (currentChatModal) {
            currentChatModal.remove();
            currentChatModal = null;
        }
    }

    async function sendMessage() {
        const chatInput = currentChatModal.querySelector('#chat-input');
        const chatBox = currentChatModal.querySelector('#chat-box');
        const message = chatInput.value.trim();

        if (message === '') return;

        appendMessage(message, 'user');
        chatInput.value = '';
        chatBox.scrollTop = chatBox.scrollHeight;

        // Display typing indicator
        const typingIndicator = appendMessage('思考中...', 'ai-typing');
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            // 收集用戶健康數據
            const healthData = collectUserHealthData();
            
            // 構建包含健康數據的消息
            const enhancedMessage = buildEnhancedMessage(message, healthData);

            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer sk-ef5d339bf70b4f4d8e0657db5ba02d22' // Replace with your actual API key
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        { 
                            role: 'system', 
                            content: '你是一位專業的健康管理助手，專門為銀齡用戶提供健康建議。請基於用戶提供的健康數據，給出專業、個性化的健康建議。' 
                        },
                        { role: 'user', content: enhancedMessage }
                    ]
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            typingIndicator.remove(); // Remove typing indicator
            appendMessage(data.choices[0].message.content, 'ai');
        } catch (error) {
            console.error('Error sending message:', error);
            typingIndicator.remove(); // Remove typing indicator even on error
            appendMessage('抱歉，AI助手暂时无法回答您的问题。', 'ai-error');
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function appendMessage(text, sender) {
        const chatBox = currentChatModal.querySelector('#chat-box');
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', sender, 'mb-2', 'p-3', 'rounded-lg');

        if (sender === 'user') {
            messageElement.classList.add('bg-blue-500', 'text-white', 'ml-auto', 'max-w-[80%]');
            messageElement.style.cssText = 'margin-left: auto; background-color: #3B82F6; color: white;';
        } else if (sender === 'ai') {
            messageElement.classList.add('bg-gray-200', 'text-gray-800', 'mr-auto', 'max-w-[80%]');
            messageElement.style.cssText = 'margin-right: auto; background-color: #E5E7EB; color: #1F2937;';
        } else if (sender === 'ai-typing') {
            messageElement.classList.add('bg-gray-300', 'text-gray-700', 'mr-auto', 'max-w-[80%]', 'animate-pulse');
            messageElement.style.cssText = 'margin-right: auto; background-color: #D1D5DB; color: #374151;';
        } else if (sender === 'ai-error') {
            messageElement.classList.add('bg-red-200', 'text-red-800', 'mr-auto', 'max-w-[80%]');
            messageElement.style.cssText = 'margin-right: auto; background-color: #FECACA; color: #B91C1C;';
        }

        messageElement.textContent = text;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
        return messageElement;
    }

    if (openChatModalBtn) {
        openChatModalBtn.addEventListener('click', openChatModal);
    }

    /**
     * 收集用戶健康數據
     * @returns {Object} 用戶的健康數據
     */
    function collectUserHealthData() {
        try {
            // 從 localStorage 獲取健康記錄
            const healthRecords = JSON.parse(localStorage.getItem('healthRecords') || '[]');
            const deviceRecords = healthRecords.filter(record => record.device);
            
            // 獲取最新的智能設備數據
            const latestData = {
                bloodPressure: null,
                heartRate: null,
                temperature: null,
                spO2: null,
                lastUpdate: null
            };
            
            // 獲取最新的血壓數據
            const bpRecords = deviceRecords.filter(record => record.type === '血压' || record.type === '血壓').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            if (bpRecords.length > 0) {
                const latestBP = bpRecords[0];
                latestData.bloodPressure = {
                    systolic: latestBP.data.systolic,
                    diastolic: latestBP.data.diastolic,
                    pulse: latestBP.data.pulse,
                    assessment: latestBP.data.assessment,
                    time: latestBP.time
                };
            }
            
            // 獲取最新的血氧數據
            const spo2Records = deviceRecords.filter(record => record.type === '血氧').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            if (spo2Records.length > 0) {
                const latestSpO2 = spo2Records[0];
                latestData.spO2 = {
                    percent: latestSpO2.data.percent,
                    pi: latestSpO2.data.pi,
                    pr: latestSpO2.data.pr,
                    assessment: latestSpO2.data.assessment,
                    time: latestSpO2.time
                };
            }
            
            // 獲取最新的體溫數據
            const tempRecords = deviceRecords.filter(record => record.type === '体温' || record.type === '體溫').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            if (tempRecords.length > 0) {
                const latestTemp = tempRecords[0];
                latestData.temperature = {
                    value: latestTemp.data.value,
                    location: latestTemp.data.location,
                    assessment: latestTemp.data.assessment,
                    time: latestTemp.time
                };
            }
            
            // 獲取用藥記錄
            const medications = JSON.parse(localStorage.getItem('medications') || '[]');
            
            return {
                deviceData: latestData,
                medications: medications,
                totalRecords: healthRecords.length,
                deviceRecords: deviceRecords.length,
                lastUpdate: deviceRecords.length > 0 ? 
                    new Date(Math.max(...deviceRecords.map(r => new Date(r.timestamp)))).toLocaleDateString('zh-CN') : 
                    '無記錄'
            };
        } catch (error) {
            console.error('收集健康數據失敗:', error);
            return {
                deviceData: null,
                medications: [],
                totalRecords: 0,
                deviceRecords: 0,
                lastUpdate: '無記錄'
            };
        }
    }

    /**
     * 構建包含健康數據的增強消息
     * @param {string} userMessage 用戶原始消息
     * @param {Object} healthData 健康數據
     * @returns {string} 增強後的消息
     */
    function buildEnhancedMessage(userMessage, healthData) {
        let enhancedMessage = userMessage;
        
        // 如果有健康數據，添加到消息中
        if (healthData.deviceData && (healthData.deviceData.bloodPressure || healthData.deviceData.spO2 || healthData.deviceData.temperature)) {
            enhancedMessage += '\n\n我的健康數據：\n';
            
            if (healthData.deviceData.bloodPressure) {
                const bp = healthData.deviceData.bloodPressure;
                enhancedMessage += `- 血壓：${bp.systolic}/${bp.diastolic} mmHg，脈搏：${bp.pulse} bpm（${bp.time}）\n`;
            }
            
            if (healthData.deviceData.spO2) {
                const spo2 = healthData.deviceData.spO2;
                enhancedMessage += `- 血氧飽和度：${spo2.percent}%，灌注指數：${spo2.pi}%，脈搏率：${spo2.pr} bpm（${spo2.time}）\n`;
            }
            
            if (healthData.deviceData.temperature) {
                const temp = healthData.deviceData.temperature;
                enhancedMessage += `- 體溫：${temp.value}°C（${temp.location}，${temp.time}）\n`;
            }
            
            if (healthData.medications && healthData.medications.length > 0) {
                enhancedMessage += `\n我的用藥情況：\n`;
                healthData.medications.forEach(med => {
                    if (med.status === 'active') {
                        enhancedMessage += `- ${med.name}：${med.dosage}，${med.time}，${getFrequencyText(med.frequency)}\n`;
                    }
                });
            }
            
            enhancedMessage += `\n數據更新時間：${healthData.lastUpdate}`;
        } else {
            enhancedMessage += '\n\n注意：我還沒有錄入健康數據，請先使用智能設備數據錄入功能記錄您的健康狀況。';
        }
        
        return enhancedMessage;
    }

    /**
     * 獲取頻率文本
     * @param {string} frequency 頻率
     * @returns {string} 頻率文本
     */
    function getFrequencyText(frequency) {
        const frequencyMap = {
            'daily': '每日',
            'weekly': '每週',
            'monthly': '每月',
            'custom': '自定義'
        };
        return frequencyMap[frequency] || frequency;
    }
});