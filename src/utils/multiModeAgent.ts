/**
 * Multi-Mode Voice Agent - All Features
 * Optimized for 5-second response time
 */

export type VoiceMode = 
  | 'assistant'      // Personal assistant (tasks, time, date)
  | 'storyteller'    // Interactive storytelling
  | 'language'       // Language learning partner
  | 'cooking'        // Cooking assistant
  | 'productivity'   // Browser automation
  | 'wellness';      // Mental health companion

// ============================================================================
// Mode Management
// ============================================================================

const MODE_KEY = 'voice_agent_mode';
const STATE_KEY = 'voice_agent_state';

export function getCurrentMode(): VoiceMode {
  return (localStorage.getItem(MODE_KEY) as VoiceMode) || 'assistant';
}

export function setCurrentMode(mode: VoiceMode): void {
  localStorage.setItem(MODE_KEY, mode);
}

export function getModeState<T>(): T | null {
  try {
    const state = localStorage.getItem(STATE_KEY);
    return state ? JSON.parse(state) : null;
  } catch {
    return null;
  }
}

export function setModeState<T>(state: T): void {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

export function clearModeState(): void {
  localStorage.removeItem(STATE_KEY);
}

// Validate and migrate old state format to new format
export function validateLanguageState(state: any): state is LanguageState {
  return state && 
         typeof state === 'object' &&
         'language' in state &&
         'level' in state &&
         'currentPhrase' in state;
}

// ============================================================================
// Mode Detection from User Input
// ============================================================================

export function detectModeSwitch(text: string): VoiceMode | null {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  
  if (/(?:tell|start|begin) (?:a |me a )?(?:story|tale|adventure)/.test(lower)) {
    return 'storyteller';
  }
  
  if (/(?:teach|learn|practice|help me) (?:language|speaking|pronunciation|english|spanish)/.test(lower)) {
    return 'language';
  }
  
  if (/(?:cook|recipe|kitchen|ingredient|how to make|prepare)/.test(lower)) {
    return 'cooking';
  }
  
  if (/(?:automate|browser|productivity|workflow|open|navigate)/.test(lower)) {
    return 'productivity';
  }
  
  if (/(?:feeling|stressed|anxious|talk|mental health|breathe|meditation)/.test(lower)) {
    return 'wellness';
  }
  
  if (/(?:assistant|tasks|schedule|reminder)/.test(lower)) {
    return 'assistant';
  }
  
  return null;
}

// ============================================================================
// Storyteller Mode
// ============================================================================

interface StoryState {
  title: string;
  scene: number;
  choices: string[];
  history: string[];
}

const STORY_SCENES = [
  {
    text: "You wake in a forest. A path splits left toward mountains, right toward a village.",
    choices: ["Go left to mountains", "Go right to village"],
  },
  {
    text: "Mountain path is steep. You find a cave with glowing crystals or continue climbing.",
    choices: ["Enter the cave", "Keep climbing"],
  },
  {
    text: "The village is bustling. Visit the tavern for info or the shop for supplies.",
    choices: ["Visit tavern", "Visit shop"],
  },
  {
    text: "Inside the cave, crystals hum with magic. Take one or leave it alone.",
    choices: ["Take crystal", "Leave it"],
  },
  {
    text: "Summit reached! A dragon sleeps nearby. Sneak past or wake it for treasure.",
    choices: ["Sneak past", "Wake dragon"],
  },
];

export function initStory(): string {
  const state: StoryState = {
    title: "The Enchanted Forest",
    scene: 0,
    choices: STORY_SCENES[0].choices,
    history: [],
  };
  setModeState(state);
  return `${STORY_SCENES[0].text} Say: ${STORY_SCENES[0].choices.join(' or ')}`;
}

export function continueStory(choice: string): string {
  if (!choice || typeof choice !== 'string') {
    return "I didn't catch that. Please make a choice.";
  }
  
  const state = getModeState<StoryState>();
  if (!state) return initStory();
  
  // Simple choice matching
  const choiceIndex = state.choices.findIndex((c) => 
    choice.toLowerCase().includes(c.toLowerCase().split(' ')[0])
  );
  
  if (choiceIndex === -1) {
    return `Say: ${state.choices.join(' or ')}`;
  }
  
  // Navigate to next scene
  let nextScene = (state.scene + 1) % STORY_SCENES.length;
  if (choiceIndex === 0 && state.scene === 0) nextScene = 1;
  if (choiceIndex === 1 && state.scene === 0) nextScene = 2;
  
  state.scene = nextScene;
  state.choices = STORY_SCENES[nextScene].choices;
  state.history.push(choice);
  setModeState(state);
  
  return `${STORY_SCENES[nextScene].text} Say: ${STORY_SCENES[nextScene].choices.join(' or ')}`;
}

export function getStoryPrompt(): string {
  return "Interactive story mode. Give 15-word scene descriptions. Ask for user choice.";
}

// ============================================================================
// Language Learning Mode
// ============================================================================

export type LanguageType = 'english' | 'french' | 'spanish' | 'german' | 'italian';

interface LanguageState {
  language: LanguageType;
  level: 'beginner' | 'intermediate' | 'advanced';
  wordsLearned: number;
  currentPhrase: string;
}

const LANGUAGE_PHRASES: Record<LanguageType, {
  beginner: string[];
  intermediate: string[];
  advanced: string[];
  greeting: string;
  encouragement: string;
  tryAgain: string;
}> = {
  english: {
    beginner: [
      "Hello, how are you?",
      "Good morning, nice to meet you",
      "Thank you very much",
      "Where is the bathroom?",
      "I would like some water",
    ],
    intermediate: [
      "Could you please help me with this?",
      "I'm learning to speak more fluently",
      "What's the best way to practice?",
      "I enjoy reading books in English",
    ],
    advanced: [
      "The philosophical implications are profound",
      "I'd appreciate your perspective on this matter",
      "How do you articulate complex ideas clearly?",
    ],
    greeting: "Welcome to English practice!",
    encouragement: "Great job!",
    tryAgain: "Try again",
  },
  french: {
    beginner: [
      "Bonjour, comment allez-vous?",
      "Merci beaucoup",
      "Je m'appelle",
      "Où sont les toilettes?",
      "Je voudrais de l'eau",
      "Bonne journée",
      "Au revoir",
    ],
    intermediate: [
      "Pourriez-vous m'aider s'il vous plaît?",
      "J'apprends à parler français",
      "Quelle est la meilleure façon de pratiquer?",
      "J'aime lire des livres en français",
    ],
    advanced: [
      "Les implications philosophiques sont profondes",
      "J'apprécierais votre perspective sur cette question",
      "Comment articulez-vous des idées complexes clairement?",
    ],
    greeting: "Bienvenue à la pratique du français!",
    encouragement: "Très bien!",
    tryAgain: "Essayez encore",
  },
  spanish: {
    beginner: [
      "Hola, ¿cómo estás?",
      "Buenos días",
      "Muchas gracias",
      "¿Dónde está el baño?",
      "Quisiera agua por favor",
      "Buenas tardes",
      "Hasta luego",
    ],
    intermediate: [
      "¿Podría ayudarme por favor?",
      "Estoy aprendiendo a hablar español",
      "¿Cuál es la mejor manera de practicar?",
      "Me gusta leer libros en español",
    ],
    advanced: [
      "Las implicaciones filosóficas son profundas",
      "Apreciaría su perspectiva sobre este asunto",
      "¿Cómo articula ideas complejas claramente?",
    ],
    greeting: "¡Bienvenido a la práctica de español!",
    encouragement: "¡Muy bien!",
    tryAgain: "Inténtalo de nuevo",
  },
  german: {
    beginner: [
      "Guten Tag, wie geht es Ihnen?",
      "Danke schön",
      "Ich heiße",
      "Wo ist die Toilette?",
      "Ich möchte Wasser",
      "Guten Morgen",
      "Auf Wiedersehen",
    ],
    intermediate: [
      "Könnten Sie mir bitte helfen?",
      "Ich lerne Deutsch zu sprechen",
      "Was ist der beste Weg zu üben?",
      "Ich lese gerne Bücher auf Deutsch",
    ],
    advanced: [
      "Die philosophischen Implikationen sind tiefgründig",
      "Ich würde Ihre Perspektive zu dieser Angelegenheit schätzen",
      "Wie artikulieren Sie komplexe Ideen klar?",
    ],
    greeting: "Willkommen zum Deutsch üben!",
    encouragement: "Sehr gut!",
    tryAgain: "Versuchen Sie es noch einmal",
  },
  italian: {
    beginner: [
      "Ciao, come stai?",
      "Buongiorno",
      "Grazie mille",
      "Dove è il bagno?",
      "Vorrei dell'acqua",
      "Buona sera",
      "Arrivederci",
    ],
    intermediate: [
      "Potresti aiutarmi per favore?",
      "Sto imparando a parlare italiano",
      "Qual è il modo migliore per praticare?",
      "Mi piace leggere libri in italiano",
    ],
    advanced: [
      "Le implicazioni filosofiche sono profonde",
      "Apprezzerei la tua prospettiva su questa questione",
      "Come si articolano chiaramente idee complesse?",
    ],
    greeting: "Benvenuto alla pratica italiana!",
    encouragement: "Molto bene!",
    tryAgain: "Riprova",
  },
};

// Detect which language the user wants to practice
export function detectLanguage(text: string): LanguageType | null {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  
  if (/french|français|francais|bonjour|merci/.test(lower)) return 'french';
  if (/spanish|español|espanol|hola|gracias/.test(lower)) return 'spanish';
  if (/german|deutsch|guten tag|danke/.test(lower)) return 'german';
  if (/italian|italiano|ciao|grazie/.test(lower)) return 'italian';
  if (/english/.test(lower)) return 'english';
  
  return null;
}

export function initLanguageLearning(level: 'beginner' | 'intermediate' | 'advanced' = 'beginner', language: LanguageType = 'english'): string {
  const langData = LANGUAGE_PHRASES[language];
  const phrases = langData[level];
  if (!phrases || phrases.length === 0) {
    return "Language learning mode starting...";
  }
  const phrase = phrases[0];
  const state: LanguageState = { language, level, wordsLearned: 0, currentPhrase: phrase };
  setModeState(state);
  return `${langData.greeting} Say this slowly: "${phrase}"`;
}

export function evaluatePronunciation(userText: string): string {
  if (!userText || typeof userText !== 'string' || userText.trim() === '') {
    return "I didn't hear you clearly. Please try again.";
  }
  
  const state = getModeState<LanguageState>();
  
  // If no state or invalid state (missing language or level), reinitialize
  if (!state || !state.currentPhrase || !state.language || !state.level) {
    clearModeState(); // Clear corrupted state
    return initLanguageLearning();
  }
  
  // Check if user wants to switch language
  const newLanguage = detectLanguage(userText);
  if (newLanguage && newLanguage !== state.language) {
    clearModeState();
    return initLanguageLearning(state.level || 'beginner', newLanguage);
  }
  
  // Ensure we have valid language data
  const langData = LANGUAGE_PHRASES[state.language];
  if (!langData) {
    // Invalid language in state, reset to English
    clearModeState();
    return initLanguageLearning(state.level || 'beginner', 'english');
  }
  
  // Ensure level exists in langData
  const phrases = langData[state.level];
  if (!phrases || phrases.length === 0) {
    clearModeState();
    return initLanguageLearning('beginner', state.language);
  }
  
  // Ensure currentPhrase is valid before processing
  const targetPhrase = state.currentPhrase || '';
  if (!targetPhrase) {
    clearModeState();
    return initLanguageLearning();
  }
  
  const similarity = calculateSimilarity(userText.toLowerCase().trim(), targetPhrase.toLowerCase().trim());
  
  if (similarity > 0.8) {
    state.wordsLearned++;
    const nextPhrase = phrases[state.wordsLearned % phrases.length];
    state.currentPhrase = nextPhrase;
    setModeState(state);
    return `${langData.encouragement} Score: ${Math.round(similarity * 100)}%. Next: "${nextPhrase}"`;
  } else {
    return `${langData.tryAgain}. Focus on: "${targetPhrase}". You said: "${userText}"`;
  }
}

function calculateSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2 || typeof str1 !== 'string' || typeof str2 !== 'string') {
    return 0;
  }
  const words1 = str1.trim().split(/\s+/).filter(w => w.length > 0);
  const words2 = str2.trim().split(/\s+/).filter(w => w.length > 0);
  if (words1.length === 0 || words2.length === 0) return 0;
  const matches = words1.filter((w) => words2.includes(w)).length;
  return matches / Math.max(words1.length, words2.length);
}

export function getLanguagePrompt(): string {
  return "Language tutor. Give 10-word feedback on pronunciation. Be encouraging.";
}

// ============================================================================
// Cooking Assistant Mode
// ============================================================================

interface CookingState {
  recipe: string;
  step: number;
  timer?: number;
}

const RECIPES: Record<string, string[]> = {
  pasta: [
    "Boil 4 cups water with salt",
    "Add pasta, cook 8-10 minutes",
    "Drain and add sauce",
    "Serve hot with cheese",
  ],
  eggs: [
    "Heat pan with butter on medium",
    "Crack 2 eggs into pan",
    "Cook 3 minutes until whites set",
    "Season with salt and pepper, serve",
  ],
  salad: [
    "Wash lettuce, tomatoes, cucumber",
    "Chop vegetables into bite size",
    "Mix with olive oil and vinegar",
    "Add salt, pepper, toss and serve",
  ],
  rice: [
    "Rinse 1 cup rice until clear",
    "Add 2 cups water, bring to boil",
    "Reduce heat, cover, simmer 15 minutes",
    "Let stand 5 minutes, fluff and serve",
  ],
};

export function startCooking(recipeName: string): string {
  if (!recipeName || typeof recipeName !== 'string') {
    return "What would you like to cook? Say: pasta, eggs, salad, or rice.";
  }
  const recipe = recipeName.toLowerCase();
  const steps = RECIPES[recipe] || RECIPES.pasta;
  
  const state: CookingState = { recipe: recipeName, step: 0 };
  setModeState(state);
  
  return `Making ${recipeName}. Step 1: ${steps[0]}. Say next when ready.`;
}

export function nextCookingStep(): string {
  const state = getModeState<CookingState>();
  if (!state) return "What would you like to cook? Try: pasta, eggs, salad, or rice.";
  
  const steps = RECIPES[state.recipe.toLowerCase()] || RECIPES.pasta;
  state.step++;
  
  if (state.step >= steps.length) {
    clearModeState();
    return "Done! Enjoy your meal.";
  }
  
  setModeState(state);
  return `Step ${state.step + 1}: ${steps[state.step]}. Say next or repeat.`;
}

export function detectCookingCommand(text: string): 'next' | 'repeat' | 'timer' | 'start' | null {
  if (!text || typeof text !== 'string') return null;
  const lower = text.toLowerCase();
  if (/next|continue|done/.test(lower)) return 'next';
  if (/repeat|again|what/.test(lower)) return 'repeat';
  if (/timer|set timer|remind/.test(lower)) return 'timer';
  if (/cook|make|recipe/.test(lower)) return 'start';
  return null;
}

export function getCookingPrompt(): string {
  return "Cooking guide. Give 12-word steps. Be clear and sequential.";
}

// ============================================================================
// Productivity Mode
// ============================================================================

export function executeProductivityCommand(command: string): string {
  if (!command || typeof command !== 'string') {
    return "Say: open website, search, new tab, or scroll.";
  }
  const lower = command.toLowerCase();
  
  if (/open|navigate to|go to/.test(lower)) {
    const url = extractUrl(lower);
    if (url) {
      window.open(url, '_blank');
      return `Opening ${url}`;
    }
    return "Which website? Say: open google or open youtube.";
  }
  
  if (/search for/.test(lower)) {
    const query = lower.replace(/.*search for\s+/, '');
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    window.open(searchUrl, '_blank');
    return `Searching for ${query}`;
  }
  
  if (/new tab/.test(lower)) {
    window.open('about:blank', '_blank');
    return "New tab opened";
  }
  
  if (/close tab/.test(lower)) {
    window.close();
    return "Closing current tab";
  }
  
  if (/scroll (up|down)/.test(lower)) {
    const direction = lower.includes('up') ? -300 : 300;
    window.scrollBy({ top: direction, behavior: 'smooth' });
    return `Scrolled ${lower.includes('up') ? 'up' : 'down'}`;
  }
  
  return "Say: open website, search for something, new tab, or scroll up/down.";
}

function extractUrl(text: string): string | null {
  const urlMap: Record<string, string> = {
    google: 'https://www.google.com',
    youtube: 'https://www.youtube.com',
    gmail: 'https://mail.google.com',
    github: 'https://github.com',
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com',
    reddit: 'https://reddit.com',
  };
  
  for (const [key, url] of Object.entries(urlMap)) {
    if (text.includes(key)) return url;
  }
  
  return null;
}

export function getProductivityPrompt(): string {
  return "Browser automation helper. Confirm actions in 8 words. Be efficient.";
}

// ============================================================================
// Mental Health Companion Mode
// ============================================================================

interface WellnessState {
  moodHistory: Array<{ date: number; mood: string }>;
  sessionCount: number;
}

export function startWellnessSession(): string {
  const state = getModeState<WellnessState>() || { moodHistory: [], sessionCount: 0 };
  state.sessionCount++;
  setModeState(state);
  return "I'm here to listen. How are you feeling today?";
}

export function respondToMood(userText: string): string {
  if (!userText || typeof userText !== 'string') {
    return "I'm here to listen. How are you feeling?";
  }
  const lower = userText.toLowerCase();
  const state = getModeState<WellnessState>() || { moodHistory: [], sessionCount: 0 };
  
  // Detect mood
  let mood = 'neutral';
  if (/stressed|anxious|worried|nervous/.test(lower)) mood = 'anxious';
  if (/sad|down|depressed|lonely/.test(lower)) mood = 'sad';
  if (/angry|frustrated|annoyed/.test(lower)) mood = 'angry';
  if (/happy|good|great|wonderful/.test(lower)) mood = 'happy';
  
  state.moodHistory.push({ date: Date.now(), mood });
  setModeState(state);
  
  // Provide appropriate response
  if (mood === 'anxious') {
    return "Take a deep breath with me. Inhale 4 counts, hold 4, exhale 4. You're safe.";
  }
  if (mood === 'sad') {
    return "It's okay to feel this way. What's weighing on your mind right now?";
  }
  if (mood === 'angry') {
    return "Your feelings are valid. Let's pause together. What triggered this feeling?";
  }
  if (mood === 'happy') {
    return "That's wonderful! What's bringing you joy today?";
  }
  
  return "Tell me more about what you're experiencing. I'm listening without judgment.";
}

export function offerBreathingExercise(): string {
  return "Let's breathe together. Inhale for 4, hold for 4, exhale for 4. Ready? Begin.";
}

export function getWellnessPrompt(): string {
  return "Empathetic listener. Give 12-word responses. Be warm, validating, non-judgmental.";
}

// ============================================================================
// Mode-Specific System Prompts (Ultra-Optimized for 5s)
// ============================================================================

export function getSystemPromptForMode(mode: VoiceMode): string {
  switch (mode) {
    case 'storyteller':
      return getStoryPrompt();
    case 'language':
      return getLanguagePrompt();
    case 'cooking':
      return getCookingPrompt();
    case 'productivity':
      return getProductivityPrompt();
    case 'wellness':
      return getWellnessPrompt();
    case 'assistant':
    default:
      return "Helpful voice assistant. Keep responses under 12 words. Be direct.";
  }
}

// ============================================================================
// Mode Information
// ============================================================================

export const MODE_INFO: Record<VoiceMode, { name: string; icon: string; description: string }> = {
  assistant: {
    name: "Personal Assistant",
    icon: "📋",
    description: "Manage tasks, time, and daily schedules",
  },
  storyteller: {
    name: "Story Mode",
    icon: "📖",
    description: "Interactive adventures with voice choices",
  },
  language: {
    name: "Language Tutor",
    icon: "🗣️",
    description: "Learn English, French, Spanish, German, Italian",
  },
  cooking: {
    name: "Cooking Guide",
    icon: "👨‍🍳",
    description: "Step-by-step recipe instructions",
  },
  productivity: {
    name: "Productivity",
    icon: "⚡",
    description: "Voice-controlled browser automation",
  },
  wellness: {
    name: "Wellness Companion",
    icon: "💚",
    description: "Mental health support and breathing exercises",
  },
};
