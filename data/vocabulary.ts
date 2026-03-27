import vocabularyExtraRaw from "./vocabulary-extra.json";

export interface VocabWord {
  id: number;
  french: string;
  pronunciation: string;
  english: string;
  partOfSpeech: string;
  example: {
    french: string;
    english: string;
  };
  explanation: string;
}

type VocabSeed = Omit<VocabWord, "id">;

/** Subtitle-frequency homographs where Wiktionary’s first sense misleads learners. */
const HOMOGRAPH_PATCH: Record<string, Partial<VocabSeed>> = {
  est: {
    english: "is (3rd person singular of être)",
    partOfSpeech: "verb",
    example: {
      french: "Elle est française.",
      english: "She is French.",
    },
    explanation: "Verb form of être, not the separate word for “east”.",
  },
  pas: {
    english: "not (negation; often with ne)",
    partOfSpeech: "adverb",
    example: {
      french: "Ce n'est pas grave.",
      english: "It's not serious.",
    },
    explanation: "Negation adverb; in subtitles this is far more frequent than noun “step”.",
  },
  ai: {
    english: "have (1st person singular of avoir)",
    partOfSpeech: "verb",
    example: { french: "J'ai faim.", english: "I'm hungry." },
    explanation: "J' + ai: present of avoir.",
  },
  as: {
    english: "have (2nd person singular informal of avoir)",
    partOfSpeech: "verb",
    example: { french: "Tu as raison.", english: "You're right." },
    explanation: "Tu + as: present of avoir.",
  },
  es: {
    english: "are (2nd person singular of être)",
    partOfSpeech: "verb",
    example: { french: "Tu es en retard.", english: "You are late." },
    explanation: "Tu + es: present of être.",
  },
  a: {
    english: "has; have (3rd person of avoir)",
    partOfSpeech: "verb",
    example: { french: "Il a deux frères.", english: "He has two brothers." },
    explanation: "Il/elle/on a: third-person present of avoir.",
  },
};

function withPatches(seed: VocabSeed): VocabSeed {
  const patch = HOMOGRAPH_PATCH[seed.french];
  return patch ? { ...seed, ...patch } : seed;
}

const coreVocabulary: VocabWord[] = [
  {
    id: 1,
    french: "bonjour",
    pronunciation: "bɔ̃.ʒuʁ",
    english: "hello / good morning",
    partOfSpeech: "exclamation",
    example: {
      french: "Bonjour, comment allez-vous ?",
      english: "Hello, how are you?",
    },
    explanation: "Used as a greeting in the morning and daytime. Switch to 'bonsoir' in the evening.",
  },
  {
    id: 2,
    french: "merci",
    pronunciation: "mɛʁ.si",
    english: "thank you",
    partOfSpeech: "exclamation",
    example: {
      french: "Merci beaucoup pour votre aide !",
      english: "Thank you very much for your help!",
    },
    explanation: "'Merci beaucoup' = thank you very much. 'Merci bien' is slightly informal.",
  },
  {
    id: 3,
    french: "maison",
    pronunciation: "mɛ.zɔ̃",
    english: "house / home",
    partOfSpeech: "noun (f)",
    example: {
      french: "Je rentre à la maison après le travail.",
      english: "I go home after work.",
    },
    explanation: "Feminine noun. 'À la maison' means 'at home'. Don't confuse with 'appartement' (apartment).",
  },
  {
    id: 4,
    french: "manger",
    pronunciation: "mɑ̃.ʒe",
    english: "to eat",
    partOfSpeech: "verb",
    example: {
      french: "Nous mangeons ensemble ce soir.",
      english: "We are eating together tonight.",
    },
    explanation: "Regular -er verb. Note the spelling change: 'nous mangeons' (keep the 'e' before 'o' for soft 'g' sound).",
  },
  {
    id: 5,
    french: "beau / belle",
    pronunciation: "bo / bɛl",
    english: "beautiful / handsome",
    partOfSpeech: "adjective",
    example: {
      french: "C'est une belle journée aujourd'hui.",
      english: "It's a beautiful day today.",
    },
    explanation: "'Beau' is masculine, 'belle' is feminine. Before a masculine vowel: 'bel' (e.g., un bel homme).",
  },
  {
    id: 6,
    french: "travailler",
    pronunciation: "tʁa.va.je",
    english: "to work",
    partOfSpeech: "verb",
    example: {
      french: "Elle travaille dans un hôpital.",
      english: "She works in a hospital.",
    },
    explanation: "Regular -er verb. Commonly used: 'Je travaille' (I work), 'travailler dur' (to work hard).",
  },
  {
    id: 7,
    french: "eau",
    pronunciation: "o",
    english: "water",
    partOfSpeech: "noun (f)",
    example: {
      french: "Est-ce que je peux avoir un verre d'eau ?",
      english: "Can I have a glass of water?",
    },
    explanation: "Feminine noun. Plural is 'eaux'. 'Eau minérale' = mineral water, 'eau du robinet' = tap water.",
  },
  {
    id: 8,
    french: "livre",
    pronunciation: "livʁ",
    english: "book",
    partOfSpeech: "noun (m)",
    example: {
      french: "J'aime lire des livres le soir.",
      english: "I like to read books in the evening.",
    },
    explanation: "Masculine noun. Not to be confused with 'la livre' (pound — currency or weight), which is feminine.",
  },
  {
    id: 9,
    french: "partir",
    pronunciation: "paʁ.tiʁ",
    english: "to leave / to go away",
    partOfSpeech: "verb",
    example: {
      french: "Il part pour Paris demain matin.",
      english: "He leaves for Paris tomorrow morning.",
    },
    explanation: "Irregular -ir verb. Conjugation: je pars, tu pars, il/elle part, nous partons, vous partez, ils/elles partent.",
  },
  {
    id: 10,
    french: "ville",
    pronunciation: "vil",
    english: "city / town",
    partOfSpeech: "noun (f)",
    example: {
      french: "Paris est une grande ville.",
      english: "Paris is a big city.",
    },
    explanation: "Feminine noun. 'En ville' = downtown / in the city. 'Village' is a smaller settlement.",
  },
  {
    id: 11,
    french: "aimer",
    pronunciation: "ɛ.me",
    english: "to love / to like",
    partOfSpeech: "verb",
    example: {
      french: "J'aime beaucoup le chocolat.",
      english: "I really like chocolate.",
    },
    explanation: "Regular -er verb. Used for both 'love' (people) and 'like' (things). 'J'aime bien' softens to 'I like' rather than 'I love'.",
  },
  {
    id: 12,
    french: "vouloir",
    pronunciation: "vu.lwaʁ",
    english: "to want",
    partOfSpeech: "verb",
    example: {
      french: "Je voudrais un café, s'il vous plaît.",
      english: "I would like a coffee, please.",
    },
    explanation: "Irregular verb. 'Je voudrais' (I would like) is the polite conditional form used in shops and restaurants.",
  },
  {
    id: 13,
    french: "avoir",
    pronunciation: "a.vwaʁ",
    english: "to have",
    partOfSpeech: "verb",
    example: {
      french: "Elle a deux enfants.",
      english: "She has two children.",
    },
    explanation: "One of the most important French verbs. Also used as an auxiliary verb to form compound tenses like passé composé.",
  },
  {
    id: 14,
    french: "être",
    pronunciation: "ɛtʁ",
    english: "to be",
    partOfSpeech: "verb",
    example: {
      french: "Nous sommes contents de vous voir.",
      english: "We are happy to see you.",
    },
    explanation: "The most fundamental French verb. Also used as an auxiliary for some verbs (e.g., movement verbs) in compound tenses.",
  },
  {
    id: 15,
    french: "soleil",
    pronunciation: "sɔ.lɛj",
    english: "sun",
    partOfSpeech: "noun (m)",
    example: {
      french: "Le soleil brille aujourd'hui.",
      english: "The sun is shining today.",
    },
    explanation: "Masculine noun. 'Il fait soleil' = it's sunny. 'Lunettes de soleil' = sunglasses.",
  },
  {
    id: 16,
    french: "temps",
    pronunciation: "tɑ̃",
    english: "time / weather",
    partOfSpeech: "noun (m)",
    example: {
      french: "Quel temps fait-il aujourd'hui ?",
      english: "What is the weather like today?",
    },
    explanation: "Has two meanings: time ('Je n'ai pas le temps' = I don't have time) and weather ('Il fait beau temps' = the weather is nice).",
  },
  {
    id: 17,
    french: "nuit",
    pronunciation: "nɥi",
    english: "night",
    partOfSpeech: "noun (f)",
    example: {
      french: "Bonne nuit, dors bien !",
      english: "Good night, sleep well!",
    },
    explanation: "Feminine noun. 'La nuit' = at night. 'Bonne nuit' is said when going to bed, unlike 'bonsoir' which is an evening greeting.",
  },
  {
    id: 18,
    french: "savoir",
    pronunciation: "sa.vwaʁ",
    english: "to know (a fact)",
    partOfSpeech: "verb",
    example: {
      french: "Est-ce que tu sais où est la gare ?",
      english: "Do you know where the train station is?",
    },
    explanation: "Used for knowing facts/information. Contrast with 'connaître' which means to know a person or place.",
  },
  {
    id: 19,
    french: "parler",
    pronunciation: "paʁ.le",
    english: "to speak / to talk",
    partOfSpeech: "verb",
    example: {
      french: "Parlez-vous français ?",
      english: "Do you speak French?",
    },
    explanation: "Regular -er verb. 'Parler de' = to talk about. 'Parler à quelqu'un' = to talk to someone.",
  },
  {
    id: 20,
    french: "enfant",
    pronunciation: "ɑ̃.fɑ̃",
    english: "child",
    partOfSpeech: "noun (m/f)",
    example: {
      french: "Les enfants jouent dans le parc.",
      english: "The children are playing in the park.",
    },
    explanation: "Can be masculine or feminine depending on the child's gender. Plural: 'les enfants'. Related: 'infantile' (childish).",
  },
  {
    id: 21,
    french: "argent",
    pronunciation: "aʁ.ʒɑ̃",
    english: "money / silver",
    partOfSpeech: "noun (m)",
    example: {
      french: "Je n'ai pas assez d'argent.",
      english: "I don't have enough money.",
    },
    explanation: "Means both 'money' (common usage) and 'silver' (the metal). Context makes it clear which meaning is intended.",
  },
  {
    id: 22,
    french: "voir",
    pronunciation: "vwaʁ",
    english: "to see",
    partOfSpeech: "verb",
    example: {
      french: "On se voit demain ?",
      english: "Shall we see each other tomorrow?",
    },
    explanation: "Irregular verb. 'Je vois' = I see/understand. 'Voyons voir' = let's see. Used both literally and figuratively.",
  },
  {
    id: 23,
    french: "faire",
    pronunciation: "fɛʁ",
    english: "to do / to make",
    partOfSpeech: "verb",
    example: {
      french: "Qu'est-ce que tu fais ce week-end ?",
      english: "What are you doing this weekend?",
    },
    explanation: "Very versatile irregular verb. 'Faire du sport' = to play sports, 'faire la cuisine' = to cook, 'il fait chaud' = it's hot.",
  },
  {
    id: 24,
    french: "pays",
    pronunciation: "pe.i",
    english: "country",
    partOfSpeech: "noun (m)",
    example: {
      french: "La France est un beau pays.",
      english: "France is a beautiful country.",
    },
    explanation: "Masculine noun. The plural is also 'pays' (no change). 'Paysage' (landscape) comes from the same root.",
  },
  {
    id: 25,
    french: "ami / amie",
    pronunciation: "a.mi",
    english: "friend",
    partOfSpeech: "noun (m/f)",
    example: {
      french: "C'est mon meilleur ami.",
      english: "He is my best friend.",
    },
    explanation: "'Ami' (m) / 'amie' (f). 'Petit ami / petite amie' means boyfriend/girlfriend in informal speech.",
  },
];

const extraVocabulary: VocabWord[] = (vocabularyExtraRaw as VocabSeed[]).map(
  (row, index) => ({
    ...withPatches(row),
    id: coreVocabulary.length + index + 1,
  }),
);

export const vocabulary: VocabWord[] = [...coreVocabulary, ...extraVocabulary];

export function getRandomChoices(correct: VocabWord, all: VocabWord[]): string[] {
  const others = all.filter((w) => w.id !== correct.id);
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...shuffled.map((w) => w.english), correct.english];
  return choices.sort(() => Math.random() - 0.5);
}
