import type { CityData } from '../../core/city.ts';
import line1 from './data/lines/1.json' with { type: 'json' };
import line2 from './data/lines/2.json' with { type: 'json' };
import line3 from './data/lines/3.json' with { type: 'json' };
import line4 from './data/lines/4.json' with { type: 'json' };
import line5 from './data/lines/5.json' with { type: 'json' };
import line6 from './data/lines/6.json' with { type: 'json' };
import lineK from './data/lines/k.json' with { type: 'json' };
import exits from './data/exits.json' with { type: 'json' };
import history from './data/history.json' with { type: 'json' };
import railway from './data/railway.json' with { type: 'json' };
import transfers from './data/transfers.json' with { type: 'json' };

export const data: CityData = {
  network: { lines: [line1, line2, line3, line4, line5, line6, lineK], transfers, exits, history },
  railway,
};
