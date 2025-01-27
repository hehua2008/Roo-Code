import { ApiConfiguration } from "../shared/api"

export function checkExistKey(config: ApiConfiguration | undefined) {
	return config
		? [
				config.apiKey,
				config.glamaApiKey,
				config.openRouterApiKey,
				config.awsRegion,
				config.vertexProjectId,
				config.openAiApiKey,
				config.ollamaModelId,
				config.lmStudioModelId,
				config.anythingLLMModelId,
				config.geminiApiKey,
				config.openAiNativeApiKey,
				config.deepSeekApiKey,
				config.mistralApiKey,
				config.vsCodeLmModelSelector,
				config.anythingLLMApiKey,
			].some((key) => key !== undefined)
		: false
}
