import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Sales Team Chat</h1>
                  <p className="text-sm text-muted-foreground">5 members online</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Container */}
      <div className="container max-w-4xl mx-auto px-4 py-6">
        <div className="bg-card border rounded-lg shadow-sm flex flex-col h-[calc(100vh-200px)]">
          {/* Messages Area */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.isOwn ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={msg.avatar} />
                    <AvatarFallback className={msg.isOwn ? "bg-primary text-primary-foreground" : "bg-secondary"}>
                      {getInitials(msg.user)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-1 max-w-[70%] ${msg.isOwn ? "items-end" : ""}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{msg.user}</span>
                      <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-2 ${
                        msg.isOwn
                          ? "bg-primary text-primary-foreground rounded-tr-sm"
                          : "bg-muted rounded-tl-sm"
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
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                size="icon"
                disabled={!message.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              This is a preview. Full functionality will be implemented after approval.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatTest;
