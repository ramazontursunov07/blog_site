from django.template.context_processors import request
from django_filters import rest_framework as django_filters
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView

from .filters import ProductFilter, CategoryFilter
from .models import *
from .serializers import *
from rest_framework.response import Response
from rest_framework import viewsets, filters
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.pagination import PageNumberPagination
from rest_framework import generics, permissions
from onlineshopapp.serializers import RegisterSerializer
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer


class CustomPagination(PageNumberPagination):
    page_size = 5


class RegisterAPIView(generics.CreateAPIView):
    permission_classes = [permissions.AllowAny]
    queryset = User.objects.all()
    serializer_class = RegisterSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer

    def get_permissions(self):
        # Ko'rish (list/retrieve) — mehmonlar uchun ham ochiq
        # Yaratish/tahrirlash/o'chirish — faqat tizimga kirgan foydalanuvchilar uchun
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    filterset_class = CategoryFilter
    search_fields = ['name']


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer

    pagination_class = CustomPagination
    filter_backends = (django_filters.DjangoFilterBackend, filters.SearchFilter)
    filterset_class = ProductFilter

    def get_permissions(self):
        # Ko'rish (list/retrieve) — mehmonlar uchun ham ochiq
        # Yaratish/tahrirlash/o'chirish — faqat tizimga kirgan foydalanuvchilar uchun
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def get_product_by_category_id(request, category_id):
    products = Product.objects.filter(category_id=category_id)
    serializer = ProductSerializer(products, many=True)
    return Response({"products": serializer.data})


class CartViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = CartItemSerializer
    http_method_names = ['get', 'post', 'delete']

    def get_queryset(self):
        return CartItem.objects.filter(cart__user=self.request.user)

    def create(self, request, *args, **kwargs):
        product = get_object_or_404(Product, pk=request.data.get('product'))
        cart, _ = Cart.objects.get_or_create(user=request.user)
        cart_item, created = CartItem.objects.get_or_create(cart=cart, product=product)

        if not created:
            cart_item.quantity += 1
            cart_item.save()
        serializer = CartItemSerializer(cart_item)
        return Response({'created': serializer.data}, status=201)

    @action(detail=True, methods=['post'])
    def decrease(self, request, pk=None):  # miqdorni -1 qilish yoki 1 bo'lsa o'chirish
        cart_item = get_object_or_404(CartItem, pk=pk, cart__user=request.user)
        if cart_item.quantity > 1:
            cart_item.quantity -= 1
            cart_item.save()
            serializer = CartItemSerializer(cart_item)
            return Response(serializer.data, status=200)
        else:
            cart_item.delete()
            return Response({"message": "Mahsulot savatdan o'chirildi!!!"}, status=200)

    @action(detail=False, methods=['delete'])
    def clear(self, request):
        cart_item = CartItem.objects.filter(cart__user=request.user)
        cart_item.delete()
        return Response({"message": "Savatcha tozalandi!!!"}, status=200)


class ProfileViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = ProfileSerializer
    http_method_names = ['get', 'patch']

    def get_queryset(self):
        return Profile.objects.filter(user=self.request.user)


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"message": "Tizimdan chiqildi"}, status=200)


class WishlistViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    serializer_class = WishlistSerializer
    http_method_names = ['get', 'post']  # faqat ro'yxat va toggle uchun

    def get_queryset(self):
        return Wishlist.objects.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def toggle(self, request, pk):
        product = get_object_or_404(Product, pk=request.data.get('product'))
        wishlist_item = Wishlist.objects.filter(user=request.user, product=product).first()

        if wishlist_item:
            wishlist_item.delete()
            return Response({"status": "removed"}, status=200)
        else:
            new_item = Wishlist.objects.create(user=request.user, product=product)
            serializer = self.get_serializer(new_item)
            return Response({"status": "added", "data": serializer.data}, status=201)


class ActiveFlashSaleViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = FlashSaleSerializer

    def get_queryset(self):
        now = timezone.now()
        return FlashSale.objects.filter(start_time__lte=now, end_time__gte=now)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def my_orders(request):
    orders = Order.objects.filter(user=request.user).order_by('-created_at')
    serializer = OrderSerializer(orders,many=True)
    return Response(serializer.data)
