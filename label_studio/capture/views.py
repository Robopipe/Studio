from django.shortcuts import render


def capture_interface(request):
    return render(request, "base.html")
