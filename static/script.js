//aktuální čas
function updateTime() {
    let date = new Date();
    let minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById("time").innerText = `${date.getHours()}:${minutes}`;
    document.getElementById("date").innerText = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
}

// Call updateTime once at the beginning to set the initial time
updateTime();

// Then call updateTime every 1000 milliseconds (1 second)
setInterval(updateTime, 1000);

//přepínání pater
function showFloor(floor) {
    document.getElementById("patro0").style.display = "none";
    document.getElementById("patro1").style.display = "none";
    document.getElementById("patro2").style.display = "none";
    document.getElementById("patro3").style.display = "none";
    document.getElementById("patro4").style.display = "none";
    document.getElementById(`patro${floor}`).style.display = "block";
}
//získání dat z json
function getjson() {
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

            console.log('Classes:', classes);
            console.log('Teachers:', teachers);
            console.log('Rooms:', rooms);

            let classesMatrix = [];
            let teachersMatrix = [];
            let roomsMatrix = [];

            if (classes && classes.classes.length > 0) {
                // Iterate over each class and print its details
                for (let i = 0; i < classes.classes.length; i++) {
                    const className = Object.keys(classes.classes[i])[0];
                    const classDetails = classes.classes[i][className];
                    classesMatrix.push([className, classDetails]);
                }
            } else {
                console.log('Classes array is empty or not populated.');
            }
            console.log('Classes:',classesMatrix);

            if (teachers && teachers.teachers.length > 0) {
                // Iterate over each teacher and print their details
                for (let i = 0; i < teachers.teachers.length; i++) {
                    const teacherName = Object.keys(teachers.teachers[i])[0];
                    const teacherDetails = teachers.teachers[i][teacherName];
                    teachersMatrix.push([teacherName, teacherDetails]);
                }
            } else {
                console.log('Teachers array is empty or not populated.');
            }
            console.log('Teachers:',teachersMatrix);

            if (rooms && rooms.rooms.length > 0) {
                // Iterate over each room and print its details
                for (let i = 0; i < rooms.rooms.length; i++) {
                    const roomName = Object.keys(rooms.rooms[i])[0];
                    const roomDetails = rooms.rooms[i][roomName];
                    roomsMatrix.push([roomName, roomDetails]);
                }
            } else {
                console.log('Rooms array is empty or not populated.');
            }
            console.log('Rooms:',roomsMatrix);

        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}
getjson();


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
    document.getElementById("teachers").style.display = "none";
    document.getElementById("teachers-name").style.display = "none";
    document.getElementById("rooms").style.display = "none";
    document.getElementById("rooms-name").style.display = "none";
    document.getElementById("classes").style.display = "none";
    document.getElementById("classes-name").style.display = "none";
    if (selectedMenu == menu) {
        document.getElementById("center-container").style.display = "flex";
        selectedMenu = null;
    } else {
        document.getElementById(menu).style.display = "flex";
        document.getElementById(menu + "-name").style.display = "block";
        selectedMenu = menu;
        console.log('shown: ' + menu);
    }
}