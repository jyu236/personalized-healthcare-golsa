import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './HealthChatbot.css';

const HealthChatbot = ({ patientData }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [chatHistory, setChatHistory] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  const speechSynthesisRef = useRef(null);

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          setInputMessage(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }

    // Initialize speech synthesis
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }
    
    // Fetch chat history if patientData is available
    if (patientData && patientData.patient_id) {
      fetchChatHistory(patientData.patient_id);
    }
  }, [patientData]);

  const fetchChatHistory = async (patientId) => {
    try {
      const response = await axios.get(`/api/chat-history/${patientId}`);
      setChatHistory(response.data);
      
      // 只有在初始加载时(selectedDate === null)才设置默认日期
      // 这样在聊天过程中刷新历史记录就不会切换视图
      if (selectedDate === null) {
        const dates = Object.keys(response.data);
        if (dates.length > 0) {
          // 这里我们不自动选择日期，保持在Current Conversation
          // setSelectedDate(dates[0]); - 注释掉这行
        }
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const playMessage = (text) => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      
      // Split text into smaller chunks
      const chunks = [];
      let currentChunk = '';
      
      // Split by sentences while maintaining numbered list integrity
      text.split(/(?<=[.!?])\s+(?=(?:[^0-9]|$))/).forEach(sentence => {
        if ((currentChunk + sentence).length < 200) {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        } else {
          if (currentChunk) chunks.push(currentChunk);
          currentChunk = sentence;
        }
      });
      if (currentChunk) chunks.push(currentChunk);

      // Create speech queue
      let currentIndex = 0;
      const speakNextChunk = () => {
        if (currentIndex < chunks.length) {
          const utterance = new SpeechSynthesisUtterance(chunks[currentIndex].trim());
          utterance.lang = 'en-US';
          utterance.rate = 0.9;  // Slightly slower speech rate
          utterance.pitch = 1;
          utterance.volume = 1;
          
          utterance.onend = () => {
            currentIndex++;
            setTimeout(() => speakNextChunk(), 300);
          };
          
          speechSynthesisRef.current.speak(utterance);
        }
      };
      
      // Start playing the first chunk
      speakNextChunk();
    }
  };

  const startRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputMessage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await axios.post('/api/chat', {
        message: inputMessage,
        patientData: patientData
      });

      const botMessage = {
        type: 'bot',
        content: response.data.response
      };

      setMessages(prev => [...prev, botMessage]);
      
      // After getting a new response, refresh the chat history
      if (patientData && patientData.patient_id) {
        fetchChatHistory(patientData.patient_id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        type: 'error',
        content: 'Sorry, I encountered an error. Please try again.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="chatbot-container">
      <div className="chat-header">
        <h2>Health Assistant</h2>
        <p>Ask me anything about your health</p>
      </div>

      <div className="chat-history-selector">
        <label>View History: </label>
        <select 
          value={selectedDate || ''} 
          onChange={(e) => setSelectedDate(e.target.value)}
          disabled={Object.keys(chatHistory).length === 0}
        >
          <option value="">Current Conversation</option>
          {Object.keys(chatHistory).map(date => (
            <option key={date} value={date}>
              {formatDate(date)}
            </option>
          ))}
        </select>
      </div>

      <div className="chat-messages">
        {!selectedDate ? (
          // Show current conversation
          <>
            {messages.map((message, index) => (
              <div key={index} className={`message ${message.type}`}>
                <div className="message-content">
                  {message.content}
                  {message.type === 'bot' && (
                    <button 
                      className="play-button"
                      onClick={() => playMessage(message.content)}
                      title="Play audio"
                    >
                      🔊
                    </button>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message bot">
                <div className="message-content loading">
                  <span>.</span><span>.</span><span>.</span>
                </div>
              </div>
            )}
          </>
        ) : (
          // Show historical conversation for selected date
          <>
            {chatHistory[selectedDate]?.map((exchange, index) => (
              <div key={index} className="history-exchange">
                <div className="message user">
                  <div className="message-content">
                    <div className="message-time">{exchange.time}</div>
                    {exchange.question}
                  </div>
                </div>
                <div className="message bot">
                  <div className="message-content">
                    {exchange.response}
                    <button 
                      className="play-button"
                      onClick={() => playMessage(exchange.response)}
                      title="Play audio"
                    >
                      🔊
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input-form">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Type your health question here..."
          disabled={isLoading || isProcessing || (selectedDate !== null && selectedDate !== "")}
        />
        <button 
          type="button" 
          className={`voice-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isLoading || isProcessing || (selectedDate !== null && selectedDate !== "")}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <button 
          type="submit" 
          disabled={isLoading || isProcessing || (selectedDate !== null && selectedDate !== "")}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default HealthChatbot; 