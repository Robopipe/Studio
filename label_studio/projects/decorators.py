from functools import wraps
from projects.models import Project
from django.shortcuts import get_object_or_404
from django.http import Http404


def with_robopipe_api_url(param="project_id"):
    def _decorator(view_func):
        @wraps(view_func)
        def _wrapped(request, *args, **kwargs):
            request.robopipe_api_url = None
            project_id = kwargs.get(param) or request.GET.get("project")
            if not project_id:
                raise Http404("Project not specified")
            project = get_object_or_404(Project, pk=project_id)
            request.robopipe_api_url = project.robopipe_api_url
            return view_func(request, *args, **kwargs)

        return _wrapped

    return _decorator
