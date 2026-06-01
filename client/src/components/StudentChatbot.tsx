import React, { useState, useRef, useEffect } from 'react';
import { 
  CommentOutlined, 
  CloseOutlined, 
  SendOutlined, 
  ClearOutlined,
  RobotOutlined,
  UserOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import axiosInstance from '../utils/axiosConfig';
import './StudentChatbot.css';

interface Message {
  sender: 'student' | 'ai';
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  "Quy chế đăng ký môn học?",
  "Cách tính điểm tích lũy GPA?",
  "Liên hệ Phòng Đào tạo ở đâu?"
];

export const StudentChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: 'Chào bạn! Mình là **Trợ lý ảo Sinh viên** 🤖\n\nMình có thể hỗ trợ giải đáp các thắc mắc của bạn về **học tập, quy chế học vụ, đăng ký tín chỉ và các vấn đề đời sống sinh viên**. Bạn muốn hỏi mình điều gì?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tự động cuộn xuống khi có tin nhắn mới hoặc đang load
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isLoading, isOpen]);

  // Hàm chuyển đổi Markdown cơ bản sang HTML an toàn
  const renderMessageContent = (text: string) => {
    // Tách dòng
    const lines = text.split('\n');
    return lines.map((line, lineIndex) => {
      let elementContent: React.ReactNode = line;
      
      // Xử lý in đậm **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      if (boldRegex.test(line)) {
        const parts = line.split(boldRegex);
        elementContent = parts.map((part, partIndex) => {
          // Vị trí lẻ trong mảng sau split của regex là các chuỗi nằm giữa dấu **
          return partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part;
        });
      }

      // Xử lý gạch đầu dòng (bullet point)
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const content = line.trim().substring(2);
        // Kiểm tra in đậm trong gạch đầu dòng
        let finalContent: React.ReactNode = content;
        if (boldRegex.test(content)) {
          const parts = content.split(boldRegex);
          finalContent = parts.map((part, partIndex) => {
            return partIndex % 2 === 1 ? <strong key={partIndex}>{part}</strong> : part;
          });
        }
        return (
          <ul key={lineIndex} className="chatbot-bullet-list">
            <li>{finalContent}</li>
          </ul>
        );
      }

      return (
        <div key={lineIndex} className="chatbot-text-line">
          {elementContent}
        </div>
      );
    });
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    // Thêm tin nhắn sinh viên gửi vào state
    const studentMsg: Message = {
      sender: 'student',
      text: textToSend,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, studentMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Chuẩn bị lịch sử chat để gửi lên Backend giúp AI giữ ngữ cảnh
      // Chỉ gửi nội dung text và sender
      const chatHistory = messages.map(msg => ({
        sender: msg.sender,
        text: msg.text
      }));

      const response = await axiosInstance.post('/chatbot/ask', {
        message: textToSend,
        history: chatHistory
      });

      if (response.data && response.data.success) {
        setMessages(prev => [...prev, {
          sender: 'ai',
          text: response.data.reply,
          timestamp: new Date()
        }]);
      } else {
        throw new Error(response.data.message || 'Lỗi không xác định từ server');
      }

    } catch (error: any) {
      console.error('Lỗi khi chat với AI:', error);
      setMessages(prev => [...prev, {
        sender: 'ai',
        text: '❌ **Lỗi kết nối**: Mình tạm thời không kết nối được với máy chủ AI. Bạn hãy thử kiểm tra lại kết nối mạng hoặc thử lại sau nhé!',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSendMessage(inputValue);
    }
  };

  const handleResetChat = () => {
    if (window.confirm('Bạn có muốn xóa cuộc hội thoại này và bắt đầu lại?')) {
      setMessages([
        {
          sender: 'ai',
          text: 'Chào bạn! Mình đã sẵn sàng hỗ trợ giải đáp các câu hỏi mới từ bạn. Cứ tự nhiên đặt câu hỏi nhé!',
          timestamp: new Date()
        }
      ]);
    }
  };

  return (
    <div className="student-chatbot-container">
      {/* 1. WIDGET BONG BÓNG CHAT NỔI */}
      <button 
        className={`chatbot-trigger-bubble ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Trợ lý sinh viên AI"
        id="chatbot-trigger-button"
      >
        {isOpen ? (
          <CloseOutlined className="trigger-icon rotate" />
        ) : (
          <div className="trigger-icon-wrapper">
            <CommentOutlined className="trigger-icon pulse" />
            <span className="trigger-badge">AI</span>
          </div>
        )}
      </button>

      {/* 2. KHUNG HỘI THOẠI CHAT BOX */}
      <div className={`chatbot-chatbox ${isOpen ? 'open' : ''}`}>
        
        {/* HEADER CHAT BOX */}
        <div className="chatbot-header">
          <div className="chatbot-header-info">
            <div className="chatbot-avatar-container">
              <div className="chatbot-header-avatar">
                <RobotOutlined />
              </div>
              <span className="chatbot-status-dot online"></span>
            </div>
            <div>
              <h4 className="chatbot-title">Student AI Assistant</h4>
              <p className="chatbot-subtitle">Trực tuyến hỗ trợ 24/7</p>
            </div>
          </div>
          <div className="chatbot-header-actions">
            <button 
              className="chatbot-header-btn reset-btn" 
              onClick={handleResetChat} 
              title="Làm mới cuộc trò chuyện"
            >
              <ClearOutlined />
            </button>
            <button 
              className="chatbot-header-btn close-btn" 
              onClick={() => setIsOpen(false)}
              title="Đóng khung chat"
            >
              <CloseOutlined />
            </button>
          </div>
        </div>

        {/* CẢNH BÁO PHẠM VI TRẢ LỜI */}
        <div className="chatbot-disclaimer">
          <InfoCircleOutlined className="disclaimer-icon" />
          <span>Chỉ hỗ trợ giải đáp các quy chế, đời sống & học tập sinh viên.</span>
        </div>

        {/* NỘI DUNG ĐOẠN HỘI THOẠI */}
        <div className="chatbot-messages-area">
          {messages.map((msg, index) => (
            <div 
              key={index} 
              className={`chatbot-message-row ${msg.sender === 'student' ? 'student-row' : 'ai-row'}`}
            >
              {msg.sender === 'ai' && (
                <div className="message-avatar ai-avatar">
                  <RobotOutlined />
                </div>
              )}
              
              <div className="message-bubble-wrapper">
                <div className="message-bubble">
                  {renderMessageContent(msg.text)}
                </div>
                <span className="message-time">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              {msg.sender === 'student' && (
                <div className="message-avatar student-avatar">
                  <UserOutlined />
                </div>
              )}
            </div>
          ))}

          {/* HIỆU ỨNG AI ĐANG NHẬP TIN NHẮN (TYPING INDICATOR) */}
          {isLoading && (
            <div className="chatbot-message-row ai-row">
              <div className="message-avatar ai-avatar">
                <RobotOutlined />
              </div>
              <div className="message-bubble-wrapper">
                <div className="message-bubble typing-bubble">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* GỢI Ý CÂU HỎI NHANH (QUICK PROMPTS) */}
        {messages.length <= 2 && !isLoading && (
          <div className="chatbot-quick-prompts">
            {QUICK_PROMPTS.map((prompt, index) => (
              <button 
                key={index} 
                className="quick-prompt-btn"
                onClick={() => handleSendMessage(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* KHU VỰC NHẬP CÂU HỎI */}
        <div className="chatbot-input-area">
          <input
            type="text"
            className="chatbot-input-field"
            placeholder="Nhập câu hỏi của bạn..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
            maxLength={500}
          />
          <button 
            className="chatbot-send-btn" 
            onClick={() => handleSendMessage(inputValue)}
            disabled={!inputValue.trim() || isLoading}
            title="Gửi tin nhắn"
          >
            <SendOutlined />
          </button>
        </div>

      </div>
    </div>
  );
};

export default StudentChatbot;
