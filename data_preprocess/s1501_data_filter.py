import pandas as pd
import re
import os

def clean_and_process_educational_attainment_data(start_year=2010, end_year=2023, output_filename="edu_attain.csv"):
    """
    Cleans and processes ACS educational attainment data for Bay Area census tracts.
    Specifically calculates the count of population 25+ with a Bachelor's degree or higher.
    Aggregates by taking the mean for split tracts.
    Handles different variable names/sums across different year ranges,
    using S-code mapping for older files with duplicate descriptive headers.

    Args:
        start_year (int): The starting year for the data files (e.g., 2010).
        end_year (int): The ending year for the data files (e.g., 2023).
        output_filename (str): The name of the combined and cleaned output CSV file.
    """

    all_years_data = []

    # Standardized name for the final output column
    STANDARD_EDU_ATTAIN_NAME = "25_Plus_Bachelors_Degree_Or_Higher_Count"

    for year in range(start_year, end_year + 1):
        file_name = f"ACSST5Y{year}.S1501-Data.csv"
        print(f"Processing {file_name} for year {year}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this year.")
            continue

        # --- Read the CSV with header=1 for descriptive column names ---
        df = pd.read_csv(file_name, header=1)

        # 1) Drop "Geography" variables (if present)
        if 'Geography' in df.columns:
            df = df.drop(columns=['Geography'])

        # 2) Turn "Geographic Area Name" into Tract ID and County
        split_data = df['Geographic Area Name'].str.split(r'[,;]', expand=True)
        
        df['Tract ID Raw'] = split_data[0].str.strip()
        df['County Raw'] = split_data[1].str.strip() if 1 in split_data.columns else None

        df['Tract ID'] = df['Tract ID Raw'].str.replace('Census Tract ', '', regex=False)
        df['County'] = df['County Raw'].str.replace(' County', '', regex=False).fillna('')

        # Add the "Year" variable
        df['Year'] = year

        # Create a DataFrame to hold the parsed data for the current year
        current_year_parsed_data = pd.DataFrame()
        current_year_parsed_data['Tract ID'] = df['Tract ID']
        current_year_parsed_data['County'] = df['County']
        current_year_parsed_data['Year'] = df['Year']
        current_year_parsed_data['Base Tract ID'] = df['Tract ID'].apply(lambda x: x.split('.')[0] if isinstance(x, str) and '.' in x else x)

        # --- Dynamic Educational Attainment Calculation (Bachelor's Degree or Higher Count) ---
        bachelors_or_higher_count = None

        if 2010 <= year <= 2012:
            # For these years, we need to use S-codes to find the specific descriptive columns
            # due to potential duplicate descriptive names.
            
            # Read just the S-code row and the descriptive name row to create a mapping
            header_map_df = pd.read_csv(file_name, header=None, nrows=2)
            
            # Create a dictionary mapping S-code to descriptive name
            s_code_to_desc = {s_code: desc for s_code, desc in zip(header_map_df.iloc[0], header_map_df.iloc[1])}
            
            # Get the exact descriptive column names using the specified S-codes
            bachelor_desc_col = s_code_to_desc.get("S1501_C01_012E")
            grad_prof_desc_col = s_code_to_desc.get("S1501_C01_013E")
            
            if bachelor_desc_col and grad_prof_desc_col and \
               bachelor_desc_col in df.columns and grad_prof_desc_col in df.columns:
                
                bachelor_count = pd.to_numeric(df[bachelor_desc_col], errors='coerce').fillna(0)
                grad_prof_count = pd.to_numeric(df[grad_prof_desc_col], errors='coerce').fillna(0)
                bachelors_or_higher_count = bachelor_count + grad_prof_count
            else:
                print(f"Warning: Could not find explicit columns via S-code mapping for {year} ({bachelor_desc_col}, {grad_prof_desc_col}). Will use 0 for this year's count.")
        elif 2013 <= year <= 2016:
            bachelor_col = "Total!!Estimate!!Population 25 years and over!!Bachelor's degree"
            grad_prof_col = "Total!!Estimate!!Population 25 years and over!!Graduate or professional degree"
            
            if bachelor_col in df.columns and grad_prof_col in df.columns:
                bachelor_count = pd.to_numeric(df[bachelor_col], errors='coerce').fillna(0)
                grad_prof_count = pd.to_numeric(df[grad_prof_col], errors='coerce').fillna(0)
                bachelors_or_higher_count = bachelor_count + grad_prof_count
            else:
                print(f"Warning: Missing one or both expected columns for {year} ({bachelor_col}, {grad_prof_col}) in {file_name}. Will use 0 for this year's count.")
        elif 2017 <= year <= 2018:
            bachelor_col = "Estimate!!Total!!Population 25 years and over!!Bachelor's degree"
            grad_prof_col = "Estimate!!Total!!Population 25 years and over!!Graduate or professional degree"
            
            if bachelor_col in df.columns and grad_prof_col in df.columns:
                bachelor_count = pd.to_numeric(df[bachelor_col], errors='coerce').fillna(0)
                grad_prof_count = pd.to_numeric(df[grad_prof_col], errors='coerce').fillna(0)
                bachelors_or_higher_count = bachelor_count + grad_prof_count
            else:
                print(f"Warning: Missing one or both expected columns for {year} ({bachelor_col}, {grad_prof_col}) in {file_name}. Will use 0 for this year's count.")
        elif 2019 <= year <= 2023:
            bachelor_col = "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Bachelor's degree"
            grad_prof_col = "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Graduate or professional degree"
            
            if bachelor_col in df.columns and grad_prof_col in df.columns:
                bachelor_count = pd.to_numeric(df[bachelor_col], errors='coerce').fillna(0)
                grad_prof_count = pd.to_numeric(df[grad_prof_col], errors='coerce').fillna(0)
                bachelors_or_higher_count = bachelor_count + grad_prof_count
            else:
                print(f"Warning: Missing one or both expected columns for {year} ({bachelor_col}, {grad_prof_col}) in {file_name}. Will use 0 for this year's count.")
        
        # Assign the calculated count, filling any remaining NaNs with 0
        current_year_parsed_data[STANDARD_EDU_ATTAIN_NAME] = bachelors_or_higher_count.fillna(0) if bachelors_or_higher_count is not None else 0

        # Define the columns used for grouping (Base Tract ID, County, Year)
        group_cols = ['Base Tract ID', 'County', 'Year']
        
        # Group by Base Tract ID, County, Year, and take the mean of the bachelor's degree or higher count
        grouped_data = current_year_parsed_data.groupby(group_cols)[STANDARD_EDU_ATTAIN_NAME].mean().reset_index()

        # Rename 'Base Tract ID' back to 'Tract ID' for consistency in the final output
        grouped_data = grouped_data.rename(columns={'Base Tract ID': 'Tract ID'})
        all_years_data.append(grouped_data)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    # Concatenate all processed yearly data into a single DataFrame
    final_df = pd.concat(all_years_data, ignore_index=True)

    # Define the final desired column order for the output CSV
    final_columns_order = ['Tract ID', 'County', STANDARD_EDU_ATTAIN_NAME, 'Year']
    # Select and reorder columns
    final_df = final_df[final_columns_order]

    # Save the combined DataFrame to a new CSV file
    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed and combined data into {output_filename}")
    print(f"Final output shape: {final_df.shape}")

# --- Run the cleaning and processing function ---
if __name__ == "__main__":
    clean_and_process_educational_attainment_data()
