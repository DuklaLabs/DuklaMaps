from flask import Flask, render_template, jsonify, request
from getWay import get_way, locate_wc
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/navigate/<string:destination>')
def navigate(destination):
    return render_template('index.html', destination=destination,)

@app.route('/jsons')
def get_json():
    with open('timetableData/classes.json', encoding='utf-8') as json_file:
        classes = json.load(json_file)
        
    with open('timetableData/teachers.json', encoding='utf-8') as json_file:
        teachers = json.load(json_file)

    with open('timetableData/rooms.json', encoding='utf-8') as json_file:
        rooms = json.load(json_file)
    
    return jsonify(classes, teachers, rooms)

@app.route('/<string:category>/<string:name>')
def get_info(category, name):
    with open(f'timetableData/{category}/{name}/actual.json', encoding='utf-8') as json_file:
        actual = json.load(json_file)

    with open(f'timetableData/{category}/{name}/next.json', encoding='utf-8') as json_file:
        next = json.load(json_file)

    with open(f'timetableData/{category}/{name}/permanent.json', encoding='utf-8') as json_file:
        permanent = json.load(json_file)

    return jsonify(actual, next, permanent)

@app.route('/route/<string:start>-<string:destination>')
def get_route(start, destination):
    way = get_way(start, destination)
    print("requested path: ", way)  # Print the way to the console
    return jsonify(way)

@app.route('/locate_wc/<string:start>')
def find_wc(start):
    wc = locate_wc(start)
    print("nearest wc: ", wc)  # Print the nearest WC to the console
    return jsonify(wc)

@app.route('/dukla_data')
def get_dukla_data():
    with open('static/dukla_data.json', encoding='utf-8') as json_file:
        dukla_data = json.load(json_file)
    return jsonify(dukla_data)

@app.route('/getTimetable/<string:type>/<string:name>/<string:week>')
def get_timetable(type, name, week):
    with open(f'timetableData/{type}/{name}/{week}.json', encoding='utf-8') as json_file:
        timetable = json.load(json_file)
    return jsonify(timetable)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0') # for running on a server