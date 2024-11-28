
// Used to limit how much text we summarize at a time
const MAX_MODEL_CHARS = 4000;
//TODO: make token limit on grabbing text and cut off excess characters
//TODO: make ai refresh if the youtube url changes
//TODO: make the formatting of the summary better, maybe change it so it doesn't say author, look up "js nlg" for natural language generation

async function summary (){
  document.getElementById("progress").innerHTML = "Getting Model...";
  // if first time using then will need to download model
  // try {
  //   const session = await ai.languageModel.create({
  //   systemPrompt: "Pretend to be William Shakespeare.",
  //   monitor(m) {
  //     m.addEventListener("downloadprogress", e => {
  //       console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
  //       var totalPercent = Math.round(e.loaded / e.total).toFixed(2) * 100;
  //       document.getElementById("progress").innerHTML += `${totalPercent}`;
  //     });
  //   }
  // });
  // } catch (error) {
  //   console.error("Failed to create language model:", error);
  //   document.getElementById("progress").innerHTML = "Error: Failed to create language model. " + error;
  //   return;
  //  }
  
  try{
    document.getElementById("progress").innerHTML = "Summarizing Page...";
    // const {available, defaultTemperature, defaultTopK, maxTopK } = await ai.languageModel.capabilities();

    
  
    // if (available !== "no") {
      // const session = await ai.languageModel.create();
    
      // testing readpage()
      let content = await readPage();
      content = formatToEnglishText(content);
      console.log("old content: ",content)
      
      // Step 1: Parse the HTML string into a DOM
      let htmlString = await getDomOfActiveTab()
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");

      // Step 2: Use Readability to extract content from the page
      const reader = new Readability(doc);
      const article = reader.parse();
      
      let newContent = article.content
      console.log("new content: ",newContent);
      
     
      // let reducedText = "";
      // // make this so we get the length of content and then grab only the 1000 tokens in the middle of the content
      // for (let i = 0; i < 1000; i += 1) {
      //   reducedText += content.slice(i+i*2, i+i*2 + 3);
      // }
      
      // console.log(reducedText);
      // let result = await session.prompt(`Summarize: \" ${reducedText} \"`);
      // result = formatToEnglishText(result);
      // console.log(result);
      // summaryText.innerHTML = `<h1>${article.title}</h1>\n <p>${result}</p>`;
      // document.getElementById("progress").innerHTML = "";
    // }else{
    //   console.log("The AI language model is not available.");
    //   document.getElementById("progress").innerHTML = "Error: AI Language Model is not available.";
    // }
  }
  catch (error) {
    console.error("Failed to summarize page:", error);
    document.getElementById("progress").innerHTML = "Error: Failed to summarize page. " + error;
  }
  
}

function replaceDoubleQuotes(text) {
  return text.replace(/"/g, "\", \"");
}

async function summarizePage(page){ // page is already formatted
  var type = "TL;DR";
  var format = "Plain text";
  var length = "Short";

  try{
    // Check if the AI language model is available
  const canSummarize = await ai.summarizer.capabilities();
  console.log("capabilities: ",canSummarize);
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

  // Step 3: Capitalize the start of each sentence
  text = text.replace(/(^\s*\w|[\.\!\?]\s*\w)/g, (c) => c.toUpperCase());

  return text;
}


async function readPage(){
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let pageText = "";

  // Execute script to get only text from <p> and heading tags
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      // Select all <p> elements
      const elements = document.querySelectorAll("p");
      // Extract and join their inner text
      return Array.from(elements).map(el => el.innerText).join("\n");
    },
  });

  // Assign result to `pageText` variable
  if (result && result.result) {
    pageText = result.result;
    
  } else {
    pageText = "No text found on this page.";
  }
  return pageText;
}


async function getDomOfActiveTab() {
  // Get the active tab in the current window
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let res;
  
  
  const [result] = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      return document.documentElement.outerHTML;
    },
  });
          
          
    if (chrome.runtime.lastError) {
      console.error("Error executing script:", chrome.runtime.lastError);
    } else {
      if (result && result.result) {
        res = result.result;
        console.log("DOM extracted:", result);
      } else {
        console.log("Error:", result);
      }
      
    }
    
  return res;
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
  var top10Elements
  // Get the first 10 elements
  if (size > 10){
    top10Elements = Array.from(elements).slice(0, 9); 
  }
  else{
    top10Elements = Array.from(elements).slice(0, size); 
  }
  return top10Elements;
}

function consolidateComments(listOfComments){
  let consolidatedComments = ""
  for(let i = 0; i < listOfComments.length; i++){
    consolidatedComments += listOfComments[i].innerText + "\n\n";
  }
  // loop here for each char in comments
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

  const summary = await summarizePage(comments)
  
    
  const badge = document.createElement('p');
  // Use the same styling as the publish information in an article's header
  badge.classList.add('yt-core-attributed-string', 'type--caption');
  badge.style.fontSize = "14px";
  if(isDarkMode()){
    badge.style.color = "white"
  }
  badge.textContent = `🤖 Comment Summary: ${summary}`;

  // Support for API reference docs
  const position = document.querySelector('ytd-item-section-renderer');
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement
  position.insertAdjacentElement('afterbegin', badge);

  
}

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






// powerButton = document.getElementById("powerButton")
// powerButton.addEventListener("click", summary)
