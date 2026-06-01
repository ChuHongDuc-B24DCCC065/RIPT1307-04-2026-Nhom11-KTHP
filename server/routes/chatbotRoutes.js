const express = require('express');
const router = express.Router();

// Hệ thống câu lệnh hướng dẫn (System Instruction) cho AI
const SYSTEM_INSTRUCTION = "Bạn là một Trợ lý ảo hỗ trợ sinh viên thông minh, thân thiện. Hãy dùng tiếng Việt lịch sự, xưng hô 'Mình' và 'Bạn'. Chỉ trả lời các thắc mắc liên quan đến đời sống sinh viên, học tập, quy chế dựa trên dữ liệu được huấn luyện. Nếu không biết hoặc thông tin nằm ngoài phạm vi, hãy hướng dẫn sinh viên liên hệ Phòng Đào tạo, tuyệt đối không tự bịa thông tin.";

// POST /api/chatbot/ask
router.post('/ask', async (req, res) => {
    const { message, history } = req.body;

    if (!message || message.trim() === '') {
        return res.status(400).json({ success: false, message: 'Nội dung tin nhắn không được để trống!' });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Kiểm tra cấu hình API Key
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
        console.warn('⚠️ Cảnh báo: Chưa cấu hình GEMINI_API_KEY trong file .env');
        return res.json({ 
            success: true, 
            reply: "Chào bạn! Hiện tại Trợ lý ảo sinh viên chưa được cấu hình API Key từ nhà quản trị hệ thống. Vui lòng cấu hình biến môi trường `GEMINI_API_KEY` trong file `server/.env` ở Backend để mình có thể trò chuyện cùng bạn nhé!" 
        });
    }

    try {
        // Chuyển đổi lịch sử trò chuyện sang định dạng chuẩn của Gemini API
        // Định dạng của Gemini: { role: "user"|"model", parts: [{ text: "nội dung" }] }
        const contents = [];
        
        if (Array.isArray(history)) {
            history.forEach(item => {
                if (item.text && item.sender) {
                    contents.push({
                        role: item.sender === 'student' ? 'user' : 'model',
                        parts: [{ text: item.text }]
                    });
                }
            });
        }

        // Thêm câu hỏi hiện tại vào cuối danh sách contents
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        // Tạo request body cho Gemini REST API
        const requestBody = {
            contents: contents,
            systemInstruction: {
                parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1000,
            }
        };

        // Gọi REST API của Gemini 2.5 Flash
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Lỗi từ Gemini API:', errorData);
            throw new Error(errorData.error?.message || `Lỗi API (${response.status})`);
        }

        const data = await response.json();
        
        // Trích xuất câu trả lời từ cấu trúc phản hồi của Gemini
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            throw new Error('Gemini API không trả về nội dung hợp lệ.');
        }

        res.json({
            success: true,
            reply: reply
        });

    } catch (error) {
        console.error('❌ Lỗi khi xử lý chatbot AI:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Đã xảy ra lỗi khi kết nối với máy chủ AI. Vui lòng thử lại sau ít phút!',
            error: error.message 
        });
    }
});

module.exports = router;
