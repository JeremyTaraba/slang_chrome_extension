
// TODO: Clicking on it again should replace the old summary text with the new summary

//TODO: try using the newContent from readability to get the p elements like in readPage

// if this doesnt work then make it work for youtube comments only like how the timer works

// Used to limit how much text we summarize at a time
const MAX_MODEL_CHARS = 4000;

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

  // Check if the AI language model is available
  const canSummarize = await ai.summarizer.capabilities();
  let summarizer;
  if (canSummarize && canSummarize.available !== 'no') {
    if (canSummarize.available === 'readily') {
      // The summarizer can immediately be used.
      summarizer = await ai.summarizer.create();
    } else {
      // The summarizer can be used after the model download.
      summarizer = await ai.summarizer.create();
      alert("AI Summarization is being downloaded")
      summarizer.addEventListener('downloadprogress', (e) => {
          console.log(e.loaded, e.total);
      });
      await summarizer.ready;
    }
  } else {
      // The summarizer can't be used at all.
      alert("AI Summarization is not supported")
  }

  const result = await summarizer.summarize(page);
  console.log(result);







  // Destroy the summarizer to release resources
  summarizer.destroy();

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


// try to inject into youtube page
function youtubeSummary(){
  // want to insert the summary in the comment section after "sort by" text on youtube
  const sortBy = document.querySelector('tp-yt-paper-button');
  console.log(sortBy)
    // const text = article.textContent;
    /**
     * Regular expression to find all "words" in a string.
     *
     * Here, a "word" is a sequence of one or more non-whitespace characters in a row. We don't use the
     * regular expression character class "\w" to match against "word characters" because it only
     * matches against the Latin alphabet. Instead, we match against any sequence of characters that
     * *are not* a whitespace characters. See the below link for more information.
     *
     * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions
     */
    const wordMatchRegExp = /[^\s]+/g;
    // const words = text.matchAll(wordMatchRegExp);
    // matchAll returns an iterator, convert to array to get word count
    // const wordCount = [...words].length;
    const readingTime = 1;
    const badge = document.createElement('p');
    // Use the same styling as the publish information in an article's header
    badge.classList.add('color-secondary-text', 'type--caption');
    badge.textContent = `⏱️ ${readingTime} min read`;
  
    // Support for API reference docs
    const heading = document.querySelector('tp-yt-paper-button');
  
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/insertAdjacentElement
    (heading).insertAdjacentElement('afterend', badge);

  
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







powerButton = document.getElementById("powerButton")
powerButton.addEventListener("click", summary)
