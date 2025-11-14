import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageSquare, ArrowLeft, X, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";

interface Message {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

const ChatTest = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);
  
  // Mock data for testing
  const [messages] = useState<Message[]>([
    {
      id: "1",
      user: "Sarah Johnson",
      avatar: "",
      text: "Hey team! I just spoke with the client, they're interested in the 3-month package.",
      timestamp: "10:30 AM",
      isOwn: false,
    },
    {
      id: "2",
      user: "Mike Chen",
      avatar: "",
      text: "Great! Did you mention the ALH program benefits?",
      timestamp: "10:32 AM",
      isOwn: false,
    },
    {
      id: "3",
      user: "You",
      avatar: "",
      text: "Yes, and they're very interested. Can someone send me the latest pricing sheet?",
      timestamp: "10:35 AM",
      isOwn: true,
    },
    {
      id: "4",
      user: "Sarah Johnson",
      avatar: "",
      text: "I'll send it right away! Check your email in 5 mins.",
      timestamp: "10:36 AM",
      isOwn: false,
    },
    {
      id: "5",
      user: "Lisa Wong",
      avatar: "",
      text: "Also, don't forget to mention the special promo running this week!",
      timestamp: "10:38 AM",
      isOwn: false,
    },
  ]);

  const handleSend = () => {
    if (message.trim()) {
      // This would send the message in the real implementation
      console.log("Sending:", message);
      setMessage("");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const handleOpenChat = () => {
    setIsChatOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  return (
    <Layout>
      <div className="flex h-[calc(100vh-4rem)] bg-muted/30">
        {/* Mock Leads Page Content */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Sales Team Chat - Layout Demo</h1>
                <p className="text-muted-foreground mt-1">
                  This shows how the chat would appear on the leads page - try the floating button!
                </p>
              </div>
            </div>

            {/* Mock Leads Table */}
            <Card className="p-6 mb-4">
              <h2 className="text-xl font-semibold mb-4">My Leads</h2>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                    <div>
                      <p className="font-medium">Client {i}</p>
                      <p className="text-sm text-muted-foreground">+971 50 123 456{i}</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">More Leads</h2>
              <div className="space-y-3">
                {[6, 7, 8].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-background">
                    <div>
                      <p className="font-medium">Client {i}</p>
                      <p className="text-sm text-muted-foreground">+971 50 123 456{i}</p>
                    </div>
                    <Badge variant="secondary">Follow-up</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        {/* Chat Widget - Bottom Right Corner (when closed) */}
        {!isChatOpen && (
          <Button
            onClick={handleOpenChat}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
            size="icon"
          >
            <MessageSquare className="h-6 w-6" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Chat Sidebar (when open) */}
        {isChatOpen && (
          <div 
            className={`fixed right-0 top-0 h-screen bg-background border-l shadow-xl transition-all duration-300 z-50 ${
              isMinimized ? 'w-16' : 'w-96'
            }`}
          >
            {isMinimized ? (
              // Minimized state
              <div className="flex flex-col items-center p-4 gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMinimized(false)}
                  className="hover:bg-accent"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            ) : (
              // Full chat interface
              <div className="flex flex-col h-full">
                {/* Chat Header */}
                <div className="flex items-center justify-between p-4 border-b bg-card">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">ST</AvatarFallback>
                      </Avatar>
                      <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Sales Team</h3>
                      <p className="text-xs text-muted-foreground">5 members online</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMinimized(true)}
                      className="h-8 w-8"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsChatOpen(false)}
                      className="h-8 w-8"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.isOwn ? "flex-row-reverse" : ""}`}
                      >
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarImage src={msg.avatar} />
                          <AvatarFallback className={msg.isOwn ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                            {getInitials(msg.user)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`flex flex-col ${msg.isOwn ? "items-end" : ""}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium text-foreground">
                              {msg.user}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {msg.timestamp}
                            </span>
                          </div>
                          <div
                            className={`rounded-lg px-4 py-2 max-w-[250px] ${
                              msg.isOwn
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{msg.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t bg-card">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSend();
                        }
                      }}
                      className="flex-1"
                    />
                    <Button onClick={handleSend} size="icon">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Press Enter to send • This is a demo layout
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ChatTest;
