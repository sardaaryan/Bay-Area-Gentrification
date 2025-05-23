import pandas as pd
import os

def combine_bay_area_data(output_filename="data.csv"):
    """
    Combines pre-processed Bay Area census data files into a single CSV.
    Adds a 'Source_Attribute' column to identify the origin of each row's data.

    Args:
        output_filename (str): The name of the combined output CSV file.
                               Defaults to "data.csv".
    """

    # List of CSV files to combine
    input_files = [
        "edu_attain.csv",
        "gross_rent.csv",
        "home_value.csv",
        "house_income.csv",
        "occ_status.csv",
        "total_pop.csv"
    ]

    all_dataframes = []

    print("Starting combination process...")

    for file_name in input_files:
        if not os.path.exists(file_name):
            print(f"Warning: {file_name} not found. Skipping this file.")
            continue

        print(f"Processing {file_name}...")
        try:
            df = pd.read_csv(file_name)

            # Extract the attribute name from the filename (e.g., "edu_attain" from "edu_attain.csv")
            attribute_name = os.path.splitext(file_name)[0]
            
            # Add the new 'Source_Attribute' column
            df['Source_Attribute'] = attribute_name
            
            all_dataframes.append(df)
            print(f"  Loaded {len(df)} rows from {file_name}.")

        except Exception as e:
            print(f"Error processing {file_name}: {e}")
            continue

    if not all_dataframes:
        print("No dataframes were successfully processed. No combined file will be created.")
        return

    # Concatenate all dataframes into a single one
    # pandas will automatically align columns and fill non-matching cells with NaN
    combined_df = pd.concat(all_dataframes, ignore_index=True)

    # Define a preferred column order for the common columns, and the new attribute column.
    common_cols = ['Tract ID', 'County', 'Year', 'Source_Attribute']
    
    # Get all unique columns from the combined dataframe
    all_final_cols = list(combined_df.columns)

    # Filter out the common columns from the list of all columns
    remaining_cols = [col for col in all_final_cols if col not in common_cols]
    
    # Sort the remaining columns alphabetically for consistent output
    remaining_cols.sort()
    
    # Construct the final column order
    final_columns_order = common_cols + remaining_cols

    # Reindex the dataframe to apply the desired column order
    combined_df = combined_df[final_columns_order]

    # Save the combined DataFrame to the specified output file
    combined_df.to_csv(output_filename, index=False)

    print(f"\nSuccessfully combined all data into {output_filename}")
    print(f"Final combined dataset shape: {combined_df.shape}")
    print(f"Columns in the combined dataset: {combined_df.columns.tolist()}")

# --- Main execution block ---
if __name__ == "__main__":
    # Ensure your individual pre-processed files (edu_attain.csv, gross_rent.csv, etc.)
    # are in the same directory as this script.
    combine_bay_area_data()
