import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { GraphicsEditor, ThreeDWorkspace, createBoxMesh, type Graphics3DWorld, defaultGraphicsDocument, type GraphicsDocument } from "@jsilvanus/graphics-editor";
import "./style.css";

const initialWorld: Graphics3DWorld = {
  id: "demo-world",
  name: "Demo 3D World",
  meshes: [
    createBoxMesh("box", 2, 2, 2, { position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }),
    createBoxMesh("box-2", 1.5, 1.5, 1.5, { position: [2, 0.75, -1], rotation: [0.2, 0.4, 0], scale: [1, 1, 1] }),
  ],
  cameras: [{ id: "main", name: "Main camera", position: [6, 4, 8], rotation: [0, 0, 0], projection: "perspective", fov: 50 }],
  lights: [{ id: "key", type: "directional", position: [4, 7, 5], intensity: 2 }],
};

function App() {
  const [document, setDocument] = useState<GraphicsDocument>(defaultGraphicsDocument);
  const [world, setWorld] = useState<Graphics3DWorld>(initialWorld);
  return <main><header><h1>Web Graphics Editor</h1><p>Standalone demo of the reusable graphics editor package.</p></header><GraphicsEditor document={document} onChange={setDocument} /><section><h2>3D World Workspace</h2><p>Edit arbitrary mesh objects with a separate editor camera, then use stored cameras for composition later.</p><ThreeDWorkspace world={world} onChange={setWorld} /></section><details><summary>Document JSON</summary><pre>{JSON.stringify(document, null, 2)}</pre></details><details><summary>3D World JSON</summary><pre>{JSON.stringify(world, null, 2)}</pre></details></main>;
}

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
