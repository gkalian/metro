import type { CityData } from '../../core/city.ts';
import line1 from './data/lines/1.json' with { type: 'json' };
import line2 from './data/lines/2.json' with { type: 'json' };
import line3 from './data/lines/3.json' with { type: 'json' };
import line4 from './data/lines/4.json' with { type: 'json' };
import transfers from './data/transfers.json' with { type: 'json' };

/** Lines 1–4 from `scripts/thessaloniki/gen_lines.py`; no rail, exits or lost track. */
export const data: CityData = {
  network: { lines: [line1, line2, line3, line4], transfers },
};
