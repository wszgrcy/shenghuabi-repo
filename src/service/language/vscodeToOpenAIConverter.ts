/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import type {
  ChatCompletionAssistantMessageParam,
  ChatCompletionContentPartImage,
  ChatCompletionContentPartText,
  ChatCompletionFunctionTool,
  ChatCompletionMessageFunctionToolCall,
  ChatCompletionMessageParam,
  ChatCompletionMessageToolCall,
  FunctionParameters,
} from 'openai/resources';
import * as vscode from 'vscode';

/** Internal content part type for document and image_url variants used during conversion */
interface ChatCompletionContentPartDocument {
  type: 'document';
  documentData: {
    data: string;
    mediaType: string;
  };
}

type ChatCompletionContentPartImageURL = ChatCompletionContentPartImage;

/** Combined content part type including custom document/image_url variants */
type ChatMessageContentPart =
  | ChatCompletionContentPartText
  | ChatCompletionContentPartDocument
  | ChatCompletionContentPartImageURL;

// ──────────────────────────────────────────────────────────────────────────────
// Source Attribution: The conversion logic below is adapted from the internal
// VS Code → OpenAI pipeline. Each section references its origin file and line.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Converts a vscode.LanguageModelChatRequestMessage to an OpenAI-compatible ChatMessage.
 *
 * Sources:
 * - Role mapping:     src/extension/conversation/vscode-node/languageModelAccess.ts L743-L760
 *                     (provideTokenCount method — role and content part conversion)
 * - Image handling:   src/extension/conversation/vscode-node/languageModelAccess.ts L725-L732
 *                     (isImageDataPart + base64 encoding logic)
 * - PDF/document:     src/extension/conversation/vscode-node/languageModelAccess.ts L722-L724
 *                     (LanguageModelDataPart for PDF documents)
 */
export function convertVSCodeMessageToOpenAI(
  message: vscode.LanguageModelChatRequestMessage,
): ChatCompletionMessageParam {
  const contentParts: ChatMessageContentPart[] = [];

  // vscode.LanguageModelChatRequestMessage.content is always ReadonlyArray<LanguageModelInputPart | unknown>
  const parts = [...message.content] as Array<vscode.LanguageModelInputPart>;

  // Source: src/extension/conversation/vscode-node/languageModelAccess.ts L720-L740
  // Converts vscode part types → OpenAI content part types
  for (const part of parts) {
    if (part instanceof vscode.LanguageModelTextPart) {
      let text = part.value.trim();
      if (text) {
        // vscode.LanguageModelTextPart → text content part
        contentParts.push({ type: 'text', text: text });
      }
    } else if (
      part instanceof vscode.LanguageModelDataPart &&
      part.mimeType === 'application/pdf'
    ) {
      // vscode.LanguageModelDataPart (PDF) → document content part
      // Source: src/extension/conversation/vscode-node/languageModelAccess.ts L722-L724
      const data = Buffer.from(part.data).toString('base64');
      contentParts.push({
        type: 'document',
        documentData: { data, mediaType: part.mimeType },
      });
    } else if (isChatImageDataPart(part)) {
      // vscode.LanguageModelDataPart (image) → image_url content part
      // Source: src/extension/conversation/vscode-node/languageModelAccess.ts L725-L728
      const base64Data = Buffer.from(part.data).toString('base64url');
      contentParts.push({
        type: 'image_url',
        image_url: { url: `data:${part.mimeType};base64,${base64Data}` },
      });
    } else if (part instanceof vscode.LanguageModelToolCallPart) {
      // Tool calls are handled separately — skip here, added to tool_calls below
      // Source: src/extension/conversation/vscode-node/languageModelAccess.ts L752-L760
    } else if (part instanceof vscode.LanguageModelToolResultPart) {
      return {
        role: 'tool',
        tool_call_id: part.callId,
        content: part.content
          .map((item) => {
            if (item instanceof vscode.LanguageModelTextPart) {
              return item.value;
            } else if (item instanceof vscode.LanguageModelPromptTsxPart) {
              return item.value;
            }
            return '';
          })
          .join('\n'),
      };
    }
  }

  const hasOnlyText =
    contentParts.length === 1 && contentParts[0].type === 'text';

  // Empty assistant message or no recognized content parts — check before multi-part
  if (
    message.role === vscode.LanguageModelChatMessageRole.Assistant &&
    contentParts.length === 0
  ) {
    // Handle tool calls without text content — empty string + tool_calls
    const toolCalls = convertVSCodeToolCalls(message);
    return {
      role: 'assistant',
      content: '',
      tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
    } as ChatCompletionAssistantMessageParam;
  }

  // Single text content → string for compatibility (OpenAI prefers strings when possible)
  if (hasOnlyText) {
    return {
      role: vscodeToOpenAIRole(message.role),
      content: (contentParts[0] as { type: 'text'; text: string }).text,
    } as ChatCompletionMessageParam;
  }

  // Multi-part message with images/documents → array content
  if (contentParts.length > 1 || !hasOnlyText) {
    return {
      role: vscodeToOpenAIRole(message.role),
      content: contentParts,
    } as ChatCompletionMessageParam;
  }
  // Default fallback for unrecognized content
  return {
    role: vscodeToOpenAIRole(message.role),
    content: '',
  } as ChatCompletionMessageParam;
}

/**
 * Converts a vscode.LanguageModelChatRequestMessage to OpenAI tool_call format.
 *
 * Source: src/extension/conversation/vscode-node/languageModelAccess.ts L754-L760
 *         (toolCalls mapping in provideTokenCount)
 */
function convertVSCodeToolCalls(
  message: vscode.LanguageModelChatRequestMessage,
): ChatCompletionMessageToolCall[] {
  // vscode.LanguageModelChatRequestMessage.content is always ReadonlyArray<LanguageModelInputPart | unknown>
  const parts = message.content as Array<vscode.LanguageModelInputPart>;

  const toolCallParts = parts.filter(
    (part) => part instanceof vscode.LanguageModelToolCallPart,
  ) as vscode.LanguageModelToolCallPart[];

  // Source: src/extension/conversation/vscode-node/languageModelAccess.ts L756-L759
  // Maps vscode tool call → OpenAI function call format

  return toolCallParts.map((part) => ({
    id: part.callId,
    type: 'function',
    function: {
      name: part.name,
      arguments: JSON.stringify(part.input),
    },
  }));
}

/**
 * Maps vscode.LanguageModelChatMessageRole enum to OpenAI ChatRole string value.
 *
 * Source: src/extension/conversation/vscode-node/languageModelAccess.ts L743-L751
 *         (provideTokenCount — role switch statement)
 *
 * Note: VS Code uses enum values (User=1, Assistant=2, System=3) while OpenAI
 *       uses string literals ("user", "assistant", "system").
 */
function vscodeToOpenAIRole(
  role: vscode.LanguageModelChatMessageRole,
): 'system' | 'user' | 'assistant' | 'tool' {
  switch (role) {
    case vscode.LanguageModelChatMessageRole.System:
      return 'system';
    case vscode.LanguageModelChatMessageRole.User:
      return 'user';
    case vscode.LanguageModelChatMessageRole.Assistant:
      return 'assistant';
    default:
      throw new Error(`Unknown message role: ${role}`);
  }
}

/**
 * Type guard to check if a part is an image data part.
 *
 * Source: src/extension/conversation/common/languageModelChatMessageHelpers.ts L17-L24
 *         (isImageDataPart function, adapted for direct use here)
 */
function isChatImageDataPart(
  part: unknown,
): part is vscode.LanguageModelDataPart {
  // Accept all image MIME types (vs the stricter ChatImageMimeType set in the original)
  if (part instanceof vscode.LanguageModelDataPart) {
    return /^image\/(png|jpeg|jpg|gif|webp|bmp)$/.test(part.mimeType);
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────────────────
// Message Array Conversion
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Converts an array of vscode.LanguageModelChatRequestMessage to OpenAI-compatible messages.
 *
 * Sources:
 * - Array mapping:  src/platform/networking/common/openai.ts L163-L165
 *                   (rawMessageToCAPI array handling)
 */
export function convertVSCodeMessagesToOpenAI(
  messages: readonly vscode.LanguageModelChatRequestMessage[],
): ChatCompletionMessageParam[] {
  const result: ChatCompletionMessageParam[] = [];
  for (const msg of messages) {
    result.push(convertVSCodeMessageToOpenAI(msg));
  }
  return result;
}

// ──────────────────────────────────────────────────────────────────────────────
// Tool Conversion
// ──────────────────────────────────────────────────────────────────────────────

/**
 * An OpenAI-compatible function tool definition.
 *
 * Source: src/platform/networking/common/fetch.ts L289-L292
 *         (OpenAiFunctionTool interface)
 */
export type OpenAITool = ChatCompletionFunctionTool;

/**
 * Converts a vscode.LanguageModelChatTool[] to OpenAI function tools format.
 *
 * Source: src/extension/conversation/vscode-node/languageModelAccess.ts L593-L601
 *         (tools mapping in _provideLanguageModelResponse)
 */
// export function convertVSCodeToolsToOpenAI(
//   tools: Array<{ name: string; description: string; inputSchema?: object }>,
// ): OpenAITool[] {
//   return tools.map((tool) => ({
//     type: 'function',
//     function: {
//       name: tool.name,
//       description: tool.description,
//       parameters:
//         tool.inputSchema && Object.keys(tool.inputSchema).length
//           ? (tool.inputSchema as FunctionParameters)
//           : undefined,
//     },
//   }));
// }
