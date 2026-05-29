(() => {
  function readNumber(value, fallback = 0) {
    const number = Number.parseFloat(value);

    return Number.isFinite(number) ? number : fallback;
  }

  function getGridCount(board, propertyName, dataName) {
    const dataValue = Number(board.dataset[dataName]);

    if (Number.isFinite(dataValue) && dataValue > 0) {
      return dataValue;
    }

    return readNumber(getComputedStyle(board).getPropertyValue(propertyName), 1);
  }

  function fitMemoryBoard(board) {
    if (!board?.isConnected) {
      return;
    }

    const shell = board.closest(".game-shell");

    if (!shell) {
      return;
    }

    const columns = getGridCount(board, "--columns", "columns");
    const rows = getGridCount(board, "--rows", "rows");

    if (!columns || !rows) {
      return;
    }

    const shellStyles = getComputedStyle(shell);
    const boardStyles = getComputedStyle(board);
    const horizontalPadding = readNumber(shellStyles.paddingLeft) + readNumber(shellStyles.paddingRight);
    const verticalPadding = readNumber(shellStyles.paddingTop) + readNumber(shellStyles.paddingBottom);
    const rowGap = readNumber(shellStyles.rowGap);
    const boardGap = readNumber(boardStyles.columnGap);
    const headerHeight = shell.querySelector(".game-header")?.offsetHeight || 0;
    const scoreHeight = shell.querySelector(".score-panel")?.offsetHeight || 0;
    const availableWidth = Math.max(0, shell.clientWidth - horizontalPadding);
    const availableHeight = Math.max(0, shell.clientHeight - verticalPadding - headerHeight - scoreHeight - rowGap * 2);
    const widthCell = (availableWidth - boardGap * (columns - 1)) / columns;
    const heightCell = (availableHeight - boardGap * (rows - 1)) / rows;
    const cellSize = Math.max(48, Math.floor(Math.min(widthCell, heightCell)));
    const boardWidth = Math.floor(cellSize * columns + boardGap * (columns - 1));

    board.style.width = `${boardWidth}px`;
  }

  function scheduleMemoryBoardFit(board) {
    window.requestAnimationFrame(() => fitMemoryBoard(board));
  }

  window.addEventListener("resize", () => {
    document.querySelectorAll(".memory-board[data-columns][data-rows]").forEach(scheduleMemoryBoardFit);
  });

  window.ChessLegendsBoardFit = {
    fitMemoryBoard,
    scheduleMemoryBoardFit
  };
})();
