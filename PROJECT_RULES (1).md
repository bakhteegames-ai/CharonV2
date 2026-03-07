# PROJECT_RULES.md

Project: CharonV2 / BTG Runner Engine  
Workflow: project archive + docs pack in Sources → ChatGPT planning/review → coding agent applies patch → unified diff back

---

## 0. Source of Truth

Priority order is strict:

1. **Latest uploaded project archive in Sources**
2. **Latest docs pack in Sources**
3. Current chat
4. Older chats

Chat alone is never enough when code state matters.

---

## 1. One Chat = One Task

- Один чат = одна текущая задача / подфаза.
- Если начинается другая задача, другой архив или другой проект — новый чат.
- Этот чат допустимо продолжать, пока решается один непрерывный сабэтап.

---

## 2. Code / Docs Boundary

**Coding agents / AI Studio / Codex / Antigravity**
- меняют только код проекта
- не редактируют markdown-документацию, если это явно не отдельная задача

**ChatGPT**
- ведёт документацию
- держит roadmap / state / checklists
- проектирует патчи
- делает diff-review
- следит за workflow и resync

---

## 3. Diff-Based Loop (Mandatory)

Любая рабочая итерация:

1. ChatGPT выдаёт patch / prompt
2. coding agent применяет его
3. пользователь возвращает **полный unified diff**
4. ChatGPT делает review
5. только после review разрешён следующий патч

Если diff не вернулся — итерация не считается завершённой.

---

## 4. Mandatory Resync

После примерно **3 патчей** или после любого структурного изменения:

1. выгрузить свежий архив проекта
2. загрузить его в Sources
3. продолжить только от него

Цель: не допустить рассинхрона между реальным кодом и обсуждением.

---

## 5. Patch Size Rule

Предпочтительный размер:
- 1 логическая цель
- 2–3 файла
- 4–5 файлов допустимы, если это реально один слой

Нельзя делать большие “свалочные” патчи без явной необходимости.

---

## 6. Gameplay Freeze

Без отдельной команды владельца нельзя:
- менять core loop
- менять movement canon
- добавлять новые механики ради эксперимента
- менять SDK/monetization архитектуру до соответствующей фазы

Разрешено:
- visual layer
- asset hooks
- polish
- safe fallback
- docs / manifests / process

---

## 7. Language Rule

- Обсуждение, объяснения, review — **на русском**
- Промты для coding agents — **на английском**
- Если нужен файл-документ для проекта, он может быть на русском, но должен быть структурирован так, чтобы ИИ легко считывал разделы

---

## 8. Asset Rule

Runtime assets живут в проекте в `/public/...`

Source assets (Blender, PSD, Krita, DAW stems, previews) не должны смешиваться с runtime-ассетами.

Каноническое разделение:
- `/public/models`
- `/public/audio`
- `/public/textures`
- `/public/ui`
- `/design_source/models`
- `/design_source/textures`
- `/design_source/audio`
- `/marketing`

---

## 9. Agent Read Order Rule

Любой новый ИИ/агент обязан сначала прочитать:
1. `PROJECT_RULES.md`
2. `07_Agent_Handoff_v0_4.md`
3. `06_Current_Project_State.md`
4. `04_Checklists_v0_4.md`
5. `02_Project_Structure_And_Asset_Contract_v0_4.md`

Только после этого он может предлагать патчи.

---

## 10. Failure Rule

Если 2 итерации подряд не дали корректного применения:
1. остановить цепочку
2. зафиксировать blocker
3. запросить свежий архив
4. сузить задачу

---

## 11. Context Rule

Когда чат начинает реально тяжелеть или появляется чувство, что текущая задача завершена и начинается новая, лучше переходить в новый чат с:
- новым архивом
- этим docs pack
- коротким handoff prompt

---

## 12. Canon of Truth for Assets

Для любого ассета должны существовать:
- target runtime path
- source file path
- format
- intended consumer in code
- fallback behavior
- status: `planned / ready / wired / shipped`

Если этого нет — ассет считается неуправляемым.
