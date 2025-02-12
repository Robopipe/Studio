from rest_flex_fields import FlexFieldsModelSerializer

from nn_models.models import NNModel


class NNModelSerializer(FlexFieldsModelSerializer):
    class Meta:
        model = NNModel
        fields = "__all__"


class BaseModelSerializer(FlexFieldsModelSerializer):
    class Meta:
        fields = "__all__"
