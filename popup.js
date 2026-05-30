// popup.js — 弹窗按钮逻辑

document.getElementById("btnDownload").addEventListener("click", () => {
  sendExtract("download");
});

document.getElementById("btnPreview").addEventListener("click", () => {
  sendExtract("preview");
});

function sendExtract(mode) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    const tabId = tabs[0].id;

    chrome.tabs.sendMessage(tabId, { action: "extract-markdown", mode }, (response) => {
      if (chrome.runtime.lastError) {
        // content script 未加载，注入后重试
        chrome.scripting.executeScript(
          { target: { tabId }, files: ["lib/readability.js", "lib/turndown.js", "content.js"] },
          () => {
            if (chrome.runtime.lastError) return;
            chrome.tabs.sendMessage(tabId, { action: "extract-markdown", mode });
          }
        );
      }
      // 关闭 popup
      window.close();
    });
  });
}
