# AI_CONTEXT_MIN — Tu Tiên Lộ / Hoa Thiên Khai Đạo

This is the minimal context Codex should read before coding.

## Project

Tu Tiên Lộ / Hoa Thiên Khai Đạo is a browser RPG cultivation game.

This is a separate project, not the old XuanToi repo. Do not assume the old stack. The current repository code is the source of truth.

## Design direction

The game focuses on:

- Cultivation progression.
- Realm breakthrough.
- Quest/NPC story.
- Sect development.
- Items, skills, dungeon, boss, reward economy.
- Fair free-to-play + optional paid convenience.

## Story core

Player starts as a weak disciple joining Hoa Thiên Môn, a fallen ancient sect. The long-term story is about restoring Hoa Thiên Môn, fighting Tịch Thiên Điện, unlocking hidden inheritance, expanding through mortal world, immortal world, law realms, origin sea, and void endgame.

## Important NPCs

- Lăng Vân Sinh: sect master, main quest guide.
- Mộc Thanh Y: senior sister, tutorial, wood/healing/alchemy.
- Hàn Dạ: rival sword cultivator.
- Tô Nguyệt Ly: hidden Hoa Thiên descendant.
- Huyết La Sát: moral-choice demonic cultivator.
- Vạn Kim Nương: market/merchant NPC.
- Bạch Đế Tử: immortal-world antagonist.
- Tịch Thiên Đạo Chủ: final antagonist.

## Quest design

Every quest must have story reason. Avoid meaningless “kill 10 monsters” quests unless tied to world logic.

Quest types:

- main
- realm
- sect
- npc_side
- grind/repeatable
- event

Early realm focus:

- Phàm Nhân
- Luyện Khí
- Trúc Cơ

Each early realm should eventually have:

- 1 main quest
- 1 realm quest
- 1 sect quest
- 1 NPC side quest
- 1 grind quest

## Reward rules

- Main quests can reward more but must not break economy.
- Side quests reward moderate EXP/materials/reputation.
- Grind quests have stable limited rewards.
- Paid features should provide convenience, direction, protection, cosmetics, or extra attempts.
- Do not sell direct realm, top gear, max gems, or ultimate skills.

## Technical rules

- Do not rewrite.
- Do not change stack.
- Backend/server authoritative for rewards, EXP, items, combat, drops, claims.
- Prevent double claim.
- Add tests/integrity checks.
- Update handoff after each task.

## Best next scopes

Priority order:

1. Quest catalog + integrity tests.
2. Quest API with claim protection.
3. Quest UI.
4. Item/skill catalog by elements.
5. Dungeon/loot/boss content pack.
6. Balance/smoke tests.
