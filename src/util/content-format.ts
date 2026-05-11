import { NodeWithChildren, Element } from 'domhandler';
import { ElementType, parseDocument } from 'htmlparser2';
import { render } from 'dom-serializer';
import { commandFormat } from './hover/command-format';
import { Injector } from 'static-injector';

import { MindService } from '../service/mind/mind.service';
import { path } from '@cyia/vfs2';
import { getImgSrcFactory } from '../share';

const MDX_URL_PREFIX = `entry://`;
function markdownMode(
  baseUrl: string,
  /**子点名属于字典entry跳转专用的 */ dictName: string,
  filePath: string,
  injector: Injector,
) {
  const aChange = (child: Element) => {
    const href = child.attribs['href'] as string | undefined;
    if (href?.startsWith(MDX_URL_PREFIX)) {
      child.attribs['data-href'] = commandFormat(
        'knowledge-query.open-dict-item-anchor',
        [dictName, href.slice(MDX_URL_PREFIX.length)],
      );
      delete child.attribs['href'];
    } else if (href?.startsWith(`file://`)) {
      child.attribs['data-href'] = href;
      child.attribs['title'] = href;
      delete child.attribs['href'];
    } else if (href?.startsWith('command:')) {
      child.attribs['data-href'] = href;
      delete child.attribs['href'];
    } else if (child.attribs['data-node-type']) {
      if (child.attribs['data-node-type'] === 'custom-link') {
        child.attribs['data-href'] = commandFormat('mind.focus-node', [
          filePath,
          child.attribs['data-move-node-id'],
        ]);
      }
    }
  };
  const imgChange = (child: Element) => {
    const src = child.attribs['src'] as string;
    if (!src || src.startsWith('data:image/')) {
      return;
    }
    child.attribs['src'] = getImgSrcFactory(baseUrl)(src);
  };
  const linkChange = async (child: Element) => {
    const href = child.attribs['href'] as string;
    const isTheme = 'data-theme' in child.attribs;
    if (isTheme) {
      const content = await injector.get(MindService).getNodeThemeItem(href);
      child.name = 'style';
      child.attribs = {};
      child.children = [
        {
          type: ElementType.Text,
          data: `@scope{${content}}`,
          parent: child,
        } as any,
      ];
      return;
    }

    if (!href) {
      return;
    }
    child.attribs['href'] =
      `vscode-file://vscode-app/${path.isAbsolute(href) ? href : path.join(baseUrl, href)}`;
  };
  return {
    a: aChange,
    img: imgChange,
    link: linkChange,
  };
}
async function visitAll(
  el: NodeWithChildren,
  nodeChangeObj: ReturnType<typeof markdownMode>,
) {
  for (let i = 0; i < el.children.length; i++) {
    const child = el.children[i];
    if (child.type === ElementType.Tag) {
      if (child.name === 'a') {
        await nodeChangeObj.a(child);
      } else if (child.name === 'link') {
        await nodeChangeObj.link(child);
      } else if (child.name === 'img') {
        await nodeChangeObj.img(child);
      } else if (child.children.length) {
        await visitAll(child, nodeChangeObj);
      }
    } else if ((child as any)?.['children']?.length) {
      await visitAll(child as any, nodeChangeObj);
    }
  }
}
export async function contentFormat(
  content: string,
  baseUrl: string,
  injector: Injector,
  dictName?: string,
  /** 脑图的文件路径,非脑图不用传 */
  filePath?: string,
  mode: 'hover' | 'webview' = 'hover',
) {
  const document = parseDocument(content);
  await visitAll(
    document,
    markdownMode(baseUrl, dictName!, filePath!, injector),
  );
  return render(document);
}
