import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import {
  customProvider,
  extractReasoningMiddleware,
  wrapLanguageModel,
} from "ai";
import { isTestEnvironment } from "../constants";

const anthropic = createAnthropic();
const openai = createOpenAI();
const perplexity = createOpenAI({
  name: 'perplexity',
  baseURL: 'https://api.perplexity.ai/',
  apiKey: process.env.PERPLEXITY_API_KEY,
});

// Keep the test environment mock provider as-is
export const myProvider = isTestEnvironment
  ? (() => {
      const { artifactModel, chatModel, reasoningModel, titleModel } = require("./models.mock");
      return customProvider({
        languageModels: {
          "chat-model": chatModel,
          "chat-model-reasoning": reasoningModel,
          "title-model": titleModel,
          "artifact-model": artifactModel,
        },
      });
    })()
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  const [provider, ...rest] = modelId.split('/');
  const model = rest.join('/');

  const isReasoningModel =
    modelId.includes("reasoning") || modelId.endsWith("-thinking");

  let languageModel;
  switch (provider) {
    case 'anthropic':
      languageModel = anthropic(model);
      break;
    case 'openai':
      languageModel = openai(model);
      break;
    case 'perplexity':
      languageModel = perplexity(model);
      break;
    default:
      throw new Error(`Unknown provider: ${provider}`);
  }

  if (isReasoningModel) {
    return wrapLanguageModel({
      model: languageModel,
      middleware: extractReasoningMiddleware({ tagName: "thinking" }),
    });
  }

  return languageModel;
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("title-model");
  }
  return anthropic("claude-haiku-4-5");
}

export function getArtifactModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel("artifact-model");
  }
  return anthropic("claude-haiku-4-5");
}
