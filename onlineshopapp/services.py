# from django.db import connection
# from contextlib import closing
#
# from onlineshopapp.models import Category, Product
#
#
# def dictfetchall(cursor):
#     columns = [col[0] for col in cursor.description]
#     return [
#         dict(zip(columns, row)) for row in cursor.fetchall()
#     ]
#
#
# def dictfetchone(cursor):
#     row = cursor.fetchone()
#     if row is None:
#         return False
#     columns = [col[0] for col in cursor.description]
#     return dict(zip(columns, row))
#
#
# def get_fruits():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM fruits""")
#         return dictfetchall(cursor)
#
#
# def get_vegetables():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM vegetables""")
#         return dictfetchall(cursor)
#
#
# def get_clothing():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM clothing""")
#         return dictfetchall(cursor)
#
#
# def get_shoes():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM shoes""")
#         return dictfetchall(cursor)
#
#
# def get_electronics():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM electronics""")
#         return dictfetchall(cursor)
#
#
#
# def get_home():
#     categories = Category.objects.filter(is_active=True)
#     products = Product.objects.filter(is_active=True).order_by('-created_at')[:10]
#     return categories, products
#
#
# def get_meat():
#     categories = Category.objects.filter(is_active=True)
#     products = Product.objects.filter(is_active=True)
#     return categories, products
#
#
# def get_milk():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM milk""")
#         return dictfetchall(cursor)
#
#
# def get_breads():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM breads""")
#         return dictfetchall(cursor)
#
#
# def get_drinks():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM drinks""")
#         return dictfetchall(cursor)
#
#
# def get_categories():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM onlineshopapp_category""")
#         return dictfetchall(cursor)
#
#
# def get_cartitems():
#     with closing(connection.cursor()) as cursor:
#         cursor.execute("""SELECT * FROM onlineshopapp_cartitem""")
#         return dictfetchall(cursor)
