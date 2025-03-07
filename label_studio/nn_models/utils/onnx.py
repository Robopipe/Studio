import onnx
from onnx import helper, TensorProto


def onnx_add_resize(model_path: str, imgsz: tuple[int, int]):
    model = onnx.load(model_path)
    h, w = imgsz

    original_input = model.graph.input[0]
    original_input_name = original_input.name
    original_shape = original_input.type.tensor_type.shape.dim

    resize_output_name = "resized_output"
    resize_shape_tensor = helper.make_tensor(
        name="resize_shape",
        data_type=TensorProto.INT64,
        dims=[4],
        vals=[1, 3, original_shape[2].dim_value, original_shape[3].dim_value],
    )

    original_shape[2].dim_value = h
    original_shape[3].dim_value = w

    new_input_name = "resized_input"
    new_input = helper.make_tensor_value_info(
        new_input_name, TensorProto.FLOAT, [1, 3, h, w]
    )

    roi_tensor = helper.make_tensor(
        name="resize_roi", data_type=TensorProto.FLOAT, dims=[0], vals=[]
    )
    scales_tensor = helper.make_tensor(
        name="resize_scales", data_type=TensorProto.FLOAT, dims=[0], vals=[]
    )

    resize_node = helper.make_node(
        "Resize",
        inputs=[new_input_name, "resize_roi", "resize_scales", "resize_shape"],
        outputs=[resize_output_name],
        mode="linear",
        coordinate_transformation_mode="half_pixel",
    )

    model.graph.input[0].CopyFrom(new_input)
    model.graph.initializer.append(resize_shape_tensor)
    model.graph.initializer.append(roi_tensor)
    model.graph.initializer.append(scales_tensor)

    first_real_node = model.graph.node[0]
    for i, inp in enumerate(first_real_node.input):
        if inp == original_input_name:
            first_real_node.input[i] = resize_output_name

    model.graph.node.insert(0, resize_node)

    onnx.save(model, model_path)
