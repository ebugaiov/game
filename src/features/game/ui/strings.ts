import type { Difficulty, FinishReason } from "../domain/types";

export const PLAYER_PRESETS = [
  "Sven Svarvare",
  "Gunnar Gjutare",
  "Maria Miljö",
  "Kurt Kugg",
  "Anna Automation",
  "Bengt Beredare",
  "Lasse Laser",
  "Frida Fräs",
] as const;

export const TIME_LIMIT_OPTIONS = [
  { value: 0, label: "♾️ Obegränsad tid (Ingen timer)" },
  { value: 5, label: "⏱️ 5 minuter (Snabbmatch)" },
  { value: 10, label: "⏱️ 10 minuter (Standard)" },
  { value: 15, label: "⏱️ 15 minuter" },
  { value: 20, label: "⏱️ 20 minuter" },
  { value: 30, label: "⏱️ 30 minuter (Lång match)" },
] as const;

export type TimeLimitMinutes = (typeof TIME_LIMIT_OPTIONS)[number]["value"];

export const DIFFICULTY_LABELS: Record<Difficulty | "all", string> = {
  all: "Alla",
  easy: "Lätt",
  medium: "Medel",
  hard: "Svår",
  expert: "Expert",
};

export const FINISH_REASON_LABELS: Record<FinishReason, string> = {
  score_target: "Målet nått",
  round_limit: "Rundgränsen nådd",
  time_up: "Tiden är slut",
};

export const strings = {
  appName: "Industrins Svenska",
  tagline: "Grammatik & Satslära i Verkstaden",
  standardBadge: "GY25 Standard",
  metadata: {
    appTitle: "Industrins Svenska – Grammatik & Satslära i Verkstaden (GY25)",
    appDescription:
      "Ett sällskapsspel för yrkeselever där ni tränar svensk grammatik och satslära med verkstadsvokabulär.",
    homeTitle: "Industrins Svenska – Ny match",
    historyTitle: "Industrins Svenska – Spelhistorik",
  },
  nav: {
    rules: "Regelbok & Satslära",
    settings: "Spelare & Inställningar",
    history: "Historik",
    newGame: "Nytt spel",
    fullscreen: "Helbild",
    exitFullscreen: "Avsluta helbild",
    soundOn: "Ljud På",
    soundOff: "Ljud Av",
  },
  setup: {
    title: "Spelinställningar & Spelare",
    subtitle: "Registrera upp till 20 individuella spelare, ställ in tid och svårighetsgrad",
    timeLabel: "Matchtid / Tidsbegränsning:",
    presetsLabel: "Snabbval Antal Spelare:",
    playersLabel: "Spelarnamn, Emoji & Färg (Max 20 st):",
    playerCount: (count: number) => `${count} / 20 Spelare`,
    defaultPlayerName: (number: number) => `Spelare ${number}`,
    addPlayer: "Lägg till spelare",
    difficultyLabel: "Svårighetsgrad:",
    start: 'Starta "Industrins Svenska"!',
    playerPlaceholder: "Spelarnamn",
    removePlayer: "Ta bort spelare",
    presetCount: (count: number) => `${count} Spelare`,
    startFailed: "Kunde inte starta spelet. Försök igen.",
    loading: "Startar spelet...",
    historyLink: "Visa spelhistorik",
  },
  game: {
    activePlayer: "AKTIV SPELARE",
    turnBanner: (name: string) => `DET ÄR ${name.toUpperCase()}S TUR!`,
    round: (round: number) => `Runda ${round}`,
    bonusButton: "EXPERT-BONUS (+1000 Coins)",
    resumeBonus: "Fortsätt bonusfrågan",
    wheelLabel: "Lotterihjulet",
    difficultyBadge: (label: string) => `Nivå: ${label}`,
    spinButton: "Snurra Lotterihjulet!",
    spinNotice: (name: string) => `Det är ${name}s tur! Snurra hjulet eller klicka på ett ämne.`,
    spinning: "Hjulet snurrar...",
    boardTitle: "Verkstadsbanan (20 Rutor) & Snabbval",
    boardSubtitle:
      "Snurra hjulet eller klicka på en kategori direkt. Rätt svar ger Coins och flyttar pjäsen framåt!",
    categoriesTitle: "12 Industrigrammatiska Kategorier:",
    manualScore: "Manuell Coinsjustering",
    tile: (number: number) => `Ruta ${number}`,
    turnHere: "DIN TUR",
    coins: "Coins",
    coinsWithIcon: "Coins 🪙",
    categorySubtitle: "GY25 Svenska",
    currentPlayerLabel: "SVARAS JUST NU AV:",
    chooseOption: "Välj det mest grammatiskt korrekta alternativet nedan:",
    fiftyFifty: "50/50 Hjälp",
    fiftyFiftyUsed: "50/50 Använd",
    fiftyFiftyPoints: "+50 Coins (Halv Vinst) 🪙",
    points: (points: number) => `+${points} Coins 🪙`,
    correct: "Rätt svar!",
    wrong: "Fel svar!",
    explanationTitle: "Pedagogisk Förklaring & Grammatikregel:",
    nextPlayer: "Nästa Spelare ➔",
    bonusTitle: "INDUSTRIELL EXPERT-BONUS (+1000 COINS 🪙)",
    bonusFor: (name: string) => `Bonusfråga för ${name}`,
    bonusChoose: "Välj rätt grammatiskt svar (+1000 Coins / 0 Coins):",
    bonusCorrect: "⭐ UTOMORDENTLIGT! RÄTT BONUS (+1000 COINS 🪙)",
    bonusWrong: "FEL SVAR! (0 Coins)",
    continueGame: "Fortsätt Spelet ➔",
    timerLabel: "Matchtid",
    categoryBadgeFallback: "Kategori",
    questionLoading: "Frågan läses in...",
    closeBonus: "Stäng bonusfrågan",
  },
  scoreDialog: {
    title: "Manuell Coinsjustering",
    choosePlayer: "Välj spelare:",
    newScore: "Ange nytt Coins-saldo:",
    save: "Spara Coins",
    cancel: "Avbryt",
    playerOption: (name: string, score: number) => `${name} (${score} Coins)`,
    invalid: "Ange ett giltigt heltal mellan -10000 och 100000.",
    saveFailed: "Kunde inte spara poängen.",
  },
  rules: {
    title: "Industriell Satslära & Grammatikguide",
    sections: [
      {
        title: "1. V2-regeln (Verb på plats 2 i Huvudsats)",
        body: 'I alla svenska huvudsatser måste verbet stå på andra platsen. Om du börjar med ett adverbial (t.ex. "Igår") kommer verbet före subjektet: "Igår ställde operatören in fräsen."',
      },
      {
        title: "2. BIFF-regeln (Satsverbial i Bisats)",
        body: 'BIFF = I Bisats står Inte Före Första verbet. Exempel: "...eftersom svetsaren inte hade godkänd skyddsutrustning."',
      },
      {
        title: "3. Passiv Form & Processbeskrivning",
        body: 'Inom industrin beskrivs ofta vad som görs med materialet utan att nämna vem som gör det. Det bildas med s-passiv: "Plåten skärs med laser" eller "Hålet borrades igår".',
      },
      {
        title: "4. Partikelverb i Maskindrift",
        body: 'Verb kombinerat med betoning på partikeln ändrar betydelsen helt: "ställa IN" (kalibrera), "stänga AV" (stoppa ström), "koppla UR" (avaktivera).',
      },
      {
        title: "5. SRT-regeln (Adverbialens ordning)",
        body: 'Adverbial placeras i slutet av satsen enligt ordningen: Sätt ➔ Rum ➔ Tid. Exempel: "Operatören mätte biten noggrant (Sätt) i kontrollrummet (Rum) på morgonen (Tid)."',
      },
    ],
    close: "Stäng",
  },
  victory: {
    defaultTitle: "Spelet är avslutat!",
    defaultSubtitle: "En mästerlig insats i Industrins Svenska & Verkstadssatslära!",
    title: (name: string) => `👑 ${name} Vinner!`,
    subtitle: (score: number) => `Med fantastiska ${score} Coins i Industrins Svenska!`,
    medal: (place: number) =>
      ["🥇 1:a Plats", "🥈 2:a Plats", "🥉 3:e Plats"][place - 1] ?? `🏅 ${place}:a Plats`,
    coins: (score: number) => `${score} Coins 🪙`,
    playAgain: "🔄 Ny Omgång / Spela Igen",
  },
  history: {
    title: "Spelhistorik",
    subtitle: "Alla spelade och pågående matcher",
    empty: "Inga spel ännu.",
    start: "Starta ett nytt spel",
    backHome: "Till startsidan",
    columns: {
      started: "Startad",
      status: "Status",
      round: "Runda",
      players: "Spelare",
      winner: "Vinnare",
    },
    status: {
      in_progress: "Pågår",
      finished: "Avslutat",
    },
    open: "Öppna",
    noWinner: "–",
    playerCount: (count: number) => `${count} st`,
  },
  common: {
    close: "Stäng",
    cancel: "Avbryt",
    loading: "Laddar...",
    genericError: "Något gick fel. Försök igen.",
    gameNotFound: "Spelet kunde inte hittas.",
    offline: "Kunde inte nå servern. Kontrollera anslutningen.",
    dismiss: "Stäng meddelandet",
  },
} as const;

export function difficultyLabel(difficulty: Difficulty | null): string {
  return DIFFICULTY_LABELS[difficulty ?? "all"];
}
