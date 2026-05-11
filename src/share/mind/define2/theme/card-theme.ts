type ItemDefine = {
  className: string;
  describe: string;
  hiddenCreate?: boolean;
};
interface StructDefine {
  type: 'object' | 'array';
  value: Record<string, StructDefine | ItemDefine>;
}
export const CardThemeDefine = {
  type: 'object',
  value: {
    hr: { className: 'hr', describe: '分隔符' },
    image: { className: 'image', describe: '图片' },
    link: { className: 'link', describe: '链接' },
    paragraph: { className: 'p', describe: '段落' },
    quote: { className: 'blockquote', describe: '引用' },
    table: { className: 'table', describe: '表格' },
    tableCell: { className: 'tc', describe: '表格单元格' },
    tableCellHeader: {
      className: 'th',
      describe: '表格单元格标题',
    },
    tableRow: {
      className: 'tr',
      describe: '表格行',
    },
    tableAddColumns: { className: 'tableAddColumns', describe: '表格列新增' },
    tableAddRows: { className: 'tableAddRows', describe: '表格行新增' },
    // todo 临时.等添加上
    code: { className: 'code', describe: '代码块', hiddenCreate: true },
    characterLimit: {
      className: 'characterLimit',
      describe: '字符限制',
      hiddenCreate: true,
    },
    ltr: { className: 'ltr', describe: '从左到右' },
    rtl: { className: 'rtl', describe: '从右到左' },

    text: {
      type: 'object',
      value: {
        bold: {
          className: 'text-bold',
          describe: '粗体',
        },
        code: {
          className: 'text-code',
          describe: '行内代码',
        },
        italic: {
          className: 'text-italic',
          describe: '斜体',
        },
        subscript: {
          className: 'text-subscript',
          describe: '下标',
        },
        superscript: {
          className: 'text-superscript',
          describe: '上标',
        },
        underline: {
          className: 'text-underline',
          describe: '下划线',
        },
        strikethrough: {
          className: 'text-strikethrough',
          describe: '中划线',
        },
        underlineStrikethrough: {
          className: 'text-underlineStrikethrough',
          describe: '下中划线',
        },
      },
    },
    heading: {
      type: 'object',
      value: {
        h1: { className: 'h1', describe: '一级标题' },
        h2: { className: 'h2', describe: '二级标题' },
        h3: { className: 'h3', describe: '三级标题' },
        h4: { className: 'h4', describe: '四级标题' },
        h5: { className: 'h5', describe: '五级标题' },
        h6: { className: 'h6', describe: '六级标题' },
      },
    },
    list: {
      type: 'object',
      value: {
        ul: { className: 'ul', describe: '无序列表' },
        ol: { className: 'ol', describe: '有序列表' },
        checklist: { className: 'cl', describe: '清单列表' },
        listitem: { className: 'li', describe: '列表项' },
        listitemChecked: {
          className: 'liChecked',
          describe: '已选中列表项',
        },
        listitemUnchecked: {
          className: 'liUnChecked',
          describe: '未选中列表项',
        },
        nested: {
          type: 'object',
          value: {
            listitem: {
              className: 'nestedLi',
              describe: '列表项',
            },
          },
        },
        olDepth: {
          type: 'array',
          value: {
            ol1: { className: 'ol1', describe: '一级有序列表' },
            ol2: { className: 'ol2', describe: '二级有序列表' },
            ol3: { className: 'ol3', describe: '三级有序列表' },
            ol4: { className: 'ol4', describe: '四级有序列表' },
            ol5: { className: 'ol5', describe: '五级有序列表' },
          },
        },
      },
    },
  },
} as const;
function getKeys<T extends Record<string, any>>(obj: T) {
  return Object.keys(obj) as (keyof T)[];
}
// 没类型,不过也不重要,只要看起来一致就行
export function getCardThemeClassName() {
  return _getCardThemeClassName(CardThemeDefine);
}

function _getCardThemeClassName<T extends StructDefine>(obj: T) {
  const keys = getKeys(obj.value);
  if (obj.type === 'object') {
    const classNameObj = {} as Record<string, any>;
    for (const key of keys) {
      const value = obj.value[key];
      if ('type' in value) {
        classNameObj[key] = _getCardThemeClassName(value);
      } else {
        classNameObj[key] = value.className;
      }
    }
    return classNameObj;
  } else {
    const list = [];
    for (const key of keys) {
      const value = obj.value[key];
      if ('type' in value) {
      } else {
        list.push(value.className);
      }
    }
    return list;
  }
  return;
}
export function getCardThemeDescribe() {
  return Object.values(_getCardThemeDescribe(CardThemeDefine)!).join('\n');
}

function _getCardThemeDescribe<T extends StructDefine>(obj: T) {
  const keys = getKeys(obj.value);
  if (obj.type === 'object') {
    const classNameObj = {} as Record<string, any>;
    for (const key of keys) {
      const value = obj.value[key];
      if ('type' in value) {
        classNameObj[key] = Object.values(_getCardThemeDescribe(value)!).join(
          '\n',
        );
      } else {
        if (value.hiddenCreate) {
          continue;
        }
        classNameObj[key] = `/** ${value.describe} */\n.${value.className}{}`;
      }
    }
    return classNameObj;
  } else {
    const list = [];
    for (const key of keys) {
      const value = obj.value[key];
      if ('type' in value) {
      } else {
        list.push(`/** ${value.describe} */\n.${value.className}{}`);
      }
    }
    return list;
  }
}
