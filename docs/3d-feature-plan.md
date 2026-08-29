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
- [x] multi-edge bevel/corner topology groundwork
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

- [ ] material inspector
- [ ] base color
- [ ] roughness
- [ ] metalness
- [ ] opacity/transparency
- [ ] wireframe
- [ ] textures/images
- [ ] UV coordinates/editor
- [ ] material assignment per face
- [ ] proper lighting controls

## 3. Scene/world editing

- [ ] light selection/editing
- [ ] multiple light types
- [ ] camera transform/rotation controls
- [ ] camera preview/framing
- [ ] object visibility
- [ ] View object-selection/render selection
- [ ] View selection connected to rendering

## 4. 3D animation

- [x] 3D timeline data model groundwork
- [ ] animate mesh transforms
- [ ] animate cameras
- [ ] animate lights
- [ ] animate View properties
- [ ] visibility animation
- [ ] interpolation/easing
- [ ] 3D timeline UI cleanup
- [ ] connect animated 3D state to renderer

## 5. Rendering

- [ ] proper View renderer
- [ ] prerender mode
- [ ] live mode
- [ ] render cache
- [ ] intelligent cache invalidation
- [ ] transparency/compositing into 2D
- [ ] camera/render settings
- [ ] shadows
- [ ] anti-aliasing/quality settings

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
- [ ] topology/geometry tests
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
