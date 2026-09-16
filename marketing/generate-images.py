import subprocess, os

OUT = '/home/mushir/perso/fishing-tracker/marketing'
os.makedirs(OUT, exist_ok=True)

DEEP  = '#07304f'
DEEP2 = '#0a4a72'
CYAN  = '#22d3ee'
BLUE  = '#0ea5e9'
WHITE = '#ffffff'
SAND  = '#fbbf24'
FONT  = 'DejaVu Sans'

def mix(c1, c2, f):
    """Blend two hex colours. The SVG renderer ignores opacity, so every
    'transparent' tone is precomputed here."""
    a = tuple(int(c1[i:i+2], 16) for i in (1, 3, 5))
    b = tuple(int(c2[i:i+2], 16) for i in (1, 3, 5))
    return '#%02x%02x%02x' % tuple(round(a[j] + (b[j] - a[j]) * f) for j in range(3))

CARD   = '#0d4568'
WAVE_C = '#1a6f9c'
WAVE_B = '#15597f'
RING   = '#1c7ba6'

def fish(fill=CYAN, fin=BLUE, eye=DEEP):
    return f'''<g>
    <path d="M -88,0 C -68,-46 -6,-62 44,-34 C 68,-20 84,-8 96,0 C 84,8 68,20 44,34 C -6,62 -68,46 -88,0 Z" fill="{fill}"/>
    <path d="M -86,0 L -132,-42 L -118,0 L -132,42 Z" fill="{fin}"/>
    <path d="M -24,-46 C -4,-76 34,-78 50,-54 C 22,-57 2,-52 -24,-46 Z" fill="{fin}"/>
    <path d="M -22,42 C -8,62 16,62 28,48 C 8,47 -6,45 -22,42 Z" fill="{fin}"/>
    <circle cx="58" cy="-12" r="8.5" fill="{eye}"/>
  </g>'''

def wave(y, width, color, amp=14, period=200, stroke=9, opacity=0.35, x0=0):
    d, x = f'M {x0},{y} ', x0
    while x < width + period:
        d += f'q {period/4},{-amp} {period/2},0 q {period/4},{amp} {period/2},0 '
        x += period
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{stroke}" stroke-linecap="round"/>'

def bg_bands(w, h, top=DEEP2, bottom=DEEP, steps=24):
    """Vertical fade built from solid bands (the renderer ignores gradients)."""
    t = tuple(int(top[i:i+2], 16) for i in (1, 3, 5))
    b = tuple(int(bottom[i:i+2], 16) for i in (1, 3, 5))
    out = []
    for i in range(steps):
        f = i / (steps - 1)
        c = '#%02x%02x%02x' % tuple(round(t[j] + (b[j] - t[j]) * f) for j in range(3))
        out.append(f'<rect x="0" y="{h*i/steps:.1f}" width="{w}" height="{h/steps+1:.1f}" fill="{c}"/>')
    return '\n  '.join(out)

def text(x, y, s, size, fill=WHITE, weight='bold', anchor='middle', family=FONT):
    s = s.replace('&', '&amp;')
    return (f'<text x="{x}" y="{y}" text-anchor="{anchor}" font-family="{family}" '
            f'font-weight="{weight}" font-size="{size}" fill="{fill}">{s}</text>')

def render(name, svg):
    open(f'{name}.svg', 'w').write(svg)
    subprocess.run(['convert', f'{name}.svg', f'{OUT}/{name}.png'], check=True)
    print('wrote', name)

# ------------------------------------------------ 1. profile picture 1080
S = 1080
profile = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{S}" height="{S}" viewBox="0 0 {S} {S}">
  {bg_bands(S, S)}
  <circle cx="540" cy="540" r="474" fill="none" stroke="{RING}" stroke-width="12"/>
  {wave(908, S, WAVE_C, 15, 230, 10)}
  {wave(958, S, WAVE_B, 13, 260, 10)}
  <g transform="translate(545,395) scale(2.2)">{fish()}</g>
  {text(540, 645, 'FISHING', 102)}
  {text(540, 752, 'TRACKER', 102, CYAN)}
  {text(540, 830, 'MAURITIUS', 46, SAND, 'normal')}
</svg>'''
render('01-profile-picture', profile)

# ------------------------------------------------ icons
def icon_layers(c=CYAN, c2=BLUE):
    return f'''<g>
      <rect x="-42" y="-34" width="84" height="20" rx="6" fill="{c}"/>
      <rect x="-42" y="-8"  width="84" height="20" rx="6" fill="{c2}"/>
      <rect x="-42" y="18"  width="84" height="20" rx="6" fill="#1f9fc4"/>
    </g>'''

def icon_people(c=CYAN, c2=BLUE):
    return f'''<g>
      <circle cx="-26" cy="-18" r="17" fill="{c}"/>
      <path d="M -52,26 a 26,26 0 0 1 52,0 z" fill="{c}"/>
      <circle cx="26" cy="-14" r="14" fill="{c2}"/>
      <path d="M 4,26 a 22,22 0 0 1 44,0 z" fill="{c2}"/>
    </g>'''

def icon_trophy(c=SAND):
    return f'''<g>
      <path d="M -26,-36 L 26,-36 L 22,4 a 22,22 0 0 1 -44,0 Z" fill="{c}"/>
      <path d="M -26,-28 h -16 a 18,18 0 0 0 18,26" fill="none" stroke="{c}" stroke-width="8"/>
      <path d="M 26,-28 h 16 a 18,18 0 0 1 -18,26" fill="none" stroke="{c}" stroke-width="8"/>
      <rect x="-6" y="22" width="12" height="18" fill="{c}"/>
      <rect x="-24" y="38" width="48" height="12" rx="4" fill="{c}"/>
    </g>'''

def badge(x, y, w, h, label, size, fill='#ffffff', bg=CYAN, text_fill=DEEP):
    return (f'<rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" rx="{h/2}" fill="{bg}"/>'
            + text(x, y + size*0.35, label, size, text_fill))

# ------------------------------------------------ 2. cover photo 1640x924
def badge_row(cx, y, items, size=36, gap=28, h=76):
    """Pill badges laid out in a centred row, each sized to its label."""
    widths = [len(label) * size * 0.62 + 64 for label, _ in items]
    total = sum(widths) + gap * (len(items) - 1)
    x = cx - total / 2
    out = []
    for (label, bg), w in zip(items, widths):
        out.append(badge(x + w / 2, y, w, h, label, size, bg=bg))
        x += w + gap
    return '\n  '.join(out)

W, H = 1640, 924
cover = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  {bg_bands(W, H)}
  {wave(800, W, WAVE_C, 16, 320, 8)}
  {wave(858, W, WAVE_B, 14, 360, 8)}
  <g transform="translate(820,200) scale(0.92)">{fish()}</g>
  {text(820, 388, 'FISHING TRACKER PRO', 72)}
  {text(820, 452, 'Lapes dan Moris - tou dan enn sel plas', 40, CYAN, 'normal')}
  {badge_row(820, 560, [('Kondision lamer live', CYAN), ('Kree sorti lapes', SAND), ('Top 5 pesker', CYAN)])}
  {text(820, 672, 'Enskri gratis - lapes pli malin, pa pli difisil', 38, WHITE, 'normal')}
</svg>'''
render('02-cover-photo', cover)

# ------------------------------------------------ 3. new features post 1200
P = 1200
def feature_row(y, icon_svg, title_txt, sub_txt):
    return f'''<rect x="90" y="{y-78}" width="1020" height="156" rx="26" fill="{CARD}"/>
  <g transform="translate(190,{y})">{icon_svg}</g>
  {text(300, y - 12, title_txt, 50, WHITE, 'bold', 'start')}
  {text(300, y + 44, sub_txt, 34, CYAN, 'normal', 'start')}'''

features = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{P}" height="{P}" viewBox="0 0 {P} {P}">
  {bg_bands(P, P)}
  {wave(1105, P, WAVE_C, 14, 300, 8)}
  {badge(600, 120, 260, 72, 'NOUVO !', 44, bg=SAND)}
  {text(600, 240, '3 NOUVO KITSOZ', 78)}
  {text(600, 320, 'LOR FISHING TRACKER', 64, CYAN)}
  {feature_row(480, icon_layers(), 'Plizir tip lapes', 'Enn sel sorti - tou to bann teknik')}
  {feature_row(660, icon_people(), 'Kree to sorti lapes', 'Dir kot ek kan - lezot kapav zwenn twa')}
  {feature_row(840, icon_trophy(), 'Top 5 pesker', 'Klasman sak semenn ek sak mwa')}
  {text(600, 990, 'Enskri GRATIS lor Fishing Tracker Pro', 44, WHITE)}
  <g transform="translate(600,1065) scale(0.42)">{fish()}</g>
</svg>'''
render('03-post-new-features', features)

# ------------------------------------------------ 4. leaderboard post 1200
def podium(cx, base, w, h, place, color, name_size=40):
    return f'''<rect x="{cx-w/2}" y="{base-h}" width="{w}" height="{h}" rx="14" fill="{color}"/>
  {text(cx, base - h + 62, place, 56, DEEP)}'''

leader = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{P}" height="{P}" viewBox="0 0 {P} {P}">
  {bg_bands(P, P)}
  {wave(1110, P, WAVE_C, 14, 300, 8)}
  <g transform="translate(600,150) scale(0.78)">{icon_trophy()}</g>
  {text(600, 300, 'TOP 5 PESKER', 92)}
  {text(600, 366, 'Sak semenn ek sak mwa', 44, CYAN, 'normal')}
  {podium(420, 700, 190, 150, '2', '#cbd5e1')}
  {podium(600, 700, 190, 230, '1', SAND)}
  {podium(780, 700, 190, 110, '3', '#d8a05a')}
  <rect x="320" y="700" width="560" height="16" rx="8" fill="{RING}"/>
  {badge_row(600, 800, [('Plis sorti', CYAN), ('Plis pwason', CYAN)], size=38)}
  {badge_row(600, 892, [('Plis tip lapes', SAND), ('Plis lapat', SAND)], size=38)}
  {text(600, 1010, 'Log to bann lapes - monte dan klasman', 42, WHITE)}
</svg>'''
render('04-post-leaderboard', leader)

# ------------------------------------------------ 5. events post 1200
def event_line(y, day, place, kind):
    return f'''<rect x="120" y="{y-52}" width="960" height="104" rx="22" fill="{CARD}"/>
  <rect x="120" y="{y-52}" width="14" height="104" rx="7" fill="{CYAN}"/>
  {text(170, y - 6, day, 40, WHITE, 'bold', 'start')}
  {text(170, y + 36, place, 30, CYAN, 'normal', 'start')}
  {badge(940, y, 230, 58, kind, 30, bg=SAND)}'''

events_post = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{P}" height="{P}" viewBox="0 0 {P} {P}">
  {bg_bands(P, P)}
  {wave(1115, P, WAVE_C, 14, 300, 8)}
  <g transform="translate(600,140) scale(0.85)">{icon_people()}</g>
  {text(600, 280, 'KI PE AL PESER ?', 84)}
  {text(600, 348, 'Dir kot ek kan - lezot pesker zwenn twa', 36, CYAN, 'normal')}
  {event_line(470, 'Samdi 6h - Grand Baie', 'Casting + Jigging', '4 pe vini')}
  {event_line(600, 'Dimans 5h30 - Blue Bay', 'Trolling lor bato', '2 pe vini')}
  {event_line(730, 'Merkredi 17h - Belle Mare', 'Couler depi laplaz', '3 pe vini')}
  {badge(600, 880, 620, 86, 'Kree to sorti lapes gratis', 42, bg=CYAN)}
  {text(600, 1000, 'Fishing Tracker Pro', 44, WHITE)}
</svg>'''
render('05-post-events', events_post)

# ------------------------------------------------ 6. link preview 1200x630
LW, LH = 1200, 630
preview = f'''<svg xmlns="http://www.w3.org/2000/svg" width="{LW}" height="{LH}" viewBox="0 0 {LW} {LH}">
  {bg_bands(LW, LH)}
  {wave(560, LW, WAVE_C, 12, 280, 8)}
  <g transform="translate(600,150) scale(0.78)">{fish()}</g>
  {text(600, 300, 'FISHING TRACKER PRO', 68)}
  {text(600, 360, 'Lapes dan Moris - tou dan enn sel plas', 36, CYAN, 'normal')}
  {badge_row(600, 450, [('Sorti lapes', CYAN), ('Top 5 pesker', SAND), ('Kondision live', CYAN)], size=32)}
</svg>'''
render('06-link-preview', preview)
