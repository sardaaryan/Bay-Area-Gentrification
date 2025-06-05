// Generates a gentrification score for each census tract by comparing previous and current data
export function genScore(prev, curr) {
  // List of attributes to use for scoring
  const ATTRS = [
    "Median_Household_Income",            
    "Median_Home_Value",                       
    "Median_Gross_Rent",                  
    "Vacant Units",                       
    "25_Plus_Bachelors_Degree_Or_Higher_Count"
  ];
  // Create lookup tables for previous by tract ID
  const prevByTract = Object.fromEntries(prev.map(d => [d["Tract ID"], d]));

  // Helper function to compute medians for each attribute in a dataset
  function getMedians(data) {
    return ATTRS.map(attr => {
      const values = data
        .map(d => parseFloat(d[attr]))
        .filter(v => !isNaN(v) && v > 0); // Only positive, valid numbers
      if (!values.length) return undefined;
      values.sort((a, b) => a - b);
      const mid = Math.floor(values.length / 2);
      // Return median value
      return values.length % 2 === 0
        ? (values[mid - 1] + values[mid]) / 2
        : values[mid];
    });
  }

  // Compute medians for previous and current datasets
  const prevMedians = getMedians(prev);
  const currMedians = getMedians(curr);

  const results = [];

  // Iterate through each tract in the current data
  for (const tract of curr) {
    const tractId = tract["Tract ID"];
    const prevTract = prevByTract[tractId];
    if (!prevTract) continue; // Skip if tract not present in previous data

    let M = 0; // Accumulator for score
    let validAttrs = 0; // Count of valid attributes used
    let undefinedAttrs = []; // Track undefined/invalid attributes
    let invalid = false; // Flag to mark if any attribute is invalid

    // For each attribute, calculate the log-ratio term
    for (let i = 0; i < ATTRS.length; i++) {
      const attr = ATTRS[i];

      const Xn = parseFloat(tract[attr]);      // Current value
      const xn = parseFloat(prevTract[attr]);  // Previous value
      const Xn_med = currMedians[i];           // Current median
      const xn_med = prevMedians[i];           // Previous median

      // If any value is invalid or non-positive, mark as invalid and record attribute
      if (
        isNaN(Xn) || isNaN(xn) || isNaN(Xn_med) || isNaN(xn_med) ||
        Xn <= 0 || xn <= 0 || Xn_med <= 0 || xn_med <= 0
      ) {
        console.log(Xn, xn, Xn_med, xn_med)
        undefinedAttrs.push(attr);
        invalid = true;
      }
    }

    if (invalid) {
      results.push({
        tractId,
        score: undefined,
        undefinedAttrs
      });
      //console.log(result)
      console.log(undefinedAttrs)
      continue;
    }

    // If all attributes are valid, calculate the score
    for (let i = 0; i < ATTRS.length; i++) {
      const attr = ATTRS[i];
      const Xn = parseFloat(tract[attr]);
      const xn = parseFloat(prevTract[attr]);
      const Xn_med = currMedians[i];
      const xn_med = prevMedians[i];

      const Gn = Xn / xn;           // Growth ratio for tract
      const Gn_med = Xn_med / xn_med; // Growth ratio for median

      // For the last attribute, reverse the log difference
      const logTerm = (i === 4)
        ? Math.log(Gn_med) - Math.log(Gn)
        : Math.log(Gn) - Math.log(Gn_med);

      M += logTerm;
      validAttrs++;
    }

    results.push({
      tractId,
      score: M / validAttrs,
      undefinedAttrs: []
    });
  }
  return results;
}
