import { $getEditor } from 'lexical';
import { LexicalPlugin } from '../../lexical-plugin';

import { TextMatchTransformer } from '@lexical/markdown';
import { Injector, Provider } from '@angular/core';
import { $createImageNode, $isImageNode, ImageNode } from './ImageNode';
import ImagesPlugin, { INSERT_IMAGE_COMMAND } from './ImagesPlugin';
import { CardEditorService, NODE_ITEM_META } from '../../card-editor.service';
import { IMAGE_FORM_CONFIG } from './config';
import { firstValueFrom } from 'rxjs';

export class ImageLexicalPlugin extends LexicalPlugin {
  override node = ImageNode as any;
  override name = ImageNode.getType();
  constructor(registerProviders?: () => Provider[]) {
    super();
    this.registerProviders = registerProviders;
  }
  override registerPlugin = () => {
    return ImagesPlugin;
  };

  override markdownToNode = (injector: Injector, root?: string) => {
    return {
      dependencies: [ImageNode],
      export: (node) => {
        if (!$isImageNode(node)) {
          return null;
        }
        // todo 这里有问题?因为src是个相对路径,所以需要一个真的路径.但是真路径不能写这里,因为会影响移动
        return `![${node.options.altText || ''}](${node.options.src})`;
      },
      importRegExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))/,
      regExp: /!(?:\[([^[]*)\])(?:\(([^(]+)\))$/,
      replace: (textNode, match) => {
        const editor = $getEditor();
        const [, altText, srcMetaStr] = match;
        // todo. 应该用Indexof更好些
        const srcMetaList = srcMetaStr.split(' ?');
        const src = srcMetaList[0];
        const options = srcMetaList[1]
          ? JSON.parse(decodeURIComponent(srcMetaList[1]))
          : {};
        if (options.mode === 'move') {
          editor.update(() => {
            const imageNode = $createImageNode({
              altText,
              src,
              ...options.payload,
            });
            textNode.replace(imageNode);
          });
        } else {
          injector
            .get(CardEditorService)
            .util()!
            .saveFile({ filePath: src })
            .then((filePath) => {
              editor.update(() => {
                const imageNode = $createImageNode({
                  altText,
                  src: filePath!,
                });
                textNode.replace(imageNode);
              });
            });
        }
      },
      trigger: ')',
      type: 'text-match',
    } as TextMatchTransformer;
  };
  override insertTool = () => {
    return [
      {
        icon: 'image',
        label: `图片`,
        type: 'image',
        keywords: ['image', 'photo', 'picture', 'file'],
        disable: {
          convert: true,
        },
        data: {},
        on: {
          select: async (editor, injector) => {
            const service = injector.get(CardEditorService);
            const ref = service
              .util()!
              .openDialog(IMAGE_FORM_CONFIG, {}, {}, '插入图片', injector, {
                beforeClose: async (data: { src: string }) => {
                  const fileName = await service.util()!.saveFile({
                    filePath: data.src,
                  });
                  return { ...data, src: fileName };
                },
              });

            const result = await firstValueFrom((await ref).afterClosed());
            if (!result) {
              return;
            }
            editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
              altText: '',
              src: result.src,
            });
          },
          insertAfter: async () => {
            // const ref = this.dialog.open(NewConfigComponent, {
            //   data: {
            //     title: '插入图片',
            //     fields: IMAGE_FORM_CONFIG,
            //   },
            // });
            // const result = await firstValueFrom(ref.afterClosed());
            // if (!result) {
            //   return;
            // }
            // this.editor()!.dispatchCommand(INSERT_NEW_LINE, {
            //   type: 'table',
            //   data: result,
            // });
          },
        },
      },
    ] as NODE_ITEM_META[];
  };
}
export * from './token';
export * from './ImageNode';
