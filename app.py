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

if __name__ == '__main__':
    app.run(host='0.0.0.0') # for running on a server