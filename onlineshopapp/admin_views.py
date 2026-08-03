from rest_framework.decorators import action
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

    def create(self, request, *args, **kwargs):  # bu esa create funksiyasi bunda buyurtma yaratiladi.
        cart = Cart.objects.filter(
            user=request.user).first()  # bu yerda esa aynan buyurtma bergan userni buyurtmasini oladi.
        if not cart or not cart.items.exists():  # bu yer esa savatchadagi barcha mahsulotlarni oladi.Agar yo'q bo'lsa xatolik.
            return Response({"error": "Savatcha bo'sh"}, status=400)  # Savatcha bo'sh

        total_price = sum(item.product.price * item.quantity for item in
                          cart.items.all())  # Va bu yerda har bitta mahsulotni oladi va summasini hisoblaydi.
        order = Order.objects.create(user=request.user,
                                     total_price=total_price)  # va bu yerda esa yangi buyurtma yaratamiz va summasini yozib qo'yamiz.
        for item in cart.items.all():  # bu yerda esa barcha mahsulotlarni oladi va ularni har bittasini forda aylantirib ularni nomma-nom qilib buyurtmani yozib qo'yadi.
            OrderItem.objects.create(  # Yaratish
                order=order, product=item.product, quantity=item.quantity, price=item.product.price,
                total_price=item.product.price * item.quantity
            )  # shu yergacha buyurtmani barcha ma'lumotlarini yozib chiqadi.
        cart.items.all().delete()  # va yaratib bo'lgandan so'ng esa uni o'chirib yuboradi.

        serializer = self.get_serializer(order)  # bu yerda esa buyurtmni serilizatsiya qiladi.
        return Response(serializer.data,
                        status=201)  # bu yerda esa return qilib yuboradi serializatsiya qilingan ma'lumotlarni.

    @action(detail=True, methods=['post'])  # bu esa dekorator ya'ni bitta ma'lumot qaytaradi.Va post metodi.
    def cancel(self, request, pk=None):  # bu esa shunchaki bekor qiish
        order = self.get_object()  # bu esa aynan shu buyurtmani oladi.
        if order.status != 'pending':  # bu yerda esa aynan statusi pending bo'lmasa unda xabar berdi.
            return Response({'error': "Faqat kutilayotgan buyurtmani bekor qilish mumkin!!!"}, status=400)  # return

        order.status = 'cancelled'  # bu yerda esa buyurtma qilgandan so'ng esa uni bekor qilindi deb saqlab qo'yadi.
        order.save()  # va saqlaydi
        return Response(self.get_serializer(order).data)  # bu yerda esa serializatsiya qiladi.


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
