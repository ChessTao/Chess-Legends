    # Deployment playbook for Codex

Цель: организовать деплой так, чтобы Codex мог вести процесс почти end-to-end, но без доступа к аккаунтам "магическим образом".

## Что нужно от человека один раз

Выбрать мостик доступа:

- авторизованный CLI хостинга на этой машине;
- GitHub-репозиторий с подключенным хостингом;
- токен хостинга в переменной окружения;
- подключенный коннектор/инструмент деплоя.

Без одного из этих мостиков Codex может подготовить проект и инструкции, но не может сам нажимать кнопки в аккаунте хостинга.

## Что Codex должен проверить перед деплоем

Локально:

```bash
npm.cmd run check
npm.cmd run runtime-backup
npm.cmd run runtime-restart-check
```

Если нужно проверить сетевой сценарий локально:

```bash
npm.cmd start
npm.cmd run online-smoke
```

Важно: `online-smoke` требует запущенный сервер на `http://127.0.0.1:4173`, если не задан `TEST_BASE_URL`.

## Production-параметры

Для Node-сервера нужны:

```text
NODE_ENV=production
HOST=0.0.0.0
PORT=<порт платформы>
```

`PORT` обычно задает сама платформа. В коде есть fallback на `4173`, но в production лучше использовать порт хостинга.

При `NODE_ENV=production` cookie сессии получают флаг `Secure`, поэтому боевой адрес должен быть HTTPS.

## Persistent runtime

Проект хранит рабочие данные в `.runtime`:

```text
.runtime/profiles.json
.runtime/sessions.json
.runtime/online-rooms.json
.runtime/server-errors.log
```

На хостинге `.runtime` должен быть на persistent disk/volume. Если `.runtime` лежит на временной файловой системе, после рестарта пропадут профили, сессии и комнаты.

## Проверка после деплоя

1. Открыть:

```text
https://your-domain.example/api/health
```

Ожидаемый ответ:

```json
{"ok":true}
```

2. Прогнать smoke/e2e против опубликованного сайта:

```powershell
$env:TEST_BASE_URL="https://your-domain.example"; npm.cmd run online-smoke
```

3. Проверить, что после рестарта сервера persistent `.runtime` не потерял данные.

4. Перед тем как дать ссылку детям, сделать backup:

```bash
npm.cmd run runtime-backup
```

## Что Codex может делать сам

Если мостик доступа уже есть, Codex может:

- подготовить deployment-конфиги;
- проверить env-переменные;
- запустить CLI-деплой;
- прочитать статус деплоя;
- проверить `/api/health`;
- прогнать `online-smoke` по публичному URL;
- обновить `Last preparations for online.md` по фактическому результату.

## Что Codex не может делать без человека

- Войти в аккаунт хостинга.
- Настроить billing.
- Подтвердить email/2FA.
- Выбрать платный тариф без явного решения человека.
- Гарантировать Safari/iOS без реального устройства.

## Минимальный критерий готовности к закрытому тесту

- сайт открывается по HTTPS;
- `/api/health` отвечает `{"ok":true}`;
- `online-smoke` проходит по публичному URL;
- `.runtime` находится на persistent disk/volume;
- сделан backup `.runtime`;
- есть способ посмотреть `.runtime/server-errors.log`.
