"""Rooms dressed with Kenney CC0 furniture, nature, and suburban houses.

Walls stay on the same floors as layout.js. Props are visual only.
"""

import importlib.util
import os

import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
VENDOR = os.path.join(ROOT, "tools", "vendor", "kenney")
FURN = os.path.join(VENDOR, "furniture", "Models", "GLTF format")
NATURE = os.path.join(VENDOR, "nature", "Models", "GLTF format")
CITY = os.path.join(VENDOR, "city", "Models", "GLB format")
OUT = os.path.join(ROOT, "public", "models", "kenney", "scenes.glb")

spec = importlib.util.spec_from_file_location("life_scenes", os.path.join(os.path.dirname(__file__), "build_scenes.py"))
life = importlib.util.module_from_spec(spec)
spec.loader.exec_module(life)


def log(message):
    print(message, flush=True)


def import_meshes(path):
    before = {obj.name for obj in bpy.data.objects}
    bpy.ops.import_scene.gltf(filepath=path)
    created = [obj for obj in bpy.data.objects if obj.name not in before]
    meshes = [obj for obj in created if obj.type == "MESH"]
    extras = [obj for obj in created if obj.type != "MESH"]
    return meshes, extras


def bounds(meshes):
    low = Vector((1e9, 1e9, 1e9))
    high = Vector((-1e9, -1e9, -1e9))
    for mesh in meshes:
        for corner in mesh.bound_box:
            point = mesh.matrix_world @ Vector(corner)
            low.x, low.y, low.z = min(low.x, point.x), min(low.y, point.y), min(low.z, point.z)
            high.x, high.y, high.z = max(high.x, point.x), max(high.y, point.y), max(high.z, point.z)
    return low, high


def drop(root, folder, filename, gx, gz, span=None, tall=None, yaw=0.0):
    meshes, extras = import_meshes(os.path.join(folder, filename))
    empty = bpy.data.objects.new(os.path.splitext(filename)[0], None)
    bpy.context.scene.collection.objects.link(empty)
    empty.parent = root
    for mesh in meshes:
        world = mesh.matrix_world.copy()
        mesh.parent = empty
        mesh.matrix_world = world
    bpy.context.view_layer.update()
    for extra in extras:
        bpy.data.objects.remove(extra, do_unlink=True)
    bpy.context.view_layer.update()
    low, high = bounds(meshes)
    size = high - low
    scale = 1.0
    if tall and size.z > 0.02:
        scale = tall / size.z
    elif span and max(size.x, size.y) > 0.02:
        scale = span / max(size.x, size.y)
    empty.scale = (scale, scale, scale)
    empty.rotation_euler[2] = yaw
    bpy.context.view_layer.update()
    low, high = bounds(meshes)
    empty.location.x += gx - (low.x + high.x) / 2
    empty.location.y += -gz - (low.y + high.y) / 2
    empty.location.z += -low.z
    log(f"  {filename} at {gx},{gz} raw {size.x:.2f}x{size.y:.2f}x{size.z:.2f} scale {scale:.2f}")
    return empty


def room(name):
    root = bpy.data.objects.new(name, None)
    bpy.context.scene.collection.objects.link(root)
    return root


def build(mats):
    home = room("home")
    life.shell(home, mats, life.ROOMS["home"], mats["oak"], mats["plaster"], mats["dado"], 0.0, [life.win(4.7, 2.0)])
    life.cube(home, "Furn_rug", 0.2, 0.2, 3.3, 2.05, 0.02, 0.02, mats["rug"])
    drop(home, FURN, "bedSingle.glb", -3.3, -3.55, span=2.05)
    drop(home, FURN, "bookcaseClosed.glb", -6.2, 0.4, tall=1.7)
    drop(home, FURN, "table.glb", 2.5, -0.9, tall=0.74)
    drop(home, FURN, "chair.glb", 2.5, -0.15, tall=0.9)
    drop(home, FURN, "loungeSofa.glb", 4.7, 2.4, span=2.1)
    drop(home, FURN, "plantSmall1.glb", 6.0, -3.6, tall=0.7)
    drop(home, FURN, "lampSquareFloor.glb", 6.1, 3.5, tall=1.45)
    life.lamp(home, mats, -0.2, 0.2)

    school = room("school")
    life.shell(school, mats, life.ROOMS["school"], mats["tile"], mats["school_wall"], mats["dado_cool"], 6.2, [life.win(-2.2, 2.4), life.win(2.4, 2.4)])
    for gx, gz in ((-5.7, -0.5), (-5.7, 1.05), (-3.3, -0.5), (-3.3, 1.05)):
        drop(school, FURN, "desk.glb", gx, gz, tall=0.75)
        drop(school, FURN, "chairDesk.glb", gx, gz + 0.7, tall=0.85, yaw=3.1416)
    life.cube(school, "Furn_board", 4.2, -5.86, 2.8, 0.06, 1.15, 1.25, mats["board"])
    drop(school, FURN, "lampSquareCeiling.glb", -1.2, 0.2, tall=0.35)
    life.lamp(school, mats, -1.2, 0.2)

    campus = room("campus")
    life.cube(campus, "Ground", 0, 0, 28, 24, -0.08, 0.08, mats["grass"])
    life.cube(campus, "Floor", 0, 2.2, 3.2, 8, 0, 0.05, mats["concrete"])
    drop(campus, CITY, "building-type-a.glb", 0.0, -0.6, tall=3.3)
    drop(campus, CITY, "building-type-c.glb", -7.4, -4.6, tall=2.8)
    drop(campus, CITY, "building-type-e.glb", 7.2, -4.2, tall=3.0)
    for gx, gz in ((-8.0, 5.2), (8.0, 5.0)):
        drop(campus, NATURE, "tree_default.glb", gx, gz, tall=3.4)
        drop(campus, NATURE, "plant_bush.glb", gx + 1.1, gz + 0.6, tall=0.8)

    work = room("work")
    life.shell(work, mats, life.ROOMS["work"], mats["tile"], mats["office"], mats["dado_cool"], 5.4, [life.win(0.5, 2.8)])
    drop(work, FURN, "desk.glb", -2.5, -1.7, tall=0.75)
    drop(work, FURN, "chairDesk.glb", -2.5, -0.85, tall=0.9)
    drop(work, FURN, "computerScreen.glb", -2.5, -2.05, tall=0.42)
    drop(work, FURN, "bookcaseClosed.glb", 4.8, 1.4, tall=1.8)
    life.lamp(work, mats, 0.2, 0.3)

    hospital = room("hospital")
    life.shell(hospital, mats, life.ROOMS["hospital"], mats["clinic"], mats["clinic_wall"], mats["white"], 6.4, [life.win(0, 1.6)])
    drop(hospital, FURN, "bedSingle.glb", -5.8, -1.45, span=1.9)
    drop(hospital, FURN, "bedSingle.glb", -5.8, 1.25, span=1.9)
    drop(hospital, FURN, "cabinetBedDrawer.glb", -4.1, -1.45, tall=0.7)
    life.lamp(hospital, mats, -1, 0)

    split = room("split")
    life.shell(split, mats, life.ROOMS["split"], mats["oak"], mats["bare"], mats["dado"], 0.0, [life.win(-2.2, 1.6)])
    drop(split, FURN, "loungeSofa.glb", 4.0, 2.0, span=1.9)
    drop(split, FURN, "table.glb", 0.2, -0.4, tall=0.7)
    drop(split, FURN, "chair.glb", -0.7, -0.4, tall=0.85)
    life.lamp(split, mats, 1.4, 1.2)

    wedding = room("wedding")
    life.shell(wedding, mats, life.ROOMS["wedding"], mats["oak"], mats["ivory"], mats["white"], 5.6, [life.win(0, 2.6)])
    life.cube(wedding, "Furn_runner", 0, 0.3, 1.2, 6.2, 0.02, 0.02, mats["accent"])
    for side in (-4.4, 4.4):
        for row in (-1.2, 0.2, 1.5):
            drop(wedding, FURN, "chair.glb", side, row, tall=0.85, yaw=1.57 if side < 0 else -1.57)
    drop(wedding, FURN, "table.glb", 0, -4.5, tall=0.75)
    drop(wedding, NATURE, "flower_redA.glb", 0, -4.0, tall=0.4)
    life.lamp(wedding, mats, -1.6, -2.8)

    apartment = room("apartment")
    life.shell(apartment, mats, life.ROOMS["apartment"], mats["oak"], mats["plaster"], mats["dado"], 4.3, [life.win(2.4, 1.7)])
    drop(apartment, FURN, "bedSingle.glb", -4.2, -2.8, span=1.7)
    drop(apartment, FURN, "table.glb", 2.2, -0.8, tall=0.72)
    drop(apartment, FURN, "loungeSofa.glb", -0.6, 2.0, span=1.8)
    life.cube(apartment, "Furn_rug", -0.4, 0.1, 2.4, 1.5, 0.02, 0.02, mats["rug"])
    life.lamp(apartment, mats, 0.1, -0.2)

    park = room("park")
    life.cube(park, "Ground", 0, 0, 28, 24, -0.08, 0.08, mats["grass"])
    life.cube(park, "Floor", 0, 3.0, 2.4, 10, 0, 0.04, mats["path"])
    trees = (
        (-8.2, -5.6, "tree_default.glb"),
        (8.0, -5.4, "tree_pineRoundA.glb"),
        (7.6, 5.6, "tree_default.glb"),
        (-8.2, 5.5, "tree_pineRoundA.glb"),
    )
    for gx, gz, name in trees:
        drop(park, NATURE, name, gx, gz, tall=3.6)
        drop(park, NATURE, "plant_bush.glb", gx + 1.2, gz + 0.5, tall=0.85)
        drop(park, NATURE, "flower_yellowA.glb", gx + 0.5, gz - 0.9, tall=0.35)
    drop(park, FURN, "bench.glb", -6.4, 3.35, span=1.6)
    drop(park, NATURE, "rock_largeA.glb", 5.5, -2.2, tall=0.7)
    life.lamp(park, mats, -3.5, 6.2)

    shore = room("shore")
    life.cube(shore, "Ground", 0, 2.2, 26, 12, -0.08, 0.08, mats["sand"])
    life.cube(shore, "Water", 0, -4.2, 22, 6, 0.0, 0.04, mats["water"])
    drop(shore, NATURE, "tree_palmTall.glb", -7.5, 3.2, tall=4.2)
    drop(shore, NATURE, "tree_palm.glb", 7.2, 2.4, tall=3.4)
    drop(shore, NATURE, "rock_largeB.glb", -2.4, 1.2, tall=0.6)
    drop(shore, NATURE, "plant_bushSmall.glb", 3.4, 4.2, tall=0.55)
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
