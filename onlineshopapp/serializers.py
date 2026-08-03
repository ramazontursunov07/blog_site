from rest_framework import serializers
from .models import Category, Product, ProductViewHistory, ProductAttribute, Profile, Order, OrderItem, Cart, CartItem, \
    FlashSale, Wishlist
from django.contrib.auth.models import User

# serializers.py — TokenObtainPairSerializer'ni override qilamiz
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['is_staff'] = user.is_staff
        token['is_superuser'] = user.is_superuser
        token['username'] = user.username
        return token


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = "__all__"


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"


class ProductViewHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductViewHistory
        fields = "__all__"


class ProductAttributeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductAttribute
        fields = "__all__"


class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(read_only=True)
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')

    class Meta:
        model = Profile
        fields = ['id', 'first_name', 'last_name', 'email', 'phone_number', 'address']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user
        for attr, value in user_data.items():
            setattr(user, attr, value)
        user.save()
        return super().update(instance, validated_data)


class OrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = "__all__"


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = "__all__"


class CartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cart
        fields = "__all__"


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = "__all__"


class FlashSaleSerializer(serializers.ModelSerializer):
    is_active = serializers.SerializerMethodField()
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_image = serializers.ImageField(source='product.image', read_only=True)

    class Meta:
        model = FlashSale
        fields = ['id', 'product', 'discount_percentage', 'start_time', 'end_time', 'is_active', 'product_name', 'product_image']

    def get_is_active(self, obj):
        return obj.is_active()


class WishlistSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wishlist
        fields = "__all__"


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True)
    address = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'first_name', 'last_name', 'email', 'phone_number', 'address', 'password']

    def create(self, validated_data):
        phone_number = validated_data.pop('phone_number')
        address = validated_data.pop('address')
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user, phone_number=phone_number, address=address)
        return user