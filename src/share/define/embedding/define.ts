import { actions, asVirtualGroup, hideWhen } from '@piying/view-angular-core';
import { asRow, selectOptions } from '@share/valibot';
import { map } from 'rxjs';
import * as v from 'valibot';

const typeOptions = [
  { label: 'openai', value: 'openai' },
  { label: 'transformers', value: 'transformers' },
] as const;
const DeviceOptions = ['cpu', 'dml'] as const;
const DTypeOptions = [
  'fp32',
  'fp16',
  'q8',
  'int8',
  'uint8',
  'q4',
  'bnb4',
  'q4f16',
] as const;

export const EmbeddingTypeSchema = v.pipe(
  v.picklist(typeOptions.map((item) => item.value)),
  selectOptions(typeOptions),
  v.title('类型'),

  actions.class.top('col-span-3'),
);
export const EmbeddingModelSchema = v.pipe(
  v.string(),
  v.trim(),
  v.title('模型名'),
  actions.class.top('col-span-3'),
);
export const EmbeddingSizeSchema = v.pipe(
  v.optional(v.number()),
  v.title('嵌入长度'),
  hideWhen({
    listen: (fn) => {
      return fn({
        list: [['..', 'type']],
      }).pipe(map(({ list }) => list[0] !== 'openai'));
    },
  }),

  actions.class.top('col-span-2'),
);
export const EmbeddingBaseURLSchema = v.pipe(
  v.optional(v.string()),
  v.title('地址'),
  hideWhen({
    listen: (fn) => {
      return fn({
        list: [['..', 'type']],
      }).pipe(map(({ list }) => list[0] === 'transformers'));
    },
  }),

  actions.class.top('col-span-8'),
);
export const EmbeddingDtypeSchema = v.pipe(
  v.optional(v.picklist(DTypeOptions)),
  v.title('量化类型'),
  selectOptions(DTypeOptions.map((item) => ({ label: item, value: item }))),
  actions.class.top('flex-1'),
);

export const EmbeddingDeviceSchema = v.pipe(
  v.optional(v.picklist(DeviceOptions)),
  v.title('设备'),
  selectOptions(DeviceOptions.map((item) => ({ label: item, value: item }))),
  actions.class.top('flex-1'),
);

export const EmbeddingRow1Define = v.pipe(
  v.object({
    type: EmbeddingTypeSchema,
    model: EmbeddingModelSchema,
    size: EmbeddingSizeSchema,
    baseURL: EmbeddingBaseURLSchema,
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid grid-cols-8 gap-2' } },
  ]),
);

export const EmbeddingRow2Define = v.pipe(
  v.object({
    dtype: EmbeddingDtypeSchema,
    device: EmbeddingDeviceSchema,
  }),
  hideWhen({
    listen: (fn) => {
      return fn({
        list: [['..', 'type']],
      }).pipe(map(({ list }) => list[0] !== 'transformers'));
    },
  }),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'flex gap-2 items-center' } },
  ]),

  // layout({ keyPath: ['#'] }),
);
const Row3Define = v.pipe(
  v.object({
    maxBatchSize: v.pipe(
      v.optional(v.number(), 256),
      v.title('每次最大处理数量'),
    ),
    maxAsyncCount: v.pipe(
      v.optional(v.number(), 10),
      v.title('同时最大处理数量'),
    ),
  }),

  asRow(),
);
export const EmbeddingFormDefine = v.pipe(
  v.intersect([EmbeddingRow1Define, EmbeddingRow2Define, Row3Define]),
  asVirtualGroup(),
  actions.wrappers.patch([
    { type: 'div', attributes: { class: 'grid gap-2' } },
  ]),
);
export const EmbeddingDefine = v.object({
  ...EmbeddingRow1Define.entries,
  ...EmbeddingRow2Define.entries,
  ...Row3Define.entries,
});
