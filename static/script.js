//aktuální čas
function updateTime() {
    let date = new Date();
    let minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById("time").innerText = `${date.getHours()}:${minutes}`;
    document.getElementById("date").innerText = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

let schoolHour;
function getSchoolHour() {
    let date = new Date();
    let totalMinutes = date.getHours() * 60 + date.getMinutes();

    if (totalMinutes < 475) { // 00:00 - 07:55
        schoolHour = 0;
    } else if (totalMinutes >= 475 && totalMinutes < 525) { // 07:55 - 08:45
        schoolHour = 1;
    } else if (totalMinutes >= 525 && totalMinutes < 575) { // 08:45 - 09:35
        schoolHour = 2;
    } else if (totalMinutes >= 575 && totalMinutes < 640) { // 09:35 - 10:40
        schoolHour = 3;
    } else if (totalMinutes >= 640 && totalMinutes < 690) { // 10:40 - 11:30
        schoolHour = 4;
    } else if (totalMinutes >= 690 && totalMinutes < 745) { // 11:30 - 12:25
        schoolHour = 5;
    } else if (totalMinutes >= 745 && totalMinutes < 795) { // 12:25 - 13:15
        schoolHour = 6;
    } else if (totalMinutes >= 795 && totalMinutes < 845) { // 13:15 - 14:05
        schoolHour = 7;
    } else if (totalMinutes >= 845 && totalMinutes < 895) { // 14:05 - 14:55
        schoolHour = 8;
    } else if (totalMinutes >= 895 && totalMinutes < 945) { // 14:55 - 15:45
        schoolHour = 9;
    } else if (totalMinutes >= 945) { // 15:45 - 23:59
        schoolHour = 10;
    }
    schoolHour = schoolHour + (date.getDay()-1)*11; 
    //schoolHour = 48; //nafejkovat hodinu
    //console.log('school hour:', schoolHour);
}

//přepínání pater
function showFloor(floor) {
    document.getElementById("patro0").style.display = "none";
    document.getElementById("patro1").style.display = "none";
    document.getElementById("patro2").style.display = "none";
    document.getElementById("patro3").style.display = "none";
    document.getElementById("patro4").style.display = "none";
    document.getElementById(`patro${floor}`).style.display = "block";
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
                    cell.onclick = () => openTeachersWindow(teacher[0]);
                    teachersTable.appendChild(cell);
                }
            })
            .catch(error => {
                console.error('Error fetching teacher data:', error);
            });
    });
}

function openTeachersWindow(teacher) {
    console.log('Clicked teacher:', teacher);
    fetchTeachers(teacher)
        .then(data => {
            const actual = data[0];
            
            if (typeof actual[schoolHour] !== 'undefined') {
                console.log('actual:', actual[schoolHour][0]);
            } else {
                console.log('Učitel právě neučí');
            }
        })
        .catch(error => {
            console.error('Error fetching teacher data:', error);
        });
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

function openClassesWindow(className) {
    console.log('Clicked class:', className);
    fetchClasses(className)
        .then(data => {
            const actual = data[0];
            if (typeof actual[schoolHour] !== 'undefined') {
                console.log('actual:', actual[schoolHour][0]);
            } else {
                console.log('Třída právě nemá vyučování');
            }
        })
        .catch(error => {
            console.error('Error fetching class data:', error);
        });
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
    
    // Ucebny
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
                if (typeof actual[schoolHour] !== 'undefined') {
                    console.log('actual:', actual[schoolHour][0]);
                } else {
                    console.log('Místnost právě není obsazena');
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
        cell.onclick = () => openRoomsWindow(room[0]);
        row.appendChild(cell);
    });
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

            let teachersList = [];
            let classesList = [];
            let ucebnyList = [];
            let dilnyList = [];
            let otherList = [];

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
            console.log('Teachers:', teachersList);

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
            console.log('Classes:',classesList);

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
            console.log('ucebny:', ucebnyList);
            console.log('dilny:', dilnyList);

            // Call function to generate table
            generateRoomsTable(ucebnyList, dilnyList);


        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
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

    document.getElementById("teachers").style.display = "none";
    document.getElementById("teachers-name").style.display = "none";
    document.getElementById("rooms").style.display = "none";
    document.getElementById("rooms-name").style.display = "none";
    document.getElementById("classes").style.display = "none";
    document.getElementById("classes-name").style.display = "none";
    if (selectedMenu == menu) {
        closeMenu();
    } else {
        document.getElementById(menu).style.display = "flex";
        document.getElementById(menu + "-name").style.display = "block";
        selectedMenu = menu;
    }
}

function closeMenu() {
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
}
function closeComingSoon() {
    document.querySelector(".coming-soon").style.display = "none";
}

updateTime();
getSchoolHour();
getJsonData();

setInterval(updateTime, 1000); // Update time every second
setInterval(getSchoolHour, 20000); // Update school hour every 20 seconds