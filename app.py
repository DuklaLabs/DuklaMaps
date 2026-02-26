import re
from flask import Flask, render_template, jsonify, request, redirect
from getWay import get_way, locate_wc
import json
import os
import time
import threading
from threading import Thread
from Sync_Doc import sync_data_json_1to1, DOCS_URL
from getTimetableData import get_timetable_data
import asyncio
import logging
from logging.handlers import RotatingFileHandler

# --- Logging ---
LOG_DIR  = "logs"
LOG_FILE = os.path.join(LOG_DIR, "app.log")
os.makedirs(LOG_DIR, exist_ok=True)

_log_fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s", datefmt="%Y-%m-%d %H:%M:%S")

_file_handler   = RotatingFileHandler(LOG_FILE, maxBytes=5 * 1024 * 1024, backupCount=3, encoding="utf-8")
_file_handler.setFormatter(_log_fmt)

_stream_handler = logging.StreamHandler()
_stream_handler.setFormatter(_log_fmt)

logging.basicConfig(level=logging.INFO, handlers=[_file_handler, _stream_handler])
# ---------------

app = Flask(__name__)

CLIENTS_FILE = "clients.json"
TABLES_CFG = "static/Tables_cfg.json"
JSON_PATH = "static/data.json"
UPDATE_INTERVAL = 10 * 60  # 10 minutes

ALLOWED_CATEGORIES = {"teachers", "classes", "rooms"}
ALLOWED_WEEKS      = {"actual", "next", "permanent"}
_SAFE_NAME         = re.compile(r'^[\w.\- ]+$')  # \w = Unicode písmena + číslice + _

def _safe_param(value: str, allowed: set = None) -> bool:
    if allowed and value not in allowed:
        return False
    if '..' in value:  # blokuje directory traversal i bez lomítek
        return False
    return bool(_SAFE_NAME.match(value))

_json_cache: dict = {}
_cache_lock = threading.Lock()

def _read_json(path: str):
    """Vrátí obsah JSON souboru z cache; při cache miss načte z disku."""
    with _cache_lock:
        if path not in _json_cache:
            with open(path, encoding='utf-8') as f:
                _json_cache[path] = json.load(f)
        return _json_cache[path]

def _invalidate_cache():
    """Vymaže cache — zavolat po každém sync cyklu."""
    with _cache_lock:
        _json_cache.clear()
    logging.info("Cache invalidována")

def load_tables_cfg():
    if not os.path.exists(TABLES_CFG):
        return {}
    return _read_json(TABLES_CFG)

def load_clients():
    if not os.path.exists(CLIENTS_FILE):
        return {}
    with open(CLIENTS_FILE, "r", encoding="utf-8") as f:
        try:
            return json.load(f)
        except json.JSONDecodeError:
            return {}

def save_clients(clients):
    with open(CLIENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(clients, f, indent=4, ensure_ascii=False)


def get_client_ip():
    if request.headers.get("X-Forwarded-For"):
        # pokud jedeš za reverzní proxy (nginx, traefik…)
        return request.headers.get("X-Forwarded-For").split(",")[0].strip()
    return request.remote_addr

def valid_hostname(host: str) -> bool:
    # základní kontrola – žádné mezery, příliš dlouhé znaky apod.
    return bool(host) and len(host) < 100 and " " not in host

def _room_for_ip(ip: str):
    """Vrátí číslo místnosti pro danou IP dle clients.json + Tables_cfg.json, nebo None."""
    clients = load_clients()
    host = clients.get(ip)
    if not host:
        return None
    # Pokus 1: room_number přímo z Tables_cfg.json
    room = load_tables_cfg().get(host, {}).get("room_number")
    if room:
        return str(room)
    # Pokus 2: extrahuj číslo z názvu hosta (fallback)
    return auto_idle_config_for_host(host).get("room")


@app.route('/')
def index():
    ip = get_client_ip()
    start = _room_for_ip(ip) or "start"
    return render_template('index.html', start=start, destination=None)

@app.route('/start:<string:start>', defaults={'destination': None}) # otevírá mapu s přednastavenými hodnotami
@app.route('/start:<string:start>,end:<string:destination>')
def navigate(start, destination):
    return render_template('index.html', start=start, destination=destination)

@app.route('/jsons') # poskytuje seznamy tříd, učitelů a místností
def get_json():
    classes  = _read_json('timetableData/classes.json')
    teachers = _read_json('timetableData/teachers.json')
    rooms    = _read_json('timetableData/rooms.json')
    return jsonify(classes, teachers, rooms)

@app.route('/<string:category>/<string:name>') # poskytuje rozvrh
def get_info(category, name):
    if not _safe_param(category, ALLOWED_CATEGORIES) or not _safe_param(name):
        return jsonify({"error": "Invalid parameter"}), 400
    base = f'timetableData/{category}/{name}'
    actual    = _read_json(f'{base}/actual.json')
    next      = _read_json(f'{base}/next.json')
    permanent = _read_json(f'{base}/permanent.json')
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
    return jsonify(_read_json('static/data.json'))

@app.route('/getTimetable/<string:type>/<string:name>/<string:week>') # poskytuje rozvrh
def get_timetable(type, name, week):
    if not _safe_param(type, ALLOWED_CATEGORIES) or not _safe_param(name) \
       or not _safe_param(week, ALLOWED_WEEKS):
        return jsonify({"error": "Invalid parameter"}), 400
    return jsonify(_read_json(f'timetableData/{type}/{name}/{week}.json'))



def auto_idle_config_for_host(host: str) -> dict:
    """
    Z hosta (např. 'Room104', 'Ucebna203', '104') vytáhne číslo místnosti
    a připraví headline + theme podle patra. Fallbacky jsou bezpečné.
    """
    # Najdi trojčíslí místnosti kdekoli v názvu
    m = re.search(r'(\d{3})', host or "", flags=re.IGNORECASE)
    if m:
        room = m.group(1)
        headline = f"Učebna {room}"
    else:
        # když číslo nenajdeme, prostě použijeme název hosta
        room = None
        headline = host or "Učebna"

    cfg = {
        "headline": headline,
        "sub": "Dotkněte se obrazovky pro pokračování",
        "room": room,
    }
    return cfg

# @app.route("/idle/<string:host>")
# def idle(host):
#     return_path = request.args.get("return", "/")
#     # Načti data z Tables_cfg.json podle hostname
#     with open('Tables_cfg.json', encoding='utf-8') as json_file:
#         tables_cfg = json.load(json_file)
#     # Vyber konfiguraci podle hostname, fallback na auto_idle_config_for_host
#     cfg = tables_cfg.get(host) or auto_idle_config_for_host(host)
#     return render_template(
#         "idle.html",
#         host=host,
#         return_path=cfg.get("return_path", return_path),
#         headline=cfg.get("headline"),
#         sub=cfg.get("sub"),
#         room=cfg.get("room"),
#         kind=cfg.get("kind"),
#         name=cfg.get("name"),
#         sup=cfg.get("sup"),
#         logo=cfg.get("logo"),
#     )
@app.route("/idle")
def idle_screen():
    ip = get_client_ip()
    clients = load_clients()
    host = clients.get(ip)   # podle IP najdeme zaregistrovaný host

    if not host:
        return f"Host for IP {ip} not registered", 404

    tables_cfg = load_tables_cfg()
    table = tables_cfg.get(host, {})

    print(f"Host: {host}")
    print(f"Table: {table}")

    if not table:
        return f"Config for host {host} not found", 404

    return render_template(
        "idle.html",
        host=host,
        table=table  # předáme celé nastavení do šablony
    )

@app.route("/register-host")
def register_host():
    host = request.args.get("host", "").strip()
    if not host:
        return "Missing host parameter", 400
    # place = request.args.get("place", "").strip()
    # if not place:
    #     return "Missing placement", 400 

    ip = get_client_ip()
    clients = load_clients()
    clients[ip] = host
    save_clients(clients)

    return redirect("/")


def run_sync_cycle():
    """Jedna synchronizační dávka"""
    # 1️⃣ dokumenty
    try:
        logging.info("⏳ [SYNC] Dokumenty...")
        sync_data_json_1to1(str(JSON_PATH), DOCS_URL)
        logging.info("✅ [SYNC] Dokumenty hotovo")
    except Exception:
        logging.exception("❌ [SYNC] Dokumenty selhaly")

    # 2️⃣ rozvrhy
    try:
        logging.info("⏳ [SYNC] Rozvrhy...")
        asyncio.run(get_timetable_data())
        logging.info("✅ [SYNC] Rozvrhy hotovo")
    except Exception:
        logging.exception("❌ [SYNC] Rozvrhy selhaly")

    _invalidate_cache()


def sync_loop():
    """Nekonečná smyčka běžící každých 10 minut"""
    logging.info("🔁 Spouštím periodickou synchronizaci (10 min)")

    # první běh hned při startu
    run_sync_cycle()

    while True:
        logging.info("⏸️ Čekám 10 minut na další sync...")
        time.sleep(UPDATE_INTERVAL)
        run_sync_cycle()


def start_background_sync():
    t = Thread(target=sync_loop, daemon=True)
    t.start()


# Spustí se při importu modulem (gunicorn) i přímém spuštění
if not os.environ.get("FLASK_DEBUG") or os.environ.get("WERKZEUG_RUN_MAIN") == "true":
    start_background_sync()

if __name__ == '__main__':
    app.run(host="0.0.0.0")