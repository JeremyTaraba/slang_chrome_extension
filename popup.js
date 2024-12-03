
function toggleButton(e) {
    // check className of button
    var bool = e.target.className === 'buttonON' ? false : true
    chrome.storage.local.set({ 'onOrOff': bool }, result => {
        console.log("setting value to " + bool)
        updateButton()
    })

}

function updateButton() {
    // update button based on storage
    chrome.storage.local.get(['onOrOff'], result => {
        powerButton.textContent = result.onOrOff ? "ON" : "OFF";
        powerButton.className = result.onOrOff ? "buttonON" : "buttonOFF";
        powerButton.style.backgroundColor = result.onOrOff ? "#087303a6" : "#770707a6";
    })
}


var powerButton = document.getElementById('powerButton');
updateButton()
powerButton.onclick = toggleButton