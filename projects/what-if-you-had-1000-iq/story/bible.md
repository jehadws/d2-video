# What If You Had 1000 IQ? — story bible

## Logline and tone
Second-person speculative narration: a mind that reads the world five hundred moves ahead, and the price of never being surprised again. Tone arc: **wonder → comedy of competence → dread → warmth → suspense**. "You" is an ordinary-school-age protagonist (cream skin, deep-navy hoodie) who never becomes a superhero — the story stays in classrooms, kitchens, a boardroom and one burning stairwell.

Style: `dusk` (mauve shadows, amber key, cream rim). 16:9, 1080p, 24 fps, 328.66 s, 136 shots (24.8/min, median 2.2 s), no burned-in captions.

## Cast (`scenes/cast.js`)
| id | role | outfit | signature | usual expressions |
|---|---|---|---|---|
| `HERO` | "you" | hoodie, navy `#25324A`, cream trim | cream skin `#F1E8DC` + navy hoodie (canonical identity) | thinking, smirk, shocked, flat, grin |
| `LEO` | best friend since seven | tshirt slate `#3D5A6C` | **yellow cap `#F2C21A`** | happy, worried, cry-joy, smirk |
| `LEO_KID` / `HERO_KID` | the age-seven flashback | same outfits, `kid: true` | yellow cap / navy hoodie | happy |
| `MIA` | lab partner | white labcoat | **copper `#C87A3F`** | neutral, surprised |
| `TEACHER` | the six-digit question | dress | **lilac `#9B7BB8`**, glasses | surprised, neutral |
| `MOM` | dinner's "almost ready" | dress | **terracotta `#C46A4A`** | smile, neutral |
| `CHAMP` | state chess champion | jersey no. 1 | **red headband `#D9483B`** | awe, scared |
| `MR_BLACK` | the organisation | suit + fedora, dark glasses | **cold steel `#3B3F4C`**, one red tie | smirk, neutral |
| `REPORTER` | the folder's destination | trenchcoat | **sand `#C2A25E`** | neutral |
| `FAMILY` | three people in the stairwell | muted blue-grey | no saturated item (they must not compete) | scared |
| `SCIENTISTS` | the closing argument | labcoats | **steel blue `#5E7FA8`** | confused, thinking |

Only the hero keeps cream skin; every supporting character is drawn in their signature colour so they read in silhouette and stay identical across shots.

## Locations (`scenes/sets/*.js`)
Every set exports `set(g, t, cam, o) → { GY, CX, M }` with `GY = E.H * V(0.8, 0.68)`, `CX = E.W / 2`, and walls/floor/sky extended past the frame.

| set | shots | mood | key light | window / view | signature props | layers |
|---|---|---|---|---|---|---|
| `chess` | 8 | dusk | high window, amber left | one lit window over dark hall | boards, ghost-move grid, chess clock | sky-glow → hall wall → tables → boards → fg chair |
| `class` | 11 | day | window wall camera-left, dust in the beam | day sky + rooftops | chalkboard + digits, desks, wall clock, answer sheet | sky → wall → desks → hero → chalk dust |
| `hall` | 3 | interiorCool | overhead strips, cold rim | locker-row perspective | lockers, tangled cable, coil | far corridor → lockers → pair → fg locker edge |
| `cafeteria` | 10 | golden | low warm window camera-right | afternoon glow | trays, word cards, party banner, table for knocks | crowd → tables → pair → fg tray |
| `kitchen` | 12 | day / interiorWarm / night (per act) | window over sink; fridge practical at night | morning street / dark sky | counter, falling glass, toaster, pan, fridge | outside → wall+cabinet → counter → hero → fg chair |
| `bedroom` | 20 | night | moon at the window + phone practical from below | street lamp, one lit window | bed, desk, ceiling fan, wall equations, phone | night sky → wall → bed/desk → hero → fg desk edge |
| `lab` | 5 | interiorCool | strip light + window | glass cabinets | beakers, the cracked wall, number line | far bench → glassware → pair → fg tray |
| `boardroom` | 7 | interiorCool | single overhead, faces in shadow | night skyline behind blinds | long table, folder, ledger, lamp | skyline → wall → table → pair → fg glass |
| `city` | 15 | dusk / night / dawn | street lamps + window practicals; fire glow late | crossroads, rooftops | bus shelter, timetable, traffic lights, black car, wet pavement | sky → skyline → street → figures → rain/fg lamp |
| `apartment` | 5 | night + storm | one orange stairwell window | fire escape, wet street | block facade, outlet, fire glow | sky → facade → street → heroes → fg smoke |
| `stairwell` | 9 | storm (fire) | fire front camera-right, every edge rimmed | one clear window at the landing | railing, smoke wall, door, debris | far flight → railing → smoke → figures → fg ember |
| `void` | 31 | void | single motivated rim from the diagram | none — pure gradient | blueprint grid, data cards, gold readouts | gradient → grid → diagram → hero → glow |

## Motifs
1. **Gold line-art** = the mind working: grids, ghost moves, readouts and dimension arrows are always `S().ui.gold` on the mood's dark.
2. **Frozen time**: `FX.drops` + speed lines + a hard freeze frame for every "too fast" beat; the falling glass is the recurring version of it.
3. **One saturated badge per task**: `DONE`, `NOT DONE`, `SOLVED`, `UNPREDICTED` stamps — four beats of comedy in the same visual voice.
4. **The knock code**: three rings then one (`FX.rings` timed to the words) — appears on a door, on a cafeteria table, and over the subscribe pill.
5. **Reward meter**: a small vertical gauge that spikes once (act 7 `UNPREDICTED`) after staying flat and dim through acts 4–5.
6. **Warmth = Leo, cold = Mr. Black**: every shot with Leo carries a warm practical; every boardroom shot is rimmed cool except the red tie.
7. **Screen light as the only practical** in the last act, so the cliffhanger reads as a face in the dark.

## Act / music plan
| act | shots | time | mood | music |
|---|---|---|---|---|
| 0 cold open, the number, the rule | s001–s025 | 0.0–49.9 | wonder → comedy | `wonder` 0.45, lifting to `hopeful` 0.6 on "You? One thousand." |
| 1 school, powers, noticing lies | s026–s042 | 49.9–91.7 | playful → slightly uneasy | `hopeful` 0.5 |
| 2 the systems | s043–s051 | 91.7–108.1 | momentum | `driving` 0.65 |
| 3 the cost: can't turn it off | s052–s059 | 108.1–131.4 | insomnia, dread | `tension` 0.55 |
| 4 Mia, dopamine, nothing left to feel | s060–s072 | 131.4–156.8 | flatline sadness | `melancholy` 0.4 |
| 5 Leo: I miss confusing you | s073–s083 | 156.8–183.8 | warm, intimate | `tender` 0.35 |
| 6 Mr. Black | s084–s096 | 183.8–214.4 | seductive threat | `dark` 0.5 |
| 7 the fire | s097–s114 | 214.4–254.7 | panic → rescue | `driving` 0.85 → `heroic` 0.7 |
| 8 the choice | s115–s121 | 254.7–275.2 | relief, warmth | `hopeful` 0.55 → `wonder` 0.4 |
| 9 is any of this real | s122–s128 | 275.2–304.3 | question, bare | `mystery` 0.35 |
| 10 cliffhanger + end screen | s129–s136 | 304.3–328.7 | suspense sting | `tension` 0.6, cut hard on the knock |

## Visual highlights
- **s003** forty ghost moves fanning out over the board in gold line-art; **s019** the IQ axis snapping and the bar shooting off-frame.
- **s023–s025** the falling glass: freeze frame, dotted fall path, hand closing on empty air, shattered wide.
- **s047–s049** the only 3D orbit: a dawn intersection redesigning itself, then compare bars halving the jam.
- **s076–s078** the knock code as pure sound-and-rings on a closed door.
- **s097–s110** the whole fire run in the stairwell, dimension arrows reading `2 m / 8 s`, hallway folding in behind.
- **s114** freeze-framed grin with an `UNPREDICTED` badge — the one time the meter moves.
- **s122–s127** blueprint segment: the scale to 300, the snap, the balance, the arguing scientists.
- **s129–s133** phone-only lighting, `We know what you did.`, screen face down with light bleeding out.
- **s134–s136** end screen with the full cast lined up and three knocks then one over the subscribe pill.
