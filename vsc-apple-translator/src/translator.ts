import * as vscode from "vscode";
import axios from "axios";

export interface TranslationResult {
  translatedText: string;
  isChinese: boolean;
}

export class Translator {
  private readonly apiUrl = "https://api.siliconflow.cn/v1/chat/completions";

  constructor(private apiKey: string) {}

  public async translate(text: string): Promise<TranslationResult> {
    const isChinese = this.detectIsChinese(text);

    const systemPrompt = isChinese
      ? "你是一个专业的程序员翻译官。请将输入的中文翻译成简洁、准确的英文，并直接以小驼峰命名的格式输出。不要包含任何解释和其他文字。"
      : "你是一个专业的翻译官。请将输入的英文翻译成准确、地道的中文。不要包含任何解释和其他文字。";

    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: "deepseek-ai/DeepSeek-V2.5", // Using a valid SiliconFlow model
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          temperature: 0.3,
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      let translatedText = response.data.choices[0].message.content.trim();

      // Post-processing for CamelCase if it's Chinese to English
      if (isChinese) {
        translatedText = this.toCamelCase(translatedText);
      }

      return { translatedText, isChinese };
    } catch (error) {
      console.error("Translation error:", error);
      throw new Error(
        "Failed to translate. Please check your API key and network.",
      );
    }
  }

  private detectIsChinese(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text);
  }

  private toCamelCase(str: string): string {
    return str
      .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      })
      .replace(/\s+/g, "");
  }
}
