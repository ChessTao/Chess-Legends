# Инструкция по загрузке проекта на GitHub

Эта инструкция написана для текущего проекта `Шахматные легенды`.

## Что уже подготовлено

- Большая папка `Тексты/` исключена из git и добавлена в `.gitignore`.
- Логи `server.log` и `server.error.log` игнорируются.
- Проверка проекта проходит командой:

```powershell
npm.cmd run check
```

Перед загрузкой на GitHub нужно сделать коммит текущего состояния, создать репозиторий на GitHub и отправить туда код.

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

Если есть ошибка, сначала ее нужно исправить, а потом снова запустить проверку.

## 3. Посмотри, какие файлы попадут в коммит

Запусти:

```powershell
git status --short
```

Ты увидишь список измененных и новых файлов. Это нормально.

Важно: в списке не должно быть `server.log`, `server.error.log` и файлов из папки `Тексты/`.

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

Запусти:

```powershell
git commit -m "Prepare project for GitHub upload"
```

Если git попросит указать имя и email, выполни команды ниже, подставив свои данные:

```powershell
git config --global user.name "Ваше имя"
git config --global user.email "ваш-email@example.com"
```

После этого снова запусти:

```powershell
git commit -m "Prepare project for GitHub upload"
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

Если ты не настраивала SSH, проще использовать `https://...`.

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

- `index.html`
- `src/`
- `data/`
- `styles/`
- `assets/`
- `package.json`
- `ARCHITECTURE_REVIEW.md`

И что там нет:

- `server.log`
- `server.error.log`
- `Тексты/`

## 11. Если push не проходит из-за большого файла

Сейчас история проекта уже очищена от большого PDF. Но если GitHub все равно жалуется на файл больше 100 MB, проверь:

```powershell
git log --all -- "Тексты/Brochure_final (cut) in curves.pdf"
```

Если команда ничего не выводит, значит этот файл уже не в истории.

Если GitHub продолжает ругаться, пришли текст ошибки.

## 12. Команды коротким списком

Если все понятно и нужно просто выполнить команды:

```powershell
cd "d:\ИИ-проекты\Шахматные легенды"
npm.cmd run check
git status --short
git add .
git commit -m "Prepare project for GitHub upload"
git remote add origin https://github.com/USERNAME/chess-legends.git
git push -u origin main
```

В последней части обязательно замени `USERNAME` на свой логин GitHub.
