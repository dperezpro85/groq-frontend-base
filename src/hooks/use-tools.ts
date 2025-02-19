import { useEffect, useState } from "react";
import { useCompletion } from "./use-completion";

export interface ToolCall {
	type: "function";
	name: string;
	args: Record<string, unknown>;
}

export interface ToolResult {
	content: string;
}

export type ToolHandler = { handler: (tool: ToolCall) => Promise<ToolResult> };

export function useTools() {
	const completion = useCompletion();
	const [toolHandler, setToolHandler] = useState<ToolHandler | null>(null);
	const { messages, addMessageAndSend } = completion;

	useEffect(() => {
		if (messages.length > 0) {
			const lastMessage = messages[messages.length - 1];
			if (
				lastMessage.role === "assistant" &&
				Array.isArray(lastMessage.tool_calls)
			) {
				if (!toolHandler) {
					throw new Error("Tool handler not set");
				}

				const toolCall = lastMessage.tool_calls[0];

				toolHandler
					.handler({
						type: toolCall.type,
						name: toolCall.function.name,
						args: JSON.parse(toolCall.function.arguments),
					})
					.then((result) => {
						addMessageAndSend(
							{
								role: "tool",
								tool_call_id: toolCall.id,
								content: result.content,
								name: toolCall.function.name,
							},
							// true,
						);
					});
			}
		}
	}, [messages, addMessageAndSend, toolHandler]);

	return { ...completion, setToolHandler, toolHandler };
}
