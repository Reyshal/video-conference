"use client";

import Loader from "@/components/Loader";
import { useUser } from "@clerk/nextjs";
import { Chat, useCreateChatClient } from "stream-chat-react";

interface StreamChatProviderProps {
  apiKey: string;
  tokenProvider: () => Promise<string>;
  children: React.ReactNode;
}

export const StreamChatProvider = ({
  apiKey,
  tokenProvider,
  children,
}: StreamChatProviderProps) => {
  const { user } = useUser();
  const chatClient = useCreateChatClient({
    apiKey,
    tokenOrProvider: tokenProvider,
    userData: {
      id: user?.id as string,
      name: user?.primaryEmailAddress?.emailAddress,
      username: user?.firstName as string,
      image: user?.imageUrl as string,
    },
  });

  if (!chatClient) return <Loader />;

  return <Chat client={chatClient}>{children}</Chat>;
};
