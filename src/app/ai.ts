"use server";

/* eslint-disable @typescript-eslint/no-unused-vars */
import { HfInference } from "@huggingface/inference";
const API_URL =
  //   "https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-hf"; // im banned :(
  // "https://api-inference.huggingface.co/models/google/gemma-2b-it"; // dumb
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3"; // good but nemo might be even better
// "https://api-inference.huggingface.co/models/mistralai/Mistral-Nemo-Instruct-2407"; // really good on the playground but awful or CURL... I think they might have the wrong API connected to the playground

const MAX_TOKENS = 16;
const TEMPERATURE = 0.2;

async function promptAI(
  input: string,
  temperature: number = TEMPERATURE
): Promise<string> {
  // const systemPrompt = `You are MansplAI, an expert mainsplaining bot. Mansplain a brief (2-3 sentence paragraph) and humorous response to the query. Waste no opportunity to humble brag.`;
  // const query = `${systemPrompt}\nQuery:\n${input}`;
  const body = JSON.stringify({
    inputs: input,
    parameters: {
      max_new_tokens: MAX_TOKENS,
      temperature,
      stop: ["."],
    },
  });
  console.log("request body is:", body);
  if (!process.env.HUGGING_FACE_API_KEY) {
    throw new Error("Missing Hugging Face API key");
  }
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (!response.ok) {
      console.error("API Error:", response);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data[0].generated_text;
  } catch (error) {
    console.error("Error while fetching text generation:", error);
    throw error;
  }
}

export { promptAI };
