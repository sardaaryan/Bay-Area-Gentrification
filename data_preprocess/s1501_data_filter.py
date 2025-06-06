import pandas as pd
import os

def clean_and_process_educational_attainment_data(start_year=2010, end_year=2023, output_filename="edu_attain.csv"):
    """
    Processes ACS educational attainment data from 2010–2023 for Bay Area census tracts.
    Uses S-code headers (first row only) to calculate:
    - 2010–2018: Raw count from S1501_C01_015E.
    - 2019–2023: Proportion from S1501_C01_015E / S1501_C01_006E.
    """

    all_years_data = []
    STANDARD_EDU_ATTAIN_NAME = "25_Plus_Bachelors_Degree_Or_Higher_Count"

    for year in range(start_year, end_year + 1):
        file_name = f"ACSST5Y{year}.S1501-Data.csv"
        print(f"Processing {file_name} for year {year}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping.")
            continue

        # Read with only the S-code header (first row)
        df = pd.read_csv(file_name, header=0, low_memory=False)

        # clean up stray Geographic Area Names
        df = df[df['NAME'].notna() & ~df['NAME'].str.startswith('Geographic Area Name')]

        # Drop 'GEO_ID' if present (no longer needed for tract/county parsing)
        df = df.drop(columns=['GEO_ID'], errors='ignore')

        # Use 'NAME' column to extract Tract ID and County
        if 'NAME' not in df.columns:
            print(f"Missing expected 'NAME' column in {file_name}. Skipping.")
            continue

        # Use regex splits to assign individual csv variables
        split_data = df['NAME'].str.split(r'[,;]', expand=True)
        df['Tract ID'] = split_data[0].str.replace('Census Tract ', '', regex=False)
        df['County'] = split_data[1].str.replace(' County', '', regex=False).fillna('')
        df['Year'] = year

        # Pull the variable(s) depending on year
        if 2010 <= year <= 2017:
            if 'S1501_C01_015E' in df.columns:
                edu_value = pd.to_numeric(df['S1501_C01_015E'], errors='coerce')
            else:
                print(f"Missing column S1501_C01_015E for {year}. Using 0.")
                edu_value = pd.Series([0] * len(df))
        elif 2018 <= year <= 2023:
            if 'S1501_C01_015E' in df.columns and 'S1501_C01_006E' in df.columns:
                numerator = pd.to_numeric(df['S1501_C01_015E'], errors='coerce').fillna(0)
                denominator = pd.to_numeric(df['S1501_C01_006E'], errors='coerce').replace(0, pd.NA)
                edu_value = pd.to_numeric((numerator / denominator) * 100, errors='coerce').fillna(0)
            else:
                print(f"Missing column(s) for {year}. Using 0.")
                edu_value = pd.Series([0] * len(df))

        # Build DataFrame for this year
        year_df = pd.DataFrame({
            'Tract ID': df['Tract ID'],
            'County': df['County'],
            'Year': year,
            STANDARD_EDU_ATTAIN_NAME: edu_value
        })

        # Group and take mean for split tracts
        grouped = year_df.groupby(['Tract ID', 'County', 'Year'])[STANDARD_EDU_ATTAIN_NAME].mean().reset_index()
        all_years_data.append(grouped)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    final_df = pd.concat(all_years_data, ignore_index=True)
    final_df = final_df[['Tract ID', 'County', STANDARD_EDU_ATTAIN_NAME, 'Year']]

    # Interpolate missing values linearly by tract and county
    final_df.sort_values(by=['Tract ID', 'County', 'Year'], inplace=True)
    final_df[STANDARD_EDU_ATTAIN_NAME] = (
        final_df.groupby(['Tract ID', 'County'])[STANDARD_EDU_ATTAIN_NAME]
        .transform(lambda group: group.interpolate(method='linear', limit_direction='both'))
    )


    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed data into {output_filename}")
    print(f"Final shape: {final_df.shape}")

# --- Entry point ---
if __name__ == "__main__":
    clean_and_process_educational_attainment_data()

