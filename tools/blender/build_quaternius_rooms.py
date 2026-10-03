"""Rooms dressed with Quaternius CC0 furniture and nature.

Walls stay on the same floors as layout.js. Props are visual only.
"""

import importlib.util
import os

import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
PROP = os.path.join(ROOT, "tools", "vendor", "quaternius", "props")
OUT = os.path.join(ROOT, "public", "models", "scenes.glb")

spec = importlib.util.spec_from_file_location("life_scenes", os.path.join(os.path.dirname(__file__), "build_scenes.py"))
life = importlib.util.module_from_spec(spec)
spec.loader.exec_module(life)


def log(message):
    print(message, flush=True)


def import_meshes(filename):
    path = os.path.join(PROP, filename)
    before = {obj.name for obj in bpy.data.objects}
    bpy.ops.wm.obj_import(filepath=path, forward_axis="NEGATIVE_Z", up_axis="Y")
    return [obj for obj in bpy.data.objects if obj.name not in before and obj.type == "MESH"]


def bounds(meshes):
    low = Vector((1e9, 1e9, 1e9))
    high = Vector((-1e9, -1e9, -1e9))
    for mesh in meshes:
        for corner in mesh.bound_box:
            point = mesh.matrix_world @ Vector(corner)
            low.x, low.y, low.z = min(low.x, point.x), min(low.y, point.y), min(low.z, point.z)
            high.x, high.y, high.z = max(high.x, point.x), max(high.y, point.y), max(high.z, point.z)
    return low, high


def drop(root, filename, gx, gz, span=None, yaw=0.0):
    meshes = import_meshes(filename)
    empty = bpy.data.objects.new(os.path.splitext(filename)[0], None)
    bpy.context.scene.collection.objects.link(empty)
    empty.parent = root
    for mesh in meshes:
        mesh.parent = empty
    bpy.context.view_layer.update()
    low, high = bounds(meshes)
    size = high - low
    scale = 1.0
    if span and max(size.x, size.y) > 0.05:
        scale = span / max(size.x, size.y)
        empty.scale = (scale, scale, scale)
        bpy.context.view_layer.update()
        low, high = bounds(meshes)
    empty.rotation_euler[2] = yaw
    bpy.context.view_layer.update()
    low, high = bounds(meshes)
    center_x = (low.x + high.x) / 2
    center_y = (low.y + high.y) / 2
    empty.location.x += gx - center_x
    empty.location.y += -gz - center_y
    empty.location.z += -low.z
    log(f"  {filename} at {gx},{gz} size {size.x:.2f}x{size.y:.2f}x{size.z:.2f}")
    return empty


def room(name, mats):
    root = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(root)
    return root


def build(mats):
    home = room("home", mats)
    life.shell(home, mats, life.ROOMS["home"], mats["oak"], mats["plaster"], mats["dado"], 0.0, [life.win(4.7, 2.0)])
    life.cube(home, "Furn_rug", 0.2, 0.2, 3.3, 2.05, 0.02, 0.02, mats["rug"])
    drop(home, "BedTwin.obj", -3.3, -3.55, 2.1)
    drop(home, "Closet.obj", -6.2, 0.4, 1.5)
    drop(home, "Table.obj", 2.5, -0.9, 1.6)
    drop(home, "Sofa.obj", 4.7, 2.4, 2.0)
    drop(home, "Plant_1.obj", 6.2, -4.1, 0.55) if False else drop(home, "Flowers.obj", 2.5, -0.55, 0.35)
    life.lamp(home, mats, -0.2, 0.2)

    school = room("school", mats)
    life.shell(school, mats, life.ROOMS["school"], mats["tile"], mats["school_wall"], mats["dado_cool"], 6.2, [life.win(-2.2, 2.4), life.win(2.4, 2.4)])
    for gx, gz in ((-5.7, -0.5), (-5.7, 1.05), (-3.3, -0.5), (-3.3, 1.05)):
        drop(school, "Desk.obj", gx, gz, 1.15)
        drop(school, "Chair.obj", gx, gz + 0.55, 0.45)
    life.cube(school, "Furn_board", 4.2, -5.86, 2.8, 0.06, 1.15, 1.25, mats["board"])
    life.lamp(school, mats, -1.2, 0.2)

    campus = room("campus", mats)
    life.cube(campus, "Ground", 0, 0, 28, 24, -0.08, 0.08, mats["grass"])
    life.cube(campus, "Floor", 0, 2.2, 3.2, 8, 0, 0.05, mats["concrete"])
    drop(campus, "Bookcase.obj", 6.2, -4.8, 1.6)
    for gx, gz in ((-8, -5.5), (8, 5.2), (7.5, -5.4)):
        drop(campus, "CommonTree_1.obj", gx, gz, 2.4)
        drop(campus, "Bush_1.obj", gx + 0.8, gz + 0.4, 0.8)

    work = room("work", mats)
    life.shell(work, mats, life.ROOMS["work"], mats["tile"], mats["office"], mats["dado_cool"], 5.4, [life.win(0.5, 2.8)])
    drop(work, "Desk.obj", -2.5, -1.7, 1.7)
    drop(work, "OfficeChair.obj", -2.5, -0.9, 0.6)
    drop(work, "Bookcase.obj", 4.8, 1.4, 1.5)
    life.lamp(work, mats, 0.2, 0.3)

    hospital = room("hospital", mats)
    life.shell(hospital, mats, life.ROOMS["hospital"], mats["clinic"], mats["clinic_wall"], mats["white"], 6.4, [life.win(0, 1.6)])
    drop(hospital, "BedTwin.obj", -5.8, -1.45, 2.0)
    drop(hospital, "BedTwin.obj", -5.8, 1.25, 2.0)
    drop(hospital, "NightStand.obj", -4.2, -1.45, 0.5)
    life.lamp(hospital, mats, -1, 0)

    split = room("split", mats)
    life.shell(split, mats, life.ROOMS["split"], mats["oak"], mats["bare"], mats["dado"], 0.0, [life.win(-2.2, 1.6)])
    drop(split, "Sofa.obj", 4.0, 2.0, 1.8)
    drop(split, "Table.obj", 0.2, -0.4, 1.2)
    life.lamp(split, mats, 1.4, 1.2)

    wedding = room("wedding", mats)
    life.shell(wedding, mats, life.ROOMS["wedding"], mats["oak"], mats["ivory"], mats["white"], 5.6, [life.win(0, 2.6)])
    life.cube(wedding, "Furn_runner", 0, 0.3, 1.2, 6.2, 0.02, 0.02, mats["accent"])
    for side in (-4.4, 4.4):
        for row in (-1.2, 0.2, 1.5):
            drop(wedding, "Chair.obj", side, row, 0.55, yaw=1.57 if side < 0 else -1.57)
    drop(wedding, "Table.obj", 0, -4.5, 2.0)
    drop(wedding, "Flowers.obj", 0, -4.1, 0.4)
    life.lamp(wedding, mats, -1.6, -2.8)

    apartment = room("apartment", mats)
    life.shell(apartment, mats, life.ROOMS["apartment"], mats["oak"], mats["plaster"], mats["dado"], 4.3, [life.win(2.4, 1.7)])
    drop(apartment, "BedTwin.obj", -4.2, -2.8, 1.3)
    drop(apartment, "Table.obj", 2.2, -0.8, 1.3)
    drop(apartment, "Sofa.obj", -0.6, 2.0, 1.7)
    life.cube(apartment, "Furn_rug", -0.4, 0.1, 2.4, 1.5, 0.02, 0.02, mats["rug"])
    life.lamp(apartment, mats, 0.1, -0.2)

    park = room("park", mats)
    life.cube(park, "Ground", 0, 0, 28, 24, -0.08, 0.08, mats["grass"])
    life.cube(park, "Floor", 0, 3.0, 2.4, 10, 0, 0.04, mats["path"])
    for gx, gz, name in ((-8.2, -5.6, "CommonTree_1.obj"), (8.0, -5.4, "PineTree_1.obj"), (7.6, 5.6, "CommonTree_1.obj"), (-8.2, 5.5, "PineTree_1.obj")):
        drop(park, name, gx, gz, 2.8)
        drop(park, "Bush_1.obj", gx + 1.0, gz + 0.5, 0.9)
        drop(park, "Flowers.obj", gx + 0.4, gz - 0.8, 0.45)
    life.lamp(park, mats, -3.5, 6.2)

    shore = room("shore", mats)
    life.cube(shore, "Ground", 0, 2.2, 26, 12, -0.08, 0.08, mats["sand"])
    life.cube(shore, "Water", 0, -4.2, 22, 6, 0.0, 0.04, mats["water"])
    drop(shore, "PalmTree_1.obj", -7.5, 3.2, 2.6)
    drop(shore, "PalmTree_1.obj", 7.2, 2.4, 2.2)
    drop(shore, "Grass.obj", -2.2, 3.4, 1.2)
    drop(shore, "Bush_1.obj", 3.4, 4.2, 0.8)
    life.lamp(shore, mats, -2.2, 3.4)


def main():
    life.clear_scene()
    mats = life.materials()
    build(mats)
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
