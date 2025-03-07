from django.core.management.base import BaseCommand

from nn_models.utils.base import list_models


class Command(BaseCommand):
    help = """List neural network models"""

    def handle(self, *args, **options):
        models = list_models()

        for model in models:
            self.stdout.write(
                f"{model['name']} - {model['task']} - {'installed' if model['installed'] else 'not installed'}"
            )
