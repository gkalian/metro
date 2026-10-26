"""Write lines/{1..4}.json and transfers.json for the Thessaloniki map.

Usage: py -3 scripts/thessaloniki/gen_lines.py src/cities/thessaloniki/data

Open stations: OSM coordinates. Planned ones: taken off the 2040 plan (georef.py), a few
moved to their landmark. Running times: estimated from distance, calibrated so that
New Railway Station - Nea Elvetia takes the published 17 minutes.
"""
import json
import math
import sys

OUT = sys.argv[1]

OPENED_2024 = 'Открыта 30 ноября 2024 года'
OPENED_2026 = 'Открыта 27 августа 2026 года'
APPROX = 'Координаты приблизительные — сняты со схемы развития до 2040 г.'


def st(id, name, en, el, lat, lon, **kw):
    return {'id': id, 'name': name, 'nameEn': en, 'nameEl': el, 'lat': lat, 'lon': lon, **kw}


def open24(*a):
    return st(*a, status='open', opened=2024, note=OPENED_2024)


def open26(*a):
    return st(*a, status='open', opened=2026, note=OPENED_2026)


def plan(*a, year=2040, note=APPROX):
    kw = {'status': 'project', 'note': note}
    if year:
        kw['opening'] = year
    return st(*a, **kw)


# ---- line 1 -------------------------------------------------------------
trunk = [
    open24('neos-stathmos', 'Новый вокзал', 'New Railway Station', 'Νέος Σιδηροδρομικός Σταθμός', 40.643959, 22.92875),
    open24('dimokratias', 'Димократиас', 'Dimokratias', 'Δημοκρατίας', 40.640979, 22.934454),
    open24('venizelou', 'Венизелу', 'Venizelou', 'Βενιζέλου', 40.636985, 22.942127),
    open24('agias-sofias', 'Агиас Софиас', 'Agias Sofias', 'Αγίας Σοφίας', 40.634693, 22.946521),
    open24('sintrivani', 'Синдривани', 'Sintrivani', 'Σιντριβάνι', 40.630804, 22.954192),
    open24('panepistimio', 'Университет', 'Panepistimio', 'Πανεπιστήμιο', 40.62628, 22.960588),
    open24('papafi', 'Папафи', 'Papafi', 'Παπάφη', 40.619715, 22.963032),
    open24('efkleidis', 'Эфклидис', 'Efkleidis', 'Ευκλείδης', 40.615834, 22.96046),
    open24('fleming', 'Флеминг', 'Fleming', 'Φλέμινγκ', 40.611986, 22.957338),
    open24('analipsi', 'Аналипси', 'Analipsi', 'Ανάληψη', 40.606206, 22.957846),
    open24('25-martiou', '25 марта', '25 Martiou', '25ης Μαρτίου', 40.601075, 22.958531),
    open24('voulgari', 'Вулгари', 'Voulgari', 'Βούλγαρη', 40.595041, 22.960684),
    open24('nea-elvetia', 'Неа Элветия', 'Nea Elvetia', 'Νέα Ελβετία', 40.593266, 22.968856),
]
kalamaria = [
    open26('nomarchia', 'Номархия', 'Nomarchia', 'Νομαρχία', 40.591614, 22.957134),
    open26('kalamaria', 'Каламарья', 'Kalamaria', 'Καλαμαριά', 40.584719, 22.953094),
    open26('aretsou', 'Арецу', 'Aretsou', 'Αρετσού', 40.578399, 22.954467),
    open26('nea-krini', 'Неа Крини', 'Nea Krini', 'Νέα Κρήνη', 40.57194, 22.961413),
    open26('mikra', 'Микра', 'Mikra', 'Μίκρα', 40.567614, 22.966707),
    plan('scholi-polemou', 'Высшая военная школа', 'Anotera Scholi Polemou', 'Ανωτέρα Σχολή Πολέμου', 40.5604, 22.9767,
         note='У Высшей военной школы (ΑΔΙΣΠΟ). Координаты — проектная точка из OpenStreetMap.'),
    plan('patriarchika', 'Патриархика', 'Patriarchika', 'Πατριαρχικά', 40.5545, 22.9906),
    plan('diavalkaniko', 'Диавалканико', 'Diavalkaniko', 'Διαβαλκανικό', 40.5492, 22.9878,
         note='У больницы «Диавалканико». ' + APPROX),
    plan('georgiki-scholi', 'Сельскохозяйственная школа', 'Georgiki Scholi', 'Γεωργική Σχολή', 40.5415, 22.9878,
         note='На южной окраине земель Американской сельскохозяйственной школы. ' + APPROX),
    plan('aerodromio', 'Аэропорт', 'Airport', 'Αεροδρόμιο', 40.5247, 22.9758,
         note='У пассажирского терминала аэропорта «Македония». Координаты приблизительные.'),
    plan('thessintec', 'Центр инноваций и технологий', 'Innovation & Technology Centre',
         'Κέντρο Καινοτομίας & Τεχνολογίας', 40.5125, 22.9444,
         note='Технопарк ThessINTEC. Координаты приблизительные — по OpenStreetMap и схеме развития до 2040 г.'),
]
thermi = [
    plan('thermi', 'Терми', 'Thermi', 'Θέρμη', 40.5505, 23.0155, year=None,
         note='На схеме до 2040 г. — только задел под продление, без срока. Координаты приблизительные.'),
]
northwest = [
    plan('neapoli', 'Неаполи', 'Neapoli', 'Νεάπολη', 40.6510, 22.9356),
    plan('terpsithea', 'Терпсифея', 'Terpsithea', 'Τερψιθέα', 40.6598, 22.9322),
    plan('stavroupoli', 'Ставруполи', 'Stavroupoli', 'Σταυρούπολη', 40.6644, 22.9334),
    plan('polichni', 'Полихни', 'Polichni', 'Πολίχνη', 40.6712, 22.9375),
    plan('efkarpia', 'Эфкарпия', 'Efkarpia', 'Ευκαρπία', 40.6808, 22.9446),
    plan('papageorgiou', 'Больница Папагеоргиу', 'Papageorgiou Hospital', 'Νοσοκομείο Παπαγεωργίου', 40.6752, 22.9612,
         note='У больницы Папагеоргиу, на месте её парковки; там же планируется депо. Координаты приблизительные.'),
]

# ---- line 3 (planned) -----------------------------------------------------
line3 = [
    plan('ano-evosmos', 'Ано Эвосмос', 'Ano Evosmos', 'Άνω Εύοσμος', 40.6852, 22.9169,
         note='Конечная, рядом — депо линии 3. ' + APPROX),
    plan('perifereiaki', 'Периферьяки', 'Perifereiaki', 'Περιφερειακή', 40.6764, 22.9172),
    plan('evosmos', 'Эвосмос', 'Evosmos', 'Εύοσμος', 40.6671, 22.9117),
    plan('menemeni', 'Менемени', 'Menemeni', 'Μενεμένη', 40.6596, 22.9155),
    plan('ampelokipoi', 'Ампелокипи', 'Ampelokipoi', 'Αμπελόκηποι', 40.6538, 22.9227),
    plan('neos-stathmos-3', 'Новый вокзал', 'New Railway Station', 'Νέος Σιδηροδρομικός Σταθμός', 40.6432, 22.9282,
         note='Пересадка на линии 1 и 2. ' + APPROX),
    plan('dimokratias-3', 'Димократиас', 'Dimokratias', 'Δημοκρατίας', 40.6402, 22.9338,
         note='Пересадка на линии 1 и 2. ' + APPROX),
    plan('aristotelous', 'Аристотелус', 'Aristotelous', 'Αριστοτέλους', 40.6336, 22.9414,
         note='На улице Цимиски у площади Аристотеля. Координаты приблизительные.'),
    plan('xanth', 'ХАНФ', 'X.A.N.TH.', 'Χ.Α.Ν.Θ.', 40.6262, 22.9518,
         note='На улице Цимиски у здания ХАНФ (YMCA). Координаты приблизительные.'),
    plan('panepistimio-3', 'Университет', 'Panepistimio', 'Πανεπιστήμιο', 40.6260, 22.9597,
         note='Двухуровневая станция с пересадкой на линии 1 и 2. ' + APPROX),
    plan('agiou-dimitriou', 'Агиу Димитриу', 'Agiou Dimitriou', 'Αγίου Δημητρίου', 40.6184, 22.9665),
    plan('toumpa', 'Тумба', 'Toumpa', 'Τούμπα', 40.6103, 22.9676),
    plan('charilaou', 'Харилау', 'Charilaou', 'Χαριλάου', 40.6029, 22.9697,
         note='У площади Харилау. Координаты приблизительные.'),
    plan('agia-kyriaki', 'Агия Кириаки', 'Agia Kyriaki', 'Αγία Κυριακή', 40.5962, 22.9738),
]
kordelio = [
    plan('ktel', 'КТЕЛ Македония', 'KTEL Makedonia', 'ΚΤΕΛ Μακεδονία', 40.6545, 22.9030,
         note='У междугороднего автовокзала. Координаты приблизительные.'),
    plan('eptanisou', 'Эптанису', 'Eptanisou', 'Επτανήσου', 40.6609, 22.8960),
    plan('kordelio', 'Корделио', 'Kordelio', 'Κορδελιό', 40.6678, 22.8955),
]


def dist(a, b):
    dy = (a['lat'] - b['lat']) * 111_320
    dx = (a['lon'] - b['lon']) * 111_320 * math.cos(math.radians(a['lat']))
    return math.hypot(dx, dy)


# Calibration: a fixed part per stop (dwell, braking, starting) plus distance at cruising speed;
# track is longer than the straight line between stations.
PER_STOP = 40
WIND = 1.15
total = sum(dist(a, b) for a, b in zip(trunk, trunk[1:])) * WIND
SPEED = total / (17 * 60 - PER_STOP * (len(trunk) - 1))


def secs(a, b):
    return round((PER_STOP + dist(a, b) * WIND / SPEED) / 10) * 10


def chain(stations):
    for a, b in zip(stations, stations[1:]):
        a['toNext'] = secs(a, b)
        a['toNextEstimated'] = True
    return stations


def branch(frm, stations, **kw):
    return {'from': frm['id'], 'time': secs(frm, stations[0]), 'timeEstimated': True, **kw, 'stations': chain(stations)}


def ref(station, nxt):
    """A station of another line that this line also runs through."""
    return {'ref': station['id'], 'toNext': secs(station, nxt), 'toNextEstimated': True}


def through(shared, own):
    """Shared stations, then the line's own: times along the shared part are the owner's track."""
    stops = shared + own
    return [ref(a, b) for a, b in zip(shared, stops[1:])] + chain(own)


line1 = {
    'id': '1',
    'name': 'Новый вокзал — Неа Элветия',
    'nameEn': 'New Railway Station — Nea Elvetia',
    'nameEl': 'Νέος Σιδηροδρομικός Σταθμός — Νέα Ελβετία',
    'color': '#E3242B',
    'stations': chain(trunk),
}
line2 = {
    'id': '2',
    'name': 'Новый вокзал — Микра',
    'nameEn': 'New Railway Station — Mikra',
    'nameEl': 'Νέος Σιδηροδρομικός Σταθμός — Μίκρα',
    'color': '#1F5FC4',
    # runs on line 1's track from New Railway Station to 25 Martiou, through, without a change
    'since': 2026,
    'stations': through(trunk[:11], kalamaria),
    'branches': [branch(kalamaria[6], thermi)],
}
line3 = {
    'id': '3',
    'name': 'Ано Эвосмос — Агия Кириаки',
    'nameEn': 'Ano Evosmos — Agia Kyriaki',
    'nameEl': 'Άνω Εύοσμος — Αγία Κυριακή',
    'color': '#1E9E57',
    'stations': chain(line3),
    'branches': [branch(line3[4], kordelio)],
}
line4 = {
    'id': '4',
    'name': 'Димократиас — Больница Папагеоргиу',
    'nameEn': 'Dimokratias — Papageorgiou Hospital',
    'nameEl': 'Δημοκρατίας — Νοσοκομείο Παπαγεωργίου',
    'color': '#F2B300',
    'stations': through(trunk[1:2], northwest),
}

transfers = [
    {'a': 'neos-stathmos', 'b': 'neos-stathmos-3', 'time': 180},
    {'a': 'dimokratias', 'b': 'dimokratias-3', 'time': 180},
    {'a': 'panepistimio', 'b': 'panepistimio-3', 'time': 120},
]


def dump(path, data):
    with open(path, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')


for line in (line1, line2, line3, line4):
    dump(f"{OUT}/lines/{line['id']}.json", line)
dump(f'{OUT}/transfers.json', transfers)

print(f'speed {SPEED * 3.6:.1f} km/h')
print('NRS-Nea Elvetia', sum(s['toNext'] for s in line1['stations'][:-1]) / 60)
print('NRS-Mikra', sum(s['toNext'] for s in line2['stations'][:15]) / 60)
