import blobconverter as bc
import tensorflow


def upload_nn_model(request, nn_model):
    if request.FILES:
        for filename, file in request.FILES.items():
            bc.from_tf()
