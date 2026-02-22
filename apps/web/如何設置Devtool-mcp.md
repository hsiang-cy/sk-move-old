# 如何設置 chrome-devtools-mcp (Fedora 環境)

如果您在使用 `chrome-devtools-mcp` 時遇到找不到 Chrome 執行檔的問題，請按照以下步驟進行設置。

## 1. 安裝 Chromium 瀏覽器
在 Fedora 上，最穩定的做法是安裝系統自帶的 Chromium，它會自動處理好所有 Linux 視窗系統所需的相依套件。

```bash
sudo dnf install chromium
```

## 2. 建立符號連結 (Symbolic Link)
`chrome-devtools-mcp` 預設會尋找 Google Chrome 的標準路徑 `/opt/google/chrome/chrome`。我們可以透過建立一個軟連結，讓它指向我們剛安裝好的 Chromium。

```bash
# 建立目錄
sudo mkdir -p /opt/google/chrome

# 建立指向 chromium-browser 的連結
sudo ln -s /usr/bin/chromium-browser /opt/google/chrome/chrome
```

## 3. 驗證設置
在 Gemini CLI 中執行以下指令，確認 MCP 是否能成功啟動瀏覽器：

```javascript
// 在對話中嘗試
"請幫我開啟 http://localhost:5173 並截圖"
```

## 常見問題排查
- **路徑不正確**：如果 `which chromium` 找不到路徑，請嘗試使用 `ls /usr/bin/chromium-browser` 確認實際位置。
- **權限問題**：建立 `/opt/google/chrome` 目錄需要 `sudo` 權限。
- **背景執行**：啟動前端專案時（如 `npm run dev`），建議使用 `is_background: true` 以免阻塞後續操作。
