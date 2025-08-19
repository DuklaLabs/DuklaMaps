import re
from flask import Flask, render_template, jsonify, request
from getWay import get_way, locate_wc
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html', start="start")

@app.route('/start:<string:start>', defaults={'destination': None}) # otevírá mapu s přednastavenými hodnotami
@app.route('/start:<string:start>,end:<string:destination>')
def navigate(start, destination):
    if destination:
        return render_template('index.html', start=start, destination=destination)
    else:
        return render_template('index.html', start=start)

@app.route('/jsons') # poskytuje seznamy tříd, učitelů a místností
def get_json():
    with open('timetableData/classes.json', encoding='utf-8') as json_file:
        classes = json.load(json_file)
        
    with open('timetableData/teachers.json', encoding='utf-8') as json_file:
        teachers = json.load(json_file)

    with open('timetableData/rooms.json', encoding='utf-8') as json_file:
        rooms = json.load(json_file)
    
    return jsonify(classes, teachers, rooms)

@app.route('/<string:category>/<string:name>') # poskytuje rozvrh
def get_info(category, name):
    with open(f'timetableData/{category}/{name}/actual.json', encoding='utf-8') as json_file:
        actual = json.load(json_file)

    with open(f'timetableData/{category}/{name}/next.json', encoding='utf-8') as json_file:
        next = json.load(json_file)

    with open(f'timetableData/{category}/{name}/permanent.json', encoding='utf-8') as json_file:
        permanent = json.load(json_file)

    return jsonify(actual, next, permanent)

@app.route('/route/<string:start>-<string:destination>') # získává trasu
def get_route(start, destination):
    way = get_way(start, destination)
    print("requested path: ", way)  # Print the way to the console
    return jsonify(way)

@app.route('/locate_wc/<string:start>') # získává nejbližší WC
def find_wc(start):
    wc = locate_wc(start)
    print("nearest wc: ", wc)  # Print the nearest WC to the console
    return jsonify(wc)

@app.route('/data') # poskytuje odkazy na dokumenty, přidělení kabinetů učitelům a šaten a kmenových učeben třídám
def get_data():
    with open('static/data.json', encoding='utf-8') as json_file:
        data = json.load(json_file)
    return jsonify(data)

@app.route('/getTimetable/<string:type>/<string:name>/<string:week>') # poskytuje rozvrh
def get_timetable(type, name, week):
    with open(f'timetableData/{type}/{name}/{week}.json', encoding='utf-8') as json_file:
        timetable = json.load(json_file)
    return jsonify(timetable)

# --- HOST DEFAULTS (můžeš časem přesunout do JSONu) ---
IDLE_SCREENS = {
    "Room104": {"kind": "IDLE"},
    "Room106": {"kind": "IDLE"},
    "Room108": {"kind": "IDLE"},
    "Room111": {"kind": "IDLE"},
    "Room113": {"kind": "IDLE"},
    "Room115": {"kind": "IDLE"},
    "Room117": {"kind": "IDLE"},
    "Room118": {"kind": "IDLE"},
    "Room201": {"kind": "IDLE"},
    "Room203": {"kind": "IDLE"},
    "Room205": {"kind": "IDLE"},
    "Room206": {"kind": "IDLE"},
    "Room207": {"kind": "IDLE"},
    "Room210": {"kind": "IDLE"},
    "Room212": {"kind": "IDLE"},
    "Room213": {"kind": "IDLE"},
    "Room215": {"kind": "IDLE"},
    "Room216": {"kind": "IDLE"},
    "Room220": {"kind": "IDLE"},
    "Room302": {"kind": "IDLE"},
    "Room304": {"kind": "IDLE"},
    "Room306": {"kind": "IDLE"},
    "Room307": {"kind": "IDLE"},
    "Room308": {"kind": "IDLE"},
    "Room311": {"kind": "IDLE"},
    "UNKNOWN": {"kind": "IDLE"},
}

# Barevné motivy podle 1. číslice místnosti (patra)
FLOOR_THEMES = {
    "0": {"grad1":"#64748b","grad2":"#94a3b8","bg1":"#0f172a","bg2":"#111827"},  # přízemí
    "1": {"grad1":"#0ea5e9","grad2":"#22d3ee","bg1":"#0f172a","bg2":"#111827"},
    "2": {"grad1":"#22c55e","grad2":"#84cc16","bg1":"#0f172a","bg2":"#111827"},
    "3": {"grad1":"#f59e0b","grad2":"#f97316","bg1":"#111827","bg2":"#0b1320"},
    "4": {"grad1":"#a855f7","grad2":"#6366f1","bg1":"#0f172a","bg2":"#111827"},
}

def auto_idle_config_for_host(host: str) -> dict:
    """
    Z hosta (např. 'Room104', 'Ucebna203', '104') vytáhne číslo místnosti
    a připraví headline + theme podle patra. Fallbacky jsou bezpečné.
    """
    # Najdi trojčíslí místnosti kdekoli v názvu
    m = re.search(r'(\d{3})', host or "", flags=re.IGNORECASE)
    if m:
        room = m.group(1)
        floor_digit = room[0]
        theme = FLOOR_THEMES.get(floor_digit, FLOOR_THEMES.get("1"))
        headline = f"Učebna {room}"
    else:
        # když číslo nenajdeme, prostě použijeme název hosta
        room = None
        theme = FLOOR_THEMES.get("1")
        headline = host or "Učebna"

    cfg = {
        "headline": headline,
        "sub": "Dotkněte se obrazovky pro pokračování",
        "theme": theme,
        "room": room,
    }
    return cfg

@app.route("/idle/<string:host>")
def idle(host):
    return_path = request.args.get("return", "/")
    # ruční override má přednost, jinak auto z názvu hosta
    cfg = IDLE_SCREENS.get(host) or auto_idle_config_for_host(host)
    return render_template(
        "idle.html",
        host=host,
        return_path=return_path,
        headline=cfg.get("headline"),
        sub=cfg.get("sub"),
        theme=cfg.get("theme", {}),
        room=cfg.get("room"),
    )

@app.route('/host-default/<string:host>')
def host_default(host):
    # default pro jakéhokoliv hosta: přejdi na idle
    cfg = IDLE_SCREENS.get(host, {"kind": "idlePage"})
    return jsonify(cfg)

if __name__ == '__main__':
    app.run(host='0.0.0.0') # for running on a server