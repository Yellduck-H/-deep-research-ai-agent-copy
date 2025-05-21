'use client';

import { ThemeToggle } from "@/components/theme-toggle";
import { useChat } from "ai/react";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";

export default function HomePage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 滚动到最新消息
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <a className="mr-6 flex items-center space-x-2" href="/">
              {/* <Icons.logo className="h-6 w-6" /> */}
              <span className="hidden font-bold sm:inline-block">
                Deep Research AI Agent
              </span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-2">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Chat/Results Display Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/50">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground">Chat messages will appear here...</p>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  message.role === "user" ? "justify-end" : ""
                }`}
              >
                {message.role !== "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center">
                    AI
                  </div>
                )}
                
                <div
                  className={`p-3 rounded-lg border max-w-md ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  {message.role === "user" ? (
                    <p>{message.content}</p>
                  ) : (
                    <div className="prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code(props) {
                            const { children, className } = props;
                            const match = /language-(\w+)/.exec(className || '');
                            const language = match ? match[1] : '';
                            const isInline = !match;
                            
                            return isInline ? (
                              <code className={className}>{children}</code>
                            ) : (
                              <SyntaxHighlighter
                                style={vscDarkPlus}
                                language={language}
                                PreTag="div"
                              >
                                {String(children).replace(/\n$/, '')}
                              </SyntaxHighlighter>
                            );
                          }
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
                
                {message.role === "user" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    U
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} /> {/* 滚动锚点 */}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <form 
            onSubmit={handleSubmit} 
            className="relative flex max-w-2xl mx-auto items-center"
          >
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask a research question or type a message..."
              className="pr-16"
              disabled={isLoading}
            />
            <Button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-12"
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? "..." : "Send"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
