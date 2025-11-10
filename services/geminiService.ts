
import { GoogleGenAI } from "@google/genai";
import type { JsonPrompt } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const model = ai.models;

const extractJson = (text: string): object | null => {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        try {
            return JSON.parse(match[1]);
        } catch (e) {
            console.error("Failed to parse JSON from response:", e);
            return null;
        }
    }
    // Fallback for non-fenced JSON
    try {
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
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

    const response = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });

    return response.text.trim();
};

export const generateJson = async (generatedTitle: string): Promise<JsonPrompt> => {
    const prompt = `
        You are an AI prompt engineer for image generation. Based on the provided microstock title, generate a JSON object with specific keys.

        Microstock Title: "${generatedTitle}"

        Generate a JSON object with the following keys and constraints:
        - "concept": Describe the main element and two supporting elements from the title. Do NOT use the words "seamless", "pattern", or "illustration".
        - "composition": Use this exact string: "Only a few elements are present, Elements randomly ultra airy scattered, not symmetrical, no overlaps or touching. Each stands individually with airy spacing, forming a full, distinct diamond-shaped composition without visible outlines. All elements must fit completely inside the diamond area, no parts cropped or touching edges.."
        - "color": List descriptive, non-gradient, muted/pastel color keywords that fit the theme. Example format: "soft, warm, muted, pastel, natural, non-gradient, festive winter tones (muted red, forest green, cream, light grey, beige)".
        - "background": Describe a single, vivid, harmonious background color. Example format: "bright, harmonious, single vivid tone (light icy blue)."
        - "mood": Provide a list of moods that match the theme, style, and colors.
        - "style": Name one specific art style (e.g., Scandinavian, Kawaii, Gouache painting) followed by 4 of its key characteristics. Example format: "Gouache painting, opaque pigments, matte finish, bold outlines".
        - "settings": Use this exact string: "--ar 1:1 --v 6 --style raw --q 2 --repeat 2"

        The final JSON output must be valid JSON, enclosed in a single markdown code block (\`\`\`json ... \`\`\`), and the entire string must be under 910 characters.
    `;

    const response = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    const parsedJson = extractJson(response.text);

    if (!parsedJson) {
        throw new Error("Failed to generate a valid JSON prompt.");
    }
    return parsedJson as JsonPrompt;
};

export const modifyJson = async (currentJson: JsonPrompt, modificationType: 'color' | 'style'): Promise<JsonPrompt> => {
    let prompt = '';
    if (modificationType === 'color') {
        prompt = `
            You are an AI prompt engineer. You will be given a JSON object for an image generation prompt.
            Your task is to ONLY modify the "color" and "background" values to a new, different color palette that still fits the existing "concept" and "style".
            Do not change any other keys.

            Rules for "color":
            - List descriptive, non-gradient, muted/pastel color keywords.
            - Example format: "soft, cool, muted, pastel, natural, non-gradient, winter night tones (deep blue, silver, white, light grey, soft purple)".

            Rules for "background":
            - Describe a single, vivid, harmonious background color that complements the new "color" palette.
            - Example format: "bright, harmonious, single vivid tone (deep navy blue)."

            Current JSON:
            ${JSON.stringify(currentJson)}

            Generate the new, complete JSON object with only the "color" and "background" changed, enclosed in a single markdown code block. The entire string must be under 910 characters.
        `;
    } else { // 'style'
        prompt = `
            You are an AI prompt engineer. You will be given a JSON object for an image generation prompt.
            Your task is to change the "style" to a completely new and different art style.
            You MUST also update the "color", "background", and "mood" values to be consistent with the new style.
            Do not change the "concept", "composition", or "settings" keys.

            Rules for "style":
            - Name one specific art style (e.g., Art Deco, Cyberpunk, Watercolor) followed by 4 of its key characteristics.

            Rules for "color" and "background":
            - The colors must match the new style.
            - Follow the format constraints: non-gradient, single background color.

            Current JSON:
            ${JSON.stringify(currentJson)}

            Generate the new, complete JSON object with "style", "color", "background", and "mood" changed, enclosed in a single markdown code block. The entire string must be under 910 characters.
        `;
    }

    const response = await model.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
    });
    const parsedJson = extractJson(response.text);

    if (!parsedJson) {
        throw new Error("Failed to modify the JSON prompt.");
    }
    return parsedJson as JsonPrompt;
};
