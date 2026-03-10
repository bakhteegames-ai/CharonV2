"""
charon_generate.py  –  Blender 4.x / 5.x bpy script
Generates low-poly Charon + Gondola mesh (≤5 000 tris) and exports to GLB.

USAGE:
    blender --background --python charon_generate.py
OUTPUT:
    charon_gondola.glb  (next to this script)
"""

import bpy, bmesh, math, os

# ── HELPERS ────────────────────────────────────────────────────────────────

def hex_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))

def make_mat(name, color_hex, emissive=False, em_strength=2.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    r, g, b = hex_rgb(color_hex)
    bsdf.inputs['Base Color'].default_value = (r, g, b, 1.0)
    bsdf.inputs['Roughness'].default_value  = 0.75
    bsdf.inputs['Metallic'].default_value   = 0.05
    if emissive:
        for key in ('Emission Color', 'Emission'):
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = (r, g, b, 1.0)
                break
        if 'Emission Strength' in bsdf.inputs:
            bsdf.inputs['Emission Strength'].default_value = em_strength
    return mat

def set_mat(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)

def apply_tf(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ── RESET SCENE ────────────────────────────────────────────────────────────

bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete()
for block in bpy.data.meshes:   bpy.data.meshes.remove(block)
for block in bpy.data.materials: bpy.data.materials.remove(block)

# ── MATERIALS ──────────────────────────────────────────────────────────────

M_BOAT   = make_mat('M_Boat',   '#E9E1D4')           # Soft Bone
M_TRIM   = make_mat('M_Trim',   '#F2E261')           # Gheet Gold
M_ROBE   = make_mat('M_Robe',   '#45A790')           # Spectral Teal
M_HOOD   = make_mat('M_Hood',   '#F4E1D4')           # Moon Ivory
M_PADDLE = make_mat('M_Paddle', '#A8DCCC')           # Pale Aqua
M_GLOW   = make_mat('M_Glow',   '#2A905F', emissive=True)  # Ethereal Mint emissive

# ── GONDOLA HULL ───────────────────────────────────────────────────────────
# Elongated crescent boat, Y=width, X=length, Z=up

def make_gondola():
    bm = bmesh.new()
    # (x_along_boat,  half_width,  keel_z,  rim_z)
    profile = [
        (-2.2, 0.04, -0.10,  0.10),  # bow tip
        (-1.6, 0.22, -0.18,  0.22),
        (-0.8, 0.42, -0.20,  0.25),
        ( 0.0, 0.50, -0.22,  0.25),  # midship
        ( 0.8, 0.42, -0.20,  0.25),
        ( 1.5, 0.25, -0.16,  0.28),
        ( 2.0, 0.05, -0.05,  0.40),  # stern (raised)
    ]
    kv, lv, rv = [], [], []
    for x, w, kz, rz in profile:
        kv.append(bm.verts.new((x,  0.0, kz)))
        lv.append(bm.verts.new((x, -w,   rz)))
        rv.append(bm.verts.new((x,  w,   rz)))
    n = len(profile)
    for i in range(n-1):
        bm.faces.new([kv[i], lv[i],   lv[i+1], kv[i+1]])  # port bottom
        bm.faces.new([kv[i], kv[i+1], rv[i+1], rv[i]])    # stbd bottom
        bm.faces.new([lv[i], lv[i+1], rv[i+1], rv[i]])    # deck top
    bm.faces.new([kv[0], lv[0], rv[0]])    # bow cap
    bm.faces.new([kv[-1],rv[-1],lv[-1]])   # stern cap
    bm.normal_update()
    me = bpy.data.meshes.new('Gondola')
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('Gondola', me)
    bpy.context.collection.objects.link(ob)
    set_mat(ob, M_BOAT)
    return ob

gondola = make_gondola()

# ── GOLD TRIM STRIP ─────────────────────────────────────────────────────────
# Two thin planks running along port and starboard rim

for y_sign in (-1, 1):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0, y_sign*0.45, 0.26))
    t = bpy.context.active_object
    t.name = f'Trim_{'L' if y_sign<0 else 'R'}'
    t.scale = (2.2, 0.04, 0.03)
    apply_tf(t)
    set_mat(t, M_TRIM)

# ── CHARON BODY (robe) ──────────────────────────────────────────────────────
# Sitting pose: short torso above boat center

bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.28, depth=0.60, location=(0, 0, 0.58))
body = bpy.context.active_object
body.name = 'Body'
bpy.ops.object.mode_set(mode='EDIT')
bm2 = bmesh.from_edit_mesh(body.data)
bm2.verts.ensure_lookup_table()
for v in bm2.verts:
    if v.co.z > 0.20:   # taper shoulders
        v.co.x *= 0.70; v.co.y *= 0.70
    if v.co.z < -0.20:  # flare hem
        v.co.x *= 1.20; v.co.y *= 1.20
bmesh.update_edit_mesh(body.data)
bpy.ops.object.mode_set(mode='OBJECT')
set_mat(body, M_ROBE)

# ── HOOD + HEAD ──────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=5, radius=0.24, location=(0, 0, 1.08))
hood = bpy.context.active_object
hood.name = 'Hood'
hood.scale = (0.95, 1.10, 1.30)  # elongate vertically for hood drape
apply_tf(hood)
# flatten bottom so it sits on shoulders
bpy.ops.object.mode_set(mode='EDIT')
bm3 = bmesh.from_edit_mesh(hood.data)
bm3.verts.ensure_lookup_table()
for v in bm3.verts:
    if v.co.z < -0.05:
        v.co.z = -0.05
bmesh.update_edit_mesh(hood.data)
bpy.ops.object.mode_set(mode='OBJECT')
set_mat(hood, M_HOOD)

# ── HOOD PEAK (golden spike) ───────────────────────────────────────────────

bpy.ops.mesh.primitive_cone_add(vertices=4, radius1=0.05, radius2=0.0, depth=0.28, location=(0, 0, 1.45))
peak = bpy.context.active_object
peak.name = 'HoodPeak'
apply_tf(peak)
set_mat(peak, M_TRIM)

# ── SHOULDERS / COLLAR ───────────────────────────────────────────────────────

shoulders = []
for side, y in (('L', -0.33), ('R', 0.33)):
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.12, location=(0, y, 0.92))
    sh = bpy.context.active_object
    sh.name = f'Shoulder_{side}'
    sh.scale = (0.65, 0.90, 0.50)
    apply_tf(sh)
    set_mat(sh, M_TRIM)
    shoulders.append(sh)

# ── ARMS (simple stretched cubes) ─────────────────────────────────────────────
# Left arm reaching forward toward paddle

bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.35, -0.30, 0.82))
arm_l = bpy.context.active_object
arm_l.name = 'Arm_L'
arm_l.scale = (0.50, 0.12, 0.10)
arm_l.rotation_euler.z = math.radians(-20)
apply_tf(arm_l)
set_mat(arm_l, M_ROBE)

# Right arm down
bpy.ops.mesh.primitive_cube_add(size=1, location=(0.10, 0.30, 0.75))
arm_r = bpy.context.active_object
arm_r.name = 'Arm_R'
arm_r.scale = (0.35, 0.11, 0.10)
arm_r.rotation_euler.z = math.radians(15)
apply_tf(arm_r)
set_mat(arm_r, M_ROBE)

# ── PADDLE SHAFT ────────────────────────────────────────────────────────────

bpy.ops.mesh.primitive_cylinder_add(vertices=6, radius=0.022, depth=2.0,
                                    location=(-0.60, -0.60, 0.70))
shaft = bpy.context.active_object
shaft.name = 'PaddleShaft'
shaft.rotation_euler.x = math.radians(20)
shaft.rotation_euler.z = math.radians(30)
apply_tf(shaft)
set_mat(shaft, M_PADDLE)

# blade
bpy.ops.mesh.primitive_cube_add(size=1, location=(-1.30, -1.20, 0.15))
blade = bpy.context.active_object
blade.name = 'PaddleBlade'
blade.scale = (0.55, 0.14, 0.30)
blade.rotation_euler.z = math.radians(30)
blade.rotation_euler.x = math.radians(15)
apply_tf(blade)
set_mat(blade, M_PADDLE)

# emissive glow tip
bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=0.07, location=(-1.45, -1.30, 0.08))
glow = bpy.context.active_object
glow.name = 'PaddleGlow'
apply_tf(glow)
set_mat(glow, M_GLOW)

# ── ROOT + PARENT ALL ──────────────────────────────────────────────────────────

bpy.ops.object.select_all(action='DESELECT')
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
root = bpy.context.active_object
root.name = 'Charon_Root'

children = [gondola, body, hood, peak, shaft, blade, glow, arm_l, arm_r] + shoulders
# add trim strips
for ob in bpy.data.objects:
    if ob.name.startswith('Trim_'):
        children.append(ob)

for ob in children:
    ob.select_set(True)
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
    export_cameras=False,
    export_lights=False,
)

print(f'[charon_generate] Exported → {out_path}')
