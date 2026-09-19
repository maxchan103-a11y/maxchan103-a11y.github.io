# AI 陪讀：Azure 免費普通話後端

此 Function 只接受 `zh-CN-XiaoxiaoNeural`（女聲）或 `zh-CN-YunxiNeural`（男聲），以及 0.55×、0.72×、0.85×、1.0× 四種速度。它不包含任何粵語後備聲音。

## 零收費保護

1. Speech 資源必須選擇 Free F0，而不是 Standard S0。
2. F0 每月免費額度用完後由 Azure 拒絕新請求；程式會顯示額度已用完，不會改用粵語。
3. 瀏覽器會按「文字＋聲音＋速度」快取 MP3；重播同一句不再呼叫服務。
4. Azure 的一般 Budget 只是警報，不能代替 F0 的硬配額。

## 必要設定

- `AZURE_SPEECH_KEY`：只放在 Azure Function 的 Application settings，絕不可寫入 GitHub。
- `AZURE_SPEECH_REGION`：Speech 資源的 region，例如 `eastasia`。
- `ALLOWED_ORIGIN`：`https://maxchan103-a11y.github.io`。

完成部署後，把 Function 的 HTTPS `/api/tts` 網址填入 `dist/config.js` 的 `ttsEndpoint`，再發布首頁。

## GitHub 手動部署

倉庫已包含手動執行的 `Deploy Azure speech function` workflow。先在 GitHub 設定：

- Repository variable `AZURE_FUNCTIONAPP_NAME`
- Repository secret `AZURE_FUNCTIONAPP_PUBLISH_PROFILE`

然後在 Actions 頁面手動執行；未設定前 workflow 不會自動執行或產生費用。
