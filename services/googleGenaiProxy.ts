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

export class GoogleGenAI {
  constructor(_opts?: { apiKey?: string }) {}

  models = {
    generateContent: async (params: GenerateParams) => {
      const text = await apiClient.generateAiContent({
        prompt: flattenContentsToPrompt(params.contents),
        model: params.model,
        responseMimeType: params?.config?.responseMimeType,
        systemInstruction: params?.config?.systemInstruction,
      });

      return {
        text: text || '',
      };
    },

    generateContentStream: async (params: GenerateParams) => {
      const text = await apiClient.generateAiContent({
        prompt: flattenContentsToPrompt(params.contents),
        model: params.model,
        responseMimeType: params?.config?.responseMimeType,
        systemInstruction: params?.config?.systemInstruction,
      });

      async function* stream() {
        yield { text: text || '' };
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
