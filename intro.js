(() => {
  function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  function buildBoard(board, lightCells) {
    for (let row = 0; row < 8; row += 1) {
      for (let col = 0; col < 8; col += 1) {
        const cell = document.createElement("div");
        const isLight = (row + col) % 2 === 0;

        cell.className = `cell ${isLight ? "light" : "dark"}`;
        board.append(cell);

        if (isLight) {
          lightCells.push(cell);
        }
      }
    }
  }

  function revealPortraits(lightCells, legends) {
    const cells = shuffle(lightCells);
    const images = shuffle(legends);

    cells.forEach((cell, index) => {
      const image = document.createElement("img");

      image.className = "portrait";
      image.src = images[index % images.length].photo;
      image.alt = "";
      image.style.setProperty("--portrait-delay", `${900 + index * 128}ms`);
      cell.append(image);
    });
  }

  function initIntro(legends) {
    const board = document.querySelector("#board");
    const lightCells = [];

    if (!board || !legends?.length) {
      return;
    }

    board.innerHTML = "";
    buildBoard(board, lightCells);
    revealPortraits(lightCells, legends);
  }

  window.ChessLegendsIntro = {
    initIntro
  };
})();
