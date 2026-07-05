import json
import re

filepath = r'c:\Users\yusuf\OneDrive\Desktop\Mediconnet_off\MediConnect\datasets\medicine_dataset\data.js'
with open(filepath, 'r', encoding='utf-8') as fh:
    content = fh.read()

match = re.search(r'\[.*\]', content, re.DOTALL)
json_str = match.group(0)
json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
json_str = json_str.replace("'", '"')
json_str = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)

try:
    json.loads(json_str)
    print('Success')
except json.JSONDecodeError as e:
    print(f'Error: {e}')
    start = max(0, e.pos - 50)
    end = min(len(json_str), e.pos + 50)
    print(f'Context: {json_str[start:end]}')
