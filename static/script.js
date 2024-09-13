//aktuální čas
function updateTime() {
    let date = new Date();
    let minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById("time").innerText = `${date.getHours()}:${minutes}`;
    document.getElementById("date").innerText = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
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

    let row;
    teachersList.forEach((teacher, index) => {
        if (index % 4 === 0) {
            row = document.createElement('tr');
            teachersTable.appendChild(row);
        }
        const cell = document.createElement('td');
        cell.textContent = teacher[0]; // Teacher name
        row.appendChild(cell);
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
        row.appendChild(cell);
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
        row.appendChild(cell);
    });

    // Dilny
    dilnyList.forEach((room, index) => {
        if (index % 2 === 0) {
            row = document.createElement('tr');
            dilnyTable.appendChild(row);
        }
        const cell = document.createElement('td');
        cell.textContent = room[0]; // Room name
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
        console.log('shown: ' + menu);
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
getJsonData();

// Then call updateTime every 1000 milliseconds (1 second)
setInterval(updateTime, 1000);