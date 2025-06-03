import pandas as pd
import re
import os

def clean_and_process_median_income_data(start_year=2010, end_year=2023, output_filename="home_value.csv"):
    """
    Cleans and processes ACS median household income data for Bay Area census tracts.
    Handles multiple yearly CSV files, cleans Geographic Area Name, adds Year,
    and extracts specific median home value data without aggregating split census tracts.

    Args:
        start_year (int): The starting year for the data files (e.g., 2010).
        end_year (int): The ending year for the data files (e.g., 2023).
        output_filename (str): The name of the combined and cleaned output CSV file.
                               Defaults to "house_value.csv".
    """

    all_years_data = []

    # The column containing the raw median value from the ACS file
    RAW_MEDIAN_VALUE_COL = "S2506_C01_009E"
    # The desired name for the median value column in the output
    FINAL_MEDIAN_VALUE_COL = "Median_Home_Value"
    # The column containing the geographic area name
    GEOGRAPHIC_AREA_NAME_COL = "NAME"


    for year in range(start_year, end_year + 1):
        # Construct the specific file name for ACS median income data
        file_name = f"ACSST5Y{year}.S2506-Data.csv"
        print(f"Processing {file_name} for year {year}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this year.")
            continue

        # Read the CSV. We don't specify header, so it reads everything as data.
        df = pd.read_csv(file_name, header=None)

        # The first row (index 0) contains the actual column names (e.g., S2506_C01_009E)
        df.columns = df.iloc[0]
        # Drop the first two rows (which were the original headers)
        df = df[2:].reset_index(drop=True)

        # Ensure the 'NAME' column exists (which is the Geographic Area Name)
        if GEOGRAPHIC_AREA_NAME_COL not in df.columns:
            print(f"Error: '{GEOGRAPHIC_AREA_NAME_COL}' column not found in {file_name}. Skipping this file.")
            continue

        # Ensure the raw median value column exists and is numeric
        if RAW_MEDIAN_VALUE_COL in df.columns:
            # Convert to numeric, coercing errors (e.g., 'N' or '-') to NaN, then fill NaN with 0
            # Replace '1,000,000+' with a large numerical value like 1000000
            df[RAW_MEDIAN_VALUE_COL] = df[RAW_MEDIAN_VALUE_COL].replace('1,000,000+', '1000000', regex=False)
            # Remove commas from numbers like '1,000,000'
            df[RAW_MEDIAN_VALUE_COL] = df[RAW_MEDIAN_VALUE_COL].replace(',', '', regex=True)
            df[RAW_MEDIAN_VALUE_COL] = pd.to_numeric(df[RAW_MEDIAN_VALUE_COL], errors='coerce').fillna(0)
        else:
            print(f"Error: '{RAW_MEDIAN_VALUE_COL}' column not found in {file_name}. Skipping this file.")
            continue

        # 1) Drop "Geography" variables (if present).
        # We now use 'NAME' for geographic info. 'GEO_ID' can be dropped if not needed later.
        if 'GEO_ID' in df.columns:
            df = df.drop(columns=['GEO_ID'])

        # 2) Turn "Geographic Area Name" (now 'NAME') into "Tract ID", "County"
        # Handles both comma and semicolon delimiters
        split_data = df[GEOGRAPHIC_AREA_NAME_COL].str.split(r'[,;]', expand=True)
        
        # 'Census Tract XXXXX, YYYYY County, ZZZZZ'
        df['Tract ID Raw'] = split_data[0].str.strip()
        df['County Raw'] = split_data[1].str.strip() if 1 in split_data.columns else None
        # State will be at index 2 if present; handle cases where it might not be explicitly there
        # We don't need 'State Raw' as per previous instruction.

        # 3) Format Tract ID (remove "Census Tract ")
        df['Tract ID'] = df['Tract ID Raw'].str.replace('Census Tract ', '', regex=False)

        # 4) Format County (remove " County") and fill any NaNs with empty string
        df['County'] = df['County Raw'].str.replace(' County', '', regex=False).fillna('')

        # Add the "Year" variable
        df['Year'] = year

        # Select only the relevant columns for the final output
        # Keep all unique Tract IDs and do not aggregate
        processed_df = df[['Tract ID', 'County', RAW_MEDIAN_VALUE_COL, 'Year']].copy()
        processed_df = processed_df.rename(columns={RAW_MEDIAN_VALUE_COL: FINAL_MEDIAN_VALUE_COL})
        
        all_years_data.append(processed_df)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    # Concatenate all processed yearly data into a single DataFrame
    final_df = pd.concat(all_years_data, ignore_index=True)

    # Define the final desired column order for the output CSV
    final_columns_order = ['Tract ID', 'County', FINAL_MEDIAN_VALUE_COL, 'Year']
    # Select and reorder columns
    final_df = final_df[final_columns_order]

    # Save the combined DataFrame to the specified output filename
    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed and combined median home value data into {output_filename}")
    print(f"Final output shape: {final_df.shape}")

# --- Main execution block ---
if __name__ == "__main__":
    print("Starting data processing for Median Home Value (keeping all unique tract IDs)...\n")
    clean_and_process_median_income_data()
