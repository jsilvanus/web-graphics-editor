# 3D Feature Plan

This is the implementation roadmap for the 3D editor. Keep the architecture modular: small UI components, pure geometry kernels, thin orchestration layers, and no monolithic components.

## 1. Mesh editing — finish the modeling kernel

- [x] 3D views as timeline/canvas objects
- [x] 3D world → meshes/cameras/lights
- [x] object selection
- [x] transform gizmo
- [x] vertex/face/edge selection groundwork
- [x] face inset
- [x] face extrusion groundwork
- [x] edge bevel
- [x] boundary-edge bevel
- [x] multi-edge bevel with corner closure
- [ ] face translation
- [ ] robust multi-face extrusion
- [ ] move/add/delete vertices
- [ ] add/delete faces
- [ ] edge split/subdivide
- [ ] merge/weld vertices
- [ ] loop/ring selection
- [ ] duplicate/extract faces
- [ ] normals/recalculate/flip normals
- [ ] basic topology validation

## 2. Materials & appearance

- [x] material inspector
- [x] base color
- [x] roughness
- [x] metalness
- [x] opacity/transparency
- [x] wireframe
- [ ] textures/images
- [ ] UV coordinates/editor
- [ ] material assignment per face
- [x] proper lighting controls

## 3. Scene/world editing

- [x] light selection/editing
- [x] multiple light types
- [x] camera transform/rotation controls
- [x] camera preview/framing
- [x] object visibility
- [x] View object-selection/render selection
- [x] View selection connected to rendering

## 4. 3D animation

- [x] 3D timeline data model groundwork
- [x] animate mesh transforms
- [x] animate cameras
- [x] animate lights
- [ ] animate View properties
- [x] visibility animation
- [x] interpolation/easing
- [ ] 3D timeline UI cleanup
- [x] connect animated 3D state to renderer
- [x] world-local time mapping and looping

## 5. Rendering

- [x] proper View renderer
- [x] prerender mode
- [x] live mode
- [x] render cache
- [x] intelligent cache invalidation via evaluated source state/time
- [x] transparency/compositing into 2D
- [x] camera/render settings
- [x] shadows
- [x] anti-aliasing/quality settings
- [x] bounded frame cache for animated playback

## 6. Import/export

- [ ] `.wegra` serialization of 3D worlds
- [ ] Blender import/export
- [ ] preserve topology/materials/cameras
- [ ] preserve animation

## 7. Editor polish

- [ ] undo/redo correctness for mesh operations
- [ ] selection persistence
- [ ] keyboard shortcuts
- [ ] snapping
- [ ] numeric transform panels
- [ ] performance with larger meshes
- [x] topology/geometry tests for bevel operations
- [ ] rendering tests

## Implementation order

1. Face translation
2. Robust multi-face extrusion
3. Vertex operations
4. Face/edge topology operations
5. Normals
6. Mesh validation/tests
7. Materials
8. Lights/cameras
9. View object-selection → rendering
10. 3D animation → renderer
11. Prerender/live rendering
12. Blender + `.wegra` interchange

## Architecture rule

Do not grow existing large components. Extract reusable behavior into small modules/hooks/components before adding substantial functionality. Geometry operations should remain independently testable and the editor UI should orchestrate them rather than contain topology algorithms.
