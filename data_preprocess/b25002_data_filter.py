import pandas as pd
import re
import os

def clean_and_process_occupancy_status_data(start_year=2010, end_year=2023, output_filename="bay_area_occupancy_cleaned.csv"):
    """
    Cleans and processes ACS occupancy status data for Bay Area census tracts.
    Handles multiple yearly CSV files with varying column headers, cleans specific columns,
    extracts Tract ID/County, drops unnecessary columns (including flexible Margin of Error columns),
    and aggregates data for split census tracts by summing counts.

    Args:
        start_year (int): The starting year for the data files (e.g., 2010).
        end_year (int): The ending year for the data files (e.g., 2023).
        output_filename (str): The name of the combined and cleaned output CSV file.
    """

    all_years_data = []

    # Define regex patterns for the 'Estimate' columns we want to keep and their new standardized names.
    # The ':?' makes the colon optional, matching both "Total" and "Total:".
    COLUMNS_TO_KEEP_PATTERNS = {
        r"Estimate!!Total:?$" : "Total Housing Units",
        r"Estimate!!Total:?!!Occupied$" : "Occupied Units",
        r"Estimate!!Total:?!!Vacant$" : "Vacant Units"
    }

    # Define regex patterns for the 'Margin of Error' columns to be dropped.
    # The ':?' makes the colon optional.
    MARGIN_OF_ERROR_PATTERNS = [
        r"Margin of Error!!Total:?$",
        r"Margin of Error!!Total:?!!Occupied$",
        r"Margin of Error!!Total:?!!Vacant$"
    ]

    for year in range(start_year, end_year + 1):
        # Construct the specific file name for occupancy data
        file_name = f"ACSDT5Y{year}.B25002-Data.csv" # Changed from -Filtered to -Data based on your prompt
        print(f"Processing {file_name} for year {year}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this year.")
            continue

        # Read the CSV, skipping the first row (header with GEO_ID etc.)
        # The actual column names are in the second row (index 1)
        df = pd.read_csv(file_name, header=1)

        # 1) Drop "Geography" column (if present)
        if 'Geography' in df.columns:
            df = df.drop(columns=['Geography'])
        
        # 2) Drop "Margin of Error" variables using flexible pattern matching
        cols_to_drop_moe = []
        for col_header in df.columns:
            for pattern in MARGIN_OF_ERROR_PATTERNS:
                if re.search(pattern, col_header):
                    cols_to_drop_moe.append(col_header)
                    break # Stop checking patterns for this column header once a match is found
        
        if cols_to_drop_moe:
            df = df.drop(columns=cols_to_drop_moe)
        else:
            print(f"  No Margin of Error columns found to drop in {file_name}.")


        # 3) Identify and rename the 'Estimate' columns dynamically
        # This will store the actual current column name mapped to its desired new name
        current_rename_map = {}
        for col_header in df.columns:
            for pattern, new_name in COLUMNS_TO_KEEP_PATTERNS.items():
                if re.search(pattern, col_header):
                    current_rename_map[col_header] = new_name
                    break # Stop checking patterns for this column header once a match is found
        
        # Rename columns
        df = df.rename(columns=current_rename_map)

        # Ensure the renamed columns are numeric, coercing errors to NaN, then fill with 0
        # This list defines the standardized names we expect after renaming
        standardized_count_columns = list(COLUMNS_TO_KEEP_PATTERNS.values())
        for col_name in standardized_count_columns:
            if col_name in df.columns:
                df[col_name] = pd.to_numeric(df[col_name], errors='coerce').fillna(0)
            else:
                # This should ideally not happen if patterns are correct and data exists
                print(f"  Warning: Expected column '{col_name}' not found in {file_name} after dynamic renaming.")
                df[col_name] = 0 # Add it as zeros if it's missing (e.g., due to an unexpected file format)

        # 4) Turn "Geographic Area Name" into "Tract ID", "County", "State"
        # Handles both comma and semicolon delimiters
        split_data = df['Geographic Area Name'].str.split(r'[,;]', expand=True)
        
        df['Tract ID Raw'] = split_data[0].str.strip()
        df['County Raw'] = split_data[1].str.strip()
        # State will be at index 2 if present; handle cases where it might not be explicitly there (though census data usually has it)
        df['State Raw'] = split_data[2].str.strip() if 2 in split_data.columns else None

        # 5) Drop state - as per requirement, it's redundant for Bay Area data
        if 'State Raw' in df.columns:
            df = df.drop(columns=['State Raw'])

        # 6) Format Tract ID (remove "Census Tract ")
        df['Tract ID'] = df['Tract ID Raw'].str.replace('Census Tract ', '', regex=False)

        # 7) Format County (remove " County") and fill any NaNs with empty string
        df['County'] = df['County Raw'].str.replace(' County', '', regex=False).fillna('')

        # Add the "Year" variable
        df['Year'] = year

        # Create 'Base Tract ID' for aggregation, handling split tracts (e.g., 123.01 -> 123)
        df['Base Tract ID'] = df['Tract ID'].apply(lambda x: x.split('.')[0] if isinstance(x, str) and '.' in x else x)

        # Define the columns that we will sum for aggregation (these are the standardized names)
        columns_to_sum = standardized_count_columns

        # Define the columns for grouping (Base Tract ID, County, Year)
        group_cols = ['Base Tract ID', 'County', 'Year']

        # Perform simple sum aggregation for the count columns
        grouped_data = df.groupby(group_cols)[columns_to_sum].sum().reset_index()

        # Rename 'Base Tract ID' back to 'Tract ID' for consistency in the final output
        grouped_data = grouped_data.rename(columns={'Base Tract ID': 'Tract ID'})
        all_years_data.append(grouped_data)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    # Concatenate all processed yearly data into a single DataFrame
    final_df = pd.concat(all_years_data, ignore_index=True)

    # Define the final desired column order for the output CSV
    final_columns_order = ['Tract ID', 'County'] + standardized_count_columns + ['Year']
    # Select and reorder columns
    final_df = final_df[final_columns_order]

    # Save the combined DataFrame to a new CSV file
    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed and combined data into {output_filename}")
    print(f"Final output shape: {final_df.shape}")

# --- Main execution block ---
if __name__ == "__main__":
    print("Starting data processing for Occupancy Status data, handling column name variations...\n")
    clean_and_process_occupancy_status_data()
