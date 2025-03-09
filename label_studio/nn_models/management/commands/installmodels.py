from django.core.management import call_command
from django.core.management.base import BaseCommand

from nn_models.utils.base import list_models, install_model


class Command(BaseCommand):
    help = """Install neural network models"""

    def add_arguments(self, parser):
        arg_group = parser.add_mutually_exclusive_group(required=True)
        arg_group.add_argument("--models", nargs="*", type=str)
        arg_group.add_argument("--all", action="store_true", help="Install all models")
        arg_group.add_argument(
            "--classification",
            action="store_true",
            help="Install classification models",
        )
        arg_group.add_argument(
            "--detection", action="store_true", help="Install detection models"
        )

    def handle(self, *args, **options):
        models = list_models()
        model_names = [model["name"] for model in models]

        if (chosen_models := options.get("models", None)) is not None:
            for model in chosen_models:
                if model not in model_names:
                    self.stdout.write(f"Model {model} not found")
                    continue
            models = list(filter(lambda x: x["name"] in chosen_models, models))
        elif options.get("detection", False):
            models = list(filter(lambda x: x["task"] == "detection", models))
        elif options.get("classification", False):
            models = list(filter(lambda x: x["task"] == "classification", models))

        for model in models:
            install_model(model["name"])
            self.stdout.write(f"Model {model['name']} installed")

        call_command("collectstatic", "--no-input")
