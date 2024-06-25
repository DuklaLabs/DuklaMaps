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
    document.getElementById(`patro${floor}`).style.display = "block";
}

//burger menu
let BurgerButtonClicked = false;
document.getElementById('burger-button').addEventListener('click', function() {
    if (BurgerButtonClicked == false) {
        document.querySelector('.sub-nav-mobile').classList.remove('animate-slideOutDown');
        document.querySelector('.sub-nav-mobile').classList.add('animate-slideInUp');
        document.querySelector('.sub-nav-mobile').style.display = 'flex';
        BurgerButtonClicked = true;
    } else {
        document.querySelector('.sub-nav-mobile').classList.remove('animate-slideInUp');
        document.querySelector('.sub-nav-mobile').classList.add('animate-slideOutDown');
        setTimeout(() => { document.querySelector('.sub-nav-mobile').style.display = 'none'; }, 500); // Assuming the animation takes 500ms
        BurgerButtonClicked = false;
    }
});