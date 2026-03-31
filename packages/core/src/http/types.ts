export interface HttpAdapter {
  get(url: string, options: RequestOptions): Promise<HttpResponse>;
  post(url: string, body: unknown, options: RequestOptions): Promise<HttpResponse>;
}

export interface RequestOptions {
  headers: Record<string, string>;
}

export interface HttpResponse {
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}
