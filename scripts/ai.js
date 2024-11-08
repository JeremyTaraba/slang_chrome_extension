
var summaryText = document.getElementById("summary");



async function summary (){
  document.getElementById("progress").innerHTML = "Getting Model...";
  // if first time using then will need to download model
  try {
    const summarizer2 = await ai.summarizer.create({
      sharedContext: "An article from the Daily Economic News magazine",
      type: "headline",
      length: "short"
    });
    const summarizer = await ai.summarizer.create({
    // sharedContext: "header1",
    type: "tl;dr",
    // length: "short",
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
    const {available, defaultTemperature, defaultTopK, maxTopK } = await ai.summarizer.capabilities();

    if (available !== "no") {
      const session = await ai.languageModel.create();
    
      // Prompt the model and wait for the whole result to come back. 
      let content = await readPage();
      content = formatToEnglishText(content);
      console.log(content);
      let result = await summarizer.summarize(articleEl.textContent, {
        context: content
      });
      // result = formatToEnglishText(result);
      console.log(result);
      summaryText.innerHTML = `<h1>Title</h1>\n <p>${result}</p>`;
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
      // Select all <p>, <h1>, <h2>, <h3>, <h4>, <h5>, and <h6> elements
      const elements = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6");
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





powerButton = document.getElementById("powerButton")
powerButton.addEventListener("click", summary)


async function test(){
  let textContent = "This is a test text that will be displayed"
  const summarizerCapabilities = await ai.summarizer.capabilities();
const supportsTeaser = summarizerCapabilities.createOptionsAvailable({ type: "teaser" });

if (supportsTeaser !== "no") {
  // We're good! Let's do the summarization using the built-in API.
  if (supportsTeaser === "after-download") {
    console.log("Sit tight, we need to do some downloading...");
  }

  const summarizer = await ai.summarizer.create({ type: "teaser" });
  console.log(await summarizer.summarize(articleEl.textContent));
} else {
  // Either the API overall, or the teaser type, is not available.
  // Use the cloud.
  console.log(await doCloudSummarization(articleEl.textContent));
}
}

test()



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
