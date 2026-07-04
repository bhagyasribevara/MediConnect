import os
import glob

files = glob.glob('backend/services/*.py')
files.append('backend/train_models.py')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # For backend/services/*.py
    if 'services' in f:
        content = content.replace(
            'os.path.dirname(os.path.dirname(__file__))',
            'os.path.dirname(os.path.dirname(os.path.dirname(__file__)))'
        )
        content = content.replace(
            'os.path.join(os.path.dirname(__file__), "..", "..", "datasets"',
            'os.path.join(os.path.dirname(__file__), "..", "..", "..", "datasets"'
        )
        content = content.replace(
            'os.path.join(os.path.dirname(__file__), "..", "..", "models"',
            'os.path.join(os.path.dirname(__file__), "..", "..", "..", "models"'
        )
        # Also handle typos in directories:
        content = content.replace('symptom_checker_dataset', 'syntom_checker_dataset')
        content = content.replace('appointments_dataset', 'appoinments_dataset')
        content = content.replace('Alternate_appointment_dataset', 'Alternate_appoinment_dataset')
    
    # For train_models.py
    if 'train_models.py' in f:
        content = content.replace(
            'MODELS_DIR = os.path.join(BACKEND_DIR, "models")',
            'MODELS_DIR = os.path.join(BACKEND_DIR, "..", "models")'
        )
        
    with open(f, 'w', encoding='utf-8') as file:
        file.write(content)
print('Replaced paths successfully')
