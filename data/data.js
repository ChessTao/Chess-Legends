const chessLegends = [
  {
    id: "steinitz",
    surname: "Стейниц",
    nameRu: "Вильгельм Стейниц",
    photo: "assets/photos/commons/01-steinitz.jpg",
    biography: { ru: "content/biographies/ru/steinitz.md", en: "content/biographies/en/steinitz.md" },
    credits: { source: "Fritz Schumann; Cleveland Public Library / DPLA", license: "Public domain" }
  },
  {
    id: "lasker",
    surname: "Ласкер",
    nameRu: "Эмануил Ласкер",
    photo: "assets/photos/commons/02-lasker.jpg",
    biography: { ru: "content/biographies/ru/lasker.md", en: "content/biographies/en/lasker.md" },
    credits: { source: "Unknown author; German Federal Archive", license: "CC BY-SA 3.0 DE" }
  },
  {
    id: "capablanca",
    surname: "Капабланка",
    nameRu: "Хосе Рауль Капабланка",
    photo: "assets/photos/commons/03-capablanca.jpg",
    biography: { ru: "content/biographies/ru/capablanca.md", en: "content/biographies/en/capablanca.md" },
    credits: { source: "Anonymous / Keystone-France", license: "Public domain" }
  },
  {
    id: "alekhine",
    surname: "Алехин",
    nameRu: "Александр Алехин",
    photo: "assets/photos/commons/04-alekhine.jpg",
    biography: { ru: "content/biographies/ru/alekhine.md", en: "content/biographies/en/alekhine.md" },
    credits: { source: "George Grantham Bain Collection; derivative work by JesusAngelRey", license: "Public domain" }
  },
  {
    id: "euwe",
    surname: "Эйве",
    nameRu: "Макс Эйве",
    photo: "assets/photos/commons/05-euwe.jpg",
    biography: { ru: "content/biographies/ru/euwe.md", en: "content/biographies/en/euwe.md" },
    credits: { source: "Anefo / R. Mieremet; Dutch National Archives", license: "CC BY-SA 3.0 NL" }
  },
  {
    id: "botvinnik",
    surname: "Ботвинник",
    nameRu: "Михаил Ботвинник",
    photo: "assets/photos/commons/06-botvinnik.jpg",
    biography: { ru: "content/biographies/ru/botvinnik.md", en: "content/biographies/en/botvinnik.md" },
    credits: { source: "Harry Pot / Anefo; Dutch National Archives", license: "CC BY-SA 3.0 NL" }
  },
  {
    id: "smyslov",
    surname: "Смыслов",
    nameRu: "Василий Смыслов",
    photo: "assets/photos/commons/07-smyslov.jpg",
    biography: { ru: "content/biographies/ru/smyslov.md", en: "content/biographies/en/smyslov.md" },
    credits: { source: "Koen Suyk / Anefo", license: "CC0" }
  },
  {
    id: "tal",
    surname: "Таль",
    nameRu: "Михаил Таль",
    photo: "assets/photos/commons/08-tal.jpg",
    biography: { ru: "content/biographies/ru/tal.md", en: "content/biographies/en/tal.md" },
    credits: { source: "Rob C. Croes / Anefo; Dutch National Archives", license: "CC BY-SA 3.0 NL" }
  },
  {
    id: "petrosian",
    surname: "Петросян",
    nameRu: "Тигран Петросян",
    photo: "assets/photos/commons/09-petrosian.jpg",
    biography: { ru: "content/biographies/ru/petrosian.md", en: "content/biographies/en/petrosian.md" },
    credits: { source: "Harry Pot / Anefo; Nationaal Archief", license: "CC0" }
  },
  {
    id: "spassky",
    surname: "Спасский",
    nameRu: "Борис Спасский",
    photo: "assets/photos/commons/10-spassky.jpg",
    biography: { ru: "content/biographies/ru/spassky.md", en: "content/biographies/en/spassky.md" },
    credits: { source: "Rob Bogaerts / Anefo", license: "CC0" }
  },
  {
    id: "fischer",
    surname: "Фишер",
    nameRu: "Бобби Фишер",
    photo: "assets/photos/commons/11-fischer.jpg",
    biography: { ru: "content/biographies/ru/fischer.md", en: "content/biographies/en/fischer.md" },
    credits: { source: "Ulrich Kohls / German Federal Archive; color derivative by Karpouzi", license: "CC BY-SA 3.0" }
  },
  {
    id: "karpov",
    surname: "Карпов",
    nameRu: "Анатолий Карпов",
    photo: "assets/photos/commons/12-karpov.jpg",
    biography: { ru: "content/biographies/ru/karpov.md", en: "content/biographies/en/karpov.md" },
    credits: { source: "Veni Markovski", license: "CC BY-SA 4.0" }
  },
  {
    id: "kasparov",
    surname: "Каспаров",
    nameRu: "Гарри Каспаров",
    photo: "assets/photos/commons/13-kasparov.jpg",
    biography: { ru: "content/biographies/ru/kasparov.md", en: "content/biographies/en/kasparov.md" },
    credits: { source: "Lukasz Kobus / European Union", license: "CC BY 4.0" }
  },
  {
    id: "kramnik",
    surname: "Крамник",
    nameRu: "Владимир Крамник",
    photo: "assets/photos/commons/14-kramnik.jpg",
    biography: { ru: "content/biographies/ru/kramnik.md", en: "content/biographies/en/kramnik.md" },
    credits: { source: "Vladimir Barskij / ruchess.ru", license: "CC BY-SA 3.0" }
  },
  {
    id: "anand",
    surname: "Ананд",
    nameRu: "Вишванатан Ананд",
    photo: "assets/photos/commons/15-anand.jpeg",
    biography: { ru: "content/biographies/ru/anand.md", en: "content/biographies/en/anand.md" },
    credits: { source: "Wolfgang Jekel", license: "CC BY 2.0" }
  },
  {
    id: "carlsen",
    surname: "Карлсен",
    nameRu: "Магнус Карлсен",
    photo: "assets/photos/commons/16-carlsen.jpg",
    biography: { ru: "content/biographies/ru/carlsen.md", en: "content/biographies/en/carlsen.md" },
    credits: { source: "Andreas Kontokanis", license: "CC BY-SA 2.0" }
  },
  {
    id: "ding-liren",
    surname: "Дин Лижэнь",
    nameRu: "Дин Лижэнь",
    photo: "assets/photos/commons/17-ding-liren.jpg",
    biography: { ru: "content/biographies/ru/ding-liren.md", en: "content/biographies/en/ding-liren.md" },
    credits: { source: "Stefan64", license: "CC BY-SA 3.0" }
  },
  {
    id: "gukesh",
    surname: "Гукеш",
    nameRu: "Гукеш Доммараджу",
    photo: "assets/photos/commons/18-gukesh.jpg",
    biography: { ru: "content/biographies/ru/gukesh.md", en: "content/biographies/en/gukesh.md" },
    credits: { source: "Локальный файл из набора Chess Cards", license: "Проверьте лицензию перед публикацией" }
  },
  {
    id: "morphy",
    surname: "Морфи",
    nameRu: "Пол Морфи",
    photo: "assets/photos/commons/18-morphy.jpg",
    biography: { ru: "content/biographies/ru/morphy.md", en: "content/biographies/en/morphy.md" },
    credits: { source: "Wikimedia Commons source", license: "Public domain" }
  },
  {
    id: "anderssen",
    surname: "Андерсен",
    nameRu: "Адольф Андерсен",
    photo: "assets/photos/commons/19-anderssen.jpg",
    biography: { ru: "content/biographies/ru/anderssen.md", en: "content/biographies/en/anderssen.md" },
    credits: { source: "Cleveland Public Library / DPLA", license: "Public domain" }
  },
  {
    id: "rubinstein",
    surname: "Рубинштейн",
    nameRu: "Акиба Рубинштейн",
    photo: "assets/photos/commons/20-rubinstein.png",
    biography: { ru: "content/biographies/ru/rubinstein.md", en: "content/biographies/en/rubinstein.md" },
    credits: { source: "Unknown author; Deutsche Schachzeitung, January 1908", license: "Public domain" }
  },
  {
    id: "bronstein",
    surname: "Бронштейн",
    nameRu: "Давид Бронштейн",
    photo: "assets/photos/commons/21-bronstein.jpg",
    biography: { ru: "content/biographies/ru/bronstein.md", en: "content/biographies/en/bronstein.md" },
    credits: { source: "Joop van Bilsen / Anefo", license: "CC0" }
  },
  {
    id: "keres",
    surname: "Керес",
    nameRu: "Пауль Керес",
    photo: "assets/photos/commons/22-keres.jpg",
    biography: { ru: "content/biographies/ru/keres.md", en: "content/biographies/en/keres.md" },
    credits: { source: "Unknown photographer; scanned from Valter Heuer, \"Meie Keres\"", license: "Public domain" }
  },
  {
    id: "korchnoi",
    surname: "Корчной",
    nameRu: "Виктор Корчной",
    photo: "assets/photos/commons/23-korchnoi.jpg",
    biography: { ru: "content/biographies/ru/korchnoi.md", en: "content/biographies/en/korchnoi.md" },
    credits: { source: "Bert Verhoeff / Anefo", license: "CC0" }
  },
  {
    id: "ivanchuk",
    surname: "Иванчук",
    nameRu: "Василий Иванчук",
    photo: "assets/photos/commons/24-ivanchuk.jpg",
    biography: { ru: "content/biographies/ru/ivanchuk.md", en: "content/biographies/en/ivanchuk.md" },
    credits: { source: "GibChess", license: "CC BY 3.0" }
  },
  {
    id: "topalov",
    surname: "Топалов",
    nameRu: "Веселин Топалов",
    photo: "assets/photos/commons/25-topalov.jpg",
    biography: { ru: "content/biographies/ru/topalov.md", en: "content/biographies/en/topalov.md" },
    credits: { source: "Stefan64", license: "CC BY-SA 3.0" }
  },
  {
    id: "svidler",
    surname: "Свидлер",
    nameRu: "Пётр Свидлер",
    photo: "assets/photos/commons/26-svidler.jpg",
    biography: { ru: "content/biographies/ru/svidler.md", en: "content/biographies/en/svidler.md" },
    credits: { source: "Stefan64", license: "CC BY-SA 4.0" }
  },
  {
    id: "polgar",
    surname: "Полгар",
    nameRu: "Юдит Полгар",
    photo: "assets/photos/commons/27-polgar.jpg",
    biography: { ru: "content/biographies/ru/polgar.md", en: "content/biographies/en/polgar.md" },
    credits: { source: "Przemyslaw Jahr / Wikimedia Commons", license: "CC BY-SA 3.0" }
  },
  {
    id: "aronian",
    surname: "Аронян",
    nameRu: "Левон Аронян",
    photo: "assets/photos/commons/28-aronian.jpg",
    biography: { ru: "content/biographies/ru/aronian.md", en: "content/biographies/en/aronian.md" },
    credits: { source: "Stefan64", license: "CC BY-SA 3.0" }
  },
  {
    id: "nakamura",
    surname: "Накамура",
    nameRu: "Хикару Накамура",
    photo: "assets/photos/commons/30-nakamura.jpg",
    biography: { ru: "content/biographies/ru/nakamura.md", en: "content/biographies/en/nakamura.md" },
    credits: { source: "Andreas Kontokanis; cropped derivative", license: "CC BY-SA 2.0" }
  },
  {
    id: "caruana",
    surname: "Каруана",
    nameRu: "Фабиано Каруана",
    photo: "assets/photos/commons/31-caruana.jpg",
    biography: { ru: "content/biographies/ru/caruana.md", en: "content/biographies/en/caruana.md" },
    credits: { source: "Frans Peeters", license: "CC BY-SA 2.0" }
  },
  {
    id: "nepomniachtchi",
    surname: "Непомнящий",
    nameRu: "Ян Непомнящий",
    photo: "assets/photos/commons/32-nepomniachtchi.jpg",
    biography: { ru: "content/biographies/ru/nepomniachtchi.md", en: "content/biographies/en/nepomniachtchi.md" },
    credits: { source: "Frans Peeters", license: "CC BY-SA 2.0" }
  }
];

window.ChessLegendsData = {
  legends: chessLegends,
  biographies: chessLegends.map((legend) => ({
    id: legend.id,
    nameRu: legend.nameRu,
    surnameRu: legend.surname,
    photo: legend.photo,
    fileRu: legend.biography.ru,
    fileEn: legend.biography.en
  })),
  photoCredits: chessLegends.map((legend) => ({
    id: legend.id,
    name: legend.nameRu,
    photo: legend.photo,
    source: legend.credits.source,
    license: legend.credits.license
  })),
  difficultySettings: {
    "Начинающий": { pairs: 8, columns: 4 },
    "КМС": { pairs: 16, columns: 8 },
    "Мастер": { pairs: 24, columns: 12 },
    "Гроссмейстер": { pairs: 32, columns: 12 }
  }
};
