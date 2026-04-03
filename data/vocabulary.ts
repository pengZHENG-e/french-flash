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

  // ── Intermediate–advanced (very common in daily life) ─────────────────
  {
    french: "rendez-vous",
    pronunciation: "ʁɑ̃.de.vu",
    english: "appointment / meeting / date",
    partOfSpeech: "noun (m)",
    example: {
      french: "J'ai un rendez-vous chez le dentiste à quatorze heures.",
      english: "I have a dentist's appointment at two p.m.",
    },
    explanation: "Masculine noun. Covers medical visits, business meetings, and romantic dates. 'Prendre rendez-vous' = to book an appointment.",
  },
  {
    french: "retard",
    pronunciation: "ʁə.taʁ",
    english: "delay / lateness",
    partOfSpeech: "noun (m)",
    example: {
      french: "Le train a vingt minutes de retard à cause de la neige.",
      english: "The train is twenty minutes late because of the snow.",
    },
    explanation: "'Être en retard' = to be late. 'Sans retard' = without delay. Not the same word as English 'retired' (retraité).",
  },
  {
    french: "oublier",
    pronunciation: "u.bli.je",
    english: "to forget",
    partOfSpeech: "verb",
    example: {
      french: "J'ai oublié d'éteindre la lumière en partant.",
      english: "I forgot to turn the light off when I left.",
    },
    explanation: "Regular -er verb. 'Oublier de + infinitive' = to forget to do something. 'Ne pas oublier que' = don't forget that.",
  },
  {
    french: "manquer",
    pronunciation: "mɑ̃.ke",
    english: "to miss (a person); to lack; to almost",
    partOfSpeech: "verb",
    example: {
      french: "Quand tu es parti à l'étranger, tu nous as beaucoup manqué.",
      english: "When you went abroad, we missed you a lot.",
    },
    explanation: "The person missed is the subject: 'tu me manques' = I miss you (literally 'you are lacking to me'). For missing a bus or a shot, use 'rater'.",
  },
  {
    french: "rater",
    pronunciation: "ʁa.te",
    english: "to miss (a train, chance); to fail (a test)",
    partOfSpeech: "verb",
    example: {
      french: "Si on ne se dépêche pas, on va rater le dernier métro.",
      english: "If we don't hurry, we'll miss the last metro.",
    },
    explanation: "Regular -er verb. Objects and events are direct objects: 'rater un examen' = to fail an exam. Contrast with 'manquer' for missing people.",
  },
  {
    french: "s'inquiéter",
    pronunciation: "sɛ̃.kje.te",
    english: "to worry",
    partOfSpeech: "verb (reflexive)",
    example: {
      french: "Ne t'inquiète pas, tout va bien se passer.",
      english: "Don't worry, everything will be fine.",
    },
    explanation: "Always reflexive: 's'inquiéter pour / de' = to worry about. 'Inquiet / inquiète' = worried. Not the same as 'se soucier' (more formal).",
  },
  {
    french: "déranger",
    pronunciation: "de.ʁɑ̃.ʒe",
    english: "to disturb / to bother",
    partOfSpeech: "verb",
    example: {
      french: "Est-ce que je vous dérange si j'ouvre la fenêtre ?",
      english: "Would I disturb you if I opened the window?",
    },
    explanation: "Polite formula in shops and offices: 'Je ne veux pas vous déranger'. 'Désolé de vous déranger' = sorry to bother you.",
  },
  {
    french: "emprunter",
    pronunciation: "ɑ̃.pʁœ̃.te",
    english: "to borrow",
    partOfSpeech: "verb",
    example: {
      french: "Est-ce que je peux t'emprunter ton chargeur ? Mon téléphone est presque vide.",
      english: "Can I borrow your charger? My phone is almost dead.",
    },
    explanation: "'Emprunter quelque chose à quelqu'un' = to borrow something from someone. Pair verb: 'prêter' (to lend). The borrower is the subject, never the person who gives.",
  },
  {
    french: "prêter",
    pronunciation: "pʁe.te",
    english: "to lend",
    partOfSpeech: "verb",
    example: {
      french: "Je te prête mon parapluie, il pleut à verse.",
      english: "I'll lend you my umbrella, it's pouring.",
    },
    explanation: "Regular -er verb. 'Prêter attention à' = to pay attention to. Past participle 'prêt' also means 'ready'.",
  },
  {
    french: "rappeler",
    pronunciation: "ʁa.ple",
    english: "to remind; to call back",
    partOfSpeech: "verb",
    example: {
      french: "Rappelle-moi d'acheter du lait en rentrant, s'il te plaît.",
      english: "Remind me to buy milk on the way home, please.",
    },
    explanation: "'Rappeler quelque chose à quelqu'un' = to remind someone of something. 'Rappeler quelqu'un' = to call someone back. Note doubling in 'je rappelle'.",
  },
  {
    french: "prévoir",
    pronunciation: "pʁe.vwaʁ",
    english: "to plan for; to foresee",
    partOfSpeech: "verb",
    example: {
      french: "On avait prévu de partir tôt, mais on s'est levés tard.",
      english: "We had planned to leave early, but we got up late.",
    },
    explanation: "Often used with 'que' or an infinitive: weather forecasts are 'la météo prévoit du soleil'. Related noun: 'prévision'.",
  },
  {
    french: "boulot",
    pronunciation: "bu.lo",
    english: "job / work (informal)",
    partOfSpeech: "noun (m)",
    example: {
      french: "Après une dure journée de boulot, j'ai juste envie de me reposer.",
      english: "After a hard day at work, I just want to rest.",
    },
    explanation: "Very common colloquial synonym of 'travail'. 'Aller au boulot' = to go to work. Use 'travail' or 'emploi' in formal writing instead.",
  },
  {
    french: "dépenser",
    pronunciation: "de.pɑ̃.se",
    english: "to spend (money)",
    partOfSpeech: "verb",
    example: {
      french: "On a trop dépensé ce mois-ci, il faudra faire attention.",
      english: "We spent too much this month; we'll have to be careful.",
    },
    explanation: "'Dépenser de l'argent pour / en' = to spend money on. Noun: 'dépense' (expense). Do not use for spending time — use 'passer du temps'.",
  },
  {
    french: "embaucher",
    pronunciation: "ɑ̃.bo.ʃe",
    english: "to hire (an employee)",
    partOfSpeech: "verb",
    example: {
      french: "L'entreprise embauche trois développeurs ce trimestre.",
      english: "The company is hiring three developers this quarter.",
    },
    explanation: "Opposite of 'licencier' (to lay off). 'Être embauché' = to be hired. Common in news and workplace conversation.",
  },
  {
    french: "se dépêcher",
    pronunciation: "sə de.pe.ʃe",
    english: "to hurry",
    partOfSpeech: "verb (reflexive)",
    example: {
      french: "Dépêche-toi, le film commence dans cinq minutes !",
      english: "Hurry up, the film starts in five minutes!",
    },
    explanation: "'Se dépêcher de + infinitive' = to hurry to do something. Imperative very common: 'Dépêche-toi !' / 'Dépêchons-nous !'",
  },
  {
    french: "s'occuper (de)",
    pronunciation: "sɔ.ky.pe",
    english: "to take care of; to deal with",
    partOfSpeech: "verb (reflexive)",
    example: {
      french: "Je m'occupe des courses si tu prépares le dîner.",
      english: "I'll take care of the shopping if you make dinner.",
    },
    explanation: "'S'occuper de' + person or task. 'Ça s'occupe tout seul' = it takes care of itself. Noun: 'occupation' / 'occupé' (busy).",
  },
  {
    french: "s'habituer (à)",
    pronunciation: "sa.bi.tɥe",
    english: "to get used to",
    partOfSpeech: "verb (reflexive)",
    example: {
      french: "Au début le bruit me gênait, mais je m'y suis habitué.",
      english: "At first the noise bothered me, but I got used to it.",
    },
    explanation: "Always with 'à': 's'habituer à la chaleur'. Related: 'habitude' (habit), 'd'habitude' (usually).",
  },
  {
    french: "habitude",
    pronunciation: "a.bi.tyd",
    english: "habit / custom",
    partOfSpeech: "noun (f)",
    example: {
      french: "Comme d'habitude, elle prend son café sans sucre.",
      english: "As usual, she takes her coffee without sugar.",
    },
    explanation: "'D'habitude' = usually. 'Avoir l'habitude de' = to be used to / in the habit of. 'Pas dans mes habitudes' = not something I usually do.",
  },
  {
    french: "se tromper",
    pronunciation: "sə tʁɔ̃.pe",
    english: "to be wrong; to make a mistake",
    partOfSpeech: "verb (reflexive)",
    example: {
      french: "Excusez-moi, je me suis trompé de numéro.",
      english: "Sorry, I dialled the wrong number.",
    },
    explanation: "'Se tromper de' + thing = to get the wrong one. 'Tu te trompes' = you're mistaken. Noun: 'une erreur' / 'se tromper de porte'.",
  },
  {
    french: "sembler",
    pronunciation: "sɑ̃.ble",
    english: "to seem",
    partOfSpeech: "verb",
    example: {
      french: "Ça semble une bonne idée, mais il faut vérifier les prix.",
      english: "It seems like a good idea, but we need to check the prices.",
    },
    explanation: "Impersonal 'il semble que' + often subjunctive. 'Sembler + adjective': 'tu sembles fatigué'. Close to 'avoir l'air'.",
  },
  {
    french: "plutôt",
    pronunciation: "ply.to",
    english: "rather; instead",
    partOfSpeech: "adverb",
    example: {
      french: "Je ne suis pas fâché, je suis plutôt déçu.",
      english: "I'm not angry — I'm disappointed, rather.",
    },
    explanation: "Softens or corrects: 'plutôt cool' = pretty cool. 'Ou plutôt' = or rather. Frequent in conversation for nuance.",
  },
  {
    french: "ailleurs",
    pronunciation: "a.jœʁ",
    english: "elsewhere",
    partOfSpeech: "adverb",
    example: {
      french: "Ce modèle n'est plus en stock ici, essayez ailleurs.",
      english: "This model is no longer in stock here; try elsewhere.",
    },
    explanation: "'D'ailleurs' = by the way / besides (very common). 'Partir ailleurs' = to go somewhere else. Not to be confused with 'hier' (yesterday).",
  },
  {
    french: "sinon",
    pronunciation: "si.nɔ̃",
    english: "otherwise; or else; if not",
    partOfSpeech: "conjunction / adverb",
    example: {
      french: "Mets ton manteau, sinon tu vas attraper froid.",
      english: "Put your coat on, otherwise you'll catch a cold.",
    },
    explanation: "Threat or consequence: 'sinon j'appelle la police'. Also 'autrement' in similar sense. Can introduce an alternative: 'du thé, sinon du café ?'",
  },
  {
    french: "pourtant",
    pronunciation: "puʁ.tɑ̃",
    english: "yet; however",
    partOfSpeech: "adverb",
    example: {
      french: "Il fait froid dehors ; pourtant, elle est sortie sans manteau.",
      english: "It's cold outside; yet she went out without a coat.",
    },
    explanation: "Marks contrast like English 'yet' or 'still': expectation vs reality. Different from 'par contre' (adds a new contrasting point).",
  },
  {
    french: "effectivement",
    pronunciation: "ef.ek.tiv.mɑ̃",
    english: "indeed; that's right (confirmation)",
    partOfSpeech: "adverb",
    example: {
      french: "— Tu as réservé une table ? — Oui, effectivement, pour huit personnes.",
      english: "— Did you book a table? — Yes, indeed, for eight people.",
    },
    explanation: "Confirms what was said or suspected — unlike 'en fait', which often corrects. Common in professional and everyday French.",
  },

  // ── More daily intermediate+ (frequency & nuance) ───────────────────────
  {
    french: "du coup",
    pronunciation: "dy ku",
    english: "so / as a result (spoken)",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "Il a plu toute la journée ; du coup, on est restés sur le canapé.",
      english: "It rained all day, so we stayed on the sofa.",
    },
    explanation: "Extremely common in spoken French to give a consequence. More informal than 'donc'. Can sound vague if overused, but native speech is full of it.",
  },
  {
    french: "bref",
    pronunciation: "bʁɛf",
    english: "in short; anyway (wrapping up)",
    partOfSpeech: "adverb / adjective",
    example: {
      french: "Bref, l'essentiel est qu'on soit d'accord sur les dates.",
      english: "In short, what matters is that we agree on the dates.",
    },
    explanation: "Cuts a long story short ('bref' = brief). Also an adjective: 'un message bref'. 'Pour faire bref' = to make a long story short.",
  },
  {
    french: "enfin",
    pronunciation: "ɑ̃.fɛ̃",
    english: "finally; well / I mean (filler)",
    partOfSpeech: "adverb",
    example: {
      french: "Enfin, on peut souffler : tout le monde est arrivé sain et sauf.",
      english: "At last we can breathe — everyone arrived safe and sound.",
    },
    explanation: "Relief after waiting ('finally'). As a filler it expresses hesitation or correction: 'Enfin, je voulais dire…' = 'Well, I meant…'. Tone depends on context.",
  },
  {
    french: "déjà",
    pronunciation: "de.ʒa",
    english: "already; yet (in questions)",
    partOfSpeech: "adverb",
    example: {
      french: "Tu as déjà vu ce film ? Moi, je l'ai déjà vu deux fois.",
      english: "Have you seen this film yet? I've already seen it twice.",
    },
    explanation: "Placement: often after the conjugated verb. 'Pas encore' = not yet. 'Déjà ?' can express surprise: 'Already?'",
  },
  {
    french: "encore",
    pronunciation: "ɑ̃.kɔʁ",
    english: "still; again; more",
    partOfSpeech: "adverb",
    example: {
      french: "Il est minuit et les voisins écoutent encore de la musique forte.",
      english: "It's midnight and the neighbours are still playing loud music.",
    },
    explanation: "'Encore une fois' = once again. Before an adjective it can mean 'even more': 'encore mieux'. For 'still' at midnight-type contexts, French often uses 'encore' where English might also say 'still'.",
  },
  {
    french: "vraiment",
    pronunciation: "vʁɛ.mɑ̃",
    english: "really; truly",
    partOfSpeech: "adverb",
    example: {
      french: "Ce plat est vraiment excellent, tu devrais goûter.",
      english: "This dish is really excellent — you should taste it.",
    },
    explanation: "Strengthens adjectives and verbs. 'Pas vraiment' = not really. Similar force to 'vraiment ?' = 'Really?' when reacting.",
  },
  {
    french: "toujours",
    pronunciation: "tu.ʒuʁ",
    english: "always; still (with present)",
    partOfSpeech: "adverb",
    example: {
      french: "Elle oublie toujours ses clés sur la table de la cuisine.",
      english: "She always leaves her keys on the kitchen table.",
    },
    explanation: "'Toujours pas' = still not. 'Comme toujours' = as always. For 'still doing something', 'encore' is often the natural choice; 'toujours' stresses 'every time' or 'all the time'.",
  },
  {
    french: "jamais",
    pronunciation: "ʒa.mɛ",
    english: "never; ever (in questions)",
    partOfSpeech: "adverb",
    example: {
      french: "Je n'ai jamais mis les pieds en Corse, mais j'aimerais y aller.",
      english: "I've never set foot in Corsica, but I'd like to go.",
    },
    explanation: "Needs 'ne' in standard French: 'ne… jamais'. 'Si jamais' = if ever. 'À jamais' = forever (literary).",
  },
  {
    french: "bientôt",
    pronunciation: "bjɛ̃.to",
    english: "soon",
    partOfSpeech: "adverb",
    example: {
      french: "Le printemps arrive bientôt, les jours vont s'allonger.",
      english: "Spring is coming soon; the days will get longer.",
    },
    explanation: "'À bientôt' = see you soon. 'Pas avant longtemps' is the opposite mood. Often with future or present for imminent events.",
  },
  {
    french: "récemment",
    pronunciation: "ʁe.sam.mɑ̃",
    english: "recently",
    partOfSpeech: "adverb",
    example: {
      french: "Ils ont récemment emménagé dans le quartier, dis bonjour si tu les croises.",
      english: "They recently moved into the neighbourhood — say hi if you run into them.",
    },
    explanation: "Formal-neutral time adverb; common in news and conversation. Near-synonym: 'dernièrement' (slightly more formal).",
  },
  {
    french: "s'attendre (à)",
    pronunciation: "sa.tɑ̃dʁ",
    english: "to expect",
    partOfSpeech: "verb (reflexive)",
    example: {
      french: "Je m'attendais à une hausse des prix, mais pas à ce point.",
      english: "I expected prices to go up, but not by this much.",
    },
    explanation: "Always reflexive. 'S'attendre à ce que' + subjunctive for a clause. Different from simple future expectation with 'penser que'.",
  },
  {
    french: "réussir",
    pronunciation: "ʁe.y.siʁ",
    english: "to succeed; to pass (a test)",
    partOfSpeech: "verb",
    example: {
      french: "Après des mois de révision, elle a réussi son examen du premier coup.",
      english: "After months of revising, she passed her exam first time.",
    },
    explanation: "'Réussir à + infinitive' = to manage to. 'Réussite' (f) = success. Opposite common verb: 'échouer'.",
  },
  {
    french: "échouer",
    pronunciation: "e.ʃwe",
    english: "to fail (an attempt, exam)",
    partOfSpeech: "verb",
    example: {
      french: "Malgré ses efforts, il a échoué au concours d'entrée.",
      english: "Despite his efforts, he failed the entrance competition.",
    },
    explanation: "'Échouer à' + noun/exam. Also used for plans: 'les négociations ont échoué'. Ship sense 'run aground' exists but is rarer in daily chat.",
  },
  {
    french: "éviter",
    pronunciation: "e.vi.te",
    english: "to avoid",
    partOfSpeech: "verb",
    example: {
      french: "Pour éviter les files, viens avant l'heure de pointe.",
      english: "To avoid the queues, come before rush hour.",
    },
    explanation: "'Éviter de + infinitive' or + direct object. 'Inévitable' = unavoidable. Regular -er verb.",
  },
  {
    french: "annuler",
    pronunciation: "a.nyle",
    english: "to cancel",
    partOfSpeech: "verb",
    example: {
      french: "La compagnie aérienne a annulé notre vol sans prévenir.",
      english: "The airline cancelled our flight without warning.",
    },
    explanation: "Noun: 'une annulation'. Common for appointments, subscriptions, orders. 'Annulé' often appears on signs and apps.",
  },
  {
    french: "confirmer",
    pronunciation: "kɔ̃.fiʁ.me",
    english: "to confirm",
    partOfSpeech: "verb",
    example: {
      french: "Merci de confirmer votre présence avant vendredi midi.",
      english: "Please confirm your attendance before Friday noon.",
    },
    explanation: "Emails and bookings: 'confirmer une réservation'. Pair with 'effectivement' when agreeing something is true.",
  },
  {
    french: "expliquer",
    pronunciation: "ɛks.pli.ke",
    english: "to explain",
    partOfSpeech: "verb",
    example: {
      french: "Le médecin m'a expliqué calmement les résultats des analyses.",
      english: "The doctor calmly explained the test results to me.",
    },
    explanation: "'Expliquer quelque chose à quelqu'un'. Noun: 'une explication'. Not 'expliquer à propos de' — use 'expliquer que' or a direct object.",
  },
  {
    french: "partager",
    pronunciation: "paʁ.ta.ʒe",
    english: "to share",
    partOfSpeech: "verb",
    example: {
      french: "On partage une pizza ou chacun prend son plat ?",
      english: "Shall we share a pizza or does everyone order their own dish?",
    },
    explanation: "Food, costs, news: 'partager sur les réseaux' = to share on social media. Noun: 'un partage'.",
  },
  {
    french: "gérer",
    pronunciation: "ʒe.ʁe",
    english: "to manage; to handle (a situation)",
    partOfSpeech: "verb",
    example: {
      french: "Entre le boulot et les enfants, elle gère vraiment beaucoup de choses.",
      english: "Between work and the kids, she really juggles a lot.",
    },
    explanation: "Colloquial praise: 'Tu gères !' = You're handling it well / Nice one. Noun: 'la gestion'. From same root as English 'manage' (Latin).",
  },
  {
    french: "louer",
    pronunciation: "lwe",
    english: "to rent (a home, car); to praise",
    partOfSpeech: "verb",
    example: {
      french: "Ils louent un trois-pièces en banlieue depuis l'année dernière.",
      english: "They've been renting a three-room flat in the suburbs since last year.",
    },
    explanation: "Most daily use = pay to use property/vehicle ('louer un logement'). Other sense: 'louer quelqu'un' = to praise someone — context disambiguates.",
  },
  {
    french: "file",
    pronunciation: "fil",
    english: "line / queue",
    partOfSpeech: "noun (f)",
    example: {
      french: "La file d'attente s'étend jusqu'au coin de la rue.",
      english: "The queue stretches to the street corner.",
    },
    explanation: "France: 'faire la queue' or 'attendre dans la file'. 'File d'attente' is the full phrase on signs. Not the English word 'file' for a document ('un fichier').",
  },
  {
    french: "embouteillage",
    pronunciation: "ɑ̃.bu.tɛ.jaʒ",
    english: "traffic jam",
    partOfSpeech: "noun (m)",
    example: {
      french: "Un énorme embouteillage sur le périphérique m'a fait rater mon train.",
      english: "A huge jam on the ring road made me miss my train.",
    },
    explanation: "'Bouchon' is a shorter colloquial synonym. Common in radio traffic ('les embouteillages du soir').",
  },
  {
    french: "pourboire",
    pronunciation: "puʁ.bwaʁ",
    english: "tip (gratuity)",
    partOfSpeech: "noun (m)",
    example: {
      french: "Le pourcentage n'était pas ajouté : on a laissé un petit pourboire.",
      english: "The percentage wasn't added on — we left a small tip.",
    },
    explanation: "Service compris is common in France; tips are less obligatory than in some countries but still usual for good service in cafés.",
  },
  {
    french: "malgré",
    pronunciation: "mal.gʁe",
    english: "despite (+ noun / pronoun)",
    partOfSpeech: "preposition",
    example: {
      french: "Malgré la pluie, le marché en plein air avait du monde.",
      english: "Despite the rain, the outdoor market was busy.",
    },
    explanation: "Before a clause in informal speech you may hear 'malgré que' + subjunctive (debated); safer written pattern is 'bien que' or 'quoique'.",
  },
  {
    french: "cependant",
    pronunciation: "sə.pɑ̃.dɑ̃",
    english: "however (neutral / written)",
    partOfSpeech: "adverb",
    example: {
      french: "Le projet est prometteur ; cependant, il dépasse notre budget actuel.",
      english: "The project is promising; however, it exceeds our current budget.",
    },
    explanation: "Similar territory to 'pourtant' and 'néanmoins'; 'cependant' is at home in emails and essays. Often set off with a semicolon or new sentence.",
  },
  {
    french: "grâce à",
    pronunciation: "gʁas a",
    english: "thanks to (positive cause)",
    partOfSpeech: "prepositional phrase",
    example: {
      french: "Grâce à ton raccourci, on a évité l'embouteillage principal.",
      english: "Thanks to your shortcut, we avoided the main traffic jam.",
    },
    explanation: "Positive or neutral cause. Contrast 'à cause de' (often negative). Both + noun or pronoun: 'grâce à lui'.",
  },
  {
    french: "à cause de",
    pronunciation: "a koz də",
    english: "because of (often negative)",
    partOfSpeech: "prepositional phrase",
    example: {
      french: "À cause du vent violent, le festival en plein air a été annulé.",
      english: "Because of the strong wind, the outdoor festival was cancelled.",
    },
    explanation: "Implies blame or unwanted consequence more often than 'grâce à'. Same structure: 'à cause d'elle' with elision before a vowel.",
  },
  {
    french: "imaginer",
    pronunciation: "i.ma.ʒi.ne",
    english: "to imagine",
    partOfSpeech: "verb",
    example: {
      french: "Imagine un monde où tout le monde parle plusieurs langues.",
      english: "Imagine a world where everyone speaks several languages.",
    },
    explanation: "'S'imaginer que' = to imagine that (sometimes falsely). 'Imaginer + infinitive' = to envisage doing something.",
  },
  {
    french: "supposer",
    pronunciation: "sy.po.ze",
    english: "to suppose; to assume",
    partOfSpeech: "verb",
    example: {
      french: "Je suppose qu'il est en réunion : il ne répond pas aux messages.",
      english: "I assume he's in a meeting — he's not answering messages.",
    },
    explanation: "Tentative belief weaker than 'être sûr'. 'Supposer que' + indicative or subjunctive depending on doubt. Noun: 'une supposition'.",
  },
  {
    french: "au lieu de",
    pronunciation: "o ljø də",
    english: "instead of",
    partOfSpeech: "prepositional phrase",
    example: {
      french: "Elle prend le vélo au lieu de la voiture pour aller au travail.",
      english: "She takes the bike instead of the car to get to work.",
    },
    explanation: "+ noun or infinitive: 'au lieu de courir'. Near-synonym: 'plutôt que'. Common in advice and comparisons.",
  },

  // ── Advanced (B2–C1): nuance, argument, formal French ───────────────────
  {
    french: "néanmoins",
    pronunciation: "ne.ɑ̃.mwɛ̃",
    english: "nevertheless (formal)",
    partOfSpeech: "adverb",
    example: {
      french: "Les résultats sont mitigés ; néanmoins, la direction valide la poursuite du projet.",
      english: "The results are mixed; nevertheless, management approves continuing the project.",
    },
    explanation: "Written and formal speech. Close to 'toutefois' and 'cependant'; 'néanmoins' often concedes a point then insists. Usually begins a clause after a semicolon or full stop.",
  },
  {
    french: "toutefois",
    pronunciation: "tu.tə.fwa",
    english: "however; yet (formal)",
    partOfSpeech: "adverb",
    example: {
      french: "Nous comprenons votre demande ; toutefois, nous ne pouvons pas y donner suite ce trimestre.",
      english: "We understand your request; however, we cannot follow up on it this quarter.",
    },
    explanation: "Typical of professional emails and journalism. Slightly softer than a blunt 'mais' at the start of a reply. Often after a semicolon.",
  },
  {
    french: "en revanche",
    pronunciation: "ɑ̃ ʁə.vɑ̃ʃ",
    english: "on the other hand (compensating contrast)",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "Le service était un peu lent ; en revanche, la qualité des plats était excellente.",
      english: "The service was a little slow; on the other hand, the quality of the dishes was excellent.",
    },
    explanation: "Introduces a positive point that balances a negative one (or the reverse). More formal than 'par contre'. Can also mean 'in return' in some financial contexts.",
  },
  {
    french: "à priori",
    pronunciation: "a pʁi.jɔ.ʁi",
    english: "as things stand; for now (tentative view)",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "À priori, la panne vient du routeur, mais le technicien doit confirmer.",
      english: "As things stand, the fault is in the router, but the technician has to confirm.",
    },
    explanation: "Signals a provisional judgment before full evidence. Borrowed Latin phrase, fully integrated into French. Different from philosophical 'a priori' in English academic jargon — here it's everyday educated French.",
  },
  {
    french: "quant à",
    pronunciation: "kɑ̃ ta",
    english: "as for; regarding",
    partOfSpeech: "prepositional phrase",
    example: {
      french: "Les autres sont partis tôt ; quant à nous, on reste jusqu'à la fin.",
      english: "The others left early; as for us, we're staying until the end.",
    },
    explanation: "+ stressed pronoun or noun: 'quant à moi', 'quant à cette question'. Sets a new topic or contrasts one party with another.",
  },
  {
    french: "pour autant",
    pronunciation: "puʁ o.tɑ̃",
    english: "even so; that does not mean",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "Il s'est trompé, mais pour autant ce n'est pas une raison de l'humilier en public.",
      english: "He was wrong, but that doesn't mean you should humiliate him in public.",
    },
    explanation: "Often after a concession: X is true, 'pour autant' Y does not follow. Frequently appears with 'ne… pas'. Tricky for learners — not the same as 'autant' (as much).",
  },
  {
    french: "dès lors",
    pronunciation: "de lɔʁ",
    english: "from then on; hence (formal)",
    partOfSpeech: "adverb",
    example: {
      french: "La loi a été promulguée ; dès lors, les dispositions s'appliquent à l'ensemble du territoire.",
      english: "The law was promulgated; from then on, its provisions apply across the whole territory.",
    },
    explanation: "Logical or temporal consequence, common in legal and argumentative prose. More formal than 'donc' alone. 'Dès lors que' = as soon as / given that.",
  },
  {
    french: "à défaut de",
    pronunciation: "a defo də",
    english: "failing; in the absence of",
    partOfSpeech: "prepositional phrase",
    example: {
      french: "À défaut de beurre, j'ai utilisé de l'huile pour le gâteau.",
      english: "In the absence of butter, I used oil for the cake.",
    },
    explanation: "+ noun or gerund. 'À défaut' alone can mean 'at a pinch'. Implies second-best or substitute when the ideal is missing.",
  },
  {
    french: "ne serait-ce que",
    pronunciation: "nə sʁɛt sy kə",
    english: "if only; at least (minimal example)",
    partOfSpeech: "conjunctional phrase",
    example: {
      french: "Écrivez-nous ne serait-ce qu'une ligne pour confirmer votre accord.",
      english: "Write us at least one line to confirm your agreement.",
    },
    explanation: "Highlights a minimal sufficient action or example. Often persuasive or polite pressure. Breaks into: 'ne' + 'serait-ce' + 'que'.",
  },
  {
    french: "en somme",
    pronunciation: "ɑ̃ sɔm",
    english: "in sum; basically",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "Tu hésites, tu avances, tu recules — en somme, tu ne sais pas encore ce que tu veux.",
      english: "You hesitate, you move forward, you step back — basically, you don't know what you want yet.",
    },
    explanation: "Wraps up an argument or sums up a pattern. Close to 'bref' and 'finalement' but slightly more analytical. Can sound dismissive if overused.",
  },
  {
    french: "sous réserve de",
    pronunciation: "su ʁezɛʁv də",
    english: "subject to; pending",
    partOfSpeech: "prepositional phrase",
    example: {
      french: "L'offre reste valable sous réserve de disponibilité des places.",
      english: "The offer remains valid subject to seat availability.",
    },
    explanation: "Contracts, bookings, official letters. 'Sous réserve' alone = with reservations. Near-English legal tone; everyday in consumer French.",
  },
  {
    french: "bien que",
    pronunciation: "bjɛ̃ kə",
    english: "although (+ subjunctive)",
    partOfSpeech: "conjunction",
    example: {
      french: "Bien qu'il soit fatigué, il a tenu à terminer son rapport ce soir.",
      english: "Although he was tired, he insisted on finishing his report tonight.",
    },
    explanation: "Always + subjunctive in standard French. Contrasts with 'malgré' + noun. Do not confuse with 'bien sûr que' (certainly).",
  },
  {
    french: "quoique",
    pronunciation: "kwalik",
    english: "although; even if (+ subjunctive)",
    partOfSpeech: "conjunction",
    example: {
      french: "Quoique je comprenne ta colère, les insultes ne mènent à rien.",
      english: "Although I understand your anger, insults lead nowhere.",
    },
    explanation: "Subjunctive usual when the clause is open to doubt or counterfact. Written French uses it heavily; 'bien que' is a near-synonym.",
  },
  {
    french: "s'appuyer sur",
    pronunciation: "sa.pɥi.je syʁ",
    english: "to lean on; to base oneself on",
    partOfSpeech: "verb (reflexive)",
    example: {
      french: "On peut s'appuyer sur ces données pour étayer notre argumentation.",
      english: "We can base ourselves on this data to support our line of argument.",
    },
    explanation: "Physical or figurative support. Essays and meetings: 's'appuyer sur des faits'. Different from simple 'utiliser' (use) — implies justification.",
  },
  {
    french: "prôner",
    pronunciation: "pʁo.ne",
    english: "to advocate (openly)",
    partOfSpeech: "verb",
    example: {
      french: "Plusieurs élus prônent une réforme fiscale plus progressive.",
      english: "Several elected officials advocate a more progressive tax reform.",
    },
    explanation: "Publicly defend a principle or policy. Common in politics and editorials. Not 'prôner pour' — direct object: 'prôner la paix'.",
  },
  {
    french: "dénoncer",
    pronunciation: "de.nɔ̃.se",
    english: "to report (wrongdoing); to denounce",
    partOfSpeech: "verb",
    example: {
      french: "Elle a dénoncé les faits auprès du comité d'éthique.",
      english: "She reported what had happened to the ethics committee.",
    },
    explanation: "Neutral or serious: reporting to authorities, or strongly criticizing in public. Noun: 'une dénonciation'. Stronger than 'signaler'.",
  },
  {
    french: "sous-entendre",
    pronunciation: "suz.ɑ̃.tɑ̃dʁ",
    english: "to imply (without saying)",
    partOfSpeech: "verb",
    example: {
      french: "Je n'ai rien dit contre lui ; ne sous-entends pas le contraire.",
      english: "I didn't say anything against him — don't imply the opposite.",
    },
    explanation: "Noun: 'un sous-entendu'. The message between the lines. Different from 'impliquer' (logical involvement) in quiz glosses.",
  },
  {
    french: "nuancer",
    pronunciation: "nɥɑ̃.se",
    english: "to qualify; to add nuance to",
    partOfSpeech: "verb",
    example: {
      french: "Il faudrait nuancer : tous les contrats ne prévoient pas les mêmes garanties.",
      english: "We should qualify that: not all contracts provide the same guarantees.",
    },
    explanation: "Academic and professional French. Noun: 'une nuance'. 'Sans nuance' = bluntly black-and-white.",
  },
  {
    french: "contredire",
    pronunciation: "kɔ̃tʁə.diʁ",
    english: "to contradict",
    partOfSpeech: "verb",
    example: {
      french: "Les deux témoins se contredisent sur l'heure précise des faits.",
      english: "The two witnesses contradict each other on the exact time of the events.",
    },
    explanation: "Irregular present: 'je contredis'. Reflexive 'se contredire' = to be inconsistent. Noun: 'une contradiction'.",
  },
  {
    french: "impliquer",
    pronunciation: "ɛ̃.pli.ke",
    english: "to involve; to imply (entail)",
    partOfSpeech: "verb",
    example: {
      french: "Cette décision pourrait impliquer des milliers d'emplois sur tout le territoire.",
      english: "This decision could involve thousands of jobs across the country.",
    },
    explanation: "'Impliquer que' = to imply that (logical consequence). Participial adjective 'impliqué' also means 'involved' in a scandal. Gloss differs from 'sous-entendre' (hint).",
  },
  {
    french: "présupposer",
    pronunciation: "pʁe.sy.po.ze",
    english: "to presuppose",
    partOfSpeech: "verb",
    example: {
      french: "Accepter ce poste présuppose que tu déménages avant la rentrée.",
      english: "Accepting this job presupposes that you move before the new term.",
    },
    explanation: "Logic, philosophy, careful argument. Something must already be true for the rest to hold. More technical than 'supposer'.",
  },
  {
    french: "mériter",
    pronunciation: "me.ʁi.te",
    english: "to deserve",
    partOfSpeech: "verb",
    example: {
      french: "Son travail mérite reconnaissance, même si personne ne le dit à voix haute.",
      english: "Her work deserves recognition, even if nobody says it out loud.",
    },
    explanation: "+ noun or infinitive: 'mériter d'être écouté'. Adjective 'méritant' exists but can sound judgmental; use with care.",
  },
  {
    french: "s'avérer",
    pronunciation: "sa.ve.ʁe",
    english: "to turn out (to be); to prove (to be)",
    partOfSpeech: "verb (reflexive)",
    example: {
      french: "L'alerte s'est avérée fausse après contrôle sur le terrain.",
      english: "The alert turned out to be false after an on-site check.",
    },
    explanation: "Often + adjective or 'que' clause. Formal register common in news ('il s'avère que'). Past participle agrees if auxiliary structure requires it in compound tenses.",
  },
  {
    french: "acquiescer",
    pronunciation: "a.ki.jɛ.se",
    english: "to acquiesce; to agree (formally)",
    partOfSpeech: "verb",
    example: {
      french: "Face à l'évidence, il a acquiescé d'un signe de tête silencieux.",
      english: "Faced with the evidence, he acquiesced with a silent nod.",
    },
    explanation: "+ 'à' + noun: 'acquiescer à une proposition'. Literary and formal; everyday speech often uses 'accepter' or 'dire oui'.",
  },
  {
    french: "nier",
    pronunciation: "nje",
    english: "to deny (a fact, accusation)",
    partOfSpeech: "verb",
    example: {
      french: "Le suspect nie toute implication dans les faits reprochés.",
      english: "The suspect denies any involvement in the alleged acts.",
    },
    explanation: "+ object or clause. 'Démentir' is stronger (formally refute a published claim). 'Nier' is standard in law and debate.",
  },
  {
    french: "réfuter",
    pronunciation: "ʁe.fyte",
    english: "to refute; to rebut",
    partOfSpeech: "verb",
    example: {
      french: "L'article réfute méthodiquement les principales critiques adressées au modèle.",
      english: "The article methodically rebuts the main criticisms levelled at the model.",
    },
    explanation: "Argumentative writing: show an opposing claim is wrong. Stronger and more systematic than 'nier' alone. Noun: 'une réfutation'.",
  },
  {
    french: "se résigner à",
    pronunciation: "sə ʁe.zi.ʒe a",
    english: "to resign oneself to",
    partOfSpeech: "verb (reflexive)",
    example: {
      french: "Elle s'est résignée à reporter le voyage : les vols étaient complets.",
      english: "She resigned herself to postponing the trip — the flights were full.",
    },
    explanation: "+ infinitive. Conveys reluctant acceptance. Noun: 'résignation'. Not the same semantic field as 'démissionner' (to resign from a job).",
  },
  {
    french: "enjeu",
    pronunciation: "ɑ̃.ʒø",
    english: "stakes; what is at issue",
    partOfSpeech: "noun (m)",
    example: {
      french: "Les enjeux climatiques dépassent largement le cadre d'une seule législature.",
      english: "The climate stakes go far beyond a single parliamentary term.",
    },
    explanation: "Abstract but ubiquitous in media and politics. Plural 'enjeux' very common. 'Il y a un enjeu de crédibilité' = credibility is on the line.",
  },
  {
    french: "démarche",
    pronunciation: "de.maʁʃ",
    english: "steps; procedure; approach",
    partOfSpeech: "noun (f)",
    example: {
      french: "Quelle est la démarche à suivre pour faire appel de cette décision ?",
      english: "What is the procedure to follow to appeal this decision?",
    },
    explanation: "Administration and diplomacy: 'entreprendre une démarche'. Also 'way of walking' in literal sense — context disambiguates.",
  },
  {
    french: "aléa",
    pronunciation: "a.le.a",
    english: "uncertainty; random hazard",
    partOfSpeech: "noun (m)",
    example: {
      french: "Les aléas météo ont contraint les organisateurs à déplacer le concert en salle.",
      english: "Weather uncertainties forced the organisers to move the concert indoors.",
    },
    explanation: "Plural 'aléas' very common in contracts ('aléas du voyage'). Suggests unpredictable bumps, not necessarily disaster.",
  },

  // ── B2–C1 (2): formal links, abstract nouns, judgment & law ─────────────
  {
    french: "par ailleurs",
    pronunciation: "paʁ z‿ajœʁ",
    english: "moreover; separately (another point)",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "Le bilan est encourageant ; par ailleurs, plusieurs dossiers restent bloqués.",
      english: "The assessment is encouraging; moreover, several cases are still stuck.",
    },
    explanation: "Adds a distinct point (not always strongly contrastive). Common in reports and speeches. 'Ailleurs' alone = elsewhere; this is a fixed phrase.",
  },
  {
    french: "afin de",
    pronunciation: "afɛ̃ də",
    english: "in order to (+ infinitive)",
    partOfSpeech: "conjunctional phrase",
    example: {
      french: "Nous avons avancé la réunion afin de boucler le budget avant la fin du mois.",
      english: "We brought the meeting forward in order to close the budget before the end of the month.",
    },
    explanation: "Purpose before an infinitive. More formal than 'pour'. Pair with 'afin que' + subjunctive when the subject of the two clauses differs.",
  },
  {
    french: "afin que",
    pronunciation: "afɛ̃ kə",
    english: "so that (+ subjunctive)",
    partOfSpeech: "conjunction",
    example: {
      french: "Prévenez-nous par e-mail afin que nous puissions réserver une salle adaptée.",
      english: "Let us know by e-mail so that we can book a suitable room.",
    },
    explanation: "Always followed by the subjunctive in standard French. Expresses purpose for another subject. Contrast 'afin de + infinitive' when the same actor does both actions.",
  },
  {
    french: "à savoir",
    pronunciation: "a sa.vwaʁ",
    english: "namely; that is (to say)",
    partOfSpeech: "conjunctional phrase",
    example: {
      french: "Deux questions restent ouvertes, à savoir le coût final et le calendrier de livraison.",
      english: "Two questions remain open, namely the final cost and the delivery schedule.",
    },
    explanation: "Introduces a specification or list. Written and oral professional French. Same verb family as 'savoir' but fixed as a discourse marker here.",
  },
  {
    french: "en guise de",
    pronunciation: "ɑ̃ ɡiz də",
    english: "by way of; as a substitute for",
    partOfSpeech: "prepositional phrase",
    example: {
      french: "Elle lui a offert un roman en guise de remerciement pour son aide.",
      english: "She gave him a novel by way of thanks for his help.",
    },
    explanation: "+ noun. Something stands in for something else (often modestly). Not 'en guise que' — only 'de + noun'.",
  },
  {
    french: "d'emblée",
    pronunciation: "dɑ̃.ble",
    english: "from the outset; right away",
    partOfSpeech: "adverb",
    example: {
      french: "Il a refusé d'emblée toute idée de compromis avec l'autre camp.",
      english: "He rejected outright any idea of a compromise with the other side.",
    },
    explanation: "No gradual process — the stance is taken immediately. Formal tone, common in journalism and argument. Adverb, invariable.",
  },
  {
    french: "de surcroît",
    pronunciation: "də syʁ.kʁwa",
    english: "moreover; on top of that",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "Les bureaux sont exigus ; de surcroît, la climatisation est en panne depuis juin.",
      english: "The offices are cramped; on top of that, the air conditioning has been broken since June.",
    },
    explanation: "Stacks an additional problem or advantage. Slightly literary but still used in complaints and memos. 'Surcroît' = excess, surplus.",
  },
  {
    french: "somme toute",
    pronunciation: "sɔm tut",
    english: "all things considered",
    partOfSpeech: "adverbial phrase",
    example: {
      french: "Ce n'est pas la solution parfaite ; somme toute, elle reste acceptable dans l'urgence.",
      english: "It's not the perfect solution; all things considered, it remains acceptable in an emergency.",
    },
    explanation: "Global judgment after weighing pros and cons. Often follows a concession. Similar territory to 'en somme' but slightly more evaluative.",
  },
  {
    french: "in fine",
    pronunciation: "ɛ̃ fi.ne",
    english: "ultimately; in the end (formal)",
    partOfSpeech: "adverb",
    example: {
      french: "Après des mois de négociation, in fine, les parties ont trouvé un terrain d'entente.",
      english: "After months of negotiation, in the end the parties found common ground.",
    },
    explanation: "Latin tag integrated into French legal and business prose. Signals the final outcome of a process. More bookish than 'finalement'.",
  },
  {
    french: "à l'égard de",
    pronunciation: "a le.gaʁ də",
    english: "towards; with respect to (a person or group)",
    partOfSpeech: "prepositional phrase",
    example: {
      french: "À l'égard des personnes âgées, la ville doit améliorer l'accessibilité des transports.",
      english: "With respect to older people, the city must improve transport accessibility.",
    },
    explanation: "Ethical, political, or policy contexts. Near-synonym of 'envers' for attitude, but 'à l'égard de' is typical in official discourse.",
  },
  {
    french: "à moins que",
    pronunciation: "a mwɛ̃ kə",
    english: "unless (+ subjunctive)",
    partOfSpeech: "conjunction",
    example: {
      french: "Je serai là à dix-huit heures, à moins que le train ne soit encore annulé.",
      english: "I'll be there at six p.m. unless the train is cancelled again.",
    },
    explanation: "Subjunctive after 'à moins que'. Optional 'ne' explétif (without negative meaning) still common in careful French: 'à moins qu'il ne pleuve'.",
  },
  {
    french: "à condition que",
    pronunciation: "a kɔ̃.di.sjɔ̃ kə",
    english: "provided that (+ subjunctive)",
    partOfSpeech: "conjunction",
    example: {
      french: "Tu peux emprunter la voiture à condition que tu la rendes avec le plein.",
      english: "You can borrow the car provided that you bring it back with a full tank.",
    },
    explanation: "Sets a necessary condition. Subjunctive usual. Related: 'sous condition de + infinitive' (more contractual).",
  },
  {
    french: "étayer",
    pronunciation: "e.te.je",
    english: "to shore up; to back up (a claim)",
    partOfSpeech: "verb",
    example: {
      french: "Des documents internes viennent étayer les accusations portées par les lanceurs d'alerte.",
      english: "Internal documents back up the allegations made by the whistleblowers.",
    },
    explanation: "Literal 'prop up' a wall; figurative = support an argument with evidence. Common in investigations and essays. Noun: 'un étayage' (rare).",
  },
  {
    french: "sous-tendre",
    pronunciation: "su.tɑ̃dʁ",
    english: "to underlie; to be behind (implicitly)",
    partOfSpeech: "verb",
    example: {
      french: "Quels intérêts économiques sous-tendent cette réforme, selon vous ?",
      english: "What economic interests do you think underlie this reform?",
    },
    explanation: "What lies beneath a discourse or policy. Academic and media French. Do not confuse with 'sous-entendre' (hint).",
  },
  {
    french: "préconiser",
    pronunciation: "pʁe.kɔ.ni.ze",
    english: "to recommend officially; to advocate (a measure)",
    partOfSpeech: "verb",
    example: {
      french: "Les autorités sanitaires préconisent le port du masque dans les lieux clos bondés.",
      english: "Health authorities recommend wearing a mask in crowded indoor spaces.",
    },
    explanation: "Experts, committees, manuals. Stronger than casual 'conseiller'. Noun: 'une préconisation'.",
  },
  {
    french: "entériner",
    pronunciation: "ɑ̃.te.ʁi.ne",
    english: "to ratify; to endorse formally",
    partOfSpeech: "verb",
    example: {
      french: "Le conseil d'administration a entériné la proposition du comité exécutif.",
      english: "The board of directors ratified the executive committee's proposal.",
    },
    explanation: "Gives final institutional approval. Law, companies, politics. From 'enter' in old sense of recording in the register — not English 'inter'.",
  },
  {
    french: "cautionner",
    pronunciation: "ko.sjɔ.ne",
    english: "to vouch for; to endorse (morally)",
    partOfSpeech: "verb",
    example: {
      french: "Je ne cautionne absolument pas ces propos blessants tenus en réunion.",
      english: "I absolutely do not endorse those hurtful remarks made in the meeting.",
    },
    explanation: "Moral or political backing. Also legal: 'cautionner un prêt' = to guarantee a loan — context disambiguates.",
  },
  {
    french: "désavouer",
    pronunciation: "de.za.vwe",
    english: "to disavow; to repudiate publicly",
    partOfSpeech: "verb",
    example: {
      french: "Le ministre a désavoué les déclarations de son collaborateur sur les réseaux sociaux.",
      english: "The minister disavowed his aide's statements on social media.",
    },
    explanation: "Distance oneself from what someone said or did. Strong public-politics register. Noun: 'un désaveu'.",
  },
  {
    french: "relativiser",
    pronunciation: "ʁe.la.ti.vi.ze",
    english: "to put in perspective; to play down (relative importance)",
    partOfSpeech: "verb",
    example: {
      french: "Un échec pénible, oui — mais il faut relativiser : ce n'est pas irréversible.",
      english: "A painful failure, yes — but you have to put it in perspective: it's not irreversible.",
    },
    explanation: "Modern verb from 'relatif'. Therapeutic and conversational: reduce catastrophic reading of events. Noun: 'relativisation'.",
  },
  {
    french: "atténuer",
    pronunciation: "a.te.nɥe",
    english: "to lessen; to soften (effect, tone)",
    partOfSpeech: "verb",
    example: {
      french: "Les doubles vitrages atténuent sensiblement le bruit de la rue la nuit.",
      english: "Double glazing noticeably lessens street noise at night.",
    },
    explanation: "Physical or figurative weakening. Law: 'circonstances atténuantes' = mitigating circumstances. Opposite tendency: 'exacerber'.",
  },
  {
    french: "exacerber",
    pronunciation: "ɛɡ.za.sɛʁ.be",
    english: "to exacerbate",
    partOfSpeech: "verb",
    example: {
      french: "Le manque de sommeil n'a fait qu'exacerber son irritabilité pendant la crise.",
      english: "Lack of sleep only exacerbated his irritability during the crisis.",
    },
    explanation: "Makes a bad situation more acute. Learned register, common in medicine and politics. Regular -er verb despite the learned look.",
  },
  {
    french: "promulguer",
    pronunciation: "pʁɔ.my.lɡe",
    english: "to promulgate (a law)",
    partOfSpeech: "verb",
    example: {
      french: "Le texte a été promulgué au Journal officiel la semaine suivante.",
      english: "The bill was promulgated in the Official Journal the following week.",
    },
    explanation: "Final step making a law officially binding in France. Journalistic and civic vocabulary. Noun: 'une promulgation'.",
  },
  {
    french: "infirmer",
    pronunciation: "ɛ̃.fiʁ.me",
    english: "to overturn (a decision); to invalidate",
    partOfSpeech: "verb",
    example: {
      french: "La cour d'appel a infirmé le jugement de première instance sur ce point de droit.",
      english: "The court of appeal overturned the first-instance ruling on this point of law.",
    },
    explanation: "Legal core use. Medical 'infirme' (disabled) is a false friend — unrelated to this verb in daily advanced French.",
  },
  {
    french: "corroborer",
    pronunciation: "kɔ.ʁɔ.bɔ.ʁe",
    english: "to corroborate (evidence, testimony)",
    partOfSpeech: "verb",
    example: {
      french: "Un second témoin oculaire a corroboré la version donnée par la victime.",
      english: "A second eyewitness corroborated the account given by the victim.",
    },
    explanation: "Justice and investigation French. Independent sources line up. Pair with 'étayer' (support structurally); 'corroborer' stresses mutual confirmation.",
  },
  {
    french: "préalable",
    pronunciation: "pʁe.a.lab(l)",
    english: "precondition; prerequisite (noun)",
    partOfSpeech: "noun (m)",
    example: {
      french: "Le dépôt d'un dossier complet est un préalable à toute demande de subvention.",
      english: "Submitting a complete file is a precondition for any grant application.",
    },
    explanation: "Adjective 'préalable' exists too ('accord préalable'). 'Sans préalable' = without prior steps. Common in admin.",
  },
  {
    french: "prétexte",
    pronunciation: "pʁe.tɛkst",
    english: "pretext; excuse (often flimsy)",
    partOfSpeech: "noun (m)",
    example: {
      french: "Il s'est servi d'un prétexte bidon pour éviter de venir à la réunion.",
      english: "He used a bogus excuse to avoid coming to the meeting.",
    },
    explanation: "'Sous prétexte de' + noun/infinitive = claiming as a reason. Often implies the reason is not the real motive.",
  },
  {
    french: "consensus",
    pronunciation: "kɔ̃.sɛ̃.sys",
    english: "consensus",
    partOfSpeech: "noun (m)",
    example: {
      french: "On cherche un large consensus sans pour autant occulter les désaccords minoritaires.",
      english: "We are seeking a broad consensus without brushing aside minority disagreements.",
    },
    explanation: "Masculine in French. 'Faire consensus' = to command wide agreement. Politics and organisations.",
  },
  {
    french: "divergence",
    pronunciation: "di.vɛʁ.ʒɑ̃s",
    english: "disagreement; divergence",
    partOfSpeech: "noun (f)",
    example: {
      french: "Les divergences persistent entre les partenaires sociaux sur la durée du travail.",
      english: "Disagreements persist between the social partners on working hours.",
    },
    explanation: "Plural 'divergences' very common in negotiation coverage. Mathematical sense also exists — context clarifies.",
  },
  {
    french: "convergence",
    pronunciation: "kɔ̃.vɛʁ.ʒɑ̃s",
    english: "convergence (of views, trends)",
    partOfSpeech: "noun (f)",
    example: {
      french: "Il y a convergence des analyses sur la nécessité d'investir dans la formation.",
      english: "There is convergence among analyses on the need to invest in training.",
    },
    explanation: "'Convergence des vues' = alignment of positions. Economics and diplomacy use it heavily.",
  },
  {
    french: "adhésion",
    pronunciation: "a.de.zjɔ̃",
    english: "membership; adherence (to an idea)",
    partOfSpeech: "noun (f)",
    example: {
      french: "L'adhésion au syndicat est libre : nul ne peut y être contraint.",
      english: "Union membership is voluntary: no one can be forced to join.",
    },
    explanation: "Concrete (joining an organisation) or abstract ('adhésion à un projet'). Verb: 'adhérer à'.",
  },
  {
    french: "ressenti",
    pronunciation: "ʁe.sɑ̃.ti",
    english: "subjective feeling; impression (after an experience)",
    partOfSpeech: "noun (m)",
    example: {
      french: "Quel est votre ressenti après ce premier trimestre dans l'équipe ?",
      english: "What is your sense of things after your first quarter on the team?",
    },
    explanation: "HR, surveys, medicine: personal perception as data. Past participle of 'ressentir' nominalised. Not 'sentiment' (emotion) exactly — more 'overall feel'.",
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
