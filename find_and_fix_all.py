#!/usr/bin/env python3
import pathlib

# Find all .vue, .js files with literal \n
files_with_issues = []

for file in pathlib.Path('src').rglob('*'):
    if file.suffix not in ['.vue', '.js']:
        continue
    
    try:
        content = file.read_text(encoding='utf-8')
        # Count literal backslash-n (displayed as \\n in the text)
        count = content.count('\\n')
        if count > 0:
            files_with_issues.append((str(file.relative_to('src')), count))
            print(f'{file.relative_to("src")}: {count} literal backslash-n sequences')
    except Exception as e:
        pass

print(f'\nTotal files with issues: {len(files_with_issues)}')

# Fix all files
for file in pathlib.Path('src').rglob('*'):
    if file.suffix not in ['.vue', '.js']:
        continue
    
    try:
        content = file.read_text(encoding='utf-8')
        if '\\n' in content:
            fixed = content.replace('\\n', '\n')
            file.write_text(fixed, encoding='utf-8')
            print(f'Fixed: {file.relative_to("src")}')
    except Exception as e:
        pass
