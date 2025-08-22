import re
from flask import Flask, render_template, jsonify, request,session,redirect,url_for
from getWay import get_way, locate_wc
import json
from pathlib import Path
from typing import Dict, Any
import socket
from werkzeug.middleware.proxy_fix import ProxyFix
import os
from datetime import timedelta



IDLE_CFG_PATH = Path("static/Tables_cfg.json")
_idle_cfg_cache: Dict[str, Any] = {"mtime": None, "data": {}}
# Mapa IP -> hostname (pro registraci kiosků)
CLIENTS_CFG_PATH = Path("static/clients.json")


app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "change-me")  # nastav v systemd/env
app.permanent_session_lifetime = timedelta(hours=12)  # volitelné: TTL pro permanentní session

HOST_RE = re.compile(r"^[A-Za-z0-9._-]{1,64}$")
def valid_hostname(s: str) -> bool:
    return bool(HOST_RE.fullmatch(s))

def get_session_host() -> str | None:
    return session.get("kiosk_host")

def load_idle_json() -> Dict[str, Any]:
    """Načte JSON pouze pokud se změnil mtime; jinak vrátí cache."""
    try:
        stat = IDLE_CFG_PATH.stat()
    except FileNotFoundError:
        app.logger.warning("Idle config JSON nenalezen: %s", IDLE_CFG_PATH)
        return {}

    if _idle_cfg_cache["mtime"] != stat.st_mtime:
        try:
            with IDLE_CFG_PATH.open(encoding="utf-8") as f:
                data = json.load(f)
            if not isinstance(data, dict):
                app.logger.error("Idle config musí být objekt (mapa host->cfg).")
                return _idle_cfg_cache["data"]  # vrať staré, pokud existuje
            _idle_cfg_cache["mtime"] = stat.st_mtime
            _idle_cfg_cache["data"] = data
            app.logger.info("Idle config načten (%s)", stat.st_mtime)
        except Exception as e:
            app.logger.exception("Chyba při načítání idle configu: %s", e)
            # při chybě vrátíme stará data (pokud nějaká jsou)
    return _idle_cfg_cache["data"]

def deep_merge(base: dict, override: dict) -> dict:
    out = dict(base or {})
    for k, v in (override or {}).items():
        if isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = v
    return out

def auto_idle_config_for_host(host: str) -> dict:
    """
    Z hosta (např. 'Table115') jen vyčte číslo učebny a připraví popisek.
    Žádné automatické barevné téma – výchozí vzhled je jednotný (řeší šablona).
    """
    m = re.search(r"(\d{3})", host or "", flags=re.IGNORECASE)
    room = m.group(1) if m else None
    headline = f"Učebna {room}" if room else (host or "Učebna")
    return {
        "headline": headline,
        "sub": "Dotkněte se obrazovky pro pokračování",
        "theme": {},          # jednotný vzhled; případný override z JSONu ignorujeme
        "room": room,
        "name": None,         # volitelný popis místnosti (z JSONu)
        "sup": None,          # volitelný supervizor (z JSONu)
        "carousel": [],       # jednotný carousel – v šabloně je statický
        "carousel_speed": 120,
    }
# ====== Registrace kiosku (bez tokenu) + helpery ======
HOST_RE = re.compile(r"^[A-Za-z0-9._-]{1,64}$")

def load_clients_map() -> dict:
    try:
        return json.loads(CLIENTS_CFG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}

def get_client_ip() -> str:
    xff = request.headers.get("X-Forwarded-For", "")
    return (xff.split(",")[0].strip() if xff else (request.remote_addr or "")).strip()

def reverse_dns(ip: str) -> str:
    try:
        return socket.gethostbyaddr(ip)[0]
    except Exception:
        return ""

def resolve_effective_host(hinted: str | None) -> str | None:
    """Vrátí sémantické jméno kiosku (např. Table115)."""
    # Pokud už je to smysluplné jméno (ne IP, ne čisté číslo), nech ho být
    if hinted and not re.fullmatch(r"\d{1,3}(\.\d{1,3}){3}", hinted) and ":" not in hinted and not re.fullmatch(r"\d{3}", hinted):
        return hinted

    ip = get_client_ip()
    alias = load_clients_map().get(ip) or reverse_dns(ip)
    return alias or hinted  # poslední fallback: co přišlo
def valid_hostname(s: str) -> bool:
    return bool(HOST_RE.fullmatch((s or "").strip()))

def upsert_client(ip: str, host: str) -> None:
    """Zapiš/aktualizuj párování IP→hostname do config/clients.json (atomicky)."""
    CLIENTS_CFG_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        data = json.loads(CLIENTS_CFG_PATH.read_text(encoding="utf-8"))
        if not isinstance(data, dict):
            data = {}
    except Exception:
        data = {}
    if data.get(ip) != host:
        data[ip] = host
        tmp = CLIENTS_CFG_PATH.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
        tmp.replace(CLIENTS_CFG_PATH)
        app.logger.info("Zaregistrován kiosk: %s → %s", ip, host)

@app.route("/register-host")
def register_host():
    host = (request.args.get("host") or "").strip()
    if not valid_hostname(host):
        return jsonify({"ok": False, "error": "invalid"}), 400
    ip = get_client_ip()
    upsert_client(ip, host)
    return redirect("/", code=302)

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

@app.route('/host-default', defaults={'host': None})
@app.route('/host-default/<string:host>')
def host_default(host):
    eff = resolve_effective_host(host)
    return jsonify({"kind": "idlePage", "alias": eff or ""})

@app.route('/idle', defaults={'host': None})
@app.route('/idle/<string:host>')
def idle(host):
    eff = resolve_effective_host(host) or "UNKNOWN"
    return_path = request.args.get("return", "/")

    auto_cfg = auto_idle_config_for_host(eff)
    all_cfg = load_idle_json()
    override = all_cfg.get(eff) if isinstance(all_cfg, dict) else None
    cfg = deep_merge(auto_cfg, override) if override else auto_cfg

    return render_template(
        "idle.html",
        host=eff,
        return_path=cfg.get("return_path", return_path),
        headline=cfg.get("headline"),
        sub=cfg.get("sub"),
        room=cfg.get("room"),
        name=cfg.get("name"),
        sup=cfg.get("sup"),
        logo=cfg.get("logo"),
        theme={},           # jednotný vzhled
        carousel=[],        # jednotný obsah
        carousel_speed=120,
    )


if __name__ == '__main__':
    app.run(host='0.0.0.0') # for running on a server