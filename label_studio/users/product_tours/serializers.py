import pathlib
from functools import cached_property

import yaml
from rest_framework import serializers

from .models import ProductTourInteractionData, UserProductTour

PRODUCT_TOURS_CONFIGS_DIR = pathlib.Path(__file__).parent / 'configs'


class UserProductTourSerializer(serializers.ModelSerializer):
    steps = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = UserProductTour
        fields = '__all__'

    @cached_property
    def available_tours(self):
        return {pathlib.Path(f).stem for f in PRODUCT_TOURS_CONFIGS_DIR.iterdir()}

    def validate_name(self, value):

        if value not in self.available_tours:
            raise serializers.ValidationError(
                f'Product tour {value} not found. Available tours: {self.available_tours}'
            )

        return value

    def load_tour_config(self):
        # TODO: get product tour from yaml file. Later we move it to remote storage, e.g. S3
        filepath = PRODUCT_TOURS_CONFIGS_DIR / f'{self.context["name"]}.yml'
        with open(filepath, 'r') as f:
            return yaml.safe_load(f)

    def get_steps(self, obj):
        config = self.load_tour_config()
        return config.get('steps', [])

    def validate_interaction_data(self, value):
        try:
            # Validate interaction data using pydantic model
            ProductTourInteractionData(**value)
            return value
        except Exception:
            raise serializers.ValidationError('Invalid product tour interaction data format.')
