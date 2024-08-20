import React, { createContext, useContext, useState, useCallback } from 'react';


export type UploadedFile = {
  name: string;
  url: string;
  type: string;
};

type ChatContextType = {
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  uploadedFiles: UploadedFile[];
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  isUploading: boolean;
  showUploadedFiles:boolean;
  setShowUploadedFiles:React.Dispatch<React.SetStateAction<boolean>>;
};

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showUploadedFiles, setShowUploadedFiles] = useState(false);
  const [isUploading, setIsUploading] = useState(false);


  return (
    <ChatContext.Provider
      value={{
        inputValue,
        setInputValue,
        uploadedFiles,
        isUploading,
        setIsUploading,
        setUploadedFiles,
        showUploadedFiles,
        setShowUploadedFiles
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChatState = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
