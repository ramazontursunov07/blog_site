import os
import anthropic
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


# ==================== AI Mijozlarga Yordam Chatbot ====================

_anthropic_client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

SUPPORT_SYSTEM_PROMPT = """Siz "Online Do'kon" internet-do'konining mijozlarga yordam beruvchi AI yordamchisisiz.
Faqat o'zbek tilida, qisqa, do'stona va aniq javob bering.

Do'kon haqida ma'lumot:
- Buyurtma berish: mahsulotni tanlab "Savatchaga qo'shish" tugmasini bosish, keyin savatchada "Buyurtma berish" tugmasini bosish kerak. Buyurtma darhol qabul qilinadi.
- Yetkazib berish: odatda 1-3 ish kuni ichida, mintaqaga qarab farq qilishi mumkin.
- To'lov: hozircha faqat naqd pul yoki plastik karta orqali, mahsulot yetkazilganda.
- Buyurtmani bekor qilish: faqat "Kutilmoqda" holatidagi buyurtmalarni "Buyurtmalarim" bo'limidan bekor qilish mumkin.
- Mahsulotni qaytarish: nuqsonli yoki noto'g'ri yetkazilgan mahsulotlarni 7 kun ichida qaytarish mumkin.
- "Saralangan mahsulotlar" (wishlist): yurakcha belgisini bosib, mahsulotlarni alohida ro'yxatga saqlash mumkin.
- Profilni tahrirlash: profil belgisi orqali ism, familiya, email, telefon, manzilni yangilash mumkin.
- Parolni tiklash funksiyasi hozircha mavjud emas.

Agar savol shu do'kon bilan bog'liq bo'lmasa yoki javobini bilmasangiz, buni ochiq ayting va
qo'llab-quvvatlash xizmatiga murojaat qilishni tavsiya qiling. Hech qachon noto'g'ri yoki
o'ylab topilgan ma'lumot bermang (masalan aniq narxlar yoki buyurtma holatini bilmasangiz)."""


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def support_chat(request):
    user_message = (request.data.get('message') or '').strip()
    history = request.data.get('history') or []  # [{role: 'user'|'assistant', content: '...'}, ...]

    if not user_message:
        return Response({'error': "Xabar bo'sh bo'lishi mumkin emas"}, status=400)
    if len(user_message) > 2000:
        return Response({'error': "Xabar juda uzun"}, status=400)

    # Faqat oxirgi 10 ta xabarni yuboramiz (kontekstni cheklash uchun)
    trimmed_history = history[-10:]
    messages = trimmed_history + [{"role": "user", "content": user_message}]

    try:
        response = _anthropic_client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=500,
            system=SUPPORT_SYSTEM_PROMPT,
            messages=messages,
        )
        reply_text = "".join(
            block.text for block in response.content if block.type == "text"
        )
        return Response({'reply': reply_text})
    except Exception:
        return Response(
            {'error': "AI yordamchi hozircha javob bera olmayapti. Birozdan so'ng qayta urinib ko'ring."},
            status=503,
        )
