import React, { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare, Code, Zap, Paperclip, Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Markdown = lazy(() => import("../MarkdownRenderer"));

// Simple loading component
// Improved loading components
const MarkdownLoading = () => (
  <div className="space-y-2">
    {/* <Skeleton className="h-4 w-[250px]" />
    <Skeleton className="h-4 w-[200px]" />
    <Skeleton className="h-4 w-[180px]" />
    <Skeleton className="h-[100px] w-full rounded-md" /> */}
    <div className="p-5 rounded-lg space-y-4">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  </div>
);

const ChatBoxLoading = () => (
  <div className="fixed bottom-4 right-4 md:w-96 md:h-[500px] w-11/12 h-[50%] bg-card border border-border rounded-lg shadow-lg">
    <div className="p-4 border-b border-border">
      <Skeleton className="h-6 w-[100px]" />
    </div>
    <div className="p-4 space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>

    <div className="fixed bottom-10 border-t w-full border-border ">
      <div className="flex mt-4 items-center space-x-2">
        <Skeleton className="ml-5 h-10 w-[250px]" />
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-9 w-9" />
      </div>
    </div>
  </div>
);

const SyntaxHighlighter = lazy(() =>
  import("react-syntax-highlighter").then((module) => ({
    default: module.PrismAsync,
  }))
);

import { duotoneSpace } from "react-syntax-highlighter/dist/esm/styles/prism";


const markdownTheme = duotoneSpace;

const ChatBox = lazy(() => import("../ChatBox"));

const LandingPage = () => {
  return (
    <div className="relative min-h-screen bg-background text-foreground">
      <main className="max-w-6xl mx-auto pt-40 px-4 ">
        <section className="text-center mb-16 min-h-fit">
          <h2 className="text-4xl font-bold mb-4">
            Empower Your Hedera dApp with AI Chat
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Add intelligent conversations and Web3 actions to your application
            with just a few lines of code.
          </p>
          <Button size="lg" className="mr-4">
            Try Demo
          </Button>
          <Button size="lg" variant="outline">
            View on GitHub
          </Button>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2" />
                AI-Powered Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              Engage users with an intelligent chatbot that understands Web3
              concepts and Hedera specifics.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Code className="mr-2" />
                Easy Integration
              </CardTitle>
            </CardHeader>
            <CardContent>
              Implement our SDK with just a few lines of code. No complex setup
              required.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="mr-2" />
                Web3 Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              Allow your AI assistant to perform blockchain actions via MetaMask
              integration.
            </CardContent>
          </Card>
        </section>

        <section className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2" />
                See it in Action
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<MarkdownLoading />}>
                <Markdown content={`\`\`\`typescript
import { HederaChat } from 'hedera-chat-sdk';

const chat = new HederaChat({
  apiKey: 'your-api-key',
  theme: 'light',
  position: 'bottom-right'
});

chat.init();
                `}>
                  
                </Markdown>
              </Suspense>
            </CardContent>
          </Card>
        </section>

        <section className="text-center mb-16">
          <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
          <Button size="lg">Sign Up for Free</Button>
        </section>
        <Suspense fallback={<ChatBoxLoading />}>
          <ChatBox fullscreen={false} minimzed={false} />
        </Suspense>
      </main>
    </div>
  );
};

export default LandingPage;
