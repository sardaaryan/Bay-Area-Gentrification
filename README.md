# The Gentrification of the San Francisco Bay Area 

The codebase for our ECS 163 final project. An interactive visualization exploring the contemporary gentrification crisis in the San Francisco Bay Area, from the years 2010-2023.

## Repository Structure

The repository consists of the following components:

- `data_preprocess/`: this folder contains all of the python scripts to preprocess the American Communit Survey (ACS) census CSV files into what is presently used in our implementation. Each name corresponds to the ACS variable code. For example, `b01003_data_filter.py` corresponds to the Total Population ACS variable, because it's ACS code is B01003. There is a script for each variable in this directory. To recreate, unzip an ACS data table (after downloading) for the targeted ACS variable, filtered by all census tracts for the 9 Bay Area counties (Alameda, Contra Costa, Marin, Napa, San Francisco, San Mateo, Santa Clara, Solano and Sonoma). In the directory containing the ACS files, run the corresponding python script. It will generate the preprocessed CSV file for this ACS attribute!
- `map_preprocess/`: this folder contians preprocessing logic used to get the topo.json files to the form currently seen (to draw their SVG's). It is here mostly for posterity.
- `reports/`: All the source code for the LaTeX reports written for this project. The proposal report is in `proposal/`, the progress report is in `progress/`, and the final report in the `final/` subdirectory. You can compile a PDF of any of these reports from these parent subdirectories, using whichever command-line approach you desire. We used `pdflatex main.tex` followed by `bibtex main` (to generate the references), and one more `pdflatex main.tex`. The report will be `main.pdf`.
- `src/` contains all of the code of our implementation. We break down it's structure next.
    - (NEED TO FINISH `src/`!!) <- this will be pretty long
 
The actual implementation lives in `src/`, and installation and setup will take place here.

## Installation

We walk through installation steps here to prepare for execution.

1. Navigate to this [DropBox Link](https://www.dropbox.com/scl/fo/jk7hzesqrmk1rj6cyiy25/AGJSShiGR5IBjCmfht8mKiw?rlkey=k7syl4gqx0d89zpmciyyait39&st=mw99bhws&dl=0](https://www.dropbox.com/scl/fo/jk7hzesqrmk1rj6cyiy25/AGJSShiGR5IBjCmfht8mKiw?rlkey=k7syl4gqx0d89zpmciyyait39&st=yxseja76&dl=0) and download the zipped, preprocessed dataset, titled `data/`.
2. Unzip, and do not change the name of the directory, nor it's contents. Make sure it is positioned inside `src/` (it's exact position should be `src/data/`), with the rest of the source code.
3. The project is ready to be executed!

## Execution

1. Run any local development server of your choice. We have enjoyed using `live-server` on the command line, but conceivably any similar service should work. If not, we recommend `live-server`. Make sure you have run it in the `src/` directory.
2. The visualization has begun! Enjoy 🙂


This project has been a collaborative effort by Jacob Feenstra ([`jdfeenstra@ucdavis.edu`](jdfeenstra@ucdavis.edu)), Aryan Sarda ([`arsarda@ucdavis.edu`](arsarda@ucdavis.edu)), Diane Kim ([`dnekim@ucdavis.edu`](dnekim@ucdavis.edu)), and Benicio Bailey ([`bkbailey@ucdavis.edu`](bkbailey@ucdavis.edu))
