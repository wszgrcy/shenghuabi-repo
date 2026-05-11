import { inject } from 'static-injector';

import { ChatMessageListOutputType } from '@shenghuabi/openai';

import { CHAT_VL_NODE_DEFINE } from '../chat.node.define';
import { createAssistantMessage } from '@shenghuabi/openai';

import { LogService } from '@cyia/external-call';

import {
  AbortSignalToken,
  ChatServiceToken,
  createLLMData,
  EnviromentParametersToken,
  NodeRunnerBase,
  RUNNER_ORIGIN_OUTPUT_KEY,
  TemplateFormatService,
} from '@shenghuabi/workflow';
import { bufferToImageBase64, imageExtract } from '@shenghuabi/knowledge/image';
import { vlMarkdownParser } from '@shenghuabi/knowledge/file-parser';
import { path } from '@cyia/vfs2';
import * as fs from 'fs/promises';
import sharp from 'sharp';

export class ChatVlRunner extends NodeRunnerBase {
  #format = inject(TemplateFormatService);
  #chatService = inject(ChatServiceToken);
  #envParameters = inject(EnviromentParametersToken);
  #abort = inject(AbortSignalToken);
  #channel = inject(LogService).getToken('chat');

  override async run() {
    const { metadataList, obj } = await this.getInputChat();
    const imageBuffer = this.#envParameters!['image'];
    // const inputJsonSchema = this.inputParams.get(DEFAULT_CHAT_SCHEMA_KEY);
    const nodeResult = this.getParsedNode(CHAT_VL_NODE_DEFINE);
    const config = nodeResult.data.config;

    const list = nodeResult.data.value;
    const historyList = list.map((item) => {
      const content = this.#format.interpolate(
        item.content
          .map((item) => (item.type === 'text' ? item.text : ''))
          .join('\n'),
        obj,
      );
      return {
        role: item.role,
        content: [{ type: 'text', text: content }],
      };
    }) as ChatMessageListOutputType;
    const lastUserItem = historyList.find((item) => item.role === 'user');
    const imageContent = {
      type: 'image_url' as const,
      image_url: {
        url: bufferToImageBase64({
          type: 'image/png',
          buffer: new Uint8Array(imageBuffer),
        }),
      },
    };
    if (lastUserItem) {
      lastUserItem.content.push(imageContent);
    } else {
      historyList.push({
        role: 'user',
        content: [imageContent],
      });
    }
    this.#channel?.info('节点对话配置', config?.llm);
    const llm = await this.#chatService.chat(this.mergeChatModel(config?.llm));
    const result = await llm.chat(
      {
        messages: historyList,
      },
      { signal: this.#abort },
    );

    const streamData = createLLMData({
      node: this.node,
      value: result.content,
      extra: {
        historyList: [],
        delta: '',
        content: result.content,
      },
    });
    (streamData.extra as any).data = config;
    let resultContent = streamData.value;
    historyList.push(createAssistantMessage(resultContent));
    streamData.extra.historyList = historyList;
    this.emitter.send(streamData);
    const content = result.content;
    const filePath = this.#envParameters!['filePath'];
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, path.extname(filePath));
    const imageDir = `${baseName}-asset`;
    const prefix = this.#envParameters!['prefix'];
    let imageIndex = 0;
    if (config?.format === 'markdown') {
      await fs.mkdir(path.join(dir, imageDir), { recursive: true });
      resultContent = await vlMarkdownParser(content, {
        imageGet: async (type, position) => {
          const metadata = await sharp(imageBuffer).metadata();
          const buffer = await imageExtract(
            imageBuffer,
            {
              left: (position[0] / 1000) * metadata.width,
              top: (position[1] / 1000) * metadata.height,
              width: ((position[2] - position[0]) / 1000) * metadata.width,
              height: ((position[3] - position[1]) / 1000) * metadata.height,
            },
            16,
          );
          const imageName = `${prefix}-${imageIndex++}`;
          const relPath = path.join(imageDir, `${imageName}.png`);
          await fs.writeFile(path.join(dir, relPath), buffer);
          return {
            src: relPath,
            title: imageName,
          };
        },
      });
    }
    return async (outputName: string) => {
      if (outputName === RUNNER_ORIGIN_OUTPUT_KEY) {
        return {
          value: streamData.value,
          dataId: streamData.dataId,
          extra: streamData.extra,
        };
      }

      return {
        value: resultContent,
        dataId: streamData.dataId,
        extra: streamData.extra,
      };
    };
  }
}
