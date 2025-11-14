import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
}

interface TeamChatProps {
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  unreadCount: number;
}

const TeamChat = ({ isOpen, isMinimized, onClose, onMinimize, onExpand, unreadCount }: TeamChatProps) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [currentUserName, setCurrentUserName] = useState<string>("You");
  const [onlineCount, setOnlineCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    loadMessages();
    getCurrentUser();
    
    const chatChannel = supabase
      .channel('chat-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        (payload) => {
          const newMsg = payload.new as any;
          const formattedMessage: Message = {
            id: newMsg.id,
            user: newMsg.user_name,
            avatar: "",
            text: newMsg.message,
            timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: newMsg.user_id === currentUserId,
          };
          setMessages(prev => [...prev, formattedMessage]);
        }
      )
      .subscribe();

    const presenceChannel = supabase.channel('team-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setOnlineCount(Object.keys(state).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUserId) {
          await presenceChannel.track({
            user_id: currentUserId,
            user_name: currentUserName,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUserId, currentUserName]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
      
      // Get full name from profiles table
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single();
      
      setCurrentUserName(profile?.full_name || user.email?.split('@')[0] || "You");
    }
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    if (data) {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Fetch all user profiles to get full names
      const userIds = [...new Set(data.map(msg => msg.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);
      
      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        user: profileMap.get(msg.user_id) || msg.user_name,
        avatar: "",
        text: msg.message,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: msg.user_id === user?.id,
      }));
      setMessages(formattedMessages);
    }
  };

  const handleSend = async () => {
    if (message.trim() && currentUserId) {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: currentUserId,
          user_name: currentUserName,
          message: message.trim(),
        });

      if (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
          variant: "destructive",
        });
        return;
      }

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

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed right-0 top-0 h-screen bg-background border-l shadow-xl transition-all duration-300 z-[70] ${
        isMinimized ? 'w-16' : 'w-96'
      }`}
    >
      {isMinimized ? (
        <div className="flex flex-col items-center p-4 gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onExpand}
            className="hover:bg-accent"
          >
            <Send className="h-5 w-5" />
          </Button>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="w-8 h-8 rounded-full flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-full">
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
                <p className="text-xs text-muted-foreground">{onlineCount} {onlineCount === 1 ? 'member' : 'members'} online</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onMinimize}
                className="h-8 w-8"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

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
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamChat;
