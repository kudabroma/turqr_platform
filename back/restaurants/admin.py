from django.contrib import admin
from .models import Restaurant, Category, Dish


# -------------------------------------------------
# Inline Dish inside Restaurant
# -------------------------------------------------

class DishInline(admin.TabularInline):
    model = Dish
    extra = 0
    fields = ("category", "name_tr", "name_en", "price", "is_active")  # ✅ добавили
    show_change_link = True


# -------------------------------------------------
# Restaurant Admin
# -------------------------------------------------

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "slug", "active", "updated_at")
    list_filter = ("active",)
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("created_at", "updated_at")
    ordering = ("-updated_at",)

    inlines = [DishInline]

    fieldsets = (
        ("Main", {
            "fields": ("name", "slug", "active", "front_template")
        }),
        ("Description (TR/EN)", {
            "fields": ("description_tr", "description_en")
        }),
        ("Contacts", {
            "fields": ("phone", "email", "address", "contacts")
        }),
        ("Branding", {
            "fields": ("logo",)
        }),
        ("Photos", {
            "fields": ("photo1", "photo2", "photo3", "photo4", "photo5", "photo6")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )


# -------------------------------------------------
# Category Admin
# -------------------------------------------------

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "restaurant", "name", "is_system")
    list_filter = ("restaurant", "is_system")
    search_fields = ("name",)
    ordering = ("restaurant", "id")
    autocomplete_fields = ("restaurant",)


# -------------------------------------------------
# Dish Admin
# -------------------------------------------------

@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "restaurant",
        "category",
        "name_tr",
        "price",
        "is_active",   # ✅ теперь видно статус
        "updated_at",
    )

    list_filter = (
        "restaurant",
        "category",
        "is_active",   # ✅ можно фильтровать Aktif / Pasif
    )

    list_editable = (
        "is_active",   # ✅ можно переключать прямо в списке
    )

    search_fields = (
        "name_tr",
        "name_en",
        "name",
        "description_tr",
        "description_en",
    )

    readonly_fields = ("created_at", "updated_at")
    ordering = ("restaurant", "category", "id")
    autocomplete_fields = ("restaurant", "category")

    fieldsets = (
        ("Main", {
            "fields": (
                "restaurant",
                "category",
                "price",
                "image",
                "is_active",   # ✅ добавили сюда
            )
        }),
        ("Name (TR/EN)", {
            "fields": ("name_tr", "name_en")
        }),
        ("Description (TR/EN)", {
            "fields": ("description_tr", "description_en")
        }),
        ("Legacy (compat)", {
            "fields": ("name", "description")
        }),
        ("Lifecycle", {
            "fields": ("moved_to_unsorted_at", "archived_at")
        }),
        ("Timestamps", {
            "fields": ("created_at", "updated_at")
        }),
    )