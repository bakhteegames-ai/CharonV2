# Рекомендации по дополнению пакета документов

## Что уже есть
- docs pack
- manifest pack
- handoff file
- asset contract
- current state / checklists

## Что ещё стоит добавить в будущем
1. `marketing_requirements.md` с точными размерами под Yandex / Google Play
2. `localization_matrix.md` со списком всех UI строк
3. `qa_matrix.md` с таблицей устройств / браузеров / ориентаций
4. `asset_review_log.md` — короткий журнал, какие реальные models/audio уже проверены и приняты

## Самый понятный формат для любых ИИ
Чтобы любой ИИ быстро ориентировался, держать всегда рядом:
- свежий архив проекта
- актуальный docs pack
- manifest pack
- один короткий handoff prompt:
  - current phase
  - current task
  - what is frozen
  - what changed recently

## Что уже не надо советовать как “будущее”
- не надо писать “создать asset_manifests/ в будущем”, если manifest pack уже существует в Sources
- не надо писать “создать /public в будущем”, если runtime scaffold уже есть в архиве
