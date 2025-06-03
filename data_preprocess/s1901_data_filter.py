import pandas as pd
import re
import os

def clean_and_process_household_income_data(start_year=2010, end_year=2023, output_filename="house_income.csv"):
    """
    Cleans and processes ACS household median income data for Bay Area census tracts.
    Aggregates by taking the mean of median incomes for split tracts.
    Handles different median income column names for different year ranges.

    Args:
        start_year (int): The starting year for the data files (e.g., 2010).
        end_year (int): The ending year for the data files (e.g., 2023).
        output_filename (str): The name of the combined and cleaned output CSV file.
    """

    all_years_data = []

    # Standardized name for the median income column in the final output
    STANDARD_MEDIAN_INCOME_NAME = "Median_Household_Income"

    for year in range(start_year, end_year + 1):
        # File name construction to match the ACSST5YXXXX.S1901-Data.csv pattern
        file_name = f"ACSST5Y{year}.S1901-Data.csv"
        print(f"Processing {file_name}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this year.")
            continue

        # Read the CSV, using the second row as the header
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

        # --- Dynamic Median Income Column Identification ---
        median_income_col_found = None
        if "Estimate!!Households!!Median income (dollars)" in df.columns:
            median_income_col_found = "Estimate!!Households!!Median income (dollars)"
        elif "Households!!Estimate!!Median income (dollars)" in df.columns:
            median_income_col_found = "Households!!Estimate!!Median income (dollars)"

        if median_income_col_found:
            current_year_parsed_data[STANDARD_MEDIAN_INCOME_NAME] = pd.to_numeric(df[median_income_col_found], errors='coerce').fillna(0)
        else:
            print(f"Warning: Neither expected median income column found in {file_name}. Setting median income to 0 for this year.")
            current_year_parsed_data[STANDARD_MEDIAN_INCOME_NAME] = 0

        # Define the columns used for grouping (Base Tract ID, County, Year)
        group_cols = ['Tract ID', 'County', 'Year']
        
        # Group by Base Tract ID, County, Year, and take the mean of the median income
        grouped_data = current_year_parsed_data.groupby(group_cols)[STANDARD_MEDIAN_INCOME_NAME].mean().reset_index()

        # add grouped data as a new row to all years
        all_years_data.append(grouped_data)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    # Concatenate all processed yearly data into a single DataFrame
    final_df = pd.concat(all_years_data, ignore_index=True)

    # Define the final desired column order for the output CSV
    final_columns_order = ['Tract ID', 'County', STANDARD_MEDIAN_INCOME_NAME, 'Year']
    # Select and reorder columns
    final_df = final_df[final_columns_order]

    # Save the combined DataFrame to a new CSV file
    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed and combined data into {output_filename}")
    print(f"Final output shape: {final_df.shape}")

# --- Run the cleaning and processing function ---
if __name__ == "__main__":
    clean_and_process_household_income_data()
