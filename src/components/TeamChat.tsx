import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Minus, Link as LinkIcon, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import LeadSelectorDialog from "./chat/LeadSelectorDialog";

interface Message {
  id: string;
  user: string;
  avatar: string;
  text: string;
  timestamp: string;
  isOwn: boolean;
  leadId?: string;
  leadName?: string;
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
  const [linkedLeadId, setLinkedLeadId] = useState<string | null>(null);
  const [linkedLeadName, setLinkedLeadName] = useState<string | null>(null);
  const [leadSelectorOpen, setLeadSelectorOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
        async (payload) => {
          const newMsg = payload.new as any;
          
          let leadName = undefined;
          if (newMsg.lead_id) {
            const { data: lead } = await supabase
              .from('leads')
              .select('client_name')
              .eq('id', newMsg.lead_id)
              .single();
            leadName = lead?.client_name;
          }
          
          const formattedMessage: Message = {
            id: newMsg.id,
            user: newMsg.user_name,
            avatar: "",
            text: newMsg.message,
            timestamp: new Date(newMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            isOwn: newMsg.user_id === currentUserId,
            leadId: newMsg.lead_id,
            leadName,
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
      
      // Fetch lead names for messages with lead_id
      const leadIds = [...new Set(data.filter(msg => msg.lead_id).map(msg => msg.lead_id))];
      let leadMap = new Map();
      if (leadIds.length > 0) {
        const { data: leads } = await supabase
          .from('leads')
          .select('id, client_name')
          .in('id', leadIds);
        leadMap = new Map(leads?.map(l => [l.id, l.client_name]) || []);
      }
      
      const formattedMessages: Message[] = data.map(msg => ({
        id: msg.id,
        user: profileMap.get(msg.user_id) || msg.user_name,
        avatar: "",
        text: msg.message,
        timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isOwn: msg.user_id === user?.id,
        leadId: msg.lead_id,
        leadName: msg.lead_id ? leadMap.get(msg.lead_id) : undefined,
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
          lead_id: linkedLeadId,
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
      setLinkedLeadId(null);
      setLinkedLeadName(null);
    }
  };

  const handleSelectLead = (leadId: string, leadName: string) => {
    setLinkedLeadId(leadId);
    setLinkedLeadName(leadName);
    toast({
      title: "Lead Linked",
      description: `${leadName} will be linked to your next message`,
    });
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
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.avatar} alt={msg.user} />
                    <AvatarFallback>{getInitials(msg.user)}</AvatarFallback>
                  </Avatar>
                  <div className={`flex flex-col gap-1 ${msg.isOwn ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{msg.user}</span>
                      <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <div className={`rounded-lg px-3 py-2 max-w-xs ${
                      msg.isOwn
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}>
                      <p className="text-sm">{msg.text}</p>
                    </div>
                    {msg.leadId && msg.leadName && (
                      <Link 
                        to={`/crm/leads/${msg.leadId}`}
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {msg.leadName}
                      </Link>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-4 border-t bg-card">
            {linkedLeadId && linkedLeadName && (
              <div className="mb-2 p-2 bg-primary/10 rounded-md flex items-center justify-between">
                <span className="text-xs text-primary">Linked: {linkedLeadName}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setLinkedLeadId(null);
                    setLinkedLeadName(null);
                  }}
                  className="h-6 px-2"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeadSelectorOpen(true)}
                className="flex-shrink-0"
                title="Link to lead"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
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
              <Button onClick={handleSend} size="icon" className="flex-shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
      <LeadSelectorDialog
        open={leadSelectorOpen}
        onOpenChange={setLeadSelectorOpen}
        onSelectLead={handleSelectLead}
      />
    </div>
  );
};

export default TeamChat;
