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
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (index: number) => void;
  showUploadedFiles: boolean;
  setShowUploadedFiles: React.Dispatch<React.SetStateAction<boolean>>;
};

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inputValue, setInputValue] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [showUploadedFiles, setShowUploadedFiles] = useState(false);


  const addUploadedFile = useCallback((file: UploadedFile) => {
    setUploadedFiles(prev => [...prev, file]);
    setShowUploadedFiles(true);
  }, []);

  const removeUploadedFile = useCallback((index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <ChatContext.Provider
      value={{
        inputValue,
        setInputValue,
        uploadedFiles,
        addUploadedFile,
        removeUploadedFile,
        showUploadedFiles,
        setShowUploadedFiles,
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
