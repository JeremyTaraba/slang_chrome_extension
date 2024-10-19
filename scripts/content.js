const article = document.querySelector("article");


const powerSwitch = document.getElementById("powerSwitch");
var checkedValue =  false;

document.addEventListener('DOMContentLoaded', function() {
    if (typeof(Storage) !== "undefined") {
        checkedValue =  localStorage.getItem("checkedValue");
    } else {
      console.log("localStorage is not supported");
    }
});

if(checkedValue) {
    powerSwitch.checked = checkedValue === "true";  // Set the switch to checked if the value was stored in localStorage
    console.log("Retrieved checked value from localStorage: ", checkedValue);
}

$("#ts4").attr("checked", !property); 
$('#activate').click(); 



powerSwitch.addEventListener("change", (event) => {
  if (event.target.checked) {
    localStorage.setItem("checkedValue", "true");
    console.log("Checked");
} else {
    localStorage.setItem("checkedValue", "false");
    console.log("Not checked");
}
});

// `document.querySelector` may return null if the selector doesn't match anything.
if (article && powerSwitch.checked) {
  const text = article.textContent;
  const wordMatchRegExp = /[^\s]+/g; // Regular expression
  const words = text.matchAll(wordMatchRegExp);
  // matchAll returns an iterator, convert to array to get word count
  const wordCount = [...words].length;
  const readingTime = Math.round(wordCount / 200);
  const badge = document.createElement("p");
  // Use the same styling as the publish information in an article's header
  badge.classList.add("color-secondary-text", "type--caption");
  badge.textContent = `⏱️ ${readingTime} min read`;

  // Support for API reference docs
  const heading = article.querySelector("h1");
  // Support for article docs with date
  const date = article.querySelector("time")?.parentNode;

  (date ?? heading).insertAdjacentElement("afterend", badge);
}