# Инструкция по загрузке проекта на GitHub

Эта инструкция написана для текущего проекта `Шахматные легенды`.

## Что уже подготовлено

- Большая папка `Тексты/` исключена из git и добавлена в `.gitignore`.
- `.runtime/` исключена из git: там локальные профили, сессии, комнаты, логи и backup.
- Логи `server.log`, `server.error.log` и `*.log` игнорируются.
- Есть Node-сервер `server.js` для профилей, паролей и сетевой игры.
- Есть локальные проверки:

```powershell
npm.cmd run check
npm.cmd run runtime-backup
npm.cmd run runtime-restart-check
```

- Есть сетевой smoke/e2e:

```powershell
npm.cmd run online-smoke
```

- Есть оперативный чеклист перед закрытым онлайн-тестом: `Last preparations for online.md`.
- Есть playbook деплоя через Codex: `DEPLOYMENT_PLAYBOOK.md`.

Перед загрузкой на GitHub нужно проверить проект, сделать коммит текущего состояния, создать репозиторий на GitHub и отправить туда код.

## 1. Открой терминал в папке проекта

Папка проекта:

```powershell
d:\ИИ-проекты\Шахматные легенды
```

В VS Code можно открыть терминал так:

```text
Terminal -> New Terminal
```

Проверь, что терминал находится в нужной папке:

```powershell
pwd
```

Если нет, перейди в папку проекта:

```powershell
cd "d:\ИИ-проекты\Шахматные легенды"
```

## 2. Проверь проект перед загрузкой

Запусти:

```powershell
npm.cmd run check
```

Хороший результат выглядит так:

```text
Smoke checks passed.
```

Перед онлайн-деплоем также полезно запустить:

```powershell
npm.cmd run runtime-backup
npm.cmd run runtime-restart-check
```

Если есть ошибка, сначала ее нужно исправить, а потом снова запустить проверку.

## 3. Посмотри, какие файлы попадут в коммит

Запусти:

```powershell
git status --short
```

Это нормально, если в списке есть новые/измененные проектные файлы, например:

- `DEPLOYMENT_PLAYBOOK.md`;
- `Last preparations for online.md`;
- `ONLINE_RELEASE_ROADMAP.md`;
- `Open game link.md`;
- `scripts/runtime-backup.js`;
- `scripts/runtime-restart-check.js`;
- `server.js`;
- `src/`;
- `styles/`;
- `package.json`.

Важно: в списке не должно быть:

- `.runtime/`;
- `server.log`;
- `server.error.log`;
- файлов из папки `Тексты/`;
- личных `.env` файлов.

## 4. Добавь файлы в git

Запусти:

```powershell
git add .
```

Потом проверь:

```powershell
git status --short
```

Теперь файлы должны быть отмечены как подготовленные к коммиту.

## 5. Сделай коммит

Лучше делать commit сразу с сообщением, чтобы git не открывал редактор `.git/COMMIT_EDITMSG`:

```powershell
git commit -m "Prepare online test release"
```

Если git уже открыл `.git/COMMIT_EDITMSG`, впиши сообщение в первую строку, сохрани файл и закрой редактор. Пустое сообщение отменяет commit.

Если git попросит указать имя и email, выполни команды ниже, подставив свои данные:

```powershell
git config --global user.name "Ваше имя"
git config --global user.email "ваш-email@example.com"
```

После этого снова запусти:

```powershell
git commit -m "Prepare online test release"
```

## 6. Создай пустой репозиторий на GitHub

1. Открой сайт:

```text
https://github.com
```

2. Войди в аккаунт.
3. Нажми `+` в правом верхнем углу.
4. Выбери `New repository`.
5. В поле `Repository name` напиши, например:

```text
chess-legends
```

6. Выбери `Public` или `Private`.
7. Не ставь галочки:

```text
Add a README file
Add .gitignore
Choose a license
```

Репозиторий должен быть пустым, потому что проект уже существует на компьютере.

8. Нажми `Create repository`.

После создания GitHub покажет адрес репозитория. Он будет похож на один из этих:

```text
https://github.com/USERNAME/chess-legends.git
```

или:

```text
git@github.com:USERNAME/chess-legends.git
```

Если SSH не настроен, проще использовать `https://...`.

## 7. Подключи GitHub-репозиторий к проекту

В команде ниже замени `USERNAME` на свой логин GitHub:

```powershell
git remote add origin https://github.com/USERNAME/chess-legends.git
```

Проверь:

```powershell
git remote -v
```

Должно появиться примерно так:

```text
origin  https://github.com/USERNAME/chess-legends.git (fetch)
origin  https://github.com/USERNAME/chess-legends.git (push)
```

Если ошиблась в адресе, можно заменить его:

```powershell
git remote set-url origin https://github.com/USERNAME/chess-legends.git
```

## 8. Отправь проект на GitHub

Запусти:

```powershell
git push -u origin main
```

Если GitHub попросит логин и пароль, обычный пароль от GitHub может не подойти. GitHub часто требует token.

## 9. Если GitHub просит token

Создай token на GitHub:

1. Открой:

```text
https://github.com/settings/tokens
```

2. Нажми `Generate new token`.
3. Лучше выбрать `Fine-grained token`.
4. Выбери свой репозиторий `chess-legends`.
5. В разрешениях дай доступ:

```text
Contents: Read and write
```

6. Создай token.
7. Скопируй token сразу, потом GitHub больше его не покажет.

Когда `git push` попросит пароль, вставь token вместо пароля.

## 10. Проверь результат

Открой страницу репозитория:

```text
https://github.com/USERNAME/chess-legends
```

Проверь, что там есть:

- `index.html`;
- `server.js`;
- `src/`;
- `data/`;
- `styles/`;
- `assets/`;
- `content/`;
- `scripts/`;
- `package.json`;
- `README.md`;
- `ARCHITECTURE.md`;
- `MEMORY_RULES.md`;
- `PHOTO_CREDITS.md`;
- `ONLINE_RELEASE_ROADMAP.md`;
- `Last preparations for online.md`;
- `DEPLOYMENT_PLAYBOOK.md`.

И что там нет:

- `.runtime/`;
- `server.log`;
- `server.error.log`;
- `.runtime/server-errors.log`;
- `.runtime/backups/`;
- `Тексты/`;
- `.env`;
- `.env.*`.

## 11. Важно про вход с паролем

В проекте есть вход и регистрация игроков с паролем.

Пароль работает через серверный файл:

```text
server.js
```

Поэтому для версии с паролем и сетевой игрой проект нельзя размещать только как статический сайт.

Не подойдет:

```text
GitHub Pages
обычный статический хостинг
Live Server 127.0.0.1:5500
```

Эти варианты умеют показывать `index.html`, но не запускают серверные адреса:

```text
/api/register
/api/login
/api/profiles
/api/online/rooms
/api/online/active
```

Подойдет хостинг, который умеет запускать Node.js:

```text
Render
Railway
Fly.io
VPS
любой сервер с Node.js
```

Локально версия с паролем запускается так:

```powershell
npm.cmd start
```

После запуска открывай:

```text
http://127.0.0.1:4173/
```

Ссылка для открытия именно с заставки:

```text
http://127.0.0.1:4173/?openScreen=intro
```

Не используй для версии с паролем:

```text
http://127.0.0.1:5500/
```

Это Live Server, там пароль и сетевые API работать не будут.

## 12. Как разместить версию с паролем и онлайном в сети

После загрузки проекта на GitHub нужно выбрать Node.js-хостинг.

Общий порядок такой:

1. Зарегистрируйся на хостинге, например Render/Railway/Fly.io.
2. Создай новый Web Service.
3. Подключи GitHub-репозиторий проекта.
4. Укажи команду запуска:

```bash
npm start
```

5. Проверь production-переменные:

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=<порт платформы>
```

Многие хостинги сами задают `PORT`. Проект уже умеет его читать:

```js
const port = Number(process.env.PORT) || 4173;
```

6. Сайт должен открываться по HTTPS. При `NODE_ENV=production` cookie сессии получают флаг `Secure`, поэтому HTTP не подойдет для боевой авторизации.

После публикации открывай адрес, который даст хостинг, например:

```text
https://chess-legends.onrender.com/
```

Тогда сайт и серверные API будут работать на одном домене.

Подробный протокол деплоя через Codex лежит в:

```text
DEPLOYMENT_PLAYBOOK.md
```

## 13. Важно про runtime-данные

Сейчас сервер хранит runtime-данные в папке:

```text
.runtime/
```

Там находятся:

```text
.runtime/profiles.json
.runtime/sessions.json
.runtime/online-rooms.json
.runtime/server-errors.log
.runtime/backups/
```

Эта папка не попадает в GitHub, потому что она добавлена в `.gitignore`.

Для локального запуска этого достаточно.

Для настоящей сетевой версии `.runtime` должен лежать на persistent disk/volume. На некоторых бесплатных хостингах обычные файлы исчезают после перезапуска сервера. Если `.runtime` временный, пропадут профили, сессии, комнаты и логи.

Перед закрытым тестом сделай backup:

```powershell
npm.cmd run runtime-backup
```

Для более надежной публичной версии позже лучше перейти на базу данных:

```text
PostgreSQL
SQLite с persistent disk
Supabase
Neon
```

## 14. Проверка после публикации

Проверь health endpoint:

```text
https://your-domain.example/api/health
```

Ожидаемый ответ:

```json
{"ok":true}
```

Потом запусти smoke/e2e против опубликованного сайта:

```powershell
$env:TEST_BASE_URL="https://your-domain.example"; npm.cmd run online-smoke
```

После smoke-теста в production могут появиться профили `Smoke A ...` и `Smoke B ...`. Для закрытого теста это терпимо, но перед публичным запуском их лучше удалить или использовать отдельное тестовое окружение.

## 15. Если push не проходит из-за большого файла

Сейчас история проекта уже очищена от большого PDF. Но если GitHub все равно жалуется на файл больше 100 MB, проверь:

```powershell
git log --all -- "Тексты/Brochure_final (cut) in curves.pdf"
```

Если команда ничего не выводит, значит этот файл уже не в истории.

Если GitHub продолжает ругаться, пришли текст ошибки.

## 16. Команды коротким списком

Если все понятно и нужно просто выполнить команды:

```powershell
cd "d:\ИИ-проекты\Шахматные легенды"
npm.cmd run check
git status --short
git add .
git commit -m "Prepare online test release"
git remote add origin https://github.com/USERNAME/chess-legends.git
git push -u origin main
```

В последней части обязательно замени `USERNAME` на свой логин GitHub.

Если remote `origin` уже существует, вместо `git remote add origin ...` используй:

```powershell
git remote set-url origin https://github.com/USERNAME/chess-legends.git
```
