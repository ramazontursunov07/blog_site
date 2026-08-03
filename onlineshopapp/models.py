from django.utils import timezone   # ✅ TO'G'RI
from django.core.validators import MinValueValidator, RegexValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import User


# Category uchun alohida upload_to
def category_upload_to(instance, filename):
    return f'categories/{filename}'


# Product uchun alohida upload_to
def product_upload_to(instance, filename):
    return f'{instance.category.slug}/{filename}'



class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    image = models.ImageField(upload_to=category_upload_to)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name='products')
    price = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    total = models.IntegerField(default=0)
    expiry_date = models.DateField(null=True, blank=True)
    image = models.ImageField(upload_to=product_upload_to)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class ProductAttribute(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='attributes')
    key = models.CharField(max_length=100)
    value = models.CharField(max_length=100)

    def __str__(self):
        return f'{self.product.name} - {self.key}: {self.value}'


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone_number = models.CharField(max_length=13, validators=[RegexValidator(r'^\+998\d{9}$')])
    address = models.TextField()
    age = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return self.user.username


class Order(models.Model):
    STATUS = (
        ('pending', 'Kutilmoqda'),
        ('processing', 'Jarayonda'),
        ('delivered', 'Yetkazildi'),
        ('cancelled', 'Bekor qilindi')
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=15, choices=STATUS, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'{self.user.username} - {self.status}'


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True)
    quantity = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f'{self.order} - {self.product.name}'


class Cart(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.user.username} savatchasi'


class CartItem(models.Model):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='cart_items')
    quantity = models.IntegerField(default=1)

    def __str__(self):
        return f'{self.cart} - {self.product.name}'


class FlashSale(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    discount_percentage = models.PositiveIntegerField()
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    def is_active(self):
        now = timezone.now()
        return self.start_time <= now <= self.end_time

    class Meta:
        unique_together = ('product', 'start_time', 'end_time')


class ProductViewHistory(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)


class Wishlist(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='wishlist_items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'product')  # bitta mahsulotni ikki marta belgilab bo'lmaydi