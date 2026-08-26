export type LayerType = "text" | "image" | "rectangle" | "ellipse";

export interface Layer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  text?: string;
  src?: string;
  animation?: string;
  style?: Record<string, string | number>;
}

export interface GraphicsDocument {
  width: number;
  height: number;
  background?: string;
  layers: Layer[];
}

export interface GraphicsAsset {
  id: string;
  name: string;
  url: string;
  type: "image" | "video" | "other";
}

export interface GraphicsEditorProps {
  document: GraphicsDocument;
  assets?: GraphicsAsset[];
  onChange: (document: GraphicsDocument) => void;
}
