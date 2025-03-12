"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Users,
  Settings,
  LogOut,
  Send,
  ImageIcon,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Plus,
  Search,
} from "lucide-react"
import { io, type Socket } from "socket.io-client"
import { useToast } from "@/hooks/use-toast"

// Mock user data
const currentUser = {
  id: "user1",
  name: "John Doe",
  avatar: "/placeholder.svg?height=40&width=40",
}

const contacts = [
  {
    id: "user2",
    name: "Jane Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    lastSeen: "2 min ago",
    status: "online",
  },
  {
    id: "user3",
    name: "Mike Johnson",
    avatar: "/placeholder.svg?height=40&width=40",
    lastSeen: "1 hour ago",
    status: "offline",
  },
  {
    id: "user4",
    name: "Sarah Williams",
    avatar: "/placeholder.svg?height=40&width=40",
    lastSeen: "5 min ago",
    status: "online",
  },
  {
    id: "group1",
    name: "Project Team",
    avatar: "/placeholder.svg?height=40&width=40",
    members: ["user1", "user2", "user3"],
    isGroup: true,
  },
]

// Message type definition
interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  status: "sent" | "delivered" | "read"
  isGroup?: boolean
}

export default function ChatPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [activeChat, setActiveChat] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [newMessage, setNewMessage] = useState("")
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize socket connection
  useEffect(() => {
    // In a real app, this would connect to your actual Socket.IO server
    const socketInstance = io("https://your-socket-server.com", {
      autoConnect: false,
      auth: {
        token: "mock-jwt-token", // In a real app, this would be a JWT token
      },
    })

    setSocket(socketInstance)

    // For demo purposes, we'll simulate the socket connection
    setTimeout(() => {
      setIsConnected(true)
      toast({
        title: "Connected to chat server",
        description: "You can now send and receive messages",
      })
    }, 1000)

    // Initialize mock messages
    const initialMessages: Record<string, Message[]> = {}
    contacts.forEach((contact) => {
      initialMessages[contact.id] = generateMockMessages(contact.id)
    })
    setMessages(initialMessages)

    return () => {
      if (socketInstance) {
        socketInstance.disconnect()
      }
    }
  }, [toast])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [activeChat, messages])

  // Generate mock messages for demo
  const generateMockMessages = (contactId: string): Message[] => {
    const mockMessages: Message[] = []
    const count = Math.floor(Math.random() * 10) + 3

    for (let i = 0; i < count; i++) {
      const isFromCurrentUser = Math.random() > 0.5
      mockMessages.push({
        id: `msg-${contactId}-${i}`,
        senderId: isFromCurrentUser ? currentUser.id : contactId,
        receiverId: isFromCurrentUser ? contactId : currentUser.id,
        content: `This is a sample message ${i + 1}`,
        timestamp: new Date(Date.now() - Math.random() * 86400000),
        status: isFromCurrentUser ? (Math.random() > 0.5 ? "read" : "delivered") : "read",
        isGroup: contactId === "group1",
      })
    }

    return mockMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeChat) return

    const message: Message = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: activeChat,
      content: newMessage,
      timestamp: new Date(),
      status: "sent",
      isGroup: contacts.find((c) => c.id === activeChat)?.isGroup,
    }

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), message],
    }))

    // In a real app, you would emit this message to the socket server
    if (socket && isConnected) {
      // socket.emit("send_message", message);
      console.log("Message sent:", message)

      // Simulate message delivery status updates
      setTimeout(() => {
        setMessages((prev) => {
          const updatedMessages = [...prev[activeChat]]
          const msgIndex = updatedMessages.findIndex((m) => m.id === message.id)
          if (msgIndex !== -1) {
            updatedMessages[msgIndex] = { ...updatedMessages[msgIndex], status: "delivered" }
          }
          return { ...prev, [activeChat]: updatedMessages }
        })
      }, 1000)

      setTimeout(() => {
        setMessages((prev) => {
          const updatedMessages = [...prev[activeChat]]
          const msgIndex = updatedMessages.findIndex((m) => m.id === message.id)
          if (msgIndex !== -1) {
            updatedMessages[msgIndex] = { ...updatedMessages[msgIndex], status: "read" }
          }
          return { ...prev, [activeChat]: updatedMessages }
        })
      }, 2000)
    }

    setNewMessage("")
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <Check className="h-4 w-4 text-gray-400" />
      case "delivered":
        return <CheckCheck className="h-4 w-4 text-gray-400" />
      case "read":
        return <CheckCheck className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const handleLogout = () => {
    // In a real app, you would clear the auth token and disconnect the socket
    if (socket) {
      socket.disconnect()
    }
    router.push("/login")
  }

  const getContactName = (id: string) => {
    const contact = contacts.find((c) => c.id === id)
    return contact ? contact.name : "Unknown"
  }

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* User profile */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
              <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">{currentUser.name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{isConnected ? "Online" : "Connecting..."}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search contacts..." className="pl-9" />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chats" className="flex-1 flex flex-col">
          <TabsList className="grid grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="chats">Chats</TabsTrigger>
            <TabsTrigger value="groups">Groups</TabsTrigger>
          </TabsList>

          <TabsContent value="chats" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                {contacts
                  .filter((c) => !c.isGroup)
                  .map((contact) => (
                    <button
                      key={contact.id}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeChat === contact.id
                          ? "bg-gray-100 dark:bg-gray-700"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setActiveChat(contact.id)}
                    >
                      <div className="relative">
                        <Avatar>
                          <AvatarImage src={contact.avatar} alt={contact.name} />
                          <AvatarFallback>{contact.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {contact.status === "online" && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">{contact.name}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {messages[contact.id]?.length > 0
                              ? formatTime(messages[contact.id][messages[contact.id].length - 1].timestamp)
                              : ""}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {messages[contact.id]?.length > 0
                            ? messages[contact.id][messages[contact.id].length - 1].content
                            : "No messages yet"}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="groups" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-2 space-y-1">
                <button className="w-full flex items-center space-x-3 p-3 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900">
                    <Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="font-medium">Create New Group</span>
                </button>

                {contacts
                  .filter((c) => c.isGroup)
                  .map((group) => (
                    <button
                      key={group.id}
                      className={`w-full flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        activeChat === group.id
                          ? "bg-gray-100 dark:bg-gray-700"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700"
                      }`}
                      onClick={() => setActiveChat(group.id)}
                    >
                      <Avatar>
                        <AvatarImage src={group.avatar} alt={group.name} />
                        <AvatarFallback>
                          <Users className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-gray-900 dark:text-white">{group.name}</h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {messages[group.id]?.length > 0
                              ? formatTime(messages[group.id][messages[group.id].length - 1].timestamp)
                              : ""}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                          {messages[group.id]?.length > 0
                            ? `${getContactName(messages[group.id][messages[group.id].length - 1].senderId)}: ${messages[group.id][messages[group.id].length - 1].content}`
                            : "No messages yet"}
                        </p>
                      </div>
                    </button>
                  ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage
                    src={contacts.find((c) => c.id === activeChat)?.avatar}
                    alt={contacts.find((c) => c.id === activeChat)?.name}
                  />
                  <AvatarFallback>
                    {contacts.find((c) => c.id === activeChat)?.isGroup ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      contacts.find((c) => c.id === activeChat)?.name?.charAt(0)
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {contacts.find((c) => c.id === activeChat)?.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {contacts.find((c) => c.id === activeChat)?.isGroup
                      ? `${contacts.find((c) => c.id === activeChat)?.members?.length} members`
                      : contacts.find((c) => c.id === activeChat)?.status === "online"
                        ? "Online"
                        : contacts.find((c) => c.id === activeChat)?.lastSeen}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="ghost" size="icon">
                  <Search className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
              <div className="space-y-4">
                {messages[activeChat]?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.senderId === currentUser.id ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.senderId === currentUser.id
                          ? "bg-blue-500 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      }`}
                    >
                      {message.isGroup && message.senderId !== currentUser.id && (
                        <p className="text-xs font-medium mb-1 text-gray-500 dark:text-gray-400">
                          {getContactName(message.senderId)}
                        </p>
                      )}
                      <p>{message.content}</p>
                      <div className="flex justify-end items-center mt-1 space-x-1">
                        <span className="text-xs opacity-70">{formatTime(message.timestamp)}</span>
                        {message.senderId === currentUser.id && getMessageStatusIcon(message.status)}
                      </div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-3 max-w-[70%]">
                      <div className="flex space-x-1">
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message input */}
            <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Smile className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                  <ImageIcon className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  className="rounded-full"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center p-8 max-w-md">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-6 inline-flex mb-6">
                <MessageIcon className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome to the Chat App</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Select a conversation from the sidebar to start chatting
              </p>
              <Button onClick={() => setActiveChat(contacts[0].id)}>Start a conversation</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function MessageIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}

