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
      const card = document.createElement("div");
      const image = document.createElement("img");

      card.className = "portrait-card";
      card.style.setProperty("--portrait-delay", `${900 + index * 128}ms`);

      image.className = "portrait";
      image.src = images[index % images.length].photo;
      image.alt = "";

      card.append(image);
      cell.append(card);
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
