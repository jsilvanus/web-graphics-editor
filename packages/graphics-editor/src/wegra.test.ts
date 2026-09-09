import {describe,expect,it} from "vitest";
import {canonicalJson,deserializeWegra,migrateWegraManifest,serializeWegra,WEGRA_VERSION} from "./wegra";
import {baseDocument} from "./test-fixtures";

const legacyV1Fixture= "UEsDBBQAAAAAAOmiKV15IlJQVwAAAFcAAAANAAAAZG9jdW1lbnQuanNvbnsiaWQiOiJsZWdhY3ktdjEiLCJ3aWR0aCI6MTAwLCJoZWlnaHQiOjEwMCwiYmFja2dyb3VuZCI6IiNmZmYiLCJsYXllcnMiOltdLCJhc3NldHMiOltdfVBLAwQUAAAAAADpoildxkccAXsAAAB7AAAADQAAAG1hbmlmZXN0Lmpzb257ImZvcm1hdCI6IndlZ3JhIiwidmVyc2lvbiI6MSwiZG9jdW1lbnQiOiJkb2N1bWVudC5qc29uIiwiaGlzdG9yeSI6ZmFsc2UsInByb3ZlbmFuY2UiOiJwcm92ZW5hbmNlL2FjdG9ycy5qc29uIiwiYXNzZXRzIjpbXX1QSwMEFAAAAAAA6aIpXcBBGpcNAAAADQAAABYAAABwcm92ZW5hbmNlL2FjdG9ycy5qc29ueyJhY3RvcnMiOnt9fVBLAQIUAxQAAAAAAOmiKV15IlJQVwAAAFcAAAANAAAAAAAAAAAAAACAAQAAAABkb2N1bWVudC5qc29uUEsBAhQDFAAAAAAA6aIpXcZHHAF7AAAAewAAAA0AAAAAAAAAAAAAAIABggAAAG1hbmlmZXN0Lmpzb25QSwECFAMUAAAAAADpoildwEEalw0AAAANAAAAFgAAAAAAAAAAAAAAgAEoAQAAcHJvdmVuYW5jZS9hY3RvcnMuanNvblBLBQYAAAAAAwADALoAAABpAQAAAAA=";

function fixtureBytes(){return Uint8Array.from(atob(legacyV1Fixture),c=>c.charCodeAt(0));}

describe("WEGRA serialization",()=>{
  it("canonicalizes object keys recursively while preserving array order",()=>{
    expect(canonicalJson({z:1,a:{d:2,b:1},items:[{z:0,a:1},{b:2,a:3}]})).toBe('{"a":{"b":1,"d":2},"items":[{"a":1,"z":0},{"a":3,"b":2}],"z":1}');
  });

  it("rejects non-finite values",()=>{
    expect(()=>canonicalJson({value:NaN})).toThrow("non-finite");
    expect(()=>canonicalJson({value:Infinity})).toThrow("non-finite");
  });

  it("migrates a v1 manifest to the current version",()=>{
    const manifest=migrateWegraManifest({format:"wegra",version:1,document:"document.json",history:true,provenance:"provenance/actors.json",assets:["assets/b","assets/a","assets/a"]});
    expect(manifest.version).toBe(WEGRA_VERSION);
    expect(manifest.assets).toEqual(["assets/a","assets/a","assets/b"]);
    expect(manifest.document).toBe("document.json");
  });

  it("rejects future versions",()=>{
    expect(()=>migrateWegraManifest({format:"wegra",version:WEGRA_VERSION+1})).toThrow("Unsupported WEGRA version");
  });

  it("loads a real legacy v1 package fixture and migrates it on re-save",async()=>{
    const legacy=deserializeWegra(fixtureBytes());
    expect(legacy.document.id).toBe("legacy-v1");
    const migrated=await serializeWegra(legacy);
    const reopened=deserializeWegra(migrated);
    expect(reopened.document).toEqual(legacy.document);
    expect(reopened.actors).toEqual(legacy.actors);
    expect(migrated).toEqual(await serializeWegra(reopened));
  });

  it("produces byte-identical packages for the same document",async()=>{
    const project={document:baseDocument()};
    const a=await serializeWegra(project);
    const b=await serializeWegra(project);
    expect(a).toEqual(b);
  });
});
