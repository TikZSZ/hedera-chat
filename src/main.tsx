import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./scrollbar.css";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { ChatSDK, ChatSDKConfig, SnapSDK, tools } from "./HederaChat";
import { RouterProvider } from "react-router-dom";
import { router } from "./router.tsx";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const systemMessage = `You are an AI assistant for managing Hedera DLT accounts, topics, and tokens. Answer user queries about the Hedera network with your best knowledge, noting any limitations. You have tools to assist users as needed.

        Key details:

        - Account IDs follow the format xx.xx.xx.
        - The native currency is HBAR (hbar).
        - For queries like "1 HBAR to 0.0.567," understand it as sending 1 HBAR to account 0.0.567.
        - There are two typs of Tokens in hedera, FUNGIBLE (also known as TOKEN dont get confused here) and NON_FUNGIBLE (NFT Tokens), TOKEN refers to fungible tokens 
        - IF user asks for creating token, it will mostly mean FUNGIBLEs as they are also called tokens but the all FUNGIBLEs and NONFUNGIBLEs are subclass of Token just one type of it is also reffered as Token, so if you are  confused ask user for more info
        Account ID Handling:

### Below are some rules you will follow for function calling

User connected accountIDs will be listed at the end of this message. If none are there it means user wallet is not connect, as such u must warn user, use the connected accounts when invoking tools that need accountId

Key Retrieval:
When optional keys like supplyPublicKey, kycPublicKey, freezePublicKey, etc., are not provided by the user, the model should invoke an account info retrieval function to fetch those keys. These are diffrent from accountIds and cant be inferred from connected account, as such you get userAccountPubKeys.
`;

const HashConnectProvider = lazy(() => import("./contexts/hashconnect.tsx"));

const config: ChatSDKConfig = {
  initialOpen: true,
  // customStyles: {
  //   chatWindow: { boxShadow: "0 0 20px rgba(0,0,0,0.1)"},
  //   userMessage: { backgroundColor: "#4a9c6d", color: "white" },
  //   assistantMessage: { backgroundColor: "#f0f0f0", color: "black" },
  // },
  messages: [
    {
      id: Date.now().toString(),
      type: "system",
      content: "",
      rawChatBody: {
        role: "system",
        content: systemMessage,
      },
    },
  ],
  tools: tools,
};

const queryClient = new QueryClient();
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
        <ChatSDK config={config}>
          <Suspense>
            <HashConnectProvider>
              <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                <ReactQueryDevtools initialIsOpen={false} />
              </QueryClientProvider>
            </HashConnectProvider>
          </Suspense>
        </ChatSDK>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
