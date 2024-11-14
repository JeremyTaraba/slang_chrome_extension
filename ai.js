
// TODO: Clicking on it again should replace the old summary text with the new summary

//TODO: try using the newContent from readability to get the p elements like in readPage

async function summary (){
  document.getElementById("progress").innerHTML = "Getting Model...";
  // if first time using then will need to download model
  try {
    const session = await ai.languageModel.create({
    systemPrompt: "Pretend to be William Shakespeare.",
    monitor(m) {
      m.addEventListener("downloadprogress", e => {
        console.log(`Downloaded ${e.loaded} of ${e.total} bytes.`);
        var totalPercent = Math.round(e.loaded / e.total).toFixed(2) * 100;
        document.getElementById("progress").innerHTML += `${totalPercent}`;
      });
    }
  });
  } catch (error) {
    console.error("Failed to create language model:", error);
    document.getElementById("progress").innerHTML = "Error: Failed to create language model. " + error;
    return;
   }
  
  try{
    document.getElementById("progress").innerHTML = "Summarizing Page...";
    const {available, defaultTemperature, defaultTopK, maxTopK } = await ai.languageModel.capabilities();

    
  
    if (available !== "no") {
      const session = await ai.languageModel.create();
    
      
      let content = await readPage();
      content = formatToEnglishText(content);
      console.log(content)
      
      // Step 1: Parse the HTML string into a DOM
      let htmlString = await getDomOfActiveTab()
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlString, "text/html");

      // Step 2: Use Readability to extract content from the page
      const reader = new Readability(doc);
      const article = reader.parse();
      
      let newContent = article.content
      console.log(newContent);
      
      // probably need a way to reduce the amount of words in content so tokens to less that 1000 for the prompt to work
      // lets say 1 token = 3 characters so we can do 4000 characters
      // also will want to skip the first couple p's 
      let reducedText = "";
      // make this so we get the length of content and then grab only the 1000 tokens in the middle of the content
      for (let i = 0; i < 1000; i += 1) {
        reducedText += content.slice(i+i*2, i+i*2 + 3);
      }
      
      console.log(reducedText);
      let result = await session.prompt(`Summarize: \" ${reducedText} \"`);
      result = formatToEnglishText(result);
      console.log(result);
      summaryText.innerHTML = `<h1>${article.title}</h1>\n <p>${result}</p>`;
      document.getElementById("progress").innerHTML = "";
    }else{
      console.log("The AI language model is not available.");
      document.getElementById("progress").innerHTML = "Error: AI Language Model is not available.";
    }
  }
  catch (error) {
    console.error("Failed to summarize page:", error);
    document.getElementById("progress").innerHTML = "Error: Failed to summarize page. " + error;
  }
  
}

function replaceDoubleQuotes(text) {
  return text.replace(/"/g, "\", \"");
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

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  let res;
  // Get the active tab in the current window
  
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





powerButton = document.getElementById("powerButton")
powerButton.addEventListener("click", summary)



// async function detectCringe (){
//   // instant version
//   const {available, defaultTemperature, defaultTopK, maxTopK } = await ai.languageModel.capabilities();
  
//   if (available !== "no") {
//     const session = await ai.languageModel.create();
  
//     // Prompt the model and wait for the whole result to come back.  
//     const result = await session.prompt("Write me a poem");
//     console.log(result);
//   }else{
//     console.log("The AI language model is not available.");
//   }
// }
