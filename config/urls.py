from django.contrib import admin
from django.urls import path, include, re_path
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from django.conf import settings
from django.conf.urls.static import static

schema_view = get_schema_view(
    openapi.Info(
        title="API",   #bu shunchaki swaggerda chiqadigan nomi
        default_version='v1',  #bu esa versiyasi
        description='E-commerce API',  #bu shunchaki description
        terms_of_service="https://www.com/policies/terms/",   #bunga shunchaki xohlagan urlimizni qo'ysak ham bo'ladi.
        contact=openapi.Contact(email="ramazontursunov007@gmail.com"),   #bunga o'zimizni urlimizni qo'ysak ham bo'ladi.
        license=openapi.License(name="BSD License")  #Licence
    ),
    public=True  #bu hammaga ochiq ko'rinadi.
)

urlpatterns = [
    path('admin/', admin.site.urls),  #bu admin uchun url
    path('api/v1/', include('onlineshopapp.urls')),  #drf page

    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    path('', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc')
]  + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
