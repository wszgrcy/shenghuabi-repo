import { ScriptFunction } from '@code-recycle/cli';

const fn: ScriptFunction = async (util, rule, host, injector) => {
  let result = await util.changeList([
    {
      path: '**/*.ts',
      glob: true,
      list: [
        // {
        //   query: `ImportDeclaration:has([value=nextPromise],[value=completePromise],[value=stringToFileBuffer],[value=arrayBufferToText])`,
        //   multi: true,
        //   delete: true,
        //   optional: true,
        // },
        // {
        //   query: `CallExpression:has(>[value=nextPromise],>[value=completePromise],>[value=stringToFileBuffer],>[value=arrayBufferToText])`,
        //   multi: true,
        //   optional: true,
        //   children: [{ query: `>SyntaxList::children(0)` }],
        //   replace: (node) => {
        //     return node.children[0].getNodeValue();
        //   },
        // },
        {
          query: `ImportDeclaration:has([value*=@angular-devkit/core])`,
          multi: true,
          delete: true,
          optional: true,
        },
        {
          query: `CallExpression:has(>[value=getSystemPath],>[value=normalize])`,
          multi: true,
          optional: true,
          children: [{ query: `>SyntaxList::children(0)` }],
          replace: (node) => {
            return node.children[0].getNodeValue();
          },
        },
      ],
    },
  ]);
  await util.updateChangeList(result);
};
export default fn;
