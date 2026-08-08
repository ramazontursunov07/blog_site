from rest_framework.decorators import action
from django.db import transaction
from .models import Category, Product, Profile, Order, Cart, OrderItem, FlashSale, ProductViewHistory, ProductAttribute
from rest_framework import viewsets

from .serializers import CategorySerializer, ProfileSerializer, ProductSerializer, OrderSerializer, FlashSaleSerializer, \
    ProductViewHistorySerializer, ProductAttributeSerializer
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions


class AdminCategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAdminUser]

    # def get_permissions(self):
    #     if self.action in ['create', 'update', 'partial_update', 'destroy']:
    #         return [permissions.IsAdminUser()]
    #     return [permissions.AllowAny()]


class AdminProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    permission_classes = [permissions.IsAdminUser]

    # def get_permissions(self):
    #     if self.action in ['create', 'update', 'partial_update', 'destroy']:
    #         return [permissions.IsAdminUser()]
    #     return [permissions.AllowAny()]


class AdminProfileViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAdminUser]


class AdminOrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer  # bu serializer class
    permission_classes = [permissions.IsAuthenticated]  # bu agar admin login qilgan bo'lsa shundagina kira oladi.
    http_method_names = ['get', 'post']  # bu esa faqatgina post va get metodlari ishlatiladi.

    def get_queryset(self):  # bu funksiya esa bizga barcha orderlarni olib beradi.
        if self.request.user.is_staff:  # bu qatorda esa admin bo'lsa deb tekshiradi.
            return Order.objects.all()  # bu yerda esa agar admin bo'lsa hamma profilelarni ko'ra oladi.
        return Order.objects.filter(user=self.request.user)  # agar oddiy user bo'lsa unda faqat o'zinikini ko'ra oladi.

    def create(self, request, *args, **kwargs):
        cart = Cart.objects.filter(user=request.user).first()
        if not cart or not cart.items.exists():
            return Response({"error": "Savatcha bo'sh"}, status=400)

        with transaction.atomic():
            cart_items = list(cart.items.select_related('product').all())
            product_ids = [item.product_id for item in cart_items]

            # select_for_update() — shu mahsulotlar qatorini "qulflaydi", shunda ikkita
            # foydalanuvchi bir vaqtda oxirgi donani sotib olishga urinsa, ikkinchisi
            # birinchisi tugagunicha kutadi (poyga sharoitining oldi olinadi)
            locked_products = {
                p.id: p for p in Product.objects.select_for_update().filter(id__in=product_ids)
            }

            # Avval BARCHA mahsulotlar uchun yetarli miqdor borligini tekshiramiz
            for item in cart_items:
                product = locked_products[item.product_id]
                if item.quantity > product.total:
                    return Response(
                        {"error": f"'{product.name}' mahsulotidan yetarli miqdor yo'q. Mavjud: {product.total} ta"},
                        status=400
                    )

            total_price = sum(locked_products[item.product_id].price * item.quantity for item in cart_items)
            order = Order.objects.create(user=request.user, total_price=total_price)

            for item in cart_items:
                product = locked_products[item.product_id]
                OrderItem.objects.create(
                    order=order, product=product, quantity=item.quantity, price=product.price,
                    total_price=product.price * item.quantity
                )
                product.reduce_total(item.quantity)  # yuqorida tekshirilgani uchun bu yerda xavfsiz

            cart.items.all().delete()

        serializer = self.get_serializer(order)
        return Response(serializer.data, status=201)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status != 'pending':
            return Response({'error': "Faqat kutilayotgan buyurtmani bekor qilish mumkin!!!"}, status=400)

        with transaction.atomic():
            for item in order.items.select_related('product').all():
                if item.product:
                    item.product.increase_total(item.quantity)

            order.status = 'cancelled'
            order.save()

        return Response(self.get_serializer(order).data)


class AdminFlashSaleViewSet(viewsets.ModelViewSet):
    queryset = FlashSale.objects.all()
    serializer_class = FlashSaleSerializer
    permission_classes = [permissions.IsAdminUser]


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def admin_list_product_view_history(request):
    history = ProductViewHistory.objects.filter(user=request.user).order_by('-timestamp')
    serializer = ProductViewHistorySerializer(history, many=True)
    return Response({"product_view_history_all": serializer.data})


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def admin_list_product_attribute(request, product_id):
    attribute = ProductAttribute.objects.filter(product_id=product_id)
    serializer = ProductAttributeSerializer(attribute, many=True)
    return Response({"product_attribute_all": serializer.data})
