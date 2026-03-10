"""
charon_generate.py  –  Blender 4.x bpy script
Generates low-poly Charon + Gondola mesh (target ≤5 000 tris) and exports to GLB.

USAGE (command line):
    blender --background --python charon_generate.py

OUTPUT:
    assets/models/charon_gondola.glb  (next to this script)

PALETTE (from CharonV2 concept sheet):
    Moon Ivory   #F4E1D4
    Pale Aqua    #A8DCCC
    Spectral Teal #45A790
    Ethereal Mint #2A905F
    Gheet Gold   #F2E261   (trim / emissive)
    Soft Bone    #E9E1D4
"""

import bpy, bmesh, math, os
from mathutils import Vector

# ── helpers ──────────────────────────────────────────────────────────────────

def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))

def make_material(name, color_hex, emissive=False, emissive_strength=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    r, g, b = hex_rgb(color_hex)
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
    bsdf.inputs['Roughness'].default_value = 0.8
    bsdf.inputs['Metallic'].default_value = 0.0
    if emissive:
        bsdf.inputs['Emission Color'].default_value = (r, g, b, 1.0)
        bsdf.inputs['Emission Strength'].default_value = emissive_strength
    return mat

def assign_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def apply_all(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ── scene reset ──────────────────────────────────────────────────────────────

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# ── materials ────────────────────────────────────────────────────────────────

mat_robe   = make_material('mat_robe',   '#45A790')        # Spectral Teal
mat_hood   = make_material('mat_hood',   '#F4E1D4')        # Moon Ivory
mat_trim   = make_material('mat_trim',   '#F2E261', emissive=False)  # Gheet Gold
mat_boat   = make_material('mat_boat',   '#E9E1D4')        # Soft Bone
mat_paddle = make_material('mat_paddle', '#A8DCCC')        # Pale Aqua
mat_glow   = make_material('mat_glow',   '#2A905F', emissive=True, emissive_strength=2.0)  # emissive tip

# ── GONDOLA HULL ─────────────────────────────────────────────────────────────
# Hand-crafted low-poly hull using bmesh: elongated crescent shape top-down

def make_gondola():
    bm = bmesh.new()

    # Control spine points (x=forward, z=up, y=width)
    spine = [
        (-2.4, 0.0,  0.15),   # bow tip
        (-1.8, 0.0,  0.05),
        (-1.0, 0.0,  0.0),
        ( 0.0, 0.0, -0.05),   # widest mid
        ( 1.0, 0.0,  0.0),
        ( 1.6, 0.0,  0.08),
        ( 2.1, 0.0,  0.25),   # stern tip
    ]
    half_w = [0.05, 0.28, 0.42, 0.48, 0.40, 0.22, 0.05]
    rim_h  = 0.30   # rim height above keel

    keel_verts = []
    port_verts = []
    stbd_verts = []

    for i, (x, _, z) in enumerate(spine):
        w = half_w[i]
        kv = bm.verts.new(( x,  0.0,  z - 0.05))
        pv = bm.verts.new(( x, -w,    z + rim_h))
        sv = bm.verts.new(( x,  w,    z + rim_h))
        keel_verts.append(kv)
        port_verts.append(pv)
        stbd_verts.append(sv)

    # Side faces
    n = len(spine)
    for i in range(n - 1):
        # port side
        bm.faces.new([keel_verts[i], keel_verts[i+1], port_verts[i+1], port_verts[i]])
        # starboard
        bm.faces.new([keel_verts[i], stbd_verts[i],   stbd_verts[i+1], keel_verts[i+1]])
        # deck/rim top
        bm.faces.new([port_verts[i], port_verts[i+1], stbd_verts[i+1], stbd_verts[i]])

    # Bow cap
    bm.faces.new([keel_verts[0], port_verts[0], stbd_verts[0]])
    # Stern cap
    bm.faces.new([keel_verts[-1], stbd_verts[-1], port_verts[-1]])

    bm.normal_update()

    mesh = bpy.data.meshes.new('gondola_mesh')
    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new('Gondola', mesh)
    bpy.context.collection.objects.link(obj)
    assign_mat(obj, mat_boat)
    return obj

gondola = make_gondola()

# ── GOLD TRIM strip (simple plane along hull rim) ────────────────────────────

bpy.ops.mesh.primitive_plane_add(size=1)
trim = bpy.context.active_object
trim.name = 'GoldTrim'
trim.scale = (2.5, 0.03, 0.02)
trim.location = (-0.15, 0.0, 0.35)
trim.rotation_euler = (0, 0, 0)
apply_all(trim)
assign_mat(trim, mat_trim)

# ── CHARON BODY (robe as tapered cylinder) ────────────────────────────────────

bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.30, depth=0.85, location=(0, 0, 0.73))
body = bpy.context.active_object
body.name = 'CharonBody'
# taper top inward
bpy.ops.object.mode_set(mode='EDIT')
bm2 = bmesh.from_edit_mesh(body.data)
bm2.verts.ensure_lookup_table()
for v in bm2.verts:
    if v.co.z > 0.3:
        v.co.x *= 0.65
        v.co.y *= 0.65
bmesh.update_edit_mesh(body.data)
bpy.ops.object.mode_set(mode='OBJECT')
assign_mat(body, mat_robe)

# ── HOOD ─────────────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.28, location=(0, 0, 1.20))
hood = bpy.context.active_object
hood.name = 'Hood'
hood.scale.z = 1.25
apply_all(hood)
# flatten bottom half
bpy.ops.object.mode_set(mode='EDIT')
bm3 = bmesh.from_edit_mesh(hood.data)
bm3.verts.ensure_lookup_table()
for v in bm3.verts:
    if v.co.z < 0.0:
        v.co.z = max(v.co.z, -0.05)
bmesh.update_edit_mesh(hood.data)
bpy.ops.object.mode_set(mode='OBJECT')
assign_mat(hood, mat_hood)

# ── HOOD PEAK (gold horn-like spike) ─────────────────────────────────────────

bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.06, radius2=0.0, depth=0.30, location=(0, 0, 1.52))
peak = bpy.context.active_object
peak.name = 'HoodPeak'
peak.rotation_euler.x = math.radians(10)
apply_all(peak)
assign_mat(peak, mat_trim)

# ── FACE PLANE (visible through hood) ────────────────────────────────────────

bpy.ops.mesh.primitive_plane_add(size=0.22, location=(0, -0.18, 1.15))
face = bpy.context.active_object
face.name = 'FacePlane'
face.rotation_euler.x = math.radians(15)
apply_all(face)
assign_mat(face, mat_hood)

# ── SHOULDERS / PAULDRONS ────────────────────────────────────────────────────

for side, y in [('L', -0.38), ('R', 0.38)]:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.13, location=(0, y, 1.08))
    sh = bpy.context.active_object
    sh.name = f'Shoulder_{side}'
    sh.scale = (0.7, 1.0, 0.55)
    apply_all(sh)
    assign_mat(sh, mat_trim)

# ── PADDLE ───────────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.025, depth=1.6, location=(-0.5, -0.55, 0.90))
paddle_shaft = bpy.context.active_object
paddle_shaft.name = 'PaddleShaft'
paddle_shaft.rotation_euler.z = math.radians(35)
paddle_shaft.rotation_euler.x = math.radians(25)
apply_all(paddle_shaft)
assign_mat(paddle_shaft, mat_paddle)

# blade
bpy.ops.mesh.primitive_plane_add(size=0.5, location=(-1.15, -1.0, 0.35))
blade = bpy.context.active_object
blade.name = 'PaddleBlade'
blade.scale = (1.0, 0.35, 1.0)
blade.rotation_euler.z = math.radians(35)
blade.rotation_euler.x = math.radians(25)
apply_all(blade)
assign_mat(blade, mat_paddle)

# emissive glow tip
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.08, location=(-1.30, -1.10, 0.28))
glow = bpy.context.active_object
glow.name = 'PaddleGlow'
apply_all(glow)
assign_mat(glow, mat_glow)

# ── PARENT everything under empty ────────────────────────────────────────────

bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
root = bpy.context.active_object
root.name = 'Charon_Root'

for obj in [gondola, trim, body, hood, peak, face, paddle_shaft, blade, glow]:
    obj.select_set(True)
bpy.ops.object.parent_set(type='OBJECT', keep_transform=True)

# ── GLB EXPORT ───────────────────────────────────────────────────────────────

script_dir = os.path.dirname(os.path.abspath(__file__))
out_path = os.path.join(script_dir, 'charon_gondola.glb')

bpy.ops.export_scene.gltf(
    filepath=out_path,
    export_format='GLB',
    export_apply=True,
    export_materials='EXPORT',
    export_colors=True,
    export_cameras=False,
    export_lights=False,
)

print(f'[charon_generate] Exported → {out_path}')
