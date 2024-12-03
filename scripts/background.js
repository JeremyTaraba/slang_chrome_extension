// check storage if extension is on or off
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ 'onOrOff': true }, result => {
      console.log("On Installed Set value to on")
  })
})

// toggle extension on or off (not actualy using this var for anything)
var isExtensionOn = true;

chrome.storage.onChanged.addListener(function (changes, area) {
  if (area === 'local' && changes.onOrOff) {
      console.log(changes.onOrOff.newValue)
      // extension is on
      if (changes.onOrOff.newValue) {
         isExtensionOn = true;
      }
      // extension is off
      else {
          console.log("Extension Is Off")
          isExtensionOn = false;
      }
  }
})