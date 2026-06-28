export interface VkWidgetOptions {
  width?: number;
  height?: number;
  limit?: number;
  attach?: string | false;
  autoPublish?: 0 | 1;
  norealtime?: 0 | 1;
  pageUrl?: string;
  page_id?: string | number;
  text?: string;
  type?: 'full' | 'button' | 'mini' | 'vertical';
  verb?: 0 | 1;
  pageTitle?: string;
  pageImage?: string;
}

export interface VkOpenApi {
  init: (options: { apiId: number; onlyWidgets?: boolean }) => void;
  Widgets: {
    Comments: (elementId: string, options?: VkWidgetOptions, pageId?: string | number) => void;
    CommentsBrowse: (elementId: string, options?: VkWidgetOptions) => void;
    ContactUs: (elementId: string, options: VkWidgetOptions, ownerId: number) => void;
    Like: (elementId: string, options?: VkWidgetOptions, pageId?: string | number) => void;
    Poll: (elementId: string, options: VkWidgetOptions, pollId: string) => void;
    Post: (elementId: string, ownerId: number, postId: number, hash: string, options?: VkWidgetOptions) => void;
    Playlist: (
      elementId: string,
      ownerId: number,
      playlistId: number,
      hash: string,
      options?: VkWidgetOptions,
    ) => void;
  };
}

declare global {
  interface Window {
    VK?: VkOpenApi;
  }
}

export {};
