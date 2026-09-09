import {describe,expect,it} from "vitest";
import {canonicalJson,migrateWegraManifest,serializeWegra,WEGRA_VERSION} from "./wegra";
import {baseDocument} from "./test-fixtures";

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

  it("produces byte-identical packages for the same document",async()=>{
    const project={document:baseDocument()};
    const a=await serializeWegra(project);
    const b=await serializeWegra(project);
    expect(a).toEqual(b);
  });
});
