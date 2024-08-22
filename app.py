from flask import Flask, render_template, jsonify
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/jsons')
def get_json():
    with open('timetableData/classes.json') as json_file:
        classes = json.load(json_file)
        
    with open('timetableData/teachers.json') as json_file:
        teachers = json.load(json_file)

    with open('timetableData/rooms.json') as json_file:
        rooms = json.load(json_file)
    
    return jsonify(classes, teachers, rooms)

if __name__ == '__main__':
    app.run(debug=True)