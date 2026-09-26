import { Component, StrictMode, useState, type ErrorInfo, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  GraphicsEditor,
  ThreeDWorkspace,
  createBoxMesh,
  createSphereMesh,
  defaultGraphicsDocument,
  type Graphics3DWorld,
  type GraphicsDocument,
} from "@jsilvanus/graphics-editor";
import "./style.css";

const initialWorld: Graphics3DWorld = {
  id: "demo-world",
  name: "Demo 3D World",
  meshes: [
    createBoxMesh("box", 2, 2, 2, { position: [0, 1, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }),
    createBoxMesh("box-2", 1.5, 1.5, 1.5, {
      position: [2.5, 0.75, -1],
      rotation: [0.2, 0.4, 0],
      scale: [1, 1, 1],
    }),
    {
      ...createSphereMesh("sphere", 0.8, 24, 12, {
        position: [-2.5, 0.8, 0.5],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      }),
      material: { smoothShading: true },
    },
  ],
  cameras: [
    {
      id: "main",
      name: "Main camera",
      position: [6, 4, 8],
      rotation: [-0.381, 0.608, 0.225],
      projection: "perspective",
      fov: 50,
    },
  ],
  lights: [
    { id: "ambient", type: "ambient", intensity: 0.6 },
    { id: "key", type: "directional", position: [4, 7, 5], intensity: 2 },
  ],
};

type Tab = "2d" | "3d";

const initialTab = (): Tab =>
  new URLSearchParams(window.location.search).get("editor") === "3d" ? "3d" : "2d";

/** Keeps one editor's crash from taking down the whole demo, and shows the error. */
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="demo-error" role="alert">
        <strong>This editor crashed.</strong>
        <pre>{this.state.error.stack ?? this.state.error.message}</pre>
        <button type="button" onClick={() => this.setState({ error: null })}>
          Try again
        </button>
      </div>
    );
  }
}

function App() {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [document, setDocument] = useState<GraphicsDocument>(defaultGraphicsDocument);
  const [world, setWorld] = useState<Graphics3DWorld>(initialWorld);

  const selectTab = (next: Tab) => {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("editor", next);
    window.history.replaceState(null, "", url);
  };

  return (
    <main>
      <header>
        <h1>Web Graphics Editor</h1>
        <nav className="demo-tabs" aria-label="Editor">
          <button type="button" aria-pressed={tab === "2d"} onClick={() => selectTab("2d")}>
            2D editor
          </button>
          <button type="button" aria-pressed={tab === "3d"} onClick={() => selectTab("3d")}>
            3D workspace
          </button>
        </nav>
      </header>
      {tab === "2d" ? (
        <ErrorBoundary key="2d">
          <GraphicsEditor document={document} onChange={setDocument} />
          <details>
            <summary>Document JSON</summary>
            <pre>{JSON.stringify(document, null, 2)}</pre>
          </details>
        </ErrorBoundary>
      ) : (
        <ErrorBoundary key="3d">
          <ThreeDWorkspace world={world} onChange={setWorld} className="demo-3d" />
          <details>
            <summary>3D world JSON</summary>
            <pre>{JSON.stringify(world, null, 2)}</pre>
          </details>
        </ErrorBoundary>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
