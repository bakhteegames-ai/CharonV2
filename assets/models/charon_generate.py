"""
charon_generate.py  –  Blender 4.x / 5.x bpy script
Generates low-poly Charon + Gondola mesh (target ≤5 000 tris) and exports to GLB.

USAGE (command line):
    blender --background --python charon_generate.py

OUTPUT:
    assets/models/charon_gondola.glb  (next to this script)

PALETTE (from CharonV2 concept sheet):
    Moon Ivory    #F4E1D4
    Pale Aqua     #A8DCCC
    Spectral Teal #45A790
    Ethereal Mint #2A905F
    Gheet Gold    #F2E261   (trim / emissive)
    Soft Bone     #E9E1D4
"""

import bpy, bmesh, math, os
from mathutils import Vector

# ── helpers ───────────────────────────────────────────────────────────────────

def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))

def make_material(name, color_hex, emissive=False, emissive_strength=1.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    # Blender 5.x renamed the node – find it by type instead of by name
    bsdf = next(
        n for n in mat.node_tree.nodes
        if n.type == 'BSDF_PRINCIPLED'
    )
    r, g, b = hex_rgb(color_hex)
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
    bsdf.inputs['Roughness'].default_value   = 0.8
    bsdf.inputs['Metallic'].default_value    = 0.0
    if emissive:
        # 'Emission Color' may be 'Emission' in older builds – try both
        for key in ('Emission Color', 'Emission'):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = (r, g, b, 1.0)
                break
        for key in ('Emission Strength',):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = emissive_strength
    return mat

def assign_mat(obj, mat):
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def apply_all(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ── scene reset ───────────────────────────────────────────────────────────────

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()

# ── materials ─────────────────────────────────────────────────────────────────

mat_robe   = make_material('mat_robe',   '#45A790')
mat_hood   = make_material('mat_hood',   '#F4E1D4')
mat_trim   = make_material('mat_trim',   '#F2E261')
mat_boat   = make_material('mat_boat',   '#E9E1D4')
mat_paddle = make_material('mat_paddle', '#A8DCCC')
mat_glow   = make_material('mat_glow',   '#2A905F', emissive=True, emissive_strength=2.0)

# ── GONDOLA HULL ──────────────────────────────────────────────────────────────

def make_gondola():
    bm = bmesh.new()
    spine  = [(-2.4,0,.15),(-1.8,0,.05),(-1.0,0,0),(0,0,-.05),(1,0,0),(1.6,0,.08),(2.1,0,.25)]
    half_w = [0.05, 0.28, 0.42, 0.48, 0.40, 0.22, 0.05]
    rim_h  = 0.30
    kv_list, pv_list, sv_list = [], [], []
    for i,(x,_,z) in enumerate(spine):
        w = half_w[i]
        kv_list.append(bm.verts.new((x,  0.0, z-0.05)))
        pv_list.append(bm.verts.new((x, -w,   z+rim_h)))
        sv_list.append(bm.verts.new((x,  w,   z+rim_h)))
    n = len(spine)
    for i in range(n-1):
        bm.faces.new([kv_list[i], kv_list[i+1], pv_list[i+1], pv_list[i]])
        bm.faces.new([kv_list[i], sv_list[i],   sv_list[i+1], kv_list[i+1]])
        bm.faces.new([pv_list[i], pv_list[i+1], sv_list[i+1], sv_list[i]])
    bm.faces.new([kv_list[0],  pv_list[0],  sv_list[0]])
    bm.faces.new([kv_list[-1], sv_list[-1], pv_list[-1]])
    bm.normal_update()
    mesh = bpy.data.meshes.new('gondola_mesh')
    bm.to_mesh(mesh); bm.free()
    obj = bpy.data.objects.new('Gondola', mesh)
    bpy.context.collection.objects.link(obj)
    assign_mat(obj, mat_boat)
    return obj

gondola = make_gondola()

# ── GOLD TRIM ─────────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_plane_add(size=1)
trim = bpy.context.active_object
trim.name = 'GoldTrim'
trim.scale    = (2.5, 0.03, 0.02)
trim.location = (-0.15, 0.0, 0.35)
apply_all(trim)
assign_mat(trim, mat_trim)

# ── CHARON BODY ───────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.30, depth=0.85, location=(0,0,0.73))
body = bpy.context.active_object
body.name = 'CharonBody'
bpy.ops.object.mode_set(mode='EDIT')
bm2 = bmesh.from_edit_mesh(body.data)
bm2.verts.ensure_lookup_table()
for v in bm2.verts:
    if v.co.z > 0.3:
        v.co.x *= 0.65; v.co.y *= 0.65
bmesh.update_edit_mesh(body.data)
bpy.ops.object.mode_set(mode='OBJECT')
assign_mat(body, mat_robe)

# ── HOOD ──────────────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.28, location=(0,0,1.20))
hood = bpy.context.active_object
hood.name = 'Hood'
hood.scale.z = 1.25
apply_all(hood)
bpy.ops.object.mode_set(mode='EDIT')
bm3 = bmesh.from_edit_mesh(hood.data)
bm3.verts.ensure_lookup_table()
for v in bm3.verts:
    if v.co.z < 0.0:
        v.co.z = max(v.co.z, -0.05)
bmesh.update_edit_mesh(hood.data)
bpy.ops.object.mode_set(mode='OBJECT')
assign_mat(hood, mat_hood)

# ── HOOD PEAK ─────────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.06, radius2=0.0, depth=0.30, location=(0,0,1.52))
peak = bpy.context.active_object
peak.name = 'HoodPeak'
peak.rotation_euler.x = math.radians(10)
apply_all(peak)
assign_mat(peak, mat_trim)

# ── FACE PLANE ────────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_plane_add(size=0.22, location=(0,-0.18,1.15))
face_pl = bpy.context.active_object
face_pl.name = 'FacePlane'
face_pl.rotation_euler.x = math.radians(15)
apply_all(face_pl)
assign_mat(face_pl, mat_hood)

# ── SHOULDERS ─────────────────────────────────────────────────────────────────

shoulders = []
for side, y in [('L', -0.38), ('R', 0.38)]:
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.13, location=(0,y,1.08))
    sh = bpy.context.active_object
    sh.name = f'Shoulder_{side}'
    sh.scale = (0.7, 1.0, 0.55)
    apply_all(sh)
    assign_mat(sh, mat_trim)
    shoulders.append(sh)

# ── PADDLE ────────────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.025, depth=1.6, location=(-0.5,-0.55,0.90))
paddle_shaft = bpy.context.active_object
paddle_shaft.name = 'PaddleShaft'
paddle_shaft.rotation_euler.z = math.radians(35)
paddle_shaft.rotation_euler.x = math.radians(25)
apply_all(paddle_shaft)
assign_mat(paddle_shaft, mat_paddle)

bpy.ops.mesh.primitive_plane_add(size=0.5, location=(-1.15,-1.0,0.35))
blade = bpy.context.active_object
blade.name = 'PaddleBlade'
blade.scale = (1.0, 0.35, 1.0)
blade.rotation_euler.z = math.radians(35)
blade.rotation_euler.x = math.radians(25)
apply_all(blade)
assign_mat(blade, mat_paddle)

bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.08, location=(-1.30,-1.10,0.28))
glow = bpy.context.active_object
glow.name = 'PaddleGlow'
apply_all(glow)
assign_mat(glow, mat_glow)

# ── ROOT EMPTY + PARENT ───────────────────────────────────────────────────────

bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0,0,0))
root = bpy.context.active_object
root.name = 'Charon_Root'

children = [gondola, trim, body, hood, peak, face_pl, paddle_shaft, blade, glow] + shoulders
for obj in children:
    obj.select_set(True)
bpy.context.view_layer.objects.active = root
bpy.ops.object.parent_set(type='OBJECT', keep_transform=True)

# ── GLB EXPORT ────────────────────────────────────────────────────────────────

script_dir = os.path.dirname(os.path.abspath(__file__))
out_path   = os.path.join(script_dir, 'charon_gondola.glb')

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
