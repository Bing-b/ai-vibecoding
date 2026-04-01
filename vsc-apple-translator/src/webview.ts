import * as vscode from "vscode";

export class TranslationWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "auratranslate.view";
  private _view?: vscode.WebviewView;

  constructor(private readonly _extensionUri: vscode.Uri) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    webviewView.webview.onDidReceiveMessage((data) => {
      switch (data.type) {
        case "replace": {
          const editor = vscode.window.activeTextEditor;
          if (editor) {
            editor.edit((editBuilder) => {
              editBuilder.replace(editor.selection, data.value);
            });
          }
          break;
        }
        case "copy": {
          vscode.env.clipboard.writeText(data.value);
          vscode.window.showInformationMessage("已成功复制到剪贴板！");
          break;
        }
      }
    });
  }

  public showTranslation(translated: string, original: string) {
    if (this._view) {
      this._view.show?.(true);
      // Ensure we only post when the panel is active and ready
      if (this._view.visible) {
        this._view.webview.postMessage({
          type: "update",
          translated,
          original,
        });
      } else {
        // If not immediately visible, wait a bit for the view to initialize
        setTimeout(() => {
          this._view?.webview.postMessage({
            type: "update",
            translated,
            original,
          });
        }, 500);
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "media", "style.css"),
    );

    return `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <link href="${styleUri}" rel="stylesheet">
                <title>Apple Style Translator</title>
            </head>
            <body>
                <div class="apple-container">
                    <div id="loading" class="loading-spinner" style="display: none;"></div>
                    <div id="content" class="fade-in">
                        <div class="original-section">
                            <span class="label">原文</span>
                            <div id="original-text" class="text-display">请选中文本进行翻译...</div>
                        </div>
                        <div class="translated-section">
                            <span class="label">译文</span>
                            <div id="translated-text" class="text-display highlight">---</div>
                        </div>
                        <div class="actions">
                            <button id="replace-btn" class="apple-btn primary">替换原文</button>
                            <button id="copy-btn" class="apple-btn secondary">复制结果</button>
                        </div>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const transTextEl = document.getElementById('translated-text');
                    const origTextEl = document.getElementById('original-text');
                    const replaceBtn = document.getElementById('replace-btn');
                    const copyBtn = document.getElementById('copy-btn');

                    let currentTranslation = '';

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'update') {
                            currentTranslation = message.translated;
                            transTextEl.innerText = message.translated;
                            origTextEl.innerText = message.original;
                            
                            // Re-trigger animation
                            const content = document.getElementById('content');
                            content.classList.remove('fade-in');
                            void content.offsetWidth; // trigger reflow
                            content.classList.add('fade-in');
                        }
                    });

                    replaceBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'replace', value: currentTranslation });
                    });

                    copyBtn.addEventListener('click', () => {
                        vscode.postMessage({ type: 'copy', value: currentTranslation });
                    });
                </script>
            </body>
            </html>`;
  }
}
