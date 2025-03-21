"use server";

import fs from "fs/promises";
import path from "path";
import crypto from "crypto";


const MAX_TOKENS = 16;
const TEMPERATURE = 0.2;

// Types for HuggingFace API
interface HuggingFaceParameters {
  max_new_tokens: number;
  temperature: number;
  stop: string[];
  [key: string]: unknown;
}

interface CacheEntry {
  inputs: string;
  parameters: HuggingFaceParameters;
  response: HuggingFaceResponse[];
  cachedAt: string;
}

interface HuggingFaceResponse {
  generated_text: string;
}

class HuggingFaceCache {
  private cachePath: string;

  constructor(cachePath: string = ".cache") {
    this.cachePath = cachePath;
  }

  // Generate a hash of the request parameters to use as cache key
  private generateCacheKey(
    inputs: string,
    parameters: HuggingFaceParameters
  ): string {
    const data = JSON.stringify({ inputs, parameters });
    return crypto.createHash("md5").update(data).digest("hex");
  }

  // Ensure cache directory exists
  async initializeCache(): Promise<void> {
    try {
      await fs.access(this.cachePath);
    } catch {
      await fs.mkdir(this.cachePath);
    }
  }

  // Try to get cached response
  async getCached(
    inputs: string,
    parameters: HuggingFaceParameters
  ): Promise<CacheEntry | null> {
    const cacheKey = this.generateCacheKey(inputs, parameters);
    const cachePath = path.join(this.cachePath, `${cacheKey}.json`);

    try {
      const data = await fs.readFile(cachePath, "utf8");
      return JSON.parse(data) as CacheEntry;
    } catch {
      return null;
    }
  }

  // Save response to cache
  async saveToCache(
    inputs: string,
    parameters: HuggingFaceParameters,
    response: HuggingFaceResponse[]
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(inputs, parameters);
    const cachePath = path.join(this.cachePath, `${cacheKey}.json`);

    const cacheEntry: CacheEntry = {
      inputs,
      parameters,
      response,
      cachedAt: new Date().toISOString(),
    };

    await fs.writeFile(cachePath, JSON.stringify(cacheEntry));
  }
}

async function promptAI(
  input: string,
  model: string = "mistralai/Mistral-7B-Instruct-v0.3",
  temperature: number = TEMPERATURE
): Promise<string> {
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
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/" + model,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body,
      }
    );

    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      // throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data || !data[0] || !data[0].generated_text) {
      throw data.error;
    }
    return data[0].generated_text;
  } catch (error) {
    console.error("Error while fetching text generation:", error);
    throw error;
  }
}

async function promptAIWithCache(
  inputs: string,
  model: string = "mistralai/Mistral-7B-Instruct-v0.3",
  temperature: number = TEMPERATURE
): Promise<string> {
  const cache = new HuggingFaceCache();
  await cache.initializeCache();

  const parameters = {
    max_new_tokens: MAX_TOKENS,
    temperature,
    stop: ["."],
  };

  const cacheEntry = await cache.getCached(inputs, parameters);
  if (cacheEntry !== null) {
    console.log("cache hit");
    return cacheEntry.response[0].generated_text;
  }
  console.log("no cache hit");
  if (!process.env.HUGGING_FACE_API_KEY) {
    throw new Error("Missing Hugging Face API key");
  }
  try {
    const response = await fetch(
      "https://api-inference.huggingface.co/models/" + model,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs, parameters }),
      }
    );

    if (!response.ok) {
      console.error("API Error:", response);
      throw new Error(
        `API Call failed: ${response.status} ${response.statusText}`
      );
    }

    const result = (await response.json()) as HuggingFaceResponse[];

    await cache.saveToCache(inputs, parameters, result);

    return result[0].generated_text;
  } catch (error) {
    console.error("Error while fetching text generation:", error);
    throw error;
  }
}

export { promptAI, promptAIWithCache };
