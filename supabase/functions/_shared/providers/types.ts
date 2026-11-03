// Provider interfaces (A7): switch providers with secrets only.
export interface TextProvider {
  complete(opts: { system: string; user: string; images?: string[]; maxTokens: number; json: boolean }): Promise<string>;
}
export interface ImageProvider {
  generate(opts: { prompt: string; size: '1024x1024' }): Promise<string>;
  edit(opts: { prompt: string; imageBase64: string; size: '1024x1024' }): Promise<string>;
}
export interface Moderator {
  text(input: string): Promise<boolean>;
  image(base64: string): Promise<boolean>;
}
