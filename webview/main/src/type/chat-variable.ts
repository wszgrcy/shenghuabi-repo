import {
  SimpleVariableNode,
  SimplifiedState,
} from '@shenghuabi/lexical-textarea';
export type ChatVariable = SimpleVariableNode['item'] & { kind?: 'image' };
