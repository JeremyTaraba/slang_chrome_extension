
var powerNotification = document.getElementById('powerNotification');


function onOff(){
    if (powerNotification.textContent == "ON"){
        powerNotification.textContent = "OFF"
        powerNotification.style.backgroundColor = "#770707a6"
    }
    else{
        powerNotification.textContent = "ON"
        powerNotification.style.backgroundColor = "#087303a6"
    }
}


var powerButton = document.getElementById('powerButton');
powerButton.addEventListener('click', onOff);