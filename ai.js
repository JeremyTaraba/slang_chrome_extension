

//TODO: if ai hasnt loaded yet and you change the page then the ai will load the old summary not reload a new one
//TODO: going back to previous page does not refresh the summary (doesnt get triggered by any event listeners)


// Used to limit how much text we summarize at a time
const MAX_MODEL_CHARS = 4000;



async function summarizePage(page){ // page is already formatted

  // i don't know if these actually work
  var type = "TL;DR";
  var format = "Plain text";
  var length = "Small";

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
    console.error("Failed to summarize:", error);
    return "Failed to summarize";
  }
  
}


function formatToEnglishText(text) {
  // Step 1: Remove extra whitespace
  text = text.replace(/\s+/g, ' ').trim();

  // Step 2: Remove non-ASCII characters
  text = text.replace(/[^\x00-\x7F]/g, '');

  //Step 3: Remove asterisk characters
  text = text.replace(/\*/g, '');

  // Step 4: Remove urls
  text = text.replace(/(https?:\/\/[^\s]+)/g, '');

  //Step 5: Remove timestamps
  text = text.replace(/\d{1,2}:\d{2}/g, '');

  // Step 6: Capitalize the start of each sentence
  text = text.replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());

  return text;
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
  // get the comments that have loaded, up to 15
  const elements = document.querySelectorAll('#content-text'); 
  console.log(elements)

  var size = elements.length;
  var topElements
  // Get the first 15 elements
  if (size > 20){
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

  // console.log(consolidatedComments);
  return consolidatedComments;
}


// try to create and inject summary into youtube page
async function youtubeSummary(){
  var isExtensionOn = await readLocalStorage('onOrOff');
  console.log(isExtensionOn);
  if(!isExtensionOn){
    return;
  }
  
  var badge = document.getElementById('yt-summarizer-badge');
  if (!badge) {
    badge = document.createElement('p');
    // try to use the same styling
    badge.classList.add('yt-core-attributed-string', 'type--caption');
    badge.id = 'yt-summarizer-badge';
    badge.style.fontSize = "14px";
  }
  else{
    // blank it out as the ai summarizes
    badge.innerHTML = "";
  }

  // wait 3 seconds for more comments to load
  await new Promise(r => setTimeout(r, 3000));
  
  const comments = consolidateComments(getYoutubeComments())

  var summary = await summarizePage(comments)
  summary = formatToEnglishText(summary);
  
  
  if(isDarkMode()){
    badge.style.color = "white"
  }
  badge.innerHTML = `🤖 AI: <br> ${summary}`;

  // Support for API reference docs
  const position = document.querySelector('ytd-item-section-renderer');
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement
  position.insertAdjacentElement('afterbegin', badge);

  // when its done, signal to loadingSummary
  return false;
}



window.onload = function(){  
  
  // wait for comments to appear
  waitForEl("#comments #header-author").then(() => {
    console.log("comments should be loaded")
    youtubeSummary();
  });
  
    
};

// navigated to new video, rerun the summarizer
function listen() {
  
  // blank out old badge
  var badge = document.getElementById('yt-summarizer-badge');
  if (badge) {
    badge.innerHTML = '';
  }
  // wait for comments
  waitForEl("#comments #header-author").then(() => {
    console.log("comments should be loaded")
    youtubeSummary();
  });
  
  
}

// listen for changes in yt navigation
document.addEventListener('yt-navigate-start', listen);


// general case to read storage
const readLocalStorage = async (key) => {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([key], function (result) {
      if (result[key] === undefined) {
        reject();
      } else {
        resolve(result[key]);
      }
    });
  });
};