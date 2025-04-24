import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const lastMessageRef = useRef(null);

  useEffect(() => {
    if (lastMessageRef.current) {
      lastMessageRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [chats]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message) return;

    const userMessage = { role: "user", content: message };
    setChats((prev) => [...prev, userMessage]);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        body: JSON.stringify({ message: message }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      console.log(response.status);
      if (response.status == 200) {
        const aiMessage = { role: "assistant", content: data.reply };
        setChats((prev) => [...prev, aiMessage]);
      } else if (response.status == 400 || response.status == 500) {
        const aiMessage = { role: "assistant", content: data.error };
        setChats((prev) => [...prev, aiMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="chat-container">
      <h1>Chat with Gemini</h1>
      <div className="chat-window">
        {chats.map((chat, index) => (
          <div
            key={index}
            className={`chat-message ${chat.role}`}
            ref={index === chats.length - 1 ? lastMessageRef : null}
          >
            <strong>{chat.role === "user" ? "You" : "AI"}:</strong>{" "}
            {chat.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="chat-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="chat-input"
        />
        <button type="submit" className="chat-button">
          Send
        </button>
      </form>
    </div>
  );
}

export default App;
