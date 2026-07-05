import re

filepath = r'..\datasets\medicine_dataset\data.js'
with open(filepath, 'r', encoding='utf-8') as f:
    data = f.read()

# Replace truncated "https: with "",
data = re.sub(r'"https:\s*\n', '"",\n', data)

# A robust way to fix nested double quotes is to replace any double quote that has a word character right before or after it, and is preceded by a comma or space INSIDE a string.
# But it's easier to just use re.sub for specific known patterns since it's a fixed dataset.
# The error was: "Body as a Whole : Low blood sugar, Disulfiram-like,Central Nervous System : Dizziness and headache, \"Gastrointestinal\": Diarrhea, nausea, vomiting, loss of appetite and hunger, \"Liver\": Jaundice, \"Skin\": Itching and hives, \"Blood\": Anemia and decrease in blood counts."
# Let's replace \" with \' for these specific words exactly as they appear.

data = data.replace(', "Gastrointestinal":', ", 'Gastrointestinal':")
data = data.replace(', "Liver":', ", 'Liver':")
data = data.replace(', "Skin":', ", 'Skin':")
data = data.replace(', "Blood":', ", 'Blood':")
data = data.replace('patient"s', "patient's")

# Let's also check if there are other unescaped quotes. 
# Another common one in this dataset could be 'Central Nervous System'
data = data.replace('"Central Nervous System":', "'Central Nervous System':")
data = data.replace('"Body as a Whole"', "'Body as a Whole'")
# Revert the broken quote
data = data.replace("'Body as a Whole :", '"Body as a Whole :')

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(data)



