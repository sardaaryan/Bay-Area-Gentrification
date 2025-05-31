import pandas as pd
import re
import os

def clean_and_process_median_income_data(start_year=2010, end_year=2023, output_filename="home_value.csv"):
    """
    Cleans and processes ACS median household income data for Bay Area census tracts.
    Handles multiple yearly CSV files, cleans Geographic Area Name, adds Year,
    and aggregates data for split census tracts by taking the AVERAGE of the Median Value.

    Args:
        start_year (int): The starting year for the data files (e.g., 2010).
        end_year (int): The ending year for the data files (e.g., 2023).
        output_filename (str): The name of the combined and cleaned output CSV file.
                               Defaults to "house_value.csv".
    """

    all_years_data = []

    # The column containing the median value
    MEDIAN_VALUE_COL = "Median Value"

    for year in range(start_year, end_year + 1):
        # Construct the specific file name for median income data
        # Assuming format is 2010.csv, 2011.csv etc.
        file_name = f"{year}.csv"
        print(f"Processing {file_name} for year {year}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this year.")
            continue

        # Read the CSV. The header is the first row.
        df = pd.read_csv(file_name)

        # 1) Drop "Geography" variables (if present)
        if 'Geography' in df.columns:
            df = df.drop(columns=['Geography'])
        
        # Ensure the 'Median Value' column is numeric, fill non-numeric with 0
        if MEDIAN_VALUE_COL in df.columns:
            df[MEDIAN_VALUE_COL] = pd.to_numeric(df[MEDIAN_VALUE_COL], errors='coerce').fillna(0)
        else:
            print(f"  Error: '{MEDIAN_VALUE_COL}' column not found in {file_name}. Skipping this file.")
            continue # Skip to the next file if the critical column is missing

        # 2) Turn "Geographic Area Name" into "Tract ID", "County", "State"
        # Handles both comma and semicolon delimiters
        split_data = df['Geographic Area Name'].str.split(r'[,;]', expand=True)
        
        df['Tract ID Raw'] = split_data[0].str.strip()
        df['County Raw'] = split_data[1].str.strip()
        # State will be at index 2 if present; handle cases where it might not be explicitly there
        df['State Raw'] = split_data[2].str.strip() if 2 in split_data.columns else None

        # 3) Drop state - it's redundant for Bay Area data
        if 'State Raw' in df.columns:
            df = df.drop(columns=['State Raw'])

        # 4) Format Tract ID (remove "Census Tract ")
        df['Tract ID'] = df['Tract ID Raw'].str.replace('Census Tract ', '', regex=False)

        # 5) Format County (remove " County") and fill any NaNs with empty string
        df['County'] = df['County Raw'].str.replace(' County', '', regex=False).fillna('')

        # Add the "Year" variable
        df['Year'] = year

        # Create 'Base Tract ID' for aggregation, handling split tracts (e.g., 123.01 -> 123)
        df['Base Tract ID'] = df['Tract ID'].apply(lambda x: x.split('.')[0] if isinstance(x, str) and '.' in x else x)

        # Define the columns for grouping (Base Tract ID, County, Year)
        group_cols = ['Base Tract ID', 'County', 'Year']

        # Perform aggregation for the Median Value: take the average
        # This will calculate the average of the Median Value for all sub-tracts
        # belonging to the same Base Tract ID.
        grouped_data = df.groupby(group_cols)[MEDIAN_VALUE_COL].mean().reset_index()

        # Rename 'Base Tract ID' back to 'Tract ID' for consistency in the final output
        grouped_data = grouped_data.rename(columns={'Base Tract ID': 'Tract ID'})
        all_years_data.append(grouped_data)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    # Concatenate all processed yearly data into a single DataFrame
    final_df = pd.concat(all_years_data, ignore_index=True)

    # Define the final desired column order for the output CSV
    final_columns_order = ['Tract ID', 'County', MEDIAN_VALUE_COL, 'Year']
    # Select and reorder columns
    final_df = final_df[final_columns_order]

    # Save the combined DataFrame to the specified output filename
    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed and combined median income data into {output_filename}")
    print(f"Final output shape: {final_df.shape}")

# --- Main execution block ---
if __name__ == "__main__":
    print("Starting data processing for Median Household Income (using average for split tracts)...\n")
    clean_and_process_median_income_data()
