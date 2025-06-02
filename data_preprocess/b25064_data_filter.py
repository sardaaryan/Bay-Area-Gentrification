import pandas as pd
import re
import os

def clean_and_process_gross_rent_data(start_year=2010, end_year=2023, output_filename="gross_rent.csv"):
    """
    Cleans and processes ACS median gross rent data for Bay Area census tracts.
    Aggregates by taking the mean of median gross rents for split tracts.

    Args:
        start_year (int): The starting year for the data files (e.g., 2010).
        end_year (int): The ending year for the data files (e.g., 2023).
        output_filename (str): The name of the combined and cleaned output CSV file.
    """

    all_years_data = []

    # The exact column name for the median gross rent
    GROSS_RENT_COL = "Estimate!!Median gross rent"
    # Standardized name for the gross rent column in the final output
    STANDARD_GROSS_RENT_NAME = "Median_Gross_Rent"

    for year in range(start_year, end_year + 1):
        # CORRECTED File name construction for gross rent data (B25064 table)
        file_name = f"ACSDT5Y{year}.B25064-Data.csv"
        print(f"Processing {file_name}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this year.")
            continue

        # Read the CSV, using the second row as the header
        # The first row will be effectively dropped.
        df = pd.read_csv(file_name, header=1)

        # 1) Drop "Geography" variables (if present)
        if 'Geography' in df.columns:
            df = df.drop(columns=['Geography'])

        # 2) Turn "Geographic Area Name" into Tract ID and County
        # Handles both comma and semicolon delimiters
        split_data = df['Geographic Area Name'].str.split(r'[,;]', expand=True)
        
        # Extract raw Tract ID and County
        df['Tract ID Raw'] = split_data[0].str.strip()
        df['County Raw'] = split_data[1].str.strip() if 1 in split_data.columns else None

        # Format Tract ID (remove "Census Tract ")
        df['Tract ID'] = df['Tract ID Raw'].str.replace('Census Tract ', '', regex=False)

        # Format County (remove " County") and fill any NaNs with empty string
        df['County'] = df['County Raw'].str.replace(' County', '', regex=False).fillna('')

        # Add the "Year" variable
        df['Year'] = year

        # Create a DataFrame to hold the parsed data for the current year
        current_year_parsed_data = pd.DataFrame()
        current_year_parsed_data['Tract ID'] = df['Tract ID']
        current_year_parsed_data['County'] = df['County']
        current_year_parsed_data['Year'] = df['Year']
        # Create 'Base Tract ID' for aggregation, handling split tracts (e.g., 123.01 -> 123)
        current_year_parsed_data['Base Tract ID'] = df['Tract ID'].apply(lambda x: x.split('.')[0] if isinstance(x, str) and '.' in x else x)

        # Extract and convert median gross rent to numeric
        # Handle "2,000+" and "***" values. Coerce errors to NaN, then fill NaN with 0.
        if GROSS_RENT_COL in df.columns:
            # Replace non-numeric parts and convert to numeric
            temp_gross_rent = df[GROSS_RENT_COL].astype(str).str.replace('+', '', regex=False).str.replace(',', '', regex=False)
            current_year_parsed_data[STANDARD_GROSS_RENT_NAME] = pd.to_numeric(temp_gross_rent, errors='coerce').fillna(0)
        else:
            print(f"Warning: '{GROSS_RENT_COL}' not found in {file_name}. Setting median gross rent to 0 for this year.")
            current_year_parsed_data[STANDARD_GROSS_RENT_NAME] = 0

        # Define the columns used for grouping (Base Tract ID, County, Year)
        group_cols = ['Base Tract ID', 'County', 'Year']
        
        # Group by Base Tract ID, County, Year, and take the mean of the median gross rent
        grouped_data = current_year_parsed_data.groupby(group_cols)[STANDARD_GROSS_RENT_NAME].mean().reset_index()

        # Rename 'Base Tract ID' back to 'Tract ID' for consistency in the final output
        grouped_data = grouped_data.rename(columns={'Base Tract ID': 'Tract ID'})
        all_years_data.append(grouped_data)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    # Concatenate all processed yearly data into a single DataFrame
    final_df = pd.concat(all_years_data, ignore_index=True)

    # Define the final desired column order for the output CSV
    final_columns_order = ['Tract ID', 'County', STANDARD_GROSS_RENT_NAME, 'Year']
    # Select and reorder columns
    final_df = final_df[final_columns_order]

    # Save the combined DataFrame to a new CSV file
    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed and combined data into {output_filename}")
    print(f"Final output shape: {final_df.shape}")

# --- Run the cleaning and processing function ---
if __name__ == "__main__":
    clean_and_process_gross_rent_data()
