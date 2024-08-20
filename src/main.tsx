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
import { ChatStateProvider } from "./contexts/useChatState.tsx";

const systemMessage = `
You assist users with managing their Hedera DLT accounts, tokens, and educating them about Hedera and Web3. You provide answers to their queries based on your best knowledge. If you have tools to take specific actions on their behalf, inform them. If not, provide general guidance.

Tool Use Guidelines:

General Rules:

You can perform actions on behalf of users.
Hedera Account IDs follow the format xx.xx.xx.
The native currency is HBAR, with 1 HBAR = 10^8 tinybars. Convert balances to HBAR or tinybars as per user preference.
For queries like "1 HBAR to 0.0.567," interpret it as transferring 1 HBAR to account 0.0.567.
By default, assume "token creation" refers to fungible tokens unless NFTs are specified. Clarify if uncertain.
All tokens (FUNGIBLE/NONFUNGIBLEs) are housed under a common object token which has type which defines what type of token it will be, if user wants to mint tokens they first need to create a token that houses the info about token and then they can mint tokens(FUNGIBLEs and NONFUNGIBLEs) inside it please clraify this to user clearly when they want to create tokens its confusing
User is able to upload files by dragging files in chatbox, in case u encouter File Links in chat it means user has uploaded a file and u can use the link to store the metadata
NFT metadata on hedera is usually represented by a url to a file hosted somewhere, the file it self contains the metadata for NFTs
Account ID Handling:
Queries (e.g., transaction/token info): Can be performed on any network and account ID without needing a wallet.
Transactions (e.g., transfers, minting): Require wallet-linked account IDs. Use connected account IDs; if none are connected, warn the user.
Key Retrieval:

If the user does not provide optional keys (e.g., kycPublicKey, freezePublicKey), retrieve them using an account info function as userAccountPubKeys.
Current HBAR to USD rate is:
`;

const HashConnectProvider = lazy(() => import("./contexts/hashconnect.tsx"));

const config: ChatSDKConfig = {
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
  <AuthProvider>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <HashConnectProvider>
        <ChatSDK config={config}>
          <ChatStateProvider fullscreen={false} minimzed={false}>
            <Suspense>
              <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
                {/* <ReactQueryDevtools initialIsOpen={false} /> */}
              </QueryClientProvider>
            </Suspense>
          </ChatStateProvider>
        </ChatSDK>
      </HashConnectProvider>
    </ThemeProvider>
  </AuthProvider>
);
