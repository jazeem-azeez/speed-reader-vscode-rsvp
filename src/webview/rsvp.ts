(function () {
  const vscode = acquireVsCodeApi();
  const wordElement = document.getElementById('word') as HTMLDivElement;
  const progressElement = document.getElementById('progress') as HTMLProgressElement;
  const hudElement = document.getElementById('hud') as HTMLDivElement;
  const playButton = document.getElementById('play-button') as HTMLButtonElement;
  const playPauseButton = document.getElementById('play-pause') as HTMLButtonElement;
  const fileList = document.getElementById('file-list') as HTMLDivElement;
  const fileListItems = document.getElementById('file-list-items') as HTMLUListElement;
  const toggleFileListBtn = document.getElementById('toggle-file-list') as HTMLButtonElement;
  const prevFileBtn = document.getElementById('prev-file') as HTMLButtonElement;
  const nextFileBtn = document.getElementById('next-file') as HTMLButtonElement;
  const rewindBtn = document.getElementById('rewind-btn') as HTMLButtonElement;
  const skipBtn = document.getElementById('skip-btn') as HTMLButtonElement;
  const speedUpBtn = document.getElementById('speed-up') as HTMLButtonElement;
  const speedDownBtn = document.getElementById('speed-down') as HTMLButtonElement;
  const speedDisplay = document.getElementById('speed-display') as HTMLSpanElement;
  const autoPlayCheckbox = document.getElementById('auto-play') as HTMLInputElement;
  
  let helpTimeout: NodeJS.Timeout | undefined;
  let currentFileIndex = 0;
  let files: Array<{ uri: string; name: string; progress?: number }> = [];
  let isReading = false;

  // Event listeners for controls
  if (playButton) {
    playButton.addEventListener('click', () => {
      vscode.postMessage({ command: 'play' });
    });
  }

  if (playPauseButton) {
    playPauseButton.addEventListener('click', () => {
      vscode.postMessage({ command: 'togglePause' });
    });
  }

  if (toggleFileListBtn) {
    toggleFileListBtn.addEventListener('click', () => {
      if (fileList) {
        fileList.classList.toggle('collapsed');
        toggleFileListBtn.textContent = fileList.classList.contains('collapsed') ? '+' : '−';
      }
    });
  }

  if (prevFileBtn) {
    prevFileBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'prevFile' });
    });
  }

  if (nextFileBtn) {
    nextFileBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'nextFile' });
    });
  }

  if (rewindBtn) {
    rewindBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'rewind' });
    });
  }

  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'skip' });
    });
  }

  if (speedUpBtn) {
    speedUpBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'speedUp' });
    });
  }

  if (speedDownBtn) {
    speedDownBtn.addEventListener('click', () => {
      vscode.postMessage({ command: 'speedDown' });
    });
  }

  if (autoPlayCheckbox) {
    autoPlayCheckbox.addEventListener('change', () => {
      vscode.postMessage({ command: 'toggleAutoPlay' });
    });
  }

  window.addEventListener('message', (event: MessageEvent) => {
    const message = event.data;
    switch (message.command) {
      case 'displayChunk':
        if (wordElement && progressElement && hudElement) {
          // Apply chunk type styling
          wordElement.className = 'word-area';
          if (message.chunkType === 'title') {
            if (message.chunkLevel === 1) {
              wordElement.classList.add('chunk-title-h1');
            } else if (message.chunkLevel === 2) {
              wordElement.classList.add('chunk-title-h2');
            } else if (message.chunkLevel === 3) {
              wordElement.classList.add('chunk-title-h3');
            } else {
              wordElement.classList.add('chunk-title-h1'); // Default for other levels
            }
          }
          
          wordElement.innerHTML = message.chunk;
          progressElement.value = message.progress;
          hudElement.innerHTML = `${message.wpm} wpm • ~${message.remaining} min left`;
          hudElement.classList.add('visible');
          
          // Hide play button when reading
          if (playButton) {
            playButton.classList.remove('visible');
          }
          if (playPauseButton) {
            playPauseButton.textContent = '⏸';
          }
          isReading = true;
          
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
          wordElement.className = 'word-area';
          progressElement.value = 0;
        }
        if (hudElement) {
          hudElement.classList.remove('visible');
        }
        // Show play button when stopped
        if (playButton) {
          playButton.classList.add('visible');
        }
        if (playPauseButton) {
          playPauseButton.textContent = '▶';
        }
        isReading = false;
        break;
      case 'updateWpm':
        if (speedDisplay) {
          speedDisplay.textContent = `${message.wpm} wpm`;
        }
        // Update play/pause button state
        if (playPauseButton) {
          if (message.isPlaying !== undefined) {
            playPauseButton.textContent = message.isPlaying ? '⏸' : '▶';
            isReading = message.isPlaying;
          }
        }
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
      case 'fileList':
        files = message.files || [];
        currentFileIndex = message.currentIndex || 0;
        renderFileList();
        break;
      case 'updateFileProgress':
        if (files[message.fileIndex] !== undefined) {
          files[message.fileIndex].progress = message.progress;
          renderFileList();
        }
        break;
      case 'selectFile':
        currentFileIndex = message.fileIndex;
        renderFileList();
        break;
    }
  });

  function renderFileList() {
    if (!fileListItems) return;
    
    fileListItems.innerHTML = '';
    
    files.forEach((file, index) => {
      const li = document.createElement('li');
      li.className = index === currentFileIndex ? 'active' : '';
      li.innerHTML = `
        <span class="file-name">${file.name}</span>
        ${file.progress !== undefined ? `<span class="file-progress">${Math.round(file.progress)}%</span>` : ''}
      `;
      li.addEventListener('click', () => {
        vscode.postMessage({ command: 'selectFile', fileIndex: index });
      });
      fileListItems.appendChild(li);
    });
    
    // Always show file list (don't auto-collapse)
    if (fileList && fileList.classList.contains('collapsed') && files.length > 0) {
      // Only keep collapsed if user manually collapsed it
      // File list should be visible by default
    }
  }

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
