import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sparkles, X, Send, Bot, User, Database, Lightbulb, 
  Menu, Plus, Search, Trash2, Edit2, Check, MessageSquare 
} from "lucide-react";
import { useData } from "../../contexts/DataContext";
import { useNavigate } from "react-router-dom";
import AIResponseRenderer from "./AIResponseRenderer";
import AIRobotLiftingIcon from "../shared/AIRobotLiftingIcon";

interface ChatSession {
  id: string;
  title: string;
  history: Array<{ role: "user" | "ai"; text: string; actionExecuted?: string }>;
  updatedAt: number;
}

export default function GymOSAI() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  // History Sidebar state
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("gymos_chat_sessions");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Failed to load chat sessions:", e);
    }
    // Default initial session if none stored
    return [
      {
        id: "session_default",
        title: "GymOS Intelligence Partners",
        history: [
          {
            role: "ai" as const,
            text: "Hello! I am GymOS Central Intelligence, your premium AI partner. Ask me any analytical question, request member lists, check today's collections, or instruct me to make updates (e.g. 'Add a note to member mem-1: Strong progress')!"
          }
        ],
        updatedAt: Date.now()
      }
    ];
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const savedId = localStorage.getItem("gymos_current_session_id");
    return savedId || "session_default";
  });

  const [showSidebar, setShowSidebar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { askAI, refreshAll, settings } = useData();

  // Sync sessions & current active ID to localStorage
  useEffect(() => {
    localStorage.setItem("gymos_chat_sessions", JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem("gymos_current_session_id", currentSessionId);
  }, [currentSessionId]);

  // Derived current chat history
  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0] || {
    id: "session_default",
    title: "GymOS Intelligence Partners",
    history: []
  };
  const chatHistory = currentSession.history;

  useEffect(() => {
    const handleOpenAI = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-gymos-ai", handleOpenAI);
    return () => {
      window.removeEventListener("open-gymos-ai", handleOpenAI);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  const quickPrompts = [
    { label: "Expiring Today/3 Days", query: "Show members expiring today or in 3 days." },
    { label: "Above 90kg Members", query: "Show members above 90kg with their weights." },
    { label: "Today's Collections", query: "Show today's payment collections details." },
    { label: "Churn Risk Analysis", query: "Who did not renew and are at risk of churn?" }
  ];

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatHistory, isTyping]);

  const startNewChat = () => {
    const newId = "session_" + Date.now().toString();
    const newSessionState: ChatSession = {
      id: newId,
      title: "New Chat",
      history: [
        {
          role: "ai" as const,
          text: "Let's start a fresh analytical conversation! Ask me about revenue, memberships, or dates."
        }
      ],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSessionState, ...prev]);
    setCurrentSessionId(newId);
    setShowSidebar(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const deleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      alert("You must keep at least one chat session.");
      return;
    }
    const remaining = sessions.filter(s => s.id !== id);
    setSessions(remaining);
    if (currentSessionId === id) {
      setCurrentSessionId(remaining[0].id);
    }
  };

  const startRenameSession = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(id);
    setRenameValue(currentTitle);
  };

  const saveRenameSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!renameValue.trim()) return;
    setSessions(prev => prev.map(s => s.id === id ? { ...s, title: renameValue.trim(), updatedAt: Date.now() } : s));
    setEditingSessionId(null);
  };

  const cancelRenameSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(null);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    
    let targetSessionId = currentSessionId;
    let targetSession = sessions.find(s => s.id === targetSessionId);

    if (!targetSession) {
      // Fallback
      targetSessionId = "session_default";
      targetSession = sessions[0];
    }

    const updatedUserHistory = [...targetSession.history, { role: "user" as const, text: textToSend }];
    
    // Auto rename from "New Chat" or default title
    let updatedTitle = targetSession.title;
    if (targetSession.title === "New Chat" || targetSession.title === "GymOS Intelligence Partners") {
      updatedTitle = textToSend.length > 28 ? textToSend.substring(0, 28) + "..." : textToSend;
    }

    // Instantly show the user message in current session
    setSessions(prev => prev.map(s => {
      if (s.id === targetSessionId) {
        return {
          ...s,
          title: updatedTitle,
          history: updatedUserHistory,
          updatedAt: Date.now()
        };
      }
      return s;
    }));

    setMessage("");
    setIsTyping(true);

    try {
      const serverHistory = updatedUserHistory.map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }]
      }));
      
      const payload = await askAI(textToSend, serverHistory);
      
      const updatedAIHistory = [
        ...updatedUserHistory,
        { 
          role: "ai" as const, 
          text: payload.response,
          actionExecuted: payload.toolExecuted ? `${payload.toolExecuted} executed` : undefined
        }
      ];

      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            history: updatedAIHistory,
            updatedAt: Date.now()
          };
        }
        return s;
      }));
      
      if (payload.toolExecuted) {
        if (payload.toolExecuted === "navigateToPage" && payload.args?.pagePath) {
          navigate(payload.args.pagePath);
        } else if (payload.toolExecuted === "triggerUIModal" && payload.args?.modalType) {
          window.dispatchEvent(new CustomEvent("gymos_ai_modal", { detail: { modalType: payload.args.modalType } }));
        }
        refreshAll();
      }
    } catch (e: any) {
      setSessions(prev => prev.map(s => {
        if (s.id === targetSessionId) {
          return {
            ...s,
            history: [
              ...updatedUserHistory,
              { 
                role: "ai" as const, 
                text: "I experienced an error connecting to GymOS Core services. Please check if GymOS AI is fully set up or if the GEMINI_API_KEY is configured in Settings > Secrets." 
              }
            ],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } finally {
      setIsTyping(false);
    }
  };

  // Filter sessions for search
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed bottom-24 sm:bottom-28 lg:bottom-6 right-4 sm:right-6 lg:right-6 z-50 font-sans flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="w-[92vw] max-w-[420px] h-[72vh] sm:h-[600px] bg-[#0c0c0e]/95 border border-white/10 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl flex flex-col overflow-hidden mb-4 relative pointer-events-auto"
          >
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[40px] pointer-events-none" />
            <div className="absolute bottom-16 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[45px] pointer-events-none" />

            {/* Chat History Sidebar (Animate absolute overlay) */}
            <AnimatePresence>
              {showSidebar && (
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "-100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 220 }}
                  className="absolute top-0 left-0 w-[290px] h-full bg-[#08080a] border-r border-white/10 z-40 flex flex-col p-4 shadow-[10px_0_30px_rgba(0,0,0,0.8)]"
                >
                  {/* Sidebar Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare size={13} className="text-blue-400" /> Chat History
                    </span>
                    <button 
                      onClick={() => setShowSidebar(false)}
                      className="p-1 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5"
                      title="Close Sidebar"
                    >
                      <X size={15} />
                    </button>
                  </div>

                  {/* New Chat shortcut in Sidebar */}
                  <button
                    onClick={startNewChat}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600/90 hover:bg-blue-600 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <Plus size={14} /> New Chat
                  </button>

                  {/* Search Input */}
                  <div className="relative flex items-center bg-[#0e0e11] border border-white/5 rounded-xl px-2 py-1.5 focus-within:border-white/15 my-3 shrink-0">
                    <Search size={12} className="text-zinc-500 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search previous chats..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none text-[11px] text-zinc-300 placeholder-zinc-500 focus:outline-none w-full"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-white p-0.5">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Scrollable list */}
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 no-scrollbar pb-6">
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Previous Chats</p>
                    {filteredSessions.length === 0 ? (
                      <p className="text-[10px] text-zinc-500 italic px-2">No conversations found</p>
                    ) : (
                      filteredSessions.map((s) => {
                        const isActive = s.id === currentSessionId;
                        const isEditing = editingSessionId === s.id;
                        
                        return (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (!isEditing) {
                                setCurrentSessionId(s.id);
                                setShowSidebar(false);
                              }
                            }}
                            className={`group relative flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                              isActive 
                                ? "bg-white/[0.06] border-white/10 text-white font-medium" 
                                : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <MessageSquare size={13} className={isActive ? "text-blue-400" : "text-zinc-600"} />
                              
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={renameValue}
                                  onChange={(e) => setRenameValue(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-[#0c0c0e] border border-white/20 rounded px-1.5 py-0.5 text-[11px] text-white focus:outline-none w-[110px]"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      saveRenameSession(s.id, e as any);
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-xs truncate">{s.title}</span>
                              )}
                            </div>

                            {/* Actions overlay of each entry */}
                            <div className="flex items-center gap-1 shrink-0 ml-1.5" onClick={(e) => e.stopPropagation()}>
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={(e) => saveRenameSession(s.id, e)}
                                    className="p-1 text-emerald-400 hover:text-emerald-300 rounded bg-white/5"
                                    title="Save name"
                                  >
                                    <Check size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => cancelRenameSession(e)}
                                    className="p-1 text-zinc-500 hover:text-white rounded"
                                    title="Cancel"
                                  >
                                    <X size={11} />
                                  </button>
                                </>
                              ) : (
                                <div className="hidden group-hover:flex items-center gap-1 bg-[#08080a]/90 pl-1">
                                  <button
                                    onClick={(e) => startRenameSession(s.id, s.title, e)}
                                    className="p-1 text-zinc-500 hover:text-white rounded hover:bg-white/5"
                                    title="Rename chat"
                                  >
                                    <Edit2 size={11} />
                                  </button>
                                  <button
                                    onClick={(e) => deleteSession(s.id, e)}
                                    className="p-1 text-zinc-500 hover:text-red-400 rounded hover:bg-white/5"
                                    title="Delete chat"
                                  >
                                    <Trash2 size={11} />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sidebar Dimmer overlay */}
            <AnimatePresence>
              {showSidebar && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.5 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowSidebar(false)}
                  className="absolute inset-0 bg-black z-30 cursor-pointer"
                />
              )}
            </AnimatePresence>

            {/* Header of AI panel */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02] z-10">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  title="Toggle Chat History"
                >
                  <Menu size={16} />
                </button>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <AIRobotLiftingIcon size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-white tracking-wide flex items-center gap-1">
                      GymOS AI
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    </h3>
                    <p className="text-[9px] text-zinc-500 font-mono">Live Grounded DB Access</p>
                  </div>
                </div>
              </div>

              {/* Top-Right Tools Section */}
              <div className="flex items-center gap-1">
                {/* Dedicated New Chat button in top-right */}
                <button
                  onClick={startNewChat}
                  className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-lg hover:brightness-110 text-[9.5px] uppercase tracking-wider transition-colors mr-1 cursor-pointer"
                  title="Start Fresh Conversation"
                >
                  <Plus size={11} /> New Chat
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  title="Minimize"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Message Pane */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {chatHistory.map((item, idx) => (
                <div key={idx} className={`flex items-start gap-2.5 ${item.role === "user" ? "justify-end" : ""}`}>
                  {item.role === "ai" && (
                    <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 shrink-0">
                      <Bot size={14} className="text-blue-400" />
                    </div>
                  )}
                  <div className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                    item.role === "user" 
                      ? "bg-blue-600 text-white rounded-br-none shadow-[0_4px_12px_rgba(37,99,235,0.2)]" 
                      : "bg-white/[0.04] border border-white/5 text-zinc-200 rounded-bl-none"
                  }`}>
                    {item.role === 'user' ? (
                      <p className="whitespace-pre-line">{item.text}</p>
                    ) : (
                      <AIResponseRenderer text={item.text} />
                    )}
                    {item.actionExecuted && (
                      <div className="mt-2 text-[9px] font-mono text-emerald-400 flex items-center gap-1 bg-emerald-500/10 p-1 px-2 rounded-md border border-emerald-500/10">
                        <Database size={11} />
                        DATABASE SYNC: {item.actionExecuted.toUpperCase()}
                      </div>
                    )}
                  </div>
                  {item.role === "user" && (
                    <div className="w-7 h-7 rounded-lg overflow-hidden border border-blue-500/20 flex items-center justify-center bg-blue-600/10 text-blue-400 shrink-0">
                      {settings?.owner_photo ? (
                        <img src={settings.owner_photo} className="w-full h-full object-cover" alt="Owner Profile" referrerPolicy="no-referrer" />
                      ) : (
                        <User size={13} />
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-white/5 flex items-center justify-center text-zinc-500 shrink-0">
                    <Bot size={14} className="text-blue-400" />
                  </div>
                  <div className="bg-white/[0.04] border border-white/5 rounded-2xl rounded-bl-none p-3 text-xs text-zinc-500 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Quick Suggestions Shelf */}
            <div className="px-4 py-2 border-t border-white/5 bg-white/[0.01]">
              <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 mb-1.5">
                <Lightbulb size={11} className="text-amber-400" /> SUGGESTED QUERIES
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.query)}
                    className="shrink-0 p-1 py-1.5 px-3 rounded-full bg-zinc-900 border border-white/5 text-[9.5px] text-zinc-400 hover:text-white hover:border-white/10 transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Footer */}
            <div className="p-3 border-t border-white/5 bg-white/[0.02]">
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(message);
                }}
                className="flex items-center gap-1.5 bg-[#0A0A0B] border border-white/5 rounded-xl p-1 pr-1.5 focus-within:border-white/10 transition-colors"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Query system intelligence..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1 bg-transparent border-none text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none p-1.5 px-2"
                />
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="p-1.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-40 disabled:hover:bg-blue-500 rounded-lg text-white transition-colors flex items-center justify-center shrink-0 cursor-pointer"
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-blue-600 to-[#8B5CF6] rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgb(139,92,246,0.3)] hover:shadow-[0_8px_30px_rgb(139,92,246,0.5)] border border-white/10 relative cursor-pointer pointer-events-auto"
      >
        <AIRobotLiftingIcon size={28} className="text-white" />
        {/* Glow halo */}
        <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-600 to-[#8B5CF6] opacity-30 blur-md -z-10 animate-pulse" />
      </motion.button>
    </div>
  );
}
