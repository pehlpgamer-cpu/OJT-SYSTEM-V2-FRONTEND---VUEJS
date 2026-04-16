#!/usr/bin/env python3
import pathlib

# Fix studentStore.js
store_path = pathlib.Path(r'frontend\src\stores\studentStore.js')
store_content = store_path.read_text(encoding='utf-8')
store_fixed = store_content.replace('\\n', '\n')
store_path.write_text(store_fixed, encoding='utf-8')
print(f"Fixed studentStore.js: {len(store_content)} -> {len(store_fixed)} chars")
print(f"  Newlines: {store_content.count(chr(10))} -> {store_fixed.count(chr(10))}")

# Fix MatchesPage.vue
vue_path = pathlib.Path(r'frontend\src\views\Student\MatchesPage.vue')
vue_content = vue_path.read_text(encoding='utf-8')
vue_fixed = vue_content.replace('\\n', '\n')
vue_path.write_text(vue_fixed, encoding='utf-8')
print(f"Fixed MatchesPage.vue: {len(vue_content)} -> {len(vue_fixed)} chars")
print(f"  Newlines: {vue_content.count(chr(10))} -> {vue_fixed.count(chr(10))}")
