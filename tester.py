import xml.etree.ElementTree as ET
import json
import getWay

svg_ids = []

def list_non_path_ids(svg_file):
    # Parse the SVG file
    tree = ET.parse(svg_file)
    root = tree.getroot()

    # Namespace dictionary to handle SVG namespace
    namespaces = {'svg': 'http://www.w3.org/2000/svg'}

    # IDs to exclude
    exclude_ids = {'defs1706', 'desc1', 'g1', 'defs1717', 'namedview1717', 'defs2029', 'namedview2029', 'defs2020', 'namedview2020', 'namedview1' }


    # Iterate through all elements in the SVG
    for elem in root.findall('.//*', namespaces):
        # Check if the element is not a <path> element and its ID is not in the exclude list
        if elem.tag != '{http://www.w3.org/2000/svg}path':
            elem_id = elem.get('id')
            if elem_id and elem_id not in exclude_ids:
                svg_ids.append(elem_id)

print("Starting test...")

with open('static/map_data.json', 'r') as file:
    data = json.load(file)
    map = []
    
    for item in data['map']:
        map.append(str(item['id']))

    for item in map:
        for item2 in map:
            try:
                getWay.get_way(item, item2)
            except Exception as e:
                print(f"Error getting way from {item} to {item2}: {e}")

for i in range(0, 5):
    list_non_path_ids(f'static/assets/mapa/patro{i}.svg')


for item in map:
    if item not in svg_ids:
        print(f"Item with id {item} is not in svg")

for item in svg_ids:
    if item not in [str(item) for item in map]:
        print(f"Item with id {item} is not in map_data.json")

print("map:", map)
print("svg:", svg_ids)