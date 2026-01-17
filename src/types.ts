export type FileFormat = 'markdown' | 'text' | 'pdf' | 'epub';

export type ChunkType = 'title' | 'body' | 'pause';

export interface StructuredChunk {
  type: ChunkType;
  level?: number; // 1-6 for headers
  text: string;
  pauseAfter?: boolean; // true for titles
  duration?: number; // for pause chunks
}

export interface WebviewMessage {
  command: string;
  [key: string]: unknown;
}

export interface DisplayChunkMessage extends WebviewMessage {
  command: 'displayChunk';
  chunk: string;
  chunkType?: ChunkType;
  chunkLevel?: number;
  progress: number;
  wpm: number;
  remaining: number;
}

export interface UpdateWpmMessage extends WebviewMessage {
  command: 'updateWpm';
  wpm: number;
  isPlaying?: boolean; // Optional flag to indicate playing state
}

export interface StopMessage extends WebviewMessage {
  command: 'stop';
}

export interface ShowHelpMessage extends WebviewMessage {
  command: 'showHelp';
  text: string;
}

export interface FileListMessage extends WebviewMessage {
  command: 'fileList';
  files: Array<{ uri: string; name: string; progress?: number }>;
  currentIndex: number;
}

export interface SelectFileMessage extends WebviewMessage {
  command: 'selectFile';
  fileIndex: number;
}

export interface UpdateFileProgressMessage extends WebviewMessage {
  command: 'updateFileProgress';
  fileIndex: number;
  progress: number;
}

export type ExtensionToWebviewMessage = 
  | DisplayChunkMessage 
  | UpdateWpmMessage 
  | StopMessage 
  | ShowHelpMessage
  | FileListMessage
  | SelectFileMessage
  | UpdateFileProgressMessage;

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
  | { command: 'toggleHelp' }
  | { command: 'selectFile'; fileIndex: number }
  | { command: 'nextFile' }
  | { command: 'prevFile' }
  | { command: 'toggleFileList' }
  | { command: 'toggleAutoPlay' }
  | { command: 'play' };

