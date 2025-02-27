import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatMilliseconds(ms: number): string {
	if (ms < 0) throw new Error("Milliseconds cannot be negative");

	const totalSeconds = Math.floor(ms / 1000);
	const milliseconds = (ms % 1000) / 100;

	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = totalSeconds % 60;

	const pad = (num: number): string => num.toString().padStart(2, "0");

	return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}s ${milliseconds.toFixed(1)}`;
}


export async function postData(url: string, data: object) {
	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		throw new Error(`Error in the API.`);
	}

	return response.json();
}