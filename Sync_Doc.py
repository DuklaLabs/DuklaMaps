import json
import requests
from bs4 import BeautifulSoup

DOCS_URL = "https://www.spssecb.cz/dokumenty/"


def fetch_html(url: str, timeout: int = 20) -> str:
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; DuklaLabsSync/1.0)"
    }
    r = requests.get(url, headers=headers, timeout=timeout)
    r.raise_for_status()
    return r.text


def parse_documents_1to1(html: str):
    """
    Naparsuje stránku dokumentů a vrátí strukturu přesně pro data["documents"]:

    [
      {"id": "Školní dokumenty", "docs": [{"name": "...", "path": "..."}, ...]},
      ...
    ]
    """
    soup = BeautifulSoup(html, "html.parser")
    documents = []

    # Každá sekce je typicky: <h2 class="margin-bottom--m"> ... </h2> + následující <div class="wrap ...">
    for h2 in soup.select("h2.margin-bottom--m"):
        category = h2.get_text(" ", strip=True)
        if not category:
            continue

        # nejbližší následující wrapper s odkazy
        wrap = h2.find_next_sibling("div")
        if not wrap:
            continue

        links = wrap.select("div.file a.clickable-parent[href]")
        if not links:
            # pojistka, kdyby wrapper nebyl sibling
            wrap = h2.find_next("div", class_="wrap")
            links = wrap.select("div.file a.clickable-parent[href]") if wrap else []

        docs = []
        for a in links:
            docs.append({
                "name": a.get_text(" ", strip=True),
                "path": a["href"].strip()
            })

        documents.append({"id": category, "docs": docs})

    return documents


def sync_data_json_1to1(json_path: str = "static/data.json", url: str = DOCS_URL) -> dict:
    """
    1) načte data.json
    2) stáhne web
    3) přepíše data["documents"] 1:1 podle webu
    4) uloží zpět
    """
    # načíst existující JSON (kvůli classes/teachers atd.)
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    html = fetch_html(url)
    new_documents = parse_documents_1to1(html)

    if not new_documents:
        raise RuntimeError("Na stránce se nepodařilo najít žádné sekce dokumentů.")

    # HARD SYNC: 1:1
    data["documents"] = new_documents

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    return data


if __name__ == "__main__":
    sync_data_json_1to1("static\data.json", "https://www.spssecb.cz/dokumenty/")
    print("Hotovo: data.json -> documents je synchronizováno 1:1 s webem.")
