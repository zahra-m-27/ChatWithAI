import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [message, setMessage] = useState("");
  const [chats, setChats] = useState([]);
  const lastMessageRef = useRef(null);
  const baseURL =
    import.meta.env.MODE == "development"
      ? "http://localhost:8000/"
      : import.meta.env.VITE_BASE_URL;

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

    if (!currentSessionId) {
      const response = await fetch(`${baseURL}chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: message }),
      });
      const data = await response.json();

      setCurrentSessionId(data.sessionId);
      console.log(`current session id in first req: ${currentSessionId}`);

      let content = "";

      if (response.status == 200) content = data.reply;
      else if (response.status == 400 || response.status == 500)
        content = data.error;

      const aiMessage = { role: "assistant", content };
      setChats((prev) => [...prev, aiMessage]);
    } else {
      const response = await fetch(`${baseURL}chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: message,
          clientSessionId: currentSessionId,
        }),
      });
      console.log(`sent session id in other req: ${currentSessionId}`);

      const data = await response.json();
      let content = "";

      if (response.status == 200) content = data.reply;
      else if (response.status == 400 || response.status == 500)
        content = data.error;

      const aiMessage = { role: "assistant", content };
      setChats((prev) => [...prev, aiMessage]);
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
            <strong>{chat.role === "user" ? "You" : "AI"}:</strong>
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
