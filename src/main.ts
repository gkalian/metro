import { CITIES } from './cities';
import { start } from './core/start';

// the page names its city (see core/pages.ts); the data comes in a chunk of its own
const city = CITIES.find((c) => c.id === document.documentElement.dataset.city) ?? CITIES[0]!;
city.load().then((data) => start(city, data));
