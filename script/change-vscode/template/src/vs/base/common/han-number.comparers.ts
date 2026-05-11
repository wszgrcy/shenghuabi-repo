import { compareFileNamesDefault } from './comparers.js';

const __NUMBER_MAP: Record<string, number> = { "0": 0, "1": 1, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "零": 0, "一": 1, "二": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9, "〇": 0, "壹": 1, "贰": 2, "叁": 3, "肆": 4, "伍": 5, "陆": 6, "柒": 7, "捌": 8, "玖": 9 };
const __UNIT_MAP: Record<string, number> = { "个": 1, "十": 10, "百": 100, "千": 1e3, "万": 1e4, "亿": 1e8, "拾": 10, "佰": 100, "仟": 1e3 };
const __FULL_REGEXP = new RegExp('([0123456789零一二三四五六七八九〇壹贰叁肆伍陆柒捌玖])|([个十百千万亿拾佰仟])|(.)', 'g');

const enum NumberType {
	number = 0,
	unit = 1,
	any = 2,
}
type NumberTokenItem = {
	type: NumberType.number;
	value: number;
	origin: string;
};
type UnitTokenItem = {
	type: NumberType.unit;
	origin: string;
	ratio: number;
};
type anyTokenItem = {
	type: NumberType.any;
	origin: string;
	value: string;
};
type ValueItem = NumberTokenItem | UnitTokenItem | anyTokenItem;
type NumberTuple = [NumberTokenItem, UnitTokenItem];
type ResultItem = NumberTokenItem | anyTokenItem;

function numberUnitCount(list: NumberTuple) {
	return {
		type: NumberType.number,
		value: (list[0].value || 1) * list[1].ratio,
		origin: `${list[0].origin}${list[1].origin}`,
	} as NumberTokenItem;
}
function numberCount(list: NumberTokenItem[], unit: UnitTokenItem) {
	let count = list.reduce(
		(item, curr) => {
			item.value += curr.value;
			item.origin += curr.origin;
			return item;
		},
		{
			value: 0,
			origin: '',
		}
	);

	return {
		type: NumberType.number,
		value: (count.value || 1) * unit.ratio,
		origin: count.origin + unit.origin,
	} as NumberTokenItem;
}
function itemMerge(list: ResultItem[]) {
	let count = 0;
	let lastItem = false;
	let content = '';
	const numberList = [];
	for (let i = 0; i < list.length; i++) {
		const item = list[i];
		if (item.type === NumberType.number) {
			count += item.value;
			lastItem = true;
		} else {
			if (lastItem) {
				content += `${count}`;
				numberList.push(count);
				count = 0;
			}
			content += `${item.value}`;
			lastItem = false;
		}
	}
	if (lastItem) {
		content += `${count}`;
		numberList.push(count);
	}
	return { content, numberList };
}
const BASE = 10000;
function getLevel(value: number): number {
	let level = 0;
	while (value >= BASE) {
		value /= BASE;
		level++;
	}
	return level;
}
// 口语不支持 三万五
function han2number(str: string) {
	let match: RegExpExecArray | null;
	let list: ResultItem[] = [];
	let pendingNumberToken: NumberTokenItem | undefined;
	let step = new Uint8Array(3).fill(0);
	let hasUnit = false;
	while ((match = __FULL_REGEXP.exec(str))) {
		let item: ValueItem;
		if (match[1]) {
			item = { value: __NUMBER_MAP[match[1]], origin: match[1], type: NumberType.number };
		} else if (match[2]) {
			item = { ratio: __UNIT_MAP[match[2]], origin: match[2], type: NumberType.unit };
		} else if (match[3]) {
			item = { value: match[3], origin: match[3], type: NumberType.any };
		} else {
			throw '';
		}
		if (item.type === NumberType.any) {
			if (pendingNumberToken) {
				list.push(pendingNumberToken);
				pendingNumberToken = undefined;
			}
			list.push(item);
			step = step.fill(list.length);
			hasUnit = false;
		} else if (item.type === NumberType.number) {
			if (pendingNumberToken) {
				let index = step[0];
				list.push(pendingNumberToken);
				if (!hasUnit) {
					for (let i = index; i < list.length; i++) {
						(list[i].value as number) *= 10;
					}
				}
			}
			pendingNumberToken = item;
		} else if (item.type === NumberType.unit) {
			hasUnit = true;
			let level = getLevel(item.ratio);
			let index = step.at(level)!;
			if (!pendingNumberToken) {
				let data = list.slice(index) as NumberTokenItem[];
				list = list.slice(0, index);
				list.push(numberCount(data, item));
				for (let i = 0; i < level; i++) {
					step[i] = list.length;
				}
				continue;
			}

			if (item.ratio > 1000) {
				let data = list.slice(index) as NumberTokenItem[];
				list = list.slice(0, index);
				list.push(numberCount([...data, pendingNumberToken], item));
				pendingNumberToken = undefined;
				for (let i = 0; i < level; i++) {
					step[i] = list.length;
				}
			} else {
				list.push(numberUnitCount([pendingNumberToken, item]));
				pendingNumberToken = undefined;
			}
		}
	}
	if (pendingNumberToken) {
		list.push(pendingNumberToken);
	}
	return list;
}

function han2numberParse(str: string) {
	return itemMerge(han2number(str));
}
export function compareFileNamesNumber(one: string | null, other: string | null) {
	one = one || '';
	other = other || '';

	if (one === other) {
		return 0;
	}
	return compareFileNamesDefault(han2numberParse(one).content, han2numberParse(other).content)

}
