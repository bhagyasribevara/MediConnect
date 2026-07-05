import re
import json

filepath = r'..\datasets\medicine_dataset\data.js'
with open(filepath, 'r', encoding='utf-8') as f:
    json_str = f.read()

json_str = re.sub(r'export default sampleMedicins;', '', json_str)
json_str = re.sub(r'const sampleMedicins = ', '', json_str)
json_str = re.sub(r',\s*([\]}])', r'\1', json_str)

# Only match keys that are at the beginning of a line (with optional spaces)
json_str = re.sub(r'(?m)^(\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)

json_str = re.sub(r'//.*', '', json_str)
json_str = re.sub(r'module\.exports\s*=.*', '', json_str)
json_str = json_str.strip()
if json_str.endswith(';'):
    json_str = json_str[:-1]

with open('parsed_data.json', 'w', encoding='utf-8') as f:
    f.write(json_str)

try:
    json.loads(json_str, strict=False)
    print("Success!")
except Exception as e:
    print("Failed:")
    print(e)
