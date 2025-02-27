"use client";

import {
    type ToolCall,
    useCompletionWithTools,
} from "@/hooks/use-completion-tools";
import {ChatComponent} from "./components/chat-component";
import type {ChatCompletionTool} from "groq-sdk/resources/chat/completions.mjs";
import {postData} from "@/lib/utils";
import {Course} from "@/services/courseService";

/**
 *
 *
 *
 * GROQ Template
 * Adjust this system prompt to change the behavior of the assistant.
 *
 */
const systemPrompt = `
Soy un asistente de IA para vwgroupacademy que te ayudará a obtener información sobre el clima y los cursos disponibles.`;

/**
 *
 *
 *
 * GROQ Template
 * Adjust this default prompt to have the conversation start with the user.
 * https://console.groq.com/docs/text-chat
 */
const prompt = "Dame una lista de cursos disponibles por favor";

/**
 *
 *
 *
 * GROQ Template
 * Adjust the tools definition to match your tools
 * https://console.groq.com/docs/tool-use
 */
const tools: ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "get_courses",
            description: "Get the available courses",
            parameters: {
                type: "object",
                properties: {
                    date: {type: "string"},
                },
            },
        },
    },
    {
        type: "function",
        function: {
            name: "get_current_weather",
            description: "Get the current weather",
            parameters: {
                type: "object",
                properties: {
                    location: {type: "string"},
                },
            },
        },
    },
];

/**
 *
 *
 *
 * GROQ Template
 * Adjust the handler to execute your tools
 * https://console.groq.com/docs/tool-use
 */
const toolHandler = {
    handler: async (tool: ToolCall): Promise<any> => {
        try {
            if (tool.name === "get_courses") {
                //const { date } = tool.args;
                const results = await postData("/api/courses", {datestart: '2025-03-01'});
                const data = results.data.map((course: Course) => `Curso: ${course.name}, Fecha: ${course.start_date}, Disponibles: ${course.availability}`)
                return {
                    content: JSON.stringify(data)
                };
            } else if (tool.name === "get_current_weather") {
                const {location} = tool.args;
                const results = await postData("/api/weather", {city: location});
                return {
                    content: JSON.stringify({
                        city: results.city,
                        weather: results.description,
                        temperature: results.temperature
                    }),
                };
            }
        } catch (error) {
            return {content: "No se pudo obtener la respuesta"}
        }
    },
};

export default function Home() {
    const {messages, error, sendMessage} = useCompletionWithTools({
        messages: [{role: "system", content: systemPrompt}],
        toolHandler,
        tools,
    });

    return (
        <main className="flex  h-svh ">
            <ChatComponent
                defaultPrompt={prompt}
                messages={messages}
                error={error}
                handleNewMessage={sendMessage}
            />
        </main>
    );
}
