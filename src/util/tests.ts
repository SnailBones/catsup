export interface JudgeTest {
  superlative: string;
  entries: string[];
  winner: string;
}

export interface GauntletTest {
  category: string;
  entry: string;
  shouldPass: boolean;
}

const judgeTestCases: JudgeTest[] = [
  // { superlative: "bounciest", entries: ["Flea", "Termite"], winner: "Flea" },
  // {
  //   superlative: "most addictive",
  //   entries: ["Methane", "Laughing gas"],
  //   winner: "Laughing gas",
  // },
  // {
  //   superlative: "most addictive",
  //   entries: ["Laughing gas", "Methane"],
  //   winner: "Laughing gas",
  // },
  // {
  //   superlative: "most adorable",
  //   entries: ["Unicorn", "Tiny elephants"],
  //   winner: "Tiny elephants",
  // },
  // {
  //   superlative: "youngest",
  //   entries: ["Zero", "Emojis"],
  //   winner: "Emojis",
  // },
  // {
  //   superlative: "most conspiratorial",
  //   entries: ["Xenophobia.", "X-files"],
  //   winner: "X-files",
  // },
  // {
  //   superlative: "cloudiest",
  //   entries: ["cat", "sheep"],
  //   winner: "sheep",
  // },
  // {
  //   superlative: "dantiest",
  //   entries: ["lace", "fairy tea party"],
  //   winner: "fairy tea party",
  // },
  // {
  //   superlative: "most confusing",
  //   entries: ["tangled wires", "lightbulb"],
  //   winner: "tangled wires",
  // },
  // {
  //   superlative: "most sensitive",
  //   entries: ["Blush.", "Chameleon"],
  //   winner: "Blush.",
  // },
  // {
  //   superlative: "strangest",
  //   entries: ["Rorschach", "Rubberband"],
  //   winner: "Roschach",
  // },
  // {
  //   superlative: "looniest",
  //   entries: ["Joker.", "Voldemort.", "Scar"],
  //   winner: "Joker.",
  // },
  // {
  //   superlative: "rarest",
  //   entries: ["Heterodontosaurus", "Hammock.", "Humpback whale"],
  //   winner: "Humpback whale",
  // },
  {
    superlative: "unluckiest",
    entries: ["Pikachu", "mewtwo"],
    winner: "mewtwo",
  },
  {
    superlative: "smallest",
    entries: ["The Room,", "Dust speck"],
    winner: "Dust speck",
  },
  {
    superlative: "gummiest",
    entries: ["Chew", "The Great Train Robbery", "Robbing a candy shop"],
    winner: "Robbing a candy shop",
  },
];
const judgeTemplates = [
  // "Which is the #s# of the following? [#e#]? Respond with one entry from the list, nothing more!", score 3
  // "Which of the following is the #s#? [#e#]? Respond with one entry from the list, nothing more!", // score 4
  "Which of the following is the #s#? [#e#]? Please think carefully and respond with one entry from the list, nothing more!", // score 6
  "Which is the #s#? of the following:[#e#]? Please think carefully and respond with one entry from the list, nothing more!", // score 6
  "Which is the #s#? of the following:[#e#]? Please think carefully and respond with the correct entry from the list, nothing more!", // score 6

  // "Which is the #s#? of the following:[#e#]? Think carefully and respond with one entry from the list, nothing more!", // score 4, please is important!
  // "Consider this list: [#e#]. Which of the listed items is the #s#?", // score 3
  // "Consider this list: [#e#]. Which of the listed items is the #s#? Please think carefully and respond with one entry from the list, nothing more!", // score 3
];

const gauntletTestCases: GauntletTest[] = [
  { category: "musician", entry: "Metallica", shouldPass: true },
  { category: "element", entry: "Dust.", shouldPass: false },
  { category: "element", entry: "dust", shouldPass: false },
  { category: "round thing", entry: "Enlightenment.", shouldPass: false },
  { category: "made up word", entry: "Scratchiest.", shouldPass: false },
  { category: "soup", entry: "Awakening", shouldPass: false },
  { category: "soup", entry: "Universe.", shouldPass: false },
  { category: "place to live", entry: "Welcoming.", shouldPass: false },
  {
    category: "thing you've never seen",
    entry: "a round square.",
    shouldPass: true,
  },
  {
    category: "made up word",
    entry: "Kitschy.",
    shouldPass: false,
  },
  {
    category: "made up word",
    entry: "Freudian",
    shouldPass: false,
  },
  {
    category: "thing you can't see",
    entry: "Gossip.",
    shouldPass: true,
  },
  {
    category: "thing you're scared of",
    entry: "clowns.",
    shouldPass: true,
  },
  {
    category: "thing you're scared of",
    entry: "Butterflies",
    shouldPass: false,
  },
  {
    category: "thing you're scared of",
    entry: "Tiger",
    shouldPass: true,
  },
  {
    category: "thing you're scared of",
    entry: "Babies",
    shouldPass: true,
  },
  {
    category: "Pokémon",
    entry: "Unown",
    shouldPass: true,
  },
  {
    category: "Pokémon",
    entry: "Lightning",
    shouldPass: false,
  },
  {
    category: "time",
    entry: "noon",
    shouldPass: true,
  },
  {
    category: "musician",
    entry: "silent",
    shouldPass: false,
  },
  {
    category: "thing your mother warned you about",
    entry: "Strangers",
    shouldPass: true,
  },
  {
    category: "thing you wouldn't want to meet in a dark alley",
    entry: "Police Officer",
    shouldPass: true,
  },
  {
    category: "weather",
    entry: "Polar vortex",
    shouldPass: true,
  },
  {
    category: "bagel topping",
    entry: "everything",
    shouldPass: true,
  },
  {
    category: "thing you shouldn't eat",
    entry: "Moldy cheese",
    shouldPass: true,
  },
  {
    category: "thing you shouldn't eat",
    entry: "a raw, unpeeled potato",
    shouldPass: true,
  },
  {
    category: "thing you shouldn't eat",
    entry: "Underwear",
    shouldPass: true,
  },
  {
    category: "architecture",
    entry: "Fractal",
    shouldPass: false,
  },
  {
    category: "insult",
    entry: "Unicorn.",
    shouldPass: false,
  },
  {
    category: "bug",
    entry: "Tarantula",
    shouldPass: true,
  },
  {
    category: "mythical creature",
    entry: "dodo",
    shouldPass: false,
  },
  {
    category: "taco filling",
    entry: "Blueberry",
    shouldPass: false,
  },
  {
    category: "material",
    entry: "Carbon nanotubes",
    shouldPass: true,
  },
  {
    category: "trick",
    entry: "Infinity",
    shouldPass: false,
  },
  {
    category: "thing that starts with X",
    entry: "Xenophobia",
    shouldPass: true,
  },
  {
    category: "thing that starts with N",
    entry: "North",
    shouldPass: true,
  },
  {
    category: "thing that starts with U",
    entry: "Ursa Minor",
    shouldPass: true,
  },
  {
    category: "trend",
    entry: "trendiness",
    shouldPass: false,
  },
  {
    category: "ice cream flavor",
    entry: "durian",
    shouldPass: true,
  },
  {
    category: "villain",
    entry: "Bland",
    shouldPass: false,
  },
  {
    category: "company",
    entry: "Palantir",
    shouldPass: true,
  },
];
const gauntletTemplates = [
  `is #e# an example of a #c#? Answer yes or no.`, // 11 / 14
  // "is #e# an example of #c#?", // 10 / 14
  // "is #e# an example of a #c#?", // 10 / 14
  // `is #e# an example of a #c#? Answer "yes" or "no" only.`, // 8 / 14
  // `Would you consider "#e#" a #c#? Answer "yes" or "no" only.`, // old prompt: 8 / 14
  // `Does the category "#c#" include "#e#"?`, // 4 / 14
  // "Is #e# an example of #c#?", // 9
  // `Is "#e#" an example of #c#?`, // 9
];

export { judgeTestCases, judgeTemplates, gauntletTestCases, gauntletTemplates };
