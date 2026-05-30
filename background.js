// background.js — 服务工作者：快捷键、右键菜单、消息路由

// 安装时创建右键菜单
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "extract-markdown",
    title: "提取为 Markdown",
    contexts: ["page", "link"],
  });
  chrome.contextMenus.create({
    id: "extract-markdown-preview",
    title: "提取为 Markdown（预览）",
    contexts: ["page", "link"],
  });
});

// 右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "extract-markdown") {
    extractToTab(tab, "download");
  } else if (info.menuItemId === "extract-markdown-preview") {
    extractToTab(tab, "preview");
  }
});

// 快捷键 Alt+M
chrome.commands.onCommand.addListener((command) => {
  if (command === "extract-markdown") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) extractToTab(tabs[0], "download");
    });
  }
});

// 向 content script 发送提取指令
function extractToTab(tab, mode) {
  chrome.tabs.sendMessage(tab.id, { action: "extract-markdown", mode }, (response) => {
    if (chrome.runtime.lastError) {
      // content script 未加载，注入后重试
      chrome.scripting.executeScript(
        {
          target: { tabId: tab.id },
          files: ["lib/readability.js", "lib/turndown.js", "content.js"],
        },
        () => {
          if (chrome.runtime.lastError) return;
          chrome.tabs.sendMessage(tab.id, { action: "extract-markdown", mode });
        }
      );
    }
  });
}

// 监听 content script 请求打开预览 tab
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.action === "open-preview") {
    chrome.tabs.create({ url: chrome.runtime.getURL("preview/preview.html") });
  }
});
