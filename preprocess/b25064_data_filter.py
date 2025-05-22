import pandas as pd
import re
import os

def clean_and_process_gross_rent_data(start_year=2010, end_year=2023, output_filename="bay_area_gross_rent_cleaned.csv"):
    """
    Cleans and processes ACS gross rent data for Bay Area census tracts.

    Args:
        start_year (int): The starting year for the data files (e.g., 2010).
        end_year (int): The ending year for the data files (e.g., 2023).
        output_filename (str): The name of the combined and cleaned output CSV file.
    """

    all_years_data = []

    # Common prefix for gross rent data columns
    GROSS_RENT_PREFIX = "Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!"

    # Define standardized names for the gross rent columns
    # These will be the column names in your final output CSV
    standard_gross_rent_names = [
        "GRAPI_20.0_to_24.9_percent",
        "GRAPI_25.0_to_29.9_percent",
        "GRAPI_30.0_to_34.9_percent",
        "GRAPI_35.0_percent_or_more",
        "GRAPI_Not_computed"
    ]

    # Regex patterns to map actual varied column names to standardized names
    gross_rent_patterns = {
        r".*20\.0 to 24\.9 percent$": "GRAPI_20.0_to_24.9_percent",
        r".*25\.0 to 29\.9 percent$": "GRAPI_25.0_to_29.9_percent",
        r".*30\.0 to 34\.9 percent$": "GRAPI_30.0_to_34.9_percent",
        r".*35\.0 percent or more$": "GRAPI_35.0_percent_or_more",
        r".*Not computed$": "GRAPI_Not_computed" # This one doesn't seem to have the extra segment
    }


    for year in range(start_year, end_year + 1):
        file_name = f"{year}.csv"
        print(f"Processing {file_name}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this year.")
            continue

        df = pd.read_csv(file_name)

        # Initialize a new DataFrame for the processed data of the current year
        processed_df = pd.DataFrame()

        # 1) Drop "Geography" variables
        if 'Geography' in df.columns:
            df = df.drop(columns=['Geography'])

        # 2) Turn "Geographic Area Name" into 3 csv variables: "Tract ID", "County", "State"
        split_data = df['Geographic Area Name'].str.split(r'[,;]', expand=True)

        processed_df['Tract ID Raw'] = split_data[0].str.strip()
        processed_df['County Raw'] = split_data[1].str.strip() if 1 in split_data.columns else None
        # State Raw is not used in final output, but extracted for completeness of split_data
        # processed_df['State Raw'] = split_data[2].str.strip() if 2 in split_data.columns else None

        # 4) Format Tract ID to just include the ID. "Census Tract" is redundant.
        processed_df['Tract ID'] = processed_df['Tract ID Raw'].str.replace('Census Tract ', '', regex=False)

        # 5) Do the same thing for County. "Alameda County" to "Alameda".
        # Use .fillna('') to handle cases where County Raw might be None if split_data[1] was missing
        processed_df['County'] = processed_df['County Raw'].str.replace(' County', '', regex=False).fillna('')

        # Add the "Year" variable
        processed_df['Year'] = year

        # Dynamically identify and process gross rent columns for the current file
        # and map them to standardized names
        for col_header in df.columns:
            for pattern, standardized_name in gross_rent_patterns.items():
                if re.search(pattern, col_header):
                    # Convert to numeric, coercing errors (like '(X)') to NaN, then fill NaN with 0
                    processed_df[standardized_name] = pd.to_numeric(df[col_header], errors='coerce').fillna(0)
                    break # Move to next column header once a pattern matches

        # Ensure all standard gross rent columns exist in the processed_df for this year.
        # This helps in consistent concatenation, filling with 0 if a category was entirely missing in a file.
        for standard_name in standard_gross_rent_names:
            if standard_name not in processed_df.columns:
                processed_df[standard_name] = 0 # Add as 0 if not found in this year's file

        # 6) Condense split census tracts
        processed_df['Base Tract ID'] = processed_df['Tract ID'].apply(lambda x: x.split('.')[0] if isinstance(x, str) and '.' in x else x)

        # Columns for grouping and summing
        group_cols = ['Base Tract ID', 'County', 'Year']
        sum_cols = standard_gross_rent_names # Use the standardized names for summing

        grouped_data = processed_df.groupby(group_cols)[sum_cols].sum().reset_index()
        grouped_data = grouped_data.rename(columns={'Base Tract ID': 'Tract ID'})

        all_years_data.append(grouped_data)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    # Concatenate all processed yearly data into a single DataFrame
    final_df = pd.concat(all_years_data, ignore_index=True)

    # Reorder columns: Tract ID, County, then all standardized gross rent columns, then Year
    final_columns_order = ['Tract ID', 'County'] + standard_gross_rent_names + ['Year']
    final_df = final_df[final_columns_order]

    # Save the combined DataFrame to a new CSV file
    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed and combined data into {output_filename}")
    print(f"Final output shape: {final_df.shape}")

# --- Dummy File Generation (for testing the script) ---
# This part now generates files with varying column headers to simulate the user's issue.
# If you already have your actual 2010.csv to 2023.csv files, you can remove or comment out this section.
for year in range(2010, 2024):
    file_name = f"{year}.csv"
    if not os.path.exists(file_name):
        with open(file_name, 'w') as f:
            if year <= 2012: # Older format
                f.write("Geographic Area Name,Geography,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!20.0 to 24.9 percent,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!25.0 to 29.9 percent,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!30.0 to 34.9 percent,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!35.0 percent or more,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!Not computed\n")
            else: # Newer format from 2013 onwards
                f.write("Geographic Area Name,Geography,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!Occupied units paying rent (excluding units where GRAPI cannot be computed)!!20.0 to 24.9 percent,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!Occupied units paying rent (excluding units where GRAPI cannot be computed)!!25.0 to 29.9 percent,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!Occupied units paying rent (excluding units where GRAPI cannot be computed)!!30.0 to 34.9 percent,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!Occupied units paying rent (excluding units where GRAPI cannot be computed)!!35.0 percent or more,Estimate!!GROSS RENT AS A PERCENTAGE OF HOUSEHOLD INCOME (GRAPI)!!Not computed\n")

            # Sample data. Adjust values to vary slightly by year for distinctness.
            f.write(f"\"Census Tract 4001, Alameda County, California\",1400000US06001400100,{9+year-2010},{0+year-2010},{17+year-2010},{59+year-2010},{14+year-2010}\n")
            f.write(f"\"Census Tract 4002, Alameda County, California\",1400000US06001400200,{37+year-2010},{61+year-2010},{64+year-2010},{89+year-2010},{0+year-2010}\n")
            f.write(f"\"Census Tract 4003, Alameda County, California\",1400000US06001400300,{212+year-2010},{228+year-2010},{146+year-2010},{457+year-2010},{0+year-2010}\n")
            f.write(f"\"Census Tract 1542.01; Sonoma County; California\",1400000US06097154201,{57+year-2010},{43+year-2010},{675+year-2010},{222+year-2010},{475+year-2010}\n")
            f.write(f"\"Census Tract 1542.02; Sonoma County; California\",1400000US06097154202,{167+year-2010},{121+year-2010},{1355+year-2010},{571+year-2010},{1033+year-2010}\n")
            f.write(f"\"Census Tract 1543.04; Sonoma County; California\",1400000US06097154304,{0+year-2010},{7+year-2010},{288+year-2010},{75+year-2010},{339+year-2010}\n")

# --- Run the cleaning and processing function ---
if __name__ == "__main__":
    clean_and_process_gross_rent_data()
