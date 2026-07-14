# 14 июля - пауза на persistent disk

Мы дошли до настройки первого онлайн-деплоя игры на Render.

Текущее место:

- GitHub-репозиторий уже создан и подключен к Render:
  - `ChessTao/Chess-Legends`
- В Render выбран тип сервиса:
  - `Web Service`
- Render распознал проект как Node.js-приложение.
- Основные настройки для сервиса:
  - `Language`: `Node`
  - `Branch`: `main`
  - `Root Directory`: пусто
  - `Build Command`: `npm install`
  - `Start Command`: `npm start`
  - `Health Check Path`: `/api/health`
  - `Auto-Deploy`: `On Commit`
  - `NODE_ENV`: `production`

Для сохранения данных игры нужен persistent disk.

Нужные настройки диска:

```text
Name: runtime
Mount Path: /opt/render/project/src/.runtime
Size: 1 GB
```

Почему это важно:

- сервер игры хранит runtime-данные в `.runtime`;
- туда попадают профили, сессии, онлайн-комнаты и лог ошибок;
- без persistent disk эти данные могут потеряться после restart/redeploy;
- GitHub эти данные хранить не должен.

Причина остановки:

Render позволяет запустить Web Service бесплатно, но persistent disk доступен только для платного сервиса. Для нашего варианта нужен как минимум:

```text
Starter: $7/month
Persistent disk 1 GB: about $0.25/month
```

Итого ориентировочно:

```text
$7.25/month
```

На этом месте мы решили поставить паузу и не нажимать `Deploy Web Service`, чтобы отдельно обдумать платный persistent disk.

Когда продолжим:

1. Вернуться на страницу создания Web Service в Render.
2. Проверить настройки выше.
3. Убедиться, что disk mount path именно:

   ```text
   /opt/render/project/src/.runtime
   ```

4. Нажать `Deploy Web Service`.
5. Дождаться логов сборки и первой публичной ссылки Render.
