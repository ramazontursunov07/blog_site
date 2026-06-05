from django.urls import path
from .views import PostListView, post_detail,post_share

app_name = 'blogapp'

urlpatterns = [
    path('', PostListView.as_view(), name='main'),
    path('<int:year>/<int:month>/<int:day>/<slug:slug>/', post_detail, name='post_detail'),
    path('<int:post_id>/share/', post_share, name='post_share')
]
