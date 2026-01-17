export type FileFormat = 'markdown' | 'text' | 'pdf' | 'epub';

export interface WebviewMessage {
  command: string;
  [key: string]: unknown;
}

export interface DisplayChunkMessage extends WebviewMessage {
  command: 'displayChunk';
  chunk: string;
  progress: number;
  wpm: number;
  remaining: number;
}

export interface UpdateWpmMessage extends WebviewMessage {
  command: 'updateWpm';
  wpm: number;
}

export interface StopMessage extends WebviewMessage {
  command: 'stop';
}

export interface ShowHelpMessage extends WebviewMessage {
  command: 'showHelp';
  text: string;
}

export type ExtensionToWebviewMessage = 
  | DisplayChunkMessage 
  | UpdateWpmMessage 
  | StopMessage 
  | ShowHelpMessage;

export type WebviewToExtensionMessage = 
  | { command: 'togglePause' }
  | { command: 'stop' }
  | { command: 'speedUp' }
  | { command: 'speedDown' }
  | { command: 'speedUpBig' }
  | { command: 'speedDownBig' }
  | { command: 'resetSpeed' }
  | { command: 'rewind' }
  | { command: 'skip' }
  | { command: 'cycleChunkSize' }
  | { command: 'toggleHelp' };

