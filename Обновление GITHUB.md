# Обновление GITHUB

Короткий порядок действий, когда локально изменены файлы проекта и нужно отправить изменения на GitHub.

```powershell
git status --short
git add .
git commit -m "Update project"
git push
```

Что делает каждая команда:

- `git status --short` показывает, какие файлы изменены.
- `git add .` готовит все текущие изменения к коммиту.
- `git commit -m "Update project"` сохраняет изменения локально.
- `git push` отправляет коммит на GitHub.

Если нужно отправить не все изменения, вместо `git add .` добавляй конкретные файлы:

```powershell
git add README.md
git add src/script.js
```

Файлы из `.gitignore` на GitHub не отправляются.
