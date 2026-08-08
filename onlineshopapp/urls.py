from django.urls import path,include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainSlidingView

from onlineshopapp.admin_views import (AdminCategoryViewSet,AdminProductViewSet,AdminOrderViewSet,
                                       AdminProfileViewSet,AdminFlashSaleViewSet,admin_list_product_attribute,
                                       admin_list_product_view_history)
from onlineshopapp.shop_views import (CategoryViewSet,ProductViewSet,get_product_by_category_id,
                                      CartViewSet,ProfileViewSet,LogoutAPIView,WishlistViewSet,
                                      ActiveFlashSaleViewSet,RegisterAPIView,support_chat)
from .shop_views import MyTokenObtainPairView
from rest_framework_simplejwt.views import TokenRefreshView


router = DefaultRouter()

router.register(r'categories-admin',AdminCategoryViewSet)
router.register(r'products-admin',AdminProductViewSet)
router.register(r'profiles-admin',AdminProfileViewSet)
router.register(r'orders-admin',AdminOrderViewSet,basename='order-admin')
router.register(r'flashes-admin',AdminFlashSaleViewSet)

router.register(r'categories',CategoryViewSet,basename='categories')
router.register(r'products',ProductViewSet,basename='products')
router.register(r'cart',CartViewSet,basename='cart')
router.register(r'profile',ProfileViewSet,basename='Profile')
router.register(r'wishes',WishlistViewSet,basename='wishlist')
router.register(r'flash-sale',ActiveFlashSaleViewSet,basename='Flashsale')


urlpatterns = [
    path('',include(router.urls)),
    path('login/',TokenObtainSlidingView.as_view(),name='login'),
    path('product_list_history/',admin_list_product_view_history,name='admin-list-product-view-history'),
    path('product_list_attribute/',admin_list_product_attribute,name='admin-list-product-attribute'),
    path('product-category-id/<int:category_id>/',get_product_by_category_id,name='get_product_by_category_id'),
    path('logout/',LogoutAPIView.as_view(),name='logout'),
    path('register/',RegisterAPIView.as_view(),name='register'),
    path('support-chat/', support_chat, name='support-chat'),
    path('api/token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
