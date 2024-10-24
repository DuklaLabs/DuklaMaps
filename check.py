import xml.etree.ElementTree as ET

def list_non_path_ids(svg_file):
    # Parse the SVG file
    tree = ET.parse(svg_file)
    root = tree.getroot()

    # Namespace dictionary to handle SVG namespace
    namespaces = {'svg': 'http://www.w3.org/2000/svg'}

    # IDs to exclude
    exclude_ids = {'defs1706', 'desc1', 'g1'}

    # Iterate through all elements in the SVG
    for elem in root.findall('.//*', namespaces):
        # Check if the element is not a <path> element and its ID is not in the exclude list
        if elem.tag != '{http://www.w3.org/2000/svg}path':
            elem_id = elem.get('id')
            if elem_id and elem_id not in exclude_ids:
                print(elem_id)

# Replace 'patro3.svg' with the path to your SVG file
list_non_path_ids('static/assets/mapa/patro3.svg')