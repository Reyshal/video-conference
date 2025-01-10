import { cn } from "@/lib/utils";
import {
  CallControls,
  CallingState,
  CallParticipantsList,
  CallStatsButton,
  PaginatedGridLayout,
  RecordingInProgressNotification,
  SpeakerLayout,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useRef, useState } from "react";
import { LayoutList, MessageSquare, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import EndCallButton from "./EndCallButton";
import Loader from "./Loader";
import { useChannelStateContext } from "stream-chat-react";
import { useUser } from "@clerk/nextjs";
import { Input } from "./ui/input";

type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

const MeetingRoom = () => {
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const router = useRouter();
  const [layout, setLayout] = useState<CallLayoutType>("speaker-left");
  const [showParticipant, setShowParticipant] = useState<boolean>(false);
  const [showChat, setShowChat] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const { channel, messages } = useChannelStateContext();
  const { user } = useUser();

  if (callingState !== CallingState.JOINED) return <Loader />;

  const Calllayout = () => {
    switch (layout) {
      case "grid":
        return <PaginatedGridLayout />;
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  const renderedMessages = messages?.map((message) => {
    return (
      <div key={message.id} className="flex flex-col">
        {message.user?.id === user?.id ? (
          <div className="self-end">
            <p className="text-sm pb-1">You</p>
            <p className="py-2 px-4 bg-dark-4 text-sm rounded">
              {message.text}
            </p>
          </div>
        ) : (
          <div className="self-start">
            <p className="text-sm pb-1">{message.user?.name}</p>
            <p className="py-2 px-4 bg-dark-3 text-sm rounded">
              {message.text}
            </p>
          </div>
        )}
      </div>
    );
  });

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setMessage("");
    channel?.sendMessage({ text: message });

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const handleShowChat = async () => {
    setShowChat((prev) => !prev);
    setShowParticipant(false);

    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  const handleShowParticipant = () => {
    setShowParticipant((prev) => !prev);
    setShowChat(false);
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center px-4">
        <div className="absolute top-0 left-6 w-full">
          <RecordingInProgressNotification />
        </div>
        <div
          className={cn("h-[calc(100vh-200px)] hidden mr-2", {
            "show-block": showChat,
          })}
        >
          <form
            onSubmit={handleSendMessage}
            className="flex flex-col gap-4 bg-dark-1 h-full py-5 w-full rounded-[10px] text-sm"
          >
            <p className="px-3">Meeting Chat</p>
            <div
              ref={chatContainerRef}
              className="h-full overflow-y-scroll flex flex-col gap-3 px-3"
            >
              {renderedMessages}
            </div>

            <div className="px-3">
              <Input
                placeholder="Send a message"
                className="border-none bg-dark-3 focus-visible::ring-0 focus-visible:ring-offset-0"
                onChange={(e) => setMessage(e.target.value)}
                value={message}
              />
            </div>
          </form>
        </div>

        <div className="flex size-full max-w-[1000px] items-center">
          <Calllayout />
        </div>
        <div
          className={cn("h-[calc(100vh-200px)] hidden ml-2", {
            "show-block": showParticipant,
          })}
        >
          <CallParticipantsList onClose={() => setShowParticipant(false)} />
        </div>

        <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 flex-wrap pb-3">
          <button onClick={handleShowChat}>
            <div className="cursor-pointer rounded-2xl bg-[#19232D] px-4 py-2 hover:bg-[#4C535B]">
              <MessageSquare size={20} className="text-white" />
            </div>
          </button>
          <CallControls onLeave={() => router.push("/")} />
          <DropdownMenu>
            <div className="flex items-center">
              <DropdownMenuTrigger className="cursor-pointer rounded-2xl bg-[#19232D] px-4 py-2 hover:bg-[#4C535B]">
                <LayoutList size={20} className="text-white" />
              </DropdownMenuTrigger>
            </div>
            <DropdownMenuContent className="bg-dark-1 border-dark-1 text-white">
              {["Grid", "Speaker Left", "Speaker Right"].map((item, index) => {
                return (
                  <div key={index}>
                    <DropdownMenuItem
                      className="cursor-pointer"
                      onClick={() =>
                        setLayout(item.toLowerCase() as CallLayoutType)
                      }
                    >
                      {item}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="border-dark-1" />
                  </div>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
          <CallStatsButton />
          <button onClick={handleShowParticipant}>
            <div className="cursor-pointer rounded-2xl bg-[#19232D] px-4 py-2 hover:bg-[#4C535B]">
              <Users size={20} className="text-white" />
            </div>
          </button>
          {!isPersonalRoom && <EndCallButton />}
        </div>
      </div>
    </section>
  );
};

export default MeetingRoom;
