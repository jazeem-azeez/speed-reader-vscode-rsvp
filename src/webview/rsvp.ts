(function () {
  const vscode = acquireVsCodeApi();
  const wordElement = document.getElementById('word') as HTMLDivElement;
  const progressElement = document.getElementById('progress') as HTMLProgressElement;
  const hudElement = document.getElementById('hud') as HTMLDivElement;
  let helpTimeout: NodeJS.Timeout | undefined;

  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data;
    switch (message.command) {
      case 'displayChunk':
        if (wordElement && progressElement && hudElement) {
          wordElement.innerHTML = message.chunk;
          progressElement.value = message.progress;
          hudElement.innerHTML = `${message.wpm} wpm • ~${message.remaining} min left`;
          hudElement.classList.add('visible');
          if (helpTimeout) {
            clearTimeout(helpTimeout);
          }
          helpTimeout = setTimeout(() => {
            hudElement.classList.remove('visible');
          }, 3000);
        }
        break;
      case 'stop':
        if (wordElement && progressElement) {
          wordElement.innerHTML = '';
          progressElement.value = 0;
        }
        if (hudElement) {
          hudElement.classList.remove('visible');
        }
        break;
      case 'updateWpm':
        // Handled in displayChunk
        break;
      case 'showHelp':
        if (hudElement) {
          hudElement.innerHTML = message.text;
          hudElement.classList.add('visible');
          if (helpTimeout) {
            clearTimeout(helpTimeout);
          }
          helpTimeout = setTimeout(() => {
            hudElement.classList.remove('visible');
          }, 4000);
        }
        break;
    }
  });

  document.addEventListener('keydown', (event: KeyboardEvent) => {
    const key = event.key;
    const shift = event.shiftKey ? 'Shift+' : '';
    const commandMap: Record<string, string> = {
      ' ': 'togglePause',
      'Escape': 'stop',
      'q': 'stop',
      'ArrowUp': 'speedUp',
      'ArrowDown': 'speedDown',
      '+': 'speedUp',
      '=': 'speedUp',
      '-': 'speedDown',
      [`${shift}ArrowUp`]: 'speedUpBig',
      [`${shift}ArrowDown`]: 'speedDownBig',
      '0': 'resetSpeed',
      'r': 'resetSpeed',
      '[': 'rewind',
      ']': 'skip',
      'c': 'cycleChunkSize',
      '?': 'toggleHelp',
      'F1': 'toggleHelp'
    };

    const command = commandMap[key] || commandMap[`${shift}${key}`];
    if (command) {
      vscode.postMessage({ command });
      event.preventDefault();
    }
  });

  // Focus management for accessibility
  if (wordElement) {
    wordElement.setAttribute('tabindex', '0');
    wordElement.focus();
  }
})();

