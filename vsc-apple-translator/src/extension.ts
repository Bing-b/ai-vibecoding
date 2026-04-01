import * as vscode from "vscode";
import { Translator } from "./translator";

// Cache to store the latest translation for a document
const translationMap = new Map<
  string,
  { range: vscode.Range; original: string; translated: string }
>();

export function activate(context: vscode.ExtensionContext) {
  console.log("AuraTranslate is now active (Floating Mode)!");

  // Hover Provider registration
  const hoverProvider = vscode.languages.registerHoverProvider(
    { scheme: "file" },
    {
      provideHover(document, position) {
        const cache = translationMap.get(document.uri.toString());
        if (cache && cache.range.contains(position)) {
          const markdown = new vscode.MarkdownString();
          markdown.isTrusted = true;
          markdown.supportHtml = true;

          markdown.appendMarkdown(`### AuraTranslate\n\n`);
          markdown.appendMarkdown(`**原文:** \`${cache.original}\`  \n`);
          markdown.appendMarkdown(
            `**译文:** <span style="color:#007AFF;font-weight:bold;">${cache.translated}</span>\n\n`,
          );
          // Explicitly serialize the range coordinates to avoid reliance on vscode.Range.toJSON()
          const rangeData = {
            startLine: cache.range.start.line,
            startCharacter: cache.range.start.character,
            endLine: cache.range.end.line,
            endCharacter: cache.range.end.character,
          };

          // Command links for actions
          const replaceCmd = `command:auratranslate.replace?${encodeURIComponent(
            JSON.stringify({ value: cache.translated, range: rangeData }),
          )}`;
          const copyCmd = `command:auratranslate.copy?${encodeURIComponent(
            JSON.stringify({ value: cache.translated }),
          )}`;

          markdown.appendMarkdown(
            `[✨ 替换原文](${replaceCmd}) &nbsp;&nbsp; [📋 复制结果](${copyCmd})`,
          );

          return new vscode.Hover(markdown, cache.range);
        }
        return undefined;
      },
    },
  );

  context.subscriptions.push(hoverProvider);

  // Replace Command
  const replaceDisposable = vscode.commands.registerCommand(
    "auratranslate.replace",
    (args: {
      value: string;
      range: {
        startLine: number;
        startCharacter: number;
        endLine: number;
        endCharacter: number;
      };
    }) => {
      const editor = vscode.window.activeTextEditor;
      if (editor && args && args.range) {
        const range = new vscode.Range(
          args.range.startLine,
          args.range.startCharacter,
          args.range.endLine,
          args.range.endCharacter,
        );
        editor.edit((editBuilder) => {
          editBuilder.replace(range, args.value);
        });
      }
    },
  );

  // Copy Command
  const copyDisposable = vscode.commands.registerCommand(
    "auratranslate.copy",
    (args: { value: string }) => {
      vscode.env.clipboard.writeText(args.value);
      vscode.window.showInformationMessage("已成功复制到剪贴板！");
    },
  );

  // Main Translate Command
  const translateDisposable = vscode.commands.registerCommand(
    "auratranslate.translate",
    async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const selection = editor.selection;
      const text = editor.document.getText(selection);
      if (!text) {
        vscode.window.showInformationMessage("请先选中文本后再进行翻译。");
        return;
      }

      const config = vscode.workspace.getConfiguration("auraTranslate");
      let apiKey = config.get<string>("apiKey");

      if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
        apiKey = "sk-aihsgirctqkqafrpmyudebsxnzjipvxhszpcuathcfsxyprg";
      }

      const translator = new Translator(apiKey);

      vscode.window
        .withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: "正在翻译中...",
            cancellable: false,
          },
          async () => {
            const result = await translator.translate(text);

            // Cache the result
            translationMap.set(editor.document.uri.toString(), {
              range: selection,
              original: text,
              translated: result.translatedText,
            });

            // Trigger Hover at the selection
            await vscode.commands.executeCommand("editor.action.showHover");
          },
        )
        .then(undefined, (err) => {
          vscode.window.showErrorMessage(err.message || "翻译过程中发生错误。");
        });
    },
  );

  context.subscriptions.push(
    replaceDisposable,
    copyDisposable,
    translateDisposable,
  );
}

export function deactivate() {
  translationMap.clear();
}
