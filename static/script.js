let teachersList = [];
let classesList = [];
let ucebnyList = [];
let dilnyList = [];
let otherList = [];

//aktuální čas
function updateTime() {
    let date = new Date();
    let minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById("time").innerText = `${date.getHours()}:${minutes}`;
    document.getElementById("date").innerText = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

//převádí aktuální hodinu na hodinu v rozvrhu
let schoolHour;
function getSchoolHour() {
    let date = new Date();
    let totalMinutes = date.getHours() * 60 + date.getMinutes();

    const timeRanges = [
        { start: 0, end: 475, hour: 0 }, // 00:00 - 07:55
        { start: 475, end: 525, hour: 1 }, // 07:55 - 08:45
        { start: 525, end: 575, hour: 2 }, // 08:45 - 09:35
        { start: 575, end: 640, hour: 3 }, // 09:35 - 10:40
        { start: 640, end: 690, hour: 4 }, // 10:40 - 11:30
        { start: 690, end: 745, hour: 5 }, // 11:30 - 12:25
        { start: 745, end: 795, hour: 6 }, // 12:25 - 13:15
        { start: 795, end: 845, hour: 7 }, // 13:15 - 14:05
        { start: 845, end: 895, hour: 8 }, // 14:05 - 14:55
        { start: 895, end: 945, hour: 9 }, // 14:55 - 15:45
        { start: 945, end: 1440, hour: 10 } // 15:45 - 23:59
    ];

    for (const range of timeRanges) {
        if (totalMinutes >= range.start && totalMinutes < range.end) {
            schoolHour = range.hour + (date.getDay()-1)*11; //neděle nefunguje
            break;
        }}

        //schoolHour = 1; //nafejkovat hodinu
        //console.log('school hour:', schoolHour);
}
startLocation = 'start';
//startLocation = 406;

//přepínání pater
function showFloor(floor) {
    document.getElementById("patro0").style.display = "none";
    document.getElementById("patro1").style.display = "none";
    document.getElementById("patro2").style.display = "none";
    document.getElementById("patro3").style.display = "none";
    document.getElementById("patro4").style.display = "none";
    document.getElementById("patro5").style.display = "none";
    document.getElementById("patro6").style.display = "none";
    document.getElementById(`patro${floor}`).style.display = "block";

    //set active button
    var buttons = document.querySelectorAll('.patro');
    buttons.forEach(function(button) {
        button.classList.remove('selected');
    });
    buttons[floor].classList.add('selected');
    
}

let scale = 1;

function zoom(direction) {
    const scaleStep = 0.5;
    if (direction === '+') {
        scale += scaleStep;
    } else if (direction === '-') {
        if (scale > 1) {
            scale -= scaleStep;
        }
    }
    document.querySelectorAll('.map-content').forEach(element => {
        element.style.transform = `scale(${scale})`;
    });
}

//documents table
function generateDocumentsTable() {
    fetchDuklaData()
        .then(data => {
            console.log(data.documents);
            const documentsList = document.getElementById('documentsList');

            data.documents.forEach((docItem, index) => {
                const nameCell = document.createElement('div');
                nameCell.textContent = docItem.id;
                nameCell.classList.add('documents-name');
                documentsList.appendChild(nameCell);

                const listCell = document.createElement('div');
                listCell.id = `documents-${index}`;
                listCell.classList.add('documents-list');
                documentsList.appendChild(listCell);

                const list = document.getElementById(`documents-${index}`);

                docItem.docs.forEach(doc => {
                    const docCell = document.createElement('div');
                    docCell.textContent = doc.name;
                    docCell.onclick = () => openPDFviewer(doc.path);
                    docCell.classList.add('documents-item');
                    list.appendChild(docCell);
                });

            });
        })
        .catch(error => {
            console.error('Error fetching document data:', error);
        });
}

function openPDFviewer(url) {
    document.getElementById("pdf-viewer").style.display = "flex";
    document.getElementById("pdfFrame").src = url;

    document.getElementById("close-button").style.display = "none";
    document.getElementById("close-pdf").style.display = "flex";

}

function closePDFviewer() {
    document.getElementById("pdf-viewer").style.display = "none";

    document.getElementById("close-button").style.display = "flex";
    document.getElementById("close-pdf").style.display = "none";  
}

function showTimetable(name) {
    document.getElementById("timetable-viewer").style.display = "flex";
    closeClassWindow();
    closeRoomWindow();
    closeTeacherWindow();

    document.getElementById("close-button").style.display = "none";
    document.getElementById("close-timetable").style.display = "flex";
    document.getElementById("timetable-name").innerText = name;
    displayTimetable(timetabletype, name, 'actual');
}
function closeTimetable() {
    document.getElementById("timetable-viewer").style.display = "none";
    document.getElementById("close-button").style.display = "flex";
    document.getElementById("close-timetable").style.display = "none";
}

function fetchTimetable(type, name, week) {
    return fetch(`/getTimetable/${type}/${name}/${week}`)
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    });
}

function displayTimetable(type, name, week) { //week - permanent, actual, next, type - teachers, classes, rooms, name - name of the teacher, class, room
    document.getElementById("permanent").classList.remove('active');
    document.getElementById("actual").classList.remove('active');
    document.getElementById("next").classList.remove('active');
    document.getElementById(week).classList.add('active');

    const timeTable = document.getElementById('timetable');
    timeTable.innerHTML = '';

    index = 0;

    fetchTimetable(type, name, week)
        .then(data => {
            console.log(data);

            for (let i=0; i < 5; i++) { //radky
                row = document.createElement('tr')
                timeTable.appendChild(row);
                for(let j=0; j <= 10; j++) { //sloupce
                    cell = document.createElement('td');
                    if (data[index] && data[index][0]) {
                        
                        if (type == 'rooms') {                        
                            let upperdiv = document.createElement('div');
                            upperdiv.classList.add('upper-div');
                            upperdiv.textContent = data[index][0].group;
                            let centerdiv = document.createElement('div');
                            centerdiv.classList.add('center-div');
                            centerdiv.textContent = data[index][0].subject;
                            let lowerdiv = document.createElement('div');
                            lowerdiv.classList.add('lower-div');
                            lowerdiv.textContent = data[index][0].teacher;

                            cell.appendChild(upperdiv);
                            cell.appendChild(centerdiv);
                            cell.appendChild(lowerdiv);
                        }

                        if (type == 'teachers') {
                            if (data[index].length == 1) {
                                let upperdiv = document.createElement('div');
                                upperdiv.classList.add('upper-div');
                                upperdiv.textContent = data[index][0].group;
                                let centerdiv = document.createElement('div');
                                centerdiv.classList.add('center-div');
                                centerdiv.textContent = data[index][0].subject;
                                let lowerdiv = document.createElement('div');
                                lowerdiv.classList.add('lower-div');
                                lowerdiv.textContent = data[index][0].room;

                            cell.appendChild(upperdiv);
                            cell.appendChild(centerdiv);
                            cell.appendChild(lowerdiv);
                            } else {
                                for (let k=0; k < data[index].length; k++) {
                                    let groupdiv = document.createElement('div');
                                    groupdiv.classList.add('group-div');

                                    let upperdiv = document.createElement('div');
                                    upperdiv.classList.add('upper-div');
                                    let upperleftdiv = document.createElement('div');
                                    upperleftdiv.textContent = data[index][k].group;
                                    let upperrightdiv = document.createElement('div');
                                    upperrightdiv.textContent = data[index][k].room;
                                    upperdiv.appendChild(upperleftdiv);
                                    upperdiv.appendChild(upperrightdiv);
                                    let centerdiv = document.createElement('div');
                                    centerdiv.classList.add('center-div');
                                    centerdiv.textContent = data[index][k].subject;

                                    groupdiv.style.height = 'auto';
                                    groupdiv.appendChild(upperdiv);
                                    groupdiv.appendChild(centerdiv);

                                    cell.appendChild(groupdiv);
                                }
                            }
                        }

                        if (type == 'classes') {
                            if (data[index].length == 1) {
                                let upperdiv = document.createElement('div');
                                upperdiv.classList.add('upper-right-div');
                                upperdiv.textContent = data[index][0].room;
                                let centerdiv = document.createElement('div');
                                centerdiv.classList.add('center-div');
                                centerdiv.textContent = data[index][0].subject;
                                let lowerdiv = document.createElement('div');
                                lowerdiv.classList.add('lower-div');
                                lowerdiv.textContent = data[index][0].teacher;

                                cell.appendChild(upperdiv);
                                cell.appendChild(centerdiv);
                                cell.appendChild(lowerdiv);
                            } else {
                            for (let k=0; k < data[index].length; k++) {
                                let groupdiv = document.createElement('div');
                                groupdiv.classList.add('group-div');

                                let upperdiv = document.createElement('div');
                                upperdiv.classList.add('upper-div');
                                let upperleftdiv = document.createElement('div');
                                upperleftdiv.textContent = data[index][k].group;
                                let upperrightdiv = document.createElement('div');
                                upperrightdiv.textContent = data[index][k].room;
                                upperdiv.appendChild(upperleftdiv);
                                upperdiv.appendChild(upperrightdiv);
                                let centerdiv = document.createElement('div');
                                centerdiv.classList.add('center-div');
                                centerdiv.textContent = data[index][k].subject;
                                let lowerdiv = document.createElement('div');
                                lowerdiv.classList.add('lower-div');
                                lowerdiv.textContent = data[index][k].teacher;

                                groupdiv.appendChild(upperdiv);
                                groupdiv.appendChild(centerdiv);
                                groupdiv.appendChild(lowerdiv);

                                cell.appendChild(groupdiv);
                            }
                        }
                        }

                        if (data[index][0].type == 'absent') {
                            cell.style.backgroundColor = 'rgba(157, 207, 148, 0.8)';
                        } else if (data[index][0].type == 'removed' || data[index][0].change_info != '') {
                            cell.style.backgroundColor = '#d24b49';
                        }
                    }
                    
                    row.appendChild(cell);
                    index++;
                }
            }
        })
}

//teachers table
function generateTeachersTable(teachersList) {
    const teachersTable = document.getElementById('teachersTable');
    teachersTable.innerHTML = ''; // Clear existing table content

    teachersList.forEach((teacher, index) => {
        fetchTeachers(teacher[0])
            .then(data => {
                const permanent = data[2];
                if (Object.keys(permanent).length === 0) {  // If teacher has no permanent class
                    console.log(teacher[0] + ' has no permanent class');
                } else {
                    const cell = document.createElement('td');
                    cell.textContent = teacher[0]; // Teacher name
                    cell.onclick = () => openTeacherWindow(teacher[0]);
                    teachersTable.appendChild(cell);
                }
            })
            .catch(error => {
                console.error('Error fetching teacher data:', error);
            });
    });
}

function fetchDuklaData() {
    return fetch(`/dukla_data`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
}

function navigateKabinet(teacher) {
    fetchDuklaData()
        .then(data => {
            i = 0;
            while (data.teachers[i].id != teacher) {
                i++;
            }
            console.log(teacher, 'kabinet:', data.teachers[i].kabinet);
            navigate(startLocation, data.teachers[i].kabinet);
        }
        )
        .catch(error => {
            console.error('Error fetching teacher data:', error);
        });
}

//otevření okna učitele
function openTeacherWindow(teacher) {
    console.log('Clicked teacher:', teacher);
    fetchTeachers(teacher)
        .then(data => {
            const actual = data[0];
            
            document.getElementById("teacher-window").style.display = "flex";
            document.getElementById("teachers-ucebna").style.display = 'flex'; // show the classroom button again
            document.getElementById("darken").style.display = "block";
            document.getElementById("teacher-name").innerText = teacher;
            document.getElementById("teachers-cabinet").onclick = () => navigateKabinet(teacher);
            timetabletype = 'teachers';
            timetablename = teacher;
            document.getElementById("teachers-timetable").onclick = () => showTimetable(teacher);

            if (typeof actual[schoolHour] !== 'undefined') {
                console.log('actual:', actual[schoolHour][0]);
                console.log('actual:', actual[schoolHour][0].subject_text);
                document.getElementById("teachers-ucebna").onclick = () => navigate(startLocation, actual[schoolHour][0].room);
                if (actual[schoolHour][0].subject_text == '') {
                    document.getElementById("teacher-actual").innerText = actual[schoolHour][0].removed_info; 
                } else {
                    document.getElementById("teacher-actual").innerText = actual[schoolHour][0].subject_text + " " + actual[schoolHour][0].group;
                    document.getElementById("teacher-room-name").innerText ="uč. " + actual[schoolHour][0].room;
                }
            } else {
                console.log('Učitel právě neučí');
                document.getElementById("teacher-actual").innerText = 'Učitel právě neučí';
                document.getElementById("teachers-ucebna").style.display = 'none'; // Hide the classroom button
            }
            
        })
        .catch(error => {
            console.error('Error fetching teacher data:', error);
        });
}

function closeTeacherWindow() {
    document.getElementById("teacher-window").style.display = "none";
    document.getElementById("darken").style.display = "none";
}

function fetchTeachers(teacher) {
    return fetch(`/teachers/${teacher}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

//classes table
function generateClassesTable(classesMatrix) {
    const classesTable = document.getElementById('classesTable');
    classesTable.innerHTML = ''; // Clear existing table content

    let row;
    classesMatrix.forEach((classItem, index) => {
        if (index % 4 === 0) {
            row = document.createElement('tr');
            classesTable.appendChild(row);
        }
        const cell = document.createElement('td');
        cell.textContent = classItem[0]; // Class name
        cell.onclick = () => openClassesWindow(classItem[0]);
        row.appendChild(cell);
    });
}

function navigateKmenova(trida) {
    fetchDuklaData()
        .then(data => {
            i = 0;
            while (data.classes[i].id != trida) {
                i++;
            }
            console.log(trida, 'kmenova:', data.classes[i].kmenova);
            navigate(startLocation, data.classes[i].kmenova);
        }
        )
        .catch(error => {
            console.error('Error fetching class data:', error);
        });
}

function navigateSatna(trida) {
    fetchDuklaData()
        .then(data => {
            i = 0;
            while (data.classes[i].id != trida) {
                i++;
            }
            console.log(trida, 'satna:', data.classes[i].satna);
            navigate(startLocation, data.classes[i].satna);
        }
        )
        .catch(error => {
            console.error('Error fetching class data:', error);
        });
}

function openClassesWindow(className) {
    console.log('Clicked class:', className);
    fetchClasses(className)
        .then(data => {
            const actual = data[0];

            const classEntry = classesList.find(classItem => classItem[0] === className);

            document.getElementById("class-window").style.display = "flex";
            document.getElementById("classes-ucebna").style.display = 'flex'; // show the classroom button again
            document.getElementById("darken").style.display = "block";
            document.getElementById("class-name").innerText = className;
            document.getElementById("classes-kmenova").onclick = () => navigateKmenova(className);
            document.getElementById("classes-satna").onclick = () => navigateSatna(className);
            timetabletype = 'classes';
            timetablename = className;
            document.getElementById("classes-timetable").onclick = () => showTimetable(className);

            if (typeof actual[schoolHour] !== 'undefined') {

                //list skupin
                let groups = [];
                for (lesson of actual[schoolHour]) {
                    groups.push(lesson.group);
                    groups.sort();
                }

                //groups = ['PD1', 'PD2', 'PD3', 'PD4']
                function generateGroupsList(groups) {
                    const groupsList = document.getElementById('groupsSelector');
                    groupsList.innerHTML = ''; // Clear existing list content

                    // najde skupinu z listu "groups" podle zadaneho nazvu
                    function getGroupNumber(groupName) {
                        console.log('Clicked group:', groupName);
                        for (let i = 0; i < actual[schoolHour].length; i++) {
                            if (actual[schoolHour][i].group === groupName) {
                                showGroupInfo(i);
                                console.log('actualGroup:', i);
                                return; // Exit the loop once the group is found
                            }
                        }
                    }
                    let currentClickedElement = null;

                    // přepínače skupin
                    groups.forEach(group => {
                        const li = document.createElement('li');
                        li.textContent = group;
                        li.onclick = () => {
                            // Remove the 'clicked' class from the previously clicked element
                            if (currentClickedElement) {
                                currentClickedElement.classList.remove('active');
                            }
                            // Add the 'clicked' class to the current element
                            li.classList.add('active');
                            // Update the current clicked element
                            currentClickedElement = li;
                            // Call the existing function
                            getGroupNumber(group);
                        };
                        if (group === groups[0]) {
                            li.classList.add('active');
                            currentClickedElement = li;
                        }
                        groupsList.appendChild(li);
                    });
                }

                //zobrazí výběr skupiny
                if (groups.length > 1) {
                    generateGroupsList(groups);
                    document.querySelector('.classes-groups').style.display = 'flex';
                } else {
                    document.querySelector('.classes-groups').style.display = 'none';
                }

                function showGroupInfo(group) {
                    
                    document.getElementById("class-actual").innerText = actual[schoolHour][group].subject_text + ", " + actual[schoolHour][group].teacher + "\n" + actual[schoolHour][group].change_info;
                    document.getElementById("class-room-name").innerText = "uč. " + actual[schoolHour][group].room;
                    document.getElementById("classes-ucebna").onclick = () => navigate(startLocation, actual[schoolHour][group].room);
                }
                for (let i = 0; i < actual[schoolHour].length; i++) {
                    if (actual[schoolHour][i].group === groups[0]) {
                        showGroupInfo(i);
                        return; // Exit the loop once the group is found
                    }
                }
                
            } else {
                //clear class window
                document.getElementById("class-room-name").innerText = '';
                document.getElementById("groupsSelector").style.display = 'none';
                document.getElementById("classes-ucebna").style.display = 'none'; // Hide the classroom button
                console.log('Třída právě nemá vyučování');
                document.getElementById("class-actual").innerText = 'Třída právě nemá vyučování';
            }
        })
        .catch(error => {
            console.error('Error fetching class data:', error);
        });
}


function closeClassWindow() {
    document.getElementById("class-window").style.display = "none";
    document.getElementById("darken").style.display = "none";
}

function fetchClasses(className) {
    return fetch(`/classes/${className}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

//rooms table
function generateRoomsTable(ucebnyList, dilnyList) {
    const ucebnyTable = document.getElementById('ucebnyTable');
    const dilnyTable = document.getElementById('dilnyTable');
    ucebnyTable.innerHTML = ''; // Clear existing table content
    dilnyTable.innerHTML = ''; // Clear existing table content
    
    // seřadí učebny podle pater
    let row;
    let currentRow = '0';
    ucebnyList.forEach((room) => {
        const roomName = room[0];
        if (roomName.charAt(0) != currentRow) {
            currentRow = roomName.charAt(0);
            row = document.createElement('tr');
            ucebnyTable.appendChild(row);
        }
        const cell = document.createElement('td');
        cell.textContent = room[0]; // Room name
        cell.onclick = () => openRoomsWindow(room[0]);
        row.appendChild(cell);
    });

    function openRoomsWindow(room) {
        console.log('Clicked room:', room);
        fetchRooms(room)
            .then(data => {
                const actual = data[0];

                document.getElementById("room-window").style.display = "flex";
                document.getElementById("darken").style.display = "block";
                document.getElementById("room-name").innerText = room;
                document.getElementById("rooms-ucebna").onclick = () => navigate(startLocation, room);
                timetabletype = 'rooms';
                timetablename = room;
                document.getElementById("rooms-timetable").onclick = () => showTimetable(room);

                if (typeof actual[schoolHour] !== 'undefined') {
                    if (actual[schoolHour][0].subject_text == '') {
                        document.getElementById("room-actual").innerText = actual[schoolHour][0].change_info;
                    } else {
                        document.getElementById("room-actual").innerText = actual[schoolHour][0].subject_text + " " + actual[schoolHour][0].group + ", " + actual[schoolHour][0].teacher;
                    }
                } else {
                    console.log('Místnost právě není obsazena');
                    document.getElementById("room-actual").innerText = 'Místnost právě není obsazena';
                }
            })
            .catch(error => {
                console.error('Error fetching room data:', error);
            });
    }

    function fetchRooms(room) {
        return fetch(`/rooms/${room}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            });
    }

    // Dilny
    dilnyList.forEach((room, index) => {
        if (index % 2 === 0) {
            row = document.createElement('tr');
            dilnyTable.appendChild(row);
        }
        const cell = document.createElement('td');
        cell.textContent = room[0]; // Room name
        cell.onclick = () => comingSoon();
        //cell.onclick = () => openRoomsWindow(room[0]);
        row.appendChild(cell);
    });
}

function closeRoomWindow() {
    document.getElementById("room-window").style.display = "none";
    document.getElementById("darken").style.display = "none";
}

//získání dat z json
function getJsonData() {
    fetch('/jsons')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            const classes = data[0];
            const teachers = data[1];
            const rooms = data[2];

            // Teachers
            if (teachers && teachers.teachers.length > 0) {
                // Iterate over each teacher and print its details
                for (let i = 0; i < teachers.teachers.length; i++) {
                    const teacherName = Object.keys(teachers.teachers[i])[0];
                    const teacherDetails = teachers.teachers[i][teacherName];
                    teachersList.push([teacherName]);
                }
            } else {
                console.log('Teachers array is empty or not populated.');
            }

            // Call function to generate table
            generateTeachersTable(teachersList);

            // Classes
            if (classes && classes.classes.length > 0) {
                // Iterate over each class and print its details
                for (let i = 0; i < classes.classes.length; i++) {
                    const className = Object.keys(classes.classes[i])[0];
                    const classDetails = classes.classes[i][className];
                    classesList.push([className, classDetails]);
                }
            } else {
                console.log('Classes array is empty or not populated.');
            }

            // Call function to generate table
            generateClassesTable(classesList);

            // Rooms
            if (rooms && rooms.rooms.length > 0) {
                // Iterate over each room and print its details
                for (let i = 0; i < rooms.rooms.length; i++) {
                    const roomName = Object.keys(rooms.rooms[i])[0];
                    const roomDetails = rooms.rooms[i][roomName];
                    if (roomName.charAt(0) == 'D') {
                        dilnyList.push([roomName, roomDetails]);
                    } else {
                        ucebnyList.push([roomName, roomDetails]);
                    }
                }
            } else {
                console.log('Rooms array is empty or not populated.');
            }

            // Call function to generate table
            generateRoomsTable(ucebnyList, dilnyList);


        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

function fetchRoute(start, destination) {
    return fetch(`/route/` + start + '-' + destination)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

function fetchWC(start) {
    return fetch('/locate_wc/' + start)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        });
}

function drawLine(svgDoc, startNode, endNode) {
    const startElement = svgDoc.getElementById(startNode);
    const endElement = svgDoc.getElementById(endNode);

    if (startElement && endElement) {
        const startBBox = startElement.getBBox();
        const endBBox = endElement.getBBox();

        const startX = startBBox.x + startBBox.width / 2;
        const startY = startBBox.y + startBBox.height / 2;
        const endX = endBBox.x + endBBox.width / 2;
        const endY = endBBox.y + endBBox.height / 2;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', '#d24b49');
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-linecap', 'round');

        svgDoc.documentElement.appendChild(line);
    }
}

function clearLines(svgDoc) {
    const lines = svgDoc.querySelectorAll('line');
    lines.forEach(line => line.remove());
}

function clearMap() {
    for (let i = 0; i <= 4; i++) {
        const svgEmbed = document.getElementById(`patro${i}`);
        const svgDoc = svgEmbed ? svgEmbed.getSVGDocument() : null; // Access the SVG document

        if (svgDoc) {
            clearLines(svgDoc);
        } else {
            console.error('SVG document for patro' + i + ' is not available.');
        }

        const wayPointElements = svgDoc.querySelectorAll('#wayPoint');
        wayPointElements.forEach(element => element.remove());

        const wayPointBackgrounds = svgDoc.querySelectorAll('#wayPointBackground');
        wayPointBackgrounds.forEach(element => element.remove());

        document.getElementById("route-options").style.display = "none";
    }
}

function displayRoute(route) {
    for (let i = 0; i <= 4; i++) {
        const svgEmbed = document.getElementById(`patro${i}`);
        const originalDisplay = svgEmbed.style.display;
        svgEmbed.style.display = 'block'; // Temporarily make the element visible

        const svgDoc = svgEmbed ? svgEmbed.getSVGDocument() : null; // Access the SVG document

        if (svgDoc) {
            clearLines(svgDoc);

            for (let j = 0; j < route.length - 1; j++) {
                //spojí dva body čarou
                drawLine(svgDoc, route[j], route[j + 1]);

                //označí start
                const startELement = svgDoc.getElementById(route[0]);
                if (startELement) {
                    const startBBox = startELement.getBBox();
                    const startX = startBBox.x + startBBox.width / 2;
                    const startY = startBBox.y + startBBox.height / 2;

                    const startCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    startCircle.setAttribute('cx', startX);
                    startCircle.setAttribute('cy', startY);
                    startCircle.setAttribute('r', 2);
                    startCircle.setAttribute('fill', '#d24b49');
                    startCircle.setAttribute('id', 'wayPoint');

                    svgDoc.documentElement.appendChild(startCircle);

                    const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                    innerCircle.setAttribute('cx', startX);
                    innerCircle.setAttribute('cy', startY);
                    innerCircle.setAttribute('r', 1);
                    innerCircle.setAttribute('fill', '#fff');
                    innerCircle.setAttribute('id', 'wayPoint');

                    svgDoc.documentElement.appendChild(innerCircle);

                    const startLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    startLabel.setAttribute('x', startX - 15);
                    startLabel.setAttribute('y', startY - 10);
                    startLabel.setAttribute('font-size', 6);
                    startLabel.setAttribute('fill', '#2f2f2f');
                    startLabel.textContent = 'Zde stojíte';
                    startLabel.setAttribute('id', 'wayPoint');

                    // Create a rect background for the startLabel
                    const bbox = startLabel.getBBox();
                    const startrect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                    startrect.setAttribute('x', startX - 16);
                    startrect.setAttribute('y', 81);
                    startrect.setAttribute('width', 28);
                    startrect.setAttribute('height', 8);
                    startrect.setAttribute('fill', 'white');
                    startrect.setAttribute('id', 'wayPointBackground');
                    startrect.setAttribute('rx', 2); // Zaoblene rohy
                    startrect.setAttribute('ry', 2); // Zaoblene rohy
                    startrect.setAttribute('stroke', 'black');
                    startrect.setAttribute('stroke-width', 0.2); 

                    // Append the rect before the startLabel
                    svgDoc.documentElement.appendChild(startrect);
                    svgDoc.documentElement.appendChild(startLabel);
                }
            }

            //označí cíl
            const endElement = svgDoc.getElementById(route[route.length - 1]);
            if (endElement) {
                const endBBox = endElement.getBBox();
                const endX = endBBox.x + endBBox.width / 2;
                const endY = endBBox.y + endBBox.height / 2;

                const endCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                endCircle.setAttribute('cx', endX);
                endCircle.setAttribute('cy', endY);
                endCircle.setAttribute('r', 2);
                endCircle.setAttribute('fill', '#d24b49');
                endCircle.setAttribute('id', 'wayPoint');

                svgDoc.documentElement.appendChild(endCircle);

                const innerCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                innerCircle.setAttribute('cx', endX);
                innerCircle.setAttribute('cy', endY);
                innerCircle.setAttribute('r', 1);
                innerCircle.setAttribute('fill', '#fff');
                innerCircle.setAttribute('id', 'wayPoint');

                svgDoc.documentElement.appendChild(innerCircle);

                const endLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                endLabel.setAttribute('x', endX - 3);
                endLabel.setAttribute('y', endY - 3);
                endLabel.setAttribute('font-size', 6);
                endLabel.setAttribute('fill', '#2f2f2f');
                endLabel.textContent = 'Cíl';
                endLabel.setAttribute('id', 'wayPoint');

                // Create a rect background for the endLabel
                const bbox = endLabel.getBBox();
                const endrect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                endrect.setAttribute('x', endX - 4);
                endrect.setAttribute('y', endY - 9);
                endrect.setAttribute('width', 10);
                endrect.setAttribute('height', 8);
                endrect.setAttribute('fill', 'white');
                endrect.setAttribute('id', 'wayPointBackground');
                endrect.setAttribute('rx', 2); // Zaoblene rohy
                endrect.setAttribute('ry', 2); // Zaoblene rohy
                endrect.setAttribute('stroke', 'black');
                endrect.setAttribute('stroke-width', 0.2); 

                // Append the rect before the endLabel
                svgDoc.documentElement.appendChild(endrect);
                svgDoc.documentElement.appendChild(endLabel);
            }

        } else {
            console.error('SVG document for patro' + i + ' is not available.');
        }

        svgEmbed.style.display = originalDisplay; // Revert the display property back to its original value
    }
}

//Navigace
function navigate(start, destination) {
    fetchRoute(start, destination)
        .then(route => {
            console.log(route);
            closeTeacherWindow();
            closeClassWindow();
            closeRoomWindow();
            closeMenu();
            displayRoute(route);
        })
        .catch(error => {
            console.error('Error fetching route:', error);
        });
        document.getElementById("destination-name").innerText = destination + ":";
        //generateQRcode
        document.getElementById("route-options").style.display = "flex";
        document.getElementById("QRcode").src = 'https://api.qrserver.com/v1/create-qr-code/?data=http://192.168.0.151:5000/navigate/' + destination;
}

window.navigate = navigate; // Make the function available in the browser console

function navigateOnStart() {
    if (destinationOnStart) {
        navigate(startLocation, destinationOnStart);
    }
}

function nearestWC() {
    fetchWC(startLocation)
        .then(wc => {
            navigate(startLocation, wc);
        })
}

//burger menu
function closeburger() {
    document.querySelector('.sub-nav-mobile').classList.remove('animate-slideInUp');
    document.querySelector('.sub-nav-mobile').classList.add('animate-slideOutDown');
    setTimeout(() => { document.querySelector('.sub-nav-mobile').style.display = 'none'; }, 500); // Assuming the animation takes 500ms
    BurgerButtonClicked = false;
}

let BurgerButtonClicked = false;
document.getElementById('burger-button').addEventListener('click', function() {
    if (BurgerButtonClicked == false) {
        document.querySelector('.sub-nav-mobile').classList.remove('animate-slideOutDown');
        document.querySelector('.sub-nav-mobile').classList.add('animate-slideInUp');
        document.querySelector('.sub-nav-mobile').style.display = 'flex';
        BurgerButtonClicked = true;
    } else {
        closeburger();
    }
});

//downbar buttons
let selectedMenu;
function showMenu(menu) {
    closeburger();
    
    document.getElementById("center-container").style.display = "none";
    document.getElementById("name").style.display = "none";
    document.getElementById("close-button").style.display = "flex";

    document.getElementById("documents").style.display = "none";
    document.getElementById("documents-name").style.display = "none";
    document.getElementById("teachers").style.display = "none";
    document.getElementById("teachers-name").style.display = "none";
    document.getElementById("rooms").style.display = "none";
    document.getElementById("rooms-name").style.display = "none";
    document.getElementById("classes").style.display = "none";
    document.getElementById("classes-name").style.display = "none";

    document.getElementById("close-pdf").style.display = "none";
    document.getElementById("pdf-viewer").style.display = "none";

    document.getElementById("close-timetable").style.display = "none";
    document.getElementById("timetable-viewer").style.display = "none";
    if (selectedMenu == menu) {
        closeMenu();
    } else {
        document.getElementById(menu).style.display = "flex";
        document.getElementById(menu + "-name").style.display = "block";
        selectedMenu = menu;
    }
}

function closeMenu() {
    document.getElementById("documents").style.display = "none";
    document.getElementById("documents-name").style.display = "none";
    document.getElementById("teachers").style.display = "none";
    document.getElementById("teachers-name").style.display = "none";
    document.getElementById("rooms").style.display = "none";
    document.getElementById("rooms-name").style.display = "none";
    document.getElementById("classes").style.display = "none";
    document.getElementById("classes-name").style.display = "none";
    
    document.getElementById("center-container").style.display = "flex";
    document.getElementById("name").style.display = "block";
    document.getElementById("close-button").style.display = "none";
    selectedMenu = null;    
}

function comingSoon() {
    document.querySelector(".coming-soon").style.display = "flex";
    document.getElementById("darken").style.display = "block";
}
function closeComingSoon() {
    document.querySelector(".coming-soon").style.display = "none";
    document.getElementById("darken").style.display = "none";
}

function QRwindow() {
    document.querySelector(".QR-window").style.display = "flex";
    document.getElementById("darken").style.display = "block";
}

function closeQR() {
    document.querySelector(".QR-window").style.display = "none";
    document.getElementById("darken").style.display = "none";
}

function locWindow() {
    document.querySelector(".location-window").style.display = "flex";
    document.getElementById("darken").style.display = "block";
}

function closeLocWindow() {
    document.querySelector(".location-window").style.display = "none";
    document.getElementById("darken").style.display = "none";
}


updateTime();
getSchoolHour();
getJsonData();
generateDocumentsTable();
setTimeout(navigateOnStart, 2000); // zpoždění 2s, aby se stihly načíst data

//přednačte všechny svg obrázky, MOŽNÁ BY TO CHTĚLO LEPŠÍ ŘEŠENÍ
for (let i = 0; i <= 6; i++) {
    document.getElementById(`patro${i}`).style.display = "block";
}
showFloor(3);

setInterval(updateTime, 10000); // Update time every 10 seconds
setInterval(getSchoolHour, 60000); // Update school hour every 60 seconds