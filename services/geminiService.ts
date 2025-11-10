
import { GoogleGenAI, Type } from "@google/genai";
import type { JsonPrompt } from '../types';

// Fix: Per Gemini API guidelines, API key must be read from process.env.API_KEY
if (!process.env.API_KEY) {
    // Provide a more specific error message for the environment
    throw new Error("API_KEY environment variable not set. Please set it in your project settings.");
}

// Fix: Initialize GoogleGenAI with a named apiKey parameter from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Fix: Define a response schema for consistent JSON output, as recommended by Gemini API guidelines.
const jsonPromptSchema = {
    type: Type.OBJECT,
    properties: {
        concept: { type: Type.STRING, description: 'Describe the main element and two supporting elements from the title. Do NOT use the words "seamless", "pattern", or "illustration".' },
        composition: { type: Type.STRING, description: 'Use this exact string: "Only a few elements are present, Elements randomly ultra airy scattered, not symmetrical, no overlaps or touching. Each stands individually with airy spacing, forming a full, distinct diamond-shaped composition without visible outlines. All elements must fit completely inside the diamond area, no parts cropped or touching edges.."' },
        color: { type: Type.STRING, description: 'List descriptive, non-gradient, muted/pastel color keywords that fit the theme. Example format: "soft, warm, muted, pastel, natural, non-gradient, festive winter tones (muted red, forest green, cream, light grey, beige)".' },
        background: { type: Type.STRING, description: 'Describe a single, vivid, harmonious background color. Example format: "bright, harmonious, single vivid tone (light icy blue)."' },
        mood: { type: Type.STRING, description: 'Provide a list of moods that match the theme, style, and colors.' },
        style: { type: Type.STRING, description: 'Name one specific art style (e.g., Scandinavian, Kawaii, Gouache painting) followed by 4 of its key characteristics. Example format: "Gouache painting, opaque pigments, matte finish, bold outlines".' },
        settings: { type: Type.STRING, description: 'Use this exact string: "--ar 1:1 --v 6 --style raw --q 2 --repeat 2"' },
    },
    required: ["concept", "composition", "color", "background", "mood", "style", "settings"]
};


export const generateTitle = async (userInput: string): Promise<string> => {
    const prompt = `
        You are an expert microstock keyword and title generator. Your task is to create a compelling and keyword-rich title for a seamless pattern based on the main element: "${userInput}".

        The title must follow this exact structure:
        1. [Main Element] Pattern Vector.
        2. Seamless [Main Element] Pattern with [Supporting Element 1] and [Supporting Element 2].
        3. [Concept/Theme].
        4. seamless pattern Background.

        Rules:
        - The title must contain the words "seamless" and "pattern".
        - [Supporting Element 1] and [Supporting Element 2] must be thematically related to the main element but distinct.
        - [Concept/Theme] should be a short, descriptive phrase (e.g., "Winter landscape", "Festive holiday design", "Abstract geometric shapes").
        - Use common, easily recognizable keywords for microstock platforms.
        - The entire output should be a single line of text.

        Example for "Christmas Tree":
        Christmas Tree Pattern Vector. Seamless Christmas Tree Pattern with reindeer and mountain. Winter landscape. seamless pattern Background.

        Now, generate a title for: "${userInput}"
    `;

    // Fix: Use ai.models.generateContent directly as per Gemini API guidelines
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text.trim();
};

export const generateJson = async (generatedTitle: string): Promise<JsonPrompt> => {
    // Fix: Simplified prompt to leverage responseSchema for JSON generation.
    const prompt = `
        You are an AI prompt engineer for image generation. Based on the provided microstock title, generate a JSON object describing an image generation prompt.
        The entire string of the generated JSON object must be under 910 characters.

        Microstock Title: "${generatedTitle}"
    `;

    // Fix: Use ai.models.generateContent and responseSchema for reliable JSON output.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: jsonPromptSchema
        },
    });
    
    // Fix: Parse JSON directly from response text, with error handling.
    try {
        return JSON.parse(response.text) as JsonPrompt;
    } catch (e) {
        console.error("Failed to parse JSON from response:", e);
        throw new Error("Failed to generate a valid JSON prompt.");
    }
};

export const modifyJson = async (currentJson: JsonPrompt, modificationType: 'color' | 'style'): Promise<JsonPrompt> => {
    let prompt = '';
    // Fix: Simplified prompts to leverage responseSchema for JSON modification.
    if (modificationType === 'color') {
        prompt = `
            You are an AI prompt engineer. You will be given a JSON object for an image generation prompt.
            Your task is to ONLY modify the "color" and "background" values to a new, different color palette that still fits the existing "concept" and "style".
            Do not change any other keys.
            The entire string of the generated JSON object must be under 910 characters.

            Current JSON:
            ${JSON.stringify(currentJson)}

            Generate the new, complete JSON object with only the "color" and "background" changed.
        `;
    } else { // 'style'
        prompt = `
            You are an AI prompt engineer. You will be given a JSON object for an image generation prompt.
            Your task is to change the "style" to a completely new and different art style.
            You MUST also update the "color", "background", and "mood" values to be consistent with the new style.
            Do not change the "concept", "composition", or "settings" keys.
            The entire string of the generated JSON object must be under 910 characters.

            Current JSON:
            ${JSON.stringify(currentJson)}

            Generate the new, complete JSON object with "style", "color", "background", and "mood" changed.
        `;
    }

    // Fix: Use ai.models.generateContent and responseSchema for reliable JSON output.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: jsonPromptSchema,
        }
    });
    
    // Fix: Parse JSON directly from response text, with error handling.
    try {
        return JSON.parse(response.text) as JsonPrompt;
    } catch (e) {
        console.error("Failed to parse JSON from response:", e);
        throw new Error("Failed to modify the JSON prompt.");
    }
};
