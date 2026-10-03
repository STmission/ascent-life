"""Designed, hard-edged sets for every chapter of 浮生 Ascent.

Large flat planes, beveled furniture, and a different color story per place.
Coordinates match layout.js: Blender X = game X, Blender -Y = game Z, Blender Z = height.
"""

import os

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT = os.path.join(ROOT, "public", "models", "scenes.glb")

ROOMS = {
    "home": {"minX": -7, "maxX": 7, "minZ": -5, "maxZ": 5},
    "school": {"minX": -8, "maxX": 8, "minZ": -6, "maxZ": 6},
    "campus": {"minX": -9.5, "maxX": 9.5, "minZ": -7.5, "maxZ": 7.5},
    "work": {"minX": -7.2, "maxX": 7.2, "minZ": -5.2, "maxZ": 5.2},
    "hospital": {"minX": -8.4, "maxX": 8.4, "minZ": -3.4, "maxZ": 3.4},
    "split": {"minX": -6.8, "maxX": 6.8, "minZ": -4.6, "maxZ": 4.6},
    "wedding": {"minX": -8, "maxX": 8, "minZ": -6.2, "maxZ": 6.2},
    "apartment": {"minX": -6.2, "maxX": 6.2, "minZ": -4.6, "maxZ": 4.6},
    "park": {"minX": -10, "maxX": 10, "minZ": -8, "maxZ": 8},
    "shore": {"minX": -10, "maxX": 10, "minZ": -7, "maxZ": 7},
}


def log(message):
    print(message, flush=True)


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def make_mat(name, rgb, rough=0.55, alpha=1.0, metal=0.0, emit=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = (*rgb, 1)
    bsdf.inputs["Roughness"].default_value = rough
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metal
    if "Alpha" in bsdf.inputs and alpha < 1:
        bsdf.inputs["Alpha"].default_value = alpha
        if hasattr(mat, "blend_method"):
            mat.blend_method = "BLEND"
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "BLENDED"
    if emit and "Emission Strength" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (*rgb, 1) if "Emission Color" in bsdf.inputs else (*rgb, 1)
        bsdf.inputs["Emission Strength"].default_value = emit
    return mat


def harden(obj, bevel=0.0):
    select_only(obj)
    if bevel > 0:
        modifier = obj.modifiers.new("Bevel", "BEVEL")
        modifier.width = bevel
        modifier.segments = 1
        modifier.affect = "EDGES"
        try:
            bpy.ops.object.modifier_apply(modifier=modifier.name)
        except RuntimeError:
            obj.modifiers.remove(modifier)
    bpy.ops.object.shade_smooth()
    split = obj.modifiers.new("Facet", "EDGE_SPLIT")
    split.split_angle = 1.05
    bpy.ops.object.modifier_apply(modifier=split.name)


def cube(parent, name, gx, gz, sx, sz, bottom, height, mat, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(gx, -gz, bottom + height / 2))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, sz, height)
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(mat)
    harden(obj, bevel)
    obj.parent = parent
    return obj


def cyl(parent, name, gx, gz, radius, bottom, height, mat, verts=16):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=height, location=(gx, -gz, bottom + height / 2))
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    harden(obj, 0.0)
    obj.parent = parent
    return obj


def ball(parent, name, gx, gz, radius, center_z, mat, sx=1.0, sy=1.0, sz=1.0):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=10, radius=radius, location=(gx, -gz, center_z))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx, sy, sz)
    bpy.ops.object.transform_apply(scale=True)
    obj.data.materials.append(mat)
    select_only(obj)
    bpy.ops.object.shade_smooth()
    obj.parent = parent
    return obj


def cone(parent, name, gx, gz, radius, bottom, height, mat, verts=12):
    bpy.ops.mesh.primitive_cone_add(vertices=verts, radius1=radius, depth=height, location=(gx, -gz, bottom + height / 2))
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    harden(obj, 0.0)
    obj.parent = parent
    return obj


def glass_pane(parent, mats, gx, gz, width, height, y, side):
    z = gz + (0.03 if side == "south" else -0.03)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(gx, -z, y))
    obj = bpy.context.active_object
    obj.name = "Glass"
    obj.scale = (width, height, 1)
    obj.rotation_euler[0] = 1.5708
    bpy.ops.object.transform_apply(scale=True, rotation=True)
    obj.data.materials.append(mats["glass"])
    obj.parent = parent
    # Mullions.
    cube(parent, "Mullion", gx, gz, 0.04, 0.05, y - height / 2, height, mats["trim"])
    cube(parent, "Mullion", gx, gz, width, 0.05, y - 0.02, 0.04, mats["trim"])


def shell(root, mats, room, floor_mat, wall_mat, dado_mat, door_x, windows):
    width = room["maxX"] - room["minX"]
    depth = room["maxZ"] - room["minZ"]
    cx = (room["minX"] + room["maxX"]) / 2
    cz = (room["minZ"] + room["maxZ"]) / 2
    cube(root, "Ground", cx, cz, width + 16, depth + 16, -0.2, 0.08, mats["concrete"])
    cube(root, "Floor", cx, cz, width, depth, -0.06, 0.08, floor_mat)
    # A few floor boards so the ground is not one slab.
    for index, offset in enumerate((-0.35, 0.05, 0.45)):
        cube(root, "FloorBoard", cx, cz + offset * depth * 0.5, width * 0.96, 0.025, 0.02, 0.008, mats["floor_line"])
    height = 2.7
    thick = 0.16
    cube(root, "Wall_west", room["minX"], cz, thick, depth, 0, height, wall_mat)
    cube(root, "Wall_east", room["maxX"], cz, thick, depth, 0, height, wall_mat)
    wall_run(root, mats, wall_mat, room, "north", windows, None, height, thick)
    wall_run(root, mats, wall_mat, room, "south", [], door_x, height, thick)
    cube(root, "Dado_n", cx, room["minZ"] + 0.1, width - 0.5, 0.04, 0, 0.95, dado_mat)
    cube(root, "Dado_s", cx, room["maxZ"] - 0.1, width - 0.5, 0.04, 0, 0.95, dado_mat)
    cube(root, "Rail", cx, room["minZ"] + 0.12, width - 0.6, 0.06, 0.95, 0.06, mats["trim"])
    cube(root, "Ceil", cx, cz, width - 0.08, depth - 0.08, 2.62, 0.08, wall_mat)
    cube(root, "CeilTrim", cx, cz, width * 0.55, depth * 0.28, 2.5, 0.04, mats["trim"])


def wall_run(root, mats, mat, room, side, windows, door_x, height, thick):
    z = room["minZ"] if side == "north" else room["maxZ"]
    gaps = []
    for window in windows:
        if window["side"] == side:
            gaps.append((window["x"] - window["w"] / 2, window["x"] + window["w"] / 2, window))
    if door_x is not None:
        gaps.append((door_x - 0.58, door_x + 0.58, None))
    gaps.sort()
    cursor = room["minX"]
    for left, right, window in gaps:
        if left > cursor + 0.05:
            cube(root, f"Wall_{side}", (cursor + left) / 2, z, left - cursor, thick, 0, height, mat)
        if window:
            cube(root, "Sill", window["x"], z, window["w"], thick, 0, 0.78, mat)
            cube(root, "Head", window["x"], z, window["w"], thick, 2.2, height - 2.2, mat)
            glass_pane(root, mats, window["x"], z, window["w"] - 0.12, 1.25, 1.48, side)
            cube(root, "Frame", window["x"], z, window["w"] + 0.08, 0.08, 0.72, 1.55, mats["trim"])
            cube(root, "Curtain", window["x"] - window["w"] * 0.42, z, 0.12, 0.05, 0.8, 1.35, mats["curtain"])
            cube(root, "Curtain", window["x"] + window["w"] * 0.42, z, 0.12, 0.05, 0.8, 1.35, mats["curtain"])
        else:
            cube(root, "DoorHead", door_x, z, 1.16, thick, 2.2, height - 2.2, mat)
            leaf = z + (0.16 if side == "north" else -0.16)
            cube(root, "Door", door_x + 0.22, leaf, 0.52, 0.06, 0, 2.12, mats["door"])
            cube(root, "Knob", door_x + 0.02, leaf, 0.04, 0.06, 1.0, 0.04, mats["metal"])
        cursor = right
    if room["maxX"] - cursor > 0.05:
        cube(root, f"Wall_{side}_end", (cursor + room["maxX"]) / 2, z, room["maxX"] - cursor, thick, 0, height, mat)


def win(x, width, side="north"):
    return {"side": side, "x": x, "w": width}


def lamp(root, mats, gx, gz):
    cyl(root, "Furn_cord", gx, gz, 0.015, 2.15, 0.45, mats["metal"], 6)
    bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=0.16, depth=0.08, location=(gx, -gz, 2.12))
    shade = bpy.context.active_object
    shade.name = "Furn_lamp"
    shade.data.materials.append(mats["lamp"])
    harden(shade)
    shade.parent = root


def bed(root, mats, gx, gz, sx, sz):
    cube(root, "Furn_frame", gx, gz, sx, sz, 0.12, 0.28, mats["wood"], 0.01)
    cube(root, "Furn_post", gx - sx * 0.46, gz - sz * 0.42, 0.08, 0.08, 0, 0.95, mats["wood_dark"])
    cube(root, "Furn_post", gx + sx * 0.46, gz - sz * 0.42, 0.08, 0.08, 0, 0.95, mats["wood_dark"])
    cube(root, "Furn_board", gx, gz - sz * 0.46, sx * 0.9, 0.06, 0.28, 0.55, mats["wood"])
    cube(root, "Furn_mattress", gx, gz + 0.02, sx * 0.9, sz * 0.78, 0.4, 0.16, mats["linen"], 0.008)
    cube(root, "Furn_pillow", gx, gz - sz * 0.22, sx * 0.42, sz * 0.22, 0.56, 0.1, mats["white"])
    cube(root, "Furn_fold", gx, gz + sz * 0.18, sx * 0.88, sz * 0.28, 0.56, 0.06, mats["accent"])


def table(root, mats, gx, gz, sx, sz):
    cube(root, "Furn_top", gx, gz, sx, sz, 0.74, 0.05, mats["wood"], 0.008)
    for dx in (-sx * 0.4, sx * 0.4):
        for dz in (-sz * 0.35, sz * 0.35):
            cube(root, "Furn_leg", gx + dx, gz + dz, 0.06, 0.06, 0, 0.74, mats["wood_dark"])
    cube(root, "Furn_bowl", gx, gz - 0.05, 0.22, 0.22, 0.8, 0.06, mats["accent"])


def sofa(root, mats, gx, gz, sx, sz, cloth):
    cube(root, "Furn_base", gx, gz, sx, sz * 0.7, 0.16, 0.22, cloth, 0.01)
    cube(root, "Furn_back", gx, gz - sz * 0.28, sx, 0.12, 0.16, 0.48, cloth, 0.008)
    cube(root, "Furn_arm", gx - sx * 0.46, gz, 0.1, sz * 0.7, 0.16, 0.36, cloth)
    cube(root, "Furn_arm", gx + sx * 0.46, gz, 0.1, sz * 0.7, 0.16, 0.36, cloth)
    cube(root, "Furn_cushion", gx - sx * 0.18, gz, sx * 0.36, sz * 0.5, 0.38, 0.08, mats_white(cloth))


def mats_white(cloth):
    return cloth


def desk_school(root, mats, gx, gz):
    cube(root, "Furn_top", gx, gz, 1.05, 0.55, 0.72, 0.04, mats["wood"], 0.006)
    cube(root, "Furn_modesty", gx, gz, 0.9, 0.42, 0.08, 0.62, mats["wood_dark"])
    cube(root, "Furn_book", gx + 0.15, gz - 0.05, 0.22, 0.16, 0.77, 0.03, mats["accent"])
    cube(root, "Furn_chair", gx, gz + 0.22, 0.38, 0.08, 0.42, 0.42, mats["metal"])


def tree(root, mats, gx, gz, scale=1.0):
    cyl(root, "Furn_trunk", gx, gz, 0.11 * scale, 0, 1.05 * scale, mats["wood_dark"])
    ball(root, "Furn_crown", gx, gz, 0.55 * scale, 1.35 * scale, mats["leaf"], 1.05, 1.05, 0.85)
    ball(root, "Furn_crown", gx, gz + 0.05, 0.38 * scale, 1.85 * scale, mats["leaf_dark"], 0.9, 0.9, 0.75)
    ball(root, "Furn_bush", gx + 0.35 * scale, gz + 0.2, 0.22 * scale, 0.22 * scale, mats["leaf"])


def build_home(root, mats):
    room = ROOMS["home"]
    shell(root, mats, room, mats["oak"], mats["plaster"], mats["dado"], 0.0, [win(4.7, 2.0)])
    bed(root, mats, -3.3, -3.55, 2.15, 1.25)
    cube(root, "Furn_wardrobe", -6.2, 0.4, 0.62, 1.7, 0, 1.95, mats["wood_dark"], 0.012)
    cube(root, "Furn_seam", -6.2, 0.4, 0.02, 1.62, 0.2, 1.6, mats["trim"])
    table(root, mats, 2.5, -0.9, 1.6, 0.85)
    sofa(root, mats, 4.7, 2.55, 2.0, 0.85, mats["rust"])
    cube(root, "Furn_rug", 0.2, 0.2, 3.3, 2.05, 0.025, 0.02, mats["rug"])
    cube(root, "Furn_rug_edge", 0.2, 0.2, 3.45, 2.2, 0.02, 0.012, mats["accent"])
    lamp(root, mats, -0.2, 0.2)
    cube(root, "Furn_photo", -1.1, -4.82, 0.45, 0.04, 1.35, 0.55, mats["trim"])
    cube(root, "Furn_photo", -1.1, -4.8, 0.32, 0.02, 1.42, 0.38, mats["accent"])
    cube(root, "Rich_curtain", 4.7, -4.72, 1.7, 0.06, 0.85, 1.25, mats["gold"])
    cube(root, "Poor_crate", -5.3, 3.1, 0.5, 0.42, 0, 0.38, mats["cardboard"], 0.008)
    ball(root, "Furn_cushion", 4.35, 2.55, 0.18, 0.5, mats["linen"], 1.1, 0.85, 0.75)
    ball(root, "Furn_cushion", 5.05, 2.55, 0.16, 0.48, mats["white"], 1.0, 0.8, 0.7)
    ball(root, "Furn_plant", 6.35, -4.15, 0.26, 0.55, mats["leaf"])
    cyl(root, "Furn_pot", 6.35, -4.15, 0.14, 0, 0.22, mats["accent"])


def build_school(root, mats):
    room = ROOMS["school"]
    shell(root, mats, room, mats["tile"], mats["school_wall"], mats["dado_cool"], 6.2, [win(-2.2, 2.4), win(2.4, 2.4)])
    for gx, gz in ((-5.7, -0.5), (-5.7, 1.05), (-3.3, -0.5), (-3.3, 1.05), (-4.7, 3.7)):
        desk_school(root, mats, gx, gz)
    cube(root, "Furn_podium", 4.3, -4.85, 1.9, 0.62, 0, 1.05, mats["wood"], 0.01)
    cube(root, "Furn_board", 4.2, -5.86, 2.8, 0.06, 1.15, 1.25, mats["board"])
    cube(root, "Furn_board_frame", 4.2, -5.9, 3.05, 0.08, 1.05, 1.45, mats["wood"])
    cube(root, "Furn_clock", 0.2, -5.85, 0.4, 0.05, 2.15, 0.4, mats["trim"])
    lamp(root, mats, -1.2, 0.2)
    lamp(root, mats, 2.4, 0.4)
    ball(root, "Furn_plant", -7.4, -5.3, 0.28, 0.4, mats["leaf"])
    cyl(root, "Furn_pot", -7.4, -5.3, 0.14, 0, 0.18, mats["accent"])


def build_campus(root, mats):
    room = ROOMS["campus"]
    cx = (room["minX"] + room["maxX"]) / 2
    cz = (room["minZ"] + room["maxZ"]) / 2
    cube(root, "Ground", cx, cz, 28, 24, -0.1, 0.08, mats["grass"])
    cube(root, "Floor", 0, 2.4, 3.4, 9, 0, 0.05, mats["concrete"])
    cube(root, "Furn_hall", 0, -0.6, 3.8, 3.3, 0, 4.6, mats["plaster"], 0.02)
    cube(root, "Furn_band", 0, 1.02, 3.9, 0.12, 3.3, 0.18, mats["accent"])
    for row, level in ((-0.4, 1.3), (0.15, 2.5), (0.7, 3.6)):
        cube(root, "Glass", 0, 1.08, 2.2, 0.06, level, 0.7, mats["glass"])
    cube(root, "Furn_steps", 0, 1.4, 2.3, 0.8, 0, 0.22, mats["concrete"], 0.008)
    cube(root, "Furn_bench", -6.7, 4.55, 1.55, 0.4, 0.38, 0.08, mats["wood"], 0.006)
    cube(root, "Furn_leg", -7.2, 4.55, 0.08, 0.08, 0, 0.38, mats["metal"])
    cube(root, "Furn_leg", -6.2, 4.55, 0.08, 0.08, 0, 0.38, mats["metal"])
    cube(root, "Furn_board", 6.5, -5.15, 1.5, 0.08, 1.2, 1.5, mats["wood_dark"])
    cube(root, "Furn_paper", 6.5, -5.1, 1.15, 0.02, 1.45, 1.05, mats["linen"])
    for gx, gz in ((-8.1, -5.6), (8.1, 5.5), (8, -5.7)):
        tree(root, mats, gx, gz, 1.2)
    lamp(root, mats, -4.2, 5.2)
    lamp(root, mats, 4.2, 5.2)


def build_work(root, mats):
    room = ROOMS["work"]
    shell(root, mats, room, mats["tile"], mats["office"], mats["dado_cool"], 5.4, [win(0.5, 2.8)])
    cube(root, "Furn_top", -2.5, -1.7, 1.7, 0.8, 0.74, 0.05, mats["wood"], 0.008)
    for dx in (-0.7, 0.7):
        cube(root, "Furn_leg", -2.5 + dx, -1.7, 0.06, 0.7, 0, 0.74, mats["metal"])
    cube(root, "Furn_screen", -2.5, -1.95, 0.62, 0.04, 0.82, 0.38, mats["ink"])
    cube(root, "Furn_stand", -2.5, -1.95, 0.08, 0.08, 0.74, 0.08, mats["metal"])
    cube(root, "Furn_machine", 3.5, 1.7, 1.5, 0.7, 0, 1.05, mats["metal"], 0.01)
    cube(root, "Furn_slot", 3.5, 1.28, 0.7, 0.04, 0.72, 0.12, mats["ink"])
    lamp(root, mats, 0.2, 0.3)


def build_hospital(root, mats):
    room = ROOMS["hospital"]
    shell(root, mats, room, mats["clinic"], mats["clinic_wall"], mats["white"], 6.4, [win(0, 1.6)])
    for gz in (-1.45, 1.25):
        cube(root, "Furn_bed", -6.5, gz, 1.9, 0.85, 0.35, 0.18, mats["white"], 0.006)
        cube(root, "Furn_rail", -6.5, gz - 0.4, 1.85, 0.04, 0.45, 0.28, mats["metal"])
        cube(root, "Furn_rail", -6.5, gz + 0.4, 1.85, 0.04, 0.45, 0.28, mats["metal"])
        cube(root, "Furn_pillow", -7.1, gz, 0.4, 0.4, 0.55, 0.08, mats["linen"])
    cyl(root, "Furn_drip", -5.2, -1.45, 0.025, 0, 1.75, mats["metal"], 6)
    cube(root, "Furn_bag", -5.2, -1.45, 0.12, 0.06, 1.45, 0.18, mats["accent"])
    cube(root, "Furn_counter", 5.7, -0.2, 0.6, 1.7, 0, 1.05, mats["white"], 0.008)
    cube(root, "Furn_screen", 5.35, -0.2, 0.04, 0.5, 1.15, 0.32, mats["ink"])
    lamp(root, mats, -1, 0)


def build_split(root, mats):
    room = ROOMS["split"]
    shell(root, mats, room, mats["oak"], mats["bare"], mats["dado"], 0.0, [win(-2.2, 1.6)])
    cube(root, "Furn_box", -4.35, -2.7, 0.7, 0.55, 0, 0.42, mats["cardboard"], 0.008)
    cube(root, "Furn_box", -4.2, -2.55, 0.42, 0.36, 0.42, 0.28, mats["cardboard"])
    cube(root, "Furn_tape", -4.35, -2.42, 0.72, 0.04, 0.2, 0.06, mats["gold"])
    cube(root, "Furn_box", 0.1, -0.35, 0.85, 0.6, 0, 0.48, mats["cardboard"], 0.008)
    cube(root, "Furn_box", 0.15, -0.3, 0.4, 0.35, 0.48, 0.22, mats["trim"])
    sofa(root, mats, 4, 2.15, 1.7, 0.75, mats["dust"])
    lamp(root, mats, 1.4, 1.2)


def build_wedding(root, mats):
    room = ROOMS["wedding"]
    shell(root, mats, room, mats["oak"], mats["ivory"], mats["white"], 5.6, [win(0, 2.6)])
    cube(root, "Furn_runner", 0, 0.3, 1.35, 6.4, 0.03, 0.025, mats["accent"])
    for side in (-4.6, 4.6):
        for row in (-1.3, 0.15, 1.55):
            cube(root, "Furn_seat", side, row, 0.48, 0.48, 0, 0.46, mats["white"], 0.008)
            cube(root, "Furn_back", side, row - 0.2, 0.48, 0.06, 0.4, 0.42, mats["ivory"])
    cube(root, "Furn_altar", 0, -4.7, 2.3, 0.5, 0, 0.95, mats["wood"], 0.01)
    cyl(root, "Furn_arch", -0.95, -4.45, 0.035, 0, 2.25, mats["gold"], 6)
    cyl(root, "Furn_arch", 0.95, -4.45, 0.035, 0, 2.25, mats["gold"], 6)
    cube(root, "Furn_beam", 0, -4.45, 2.05, 0.06, 2.15, 0.06, mats["gold"])
    for shift in (-0.3, 0.15, 0.45):
        cone(root, "Furn_flower", shift, -4.35, 0.1, 1.55, 0.16, mats["bloom"], 5)
    lamp(root, mats, -1.6, -2.8)
    lamp(root, mats, 1.6, -2.8)


def build_apartment(root, mats):
    room = ROOMS["apartment"]
    shell(root, mats, room, mats["oak"], mats["plaster"], mats["dado"], 4.3, [win(2.4, 1.7)])
    cube(root, "Furn_crib", -4.45, -3, 1.1, 0.65, 0.22, 0.5, mats["wood"], 0.008)
    cube(root, "Furn_blanket", -4.45, -3, 0.75, 0.4, 0.7, 0.06, mats["accent"])
    table(root, mats, 2.25, -0.85, 1.35, 0.75)
    sofa(root, mats, -0.8, 2.15, 1.7, 0.68, mats["rust"])
    cube(root, "Furn_rug", -0.4, 0.1, 2.5, 1.55, 0.025, 0.018, mats["rug"])
    cube(root, "Furn_draw", 2.4, -4.45, 0.55, 0.03, 1.25, 0.4, mats["linen"])
    lamp(root, mats, 0.1, -0.2)


def build_park(root, mats):
    room = ROOMS["park"]
    cube(root, "Ground", 0, 0, 28, 24, -0.08, 0.08, mats["grass"])
    cube(root, "Floor", 0, 3.0, 2.6, 11, 0.0, 0.04, mats["path"])
    cube(root, "Floor_edge", -1.35, 3.0, 0.08, 11, 0.0, 0.05, mats["concrete"])
    cube(root, "Floor_edge", 1.35, 3.0, 0.08, 11, 0.0, 0.05, mats["concrete"])
    cyl(root, "Water", 0.1, -0.5, 1.35, -0.02, 0.05, mats["water"], 8)
    cyl(root, "Furn_rim", 0.1, -0.5, 1.6, 0, 0.1, mats["concrete"], 8)
    cube(root, "Furn_bench", -6.4, 3.35, 1.55, 0.38, 0.4, 0.07, mats["wood"], 0.006)
    cube(root, "Furn_leg", -6.95, 3.35, 0.07, 0.07, 0, 0.4, mats["metal"])
    cube(root, "Furn_leg", -5.85, 3.35, 0.07, 0.07, 0, 0.4, mats["metal"])
    for gx, gz in ((-8.3, -5.8), (8.2, -5.5), (7.8, 5.8), (-8.4, 5.7)):
        tree(root, mats, gx, gz, 1.25)
    cube(root, "Furn_hedge", 0, room["minZ"] + 0.35, 16, 0.45, 0, 0.85, mats["leaf_dark"])
    lamp(root, mats, -3.5, 6.2)
    lamp(root, mats, 3.5, 6.2)


def build_shore(root, mats):
    cube(root, "Ground", 0, 2.2, 26, 12, -0.08, 0.08, mats["sand"])
    for index in range(-4, 5):
        cube(root, "Floor", index * 0.42, 1.1, 0.36, 8.5, 0.04, 0.08, mats["wood"] if index % 2 == 0 else mats["wood_dark"])
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 4.8, 0.02))
    water = bpy.context.active_object
    water.name = "Water"
    water.scale = (22, 6, 1)
    bpy.ops.object.transform_apply(scale=True)
    water.data.materials.append(mats["water"])
    water.parent = root
    cube(root, "Furn_hull", 0, -5.45, 1.15, 2.3, 0.15, 0.32, mats["wood_dark"], 0.015)
    cube(root, "Furn_bow", 0, -6.35, 0.45, 0.4, 0.28, 0.16, mats["wood"])
    cube(root, "Furn_seat", 0, -5.2, 0.7, 0.28, 0.32, 0.06, mats["wood"])
    cube(root, "Furn_bench", -6.5, 2.15, 1.5, 0.4, 0.4, 0.07, mats["wood"])
    cyl(root, "Furn_post", 6.4, -0.8, 0.1, 0, 1.2, mats["wood_dark"], 6)
    cube(root, "Furn_rope", 6.4, -0.8, 0.28, 0.28, 0.85, 0.06, mats["accent"])
    lamp(root, mats, -2.2, 3.4)
    lamp(root, mats, 2.2, 3.4)
    ball(root, "Furn_rock", -8.2, -2.4, 0.28, 0.16, mats["concrete"], 1.3, 1.0, 0.6)
    ball(root, "Furn_rock", 7.6, -3.1, 0.2, 0.12, mats["concrete"], 1.2, 0.9, 0.55)
    ball(root, "Furn_plant", -8.6, 4.2, 0.35, 0.4, mats["leaf"])
    cube(root, "Furn_horizon", 0, -9.2, 32, 0.2, 0, 3.4, mats["horizon"])


BUILDERS = {
    "home": build_home,
    "school": build_school,
    "campus": build_campus,
    "work": build_work,
    "hospital": build_hospital,
    "split": build_split,
    "wedding": build_wedding,
    "apartment": build_apartment,
    "park": build_park,
    "shore": build_shore,
}


def materials():
    m = {
        "plaster": make_mat("plaster", (0.90, 0.86, 0.78), 0.7),
        "dado": make_mat("dado", (0.55, 0.32, 0.24), 0.55),
        "dado_cool": make_mat("dado_cool", (0.45, 0.52, 0.56), 0.5),
        "school_wall": make_mat("school_wall", (0.86, 0.88, 0.84), 0.65),
        "office": make_mat("office", (0.78, 0.80, 0.82), 0.5),
        "bare": make_mat("bare", (0.72, 0.68, 0.62), 0.75),
        "ivory": make_mat("ivory", (0.94, 0.90, 0.84), 0.55),
        "clinic_wall": make_mat("clinic_wall", (0.90, 0.93, 0.94), 0.4),
        "clinic": make_mat("clinic", (0.78, 0.84, 0.86), 0.35),
        "oak": make_mat("oak", (0.55, 0.36, 0.20), 0.5),
        "tile": make_mat("tile", (0.72, 0.74, 0.73), 0.35),
        "floor_line": make_mat("floor_line", (0.35, 0.24, 0.16), 0.45),
        "wood": make_mat("wood", (0.48, 0.30, 0.16), 0.48),
        "wood_dark": make_mat("wood_dark", (0.22, 0.14, 0.09), 0.42),
        "trim": make_mat("trim", (0.82, 0.78, 0.70), 0.4),
        "white": make_mat("white", (0.93, 0.92, 0.90), 0.45),
        "linen": make_mat("linen", (0.88, 0.84, 0.76), 0.65),
        "accent": make_mat("accent", (0.72, 0.18, 0.18), 0.4),
        "rust": make_mat("rust", (0.48, 0.22, 0.18), 0.6),
        "dust": make_mat("dust", (0.45, 0.42, 0.40), 0.7),
        "rug": make_mat("rug", (0.40, 0.16, 0.18), 0.75),
        "gold": make_mat("gold", (0.72, 0.55, 0.22), 0.35, metal=0.4),
        "metal": make_mat("metal", (0.55, 0.58, 0.62), 0.28, metal=0.55),
        "ink": make_mat("ink", (0.08, 0.10, 0.12), 0.25),
        "board": make_mat("board", (0.12, 0.28, 0.24), 0.5),
        "glass": make_mat("glass", (0.65, 0.78, 0.86), 0.08, alpha=0.35),
        "curtain": make_mat("curtain", (0.35, 0.40, 0.48), 0.7),
        "door": make_mat("door", (0.28, 0.16, 0.10), 0.45),
        "lamp": make_mat("lamp", (1.0, 0.90, 0.72), 0.3, emit=1.4),
        "concrete": make_mat("concrete", (0.62, 0.60, 0.56), 0.8),
        "grass": make_mat("grass", (0.28, 0.48, 0.26), 0.85),
        "leaf": make_mat("leaf", (0.20, 0.42, 0.22), 0.7),
        "leaf_dark": make_mat("leaf_dark", (0.12, 0.28, 0.16), 0.75),
        "path": make_mat("path", (0.78, 0.74, 0.66), 0.6),
        "water": make_mat("water", (0.12, 0.32, 0.40), 0.12, alpha=0.82),
        "sand": make_mat("sand", (0.72, 0.64, 0.48), 0.8),
        "cardboard": make_mat("cardboard", (0.62, 0.46, 0.28), 0.8),
        "bloom": make_mat("bloom", (0.82, 0.28, 0.36), 0.45),
        "horizon": make_mat("horizon", (0.55, 0.62, 0.68), 0.6),
    }
    return m


def main():
    clear_scene()
    mats = materials()
    for name, builder in BUILDERS.items():
        log(name)
        root = bpy.data.objects.new(name, None)
        bpy.context.scene.collection.objects.link(root)
        builder(root, mats)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=OUT,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
    )
    log(f"wrote {OUT} ({os.path.getsize(OUT) / 1048576:.1f} MB)")


if __name__ == "__main__":
    main()
