import { cn } from "@/lib/utils";
import {
  CallControls,
  CallingState,
  CallParticipantsList,
  CallStatsButton,
  PaginatedGridLayout,
  RecordingInProgressNotification,
  SpeakerLayout,
  StreamVideoEvent,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import React, { useEffect, useRef, useState } from "react";
import { LayoutList, MessageSquare, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import EndCallButton from "./EndCallButton";
import Loader from "./Loader";
import { useChannelStateContext } from "stream-chat-react";
import { useUser } from "@clerk/nextjs";
import { Input } from "./ui/input";
import { toast } from "@/hooks/use-toast";
import { AddParticipantModal } from "./AddParticipantModal";
import { Button } from "./ui/button";

// Define layout type options
type CallLayoutType = "grid" | "speaker-left" | "speaker-right";

const MeetingRoom = () => {
  const call = useCall(); // Current call instance
  const searchParams = useSearchParams();
  const isPersonalRoom = !!searchParams.get("personal");
  const router = useRouter();

  // UI state
  const [state, setState] = useState({
    layout: "speaker-left" as CallLayoutType,
    showParticipant: false,
    showChat: false,
    showAddParticipant: false,
    message: "",
  });

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Call state hook
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  // Chat context and current user info
  const { channel, messages } = useChannelStateContext();
  const { user } = useUser();

  // Listen for "call.ended" event (e.g., host ends the call)
  useEffect(() => {
    const handleCallEnded = (event: StreamVideoEvent) => {
      if (event.type === "call.ended") {
        router.push("/"); // Redirect to home
        toast({
          title: "Call ended",
          description: "Call has ended by the host.",
          variant: "destructive",
        });
      }
    };

    call?.on("call.ended", handleCallEnded);

    return () => {
      call?.off("call.ended", handleCallEnded);
    };
  }, [call, router]);

  // Show loader while joining
  if (callingState !== CallingState.JOINED) return <Loader />;

  // Renders the current call layout based on selected option
  const Calllayout = () => {
    switch (state.layout) {
      case "grid":
        return <PaginatedGridLayout />;
      case "speaker-right":
        return <SpeakerLayout participantsBarPosition="left" />;
      default:
        return <SpeakerLayout participantsBarPosition="right" />;
    }
  };

  // Render each chat message
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

  // Handle sending a chat message
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setState({ ...state, message: "" });
    channel?.sendMessage({ text: state.message });

    // Scroll to bottom
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  // Toggle chat visibility
  const handleShowChat = async () => {
    setState({ ...state, showChat: !state.showChat, showParticipant: false });

    // Scroll chat to bottom when opened
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  // Toggle participant list visibility
  const handleShowParticipant = () => {
    setState({
      ...state,
      showParticipant: !state.showParticipant,
      showChat: false,
    });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden pt-4 text-white">
      <div className="relative flex size-full items-center justify-center px-4">
        {/* Recording banner */}
        <div className="absolute top-0 left-6 w-full">
          <RecordingInProgressNotification />
        </div>

        {/* Chat panel */}
        <div
          className={cn("h-[calc(100vh-200px)] hidden mr-2", {
            "show-block": state.showChat,
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

            {/* Input field for chat */}
            <div className="px-3">
              <Input
                placeholder="Send a message"
                className="border-none bg-dark-3 focus-visible::ring-0 focus-visible:ring-offset-0"
                onChange={(e) =>
                  setState({ ...state, message: e.target.value })
                }
                value={state.message}
              />
            </div>
          </form>
        </div>

        {/* Call layout (video feeds) */}
        <div className="flex size-full max-w-[1000px] items-center">
          <Calllayout />
        </div>

        {/* Participant list panel */}
        <div
          className={cn("h-[calc(100vh-200px)] hidden ml-2", {
            "show-block": state.showParticipant,
          })}
        >
          <CallParticipantsList
            onClose={() => setState({ ...state, showParticipant: false })}
          />
          <div
            className={cn(
              "items-center justify-end h-[10%] bg-dark-1 rounded-b-[10px] hidden",
              {
                flex: call?.state.custom.is_scheduled,
              }
            )}
          >
            {/* Add participant button */}
            <Button
              onClick={() => setState({ ...state, showAddParticipant: true })}
              className="bg-blue-1 mx-3 y-2 rounded-[3px]"
            >
              Add Participant
            </Button>
            <AddParticipantModal
              isOpen={state.showAddParticipant}
              setIsOpen={() =>
                setState({ ...state, showAddParticipant: false })
              }
              onAdd={(email: string) => {
                call?.update({
                  custom: {
                    ...call.state.custom,
                    members: [...call.state.custom.members, email],
                  },
                });

                toast({
                  title: "Participant added",
                  description: "Participant added successfully.",
                  variant: "default",
                });

                setState({ ...state, showAddParticipant: false });
              }}
            />
          </div>
        </div>

        {/* Control buttons row */}
        <div className="fixed bottom-0 flex w-full items-center justify-center gap-5 flex-wrap pb-3">
          {/* Chat toggle button */}
          <button onClick={handleShowChat}>
            <div className="cursor-pointer rounded-2xl bg-[#19232D] px-4 py-2 hover:bg-[#4C535B]">
              <MessageSquare size={20} className="text-white" />
            </div>
          </button>

          {/* Default call control buttons (mic, cam, leave) */}
          <CallControls onLeave={() => router.push("/")} />

          {/* Layout switcher */}
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
                        setState((prev) => ({
                          ...prev,
                          layout: item.toLowerCase() as CallLayoutType,
                        }))
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

          {/* Call statistics */}
          <CallStatsButton />

          {/* Participant toggle button */}
          <button onClick={handleShowParticipant}>
            <div className="cursor-pointer rounded-2xl bg-[#19232D] px-4 py-2 hover:bg-[#4C535B]">
              <Users size={20} className="text-white" />
            </div>
          </button>

          {/* End call for everyone button (only if not personal room) */}
          {!isPersonalRoom && <EndCallButton />}
        </div>
      </div>
    </section>
  );
};

export default MeetingRoom;
