chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "storeArticle") {
      // Store the article data locally or do something with it
      chrome.storage.local.set({ article: message.data }, () => {
        console.log("Article stored in background:", message.data);
      });
      sendResponse({ status: "success" });
    }
    return true; // Keeps the message channel open for sendResponse
  });
  