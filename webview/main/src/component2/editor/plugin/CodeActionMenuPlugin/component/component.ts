import { Component, inject, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CardEditorService } from '../../../card-editor.service';
import { $getNearestNodeFromDOMNode, LexicalEditor } from 'lexical';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import {
  $isCodeNode,
  CODE_LANGUAGE_FRIENDLY_NAME_MAP,
  normalizeCodeLang,
} from '@lexical/code';
import { KeyValuePipe, NgStyle } from '@angular/common';
import { Clipboard } from '@angular/cdk/clipboard';
import type { Options } from 'prettier';

interface ToolbarOptions {
  editor: LexicalEditor;
  position: Record<string, any>;
  getCodeDOMNode: () => HTMLElement;
  nLang: string;
}
const PRETTIER_OPTIONS_BY_LANG: Record<string, Options> = {
  css: {
    parser: 'css',
  },
  html: {
    parser: 'html',
  },
  js: {
    parser: 'babel',
  },
  typescript: {
    parser: 'babel-ts',
  },
  markdown: {
    parser: 'markdown',
  },
};
async function loadPrettierFormat() {
  const { format } = await import('prettier/standalone');
  return format;
}

const PRETTIER_PARSER_MODULES = {
  css: () => import('prettier/parser-postcss').then((a) => a.default),
  html: () => import('prettier/parser-html').then((a) => a.default),
  typescript: () =>
    Promise.all([
      import('prettier/parser-babel'),
      import('prettier/plugins/estree'),
    ]).then(([babel, estree]) => {
      return {
        parsers: babel.default.parsers,
        printers: (estree.default as any).printers,
      };
    }),
  js: () =>
    Promise.all([
      import('prettier/parser-babel'),
      import('prettier/plugins/estree'),
    ]).then(([babel, estree]) => {
      return {
        parsers: babel.default.parsers,
        printers: (estree.default as any).printers,
      };
    }),
  markdown: () => import('prettier/parser-markdown').then((a) => a.default),
} as const;
type LanguagesType = keyof typeof PRETTIER_PARSER_MODULES;

async function loadPrettierParserByLang(lang: string) {
  const dynamicImport = PRETTIER_PARSER_MODULES[lang as LanguagesType];
  return await dynamicImport();
}

@Component({
  templateUrl: './component.html',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    KeyValuePipe,
    NgStyle,
  ],
  host: {
    class: 'code-toolkit',
  },
  styleUrl: './component.scss',
})
export class CodeToolkitComponent {
  props = input.required<ToolbarOptions>();
  CODE_LANGUAGE_FRIENDLY_NAME_MAP = CODE_LANGUAGE_FRIENDLY_NAME_MAP;
  PRETTIER_OPTIONS_BY_LANG = PRETTIER_OPTIONS_BY_LANG;
  clip = inject(Clipboard);
  lang = '';
  service = inject(CardEditorService);
  selectedData = (type: string) => {
    return this.service.convertList$().find((item) => item.type === type);
  };
  ngOnInit(): void {
    this.lang = this.#getLanguage();
  }
  async changeLanguage(value: string) {
    const { getCodeDOMNode, editor } = this.props();
    this.lang = value;
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }
    this.props().editor.update(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);
      if ($isCodeNode(codeNode)) {
        codeNode.setLanguage(value);
      }
    });
  }
  async copyData() {
    const { getCodeDOMNode, editor } = this.props();
    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }
    editor.read(() => {
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);
      if ($isCodeNode(codeNode)) {
        this.clip.copy(codeNode.getTextContent());
      }
    });
  }
  #getLanguage() {
    const { getCodeDOMNode, editor } = this.props();

    return editor.read(() => {
      const codeDOMNode = getCodeDOMNode();
      if (!codeDOMNode) {
        return '';
      }
      const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);
      return $isCodeNode(codeNode)
        ? normalizeCodeLang(codeNode.getLanguage() || '')
        : '';
    });
  }
  async formatCode() {
    const { getCodeDOMNode, editor } = this.props();
    const lang = this.#getLanguage();

    const codeDOMNode = getCodeDOMNode();
    if (!codeDOMNode) {
      return;
    }
    try {
      const format = await loadPrettierFormat();
      const options = PRETTIER_OPTIONS_BY_LANG[lang];
      options.plugins = [await loadPrettierParserByLang(lang)];

      const content = editor.read(() => {
        const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);
        return $isCodeNode(codeNode) ? codeNode.getTextContent() : '';
      });
      const parsed = content ? await format(content, options) : '';
      editor.update(() => {
        const codeNode = $getNearestNodeFromDOMNode(codeDOMNode);
        if ($isCodeNode(codeNode)) {
          if (parsed !== '') {
            const selection = codeNode.select(0);
            selection.insertText(parsed);
          }
        }
      });
    } catch (error: unknown) {
      console.log(error);
    }
  }
}
