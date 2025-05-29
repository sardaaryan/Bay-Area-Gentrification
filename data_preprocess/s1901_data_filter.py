import pandas as pd
import re
import os

def clean_and_process_household_income_data(start_year=2010, end_year=2023, output_filename="bay_area_household_income_cleaned.csv"):
    """
    Cleans and processes ACS household income data for Bay Area census tracts.
    Adapts aggregation based on the presence of a 'Total Households' column:
    - Uses weighted average if 'Households!!Estimate!!Total' is present.
    - Uses simple average of percentages if 'Households!!Estimate!!Total' is absent or zero.

    Args:
        start_year (int): The starting year for the data files (e.g., 2010).
        end_year (int): The ending year for the data files (e.g., 2023).
        output_filename (str): The name of the combined and cleaned output CSV file.
    """

    all_years_data = []

    # The exact column name for the total household count, when present
    TOTAL_HOUSEHOLDS_COUNT_COL = "Households!!Estimate!!Total"

    # Define standardized names for the income percentage columns in the final output
    standard_income_names = [
        "Income_Less_than_10K_Percent",
        "Income_10K_to_14999_Percent",
        "Income_15K_to_24999_Percent",
        "Income_25K_to_34999_Percent",
        "Income_35K_to_49999_Percent",
        "Income_50K_to_74999_Percent",
        "Income_75K_to_99999_Percent",
        "Income_100K_to_149999_Percent",
        "Income_150K_to_199999_Percent",
        "Income_200K_or_more_Percent"
    ]

    # Regex patterns to match the *end* part of the various income bracket column names.
    # This makes it robust to varying prefixes like "Households!!Estimate!!" or "Estimate!!Households!!Total!!"
    income_bracket_patterns = {
        r"Less than \$10,000$": "Income_Less_than_10K_Percent",
        r"\$10,000 to \$14,999$": "Income_10K_to_14999_Percent",
        r"\$15,000 to \$24,999$": "Income_15K_to_24999_Percent",
        r"\$25,000 to \$34,999$": "Income_25K_to_34999_Percent",
        r"\$35,000 to \$49,999$": "Income_35K_to_49999_Percent",
        r"\$50,000 to \$74,999$": "Income_50K_to_74999_Percent",
        r"\$75,000 to \$99,999$": "Income_75K_to_99999_Percent",
        r"\$100,000 to \$149,999$": "Income_100K_to_149999_Percent",
        r"\$150,000 to \$199,999$": "Income_150K_to_199999_Percent",
        r"\$200,000 or more$": "Income_200K_or_more_Percent"
    }

    # Placeholder for estimated count column names for aggregation
    # These are temporary columns used during weighted average calculation
    temp_count_cols = [name.replace('_Percent', '_Count') for name in standard_income_names]


    for year in range(start_year, end_year + 1):
        file_name = f"{year}.csv"
        print(f"Processing {file_name}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this year.")
            continue

        df = pd.read_csv(file_name)

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

        # --- Dynamic Column Identification and Data Preparation ---
        # Create a DataFrame to hold the parsed percentage data for the current year
        current_year_parsed_data = pd.DataFrame()
        current_year_parsed_data['Tract ID'] = df['Tract ID']
        current_year_parsed_data['County'] = df['County']
        current_year_parsed_data['Year'] = df['Year']
        # Create 'Base Tract ID' for aggregation, handling split tracts (e.g., 123.01 -> 123)
        current_year_parsed_data['Base Tract ID'] = df['Tract ID'].apply(lambda x: x.split('.')[0] if isinstance(x, str) and '.' in x else x)

        # Identify and convert relevant income percentage columns to numeric
        # Iterate through all columns in the original DataFrame
        for col_header in df.columns:
            # For each column, check if it matches any of our defined income bracket patterns
            for pattern_str, standardized_name in income_bracket_patterns.items():
                if re.search(pattern_str, col_header):
                    # Found an income bracket column!
                    # Convert its data to numeric, coercing errors (non-numeric values) to NaN, then fill NaN with 0
                    current_year_parsed_data[standardized_name] = pd.to_numeric(df[col_header], errors='coerce').fillna(0)
                    break # Stop checking patterns for this column header once a match is found

        # Ensure all standard income columns are present in the parsed data for this year.
        # If any are missing (e.g., not present in the original CSV for this year), add them with a value of 0.
        for standard_name in standard_income_names:
            if standard_name not in current_year_parsed_data.columns:
                current_year_parsed_data[standard_name] = 0

        # --- Determine Aggregation Strategy based on 'Total Households' column presence ---
        use_weighted_average = False
        total_households_data = None # Will store the Total Households data if found

        # Check if the specific TOTAL_HOUSEHOLDS_COUNT_COL exists in the original DataFrame
        if TOTAL_HOUSEHOLDS_COUNT_COL in df.columns:
            # Convert to numeric, handle errors by coercing to NaN, then fill NaN with 0
            df[TOTAL_HOUSEHOLDS_COUNT_COL] = pd.to_numeric(df[TOTAL_HOUSEHOLDS_COUNT_COL], errors='coerce').fillna(0)
            
            # Check if there's actual non-zero total household data to use for weighting
            if df[TOTAL_HOUSEHOLDS_COUNT_COL].sum() > 0:
                use_weighted_average = True
                total_households_data = df[TOTAL_HOUSEHOLDS_COUNT_COL] # Keep this series for calculation
                print(f"  Using weighted average for {file_name} ('{TOTAL_HOUSEHOLDS_COUNT_COL}' found and has data).")
            else:
                print(f"  Warning: '{TOTAL_HOUSEHOLDS_COUNT_COL}' found but all values are zero for {file_name}. Reverting to simple average.")
        
        if not use_weighted_average:
            print(f"  Using simple average for {file_name} ('{TOTAL_HOUSEHOLDS_COUNT_COL}' not found or no valid data).")

        # Define the columns used for grouping (Tract ID, County, Year)
        group_cols = ['Base Tract ID', 'County', 'Year']
        
        if use_weighted_average:
            # --- Perform Weighted Average Aggregation ---
            # Calculate estimated counts for each income bracket based on total households
            for standard_name in standard_income_names:
                count_col = standard_name.replace('_Percent', '_Count')
                # Estimated Count = (Percentage / 100) * Total Households
                current_year_parsed_data[count_col] = (current_year_parsed_data[standard_name] / 100) * total_households_data
                # Ensure count column is numeric and fill any NaNs (e.g., from division by zero or missing totals) with 0
                current_year_parsed_data[count_col] = pd.to_numeric(current_year_parsed_data[count_col], errors='coerce').fillna(0)
            
            # Identify all columns to sum during the groupby operation (all temporary count columns and the original total households count)
            sum_cols = temp_count_cols + [TOTAL_HOUSEHOLDS_COUNT_COL]
            
            # Group by Base Tract ID, County, Year, and sum the counts and total households
            grouped_data = current_year_parsed_data.groupby(group_cols)[sum_cols].sum().reset_index()

            # Recalculate final percentages based on the summed counts and aggregated total households
            for standard_name in standard_income_names:
                count_col = standard_name.replace('_Percent', '_Count')
                # Percentage = (Aggregated Count / Aggregated Total Households) * 100
                # Handle division by zero: if Aggregated Total Households is 0, the percentage should also be 0.
                grouped_data[standard_name] = (
                    grouped_data[count_col] / grouped_data[TOTAL_HOUSEHOLDS_COUNT_COL] * 100
                ).fillna(0) # fillna(0) will convert NaNs (e.g., from 0/0) to 0

            # Drop the temporary count columns and the Total Households count column from the final grouped data
            # We only want the final recalculated percentages.
            grouped_data = grouped_data.drop(columns=temp_count_cols + [TOTAL_HOUSEHOLDS_COUNT_COL])

        else: 
            # --- Perform Simple Average Aggregation (when Total Households not available or zero) ---
            # Group by Base Tract ID, County, Year, and take the mean of the percentage columns directly
            grouped_data = current_year_parsed_data.groupby(group_cols)[standard_income_names].mean().reset_index()

        # Rename 'Base Tract ID' back to 'Tract ID' for consistency in the final output
        grouped_data = grouped_data.rename(columns={'Base Tract ID': 'Tract ID'})
        all_years_data.append(grouped_data)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    # Concatenate all processed yearly data into a single DataFrame
    final_df = pd.concat(all_years_data, ignore_index=True)

    # Define the final desired column order for the output CSV
    final_columns_order = ['Tract ID', 'County'] + standard_income_names + ['Year']
    # Select and reorder columns
    final_df = final_df[final_columns_order]

    # Save the combined DataFrame to a new CSV file
    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed and combined data into {output_filename}")
    print(f"Final output shape: {final_df.shape}")


# --- Run the cleaning and processing function ---
if __name__ == "__main__":
    clean_and_process_household_income_data()
