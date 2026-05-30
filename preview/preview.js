// preview.js — 预览页逻辑：加载数据、编辑、渲染、导出

(function () {
  "use strict";

  const editor = document.getElementById("editor");
  const previewContent = document.getElementById("previewContent");
  const qualityBadge = document.getElementById("qualityBadge");
  const tokenCount = document.getElementById("tokenCount");
  const toast = document.getElementById("toast");

  const toggleImages = document.getElementById("toggleImages");
  const toggleLinks = document.getElementById("toggleLinks");
  const toggleMeta = document.getElementById("toggleMeta");

  const btnCopy = document.getElementById("btnCopy");
  const btnCopyPrompt = document.getElementById("btnCopyPrompt");
  const btnDownload = document.getElementById("btnDownload");

  let rawMarkdown = "";
  let pageData = null;

  // 配置 marked
  if (typeof marked !== "undefined") {
    marked.setOptions({
      gfm: true,
      breaks: false,
    });
  }

  // 从 storage 加载数据
  chrome.storage.local.get("pageData", (result) => {
    if (result.pageData) {
      pageData = result.pageData;
      rawMarkdown = pageData.markdown;
      editor.value = rawMarkdown;
      updateQuality(pageData.quality);
      updatePreview();
      updateTokenCount();
    } else {
      editor.value = "# 无内容\n\n未检测到提取的页面数据。请先在某个网页上使用提取功能。";
      updatePreview();
    }
  });

  // 编辑器输入 → 实时渲染
  let renderTimer = null;
  editor.addEventListener("input", () => {
    rawMarkdown = editor.value;
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => {
      updatePreview();
      updateTokenCount();
    }, 150);
  });

  // Toggle 控制
  toggleImages.addEventListener("change", () => { applyToggles(); });
  toggleLinks.addEventListener("change", () => { applyToggles(); });
  toggleMeta.addEventListener("change", () => { applyToggles(); });

  // 按钮
  btnCopy.addEventListener("click", () => {
    const text = getProcessedMarkdown();
    copyToClipboard(text);
    showToast("已复制 Markdown");
  });

  btnCopyPrompt.addEventListener("click", () => {
    const text = getProcessedMarkdown();
    const prompt = "```\n" + text + "\n```";
    copyToClipboard(prompt);
    showToast("已复制为 Prompt");
  });

  btnDownload.addEventListener("click", () => {
    const text = getProcessedMarkdown();
    const filename = (pageData?.title || "untitled").replace(/[<>:"/\\|?*]/g, "").trim() + ".md";
    downloadFile(text, filename);
    showToast("已下载 " + filename);
  });

  // 应用 Toggle 过滤
  function applyToggles() {
    let md = rawMarkdown;

    // 去图片
    if (!toggleImages.checked) {
      md = md.replace(/!\[[^\]]*\]\([^)]+\)/g, "");
      md = md.replace(/<img[^>]*>/gi, "");
    }

    // 去链接（保留文字）
    if (!toggleLinks.checked) {
      md = md.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
      md = md.replace(/<a[^>]*>(.*?)<\/a>/gi, "$1");
    }

    // 去元数据 frontmatter
    if (!toggleMeta.checked) {
      md = md.replace(/^---\n[\s\S]*?\n---\n*/m, "");
    }

    editor.value = md;
    updatePreview();
    updateTokenCount();
  }

  // 获取处理后的 Markdown
  function getProcessedMarkdown() {
    return editor.value;
  }

  // 渲染 Markdown 预览
  function updatePreview() {
    const md = editor.value;
    if (typeof marked !== "undefined") {
      previewContent.innerHTML = marked.parse(md);
    } else {
      // marked 未加载时的简单回退
      previewContent.textContent = md;
    }
  }

  // 更新 Token 估算
  function updateTokenCount() {
    const len = editor.value.length;
    const tokens = Math.ceil(len / 4);
    tokenCount.textContent = `~${tokens.toLocaleString()} tokens`;
  }

  // 更新质量评分
  function updateQuality(score) {
    if (score == null) {
      qualityBadge.style.display = "none";
      return;
    }
    const percent = Math.round(score * 100);
    qualityBadge.textContent = `质量 ${percent}%`;
    qualityBadge.style.display = "inline";
    if (score >= 0.7) {
      qualityBadge.className = "quality-badge good";
    } else if (score >= 0.4) {
      qualityBadge.className = "quality-badge mid";
    } else {
      qualityBadge.className = "quality-badge low";
    }
  }

  // 复制到剪贴板
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).catch(() => {
      // 回退方案
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    });
  }

  // 下载文件
  function downloadFile(content, filename) {
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      a.remove();
    }, 100);
  }

  // 显示提示
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2000);
  }
})();
