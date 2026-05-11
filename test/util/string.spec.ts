import { deepStrictEqual, equal, ok } from 'assert';
import { textDiffEdit } from '../../src/util/string/text-diff-edit';
import MS from 'magic-string';
describe('字符串处理', () => {
  it('diff改编辑-替换', () => {
    let result = textDiffEdit('123', '124');
    equal(result.size, 1);

    deepStrictEqual([...result.entries()][0], [
      2,
      {
        oldValue: '3',
        newValue: '4',
      },
    ]);
  });
  it('diff改编辑-新增', () => {
    let result = textDiffEdit('123', '1234');
    equal(result.size, 1);
    deepStrictEqual([...result.entries()][0], [
      3,
      {
        oldValue: '',
        newValue: '4',
      },
    ]);
  });
  it('diff改编辑-删除', () => {
    let result = textDiffEdit('123', '12');
    equal(result.size, 1);
    deepStrictEqual([...result.entries()][0], [
      2,
      {
        oldValue: '3',
        newValue: '',
      },
    ]);
  });
  it('diff改编辑-删除+新增', () => {
    let result = textDiffEdit('1234', '1345');
    equal(result.size, 2);
    deepStrictEqual(
      [...result.entries()],
      [
        [
          1,
          {
            oldValue: '2',
            newValue: '',
          },
        ],
        [
          4,
          {
            oldValue: '',
            newValue: '5',
          },
        ],
      ],
    );
  });
  it('diff改编辑-编辑+新增', () => {
    let result = textDiffEdit('1234', '14345');
    equal(result.size, 2);
    deepStrictEqual(
      [...result.entries()],
      [
        [
          1,
          {
            oldValue: '2',
            newValue: '4',
          },
        ],
        [
          4,
          {
            oldValue: '',
            newValue: '5',
          },
        ],
      ],
    );
  });
  it('diff改编辑-编辑不等长+新增', () => {
    let result = textDiffEdit('1234', '14444345');
    equal(result.size, 2);
    deepStrictEqual(
      [...result.entries()],
      [
        [
          1,
          {
            oldValue: '2',
            newValue: '4444',
          },
        ],
        [
          4,
          {
            oldValue: '',
            newValue: '5',
          },
        ],
      ],
    );
  });
  it('diff改编辑-还原测试', () => {
    let list = [
      ['123', '124'],
      ['123', '1234'],
      ['123', '12'],
      ['1234', '1345'],
      ['1234', '14345'],
      ['1234', '14444345'],
      ['1234', '1443'],
    ];
    for (const [oldV, newV] of list) {
      let result = textDiffEdit(oldV, newV);
      let instance = new MS(oldV);
      for (const [index, obj] of result.entries()) {
        if (!obj.oldValue.length) {
          instance.appendLeft(index, obj.newValue);
        } else {
          instance.update(index, index + obj.oldValue.length, obj.newValue);
        }
      }
      equal(newV, instance.toString());
    }
  });
  it('diff改编辑-随机还原', () => {
    let list = new Array(100).fill(0).map(() => {
      return [`${Math.random()}`, `${Math.random()}`];
    });
    for (const [oldV, newV] of list) {
      let result = textDiffEdit(oldV, newV);
      let instance = new MS(oldV);
      for (const [index, obj] of result.entries()) {
        if (!obj.oldValue.length) {
          instance.appendLeft(index, obj.newValue);
        } else {
          instance.update(index, index + obj.oldValue.length, obj.newValue);
        }
      }
      equal(newV, instance.toString());
    }
  });
});
