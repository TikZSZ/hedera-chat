import { useCallback, useEffect, useRef, useState } from "react";
import {
  useChatSDK,
  useAIChat,
  Message,
  AIMessageProcessor,
} from "../HederaChat";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Paperclip,
  Minimize,
  Maximize,
  X,
  ChevronUp,
  ChevronDown,
  File,
  Loader2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

import Markdown from "react-markdown";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import { duotoneSpace } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDropzone } from "react-dropzone";

// Types
import AutoHideScrollbar from "@/components/AutoHideScrollbar";
import { useNavigate } from "react-router-dom";
import { AutosizeTextarea } from "./AutoExpandingTextArea";
import { useAuth } from "@/hooks/useAuth";
import { appwriteService } from "@/appwrite/config";
import { useWallet } from "@/contexts/hashconnect";
import MarkdownRenderer from "./MarkdownRenderer";
import { conf } from "@/conf/conf";
import { useChatState } from "@/contexts/useChatState";
const markdownTheme = duotoneSpace;

interface ChatDialogProps {
  minimzed: boolean;
  fullscreen: boolean;
}

async function shortenURL(url: string) {
  const hostURL = "https://url-shortener-service.p.rapidapi.com/shorten";
  const data = new FormData();
  data.append("url", url);

  const options = {
    method: "POST",
    headers: {
      "x-rapidapi-key": conf.rapidAPIKey,
      "x-rapidapi-host": "url-shortener-service.p.rapidapi.com",
    },
    body: data,
  };

  try {
    const response = await fetch(hostURL, options);
    const { result_url } = await response.json();
    return result_url as string;
  } catch (error) {
    console.error(error);
  }
}

const appwriteMessageProcessor: AIMessageProcessor = async (
  messages,
  params
) => {
  try {
    const execution = await appwriteService.invokeAIFunction(
      JSON.stringify({
        messages: messages.map((m) => m.rawChatBody),
        ...params,
      })
    );

    if (execution.status === "completed") {
      const result = JSON.parse(execution.responseBody);
      if (result.success) {
        return result.data;
      } else {
        throw new Error(result.error);
      }
    } else {
      throw new Error("Couldn't invoke AI Model");
    }
  } catch (error) {
    console.error("Error calling Appwrite function:", error);
    throw error;
  }
};
interface UploadedFile {
  name: string;
  url: string;
  type: string;
}
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const enableAlertDialog = true;
export const ChatBox = () => {
  const {
    uploadedFiles,
    setShowUploadedFiles,
    showUploadedFiles,
    inputValue,
    setInputValue,
    isUploading,
    setIsUploading,
    setUploadedFiles,
    isFullScreen,
    setIsFullScreen,
    isMinimized,
    setIsMinimized
  } = useChatState();

  const { messages, addMessage, config } = useChatSDK();
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const { connectToExtension, isConnected, isLoading,pairingData } = useWallet();
  const { user } = useAuth();
  // const [showUploadedFiles, setShowUploadedFiles] = useState(false);
  // const [isUploading, setIsUploading] = useState(false);
  // const [inputValue, setInputValue] = useState("");
  // const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  const [error, setError] = useState<string | null>();

  
  const [alertContent, setAlertContent] = useState({
    title: "NFT Created",
    description: `You can view the token in dashboard`,
    content:
      "Catty Cats Coin (CCAT)\n\n TokenId  [0.0.4688223](/dashboard/tokens/0.0.4688223)",
  });
  const formButtonRef = useRef<HTMLButtonElement>(null);
  const openAlert = (title: string, description: string, content: any) => {
    setAlertContent({ title, description, content });
    if (enableAlertDialog) {
      setIsAlertOpen(true);
    }
  };

  const closeAlert = () => {
    setIsAlertOpen(false);
  };

  const {
    inProgress,
    error: error2,
    setContext,
    context,
  } = useAIChat({
    params: { model: "gpt-4o-mini" },
    context: { openAlert, user,network:pairingData?.network },
    messageProcessor: !import.meta.env.DEV
      ? appwriteMessageProcessor
      : undefined,
  });

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsUploading(true);
    try {
      console.log(acceptedFiles);
      const uploadedFiles = await Promise.all(
        acceptedFiles.map(async (file) => {
          const response = await appwriteService.uploadFile(file);
          if (response) {
            const fileUrl = appwriteService.getFileView(response.$id) as URL;
            const shortendURL = await shortenURL(fileUrl.href);
            return {
              name: file.name,
              url: shortendURL,
              type: file.type,
            } as UploadedFile;
          }
          // return {
          //   name: file.name,
          //   url: file.size,
          //   type: file.type,
          // };
        })
      );
      const filteredUploadedFiles = uploadedFiles.filter((file) => !!file);
      setUploadedFiles((prev) => [...prev, ...filteredUploadedFiles] as any);
      setShowUploadedFiles(true);
      console.log(filteredUploadedFiles);
      // Add file information to the input
      const fileInfo = filteredUploadedFiles
        .map((file) => `[File: ${file.name}](${file.url})`)
        .join("\n");
      setInputValue((prev) => prev + "\n" + fileInfo);
    } catch (error) {
      console.error("Error uploading file:", error);
      setError("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    maxSize: MAX_FILE_SIZE,
  });

  useEffect(() => {
    setContext({ openAlert, user,network:pairingData?.network });
  }, [user,pairingData]);

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

  // useEffect(() => {
  //   if (!isConnected) {
  //     connect();
  //   }
  // }, []);

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
        content: inputValue,
        isVisible: true,
        rawChatBody: { role: "user", content: inputValue },
      };

      if (!isConnected) {
        setError(
          "Wallet not connected, HederaChat wont be able to execute transactions!"
        );
        // return;
      }

      addMessage(newMessage);
      setInputValue("");
      setUploadedFiles([]);
      setShowUploadedFiles(false);
    }
  };

  return (
    <Card
      className={`fixed bottom-4 right-4 transition-all duration-300 ease-in-out flex flex-col
        ${
          isMinimized
            ? "w-64 h-12"
            : isFullScreen
            ? "w-[90vw] md:w-[95vw] h-[95vh]"
            : "w-[90vw] md:w-96 h-[550px]"
        }
      `}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      <CardHeader className={`flex flex-row items-center justify-between p-4 h-12 ${isMinimized?"":"border-border border-b"}`}>
        <span className="font-semibold">Chat Assistant</span>
        <div>
          {!isMinimized && (
            <Button variant="ghost" size="icon" onClick={toggleFullScreen}>
              {isFullScreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={toggleMinimize}>
            {isMinimized ? (
              <Maximize className="h-4 w-4 -mt-1" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      {!isMinimized && (
        <>
          <CardContent className="p-0 overflow-hidden flex flex-col relative w-full">
            {uploadedFiles.length > 0 && (
              <Collapsible
                open={showUploadedFiles}
                onOpenChange={setShowUploadedFiles}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full flex justify-between items-center px-4 py-2"
                  >
                    Uploaded Files ({uploadedFiles.length})
                    {showUploadedFiles ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <ScrollArea className="h-24 px-4">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2"
                      >
                        <div className="flex items-center">
                          <File className="h-4 w-4 mr-2" />
                          <span className="text-sm">{file.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </ScrollArea>
                </CollapsibleContent>
              </Collapsible>
            )}
            {(error || error2) && (
              <div className="bg-destructive text-destructive-foreground p-4 text-center">
                {error2 ? error2 : error}
              </div>
            )}
            <AutoHideScrollbar
              className="flex-1 overflow-y-auto p-4 space-y-2 chat-messages"
              style={config.customStyles?.messageContainer}
            >
              {messages.map(
                (message, index) =>
                  message.isVisible && (
                    <div
                      key={index}
                      className={`flex m-auto ${
                        isFullScreen && "w-11/12 md:w-3/4"
                      }`}
                    >
                      <div
                        className={`flex w-full flex-col gap-2 rounded-lg px-3 py-2 text-sm chat-message ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted "
                        }`}
                        style={
                          message.type === "user"
                            ? config.customStyles?.userMessage
                            : config.customStyles?.assistantMessage
                        }
                      >
                        {message.content && (
                          <MarkdownRenderer
                            components={{
                              a({ node, children, href, ...props }) {
                                return (
                                  <a
                                    href={href}
                                    className="text-primary-foreground hover:text-card underline"
                                    target={"_blank"}
                                    rel={"noopener noreferrer"}
                                    {...props}
                                  >
                                    {children}
                                  </a>
                                );
                              },
                            }}
                            content={message.content}
                          />
                        )}
                      </div>
                    </div>
                  )
              )}
              <div ref={messagesEndRef} />
            </AutoHideScrollbar>
          </CardContent>

          <CardFooter className="p-4 border-t mt-auto">
            <div className="flex items-center w-full space-x-2">
              <AutosizeTextarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  isDragActive ? "Drop files here" : "Type a message..."
                }
                className={`flex-grow resize-none ${
                  isDragActive ? "bg-accent" : ""
                }`}
                maxHeight={100}
                minHeight={20}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    formButtonRef.current
                  ) {
                    formButtonRef.current.click();
                  }
                }}
              />
              {/* <Button
                variant="ghost"
                size="icon"
                onClick={() => document.getElementById("fileInput")?.click()}
                disabled={isUploading}
              >
                <Paperclip className="h-4 w-4" />
              </Button> */}
              <Button
                ref={formButtonRef}
                onClick={handleSend}
                disabled={inProgress || isUploading}
              >
                {inProgress || isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardFooter>
        </>
      )}

      {isDragActive && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <p className="text-lg font-semibold">Drop files here (Max 5MB)</p>
        </div>
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <MarkdownRenderer content={alertContent.content}></MarkdownRenderer>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setIsAlertOpen(false)}>
              Okay
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ChatBox;
