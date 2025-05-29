import pandas as pd
import re
import os

def clean_and_process_acs_data(start_year=2010, end_year=2023, output_filename="bay_area_educational_attainment_cleaned.csv"):
    """
    Cleans and processes ACS educational attainment data for Bay Area census tracts.

    Args:
        start_year (int): The starting year for the data files (e.g., 2010).
        end_year (int): The ending year for the data files (e.g., 2023).
        output_filename (str): The name of the combined and cleaned output CSV file.
    """

    all_years_data = []

    # Define the columns that contain educational attainment estimates to be summed
    # These are the 8 columns identified previously.
    educational_attainment_cols = [
        "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 18 to 24 years!!Less than high school graduate",
        "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 18 to 24 years!!High school graduate (includes equivalency)",
        "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Some college, no degree",
        "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Associate's degree",
        "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Bachelor's degree",
        "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Graduate or professional degree",
        "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!High school graduate or higher",
        "Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Bachelor's degree or higher"
    ]

    for year in range(start_year, end_year + 1):
        file_name = f"{year}.csv"
        print(f"Processing {file_name}...")

        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this year.")
            continue

        df = pd.read_csv(file_name)

        # 1) Drop "Geography" variables
        if 'Geography' in df.columns:
            df = df.drop(columns=['Geography'])

        # 2) Turn "Geographic Area Name" into 3 csv variables: "Tract ID", "County", "State"
        # Split by comma or semicolon, then clean up spaces.
        df[['Tract ID Raw', 'County Raw', 'State Raw']] = df['Geographic Area Name'].str.split(r'[,;]', expand=True)

        # Clean up leading/trailing spaces
        df['Tract ID Raw'] = df['Tract ID Raw'].str.strip()
        df['County Raw'] = df['County Raw'].str.strip()
        df['State Raw'] = df['State Raw'].str.strip()

        # 3) Drop state.
        # No explicit drop needed if we don't include it in the final selection
        # but for clarity, we can drop the temporary 'State Raw' column if desired.

        # 4) Format Tract ID to just include the ID. "Census Tract" is redundant.
        df['Tract ID'] = df['Tract ID Raw'].str.replace('Census Tract ', '', regex=False)

        # 5) Do the same thing for County. "Alameda County" to "Alameda".
        df['County'] = df['County Raw'].str.replace(' County', '', regex=False)

        # Drop the original 'Geographic Area Name' and raw split columns
        df = df.drop(columns=['Geographic Area Name', 'Tract ID Raw', 'County Raw', 'State Raw'])

        # Add the "Year" variable
        df['Year'] = year

        # Convert educational attainment columns to numeric, coercing errors (like '(X)') to NaN, then fill NaN with 0
        for col in educational_attainment_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

        # 6) Condense split census tracts
        # Create a base tract ID for grouping (e.g., '1542' from '1542.01')
        df['Base Tract ID'] = df['Tract ID'].apply(lambda x: x.split('.')[0] if '.' in x else x)

        # Group by Base Tract ID, County, and Year, and sum the educational attainment columns
        # For 'Tract ID' itself, we take the base ID for the grouped row
        grouped_data = df.groupby(['Base Tract ID', 'County', 'Year'])[educational_attainment_cols].sum().reset_index()

        # Rename 'Base Tract ID' back to 'Tract ID' for the final output
        grouped_data = grouped_data.rename(columns={'Base Tract ID': 'Tract ID'})

        all_years_data.append(grouped_data)

    if not all_years_data:
        print("No data processed. Exiting.")
        return

    # Concatenate all processed yearly data into a single DataFrame
    final_df = pd.concat(all_years_data, ignore_index=True)

    # Reorder columns to match the desired output: Tract ID, County, then the 8 educational columns, then Year
    final_columns = ['Tract ID', 'County'] + educational_attainment_cols + ['Year']
    final_df = final_df[final_columns]

    # Save the combined DataFrame to a new CSV file
    final_df.to_csv(output_filename, index=False)
    print(f"\nSuccessfully processed and combined data into {output_filename}")
    print(f"Final output shape: {final_df.shape}")

# Example usage:
# To run this script, save it as a .py file (e.g., clean_acs_data.py)
# Make sure your CSV files (e.g., 2010.csv, 2011.csv, ...) are in the same directory as the script.
# Then execute it from your terminal: python clean_acs_data.py

# Create dummy CSV files for demonstration purposes if they don't exist
# In a real scenario, you would have your actual 2010.csv to 2023.csv files.
for year in range(2010, 2024):
    file_name = f"{year}.csv"
    if not os.path.exists(file_name):
        with open(file_name, 'w') as f:
            f.write("Geography,Geographic Area Name,Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 18 to 24 years!!Less than high school graduate,Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 18 to 24 years!!High school graduate (includes equivalency),\"Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Some college, no degree\",Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Associate's degree,Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Bachelor's degree,Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Graduate or professional degree,Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!High school graduate or higher,Estimate!!Total!!AGE BY EDUCATIONAL ATTAINMENT!!Population 25 years and over!!Bachelor's degree or higher\n")
            f.write(f"1400000US06001400100,\"Census Tract 4001, Alameda County, California\",{79+year-2010},{0+year-2010},230,138,756,1173,(X),61.2\n")
            f.write(f"1400000US06001400200,\"Census Tract 4002, Alameda County, California\",{5+year-2010},{15+year-2010},157,31,615,721,(X),58.4\n")
            f.write(f"1400000US06001400300,\"Census Tract 4003, Alameda County, California\",{0+year-2010},{36+year-2010},420,242,1507,1477,(X),66.1\n")
            f.write(f"1400000US06097154201,\"Census Tract 1542.01; Sonoma County; California\",{57+year-2010},{43+year-2010},675,222,475,222,2170,697\n")
            f.write(f"1400000US06097154202,\"Census Tract 1542.02; Sonoma County; California\",{167+year-2010},{121+year-2010},1355,571,1033,514,4157,1547\n")
            f.write(f"1400000US06097154304,\"Census Tract 1543.04; Sonoma County; California\",{0+year-2010},{7+year-2010},288,75,339,258,1312,597\n")
            f.write(f"1400000US06097154305,\"Census Tract 1543.05; Sonoma County; California\",{0+year-2010},{53+year-2010},287,86,450,280,1405,730\n")


# Run the cleaning and processing function
if __name__ == "__main__":
    clean_and_process_acs_data()
