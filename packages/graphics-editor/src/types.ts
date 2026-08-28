export interface Point { x: number; y: number }
export type PathNodeKind = "corner" | "smooth";
export interface PathNode { x: number; y: number; kind?: PathNodeKind; handleIn?: Point; handleOut?: Point }

export type LayerType = "text" | "image" | "rectangle" | "ellipse" | "line" | "path";
export type PathCommand =
  | { type: "M" | "L"; x: number; y: number }
  | { type: "H"; x: number }
  | { type: "V"; y: number }
  | { type: "C"; x1: number; y1: number; x2: number; y2: number; x: number; y: number }
  | { type: "Q"; x1: number; y1: number; x: number; y: number }
  | { type: "Z" };
export interface Layer { id: string; type: LayerType; x: number; y: number; width: number; height: number; rotation?: number; text?: string; src?: string; path?: string; pathCommands?: PathCommand[]; nodes?: PathNode[]; closed?: boolean; animation?: string; style?: Record<string, string | number>; }
export interface GraphicsDocument { width: number; height: number; background?: string; layers: Layer[] }
export interface GraphicsAsset { id: string; name: string; url: string; type: "image" | "video" | "other" }
export interface GraphicsEditorProps { document: GraphicsDocument; assets?: GraphicsAsset[]; onChange: (document: GraphicsDocument) => void }
