import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { MessageSquare, Code, Zap, Menu } from "lucide-react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  duotoneSea,
  duotoneSpace,
} from "react-syntax-highlighter/dist/esm/styles/prism";
const markdownTheme = duotoneSpace;


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
              <Markdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    return match ? (
                      <div>
                        {/* @ts-ignore */}
                        <SyntaxHighlighter
                          style={markdownTheme as any}
                          language={match[1]}
                          PreTag="div"
                          wrapLines={true}
                          wrapLongLines={true}
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
                className="prose prose-invert max-w-none"
              >
                {`\`\`\`typescript
import { HederaChat } from 'hedera-chat-sdk';

const chat = new HederaChat({
  apiKey: 'your-api-key',
  theme: 'light',
  position: 'bottom-right'
});

chat.init();
                `}
              </Markdown>
            </CardContent>
          </Card>
        </section>

        <section className="text-center mb-16">
          <h3 className="text-2xl font-bold mb-4">Ready to get started?</h3>
          <Button size="lg">Sign Up for Free</Button>
        </section>
      </main>

      <footer className="bg-muted py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
          © 2024 HederaChat SDK. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
