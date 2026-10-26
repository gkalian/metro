import type { City } from '../../core/city.ts';

export const thessaloniki: City = {
  id: 'thessaloniki',
  path: 'thessaloniki/',
  title: { ru: 'Метро Салоник', en: 'Thessaloniki Metro', el: 'Μετρό Θεσσαλονίκης' },
  description:
    'Интерактивная карта метро Салоник: маршрут, время в пути и пересадки между любыми двумя станциями. Сеть сегодня и по плану развития до 2040 года.',
  imageAlt: 'Карта метро Салоник в светлой и тёмной теме',
  color: '#E3242B',
  langs: ['ru', 'en', 'el'],
  localLang: 'el',
  history: 'years',
  bounds: [
    [22.4, 40.3],
    [23.5, 40.95],
  ],
  messages: {
    ru: {
      noteFuture: 'Будущая сеть — по плану развития до 2040 года; сроков по отдельным участкам нет.',
      noteEstimatedRuns: 'Время перегонов оценено по расстоянию: оператор публикует только общее время в пути.',
    },
    en: {
      noteFuture: 'The future network follows the development plan to 2040; there are no dates for single sections.',
      noteEstimatedRuns: 'Running times are estimated from distance: the operator publishes only end-to-end times.',
    },
    el: {
      noteFuture:
        'Το μελλοντικό δίκτυο ακολουθεί το σχέδιο ανάπτυξης έως το 2040· δεν υπάρχουν ημερομηνίες για μεμονωμένα τμήματα.',
      noteEstimatedRuns:
        'Οι χρόνοι μεταξύ σταθμών εκτιμώνται από την απόσταση: ο φορέας δημοσιεύει μόνο τους συνολικούς χρόνους διαδρομής.',
    },
  },
  load: () => import('./data.ts').then((m) => m.data),
};
