# Рекомендации по дополнению пакета документов

## Что ещё стоит добавить в будущем
1. `asset_manifests/` как отдельную папку с yaml-файлами под каждый реальный ассет
2. `marketing_requirements.md` с точными размерами под Yandex / Google Play
3. `localization_matrix.md` со списком всех UI строк
4. `qa_matrix.md` с таблицей устройств / браузеров / ориентаций

## Самый понятный формат для любых ИИ
Чтобы любой ИИ быстро ориентировался, держать всегда рядом:
- свежий архив проекта
- актуальный docs pack
- manifests
- один короткий handoff prompt:
  - current phase
  - current task
  - what is frozen
  - what changed recently
