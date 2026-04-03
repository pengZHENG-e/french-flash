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

/** Subtitle-frequency homographs where Wiktionary's first sense misleads learners. */
const HOMOGRAPH_PATCH: Record<string, Partial<VocabSeed>> = {
  est: {
    english: "is (3rd person singular of être)",
    partOfSpeech: "verb",
    example: {
      french: "Elle est française.",
      english: "She is French.",
    },
    explanation: "Verb form of être, not the separate word for 'east'.",
  },
  pas: {
    english: "not (negation; often with ne)",
    partOfSpeech: "adverb",
    example: {
      french: "Ce n'est pas grave.",
      english: "It's not serious.",
    },
    explanation: "Negation adverb; in subtitles this is far more frequent than noun 'step'.",
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

const seedVocabulary: VocabSeed[] = [
  // ── Core 25 (original) ──────────────────────────────────────────────────
  {
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

  // ── Extended vocabulary ─────────────────────────────────────────────────

  // Verbs
  {
    french: "prendre",
    pronunciation: "pʁɑ̃dʁ",
    english: "to take",
    partOfSpeech: "verb",
    example: {
      french: "Je prends le métro tous les matins.",
      english: "I take the metro every morning.",
    },
    explanation: "Highly irregular verb. 'Prendre' also means to have food/drink: 'Je prends un café' = I'll have a coffee.",
  },
  {
    french: "donner",
    pronunciation: "dɔ.ne",
    english: "to give",
    partOfSpeech: "verb",
    example: {
      french: "Tu peux me donner ton numéro de téléphone ?",
      english: "Can you give me your phone number?",
    },
    explanation: "Regular -er verb. 'Donner sur' = to overlook (e.g., a window). 'Se donner du mal' = to make an effort.",
  },
  {
    french: "mettre",
    pronunciation: "mɛtʁ",
    english: "to put / to place",
    partOfSpeech: "verb",
    example: {
      french: "Mets ton manteau, il fait froid dehors.",
      english: "Put your coat on, it's cold outside.",
    },
    explanation: "Irregular verb. 'Mettre' is also used for wearing clothes: 'mettre une veste' = to put on a jacket.",
  },
  {
    french: "penser",
    pronunciation: "pɑ̃.se",
    english: "to think",
    partOfSpeech: "verb",
    example: {
      french: "Qu'est-ce que tu penses de ce film ?",
      english: "What do you think of this film?",
    },
    explanation: "Regular -er verb. 'Penser à' = to think about someone/something. 'Penser que' + clause = to think that…",
  },
  {
    french: "croire",
    pronunciation: "kʁwaʁ",
    english: "to believe / to think",
    partOfSpeech: "verb",
    example: {
      french: "Je crois qu'il est déjà parti.",
      english: "I think he has already left.",
    },
    explanation: "Irregular verb. Expresses belief or opinion. 'Je crois que oui' = I think so. Distinct from 'penser' in implying more conviction.",
  },
  {
    french: "comprendre",
    pronunciation: "kɔ̃.pʁɑ̃dʁ",
    english: "to understand",
    partOfSpeech: "verb",
    example: {
      french: "Je ne comprends pas ce mot.",
      english: "I don't understand this word.",
    },
    explanation: "Irregular verb (same pattern as 'prendre'). Essential phrase: 'Vous pouvez répéter ? Je n'ai pas compris.' = Can you repeat? I didn't understand.",
  },
  {
    french: "commencer",
    pronunciation: "kɔ.mɑ̃.se",
    english: "to start / to begin",
    partOfSpeech: "verb",
    example: {
      french: "Le film commence à vingt heures.",
      english: "The film starts at eight o'clock.",
    },
    explanation: "Regular -er verb with a spelling change: 'nous commençons' (cedilla to keep the soft 'c'). 'Commencer à' + infinitive = to start doing something.",
  },
  {
    french: "finir",
    pronunciation: "fi.niʁ",
    english: "to finish / to end",
    partOfSpeech: "verb",
    example: {
      french: "À quelle heure tu finis le travail ?",
      english: "What time do you finish work?",
    },
    explanation: "Regular -ir verb. Model verb for the -ir conjugation group. 'Finir par' + infinitive = to end up doing something.",
  },
  {
    french: "chercher",
    pronunciation: "ʃɛʁ.ʃe",
    english: "to look for / to search",
    partOfSpeech: "verb",
    example: {
      french: "Je cherche mes clés depuis ce matin.",
      english: "I've been looking for my keys since this morning.",
    },
    explanation: "Regular -er verb. 'Chercher à' + infinitive = to try to. 'Aller chercher quelqu'un' = to go pick someone up.",
  },
  {
    french: "trouver",
    pronunciation: "tʁu.ve",
    english: "to find",
    partOfSpeech: "verb",
    example: {
      french: "J'ai trouvé un appartement près du centre-ville.",
      english: "I found an apartment near downtown.",
    },
    explanation: "Regular -er verb. 'Trouver que' = to find/think that (opinion). 'Se trouver' = to be located: 'La gare se trouve ici.'",
  },
  {
    french: "attendre",
    pronunciation: "a.tɑ̃dʁ",
    english: "to wait (for)",
    partOfSpeech: "verb",
    example: {
      french: "J'attends le bus depuis vingt minutes.",
      english: "I've been waiting for the bus for twenty minutes.",
    },
    explanation: "Regular -re verb. Unlike English, no preposition needed: 'attendre quelqu'un' = to wait for someone (not 'attendre pour').",
  },
  {
    french: "perdre",
    pronunciation: "pɛʁdʁ",
    english: "to lose",
    partOfSpeech: "verb",
    example: {
      french: "Il a perdu son portefeuille dans le métro.",
      english: "He lost his wallet on the metro.",
    },
    explanation: "Regular -re verb. 'Perdre du temps' = to waste time. 'Se perdre' = to get lost: 'Je me suis perdu dans la forêt.'",
  },
  {
    french: "rester",
    pronunciation: "ʁɛs.te",
    english: "to stay / to remain",
    partOfSpeech: "verb",
    example: {
      french: "Est-ce que tu restes pour dîner ?",
      english: "Are you staying for dinner?",
    },
    explanation: "Regular -er verb. Conjugated with 'être' in compound tenses: 'Il est resté chez lui.' 'Il reste du pain' = there is bread left.",
  },
  {
    french: "rentrer",
    pronunciation: "ʁɑ̃.tʁe",
    english: "to return home / to go back",
    partOfSpeech: "verb",
    example: {
      french: "On rentre à quelle heure ce soir ?",
      english: "What time are we heading home tonight?",
    },
    explanation: "Regular -er verb. More specific than 'retourner': implies returning to one's base (home, office). Conjugated with 'être' in compound tenses.",
  },
  {
    french: "sortir",
    pronunciation: "sɔʁ.tiʁ",
    english: "to go out",
    partOfSpeech: "verb",
    example: {
      french: "On sort ce soir ? Il y a une fête chez Marie.",
      english: "Are we going out tonight? There's a party at Marie's.",
    },
    explanation: "Irregular -ir verb. 'Sortir avec quelqu'un' = to date someone. Conjugated with 'être': 'Je suis sorti(e) hier soir.'",
  },
  {
    french: "décider",
    pronunciation: "de.si.de",
    english: "to decide",
    partOfSpeech: "verb",
    example: {
      french: "Nous avons décidé de partir en vacances en août.",
      english: "We decided to go on holiday in August.",
    },
    explanation: "Regular -er verb. 'Décider de' + infinitive = to decide to do. 'Se décider' = to make up one's mind.",
  },
  {
    french: "essayer",
    pronunciation: "ɛ.sɛ.je",
    english: "to try",
    partOfSpeech: "verb",
    example: {
      french: "Essaie de dormir un peu, tu as l'air fatigué.",
      english: "Try to get some sleep, you look tired.",
    },
    explanation: "Regular -er verb (spelling: essai → essayer). 'Essayer de' + infinitive = to try to do. Also means 'to try on' clothing.",
  },
  {
    french: "connaître",
    pronunciation: "kɔ.nɛtʁ",
    english: "to know (a person or place)",
    partOfSpeech: "verb",
    example: {
      french: "Tu connais un bon restaurant par ici ?",
      english: "Do you know a good restaurant around here?",
    },
    explanation: "Irregular verb. Use for people and places, not facts. Contrast: 'Je connais Paris' (I know Paris) vs 'Je sais où c'est' (I know where it is).",
  },
  {
    french: "appeler",
    pronunciation: "a.p(ə).le",
    english: "to call",
    partOfSpeech: "verb",
    example: {
      french: "Je t'appelle dès que j'arrive.",
      english: "I'll call you as soon as I arrive.",
    },
    explanation: "Regular -er verb with doubled 'l' before a silent 'e': j'appelle, tu appelles. 'S'appeler' = to be named: 'Je m'appelle Léa.'",
  },
  {
    french: "demander",
    pronunciation: "də.mɑ̃.de",
    english: "to ask",
    partOfSpeech: "verb",
    example: {
      french: "Elle m'a demandé l'heure.",
      english: "She asked me for the time.",
    },
    explanation: "Regular -er verb. 'Demander quelque chose à quelqu'un' = to ask someone for something. 'Se demander' = to wonder.",
  },
  {
    french: "répondre",
    pronunciation: "ʁe.pɔ̃dʁ",
    english: "to answer / to reply",
    partOfSpeech: "verb",
    example: {
      french: "Il n'a pas répondu à mon message.",
      english: "He didn't reply to my message.",
    },
    explanation: "Regular -re verb. 'Répondre à' = to reply to. Different from 'répondre de' which means to be responsible for.",
  },
  {
    french: "changer",
    pronunciation: "ʃɑ̃.ʒe",
    english: "to change",
    partOfSpeech: "verb",
    example: {
      french: "Tu devrais changer de coiffure.",
      english: "You should change your hairstyle.",
    },
    explanation: "Regular -er verb (soft 'g': nous changeons). 'Changer de' + noun = to switch/change something. 'Ça change tout' = that changes everything.",
  },
  {
    french: "sentir",
    pronunciation: "sɑ̃.tiʁ",
    english: "to feel / to smell",
    partOfSpeech: "verb",
    example: {
      french: "Ça sent bon ici, qu'est-ce que tu cuisines ?",
      english: "It smells good in here, what are you cooking?",
    },
    explanation: "Irregular -ir verb. 'Sentir' can mean to smell (a scent) or to feel physically. 'Se sentir bien/mal' = to feel well/unwell.",
  },
  {
    french: "vivre",
    pronunciation: "vivʁ",
    english: "to live",
    partOfSpeech: "verb",
    example: {
      french: "Il vit à Lyon depuis cinq ans.",
      english: "He has been living in Lyon for five years.",
    },
    explanation: "Irregular verb. Different from 'habiter' (to reside): 'vivre' carries a broader sense of living one's life. 'Vive la France!' = Long live France!",
  },
  {
    french: "permettre",
    pronunciation: "pɛʁ.mɛtʁ",
    english: "to allow / to permit",
    partOfSpeech: "verb",
    example: {
      french: "Est-ce que vous permettez que j'ouvre la fenêtre ?",
      english: "Do you allow me to open the window?",
    },
    explanation: "Irregular verb (same pattern as 'mettre'). 'Permettre à quelqu'un de faire' = to allow someone to do. 'Permettez-moi' = allow me (formal).",
  },

  // Nouns
  {
    french: "problème",
    pronunciation: "pʁɔ.blɛm",
    english: "problem",
    partOfSpeech: "noun (m)",
    example: {
      french: "Il n'y a pas de problème, je m'en occupe.",
      english: "No problem, I'll take care of it.",
    },
    explanation: "Masculine noun. 'Pas de problème' = no problem. 'Avoir un problème avec' = to have an issue with. Watch out: the accent on 'è' is important.",
  },
  {
    french: "question",
    pronunciation: "kɛs.tjɔ̃",
    english: "question",
    partOfSpeech: "noun (f)",
    example: {
      french: "J'ai une question à vous poser.",
      english: "I have a question to ask you.",
    },
    explanation: "Feminine noun. 'Poser une question' = to ask a question. 'Hors de question' = out of the question. 'En question' = in question/at issue.",
  },
  {
    french: "raison",
    pronunciation: "ʁɛ.zɔ̃",
    english: "reason",
    partOfSpeech: "noun (f)",
    example: {
      french: "Tu as raison, on devrait partir plus tôt.",
      english: "You're right, we should leave earlier.",
    },
    explanation: "Feminine noun. 'Avoir raison' = to be right. 'Avoir tort' = to be wrong. 'Pour quelle raison' = for what reason.",
  },
  {
    french: "fois",
    pronunciation: "fwa",
    english: "time (occurrence)",
    partOfSpeech: "noun (f)",
    example: {
      french: "Je t'ai appelé trois fois ce matin.",
      english: "I called you three times this morning.",
    },
    explanation: "Feminine noun. Use 'fois' for counted occurrences. Compare: 'une fois' = once, 'à la fois' = at the same time, 'parfois' = sometimes.",
  },
  {
    french: "vie",
    pronunciation: "vi",
    english: "life",
    partOfSpeech: "noun (f)",
    example: {
      french: "La vie à Paris est chère mais animée.",
      english: "Life in Paris is expensive but lively.",
    },
    explanation: "Feminine noun. Very high frequency word. 'C'est la vie' = that's life. 'Qualité de vie' = quality of life. 'En vie' = alive.",
  },
  {
    french: "monde",
    pronunciation: "mɔ̃d",
    english: "world / people",
    partOfSpeech: "noun (m)",
    example: {
      french: "Il y a beaucoup de monde au marché ce matin.",
      english: "There are a lot of people at the market this morning.",
    },
    explanation: "Masculine noun. 'Le monde entier' = the entire world. 'Tout le monde' = everyone. 'Il y a du monde' = it's crowded.",
  },
  {
    french: "gens",
    pronunciation: "ʒɑ̃",
    english: "people",
    partOfSpeech: "noun (m, plural)",
    example: {
      french: "Les gens ici sont très accueillants.",
      english: "The people here are very welcoming.",
    },
    explanation: "Always plural, usually masculine. 'Les jeunes gens' = young people. Unlike 'personnes', 'gens' is less formal and refers to people in general.",
  },
  {
    french: "travail",
    pronunciation: "tʁa.vaj",
    english: "work / job",
    partOfSpeech: "noun (m)",
    example: {
      french: "Je cherche du travail depuis deux mois.",
      english: "I've been looking for work for two months.",
    },
    explanation: "Masculine noun. Irregular plural: 'travaux' (works, construction). 'Au travail!' = get to work! 'Sans travail' = unemployed.",
  },
  {
    french: "voiture",
    pronunciation: "vwa.tyʁ",
    english: "car",
    partOfSpeech: "noun (f)",
    example: {
      french: "Ma voiture est en panne, je dois prendre le bus.",
      english: "My car has broken down, I have to take the bus.",
    },
    explanation: "Feminine noun. 'En voiture' = by car. 'Voiture de location' = rental car. More standard than 'auto' in everyday speech.",
  },
  {
    french: "rue",
    pronunciation: "ʁy",
    english: "street",
    partOfSpeech: "noun (f)",
    example: {
      french: "La boulangerie est dans la rue suivante.",
      english: "The bakery is on the next street.",
    },
    explanation: "Feminine noun. 'Rue' is a named street in a town. 'Dans la rue' = in the street. Compare 'route' (road, often outside a town) and 'avenue'.",
  },
  {
    french: "heure",
    pronunciation: "œʁ",
    english: "hour / time of day",
    partOfSpeech: "noun (f)",
    example: {
      french: "Il est quelle heure ? — Il est dix-huit heures.",
      english: "What time is it? — It is six o'clock.",
    },
    explanation: "Feminine noun. 'Quelle heure est-il ?' = What time is it? 'À l'heure' = on time. 'Tout à l'heure' = in a moment / a moment ago.",
  },
  {
    french: "semaine",
    pronunciation: "sə.mɛn",
    english: "week",
    partOfSpeech: "noun (f)",
    example: {
      french: "On se revoit la semaine prochaine ?",
      english: "Shall we meet again next week?",
    },
    explanation: "Feminine noun. 'Cette semaine' = this week. 'Semaine de travail' = work week. 'En semaine' = on weekdays.",
  },
  {
    french: "repas",
    pronunciation: "ʁə.pa",
    english: "meal",
    partOfSpeech: "noun (m)",
    example: {
      french: "Le repas du soir est servi à sept heures.",
      english: "The evening meal is served at seven o'clock.",
    },
    explanation: "Masculine noun. Singular and plural are identical ('un repas', 'des repas'). 'Prendre un repas' = to have a meal. 'Sauter un repas' = to skip a meal.",
  },
  {
    french: "santé",
    pronunciation: "sɑ̃.te",
    english: "health",
    partOfSpeech: "noun (f)",
    example: {
      french: "Il faut prendre soin de sa santé.",
      english: "You need to take care of your health.",
    },
    explanation: "Feminine noun. 'Santé !' = Cheers! (when drinking). 'En bonne santé' = in good health. 'Problème de santé' = health problem.",
  },
  {
    french: "médecin",
    pronunciation: "med.sɛ̃",
    english: "doctor",
    partOfSpeech: "noun (m/f)",
    example: {
      french: "Je dois aller chez le médecin, j'ai de la fièvre.",
      english: "I need to go to the doctor, I have a fever.",
    },
    explanation: "Traditionally masculine but now used for all genders. 'Aller chez le médecin' = to go to the doctor. Also called 'docteur' informally.",
  },
  {
    french: "endroit",
    pronunciation: "ɑ̃.dʁwa",
    english: "place / spot",
    partOfSpeech: "noun (m)",
    example: {
      french: "C'est l'endroit idéal pour pique-niquer.",
      english: "It's the ideal spot for a picnic.",
    },
    explanation: "Masculine noun. More specific than 'lieu'. 'Au bon endroit' = in the right place. 'À l'endroit' also means the right side up (of fabric).",
  },
  {
    french: "façon",
    pronunciation: "fa.sɔ̃",
    english: "way / manner",
    partOfSpeech: "noun (f)",
    example: {
      french: "J'aime la façon dont il parle aux gens.",
      english: "I like the way he talks to people.",
    },
    explanation: "Feminine noun. 'De toute façon' = anyway/in any case (very common phrase). 'D'une certaine façon' = in a way. 'De cette façon' = in this way.",
  },
  {
    french: "bruit",
    pronunciation: "bʁɥi",
    english: "noise / sound",
    partOfSpeech: "noun (m)",
    example: {
      french: "Quel est ce bruit ? On dirait que quelqu'un frappe à la porte.",
      english: "What is that noise? It sounds like someone is knocking at the door.",
    },
    explanation: "Masculine noun. 'Faire du bruit' = to make noise. 'Sans bruit' = silently. Different from 'son' which is a more neutral/acoustic term for sound.",
  },
  {
    french: "chemin",
    pronunciation: "ʃə.mɛ̃",
    english: "path / way",
    partOfSpeech: "noun (m)",
    example: {
      french: "Quel est le meilleur chemin pour aller à la gare ?",
      english: "What is the best way to get to the station?",
    },
    explanation: "Masculine noun. Used both literally (a path through the woods) and figuratively (the path to success). 'En chemin' = on the way.",
  },
  {
    french: "réponse",
    pronunciation: "ʁe.pɔ̃s",
    english: "answer / reply",
    partOfSpeech: "noun (f)",
    example: {
      french: "Il n'a pas donné de réponse à ma question.",
      english: "He didn't give an answer to my question.",
    },
    explanation: "Feminine noun. 'En réponse à' = in response to. 'Trouver une réponse' = to find an answer. Verb form: 'répondre' (to answer).",
  },

  // Adjectives
  {
    french: "même",
    pronunciation: "mɛm",
    english: "same / even",
    partOfSpeech: "adjective / adverb",
    example: {
      french: "On a le même professeur cette année.",
      english: "We have the same teacher this year.",
    },
    explanation: "As an adjective before the noun = same. After a noun/pronoun = itself: 'moi-même' = myself. As an adverb = even: 'même lui le sait' = even he knows it.",
  },
  {
    french: "seul / seule",
    pronunciation: "sœl",
    english: "alone / only",
    partOfSpeech: "adjective",
    example: {
      french: "Elle préfère travailler seule.",
      english: "She prefers to work alone.",
    },
    explanation: "Before the noun = only: 'le seul problème' = the only problem. After the noun/verb = alone/lonely: 'il se sent seul' = he feels lonely.",
  },
  {
    french: "prochain / prochaine",
    pronunciation: "pʁɔ.ʃɛ̃ / pʁɔ.ʃɛn",
    english: "next",
    partOfSpeech: "adjective",
    example: {
      french: "On prend le prochain train ou on attend ?",
      english: "Do we take the next train or do we wait?",
    },
    explanation: "With time expressions: before the noun = next in sequence ('le prochain bus'). After the noun for calendar time: 'lundi prochain' = next Monday.",
  },
  {
    french: "dernier / dernière",
    pronunciation: "dɛʁ.nje / dɛʁ.njɛʁ",
    english: "last",
    partOfSpeech: "adjective",
    example: {
      french: "C'est la dernière fois que je fais ça.",
      english: "This is the last time I do that.",
    },
    explanation: "Before the noun = last in a sequence ('le dernier mot'). After a time noun it means 'most recent': 'la semaine dernière' = last week.",
  },
  {
    french: "chaque",
    pronunciation: "ʃak",
    english: "each / every",
    partOfSpeech: "adjective",
    example: {
      french: "Je prends un café chaque matin avant de partir.",
      english: "I have a coffee every morning before leaving.",
    },
    explanation: "Always singular, always before a noun. 'Chaque fois que' = every time that. Do not confuse with 'chacun / chacune' (each one — a pronoun).",
  },
  {
    french: "nouveau / nouvelle",
    pronunciation: "nu.vo / nu.vɛl",
    english: "new",
    partOfSpeech: "adjective",
    example: {
      french: "J'ai un nouveau travail depuis le mois dernier.",
      english: "I have a new job since last month.",
    },
    explanation: "Masculine 'nouveau' becomes 'nouvel' before a vowel: 'un nouvel appartement'. 'De nouveau' = again. 'Nouvelle' is also a short story or piece of news.",
  },
  {
    french: "fort / forte",
    pronunciation: "fɔʁ / fɔʁt",
    english: "strong / loud",
    partOfSpeech: "adjective / adverb",
    example: {
      french: "Ne parle pas si fort, le bébé dort.",
      english: "Don't speak so loudly, the baby is sleeping.",
    },
    explanation: "As an adjective = strong or good at: 'il est fort en maths'. As an adverb = loudly or hard: 'frapper fort'. 'Se faire fort de' = to claim to be able to.",
  },
  {
    french: "libre",
    pronunciation: "libʁ",
    english: "free / available",
    partOfSpeech: "adjective",
    example: {
      french: "Tu es libre ce soir pour dîner ensemble ?",
      english: "Are you free tonight to have dinner together?",
    },
    explanation: "Means 'free' in the sense of available or at liberty — not free of charge (that's 'gratuit'). 'Temps libre' = free time. 'Entrée libre' = free entry.",
  },
  {
    french: "propre",
    pronunciation: "pʁɔpʁ",
    english: "clean / own",
    partOfSpeech: "adjective",
    example: {
      french: "Ma chambre est propre, j'ai tout rangé.",
      english: "My room is clean, I've tidied everything away.",
    },
    explanation: "Before the noun = own: 'mes propres mots' = my own words. After the noun = clean: 'une assiette propre' = a clean plate. Opposite of 'sale' (dirty).",
  },

  // Adverbs / Common expressions
  {
    french: "peut-être",
    pronunciation: "pø.tɛtʁ",
    english: "maybe / perhaps",
    partOfSpeech: "adverb",
    example: {
      french: "Il viendra peut-être, mais ce n'est pas sûr.",
      english: "He might come, but it's not certain.",
    },
    explanation: "Very common in spoken French. When it starts a sentence, inversion is used: 'Peut-être viendra-t-il.' Softer than 'probablement' (probably).",
  },
  {
    french: "d'accord",
    pronunciation: "da.kɔʁ",
    english: "okay / agreed",
    partOfSpeech: "exclamation / adjective",
    example: {
      french: "On se retrouve à midi ? — D'accord, pas de problème.",
      english: "Shall we meet at noon? — Okay, no problem.",
    },
    explanation: "One of the most useful French expressions. 'Être d'accord avec' = to agree with. 'Se mettre d'accord' = to come to an agreement.",
  },
  {
    french: "en fait",
    pronunciation: "ɑ̃ fɛ",
    english: "actually / in fact",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "En fait, je ne suis pas sûr de pouvoir venir.",
      english: "Actually, I'm not sure I can come.",
    },
    explanation: "Used to correct a misconception or clarify. Very common in spoken French. Similar to 'en réalité'. Don't confuse with 'en effet' (indeed), which confirms.",
  },
  {
    french: "surtout",
    pronunciation: "syʁ.tu",
    english: "above all / especially",
    partOfSpeech: "adverb",
    example: {
      french: "J'aime les légumes, surtout les courgettes.",
      english: "I like vegetables, especially courgettes.",
    },
    explanation: "Also used to give strong emphasis to a command: 'Surtout ne dis rien !' = Above all, don't say anything! Very frequent in both spoken and written French.",
  },
  {
    french: "quand même",
    pronunciation: "kɑ̃ mɛm",
    english: "still / all the same / anyway",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "Il pleut, mais on va quand même se promener.",
      english: "It's raining, but we're going for a walk anyway.",
    },
    explanation: "Extremely common in spoken French. Expresses persistence despite an obstacle. Can also express mild indignation: 'Quand même !' = Come on! / Really!",
  },
  {
    french: "par contre",
    pronunciation: "paʁ kɔ̃tʁ",
    english: "on the other hand / however",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "Le loyer est cher. Par contre, l'appartement est très grand.",
      english: "The rent is expensive. However, the apartment is very large.",
    },
    explanation: "Used to introduce a contrasting point, very common in spoken French. More informal than 'en revanche' (which is preferred in formal writing).",
  },
  {
    french: "tout à fait",
    pronunciation: "tu.ta.fɛ",
    english: "absolutely / quite / exactly",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "C'est tout à fait normal de se sentir ainsi.",
      english: "It's absolutely normal to feel that way.",
    },
    explanation: "Used to agree strongly ('Tout à fait !') or to mean 'completely': 'Je suis tout à fait d'accord' = I completely agree. Very common in formal and everyday speech.",
  },
];

export const vocabulary: VocabWord[] = seedVocabulary.map((seed, index) => ({
  ...withPatches(seed),
  id: index + 1,
}));

export function getRandomChoices(correct: VocabWord, all: VocabWord[]): string[] {
  const others = all.filter((w) => w.id !== correct.id);
  const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
  const choices = [...shuffled.map((w) => w.english), correct.english];
  return choices.sort(() => Math.random() - 0.5);
}
