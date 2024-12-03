
// Used to limit how much text we summarize at a time
const MAX_MODEL_CHARS = 4000;
//TODO: make ai refresh if the youtube url changes
//TODO: make summary from third person to first person, look up "js nlg" for natural language generation
//TODO: remove urls from the comments

async function summarizePage(page){ // page is already formatted

  // i don't know if these actually work
  var type = "TL;DR";
  var format = "Plain text";
  var length = "Medium";

  try{
    // Check if the AI language model is available
  const canSummarize = await ai.summarizer.capabilities();
  let summarizer;
  if (canSummarize && canSummarize.available !== 'no') {
    if (canSummarize.available === 'readily') {
      // The summarizer can immediately be used.
      summarizer = await ai.summarizer.create();
    } else {
      // The summarizer can be used after the model download.
      summarizer = await ai.summarizer.create({ type, format, length });
      summarizer.addEventListener('downloadprogress', (e) => {
          console.log(e.loaded, e.total);
      });
      await summarizer.ready;
    }
  } else {
      // The summarizer can't be used at all.
      return "AI Summarization is not supported";
  }

  const result = await summarizer.summarize(page);
  console.log(result);

  // Destroy the summarizer to release resources
  summarizer.destroy();

  return result;
  }
  catch (error) {
    console.error("Failed to summarize page:", error);
    return "Failed to summarize page";
  }
  
}


function formatToEnglishText(text) {
  // Step 1: Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Step 2: Remove non-ASCII characters
  text = text.replace(/[^\x00-\x7F]/g, '');

  //Step 3: Remove asterisk characters
  text = text.replace(/\*/g, '');

  // Step 4: Capitalize the start of each sentence
  text = text.replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());

  return text;
}


function matchYoutubeUrl(url) {
  var p = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/;
  if(String(url).match(p)){
      return true;
  }
  return false;
}



// if element does not exist then will keep checking
function waitForEl(el) {
  return new Promise((resolve, reject) => {
    const intervalId = setInterval(() => {
      if (document.querySelector(el)) {
        clearInterval(intervalId);
        resolve();
      }
    }, 500);
  });
}


function isDarkMode() {
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function getYoutubeComments(){
  // Select all elements matching the selector
  const elements = document.querySelectorAll('#content-text'); 
  console.log(elements)

  var size = elements.length;
  var topElements
  // Get the first 15 elements
  if (size > 15){
    topElements = Array.from(elements).slice(0, 14); 
  }
  else{
    topElements = Array.from(elements).slice(0, size); 
  }
  return topElements;
}

function consolidateComments(listOfComments){
  let consolidatedComments = ""
  for(let i = 0; i < listOfComments.length; i++){
    consolidatedComments += listOfComments[i].innerText + " ";
  }

  // check comments for special characters and remove them
  consolidatedComments = formatToEnglishText(consolidatedComments);

  // if comments are bigger than max length then cut it off
  if (consolidatedComments.length > MAX_MODEL_CHARS) {
    consolidatedComments = consolidatedComments.slice(0, MAX_MODEL_CHARS - 3) + "...";  // truncate the text to fit the model input size
  }

  console.log(consolidatedComments);
  return consolidatedComments;
}


// try to inject into youtube page
async function youtubeSummary(){
  // wait 3 seconds for more comments to load
  await new Promise(r => setTimeout(r, 3000));
  
  const comments = consolidateComments(getYoutubeComments())

  var summary = await summarizePage(comments)
  summary = formatToEnglishText(summary);
    
  const badge = document.createElement('p');
  // Use the same styling as the publish information in an article's header
  badge.classList.add('yt-core-attributed-string', 'type--caption');
  badge.style.fontSize = "14px";
  if(isDarkMode()){
    badge.style.color = "white"
  }
  badge.innerHTML = `🤖 AI: <br> ${summary}`;

  // Support for API reference docs
  const position = document.querySelector('ytd-item-section-renderer');
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement
  position.insertAdjacentElement('afterbegin', badge);

  
}



window.onload = function(){
  // make sure we are on youtube
  var onYoutube = false;
  const currentUrl = new URL(window.location.href);
  if (matchYoutubeUrl(currentUrl)){
    console.log("On Youtube")
    onYoutube = true;
  }
  else{
    console.log("Not on Youtube")
  }

  if (onYoutube){
    // wait for comments to appear
    waitForEl("#comments #header-author").then(() => {
      console.log("comments should be loaded")
      youtubeSummary();
    });
  }
};

function afterNavigate() {
  if ('/watch' === location.pathname) {
      alert('Watch page!');
  }
}
(document.body || document.documentElement).addEventListener('transitionend',
function(/*TransitionEvent*/ event) {
  if (event.propertyName === 'width' && event.target.id === 'progress') {
      afterNavigate();
  }
}, true);
// After page load
afterNavigate();