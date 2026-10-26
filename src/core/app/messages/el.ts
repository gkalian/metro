import type { Messages } from './ru';

/** Months in the genitive, as dates are written: «29 Δεκεμβρίου 1978». */
const MONTHS = [
  'Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου',
  'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου',
];

/** Greek texts; the keys and arguments follow the Russian ones. */
export const el: Messages = {
  minutes: (min) => `${min} λεπ.`,
  hoursMinutes: (hours, min) => `${hours} ώρ. ${min} λεπ.`,
  date: (day, month, year) => `${day} ${MONTHS[month]} ${year}`,

  horizonToday: 'σήμερα',
  horizonAllPlans: 'με όλα τα σχέδια',
  horizonDecade: (decade) => `στο τέλος της δεκαετίας του ${decade}`,
  horizonEndOfYear: (year) => `στο τέλος του ${year}`,
  horizonYear: (year) => `έως το ${year}`,
  chronologyAllPlans: 'όλα τα σχέδια',
  tickNow: 'τώρα',
  tickAll: 'όλα',
  tickDecade: (decade) => `’${String(decade).slice(2)}`,

  showPanel: 'Εμφάνιση πίνακα',
  hidePanel: 'Απόκρυψη πίνακα',
  languageButton: (next) => `Γλώσσα: ελληνικά. Αλλαγή σε ${{ ru: 'ρωσικά', en: 'αγγλικά', el: 'ελληνικά' }[next]}`,
  otherCities: 'Άλλες πόλεις',
  from: 'Από',
  to: 'Προς',
  clear: 'Καθαρισμός',
  plannedFor: (year) => `σχέδιο ${year}`,
  noDate: 'χωρίς ημερομηνία',
  nothingFound: 'Δεν βρέθηκε τίποτα',
  legendPlanned: 'Σχεδιαζόμενο τμήμα',
  legendRail: 'Σιδηροδρομικές γραμμές',
  legendWalk: 'Πεζή μετάβαση μεταξύ σιδηροδρόμου και μετρό',

  hintPickTo: 'Τώρα επιλέξτε τον προορισμό — στον χάρτη ή στο πεδίο «Προς».',
  hintPickBoth: 'Πατήστε δύο σταθμούς στον χάρτη ή επιλέξτε τους στα πεδία παραπάνω για να δείτε τον χρόνο διαδρομής.',
  noRoute: (horizon) => `Στο δίκτυο ${horizon} δεν υπάρχει διαδρομή μεταξύ αυτών των σταθμών — μετακινήστε τον δείκτη έτους.`,
  transfers: (n) => `${n} ${n === 1 ? 'μετεπιβίβαση' : 'μετεπιβιβάσεις'}`,
  rideAndWalk: (ride, walk) => `στους συρμούς ${ride} · πεζή μετάβαση ${walk}`,
  noTransfers: 'χωρίς μετεπιβίβαση',
  walkTo: (station) => `Μετάβαση στον σταθμό «${station}»`,
  changeTrains: (station, lines) => `Στον σταθμό «${station}» — μετεπιβίβαση σε συρμό της γραμμής ${lines.join(' ή ')}`,
  anyTrain: (lines) => `Οποιοσδήποτε συρμός των γραμμών ${lines.join(' και ')}`,
  stopsBetween: (n) => `${n} ${n === 1 ? 'σταθμός' : 'σταθμοί'} ενδιάμεσα`,
  noteEstimate: 'Εκτιμώμενος χρόνος, χωρίς την αναμονή του συρμού.',
  noteFuture: 'Το μελλοντικό δίκτυο ακολουθεί τα σχέδια ανάπτυξης· οι ημερομηνίες μπορεί να αλλάξουν.',
  notePast: 'Τα δίκτυα προηγούμενων ετών ακολουθούν τις ημερομηνίες έναρξης των σταθμών· οι χρόνοι διαδρομής είναι οι σημερινοί.',
  noteEstimatedRuns: 'Ορισμένοι χρόνοι μεταξύ σταθμών εκτιμώνται από την απόσταση: δεν υπάρχουν δημοσιευμένα στοιχεία.',

  status: (status) => ({ open: 'Σε λειτουργία.', construct: 'Υπό κατασκευή.', project: 'Σε σχεδιασμό.' })[status],
  opened: (date) => `Έναρξη λειτουργίας: ${date}`,
  openingPlanned: (year) => `Προγραμματισμένη έναρξη: ${year}`,
  openingUnknown: 'Δεν έχει ανακοινωθεί ημερομηνία έναρξης',
  railStation: 'Σιδηροδρομικός σταθμός',
  railRoutes: (routes) => `Προαστιακός: ${routes.join('; ')}.`,
  railTrains: 'Προαστιακά και υπεραστικά τρένα.',
  railToMetro: (stations) => `Μετεπιβίβαση στο μετρό: ${stations.map((s) => `«${s}»`).join(', ')}.`,
};
