import { useCallback } from "react";
import { deserializeWegra, serializeWegra } from "../wegra";
import type { GraphicsDocument, SceneTimeline } from "../types";
import { withDefaultTimeline } from "./useGraphicsEditorTimeline";

export function useWegraIO(
  document: GraphicsDocument,
  timeline: SceneTimeline,
  history: unknown,
  resetHistory: (document: GraphicsDocument) => void,
  clear: () => void,
) {
  const saveWegra = useCallback(async () => {
    try {
      const bytes = await serializeWegra({
        document: { ...document, timeline },
        history,
        actors: { actors: {} },
      });
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = "graphics.wegra";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      console.error("Failed to save .wegra", error);
      window.alert("Could not save this .wegra file.");
    }
  }, [document, timeline, history]);
  const openWegra = useCallback(
    async (file: File) => {
      try {
        const project = deserializeWegra(new Uint8Array(await file.arrayBuffer()));
        // The timeline is part of the document; don't set it separately afterwards, which would
        // apply it to the pre-load document and discard the file that was just opened.
        resetHistory(withDefaultTimeline(project.document));
        clear();
      } catch (error) {
        console.error("Failed to open .wegra", error);
        window.alert("Could not open this .wegra file.");
      }
    },
    [resetHistory, clear],
  );
  return { saveWegra, openWegra };
}
