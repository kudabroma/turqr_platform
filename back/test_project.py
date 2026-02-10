#!/usr/bin/env python
"""
Скрипт для тестирования QR Menu SaaS проекта.
Запускает тесты с SQLite базой данных вместо PostgreSQL.
"""

import os
import sys
import django
from pathlib import Path

# Добавляем корневую директорию проекта в путь
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Устанавливаем переменную окружения для Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')

# Инициализируем Django
django.setup()

# Импортируем и запускаем тесты
from django.core.management import execute_from_command_line
from django.test.utils import get_runner

TestRunner = get_runner(django.conf.settings)
test_runner = TestRunner()

def run_tests():
    """Запуск всех тестов"""
    print("Zapusk testov QR Menu SaaS proekta...")
    print("Ispolzuetsya SQLite baza dannykh dlya testirovaniya")
    print("-" * 50)

    # Запускаем тесты
    failures = test_runner.run_tests(["restaurants"])

    if failures == 0:
        print("\nVse testy proshli uspeshno!")
        return 0
    else:
        print(f"\n{failures} test(ov) provalilos(lish)")
        return 1

if __name__ == "__main__":
    sys.exit(run_tests())