import { apiClient } from './apiClient';

export enum Modality {
  AUDIO = 'AUDIO',
  TEXT = 'TEXT'
}

export type LiveServerMessage = any;

type GenerateParams = {
  model: string;
  contents: any;
  config?: {
    responseMimeType?: string;
    systemInstruction?: string;
  };
};

const flattenContentsToPrompt = (contents: any): string => {
  if (typeof contents === 'string') return contents;

  if (Array.isArray(contents)) {
    return contents
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item?.text) return String(item.text);
        if (Array.isArray(item?.parts)) {
          return item.parts
            .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
            .filter(Boolean)
            .join('\n');
        }
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }

  if (contents?.text) return String(contents.text);

  if (Array.isArray(contents?.parts)) {
    return contents.parts
      .map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
      .filter(Boolean)
      .join('\n');
  }

  return JSON.stringify(contents || {});
};

// Finds the first { inlineData: { mimeType, data } } part in a contents payload, however it's shaped
// (a bare parts array, or an array of { parts } items) — mirrors flattenContentsToPrompt's traversal.
const extractInlineData = (contents: any): { mimeType: string; data: string } | undefined => {
  const fromParts = (parts: any): { mimeType: string; data: string } | undefined => {
    if (!Array.isArray(parts)) return undefined;
    for (const p of parts) {
      if (p?.inlineData?.data && p?.inlineData?.mimeType) {
        return { mimeType: p.inlineData.mimeType, data: p.inlineData.data };
      }
    }
    return undefined;
  };

  if (Array.isArray(contents)) {
    for (const item of contents) {
      const found = fromParts(item?.parts);
      if (found) return found;
    }
    return undefined;
  }

  return fromParts(contents?.parts);
};

export class GoogleGenAI {
  constructor(_opts?: { apiKey?: string }) {}

  models = {
    generateContent: async (params: GenerateParams) => {
      const text = await apiClient.generateAiContent({
        prompt: flattenContentsToPrompt(params.contents),
        model: params.model,
        responseMimeType: params?.config?.responseMimeType,
        systemInstruction: params?.config?.systemInstruction,
        fileData: extractInlineData(params.contents),
      });

      if (text === null) {
        throw new Error('AI request failed. Check the backend AI configuration and try again.');
      }

      return { text };
    },

    generateContentStream: async (params: GenerateParams) => {
      const text = await apiClient.generateAiContent({
        prompt: flattenContentsToPrompt(params.contents),
        model: params.model,
        responseMimeType: params?.config?.responseMimeType,
        systemInstruction: params?.config?.systemInstruction,
        fileData: extractInlineData(params.contents),
      });

      if (text === null) {
        throw new Error('AI request failed. Check the backend AI configuration and try again.');
      }

      async function* stream() {
        yield { text };
      }

      return stream();
    }
  };

  live = {
    connect: async () => {
      throw new Error('Live voice mode is disabled in secure proxy mode.');
    }
  };
}
