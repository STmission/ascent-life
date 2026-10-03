"""Stylized, hard-edged characters for 浮生 Ascent.

Visual language follows tactical-agent games such as Valorant: crisp planes,
blocked color, solid hair masses, arms at the sides. Faces and outfits are original.
Blender Z-up, face toward -Y, then a half turn so glTF faces the game's -Z.
"""

import math
import os
import sys

import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "models", "characters.glb")

CAST = [
    {
        "id": "youth_m",
        "tall": 1.0,
        "head": 1.0,
        "shoulder": 1.0,
        "hip": 1.0,
        "hair": "sweep",
        "outfit": "jacket",
        "skin": (0.93, 0.71, 0.57),
        "hair_c": (0.07, 0.07, 0.08),
        "cloth": (0.10, 0.11, 0.13),
        "cloth2": (0.90, 0.89, 0.86),
        "pants": (0.14, 0.15, 0.17),
        "accent": (0.78, 0.16, 0.18),
        "boot": (0.09, 0.09, 0.10),
    },
    {
        "id": "youth_f",
        "tall": 0.95,
        "head": 1.02,
        "shoulder": 0.88,
        "hip": 1.05,
        "hair": "long",
        "outfit": "skirt",
        "skin": (0.95, 0.73, 0.60),
        "hair_c": (0.06, 0.05, 0.06),
        "cloth": (0.12, 0.18, 0.42),
        "cloth2": (0.93, 0.90, 0.86),
        "pants": (0.18, 0.14, 0.28),
        "accent": (0.90, 0.28, 0.36),
        "boot": (0.12, 0.10, 0.11),
    },
    {
        "id": "parent_m",
        "tall": 1.0,
        "head": 0.98,
        "shoulder": 1.08,
        "hip": 1.06,
        "hair": "crop",
        "outfit": "jacket",
        "skin": (0.86, 0.66, 0.52),
        "hair_c": (0.16, 0.13, 0.11),
        "cloth": (0.22, 0.28, 0.26),
        "cloth2": (0.78, 0.76, 0.70),
        "pants": (0.20, 0.20, 0.22),
        "accent": (0.55, 0.32, 0.18),
        "boot": (0.18, 0.12, 0.08),
    },
    {
        "id": "parent_f",
        "tall": 0.94,
        "head": 1.0,
        "shoulder": 0.9,
        "hip": 1.08,
        "hair": "bob",
        "outfit": "coat",
        "skin": (0.90, 0.68, 0.55),
        "hair_c": (0.12, 0.09, 0.08),
        "cloth": (0.45, 0.20, 0.24),
        "cloth2": (0.93, 0.88, 0.82),
        "pants": (0.24, 0.20, 0.22),
        "accent": (0.72, 0.55, 0.28),
        "boot": (0.16, 0.12, 0.12),
    },
    {
        "id": "elder_m",
        "tall": 0.96,
        "head": 1.0,
        "shoulder": 0.98,
        "hip": 1.02,
        "hair": "crop",
        "outfit": "coat",
        "skin": (0.80, 0.64, 0.52),
        "hair_c": (0.72, 0.70, 0.68),
        "cloth": (0.28, 0.30, 0.34),
        "cloth2": (0.82, 0.80, 0.76),
        "pants": (0.22, 0.23, 0.26),
        "accent": (0.55, 0.22, 0.22),
        "boot": (0.14, 0.13, 0.12),
    },
    {
        "id": "elder_f",
        "tall": 0.90,
        "head": 1.0,
        "shoulder": 0.86,
        "hip": 1.04,
        "hair": "bob",
        "outfit": "coat",
        "skin": (0.84, 0.66, 0.55),
        "hair_c": (0.78, 0.76, 0.74),
        "cloth": (0.36, 0.28, 0.32),
        "cloth2": (0.90, 0.86, 0.82),
        "pants": (0.26, 0.24, 0.26),
        "accent": (0.62, 0.28, 0.32),
        "boot": (0.18, 0.14, 0.14),
    },
    {
        "id": "child_m",
        "tall": 0.72,
        "head": 1.28,
        "shoulder": 0.78,
        "hip": 0.82,
        "hair": "tuft",
        "outfit": "hoodie",
        "skin": (0.95, 0.74, 0.60),
        "hair_c": (0.08, 0.07, 0.08),
        "cloth": (0.16, 0.28, 0.55),
        "cloth2": (0.92, 0.90, 0.86),
        "pants": (0.18, 0.22, 0.36),
        "accent": (0.86, 0.42, 0.18),
        "boot": (0.90, 0.90, 0.92),
    },
    {
        "id": "child_f",
        "tall": 0.70,
        "head": 1.30,
        "shoulder": 0.74,
        "hip": 0.8,
        "hair": "bob",
        "outfit": "hoodie",
        "skin": (0.96, 0.75, 0.62),
        "hair_c": (0.10, 0.07, 0.08),
        "cloth": (0.62, 0.18, 0.28),
        "cloth2": (0.95, 0.92, 0.88),
        "pants": (0.28, 0.16, 0.22),
        "accent": (0.95, 0.82, 0.40),
        "boot": (0.92, 0.90, 0.88),
    },
]


def log(message):
    print(message, flush=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def color_mat(name, rgb, rough=0.42, metal=0.0, emit=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = rough
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metal
    if emit and "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*rgb, 1)
        bsdf.inputs["Emission Strength"].default_value = emit
    elif emit and "Emission" in bsdf.inputs:
        bsdf.inputs["Emission"].default_value = (*rgb, 1)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emit
    return mat


def harden(obj, angle=42):
    select_only(obj)
    bpy.ops.object.shade_smooth()
    modifier = obj.modifiers.new("Facet", "EDGE_SPLIT")
    modifier.split_angle = math.radians(angle)
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def add_box(parent, name, center, size, mat, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    obj.rotation_euler = rot
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    obj.data.materials.append(mat)
    harden(obj)
    obj.parent = parent
    return obj


def taper_vertical(obj, bottom, top):
    if obj is None:
        return
    mesh = obj.data
    heights = [vertex.co.z for vertex in mesh.vertices]
    low, high = min(heights), max(heights)
    span = max(high - low, 1e-4)
    for vertex in mesh.vertices:
        blend = (vertex.co.z - low) / span
        scale = bottom * (1 - blend) + top * blend
        vertex.co.x *= scale
        vertex.co.y *= scale
    mesh.update()


def add_limb(parent, name, start, end, radius, depth, mat, verts=16):
    start = Vector(start)
    end = Vector(end)
    direction = end - start
    length = max(direction.length, 0.02)
    mid = (start + end) / 2
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=1, depth=1, location=mid)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (radius, depth, length)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = direction.to_track_quat("Z", "Y")
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    obj.data.materials.append(mat)
    harden(obj, 72)
    obj.parent = parent
    return obj


def add_disc(parent, name, center, radius, depth, mat, rot=(1.5708, 0, 0)):
    bpy.ops.mesh.primitive_cylinder_add(vertices=20, radius=radius, depth=depth, location=center, rotation=rot)
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    harden(obj, 80)
    obj.parent = parent
    return obj


def shape_head(obj, gender_narrow, chin):
    mesh = obj.data
    for vertex in mesh.vertices:
        x, y, z = vertex.co
        front = max(0.0, -y)
        x *= 0.84 * gender_narrow
        z *= 1.04
        y *= 0.96
        if z < -0.01:
            taper = min(1.0, (-0.01 - z) / 0.11)
            x *= 1.0 - 0.22 * taper
            z -= chin * taper
            y -= 0.025 * taper * (0.4 + front)
        # Eye sockets.
        for side in (-0.32, 0.32):
            dx = x - side
            dy = y - (-0.78)
            dz = z - 0.08
            dist = math.sqrt(dx * dx + dy * dy * 0.55 + dz * dz)
            if dist < 0.28 and y < -0.2:
                y += 0.07 * (1 - dist / 0.28)
        # Brow shelf.
        if -0.15 < z < 0.22 and y < -0.45 and abs(x) < 0.55:
            y -= 0.05 * (1 - abs(z - 0.12) / 0.2) * (1 - abs(x) / 0.7)
        # Nose bridge.
        if abs(x) < 0.12 and -0.05 < z < 0.18 and y < 0:
            y -= 0.1 * (1 - abs(x) / 0.12) * (1 - abs(z - 0.06) / 0.2)
        # Lips.
        if abs(x) < 0.16 and -0.42 < z < -0.22 and y < -0.4:
            y -= 0.035 * (1 - abs(x) / 0.16)
        vertex.co = (x, y, z)


def build(spec):
    log(spec["id"])
    root = bpy.data.objects.new(spec["id"], None)
    bpy.context.scene.collection.objects.link(root)
    tall = spec["tall"]
    skin = color_mat(spec["id"] + "_skin", spec["skin"], 0.48)
    hair = color_mat(spec["id"] + "_hair", spec["hair_c"], 0.55)
    cloth = color_mat(spec["id"] + "_cloth", spec["cloth"], 0.4)
    shirt = color_mat(spec["id"] + "_shirt", spec["cloth2"], 0.5)
    pants = color_mat(spec["id"] + "_pants", spec["pants"], 0.48)
    accent = color_mat(spec["id"] + "_accent", spec["accent"], 0.35)
    boot = color_mat(spec["id"] + "_boot", spec["boot"], 0.4)
    eye_w = color_mat(spec["id"] + "_eyew", (0.93, 0.93, 0.95), 0.25)
    eye_i = color_mat(spec["id"] + "_eyei", (0.12, 0.08, 0.07), 0.2)
    catch = color_mat(spec["id"] + "_catch", (1, 1, 1), 0.2, emit=2.5)
    lip = color_mat(spec["id"] + "_lip", (0.72, 0.36, 0.38), 0.4)

    def z(value):
        return value * tall

    shoulder_x = 0.19 * spec["shoulder"]
    hip_x = 0.09 * spec["hip"]
    head_r = 0.132 * spec["head"]

    # Weight sits on one leg. Knees come slightly forward so the stance is not a pole.
    for side in (-1, 1):
        hx = hip_x * side
        lead = -0.045 if side < 0 else 0.02
        knee = (hx * 0.96, lead, z(0.46))
        add_limb(root, "boot", (hx, lead + 0.02, z(0.02)), (hx, lead, z(0.1)), 0.05, 0.04, boot)
        add_box(root, "sole", (hx, lead, z(0.015)), (0.065, 0.15, z(0.022)), accent)
        add_limb(root, "shin", (hx, lead + 0.01, z(0.1)), knee, 0.046, 0.04, pants)
        add_limb(root, "thigh", knee, (hx * 0.82, 0.0, z(0.92)), 0.062, 0.052, pants)

    add_limb(root, "pelvis", (0, 0.015, z(0.9)), (0, 0.0, z(1.04)), 0.125 * spec["hip"], 0.085, pants)
    torso = add_limb(root, "torso", (0, 0.0, z(1.04)), (0, -0.015, z(1.4)), 0.145 * spec["shoulder"], 0.085, shirt)
    taper_vertical(torso, 0.82, 1.12)
    if spec["outfit"] == "skirt":
        skirt = add_limb(root, "skirt", (0, 0.0, z(0.64)), (0, 0.0, z(0.98)), 0.15, 0.09, cloth)
        taper_vertical(skirt, 1.28, 0.72)
        jacket = add_limb(root, "jacket", (0, -0.02, z(1.08)), (0, -0.02, z(1.4)), 0.155 * spec["shoulder"], 0.095, cloth)
        taper_vertical(jacket, 0.9, 1.08)
    elif spec["outfit"] == "hoodie":
        hoodie = add_limb(root, "hoodie", (0, 0.0, z(0.96)), (0, -0.01, z(1.4)), 0.16 * spec["shoulder"], 0.1, cloth)
        taper_vertical(hoodie, 0.9, 1.08)
    elif spec["outfit"] == "coat":
        coat = add_limb(root, "coat", (0, 0.0, z(0.68)), (0, -0.01, z(1.42)), 0.16 * spec["shoulder"], 0.1, cloth)
        taper_vertical(coat, 1.05, 1.08)
    else:
        jacket = add_limb(root, "jacket", (0, -0.01, z(0.98)), (0, -0.02, z(1.42)), 0.16 * spec["shoulder"], 0.1, cloth)
        taper_vertical(jacket, 0.86, 1.1)
        add_box(root, "lapel", (-0.04, -0.13, z(1.28)), (0.04, 0.015, z(0.15)), shirt, rot=(0.1, 0.2, 0.1))
        add_box(root, "lapel", (0.04, -0.13, z(1.28)), (0.04, 0.015, z(0.15)), shirt, rot=(0.1, -0.2, -0.1))
    add_box(root, "collar", (0, -0.03, z(1.43)), (0.1, 0.09, z(0.035)), accent)

    for side in (-1, 1):
        sx = shoulder_x * side
        sleeve = cloth
        # Elbow opens outward, wrist settles back toward the hip.
        shoulder = (sx * 0.78, 0.0, z(1.36))
        elbow = (sx * 1.22, -0.07, z(1.06))
        wrist = (sx * 0.78, -0.1, z(0.9))
        add_limb(root, "upper", shoulder, elbow, 0.046, 0.04, sleeve)
        fore_mat = shirt if spec["outfit"] == "jacket" else sleeve
        add_limb(root, "fore", elbow, wrist, 0.036, 0.032, fore_mat)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, radius=0.034, location=(wrist[0], wrist[1] - 0.02, wrist[2] - z(0.04)))
        hand = bpy.context.active_object
        hand.name = "hand"
        hand.data.materials.append(skin)
        harden(hand, 80)
        hand.parent = root

    neck_z = z(1.48)
    add_limb(root, "neck", (0, 0.0, neck_z), (0, -0.01, z(1.56)), 0.045, 0.04, skin, 8)
    head_z = z(1.62) + (spec["head"] - 1) * 0.05
    bpy.ops.mesh.primitive_uv_sphere_add(segments=20, ring_count=14, radius=head_r, location=(0, -0.01, head_z))
    head = bpy.context.active_object
    head.name = "head"
    shape_head(head, 0.96 if spec["id"].endswith("_f") else 1.0, 0.012)
    head.data.materials.append(skin)
    harden(head, 82)
    head.parent = root

    for side in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=8, ring_count=6, radius=0.02, location=(side * head_r * 0.95, 0.0, head_z))
        ear = bpy.context.active_object
        ear.scale = (0.6, 1.1, 1.4)
        bpy.ops.object.transform_apply(scale=True)
        ear.data.materials.append(skin)
        harden(ear, 40)
        ear.parent = root

    eye_y = -head_r * 1.28
    eye_z = head_z + 0.004 * spec["head"]
    span = 0.042 * spec["head"]
    pupil = color_mat(spec["id"] + "_pupil", (0.04, 0.03, 0.03), 0.15)
    for side in (-1, 1):
        ex = side * span
        add_disc(root, "sclera", (ex, eye_y, eye_z), 0.034 * spec["head"], 0.012, eye_w)
        add_disc(root, "iris", (ex, eye_y - 0.01, eye_z - 0.002), 0.028 * spec["head"], 0.01, eye_i)
        add_disc(root, "pupil", (ex, eye_y - 0.016, eye_z - 0.002), 0.01 * spec["head"], 0.008, pupil)
        add_box(root, "catch", (ex + side * 0.008, eye_y - 0.02, eye_z + 0.01), (0.008, 0.004, 0.008), catch)
        add_box(
            root,
            "brow",
            (ex, eye_y - 0.01, eye_z + 0.034 * spec["head"]),
            (0.04 * spec["head"], 0.012, 0.01),
            hair,
            rot=(0.15, 0, side * 0.28),
        )
    add_box(root, "mouth", (0, eye_y - 0.01, head_z - 0.055 * spec["head"]), (0.032, 0.01, 0.008), lip)
    add_box(root, "nose", (0, eye_y - 0.012, head_z - 0.012), (0.012, 0.016, 0.016), skin)

    def hair_shell(name, center, scale, rot=(0, 0, 0)):
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=12, radius=1, location=center)
        obj = bpy.context.active_object
        obj.name = name
        obj.scale = scale
        obj.rotation_euler = rot
        bpy.ops.object.transform_apply(scale=True, rotation=True)
        obj.data.materials.append(hair)
        harden(obj, 78)
        obj.parent = root
        return obj

    # Cap sits behind the face so the eyes stay clear, and still covers the crown.
    # Crown sits forward of the skull so the forehead is hair, and stops above the eyes.
    if spec["hair"] == "crop":
        hair_shell("haircap", (0, -head_r * 0.05, head_z + head_r * 0.55), (head_r * 1.12, head_r * 1.05, head_r * 0.55))
    elif spec["hair"] == "tuft":
        hair_shell("haircap", (0, -head_r * 0.05, head_z + head_r * 0.58), (head_r * 1.15, head_r * 1.08, head_r * 0.58))
        hair_shell("tuft", (0.02, -head_r * 0.2, head_z + head_r * 1.05), (0.05, 0.04, 0.08), (0.4, 0, 0.15))
    else:
        hair_shell("haircap", (0, -head_r * 0.08, head_z + head_r * 0.72), (head_r * 1.22, head_r * 1.15, head_r * 0.62))
    if spec["hair"] == "sweep":
        hair_shell("fringe", (0.02, -head_r * 0.85, head_z + head_r * 0.35), (head_r * 0.85, head_r * 0.35, head_r * 0.28), (0.5, 0, 0.15))
    elif spec["hair"] == "long":
        hair_shell("bangs", (0, -head_r * 0.9, head_z + head_r * 0.42), (head_r * 0.9, head_r * 0.28, head_r * 0.22), (0.6, 0, 0))
        add_limb(root, "sheet", (0, head_r * 0.45, head_z - 0.04), (0, head_r * 0.5, head_z - 0.48), 0.12, 0.045, hair)
        for side in (-1, 1):
            add_limb(root, "lock", (side * head_r * 0.95, -head_r * 0.15, head_z - 0.02), (side * head_r * 1.0, -head_r * 0.25, head_z - 0.42), 0.03, 0.022, hair)
    elif spec["hair"] == "bob":
        hair_shell("bangs", (0, -head_r * 0.82, head_z + head_r * 0.28), (head_r * 0.95, head_r * 0.32, head_r * 0.24))
        add_limb(root, "bob", (0, head_r * 0.15, head_z - 0.02), (0, head_r * 0.2, head_z - 0.16), 0.145, 0.07, hair)

    return root


def aim(camera, target):
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def render_pair(roots):
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1400
    scene.render.resolution_y = 900
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs[0].default_value = (0.62, 0.66, 0.7, 1)
        background.inputs[1].default_value = 1.0
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 3.4
    sun_obj = bpy.data.objects.new("Sun", sun)
    scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (0.85, 0.15, -0.4)
    camera_data = bpy.data.cameras.new("Cam")
    camera_data.lens = 42
    camera = bpy.data.objects.new("Cam", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    focus = next((item for item in roots if item.name == "youth_f"), roots[-1])
    camera.location = Vector((0.0, -5.2, 1.35))
    aim(camera, Vector((0.0, 0.0, 0.92)))
    path = os.path.join(ROOT, "tools", "blender", "agents-preview.png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    log(path)
    camera.location = Vector((focus.location.x, -1.15, 1.58))
    aim(camera, Vector((focus.location.x, 0.0, 1.64)))
    close = os.path.join(ROOT, "tools", "blender", "agents-face.png")
    scene.render.filepath = close
    bpy.ops.render.render(write_still=True)
    log(close)


def export_glb():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    for obj in bpy.context.scene.objects:
        if obj.parent is None and obj.type == "EMPTY":
            obj.location = (0.0, 0.0, 0.0)
            # Blender front (-Y) becomes glTF -Z, which is the way the player walks.
            obj.rotation_euler[2] = math.pi
    bpy.ops.export_scene.gltf(
        filepath=OUT,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )
    log(f"wrote {OUT} ({os.path.getsize(OUT) / 1048576:.1f} MB)")


def main():
    wanted = {arg for arg in sys.argv if arg in {spec["id"] for spec in CAST}}
    clear_scene()
    roots = []
    for spec in CAST:
        if wanted and spec["id"] not in wanted:
            continue
        roots.append(build(spec))
    # Space only the preview copies' parents, then put them back before export.
    for index, root in enumerate(roots):
        root.location.x = (index - (len(roots) - 1) / 2) * 0.95
    if roots:
        render_pair(roots)
    for root in roots:
        root.location.x = 0.0
    export_glb()


if __name__ == "__main__":
    main()
