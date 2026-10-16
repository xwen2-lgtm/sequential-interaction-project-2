"""Generates the four flower-shop back-wall backgrounds in docs/assets/backgrounds/.

Run: python3 tools/make_backgrounds.py
The counter is drawn over the lower middle of these images, so the details sit
along the top and the two sides. Wordless, flat shapes, 1600x1000.
"""
import os

W, H, FLOOR = 1600, 1000, 820
OUT = os.path.join(os.path.dirname(__file__), '..', 'docs', 'assets', 'backgrounds')


def svg(body, title):
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 %d %d" preserveAspectRatio="xMidYMid slice">\n'
            '<title>%s</title>\n%s\n</svg>\n' % (W, H, title, body))


def flower(cx, cy, r, petal, core):
    p = ''.join('<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (cx + dx * r, cy + dy * r, r, petal)
                for dx, dy in ((0, -1), (1, 0), (0, 1), (-1, 0)))
    return p + '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="%s"/>' % (cx, cy, r * 0.75, core)


def pot_plant(x, base, w, pot, stem, petals, core, n=3, h=90):
    """a pot with n flowers on stems; x is the pot centre, base its bottom"""
    top = base - w * 0.8
    s = '<path d="M%.1f %.1f H%.1f L%.1f %.1f H%.1f Z" fill="%s"/>' % (
        x - w / 2, top, x + w / 2, x + w * 0.36, base, x - w * 0.36, pot)
    s += '<rect x="%.1f" y="%.1f" width="%.1f" height="%.1f" rx="4" fill="%s" opacity=".55"/>' % (
        x - w / 2 - 4, top - 6, w + 8, 12, pot)
    for i in range(n):
        fx = x + (i - (n - 1) / 2) * w * 0.32
        fy = top - h + (i % 2) * 22
        s += '<path d="M%.1f %.1f Q%.1f %.1f %.1f %.1f" stroke="%s" stroke-width="4" fill="none"/>' % (
            x + (i - (n - 1) / 2) * 6, top, fx - 6, (top + fy) / 2, fx, fy, stem)
        s += '<ellipse cx="%.1f" cy="%.1f" rx="12" ry="6" fill="%s" transform="rotate(-30 %.1f %.1f)"/>' % (
            (x + fx) / 2 + 8, (top + fy) / 2 + 10, stem, (x + fx) / 2 + 8, (top + fy) / 2 + 10)
        s += flower(fx, fy, w * 0.11, petals[i % len(petals)], core)
    return s


def vase(x, base, w, h, col, stem, petal, core):
    s = '<path d="M%.1f %.1f C%.1f %.1f %.1f %.1f %.1f %.1f H%.1f C%.1f %.1f %.1f %.1f %.1f %.1f Z" fill="%s"/>' % (
        x - w * 0.25, base - h, x - w * 0.7, base - h * 0.6, x - w * 0.6, base, x - w * 0.3, base,
        x + w * 0.3, x + w * 0.6, base, x + w * 0.7, base - h * 0.6, x + w * 0.25, base - h, col)
    for dx, dy in ((-14, -70), (0, -95), (16, -62)):
        s += '<path d="M%.1f %.1f L%.1f %.1f" stroke="%s" stroke-width="3"/>' % (x, base - h, x + dx, base - h + dy, stem)
        s += flower(x + dx, base - h + dy, 9, petal, core)
    return s


def shelf(x, y, w, col, depth=14):
    return '<rect x="%d" y="%d" width="%d" height="%d" rx="3" fill="%s"/>' % (x, y, w, depth, col)


def floor_and_wall(wall, floor, base, extra=''):
    return ('<rect width="%d" height="%d" fill="%s"/>' % (W, H, wall) + extra +
            '<rect y="%d" width="%d" height="%d" fill="%s"/>' % (FLOOR, W, H - FLOOR, floor) +
            '<rect y="%d" width="%d" height="18" fill="%s"/>' % (FLOOR - 18, W, base))


def pendant(x, cord, shade, glow):
    return ('<line x1="%d" y1="0" x2="%d" y2="120" stroke="%s" stroke-width="3"/>' % (x, x, cord) +
            '<path d="M%d 120 h60 l30 50 h-120 Z" fill="%s"/>' % (x - 30, shade) +
            '<ellipse cx="%d" cy="176" rx="40" ry="10" fill="%s" opacity=".7"/>' % (x, glow))


def purple():
    P = dict(wall='#B9A7E0', wains='#9C87D3', floor='#6E5AA8', base='#5A4791', wood='#5A4791',
             light='#F6EEFF', pots='#7A64B8', stem='#4E7D5B')
    s = floor_and_wall(P['wall'], P['floor'], P['base'],
                       '<rect y="560" width="%d" height="%d" fill="%s"/>' % (W, FLOOR - 560, P['wains']) +
                       ''.join('<rect x="%d" y="590" width="150" height="200" rx="6" fill="none" stroke="%s" stroke-width="4" opacity=".6"/>'
                               % (x, P['light']) for x in range(40, W, 190)))
    # arched window on the right with a night sky
    s += ('<path d="M1210 520 V250 A150 150 0 0 1 1510 250 V520 Z" fill="#3B2F66"/>'
          '<path d="M1360 100 V520 M1210 330 H1510" stroke="%s" stroke-width="10"/>' % P['light'] +
          '<path d="M1210 520 V250 A150 150 0 0 1 1510 250 V520 Z" fill="none" stroke="%s" stroke-width="12"/>' % P['light'] +
          '<circle cx="1440" cy="190" r="22" fill="#FFF6C8"/>' +
          ''.join('<circle cx="%d" cy="%d" r="3" fill="#FFF6C8"/>' % (x, y) for x, y in ((1260, 210), (1300, 280), (1420, 290), (1470, 400), (1250, 430))) +
          '<rect x="1190" y="520" width="340" height="24" rx="6" fill="%s"/>' % P['light'] +
          pot_plant(1270, 520, 70, P['pots'], P['stem'], ['#F6EEFF', '#F7B2D0'], '#FFE37A') +
          pot_plant(1450, 520, 70, P['pots'], P['stem'], ['#F7B2D0', '#F6EEFF'], '#FFE37A'))
    # string lights across the top
    s += '<path d="M0 60 Q400 140 800 70 T1600 80" stroke="%s" stroke-width="3" fill="none"/>' % P['base']
    for i in range(1, 16):
        t = i / 16
        x = t * W
        y = 60 + 60 * (1 - (2 * t - 1) ** 2) * (1 if t < .5 else .3) + 10
        s += '<circle cx="%.0f" cy="%.0f" r="9" fill="#FFF1A8"/><circle cx="%.0f" cy="%.0f" r="18" fill="#FFF1A8" opacity=".25"/>' % (x, y, x, y)
    # left shelving
    s += '<rect x="60" y="180" width="320" height="380" rx="10" fill="%s" opacity=".35"/>' % P['wood']
    for y in (300, 440, 560):
        s += shelf(60, y, 320, P['wood'])
    s += pot_plant(130, 300, 60, P['pots'], P['stem'], ['#F7B2D0'], '#FFE37A', 2, 70)
    s += vase(300, 300, 50, 60, P['light'], P['stem'], '#C9A7F5', '#FFE37A')
    s += vase(140, 440, 50, 70, P['pots'], P['stem'], '#F6EEFF', '#FFE37A')
    s += pot_plant(290, 440, 64, P['light'], P['stem'], ['#C9A7F5', '#F7B2D0', '#F6EEFF'], '#FFE37A')
    s += pendant(560, P['base'], P['light'], '#FFF1A8') + pendant(1040, P['base'], P['light'], '#FFF1A8')
    return svg(s, 'Flower shop background: purple boutique')


def pink():
    P = dict(wall='#F8D3DD', stripe='#F2BFCD', floor='#E7A9BB', base='#D88AA2', wood='#C9768F',
             awn='#E8829F', white='#FFFFFF', stem='#5E9A6A', pots='#FFFFFF')
    stripes = ''.join('<rect x="%d" y="0" width="40" height="%d" fill="%s"/>' % (x, FLOOR, P['stripe']) for x in range(0, W, 80))
    s = floor_and_wall(P['wall'], P['floor'], P['base'], stripes)
    # scalloped awning along the top
    for i in range(0, W, 100):
        s += '<rect x="%d" y="0" width="100" height="90" fill="%s"/>' % (i, P['awn'] if (i // 100) % 2 == 0 else P['white'])
        s += '<path d="M%d 90 A50 34 0 0 0 %d 90 Z" fill="%s"/>' % (i, i + 100, P['awn'] if (i // 100) % 2 == 0 else P['white'])
    # square window with a flower box on the right
    s += ('<rect x="1220" y="200" width="290" height="270" rx="8" fill="#D9F1FF"/>'
          '<path d="M1365 200 V470 M1220 335 H1510" stroke="#FFFFFF" stroke-width="10"/>'
          '<rect x="1220" y="200" width="290" height="270" rx="8" fill="none" stroke="#FFFFFF" stroke-width="14"/>'
          '<path d="M1205 200 Q1250 330 1220 470 M1525 200 Q1480 330 1510 470" stroke="%s" stroke-width="18" fill="none" opacity=".8"/>' % P['awn'] +
          '<rect x="1205" y="470" width="320" height="50" rx="8" fill="%s"/>' % P['wood'])
    for i, x in enumerate(range(1235, 1510, 45)):
        s += flower(x, 460 - (i % 2) * 14, 12, ['#FFFFFF', '#FF8FB1', '#FFE37A'][i % 3], '#F7B500')
    # hanging baskets
    for x in (560, 1040):
        s += ('<path d="M%d 90 L%d 220 M%d 90 L%d 220" stroke="%s" stroke-width="3"/>' % (x, x - 40, x, x + 40, P['wood']) +
              '<path d="M%d 220 h100 q-10 50 -50 50 q-40 0 -50 -50 Z" fill="%s"/>' % (x - 50, P['wood']) +
              ''.join(flower(x + dx, 214 + dy, 11, c, '#F7B500') for dx, dy, c in ((-30, -4, '#FFFFFF'), (0, -14, '#FF8FB1'), (30, -4, '#FFFFFF'))) +
              '<path d="M%d 250 q-14 40 4 70 M%d 250 q14 40 -4 70" stroke="%s" stroke-width="4" fill="none"/>' % (x - 34, x + 34, P['stem']))
    # left: a small cabinet with plants
    s += '<rect x="70" y="420" width="300" height="380" rx="12" fill="%s"/>' % P['white']
    s += '<rect x="90" y="560" width="120" height="220" rx="8" fill="%s"/><rect x="230" y="560" width="120" height="220" rx="8" fill="%s"/>' % (P['stripe'], P['stripe'])
    s += pot_plant(140, 420, 70, P['awn'], P['stem'], ['#FFFFFF', '#FF8FB1', '#FFFFFF'], '#F7B500')
    s += vase(290, 420, 54, 70, P['stripe'], P['stem'], '#FF8FB1', '#F7B500')
    return svg(s, 'Flower shop background: pink cottage')


def mint():
    P = dict(wall='#CDEFE1', tile='#B4E3CF', floor='#8CCBB1', base='#6FB497', wood='#B98A5C', board='#2F4F46',
             chalk='#EAF7F1', stem='#3E8A5E')
    tiles = ''.join('<line x1="0" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="3"/>' % (y, W, y, P['tile']) for y in range(40, FLOOR, 60))
    tiles += ''.join('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="3"/>'
                     % (x + (30 if (y // 60) % 2 else 0), y, x + (30 if (y // 60) % 2 else 0), y + 60, P['tile'])
                     for y in range(40, FLOOR - 60, 60) for x in range(0, W, 120))
    s = floor_and_wall(P['wall'], P['floor'], P['base'], tiles)
    # bunting
    s += '<path d="M0 40 Q800 120 1600 40" stroke="%s" stroke-width="3" fill="none"/>' % P['board']
    cols = ['#FF9AA2', '#FFDAC1', '#FFFFFF', '#B5EAD7', '#C7CEEA']
    for i in range(18):
        t = (i + .5) / 18
        x = t * W
        y = 40 + 80 * (1 - (2 * t - 1) ** 2) * .5 + 2
        s += '<path d="M%.0f %.0f h56 l-28 50 Z" fill="%s"/>' % (x - 28, y, cols[i % len(cols)])
    # chalkboard with a flower doodle, top left
    s += ('<rect x="80" y="170" width="300" height="220" rx="10" fill="%s" stroke="%s" stroke-width="14"/>' % (P['board'], P['wood']) +
          '<g fill="none" stroke="%s" stroke-width="4" stroke-linecap="round">' % P['chalk'] +
          '<circle cx="230" cy="250" r="22"/><circle cx="230" cy="208" r="20"/><circle cx="272" cy="250" r="20"/>'
          '<circle cx="230" cy="292" r="20"/><circle cx="188" cy="250" r="20"/><path d="M230 312 V360 M230 340 q24 -18 40 -6"/></g>')
    # crates of flowers on the floor at both sides
    for x0 in (60, 1300):
        s += '<rect x="%d" y="640" width="240" height="180" rx="6" fill="%s"/>' % (x0, P['wood'])
        s += ''.join('<rect x="%d" y="%d" width="240" height="10" fill="#9C7146"/>' % (x0, y) for y in (690, 740, 790))
        for i, dx in enumerate(range(30, 240, 42)):
            s += '<path d="M%d 640 V%d" stroke="%s" stroke-width="4"/>' % (x0 + dx, 560 + (i % 2) * 24, P['stem'])
            s += flower(x0 + dx, 560 + (i % 2) * 24, 13, cols[i % len(cols)] if cols[i % len(cols)] != '#FFFFFF' else '#FFF3B0', '#F2A541')
    # shelf on the right with jars
    s += shelf(1240, 420, 300, P['wood'], 16)
    for i, x in enumerate((1290, 1390, 1490)):
        s += vase(x, 420, 46, 60, ['#FFFFFF', '#B5EAD7', '#FFDAC1'][i], P['stem'], ['#FF9AA2', '#C7CEEA', '#FF9AA2'][i], '#F2A541')
    return svg(s, 'Flower shop background: mint market')


def cream():
    P = dict(wall='#F4ECDD', wains='#E9DDC6', floor='#CBB89A', plank='#BCA784', base='#D8C8A8', wood='#B08D62',
             stem='#6E8B5E', vase1='#FFFFFF', vase2='#D9CBB2')
    planks = ''.join('<line x1="0" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="3"/>' % (y, W, y, P['plank']) for y in range(FLOOR + 45, H, 45))
    s = floor_and_wall(P['wall'], P['floor'], P['base'],
                       '<rect y="620" width="%d" height="%d" fill="%s"/>' % (W, FLOOR - 620, P['wains']) +
                       ''.join('<line x1="%d" y1="620" x2="%d" y2="%d" stroke="%s" stroke-width="3"/>' % (x, x, FLOOR, P['base']) for x in range(40, W, 80)))
    s += planks
    # floating shelves on the left
    for y, items in ((300, (('v', 120, P['vase1'], '#F2B6B6'), ('v', 220, P['vase2'], '#FFFFFF'), ('v', 320, P['vase1'], '#E8C77A'))),
                     (470, (('p', 150, P['vase2'], '#F2B6B6'), ('v', 290, P['vase1'], '#C8B6E2')))):
        s += shelf(70, y, 320, P['wood'])
        for kind, x, col, pet in items:
            s += vase(x, y, 42, 56, col, P['stem'], pet, '#E8B04A') if kind == 'v' else pot_plant(x, y, 64, col, P['stem'], [pet, '#FFFFFF'], '#E8B04A', 3, 70)
    # round mirror on the right
    s += ('<circle cx="1360" cy="300" r="120" fill="%s"/>' % P['wood'] +
          '<circle cx="1360" cy="300" r="104" fill="#EEF3F2"/>'
          '<path d="M1300 250 l60 -50 M1310 300 l90 -80" stroke="#FFFFFF" stroke-width="10" stroke-linecap="round" opacity=".8"/>')
    # tall plant in a basket, right corner
    s += '<path d="M1380 820 L1400 660 H1540 L1560 820 Z" fill="%s"/>' % P['wood']
    for i in range(7):
        a = -60 + i * 20
        s += '<path d="M1470 660 Q%d %d %d %d" stroke="%s" stroke-width="5" fill="none"/>' % (1470 + a, 560, 1470 + a * 2.2, 470 + abs(a), P['stem'])
        s += '<ellipse cx="%d" cy="%d" rx="34" ry="12" fill="%s" transform="rotate(%d %d %d)"/>' % (
            1470 + a * 2.2, 470 + abs(a), P['stem'], a, 1470 + a * 2.2, 470 + abs(a))
    s += pendant(800, P['wood'], P['vase1'], '#FFF1C9')
    return svg(s, 'Flower shop background: neutral cream')


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for name, fn in (('purple', purple), ('pink', pink), ('mint', mint), ('cream', cream)):
        with open(os.path.join(OUT, name + '.svg'), 'w') as f:
            f.write(fn())
        print('wrote', name + '.svg')
