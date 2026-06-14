"use client";

import { useState, useRef, useEffect } from "react";

export default function Chatbot() {
  interface Message {
    sender: string;
    text: string;
    audio?: string;
  }

  const [messages, setMessages] = useState<Message[]>([]); // Store chat messages (text and voice)
  const [inputValue, setInputValue] = useState(""); // Store input value for text
  const [isRecording, setIsRecording] = useState(false); // Track if recording is active
  const [audioUrl, setAudioUrl] = useState<string | undefined>(undefined); // Store the audio URL for playback
  const [selectedLanguage, setSelectedLanguage] = useState("English"); // Store the selected language
  const mediaRecorderRef = useRef<MediaRecorder | null>(null); // MediaRecorder reference to manage recording
  const audioChunksRef = useRef([]); // Store the audio data

  // Ref for the last message element to scroll into view
  const endOfMessagesRef = useRef<HTMLDivElement | null>(null);

  // Function to scroll to the latest message
  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle sending text messages
  const handleSend = async () => {
    if (inputValue.trim() === "") return;

    const userMessage = { sender: "user", text: inputValue };
    setMessages([...messages, userMessage]);

    // Send text message to backend and handle the response
    await sendMessageToBackend(userMessage.text);

    setInputValue(""); // Clear input field
  };

  // Scroll to the bottom when messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Start recording audio
  const startRecording = () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Your browser does not support audio recording.");
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (e) => {
          audioChunksRef.current.push(e.data);
        };
        mediaRecorderRef.current.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/wav",
          });
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url); // Save the audio for playback
          audioChunksRef.current = []; // Reset the chunks

          // Send audio blob to backend and handle the response
          await sendAudioToBackend(audioBlob);
        };
        mediaRecorderRef.current.start();
        setIsRecording(true);
      })
      .catch((err) => {
        console.error("Error accessing microphone:", err);
      });
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Function to send audio to the backend
  const sendAudioToBackend = async (audioBlob: Blob) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.wav");
    formData.append("language", selectedLanguage); // Include the selected language

    try {
      const response = await fetch("http://localhost:5000/api/upload-audio", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to send audio to the backend");
      }

      const data = await response.json();
      console.log("Audio successfully uploaded:", data);

      // Update the messages with the server response (transcription or status)
      const botMessage = {
        sender: "bot",
        text: data.transcription || "Audio received!",
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]);

      const audioBuffer = Buffer.from(data.audio, "base64"); // Decoding base64 to binary
      const blob = new Blob([audioBuffer], { type: "audio/wav" });

      // Create a URL for the Blob and play the audio
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audio.play();
    } catch (error) {
      console.error("Error sending audio:", error);
    }
  };

  // Function to send a text message to the backend
  const sendMessageToBackend = async (messageText: string) => {
    try {
      const response = await fetch("http://localhost:5000/api/send-message", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message to the backend");
      }

      const data = await response.json();
      console.log("Message successfully sent:", data);

      // Update the messages with the server response (text response from the model)
      const botMessage = {
        sender: "bot",
        text: data.response || "Message received!",
      };
      setMessages((prevMessages) => [...prevMessages, botMessage]); // Append the bot's response
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // Render the chat interface
  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-purple-900 to-slate-900 text-white font-sans">
      <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl h-[85vh] p-6 sm:p-8 bg-white/10 backdrop-blur-2xl shadow-2xl rounded-3xl flex flex-col border border-white/20 relative overflow-hidden">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 z-10 pb-4 border-b border-white/10">
            <div>
              <h2 className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight">
                Police Assistant
              </h2>
              <p className="text-sm text-gray-400 mt-1">AI-powered multilingual support</p>
            </div>
            
            {/* Language selection */}
            <div className="mt-4 sm:mt-0 flex items-center bg-white/5 rounded-xl border border-white/10 p-1 backdrop-blur-md">
              <div className="px-3 text-gray-300 font-medium text-sm">
                <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"></path></svg>
              </div>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="bg-transparent text-white font-medium text-sm appearance-none focus:outline-none cursor-pointer pr-8 py-2 pl-2"
              >
                {["Kannada", "Tamil", "Telugu", "Malayalam", "Bodo", "English", "Meitei (Manipuri)", "Odia", "Marathi", "Punjabi", "Gujarati", "Bengali", "Hindi", "Assamese", "Rajasthani", "Konkani"].map(lang => (
                  <option key={lang} value={lang} className="bg-gray-800 text-white">{lang}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Chat messages section */}
          <div className="flex-grow overflow-y-auto mb-6 pr-2 custom-scrollbar z-10">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center opacity-70">
                <div className="w-20 h-20 mb-4 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                </div>
                <h3 className="text-xl font-medium text-white mb-2">How can I assist you today?</h3>
                <p className="text-gray-400 text-sm max-w-md">Ask questions, report issues, or use voice commands in your preferred language.</p>
              </div>
            ) : (
              <ul className="space-y-6">
                {messages.map((message, index) => (
                  <li
                    key={index}
                    className={`flex ${
                      message.sender === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    {message.sender === "bot" ? (
                      <div className="flex items-start max-w-[80%]">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center mr-3 mt-1 shadow-md">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                        </div>
                        <div className={`p-4 rounded-2xl rounded-tl-none shadow-sm backdrop-blur-md border ${
                          message.text.includes("Error")
                            ? "bg-red-500/20 border-red-500/50 text-white"
                            : "bg-white/10 border-white/10 text-gray-100"
                        }`}>
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start max-w-[80%] flex-row-reverse">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center ml-3 mt-1 shadow-md backdrop-blur-sm">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </div>
                        <div className="p-4 rounded-2xl rounded-tr-none shadow-lg bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</div>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
                <div ref={endOfMessagesRef} className="h-4" />
              </ul>
            )}
          </div>

          {/* Input section */}
          <div className="mt-auto z-10 pt-2">
            <div className="relative flex items-center p-2 bg-white/5 border border-white/20 rounded-2xl backdrop-blur-xl shadow-inner">
              <input
                type="text"
                className="flex-grow text-white px-4 py-3 bg-transparent focus:outline-none placeholder-gray-400 text-sm sm:text-base"
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              
              <div className="flex items-center space-x-2 pr-2">
                {audioUrl && (
                  <audio
                    src={audioUrl}
                    className="h-8 w-24 sm:w-32 opacity-70 hover:opacity-100 transition-opacity filter invert grayscale"
                    controls
                  />
                )}
                
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-3 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "bg-white/10 hover:bg-white/20 text-gray-300"
                  }`}
                  title={isRecording ? "Stop Recording" : "Record Voice Note"}
                >
                  {isRecording ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd"></path></svg>
                  ) : (
                    <svg className="w-5 h-5 text-current" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path></svg>
                  )}
                </button>
                
                <button
                  onClick={handleSend}
                  disabled={!inputValue.trim()}
                  className={`p-3 rounded-xl shadow-lg transition-all duration-300 flex items-center justify-center ${
                    inputValue.trim()
                      ? "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white cursor-pointer hover:scale-105"
                      : "bg-white/5 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                </button>
              </div>
            </div>
          </div>
          
          {/* Decorative background blurs */}
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/20 rounded-full blur-[100px] pointer-events-none"></div>

        </div>
      </div>
    </div>
  );
}
