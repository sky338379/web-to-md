// content.js — 注入页面：提取网页内容 → 转 Markdown → 下载/预览

(function () {
  "use strict";

  // 避免重复注入
  if (window.__webtomd_injected) return;
  window.__webtomd_injected = true;

  // 监听来自 background.js 的消息
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === "extract-markdown") {
      const result = extractPage();
      if (msg.mode === "preview") {
        // 存储数据并打开预览 tab
        chrome.storage.local.set({ pageData: result }, () => {
          chrome.runtime.sendMessage({ action: "open-preview" });
        });
        sendResponse({ ok: true });
      } else {
        // 一键下载
        downloadMarkdown(result.markdown, result.filename);
        sendResponse({ ok: true });
      }
    }
    return true;
  });

  function createTurndown() {
    const td = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      bulletListMarker: "-",
    });
    td.keep(["table", "pre", "code"]);
    // 过滤空锚点标签（只有 name/id 属性，无文字内容的 <a>）
    td.addRule("skipEmptyAnchors", {
      filter: (node) => {
        return (
          node.nodeName === "A" &&
          !node.textContent.trim() &&
          (node.getAttribute("name") || (node.getAttribute("href") || "").startsWith("#"))
        );
      },
      replacement: () => "",
    });
    return td;
  }

  function resolveLazyImages(doc) {
    const imgs = doc.querySelectorAll("img");
    for (const img of imgs) {
      const src = img.getAttribute("src") || "";
      const isPlaceholder = !src || src.startsWith("data:") || src.length < 100;
      if (isPlaceholder) {
        const realSrc =
          img.getAttribute("data-actualsrc") ||
          img.getAttribute("data-original") ||
          img.getAttribute("data-src") ||
          img.getAttribute("data-lazy-src") ||
          img.getAttribute("data-echo") ||
          "";
        if (realSrc) {
          img.setAttribute("src", realSrc);
        }
      }
      const realSrcset = img.getAttribute("data-srcset") || "";
      if (realSrcset && !img.getAttribute("srcset")) {
        img.setAttribute("srcset", realSrcset);
      }
    }
  }

  // 提取元数据（从原始 DOM）
  function extractMetadata() {
    const title =
      document.querySelector(".Post-Title, h1.Post-Title")?.textContent?.trim() ||
      document.querySelector("h1")?.textContent?.trim() ||
      document.title || "Untitled";
    const author =
      document.querySelector(".AuthorInfo-name, .UserLink-link")?.textContent?.trim() ||
      document.querySelector('[rel="author"], .author')?.textContent?.trim() ||
      "";
    const date =
      document.querySelector("time")?.getAttribute("datetime") ||
      document.querySelector(".ContentItem-time, .Post-publishedTime")?.textContent?.trim() ||
      "";
    return { title, author, date };
  }

  // 从正文容器提取图片（直接转 markdown，不依赖 Readability）
  function extractArticleMarkdown(turndown) {
    const container =
      document.querySelector(".Post-RichTextContainer") ||  // 知乎专栏
      document.querySelector(".RichContent-inner") ||        // 知乎回答
      document.querySelector(".RichText") ||
      document.querySelector("[data-testid='post-content']") ||
      document.querySelector("article .content, article .body") ||
      document.querySelector("article") ||
      document.querySelector("main") ||
      document.querySelector(".article-content, .post-content, .entry-content") ||
      null;

    if (!container) return null;

    const clone = container.cloneNode(true);
    resolveLazyImages(clone);

    // 只删脚本和样式，不动任何内容元素
    clone.querySelectorAll("script, style, noscript").forEach((el) => el.remove());

    const md = turndown.turndown(clone.innerHTML);
    return md.length > 100 ? md : null;
  }

  function extractPage() {
    const url = window.location.href;
    const meta = extractMetadata();
    const turndown = createTurndown();
    let markdown = "";

    // 方案一：从正文容器直接提取（图片保留在原文位置）
    markdown = extractArticleMarkdown(turndown);

    // 方案二：回退到 Readability
    if (!markdown) {
      const docClone = document.cloneNode(true);
      resolveLazyImages(docClone);
      try {
        const reader = new Readability(docClone, { charThreshold: 100 });
        const article = reader.parse();
        if (article?.content) {
          markdown = turndown.turndown(article.content);
          if (article.title) meta.title = article.title;
          if (article.byline) meta.author = article.byline;
          if (article.publishedTime) meta.date = article.publishedTime;
        }
      } catch (e) {
        console.warn("[WebToMD] Readability failed:", e);
      }
    }

    // 最终回退
    if (!markdown || markdown.length < 50) {
      markdown = turndown.turndown(document.body.innerHTML);
    }

    // 修正相对链接为绝对路径
    markdown = fixRelativeUrls(markdown, url);

    // 清理
    markdown = cleanMarkdown(markdown);

    // 拼接 metadata frontmatter
    const frontmatter = buildFrontmatter(meta.title, meta.author, meta.date, url);
    const fullMarkdown = frontmatter + "\n\n" + markdown;

    // 质量评分
    const quality = scoreQuality(fullMarkdown, "");

    // 合法文件名
    const filename = sanitizeFilename(meta.title) + ".md";

    return {
      markdown: fullMarkdown,
      title: meta.title,
      author: meta.author,
      date: meta.date,
      url,
      quality,
      filename,
    };
  }

  function buildFrontmatter(title, author, date, url) {
    const lines = ["---"];
    lines.push(`title: "${escapeYaml(title)}"`);
    if (author) lines.push(`author: "${escapeYaml(author)}"`);
    if (date) lines.push(`date: "${date}"`);
    lines.push(`source: "${url}"`);
    lines.push(`extracted: "${new Date().toISOString()}"`);
    lines.push("---");
    return lines.join("\n");
  }

  function escapeYaml(str) {
    return str.replace(/"/g, '\\"');
  }

  function fixRelativeUrls(md, baseUrl) {
    try {
      const base = new URL(baseUrl);
      // 修正 Markdown 链接 [text](url)
      md = md.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, href) => {
        if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("#")) {
          return match;
        }
        try {
          const absolute = new URL(href, base).href;
          return `[${text}](${absolute})`;
        } catch {
          return match;
        }
      });
      // 修正图片 ![alt](url)
      md = md.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
        if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
          return match;
        }
        try {
          const absolute = new URL(src, base).href;
          return `![${alt}](${absolute})`;
        } catch {
          return match;
        }
      });
    } catch (e) {
      console.warn("[WebToMD] URL fix failed:", e);
    }
    return md;
  }

  function cleanMarkdown(md) {
    // 去空锚点链接：[](xxx) — 但不能误删图片 ![](xxx)
    md = md.replace(/(?<!!)\[\]\([^)]*\)\s*/g, "");
    // 去连续3个以上空行 → 2个空行
    md = md.replace(/\n{4,}/g, "\n\n\n");
    // 去行尾空格
    md = md.replace(/[ \t]+$/gm, "");
    // 去开头空行
    md = md.replace(/^\n+/, "");
    return md.trim();
  }

  function scoreQuality(markdown, htmlContent) {
    let score = 0;
    // 长度
    if (markdown.length > 500) score += 0.3;
    // markdown/HTML 比例
    if (htmlContent && markdown.length / htmlContent.length > 0.02) score += 0.2;
    // 标题数
    const headings = (markdown.match(/^#{1,6}\s+.+$/gm) || []).length;
    if (headings >= 1) score += 0.15;
    if (headings >= 3) score += 0.1;
    // 段落数
    const paragraphs = (markdown.match(/\n\n/g) || []).length;
    if (paragraphs >= 3) score += 0.15;
    // 代码块
    if (markdown.includes("```")) score += 0.1;
    return Math.min(score, 1);
  }

  function sanitizeFilename(name) {
    return name
      .replace(/[<>:"/\\|?*\x00-\x1f]/g, "") // 去非法字符
      .replace(/\s+/g, " ") // 空格归一
      .trim()
      .substring(0, 100) || "untitled";
  }

  function downloadMarkdown(markdown, filename) {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
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
})();
