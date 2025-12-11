"""This file and its contents are licensed under the Apache License 2.0. Please see the included NOTICE for copyright information and LICENSE for a copy of the license.
"""
from core.version import get_short_version
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from projects.decorators import with_robopipe_api_url

@with_robopipe_api_url(param="pk")
@login_required
def task_page(request, pk):
    response = {'version': get_short_version(), 'robopipe_api_url': request.robopipe_api_url}
    return render(request, 'base.html', response)
