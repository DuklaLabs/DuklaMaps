import json

def update_classes():
    # Open classes.json
    with open('timetableData/classes.json', 'r', encoding='utf-8') as json_file:
        classesJson = json.load(json_file)

    # Open class_data.json
    with open('static/class_data.json', 'r', encoding='utf-8') as json_file:
        class_data = json.load(json_file)

    for i in range(len(classesJson["classes"])):
        class_key = list(classesJson["classes"][i].keys())[0]
        classesJson["classes"][i][class_key]["kmenova"] = class_data["class"][i]["kmenova"]
        classesJson["classes"][i][class_key]["satna"] = class_data["class"][i]["satna"]

        print(classesJson["classes"][i])

    with open('timetableData/classes.json', 'w', encoding='utf-8') as json_file:
        json.dump(classesJson, json_file, ensure_ascii=False, indent=4)