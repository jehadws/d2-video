// story/plan.mjs — the shot plan. Boundaries are derived from timeline/sentences.json so the
// cut always lands just before the phrase it illustrates; `cut` forces a mid-sentence split.
// Run: node story/plan.mjs   (writes story/shots.json)
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const sentences = JSON.parse(readFileSync(join(HERE, '..', 'timeline', 'sentences.json'), 'utf8'));
const config = JSON.parse(readFileSync(join(HERE, '..', 'config.json'), 'utf8'));
const VOICE_END = config.duration;
const EARLY = 0.15;

// a/b = first/last sentence index (0-based, inclusive). cut = explicit end time in seconds.
const PLAN = [
  // ---- cold open: the hook ----
  { a: 0, b: 0, set: 'chess', fr: 'wide', bars: 'scope', in: 'fade',
    scene: 'Title card: glowing caps question over the chess hall at dusk, long table, one lit window, the hero a small silhouette at the far end.' },
  { a: 1, b: 1, set: 'chess', fr: 'insert',
    scene: 'Insert: chessboard from above, pieces in endgame layout, thin gold grid beginning to glow on the squares.' },
  { a: 2, b: 2, set: 'chess', fr: 'reveal',
    scene: 'Reveal: forty ghost future-moves fan out over the board in gold line-art while the hero sits motionless, slow push-in.' },
  { a: 3, b: 3, set: 'class', fr: 'wide',
    scene: 'Establishing wide: morning classroom, teacher writing six digits on the chalkboard, hero at a desk in the third row, dust in the window light.' },
  { a: 4, b: 4, cut: 11.9, set: 'class', fr: 'medium',
    scene: 'Medium single: hero raises one hand without looking up, gold answer digits floating above the desk.' },
  { a: 4, b: 4, set: 'class', fr: 'insert',
    scene: 'Insert: the teacher’s chalk still touching the board, her hand frozen mid-stroke, 451,608 glowing under it.' },
  { a: 5, b: 5, set: 'hall', fr: 'two_shot',
    scene: 'Medium two-shot: school hallway at the lockers, Leo on the left holding out a knotted charger cable, hero reaching for it.' },
  { a: 6, b: 7, set: 'hall', fr: 'interaction',
    scene: 'Interaction: the hero takes the tangled cable in both hands, the knot outlined in red; on "untangled" it comes loose in a blur of speed lines with a 2.00 s readout stamping in.' },
  { a: 8, b: 8, set: 'hall', fr: 'two_shot',
    scene: 'Two-shot: the neat coil lands back in Leo’s open hands, Leo’s jaw dropped, hero shrugging.' },
  { a: 9, b: 9, cut: 21.0, set: 'city', fr: 'insert',
    scene: 'Insert: bus timetable board at a shelter, departure rows lighting up one by one.' },
  { a: 9, b: 9, cut: 22.4, set: 'void', fr: 'insert',
    scene: 'Insert: a weather map with pressure numbers and a rain percentage counting up.' },
  { a: 9, b: 9, cut: 23.8, set: 'kitchen', fr: 'insert',
    scene: 'Insert: newspaper crossword grid, letters dropping into the squares.' },
  { a: 9, b: 9, set: 'city', fr: 'wide',
    scene: 'Top-down wide: a crowd at the crossroads, small ink figures, an exact head count ticking in gold.' },
  { a: 10, b: 13, set: 'city', fr: 'insert',
    scene: 'Stamp montage on one board: four DONE badges slam in sequence, one per spoken "Done", each on its own task card.' },
  { a: 14, b: 14, set: 'kitchen', fr: 'medium',
    scene: 'Medium single: hero at the kitchen counter staring into nothing, morning light, toaster behind him.' },
  { a: 15, b: 15, set: 'kitchen', fr: 'insert',
    scene: 'Insert: the toaster with two slices still upright inside, one amber NOT DONE badge over it.' },

  // ---- the number ----
  { a: 16, b: 17, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint data card: the IQ bell curve drawing itself with markers at 100 AVERAGE and 200 HIGHEST RECORDED.' },
  { a: 18, b: 19, set: 'void', fr: 'close_up', bars: 'scope',
    scene: 'Giant close-up: the hero’s face fills the frame while a gold counter rolls from 0 to 1000 beside the head.' },
  { a: 20, b: 20, set: 'void', fr: 'reveal', bars: 'none', in: 'flash',
    scene: 'Reveal: the chart axis snaps and the gold bar shoots off the top of the frame, the scale shattering like glass.' },
  { a: 21, b: 21, set: 'void', fr: 'medium', in: 'dip',
    scene: 'Medium single in the void: the hero standing in one rim light, camera slow push, THE RULE line above him.' },
  { a: 22, b: 22, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: a head in profile with the brain lighting up, speed arcs and clock hands spinning inside it.' },
  { a: 23, b: 23, set: 'class', fr: 'medium',
    scene: 'Medium single: the same hero’s body slumped and slow in the desk chair, one arm dangling, comic stillness.' },
  { a: 24, b: 24, cut: 47.6, set: 'kitchen', fr: 'reveal', bars: 'scope', in: 'flash',
    scene: 'Freeze frame: a glass slipping off a counter hangs mid-air with a dotted fall path and timing math around it.' },
  { a: 24, b: 25, cut: 48.7, set: 'kitchen', fr: 'interaction',
    scene: 'Interaction: the hero’s hand closes on empty air a half-second late, frozen droplets hanging around the fingers.' },
  { a: 25, b: 25, set: 'kitchen', fr: 'wide',
    scene: 'Wide: kitchen floor, glass shattered in a wet arc, the hero standing over it looking at his own hand.' },

  // ---- act 1: school, powers, the price of noticing ----
  { a: 26, b: 26, set: 'class', fr: 'wide',
    scene: 'Chapter line SO WHAT IF YOU HAD 1000 IQ? over a wide classroom, camera drifting sideways.' },
  { a: 27, b: 27, set: 'class', fr: 'insert',
    scene: 'Insert: the capped pen on a full answer sheet, 4:00 readout against a 2:00:00 normal time.' },
  { a: 28, b: 28, set: 'class', fr: 'two_shot',
    scene: 'Two-shot: Leo at the next desk staring at his own blank paper while the hero leans back relaxed.' },
  { a: 29, b: 30, set: 'class', fr: 'close_up',
    scene: 'Giant close-up: Leo talking to camera, Dude. You just sat there., edge of blank paper in frame.' },
  { a: 31, b: 31, set: 'class', fr: 'medium',
    scene: 'Medium single: hero at his desk with three small blueprint proofs floating around his head.' },
  { a: 32, b: 32, set: 'class', fr: 'close_up',
    scene: 'Giant close-up: the hero’s smirk landing on For fun.' },
  { a: 33, b: 33, set: 'cafeteria', fr: 'two_shot',
    scene: 'Two-shot: cafeteria table, hero and Leo with trays, foreign word cards floating between them.' },
  { a: 34, b: 34, set: 'cafeteria', fr: 'insert',
    scene: 'Insert: a dessert plate with a stack of grammar cards balanced on it and a DONE stamp.' },
  { a: 35, b: 35, set: 'kitchen', fr: 'wide',
    scene: 'Establishing wide: evening kitchen, mom at the stove, hero in the doorway, warm window over the sink.' },
  { a: 36, b: 36, set: 'kitchen', fr: 'medium',
    scene: 'Medium single: mom turns with a smile, a speech bubble forming and a red tag starting to open above it.' },
  { a: 37, b: 37, set: 'kitchen', fr: 'close_up',
    scene: 'Giant close-up: the hero flat and knowing, a red NOT READY tag glowing beside the face.' },
  { a: 38, b: 38, set: 'kitchen', fr: 'insert',
    scene: 'Insert: an empty pan on the burner with two drops of oil, a waveform readout pinned at zero.' },
  { a: 39, b: 39, set: 'chess', fr: 'wide',
    scene: 'Establishing wide: chess club room, long tables, hero facing the state champion, chess clock between them.' },
  { a: 40, b: 40, set: 'chess', fr: 'insert',
    scene: 'Insert: the board from above, nine ghost moves replaying as gold arcs, a 9 badge in the corner.' },
  { a: 41, b: 42, set: 'chess', fr: 'close_up',
    scene: 'Giant close-up: the champion staring at the board, How... how did you do that? lip-synced.' },
  { a: 43, b: 43, set: 'chess', fr: 'medium',
    scene: 'Medium single: the hero shrugging, I didn’t, hands open.' },
  { a: 44, b: 45, set: 'chess', fr: 'insert',
    scene: 'Insert: the empty board alone, its grid lines glowing and reading themselves out in blueprint light.' },

  // ---- act 2: the systems ----
  { a: 46, b: 46, set: 'city', fr: 'wide',
    scene: 'Chapter line BUT WHERE IT GETS REALLY CRAZY over a wide dusk city, traffic moving below.' },
  { a: 47, b: 47, set: 'city', fr: 'reveal',
    scene: 'Reveal: wireframe overlays boot up across the whole street as the hero walks, camera pulling out and up.' },
  { a: 48, b: 48, cut: 97.2, set: 'kitchen', fr: 'insert',
    scene: 'Insert: a phone screen stock chart, a dashed line drawing the crash three days ahead of the real curve.' },
  { a: 48, b: 48, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Data card: CRASH PREDICTED -3 DAYS with the red curve falling on cue.' },
  { a: 49, b: 49, cut: 101.4, set: 'city', fr: 'wide', kind: '3d',
    scene: '3D orbit: city intersection at dawn, cars queued, traffic light poles and timing lines.' },
  { a: 49, b: 49, cut: 103.2, set: 'city', fr: 'insert',
    scene: 'Top-down diagram: the signal timing grid rewriting itself as green waves flow through the junction.' },
  { a: 49, b: 49, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Compare bars: MORNING JAM before and after, the second bar halving in place.' },
  { a: 50, b: 50, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: a team of engineer figures under a months-long timeline, above one small figure holding a lamp.' },
  { a: 51, b: 51, set: 'city', fr: 'medium',
    scene: 'Medium single: the hero at a red traffic light at dawn, one finger on the pole, small private smile.' },

  // ---- act 3: the cost ----
  { a: 52, b: 52, set: 'bedroom', fr: 'wide', in: 'dip',
    scene: 'Wide: bedroom at 2 AM, hero lying awake in moonlight, blue numbers streaming across the ceiling.' },
  { a: 53, b: 54, set: 'bedroom', fr: 'close_up', bars: 'scope',
    scene: 'Giant close-up: the hero’s eyes wide open, data streams reflecting across the face, Ever landing hard.' },
  { a: 55, b: 55, set: 'kitchen', fr: 'insert',
    scene: 'Insert: a fridge glowing in the dark kitchen, its hum drawn as a waveform with a 59.7 Hz readout.' },
  { a: 56, b: 56, set: 'bedroom', fr: 'insert',
    scene: 'Top-down insert: the ceiling fan with geometry arcs over the blades and a 2:00 badge in the corner.' },
  { a: 57, b: 58, set: 'bedroom', fr: 'medium',
    scene: 'Medium single: the hero on his back, numbers running across his face, camera slow push toward the bed.' },
  { a: 59, b: 59, set: 'city', fr: 'wide',
    scene: 'Wide pull-out through the window: the sleeping street below, one lit window left in the whole row.' },
  { a: 60, b: 60, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: a normal brain funnel discarding ninety-nine percent of the signals pouring in.' },
  { a: 61, b: 61, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: the hero’s funnel standing wide open, every signal passing straight through.' },

  // ---- act 4: Mia, dopamine, nothing left to feel ----
  { a: 62, b: 62, set: 'lab', fr: 'two_shot',
    scene: 'Two-shot: school lab, Mia tapping the hero’s shoulder while he faces the wall.' },
  { a: 63, b: 63, set: 'lab', fr: 'medium',
    scene: 'Medium single: the hero still facing the wall, Mia’s blurred shoulder in the foreground.' },
  { a: 64, b: 64, set: 'lab', fr: 'insert',
    scene: 'Insert: the wall crack spreading into a branching blueprint pattern with measured angles.' },
  { a: 65, b: 65, set: 'lab', fr: 'close_up',
    scene: 'Giant close-up: the hero soft and honest, It’s actually kind of beautiful.' },
  { a: 66, b: 66, set: 'void', fr: 'wide', in: 'dip',
    scene: 'Wide in the void: the hero small under the line THAT’S THE REAL PRICE.' },
  { a: 67, b: 67, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: a brain with one dopamine spark firing bright over a SURPRISE label.' },
  { a: 68, b: 68, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: the reward meter only filling when an unknown arrives at the gate.' },
  { a: 69, b: 69, set: 'void', fr: 'close_up',
    scene: 'Giant close-up: the hero’s flat face next to an empty reward meter.' },
  { a: 70, b: 70, set: 'void', fr: 'insert',
    scene: 'Insert: a movie poster with the twist typed straight across it and a SPOILER stamp.' },
  { a: 71, b: 71, set: 'class', fr: 'insert',
    scene: 'Insert: a pop quiz paper already filled in before the bell has finished ringing.' },
  { a: 72, b: 72, set: 'cafeteria', fr: 'wide',
    scene: 'Wide: a surprise party frozen mid-cheer, the hero standing in the middle under a crossed-out banner.' },
  { a: 73, b: 73, set: 'void', fr: 'insert',
    scene: 'Three SOLVED stamps land in a row over the poster, the quiz and the party.' },
  { a: 74, b: 75, set: 'bedroom', fr: 'wide',
    scene: 'Wide: the hero alone in a dark room, the reward meter dim and empty beside him.' },

  // ---- act 5: Leo ----
  { a: 76, b: 76, set: 'cafeteria', fr: 'two_shot', in: 'dip',
    scene: 'Two-shot: cafeteria, Leo watching the hero from across the table, tray untouched.' },
  { a: 77, b: 77, set: 'cafeteria', fr: 'wide', in: 'fade',
    scene: 'Warm flashback wide: two seven-year-olds at the same table, same yellow cap and navy hoodie.' },
  { a: 78, b: 78, set: 'cafeteria', fr: 'insert',
    scene: 'Top-down match: the same table across the years, two pairs of trays stacked above each other.' },
  { a: 79, b: 79, set: 'bedroom', fr: 'insert',
    scene: 'Insert: a closed door with three knock rings spreading across it, then one.' },
  { a: 80, b: 80, set: 'bedroom', fr: 'medium',
    scene: 'Medium single: the hero at his desk turning round as the knock pattern reads out 3 + 1.' },
  { a: 81, b: 81, set: 'bedroom', fr: 'two_shot',
    scene: 'Two-shot: Leo in the bright doorway, the hero at the desk, the held beat between them.' },
  { a: 82, b: 82, set: 'bedroom', fr: 'wide',
    scene: 'Wide: the hero sitting on the floor in the dark, Leo a bright shape in the open door.' },
  { a: 83, b: 83, set: 'bedroom', fr: 'medium',
    scene: 'Medium single: Leo on the floor beside him, talking quietly, knees up.' },
  { a: 84, b: 85, set: 'bedroom', fr: 'close_up', bars: 'scope',
    scene: 'Giant close-up: the hero hearing a joke he already finished, Leo’s voice off-screen.' },
  { a: 86, b: 86, set: 'bedroom', fr: 'close_up', bars: 'scope',
    scene: 'Giant close-up: Leo’s face, I miss confusing you.' },
  { a: 87, b: 87, set: 'bedroom', fr: 'wide',
    scene: 'Wide: the hero alone again, the equations on his wall dimming out one by one.' },

  // ---- act 6: Mr Black ----
  { a: 88, b: 88, set: 'city', fr: 'wide', in: 'dip',
    scene: 'Wide: night street, a black car at the curb under a lamp, the hero small and approaching.' },
  { a: 89, b: 89, set: 'city', fr: 'insert',
    scene: 'Insert: three pairs of shoes and suit hems on wet pavement, no faces in frame.' },
  { a: 90, b: 90, set: 'boardroom', fr: 'medium',
    scene: 'Medium single: Mr Black half in shadow at the head of the table, fedora, hands folded.' },
  { a: 91, b: 92, set: 'boardroom', fr: 'two_shot',
    scene: 'Two-shot: boardroom table, Mr Black offering across it, the hero seated with arms crossed.' },
  { a: 93, b: 93, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: market models as rotating grids and curves with a SOLVE label over them.' },
  { a: 94, b: 96, set: 'boardroom', fr: 'close_up', bars: 'scope',
    scene: 'Giant close-up: Mr Black behind dark sunglasses, Nothing illegal. Just... profitable.' },
  { a: 97, b: 97, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Data card: a world map with trade arcs lighting up and a counter running.' },
  { a: 98, b: 98, set: 'void', fr: 'reveal',
    scene: 'Reveal: gold stacking into a tower beside a calendar flipping to Friday.' },
  { a: 99, b: 99, set: 'boardroom', fr: 'close_up',
    scene: 'Giant close-up: the hero’s eyes narrowing on The catch?' },
  { a: 100, b: 100, set: 'boardroom', fr: 'insert',
    scene: 'Insert: a ledger column of numbers with one row in red and the sum mismatched.' },
  { a: 101, b: 101, set: 'boardroom', fr: 'insert',
    scene: 'Split insert: the same calculation run twice side by side, the same red row both times.' },
  { a: 102, b: 102, set: 'city', fr: 'wide',
    scene: 'Wide: a city of tiny figures as coins fall away from their hands toward a dark tower.' },
  { a: 103, b: 104, set: 'boardroom', fr: 'insert', bars: 'scope',
    scene: 'Insert: an open folder, shaky handwriting reading Pension. Last savings.' },

  // ---- act 7: the fire ----
  { a: 105, b: 105, set: 'bedroom', fr: 'medium', in: 'dip',
    scene: 'Medium single: the hero’s head snapping up off the pillow toward the window.' },
  { a: 106, b: 106, cut: 218.8, set: 'apartment', fr: 'wide', kind: '3d',
    scene: '3D establishing: an old apartment block at midnight, one stairwell window glowing orange.' },
  { a: 106, b: 106, set: 'stairwell', fr: 'insert',
    scene: 'Insert: a worn outlet sparking in the stairwell, first flame climbing the wall paper.' },
  { a: 107, b: 107, set: 'city', fr: 'wide',
    scene: 'Wide: the hero running down an empty street, a map line showing three streets between him and the fire.' },
  { a: 108, b: 108, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: the stairwell drawn in section with a fire front spreading and math beside it.' },
  { a: 109, b: 110, set: 'stairwell', fr: 'insert',
    scene: 'Diagram: dimension arrows down the stair flight reading 2 m / 8 s while exit routes close one by one.' },
  { a: 111, b: 111, set: 'stairwell', fr: 'insert',
    scene: 'Insert: the running fire model clean and blue in the hero’s point of view.' },
  { a: 112, b: 112, set: 'stairwell', fr: 'medium',
    scene: 'Medium single: the model dissolving as the hero turns toward the door.' },
  { a: 113, b: 114, set: 'city', fr: 'two_shot',
    scene: 'Two-shot on the street: the glowing model panel on one side, the burning doorway on the other.' },
  { a: 115, b: 115, set: 'stairwell', fr: 'reveal', in: 'flash',
    scene: 'Flash: the hero sprinting through the door into the smoke, speed lines and camera shake.' },
  { a: 116, b: 116, cut: 238.2, set: 'stairwell', fr: 'wide',
    scene: 'Action wide: the hero taking stairs two at a time through smoke, fire light rimming every edge.' },
  { a: 116, b: 116, cut: 240.8, set: 'stairwell', fr: 'interaction',
    scene: 'Interaction: the hero pulling a confused family of three along past a wall of smoke.' },
  { a: 116, b: 116, cut: 243.2, set: 'stairwell', fr: 'medium',
    scene: 'Medium single: Leo behind the one clear window, the hero reaching up toward him.' },
  { a: 116, b: 116, set: 'stairwell', fr: 'reveal', in: 'flash', bars: 'scope',
    scene: 'Reveal: the hallway folding in behind them in a flash of debris as the hero hauls Leo out.' },
  { a: 117, b: 117, set: 'apartment', fr: 'wide',
    scene: 'Wide: the street outside, fire glow on wet pavement, soot-faced hero and Leo coughing into the night.' },
  { a: 118, b: 118, set: 'apartment', fr: 'close_up',
    scene: 'Giant close-up: Leo, Still think I’m not surprising?' },
  { a: 119, b: 119, set: 'apartment', fr: 'close_up',
    scene: 'Giant close-up: the hero’s grin arriving before he can stop it.' },
  { a: 120, b: 121, set: 'apartment', fr: 'close_up', bars: 'scope', in: 'flash',
    scene: 'Freeze frame: the grin held, ash particles hanging in the air, an UNPREDICTED badge in the corner.' },

  // ---- act 8: the choice ----
  { a: 122, b: 123, set: 'city', fr: 'two_shot', in: 'dip',
    scene: 'Two-shot: daylight pavement, the hero handing the folder to a reporter holding a recorder.' },
  { a: 124, b: 125, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Void insert: a data card with the firm’s curve collapsing straight down, then envelopes and coins streaming back out of it into waiting hands.' },
  { a: 126, b: 126, set: 'void', fr: 'wide',
    scene: 'Wide in the void: a gold tower on one side of the frame, the hero standing small on the other.' },
  { a: 127, b: 128, set: 'cafeteria', fr: 'two_shot', in: 'fade',
    scene: 'Two-shot: cafeteria, hero and Leo shoulder to shoulder, three knock rings tapped on the table.' },
  { a: 129, b: 129, cut: 272.2, set: 'cafeteria', fr: 'medium',
    scene: 'Medium two-shot: Leo starting a joke, the hero already smiling on schedule, then stopping.' },
  { a: 129, b: 129, set: 'cafeteria', fr: 'close_up',
    scene: 'Giant close-up: genuine surprise breaking across the hero’s face, the reward meter spiking.' },
  { a: 130, b: 130, set: 'cafeteria', fr: 'wide',
    scene: 'Wide: both of them laughing in warm afternoon light, trays forgotten.' },

  // ---- act 9: is any of this real ----
  { a: 131, b: 131, set: 'void', fr: 'wide', in: 'dip',
    scene: 'Chapter line IS ANY OF THIS REAL? over the blueprint void.' },
  { a: 132, b: 132, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: the IQ scale drawn only to 300, a dashed line pointing far past its edge.' },
  { a: 133, b: 133, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: the scale snapping in the middle with question marks in the gap.' },
  { a: 134, b: 134, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Data card: HIGHEST RECORDED settling near 200.' },
  { a: 135, b: 137, set: 'void', fr: 'insert', bars: 'none',
    scene: 'Blueprint: a brain on one pan of a balance, judgment and what matters loading the other pan down.' },
  { a: 138, b: 138, set: 'lab', fr: 'wide',
    scene: 'Wide: three scientists in lab coats arguing around a number line, a question cloud overhead.' },
  { a: 139, b: 140, set: 'bedroom', fr: 'close_up', bars: 'scope',
    scene: 'Giant close-up: the hero soft and warm-rimmed, reading the question to himself.' },

  // ---- act 10: cliffhanger and end screen ----
  { a: 141, b: 141, set: 'bedroom', fr: 'insert', in: 'dip',
    scene: 'Insert: a phone buzzing face-up on a dark desk, screen lighting the room.' },
  { a: 142, b: 143, set: 'bedroom', fr: 'insert',
    scene: 'Tight insert: the screen reading Unknown number as one line types itself out.' },
  { a: 144, b: 145, set: 'bedroom', fr: 'close_up', bars: 'scope',
    scene: 'Giant close-up: the hero’s face lit from below by the screen, the message glowing in his eyes.' },
  { a: 146, b: 146, set: 'bedroom', fr: 'medium',
    scene: 'Medium single: the hero staring at the phone a long time, thumb unmoving.' },
  { a: 147, b: 147, set: 'bedroom', fr: 'insert',
    scene: 'Insert: the phone set face-down on the desk, light bleeding out from under it.' },
  { a: 148, b: 148, set: 'void', fr: 'wide', bars: 'none', in: 'fade',
    scene: 'End screen: the question line over the whole cast lined up against a warm gradient.' },
  { a: 149, b: 149, set: 'void', fr: 'wide', bars: 'none',
    scene: 'End screen: comment bubble and the ask, cast still lined up below.' },
  { a: 150, b: 151, set: 'void', fr: 'wide', bars: 'none',
    scene: 'End screen: three knock rings then one over the subscribe pill, the whole cast.' },
];

const duration = Math.max(VOICE_END, sentences[sentences.length - 1].end + 1.5);
const shots = [];
let cursor = 0;
PLAN.forEach((p, i) => {
  const first = sentences[p.a], last = sentences[p.b];
  if (!first || !last) throw new Error(`plan entry ${i} references a missing sentence`);
  if (i > 0 && (p.a < PLAN[i - 1].a || p.b < PLAN[i - 1].b)) throw new Error(`plan entry ${i} goes backwards in the narration`);
  const start = cursor;
  const next = PLAN[i + 1];
  let end = p.cut;
  if (end == null) end = next ? sentences[next.a].start - EARLY : duration;
  end = Math.min(Math.max(end, start + 0.2), duration);
  cursor = end;
  shots.push({
    id: 's' + String(i + 1).padStart(3, '0'),
    start: +start.toFixed(2),
    end: +end.toFixed(2),
    line: sentences.slice(p.a, p.b + 1).map(s => s.text).join(' '),
    scene: p.scene,
    set: p.set,
    framing: p.fr,
    bars: p.bars ?? null,
    in: { type: p.in ?? 'cut' },
    sfx: [],
    amb: null,
    notes: p.kind === '3d' ? '3D shot' : '',
  });
});

const density = shots.length / (duration / 60);
const median = (() => { const d = shots.map(s => s.end - s.start).sort((a, b) => a - b); return d[Math.floor(d.length / 2)]; })();
if (Math.abs(cursor - duration) > 0.01) console.warn(`warning: timeline ends at ${cursor.toFixed(2)}s, expected ${duration.toFixed(2)}s`);

const covered = new Set();
PLAN.forEach(p => { for (let k = p.a; k <= p.b; k++) covered.add(k); });
const missing = sentences.map(s => s.i).filter(k => !covered.has(k));
if (missing.length) throw new Error(`plan leaves sentences unsaid: ${missing.join(', ')}`);

const out = {
  title: config.title,
  duration: +duration.toFixed(2),
  shots,
  music: [],
  sfx: [],
};
writeFileSync(join(HERE, 'shots.json'), JSON.stringify(out, null, 2) + '\n', 'utf8');
console.log(`wrote ${shots.length} shots | duration ${duration.toFixed(2)}s | median ${(shots[0].end - shots[0].start) && median.toFixed(2)}s | ${density.toFixed(1)} shots/min`);
const bySet = {};
shots.forEach(s => { bySet[s.set] = (bySet[s.set] || 0) + 1; });
console.log('sets:', Object.entries(bySet).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
const byFraming = {};
shots.forEach(s => { byFraming[s.framing] = (byFraming[s.framing] || 0) + 1; });
console.log('framing:', Object.entries(byFraming).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', '));
if (process.argv.includes('--list')) {
  const mm = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${(s % 60).toFixed(1).padStart(4, '0')}`;
  shots.forEach(s => console.log(`${s.id} ${mm(s.start)} ${(s.end - s.start).toFixed(2).padStart(5)} ${s.framing.padEnd(11)} ${s.line}`));
}
