import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { GraphicsEditor, defaultGraphicsDocument, type GraphicsDocument } from "@jsilvanus/graphics-editor";
import "./style.css";

function App() {
  const [document, setDocument] = useState<GraphicsDocument>(defaultGraphicsDocument);
  return <main><header><h1>Web Graphics Editor</h1><p>Standalone demo of the reusable graphics editor package.</p></header><GraphicsEditor document={document} onChange={setDocument} /><details><summary>Document JSON</summary><pre>{JSON.stringify(document, null, 2)}</pre></details></main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
