declare module "@editorjs/editorjs" {
  interface OutputData {
    blocks: Array<{ type: string; data: Record<string, unknown> }>;
  }

  interface EditorConfig {
    holder: string | HTMLElement;
    placeholder?: string;
    tools?: Record<string, unknown>;
    data?: OutputData;
    onChange?: () => void | Promise<void>;
  }

  export default class EditorJS {
    constructor(config: EditorConfig);
    isReady: Promise<void>;
    save(): Promise<OutputData>;
    destroy(): Promise<void>;
  }
}

declare module "@editorjs/header" {
  const Header: unknown;
  export default Header;
}

declare module "@editorjs/list" {
  const List: unknown;
  export default List;
}

declare module "@editorjs/image" {
  const ImageTool: unknown;
  export default ImageTool;
}

declare module "@editorjs/embed" {
  const Embed: unknown;
  export default Embed;
}

declare module "@editorjs/quote" {
  const Quote: unknown;
  export default Quote;
}
