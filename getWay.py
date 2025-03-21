import copy, json

wcs = ['wc1', 'wc2', 'wc3', 'wc4', 'wc5']

with open('static/map_data.json', 'r') as file:
    data = json.load(file)
    map = data['map']

#https://www.youtube.com/watch?v=bZkzH5x0SKU
def get_way(start, destination):
    #dijkstro
    tocheck = []
    for item in map:
        tocheck.append({'id': str(item['id']), 'neighbors': copy.deepcopy(item['neighbors'])})

    start_index = next((index for (index, d) in enumerate(map) if str(d['id']) == start), None)
        
    nodes = []
    for i in range(len(map)):
        nodes.append({"id": str(map[i]['id']), "distance": 2000, "previous": [], "visited": False})
    nodes[start_index]["distance"] = 0

    current = start_index #aktualni uzel v nodes
    while True: # Loop until there are no more unvisited nodes
        for neigh in tocheck[current]['neighbors']: #pro vsechny sousedy aktualniho uzlu
            neighbor_node = [node for node in nodes if node['id'] == str(neigh['id'])][0] #uzel souseda v nodes
            new_distance = nodes[current]['distance'] + neigh['distance']
            if new_distance < neighbor_node['distance']:
                neighbor_node['distance'] = new_distance
                neighbor_node['previous'] = nodes[current]['id']
        nodes[current]['visited'] = True
        unvisited_nodes = [node for node in nodes if not node['visited']]
        if not unvisited_nodes:  # check if unvisited_nodes is empty
            break
        next_node = min(unvisited_nodes, key=lambda node: node['distance'])
        current = nodes.index(next_node)

    #for item in tocheck: print(item)
    #for item in nodes: print(item)

    #trasa
    path = []
    currentnode = destination
    while currentnode != start:
        path.append(currentnode)
        currentnode = [node for node in nodes if node['id'] == currentnode][0]['previous']
    path.append(start)
    path = path[::-1]
    #print('requested path:', path)
    return path

#get_way('start', '214')

def locate_wc(start):
    distance = 1000
    for wc in wcs:
        wcpath = get_way(start, wc)
        if len(wcpath) < distance:
            distance = len(wcpath)
            nearest_wc = wc
    return nearest_wc

#print(locate_wc('311'))