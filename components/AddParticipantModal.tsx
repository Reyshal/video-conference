"use client"; // This directive enables React Server Components to include client-side interactivity

// Import necessary UI components from the shadcn/ui library
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useState } from "react";

// Define the AddParticipantModal component
export function AddParticipantModal({
	onAdd, // Callback function to execute when a participant is added
	isOpen, // Boolean flag to control modal open/close state
	setIsOpen, // Function to toggle modal open/close
}: {
	onAdd: (email: string) => void;
	isOpen: boolean;
	setIsOpen: () => void;
}) {
	// Local state to hold the input email address
	const [email, setEmail] = useState("");

	// Handle adding the email when "Invite" is clicked
	const handleAdd = () => {
		if (email) {
			onAdd(email); // Call the provided callback with the email
			setEmail(""); // Clear the input field
		}
	};

	return (
		// Dialog component with controlled open state
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			{/* Modal content with styling */}
			<DialogContent className="bg-dark-1 border-none text-white">
				<DialogHeader>
					<DialogTitle>Add a Participant</DialogTitle>
					<DialogDescription>
						Enter the email of the participant you want to invite to the
						meeting.
					</DialogDescription>
				</DialogHeader>

				{/* Form layout with email input and submit button */}
				<form
					className="flex flex-col gap-4"
					onSubmit={(e) => e.preventDefault()} // Prevent default form submission
				>
					{/* Email input field */}
					<Input
						type="email"
						placeholder="participant@example.com"
						value={email}
						className="border-none bg-dark-3 focus-visible::ring-0 focus-visible:ring-offset-0"
						onChange={(e) => setEmail(e.target.value)} // Update state on input change
					/>

					{/* Footer with the Invite button */}
					<DialogFooter className="mt-1">
						<Button
							variant="default"
							onClick={handleAdd} // Trigger handleAdd when clicked
						>
							Invite
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
