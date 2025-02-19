import { useState, useCallback, useEffect } from "react";

// Example interface; adjust to fit your needs
interface ChatCompletionMessage {
	role: "system" | "user" | "assistant" | "tool";
	content?: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	tool_calls?: any;
}

export function useCompletion() {
	const [error, setError] = useState<Error | null>(null);
	const [loading, setLoading] = useState(false);
	const [messages, setMessages] = useState<ChatCompletionMessage[]>([]);
	const [systemPrompt, setSystemPrompt] = useState<string | null>(null);
	const [triggerSend, setTriggerSend] = useState(false);

	const reset = useCallback(() => {
		setMessages([]);
		setSystemPrompt(null);
	}, []);

	const sendMessages = useCallback(async () => {
		// Clear any existing error & set loading
		setError(null);
		setLoading(true);

		const messagesPack = systemPrompt
			? [{ role: "system", content: systemPrompt }, ...messages]
			: messages;

		try {
			const response = await fetch("/api/chat/completions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: messagesPack }),
			});

			if (!response.ok) {
				throw new Error(
					(await response.json()).error ||
						`Request failed with code ${response.status}`,
				);
			}

			if (!response.body) {
				throw new Error("No response body from server");
			}

			// Create a new assistant message to populate with streamed text
			setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

			const reader = response.body.getReader();
			const decoder = new TextDecoder();

			let done = false;
			while (!done) {
				const { value, done: doneReading } = await reader.read();
				done = doneReading;

				if (value) {
					const chunk = decoder.decode(value, { stream: true });

					// The server sends SSE-like lines in the format:  data: chunk\n\n
					const lines = chunk.split("\n\n");
					for (const line of lines) {
						if (line.startsWith("data: ")) {
							const data = line.slice("data: ".length);
							const { text, tool_calls } = JSON.parse(data);

							// Server might send "[DONE]" to signal completion
							if (text !== "[DONE]") {
								// Append chunk to the last assistant message in state
								setMessages((prev) => {
									const updated = [...prev];
									const lastIndex = updated.length - 1;
									if (lastIndex < 0) return updated;

									const lastMessage = updated[lastIndex];
									// Make sure it’s the assistant message we just added
									if (lastMessage.role === "assistant") {
										updated[lastIndex] = {
											...lastMessage,
											content: lastMessage.content + text,
										};
									}
									return updated;
								});
							}

							if (tool_calls) {
								setMessages((prev) => [
									...prev,
									{ role: "assistant", tool_calls },
								]);
							}
						}
					}
				}
			}
		} catch (err) {
			if (err instanceof Error) {
				setError(err);
			} else {
				setError(new Error("An unknown error occurred"));
			}
		} finally {
			setLoading(false);
		}
	}, [messages, systemPrompt]);

	const sendMessage = useCallback(
		(userMessage: string) => {
			setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
			sendMessages();
		},
		[sendMessages],
	);

	useEffect(() => {
		if (triggerSend) {
			sendMessages();
			setTriggerSend(false);
		}
	}, [triggerSend, sendMessages]);

	return {
		error,
		loading,
		messages,
		systemPrompt,
		setSystemPrompt,
		sendMessage,
		reset,
	};
}
