import os
import csv
import math
import random
from datetime import datetime, timedelta

# Configuration
GEOGRAPHY_FILE = os.path.join(os.path.dirname(__file__), "21838- Dataful", "list-of-states-districts-sub-districts-and-villages-along-with-their-lgd-codes-as-of-2-july-2026.csv")
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "indian_statistics_datasets")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "idsp_simulated_data.csv")
DISEASES = ["Dengue", "Malaria", "Typhoid", "Chikungunya"]
WEEKS = 156 # 3 years of weekly data
NUM_DISTRICTS_TO_SAMPLE = 20

def generate_data():
    print("Loading geographic dataset...")
    districts = set()
    try:
        with open(GEOGRAPHY_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                state = row.get('state_name')
                district = row.get('district_name')
                if state and district:
                    districts.add((state, district))
    except Exception as e:
        print(f"Error reading {GEOGRAPHY_FILE}: {e}")
        return

    districts_list = list(districts)
    random.seed(42)
    sampled_districts = random.sample(districts_list, min(NUM_DISTRICTS_TO_SAMPLE, len(districts_list)))
    
    print(f"Generating synthetic time-series for {len(sampled_districts)} districts over {WEEKS} weeks...")
    
    start_date = datetime(2023, 1, 1)
    
    records = []
    
    for state, district in sampled_districts:
        for disease in DISEASES:
            # Base parameters for the disease in this district
            base_cases = random.randint(0, 10)
            seasonal_peak = random.randint(20, 35) # Week of the year it peaks (e.g., monsoon)
            
            current_date = start_date
            for week in range(WEEKS):
                week_of_year = current_date.isocalendar()[1]
                
                # Seasonality factor (sine wave)
                season_factor = math.sin((week_of_year - seasonal_peak) / 52.0 * 2 * math.pi) * 0.5 + 0.5
                
                # Outbreak spike (random chance)
                outbreak_multiplier = 1.0
                if random.random() < 0.05: # 5% chance of sudden outbreak
                    outbreak_multiplier = random.uniform(3.0, 8.0)
                
                # Calculate cases
                cases = int(max(0, base_cases + (base_cases * 10 * season_factor) * outbreak_multiplier + random.randint(-2, 5)))
                
                records.append({
                    'Date': current_date.strftime('%Y-%m-%d'),
                    'State': state,
                    'District': district,
                    'Disease': disease,
                    'Cases': cases,
                    'Deaths': int(cases * random.uniform(0.01, 0.05)) if cases > 20 else 0
                })
                
                current_date += timedelta(days=7)
                
    # Create DataFrame and save
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['Date', 'State', 'District', 'Disease', 'Cases', 'Deaths'])
        writer.writeheader()
        writer.writerows(records)
        
    print(f"Successfully generated {len(records)} records at {OUTPUT_FILE}")

if __name__ == "__main__":
    generate_data()
