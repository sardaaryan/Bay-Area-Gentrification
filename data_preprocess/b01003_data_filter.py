import pandas as pd
import glob
import os

def process_census_data(input_dir=".", output_file="total_pop.csv"):
    """
    Processes ACS data files for Bay Area counties, performs data cleaning and aggregation,
    handling a column swap in the 2010 file.

    Args:
        input_dir (str, optional): Directory containing the input CSV files. Defaults to ".".
        output_file (str, optional): Name of the output CSV file. Defaults to "bay_area_population.csv".
    """
    all_data = []
    file_pattern = os.path.join(input_dir, "ACSDT5Y*.B01003-Data.csv")
    all_files = glob.glob(file_pattern)

    for file in all_files:
        year = file.split("Y")[1][:4]
        df = pd.read_csv(file, skiprows=[0])

        if year == '2010':
            # Handle the swapped columns for 2010
            df = df.iloc[:, [1, 3, 2]]
            df.columns = ["Geographic Area Name", "Estimate!!Total", "Margin of Error!!Total"]
        else:
            # Standard column order for other years
            df = df.iloc[:, [1, 2, 3]]
            df.columns = ["Geographic Area Name", "Estimate!!Total", "Margin of Error!!Total"]

        # Split "Geographic Area Name"
        df[['Tract Info', 'County', 'State']] = df['Geographic Area Name'].str.split(r',|;', expand=True)

        # Extract Tract ID and clean County name
        df['Tract ID'] = df['Tract Info'].str.replace("Census Tract ", "").str.strip()
        df['County'] = df['County'].str.replace(" County", "").str.strip()

        # Add Year column
        df['Year'] = year

        # Select and reorder columns
        df_processed = df[['Tract ID', 'County', 'Estimate!!Total', 'Year']]

        all_data.append(df_processed)

    # Concatenate all yearly data
    combined_df = pd.concat(all_data, ignore_index=True)

    # Save to a single CSV file
    combined_df.to_csv(output_file, index=False)

if __name__ == "__main__":
    process_census_data()
    print(f"Processed data saved to total_pop.csv, handling 2010 column swap.")
