# The Gentrification of the San Francisco Bay Area 

The codebase for our ECS 163 final project. An interactive visualization exploring the contemporary gentrification crisis in the San Francisco Bay Area, from the years 2010-2023.

## Repository Structure

The repository consists of the following components:

- `data_preprocess/`: this folder contains all of the python scripts to preprocess the American Communit Survey (ACS) census CSV files into what is presently used in our implementation. Each name corresponds to the ACS variable code. For example, `b01003_data_filter.py` corresponds to the Total Population ACS variable, because it's ACS code is B01003. There is a script for each variable in this directory. If you wish to recreate the preprocessed CSV files in `data/src`, do the following:
  
  <details>
  <summary>Recreating the preprocessed dataset</summary>

    1. Navigate to the ACS Data Tables Portal linked [here](https://data.census.gov/).
    2. Enter an ACS code into the search bar, individually: B01003, S1901, S2506, B25064, B25002, or S1501. The following steps apply for _one_ of these ACS Data Table codes, and can be recreated for any of them.
    3.  For a given ACS code, click on the first search result.
    4.  Navigate to **Filters** on the lefthand-side of the GUI.
    5.  Then, navigate to **Census Tract** under the **Geographies** toggle.
    6.  Navigate to **California**. It will now show all counties in CA by census tract.
    7.  Click on one of the 9 Bay Area Counties: Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano or Sonoma.
    8.  Checkmark the **All Census Tracts** option for the given county.
    9.  Redirect to the **California** county page. Repeat steps 7-8 above until all 9 Bay Area counties are accounted
    10.  For the given ACS code, you should see 10 filters at the filter widget, if you've toggled the census tracts of all 9 counties.
    11.  Download the ACS Data Table as a zip file. It will contain several Data, Metadata, and Text CSV files.
    12.  Ensure all of these files are positioned in the same working directory as the corresponding python data filter script. We suggest unzipping the data table in `data_preprocess/`. Run the script (`python3 b01003_data_filter.py` for instance, if B01003 is the current ACS code being queried). It will generate a single CSV file. Pandas is a required package, so make sure you have installed it with `pip` in a local environment. `python3 -m venv venv`, followed by `source venv/bin/activate`, and lastly `pip install pandas`. You are ready to run the script!
    13.  Make sure this CSV file is then moved to the `src/data/` directory, creating it if necessary.
    14.  Repeat steps 2-13 until there is 6 CSV files in `src/data/`. This is the complete preprocessed dataset.
    15.  Now take a break. You've earned it!
  </details>

- `map_preprocess/`: this folder contains preprocessing logic used to get the topo.json files to the for currently seen. These topo.json's draw the county census tract SVG's for
  the heatmap, as well as the Greater Bay Area map.

    <details>
    <summary>Recreating filtered TopoJson file for Bay Area counties</summary>

    1. Navigate to [this github repo](https://github.com/jethin/us-counties-tracts-topojson) containing topojson files for all counties and tracts across america.
    2. The county maps are separated by state. Since California is the 6th state when ordered alphabetically, download 06.topo.json from the counties folder
    3. After downloading, put the topo.json file in the `map_preprocess/counties/` working directory before running `filter.js` (in the same directory), which will filter and select only the bay area counties from all the counties in California.
    4. Now you will have a new file, `filtered-countied.topo.json`. Move this to the `src/data/` folder.
    5. Next, download `tracts.zip` from [the same repo](https://github.com/jethin/us-counties-tracts-topojson).
    6. Unzipping the file, each topo.json file in the folder will correspond to a county in the U.S and is named as the counties FIPS identification code.
    7. You will need to copy the cooresponding files to the following county FIPS codes and put them in the `src/data/tracts/` directory:
    06001, 06013, 06041, 06055, 06075, 06081, 06085, 06095, 06097. These correspond to the 9 Bay Area counties.
    8. And you are finished!
    </details>

- `reports/`: All the source code for the LaTeX reports written for this project. The proposal report is in `proposal/`, the progress report is in `progress/`, and the final report in the `final/` subdirectory. You can compile a PDF of any of these reports with the following steps:

  <details>
  <summary>compiling a LaTeX report</summary>

    1. Navigate to the given parent subdirectory (`proposal/` for the proposal report, and so on) 
    2. Use [this Dropbox link](https://www.dropbox.com/scl/fi/1mdkwptqvdwjf6t91ekvv/imgs.zip?rlkey=94rwuuueltidle266ql889hvw&st=52qckpk2&dl=1) to download `imgs.zip` immediately. Make sure it is unzipped in `reports/`, not the parent subdirectory. Do not change it's name or contents. This only needs to be done once for all reports!
    3. Use whichever approach you desire to compile main.tex. We used `pdflatex main.tex` followed by `bibtex main` (to generate the references), and one more `pdflatex main.tex`. The report will be `main.pdf`.
    4. Apply these steps to any of LaTeX reports.

  </details>

- `src/` contains all of the code of our implementation. We break down it's structure next.
    - (NEED TO FINISH `src/`!!) <- this will be pretty long
 
The actual implementation lives in `src/`, and installation and setup will take place here.

## Installation

We walk through installation steps here to prepare for execution.

1. Click on [this Dropbox link](https://www.dropbox.com/scl/fi/h2ky862f5y9yq2zwgew4w/data.zip?rlkey=zhbe790l07ystgk4p6me7lczn&st=pv9jsdub&dl=1) and a zipped, preprocessed dataset titled `data/` will immediately download.
2. Unzip, and do not change the name of the directory, nor it's contents. Make sure it is positioned inside `src/` (it's exact position should be `src/data/`), with the rest of the source code.
3. Lastly, to get the images in the introductory article of our visualization, use [this Dropbox link](https://www.dropbox.com/scl/fi/gfk7ziromvf75umgpf5di/imgs.zip?rlkey=e1rrilxave84mpmudirwx19zt&st=akqmaytk&dl=1) to download imgs.zip immediately. Make sure it is unzipped in `src/intro/`. Do not change it's name or contents.
3. The project is ready to be executed!

The zipfile contains the 6 preprocessed CSV files which the visualization uses, a `tracts/` folder containing 9 topo.json files (each one corresponds to 1 of the 9 Bay Area counties, illustrating their census tracts), and a `filtered-counties.topo.json`, which is the overview of the 9 counties of the San Francisco Bay Area (without census tracts). 

## Execution

1. Run any local development server of your choice. We have enjoyed using `live-server` on the command line, but conceivably any similar service should work. If not, we recommend `live-server`. Make sure you have run it in the `src/` directory.
2. The visualization has begun! Enjoy 🙂

This project has been a collaborative effort by Jacob Feenstra ([`jdfeenstra@ucdavis.edu`](jdfeenstra@ucdavis.edu)), Aryan Sarda ([`arsarda@ucdavis.edu`](arsarda@ucdavis.edu)), Diane Kim ([`dnekim@ucdavis.edu`](dnekim@ucdavis.edu)), and Benicio Bailey ([`bkbailey@ucdavis.edu`](bkbailey@ucdavis.edu))
