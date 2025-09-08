import { cn } from "@/lib/utils";
import {
	CallControls,
	CallingState,
	CallParticipantsList,
	PaginatedGridLayout,
	RecordingInProgressNotification,
	StreamVideoEvent,
	useCall,
	useCallStateHooks,
} from "@stream-io/video-react-sdk";
import React, { useEffect, useRef, useState } from "react";
import { MessageSquare, Users } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import EndCallButton from "./EndCallButton";
import Loader from "./Loader";
import { useChannelStateContext } from "stream-chat-react";
import { useUser } from "@clerk/nextjs";
import { Input } from "./ui/input";
import { toast } from "@/hooks/use-toast";
import { AddParticipantModal } from "./AddParticipantModal";
import { Button } from "./ui/button";
import { IoIosClose } from "react-icons/io";
import { IoSend } from "react-icons/io5";

const MeetingRoom = () => {
	const call = useCall(); // Current call instance
	const searchParams = useSearchParams();
	const isPersonalRoom = !!searchParams.get("personal");
	const router = useRouter();

	// UI state
	const [state, setState] = useState({
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

	// Grid layout is default

	// Render each chat message
	const renderedMessages = messages?.map((message) => {
		return (
			<div key={message.id} className="flex flex-col px-5">
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
					className={cn(
						"fixed z-50 left-0 top-0 bottom-0 w-full max-w-[500px] transition-transform duration-300 ease-out",
						{
							"-translate-x-full": !state.showChat,
							"translate-x-0": state.showChat,
						}
					)}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="pb-5 h-screen bg-dark-1">
						<div className="h-[10vh] px-5 py-5 flex justify-between items-center">
							<p>Meeting Chat</p>
							<button onClick={handleShowChat}>
								<IoIosClose className="text-3xl" />
							</button>
						</div>
						<form
							onSubmit={handleSendMessage}
							className="h-[90vh] gap-4 w-full text-sm flex flex-col justify-between"
						>
							<div
								ref={chatContainerRef}
								className="w-full overflow-y-scroll h-[80vh] flex flex-col gap-3"
							>
								{renderedMessages}
							</div>

							<div className="pb-5 flex gap-3 justify-between px-5">
								<div className="flex-1">
									<Input
										placeholder="Send a message"
										className="border-none bg-dark-3 focus-visible::ring-0 focus-visible:ring-offset-0 w-full"
										onChange={(e) =>
											setState({ ...state, message: e.target.value })
										}
										value={state.message}
									/>
								</div>

								<Button
									type="submit"
									className="flex items-center gap-2 bg-dark-3 hover:bg-dark-2 text-white h-10"
								>
									<IoSend className="text-xl" />
								</Button>
							</div>
						</form>
					</div>
				</div>

				{/* Backdrop to close side panels when clicking outside */}
				{(state.showChat || state.showParticipant) && (
					<div
						className="fixed inset-0 z-40 bg-black/40"
						onClick={() =>
							setState({ ...state, showChat: false, showParticipant: false })
						}
					/>
				)}

				{/* Call layout (video feeds) */}
				<div className="flex size-full max-w-[1000px] items-center">
					<PaginatedGridLayout />
				</div>

				{/* Participant list panel */}
				<div
					className={cn(
						"fixed z-50 right-0 top-0 bottom-0 w-full max-w-[500px] transition-transform duration-300 ease-out",
						{
							"translate-x-full": !state.showParticipant,
							"translate-x-0": state.showParticipant,
						}
					)}
					onClick={(e) => e.stopPropagation()}
				>
					<div className="px-5 pb-5 h-full bg-dark-1 flex flex-col">
						<div className="py-5 flex justify-between items-center">
							<p>Participants</p>
							<button
								onClick={() => setState({ ...state, showParticipant: false })}
							>
								<IoIosClose className="text-3xl" />
							</button>
						</div>

						<div className="flex-1 overflow-hidden">
							<CallParticipantsList
								onClose={() => setState({ ...state, showParticipant: false })}
							/>
						</div>

						<div
							className={cn(
								"items-center justify-end bg-dark-1 rounded-b-[10px] hidden",
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
				</div>

				{/* Control buttons row */}
				<div className="fixed bottom-0 flex w-full items-center justify-center gap-5 gap-y-3 flex-wrap pb-3 px-3">
					{/* Chat toggle button */}
					<button onClick={handleShowChat}>
						<div className="cursor-pointer rounded-2xl bg-[#19232D] px-4 py-2 hover:bg-[#4C535B]">
							<MessageSquare size={20} className="text-white" />
						</div>
					</button>

					{/* Default call control buttons (mic, cam, leave) */}
					<CallControls onLeave={() => router.push("/")} />

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
