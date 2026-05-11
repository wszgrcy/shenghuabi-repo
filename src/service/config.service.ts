import * as vscode from 'vscode';
import { CONFIG, CommandPrefix } from '@global';
import * as v from 'valibot';
import { WritableSignal } from 'static-injector';
import { createConfig } from './create-config';
export type ExtensionConfigType = v.InferOutput<typeof CONFIG>;
type ConfigSignal<T> = WritableSignal<NonNullable<T>>;

export const GlobalAllConfig = vscode.workspace.getConfiguration(CommandPrefix);

export const ExtensionConfig = createConfig(CONFIG, 'shenghuabi');
