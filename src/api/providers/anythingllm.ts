import { Anthropic } from "@anthropic-ai/sdk"
import OpenAI from "openai"
import { ApiHandler, SingleCompletionHandler } from "../"
import { ApiHandlerOptions, ModelInfo, openAiModelInfoSaneDefaults } from "../../shared/api"
import { convertToOpenAiMessages } from "../transform/openai-format"
import { ApiStream } from "../transform/stream"

export class AnythingLLMHandler implements ApiHandler, SingleCompletionHandler {
	private options: ApiHandlerOptions
	private client: OpenAI

	constructor(options: ApiHandlerOptions) {
		this.options = options
		this.client = new OpenAI({
			baseURL: (this.options.anythingLLMBaseUrl || "http://localhost:3001") + "/api/v1",
			apiKey: "noop",
		})
	}

	async *createMessage(systemPrompt: string, messages: Anthropic.Messages.MessageParam[]): ApiStream {
		const openAiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
			{ role: "system", content: systemPrompt },
			...convertToOpenAiMessages(messages),
		]

		try {
			const stream = await this.client.chat.completions.create(
				{
					model: this.getModel().id,
					messages: openAiMessages,
					temperature: 0,
					stream: true,
				},
				{
					path: "/openai/chat/completions",
				},
			)
			for await (const chunk of stream) {
				const delta = chunk.choices[0]?.delta
				if (delta?.content) {
					yield {
						type: "text",
						text: delta.content,
					}
				}
			}
		} catch (error) {
			// AnythingLLM doesn't return an error code/body for now
			throw new Error(
				"Please check the AnythingLLM developer logs to debug what went wrong. You may need to load the model with a larger context length to work with Roo Code's prompts.",
			)
		}
	}

	getModel(): { id: string; info: ModelInfo } {
		return {
			id: this.options.anythingLLMModelId || "",
			info: openAiModelInfoSaneDefaults,
		}
	}

	async completePrompt(prompt: string): Promise<string> {
		try {
			const response = await this.client.chat.completions.create(
				{
					model: this.getModel().id,
					messages: [{ role: "user", content: prompt }],
					temperature: 0,
					stream: false,
				},
				{
					path: "/openai/chat/completions",
				},
			)
			return response.choices[0]?.message.content || ""
		} catch (error) {
			throw new Error(
				"Please check the AnythingLLM developer logs to debug what went wrong. You may need to load the model with a larger context length to work with Roo Code's prompts.",
			)
		}
	}
}
