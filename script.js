const portraits = [
  "Фотографии/1.Стейниц.png",
  "Фотографии/2.Ласкер.png",
  "Фотографии/3.Капабланка.png",
  "Фотографии/4.Алехин.jpg",
  "Фотографии/5.Эйве.png",
  "Фотографии/6.Ботвинник.png",
  "Фотографии/7.Смыслов.png",
  "Фотографии/8.Таль.png",
  "Фотографии/9.Петросян.png",
  "Фотографии/10.Спасский.jpg",
  "Фотографии/11.Фишер.jpg",
  "Фотографии/12.Карпов.png",
  "Фотографии/13.Каспаров.jpg",
  "Фотографии/14.Крамник.jpg",
  "Фотографии/15.Ананд.jpeg",
  "Фотографии/16.Карлсен.jpg",
  "Фотографии/17.Дин Лижень.jpg",
  "Фотографии/18.Морфи.jpg",
  "Фотографии/19.Андерсен.png",
  "Фотографии/20.Рубинштейн.jpg",
  "Фотографии/21.Бронштейн.jpg",
  "Фотографии/22.Керес.png",
  "Фотографии/23.Корчной.png",
  "Фотографии/24.Иванчук.jpg",
  "Фотографии/25.Топалов.jpg",
  "Фотографии/26.Свидлер.jpg",
  "Фотографии/27.Полгар.jpg",
  "Фотографии/28.Аронян.jpg",
  "Фотографии/29.Мамедьяров.jpg",
  "Фотографии/30.Накамура.jpg",
  "Фотографии/31.Каруана.jpg",
  "Фотографии/32.Непомнящий.jpg"
];

const board = document.querySelector("#board");
const lightCells = [];

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function buildBoard() {
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

function revealPortraits() {
  const cells = shuffle(lightCells);
  const images = shuffle(portraits);

  cells.forEach((cell, index) => {
    const image = document.createElement("img");
    image.className = "portrait";
    image.src = images[index % images.length];
    image.alt = "";
    image.style.animationDelay = `${900 + index * 128}ms`;
    cell.append(image);
  });
}

buildBoard();
revealPortraits();
