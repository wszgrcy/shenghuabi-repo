import { BehaviorSubject } from 'rxjs';

export const CommandListen$ = new BehaviorSubject<
  | {
      command: string;
      arguments: any[];
    }
  | undefined
>(undefined);
