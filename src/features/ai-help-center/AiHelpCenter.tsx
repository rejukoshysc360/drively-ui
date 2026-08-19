// src/components/AiHelpCenter.tsx
import { useState } from "react";
import {
  MainContainer,
  ChatContainer,
  MessageList,
  Message,
  MessageInput,
  TypingIndicator,
} from "@chatscope/chat-ui-kit-react";
import "@chatscope/chat-ui-kit-styles/dist/default/styles.min.css";
import { Brain } from "lucide-react";
import { useAiHelp } from "./hooks";
import { motion, AnimatePresence } from "framer-motion";

export default function AiHelpCenter() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      message:
        "👋 Hi! I’m your HR Opera AI Assistant. I understand your payroll, payslip, and HR backend logic — ask me anything about how it works!",
      sender: "AI",
      direction: "incoming" as const,
    },
  ]);

  const aiHelp = useAiHelp();

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { message: text, sender: "user" as const, direction: "outgoing" as const };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await aiHelp.mutateAsync(text);
      const botMsg = { message: res.reply, sender: "AI" as const, direction: "incoming" as const };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          message: "⚠️ Sorry, I'm having trouble connecting right now. Please try again soon.",
          sender: "AI" as const,
          direction: "incoming" as const,
        },
      ]);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle button */}
      {!open && (
        <motion.button
          onClick={() => setOpen(true)}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full shadow-2xl transition-all duration-300"
        >
          <Brain className="w-5 h-5" />
          <span className="hidden sm:inline font-semibold">AI Help Center</span>
        </motion.button>
      )}

      {/* Chat popup */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chatbox"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.25 }}
            className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-[360px] sm:w-[400px] h-[520px] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 text-center font-semibold flex justify-between items-center">
              <span>HR Opera AI Assistant</span>
              <button
                onClick={() => setOpen(false)}
                className="text-white hover:text-gray-200 text-lg font-bold"
              >
                ×
              </button>
            </div>

            {/* Chat area */}
            <MainContainer style={{ backgroundColor: "white", height: "calc(100% - 48px)" }}>
              <ChatContainer>
                <MessageList
                  typingIndicator={
                    aiHelp.isPending ? (
                      <TypingIndicator content="AI is analyzing your query…" />
                    ) : null
                  }
                >
                  {messages.map((msg, i) => (
                    <Message
                      key={i}
                      model={{
                        ...msg,
                        position: msg.direction === "outgoing" ? "single" : "normal",
                      }}
                    />
                  ))}
                </MessageList>

                <MessageInput
                  attachButton={false}
                  placeholder="Ask about payslip logic, OT, or deductions..."
                  onSend={sendMessage}
                />
              </ChatContainer>
            </MainContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
