"""Render a few designed rooms so the set dressing can be judged."""

import os

import bpy
from mathutils import Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
GLB = os.path.join(ROOT, "public", "models", "scenes.glb")
OUT_DIR = os.path.join(ROOT, "tools", "blender")


def hide_tree(obj, hidden):
    obj.hide_render = hidden
    for child in obj.children:
        hide_tree(child, hidden)


def main():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=GLB)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1280
    scene.render.resolution_y = 720
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs[0].default_value = (0.55, 0.62, 0.7, 1)
        background.inputs[1].default_value = 1.0
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 3.2
    sun_obj = bpy.data.objects.new("Sun", sun)
    scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (0.9, 0.2, 0.6)
    camera_data = bpy.data.cameras.new("Cam")
    camera_data.lens = 28
    camera = bpy.data.objects.new("Cam", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    roots = [obj for obj in bpy.data.objects if obj.parent is None and obj.type == "EMPTY"]
    # Interior viewpoints. Blender Y is the opposite of the game's Z.
    shots = {
        "home": ((4.2, -1.6, 1.55), (-1.5, 2.2, 0.7)),
        "school": ((2.5, 2.8, 1.6), (-3.5, -0.2, 0.8)),
        "park": ((6.5, -4.5, 2.2), (-1.0, 2.0, 0.6)),
        "shore": ((5.5, -1.2, 1.8), (-1.0, 3.5, 0.4)),
    }
    for name, (place, look) in shots.items():
        for root in roots:
            hide_tree(root, root.name != name)
        camera.location = Vector(place)
        direction = Vector(look) - camera.location
        camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        path = os.path.join(OUT_DIR, f"scene-{name}.png")
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        print(path, flush=True)


if __name__ == "__main__":
    main()
