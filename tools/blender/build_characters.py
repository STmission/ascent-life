"""Build playable human characters for 浮生 Ascent.

Faces and bodies come from the CC0 MakeHuman basemesh via the MPFB add-on.
Styling follows contemporary Korean youth drama (neat short hair and a tailored
suit; long straight hair, blouse and skirt) without copying any actor's likeness.
"""

import os
import sys
import traceback

import bpy

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_DIR = os.path.join(ROOT, "public", "models")
DATA = os.path.expanduser(
    "~/Library/Application Support/Blender/5.2/extensions/.user/user_default/mpfb/data"
)

from bl_ext.user_default.mpfb.services.humanservice import HumanService

EYES = os.path.join(DATA, "eyes/low-poly/low-poly.mhclo")
BROWS = os.path.join(DATA, "eyebrows/eyebrow001/eyebrow001.mhclo")
EYE_PNG = os.path.join(DATA, "eyes/materials/brown_eye.png")
SHOES = os.path.join(DATA, "clothes/shoes01/shoes01.mhclo")

CAST = [
    {
        "id": "youth_m",
        "gender": 1.0,
        "age": 0.40,
        "weight": 0.30,
        "muscle": 0.42,
        "height": 0.68,
        "cup": 0.15,
        "skin": "skins/young_asian_male/young_asian_male.mhmat",
        "hair": "hair/short04/short04.mhclo",
        "clothes": "clothes/male_elegantsuit01/male_elegantsuit01.mhclo",
        "lashes": "eyelashes/eyelashes01/eyelashes01.mhclo",
    },
    {
        "id": "youth_f",
        "gender": 0.0,
        "age": 0.38,
        "weight": 0.28,
        "muscle": 0.34,
        "height": 0.46,
        "cup": 0.32,
        "skin": "skins/young_asian_female/young_asian_female.mhmat",
        "hair": "hair/long01/long01.mhclo",
        "clothes": "clothes/female_elegantsuit01/female_elegantsuit01.mhclo",
        "lashes": "eyelashes/eyelashes02/eyelashes02.mhclo",
    },
    {
        "id": "parent_m",
        "gender": 1.0,
        "age": 0.62,
        "weight": 0.48,
        "muscle": 0.46,
        "height": 0.58,
        "cup": 0.15,
        "skin": "skins/middleage_asian_male/middleage_asian_male.mhmat",
        "hair": "hair/short02/short02.mhclo",
        "clothes": "clothes/male_worksuit01/male_worksuit01.mhclo",
        "lashes": "eyelashes/eyelashes01/eyelashes01.mhclo",
    },
    {
        "id": "parent_f",
        "gender": 0.0,
        "age": 0.60,
        "weight": 0.42,
        "muscle": 0.36,
        "height": 0.42,
        "cup": 0.36,
        "skin": "skins/middleage_asian_female/middleage_asian_female.mhmat",
        "hair": "hair/bob01/bob01.mhclo",
        "clothes": "clothes/female_casualsuit01/female_casualsuit01.mhclo",
        "lashes": "eyelashes/eyelashes02/eyelashes02.mhclo",
    },
    {
        "id": "elder_m",
        "gender": 1.0,
        "age": 0.80,
        "weight": 0.46,
        "muscle": 0.32,
        "height": 0.50,
        "cup": 0.15,
        "skin": "skins/old_asian_male/old_asian_male.mhmat",
        "hair": "hair/short01/short01.mhclo",
        "clothes": "clothes/male_casualsuit01/male_casualsuit01.mhclo",
        "lashes": "eyelashes/eyelashes01/eyelashes01.mhclo",
    },
    {
        "id": "elder_f",
        "gender": 0.0,
        "age": 0.78,
        "weight": 0.44,
        "muscle": 0.30,
        "height": 0.40,
        "cup": 0.30,
        "skin": "skins/old_asian_female/old_asian_female.mhmat",
        "hair": "hair/bob02/bob02.mhclo",
        "clothes": "clothes/female_casualsuit02/female_casualsuit02.mhclo",
        "lashes": "eyelashes/eyelashes02/eyelashes02.mhclo",
    },
    {
        "id": "child_m",
        "gender": 1.0,
        "age": 0.28,
        "weight": 0.36,
        "muscle": 0.34,
        "height": 0.22,
        "cup": 0.1,
        "skin": "skins/young_asian_male/young_asian_male.mhmat",
        "hair": "hair/short01/short01.mhclo",
        "clothes": "clothes/male_casualsuit02/male_casualsuit02.mhclo",
        "lashes": "eyelashes/eyelashes01/eyelashes01.mhclo",
    },
    {
        "id": "child_f",
        "gender": 0.0,
        "age": 0.28,
        "weight": 0.34,
        "muscle": 0.30,
        "height": 0.20,
        "cup": 0.15,
        "skin": "skins/young_asian_female/young_asian_female.mhmat",
        "hair": "hair/bob01/bob01.mhclo",
        "clothes": "clothes/female_sportsuit01/female_sportsuit01.mhclo",
        "lashes": "eyelashes/eyelashes02/eyelashes02.mhclo",
    },
]


def log(message):
    print(message, flush=True)


def asset(relative):
    path = os.path.join(DATA, relative)
    if not os.path.exists(path):
        raise FileNotFoundError(path)
    return path


def diffuse_png(mhclo_path):
    folder = os.path.dirname(mhclo_path)
    names = [
        name
        for name in os.listdir(folder)
        if name.lower().endswith(".png") and "thumb" not in name.lower() and "normal" not in name.lower() and "_ao" not in name.lower()
    ]
    for name in names:
        if "diffuse" in name.lower():
            return os.path.join(folder, name)
    return os.path.join(folder, names[0]) if names else None


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.images):
        for item in list(block):
            if item.users == 0:
                block.remove(item)


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def freeze(obj):
    select_only(obj)
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = bpy.data.meshes.new_from_object(evaluated)
    old = obj.data
    obj.data = mesh
    obj.modifiers.clear()
    if old.users == 0:
        bpy.data.meshes.remove(old)
    if obj.data.shape_keys:
        select_only(obj)
        obj.active_shape_key_index = 0
        bpy.ops.object.shape_key_remove(all=True)


def assign_pbr(obj, image_path, roughness, alpha=False, double_side=False):
    mat = bpy.data.materials.new(obj.name + "_pbr")
    mat.use_nodes = True
    bsdf = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    if image_path and os.path.exists(image_path):
        image = bpy.data.images.load(image_path, check_existing=True)
        tex = mat.node_tree.nodes.new("ShaderNodeTexImage")
        tex.image = image
        mat.node_tree.links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
        if alpha and "Alpha" in tex.outputs and "Alpha" in bsdf.inputs:
            mat.node_tree.links.new(tex.outputs["Alpha"], bsdf.inputs["Alpha"])
    else:
        bsdf.inputs["Base Color"].default_value = (0.86, 0.67, 0.54, 1.0)
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = roughness
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = 0.0
    if alpha:
        if hasattr(mat, "blend_method"):
            mat.blend_method = "CLIP"
        if hasattr(mat, "alpha_threshold"):
            mat.alpha_threshold = 0.45
        if hasattr(mat, "surface_render_method"):
            mat.surface_render_method = "DITHERED"
    if double_side and hasattr(mat, "use_backface_culling"):
        mat.use_backface_culling = False
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def hide_covered_skin(basemesh):
    for group in basemesh.vertex_groups:
        if not group.name.startswith("Delete."):
            continue
        modifier = basemesh.modifiers.new(group.name, "MASK")
        modifier.vertex_group = group.name
        modifier.invert_vertex_group = True


def maybe_decimate(obj, ratio, minimum):
    faces = len(obj.data.polygons)
    if faces < minimum:
        return
    select_only(obj)
    modifier = obj.modifiers.new("Decimate", "DECIMATE")
    modifier.ratio = max(ratio, minimum / faces)
    bpy.ops.object.modifier_apply(modifier=modifier.name)


def build_one(spec):
    log(f"== {spec['id']} ==")
    macro = {
        "gender": spec["gender"],
        "age": spec["age"],
        "muscle": spec["muscle"],
        "weight": spec["weight"],
        "proportions": 0.5,
        "height": spec["height"],
        "cupsize": spec["cup"],
        "firmness": 0.35,
        "race": {"asian": 1.0, "caucasian": 0.0, "african": 0.0},
    }
    body = HumanService.create_human(
        mask_helpers=True,
        detailed_helpers=False,
        extra_vertex_groups=False,
        feet_on_ground=True,
        scale=0.1,
        macro_detail_dict=macro,
    )
    body.name = spec["id"] + "_body"
    skin = asset(spec["skin"])
    HumanService.set_character_skin(skin, body, skin_type="GAMEENGINE", material_instances=False)

    pieces = [("clothes", asset(spec["clothes"]), False), ("hair", asset(spec["hair"]), True)]
    pieces.append(("clothes", SHOES, False))
    pieces.append(("eyes", EYES, False))
    pieces.append(("eyebrows", BROWS, True))
    pieces.append(("eyelashes", asset(spec["lashes"]), True))

    for kind, path, _alpha in pieces:
        log(f"  add {os.path.basename(path)}")
        HumanService.add_mhclo_asset(
            path,
            body,
            asset_type=kind,
            subdiv_levels=0,
            material_type="GAMEENGINE",
            set_up_rigging=False,
            interpolate_weights=False,
            import_subrig=False,
            import_weights=False,
        )

    children = [obj for obj in bpy.context.scene.objects if obj.parent == body and obj.type == "MESH"]
    hide_covered_skin(body)

    textures = {
        body: diffuse_png(skin),
    }
    for child in children:
        name = child.name.lower()
        if "low-poly" in name or ("eye" in name and "brow" not in name and "lash" not in name):
            textures[child] = EYE_PNG
        elif "brow" in name or "lash" in name or "hair" in name:
            source = None
            for piece_kind, path, alpha in pieces:
                key = os.path.splitext(os.path.basename(path))[0]
                if key in name:
                    source = diffuse_png(path)
                    break
            textures[child] = source
        else:
            source = None
            for piece_kind, path, alpha in pieces:
                key = os.path.splitext(os.path.basename(path))[0]
                if key in name:
                    source = diffuse_png(path)
                    break
            textures[child] = source

    for obj in [body, *children]:
        freeze(obj)
        image = textures.get(obj)
        hair_like = any(token in obj.name.lower() for token in ("hair", "brow", "lash"))
        assign_pbr(obj, image, 0.55 if hair_like else 0.48, alpha=hair_like, double_side=hair_like)
        if "body" in obj.name:
            maybe_decimate(obj, 0.55, 9000)
        elif not hair_like and "eye" not in obj.name.lower():
            maybe_decimate(obj, 0.6, 8000)

    root = bpy.data.objects.new(spec["id"], None)
    bpy.context.scene.collection.objects.link(root)
    for obj in [body, *children]:
        world = obj.matrix_world.copy()
        obj.parent = root
        obj.matrix_world = world
    # Blender front is -Y. A half-turn makes the face look along -Z after glTF Y-up export.
    root.rotation_euler[2] = 3.14159265
    bpy.context.view_layer.update()

    top = 0.0
    for obj in [body, *children]:
        for corner in obj.bound_box:
            world = obj.matrix_world @ __import__("mathutils").Vector(corner)
            top = max(top, world.z)
    if spec["id"].startswith("child") and top > 1.38:
        root.scale = (1.22 / top, 1.22 / top, 1.22 / top)
        top = 1.22
    elif spec["id"].startswith("youth_m") and top > 1.86:
        root.scale = (1.8 / top, 1.8 / top, 1.8 / top)
        top = 1.8
    elif spec["id"].startswith("youth_f") and top > 1.72:
        root.scale = (1.66 / top, 1.66 / top, 1.66 / top)
        top = 1.66
    log(f"  height {top:.2f} m  meshes {1 + len(children)}")
    return root


def downscale_images(limit):
    for image in bpy.data.images:
        if image.size[0] <= limit or image.name in {"Render Result", "Viewer Node"}:
            continue
        width = image.size[0]
        height = image.size[1]
        scale = limit / width
        image.scale(limit, max(1, int(height * scale)))


def export_glb():
    os.makedirs(OUT_DIR, exist_ok=True)
    # The contact-sheet render spaces people apart. Put them back on the origin.
    for obj in bpy.context.scene.objects:
        if obj.parent is None and obj.type == "EMPTY":
            obj.location = (0.0, 0.0, 0.0)
    path = os.path.join(OUT_DIR, "characters.glb")
    downscale_images(1024)
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_yup=True,
        export_texcoords=True,
        export_normals=True,
        export_materials="EXPORT",
        export_cameras=False,
        export_lights=False,
        export_image_format="AUTO",
    )
    log(f"wrote {path} ({os.path.getsize(path) / 1048576:.1f} MB)")


def render_sheet():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 1600
    scene.render.resolution_y = 900
    scene.render.film_transparent = False
    world = scene.world or bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    background = world.node_tree.nodes.get("Background")
    if background:
        background.inputs[0].default_value = (0.78, 0.76, 0.72, 1)
        background.inputs[1].default_value = 1.0
    sun = bpy.data.lights.new("Sun", "SUN")
    sun.energy = 3.2
    sun_obj = bpy.data.objects.new("Sun", sun)
    scene.collection.objects.link(sun_obj)
    sun_obj.rotation_euler = (0.9, 0.2, 0.6)
    fill = bpy.data.lights.new("Fill", "AREA")
    fill.energy = 250
    fill.size = 4
    fill_obj = bpy.data.objects.new("Fill", fill)
    scene.collection.objects.link(fill_obj)
    fill_obj.location = (0, -4, 2.2)
    fill_obj.rotation_euler = (1.2, 0, 0)

    roots = [obj for obj in scene.objects if obj.parent is None and obj.type == "EMPTY"]
    roots.sort(key=lambda obj: obj.name)
    for index, root in enumerate(roots):
        root.location.x = (index - (len(roots) - 1) / 2) * 1.35
        root.location.y = 0
        root.location.z = 0

    camera_data = bpy.data.cameras.new("Cam")
    camera_data.lens = 42
    camera = bpy.data.objects.new("Cam", camera_data)
    scene.collection.objects.link(camera)
    scene.camera = camera
    camera.location = (0.4, 4.8, 1.25)
    camera.rotation_euler = (1.25, 0, 3.14159)
    path = os.path.join(ROOT, "tools", "blender", "cast-preview.png")
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    log(f"preview {path}")

    camera.location = (roots[0].location.x + 0.35, 1.55, 1.55)
    camera.rotation_euler = (1.35, 0, 3.14159)
    close = os.path.join(ROOT, "tools", "blender", "face-preview.png")
    scene.render.filepath = close
    bpy.ops.render.render(write_still=True)
    log(f"preview {close}")


def main():
    wanted = {arg for arg in sys.argv if arg in {spec["id"] for spec in CAST}}
    clear_scene()
    for spec in CAST:
        if wanted and spec["id"] not in wanted:
            continue
        try:
            build_one(spec)
        except Exception:
            log(f"FAILED {spec['id']}")
            traceback.print_exc()
    if not any(obj.type == "EMPTY" for obj in bpy.context.scene.objects):
        raise SystemExit("no characters were built")
    render_sheet()
    export_glb()


if __name__ == "__main__":
    main()
