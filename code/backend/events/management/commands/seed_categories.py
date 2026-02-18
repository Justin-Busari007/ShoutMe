from django.core.management.base import BaseCommand
from events.models import Category


class Command(BaseCommand):
    help = "Seed initial event categories"

    def handle(self, *args, **options):
        categories = ["Music", "Food", "Comedy", "Fitness", "Biz", "Film", "Art", "Other"]

        created_count = 0
        for cat_name in categories:
            cat, created = Category.objects.get_or_create(name=cat_name)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created category: {cat_name}')
                )
                created_count += 1

        if created_count == 0:
            self.stdout.write(
                self.style.WARNING("All categories already exist")
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✓ Successfully created {created_count} categories')
            )
