import type { City } from '../../core/city';
import line1 from './data/lines/1.json';
import line2 from './data/lines/2.json';
import line3 from './data/lines/3.json';
import line4 from './data/lines/4.json';
import line5 from './data/lines/5.json';
import line6 from './data/lines/6.json';
import lineK from './data/lines/k.json';
import exits from './data/exits.json';
import history from './data/history.json';
import railway from './data/railway.json';
import transfers from './data/transfers.json';

export const spb: City = {
  id: 'spb',
  bounds: [
    [28.6, 59.3],
    [32.0, 60.5],
  ],
  network: { lines: [line1, line2, line3, line4, line5, line6, lineK], transfers, exits, history },
  railway,
  messages: {
    ru: { noteFuture: 'Будущая сеть — по схеме развития до 2040 года; сроки могут сдвинуться.' },
    en: { noteFuture: 'The future network follows the development plan to 2040; dates may shift.' },
  },
};
