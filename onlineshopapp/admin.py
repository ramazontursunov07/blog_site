from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductAttribute, Order, OrderItem, CartItem, Cart



@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug', 'is_active', 'created_at', 'show_image']
    list_filter = ['is_active', 'created_at', 'name']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_per_page = 20
    ordering = ['-created_at']

    def show_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" />', obj.image.url)
        return 'Rasm yo\'q'

    show_image.short_description = 'image'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'category', 'price', 'total', 'expiry_date', 'show_image', 'is_active']
    list_filter = ['category', 'expiry_date', 'is_active']
    search_fields = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}
    list_per_page = 20
    ordering = ['-created_at']

    def show_image(self, obj):
        if obj.image:
            return format_html('<img src="{}" width="50" height="50" />', obj.image.url)
        return "Rasm yo'q"

    show_image.short_description = 'Rasm'


@admin.register(ProductAttribute)
class ProductAttributeAdmin(admin.ModelAdmin):
    list_display = ['product', 'key', 'value']
    list_filter = ['key']
    search_fields = ['key', 'value']
    list_per_page = 10


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['user']
    list_per_page = 10


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ['cart', 'product', 'quantity']
    list_filter = ['quantity', 'product']
    search_fields = ['product', 'quantity']
    list_per_page = 10


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['user', 'total_price', 'status', 'created_at']
    list_filter = ['total_price', 'status', 'created_at']
    search_fields = ['user', 'status']
    list_per_page = 10


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ['order', 'product', 'quantity', 'price', 'total_price']
    list_filter = ['product', 'quantity', 'total_price']
    search_fields = ['product', 'total_price']
    list_per_page = 10
