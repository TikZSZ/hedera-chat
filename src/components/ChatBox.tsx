import { useCallback, useEffect, useRef, useState } from "react";
import { useChatSDK,useAIChat,Message } from "../HederaChat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Paperclip, Minimize, Maximize, X, Loader2 } from "lucide-react";
import Markdown from "react-markdown";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  duotoneSpace,
} from "react-syntax-highlighter/dist/esm/styles/prism";

// Types
import AutoHideScrollbar from "@/components/AutoHideScrollbar"
const markdownTheme = duotoneSpace

interface ChatDialogProps{
  minimzed:boolean
  fullscreen:boolean
}

export const ChatBox = ({minimzed,fullscreen}:ChatDialogProps) => {
  const {
    messages,
    addMessage,
    config,
    isConnected,
    connect,
  } = useChatSDK();

  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>();

  const [isMinimized, setIsMinimized] = useState<boolean>(minimzed);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(fullscreen);

  const {inProgress,error:_} = useAIChat({params:{model:"gpt-4o-mini"}})

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, []);

  const toggleFullScreen = useCallback(() => {
    setIsFullScreen((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isConnected) {
      setError(null);
    }
  }, [isConnected]);

  useEffect(() => {
    if (!isConnected) {
      connect();
    }
  }, []);

  const messagesEndRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (inputValue.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        type: "user",
        isVisible: true,
        rawChatBody:{ role: "user", content: inputValue }
      };

      if (!isConnected) {
        setError("Wallet not connected, HederaChat wont be able to execute transactions!");
        // return;
      }

      addMessage(newMessage);
      setInputValue("");
    }
  };
  
  return (
    <div
      className={`fixed bottom-4 right-4  ${
        isMinimized ? "w-11/12 md:w-auto" : isFullScreen ? "md:w-1/2 w-11/12 h-5/6" : "md:w-96 md:h-[500px] w-11/12 h-[50%]"
      } rounded-lg border bg-card text-card-foreground shadow-sm`}
      style={config.customStyles?.chatWindow}
    >
      <div
        className={`flex flex-col ${
          isMinimized ? "h-12" : "h-full"
        }`}
      >
        <div className={`flex justify-between items-center p-4 border-b border-border ${isMinimized && "-mt-2.5 ml-5"}`}>
          <span className="font-medium">Chat Assistant</span>
          <div>
            {!isMinimized && (
              <Button size="sm" variant="ghost" onClick={toggleFullScreen}>
                {isFullScreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button className={`${isMinimized && "mt-0.5"}`} size="sm" variant="ghost" onClick={toggleMinimize}>
              {isMinimized ? (
                <Maximize className="h-4 w-4" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <>
            {error && (
              <div className="bg-destructive text-destructive-foreground p-4 text-center">
                {error}
              </div>
            )}
            
            <AutoHideScrollbar
              className="flex-1 overflow-y-auto p-4 space-y-2 chat-messages"
              style={config.customStyles?.messageContainer}
            >
              {messages.map((message, index) => (
                message.isVisible && (
                  <div
                    key={index}
                    className={`flex m-auto ${isFullScreen && "w-11/12 md:w-3/4"}`}
                  >
                    <div
                      className={`flex w-full flex-col gap-2 rounded-lg px-3 py-2 text-sm chat-message  ${
                        message.type === "user"
                          ? " bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                      style={message.type === "user" ? config.customStyles?.userMessage : config.customStyles?.assistantMessage}
                    >
                      <Markdown
                        components={{
                          //@ts-ignore
                          code({ node, inline, className, children, ...props }) {
                            const match = /language-(\w+)/.exec(className || '')
                            return !inline && match ? (
                              // @ts-ignore
                              <SyntaxHighlighter
                                {...props}
                                children={String(children).replace(/\n$/, '')}
                                style={markdownTheme}
                                language={match[1]}
                                PreTag="div"
                              />
                            ) : (
                              <code {...props} className={className}>
                                {children}
                              </code>
                            )
                          },
                          a({ node, children, href, ...props }) {
                            return (
                              <a
                                href={href}
                                className="text-muted-foreground hover:text-secondary-foreground underline"
                                target="_blank"
                                rel="noopener noreferrer"
                                {...props}
                              >
                                {children}
                              </a>
                            );
                          }
                        }}
                        className="prose prose-sm max-w-none"
                      >
                        {message.rawChatBody.content}
                      </Markdown>
                    </div>
                  </div>
                )
              ))}
              <div ref={messagesEndRef} />
            </AutoHideScrollbar>
            <div className="p-4 border-t">
              <form className="flex w-full items-center space-x-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={inProgress}>
                  {inProgress ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
                <Button type="button" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatBox