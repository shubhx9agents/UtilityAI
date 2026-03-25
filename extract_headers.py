import pandas as pd
import json

file_path = 'AdsManagerTemplate_v2.3.xltx'
try:
    df = pd.read_excel(file_path, sheet_name=0) # Assuming it's the first sheet
    columns = df.columns.tolist()
    print(json.dumps(columns))
except Exception as e:
    print(f'Error: {e}')
