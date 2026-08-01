import { useState, useRef, useEffect } from "react";
import { FiSend, FiSearch, FiPlus, FiMenu } from "react-icons/fi";
import { format } from 'date-fns';
import LoadingSkeleton from "../Skeleton/LoadingSkeleton";
import { useChatStore } from "@/store/chatStore";

const ChatBot = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const chatEndRef = useRef(null);
  
  const { 
    allChats, 
    activeChat, 
    isLoading,
    error,
    fetchAllChats, 
    setActiveChat, 
    createNewChat, 
    sendMessage 
  } = useChatStore();

  useEffect(() => {
    fetchAllChats();
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat?.messages]);

  const handleChatSelection = (chatId) => {
    setActiveChat(chatId);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;

    await sendMessage(newMessage);
    setNewMessage("");
  };

  const filteredChats = allChats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col justify-center items-center">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } fixed md:relative md:translate-x-0 z-30 w-72 h-full transition-transform duration-300 ease-in-out bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Close
            </button>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Chats</h2>
            <button
              onClick={createNewChat}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <FiPlus className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-130px)]">
          {filteredChats.map((chat) => (
            <div
              key={chat._id}
              onClick={() => handleChatSelection(chat._id)}
              className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                activeChat?._id === chat._id ? "bg-blue-50 dark:bg-gray-700" : ""
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className="font-medium text-gray-900 dark:text-white truncate">
                  {chat.name || "New Chat"}
                </h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                {chat.messages.length > 0
                  ? chat.messages[chat.messages.length - 1].content
                  : "No messages yet"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <FiMenu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="ml-2 text-xl font-semibold text-gray-800 dark:text-white">
              {activeChat ? activeChat.name || "New Chat" : "Select a chat"}
            </h2>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
          {activeChat?.messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.senderId === "user" ? "justify-end" : "justify-start"} mb-4`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.senderId === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-700 text-white"
                } shadow-sm`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.createdAt && (
                  <p className="text-xs mt-1 opacity-70">
                    {format(new Date(message.createdAt), "dd MMM yyyy, hh:mm a")}
                  </p>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700"
        >
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={activeChat ? "Type your message..." : "Select a chat to start messaging"}
              disabled={!activeChat}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              type="submit"
              disabled={!activeChat || !newMessage.trim()}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSend className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBot;
