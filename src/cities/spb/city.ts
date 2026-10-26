import type { City } from '../../core/city.ts';

export const spb: City = {
  id: 'spb',
  path: '',
  title: { ru: 'Метро Санкт-Петербурга', en: 'Saint Petersburg Metro', el: 'Μετρό Αγίας Πετρούπολης' },
  description:
    'Интерактивная карта метро Петербурга: маршрут, время в пути и пересадки между любыми двумя станциями. История сети с 1950-х и планы развития до 2040 года.',
  imageAlt: 'Карта метро Петербурга в светлой и тёмной теме',
  color: '#E44C31',
  langs: ['ru', 'en'],
  localLang: 'ru',
  history: 'decades',
  bounds: [
    [28.6, 59.3],
    [32.0, 60.5],
  ],
  messages: {
    ru: { noteFuture: 'Будущая сеть — по схеме развития до 2040 года; сроки могут сдвинуться.' },
    en: { noteFuture: 'The future network follows the development plan to 2040; dates may shift.' },
  },
  load: () => import('./data.ts').then((m) => m.data),
};
