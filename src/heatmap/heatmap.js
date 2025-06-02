/*
    The format for the data params is 
    TRACT_ID, MEDIAN_INCOME, MEDIAN_HOMEVALUE, GROSS_RENT, OCCUPANCY RATE, EDUCATIONAL_ATTAINMENT(bachelors only)
    
    Im not sure what the actual names will be since we have to  
    parse outside of the function but that means we'll have to change
    the ATTRIBUTES values when we do have it.

    This function doesnt not know which county it's calculating for it only crunches numbers.
*/
function genScore(previousYearData, currentYearData) {
  // Attributes in order: income, home value, rent, occupancy, education
  const ATTRIBUTES = ['income', 'homeValue', 'rent', 'occupancy', 'education'];

  // Step 1: Create lookup maps for previous and current year data
  const prevMap = new Map(previousYearData.map(d => [d.tractId, d]));
  const currMap = new Map(currentYearData.map(d => [d.tractId, d]));

  // Step 2: Compute countywide averages for both years
  const countySumsPrev = { income: 0, homeValue: 0, rent: 0, occupancy: 0, education: 0 };
  const countySumsCurr = { income: 0, homeValue: 0, rent: 0, occupancy: 0, education: 0 };
  let tractCount = 0;

  for (const tract of currentYearData) {
    const prev = prevMap.get(tract.tractId);
    if (!prev) continue;

    let valid = true;
    for (const attr of ATTRIBUTES) {
      if (
        typeof tract[attr] !== 'number' || typeof prev[attr] !== 'number' ||
        tract[attr] <= 0 || prev[attr] <= 0
      ) {
        valid = false;
        break;
      }
    }

    if (!valid) continue;

    for (const attr of ATTRIBUTES) {
      countySumsCurr[attr] += tract[attr];
      countySumsPrev[attr] += prev[attr];
    }

    tractCount++;
  }

  const countyAverages = {};
  for (const attr of ATTRIBUTES) {
    countyAverages[attr] = {
      curr: countySumsCurr[attr] / tractCount,
      prev: countySumsPrev[attr] / tractCount
    };
  }

  // Step 3: Compute M scores per tract
  const results = [];

  for (const tract of currentYearData) {
    const prev = prevMap.get(tract.tractId);
    if (!prev) continue;

    let scoreSum = 0;
    let valid = true;

    // Compute log(G_n) - log(Ḡ_n) for income, home value, rent, occupancy
    for (const attr of ATTRIBUTES.slice(0, 4)) {
      const G_n = tract[attr] / prev[attr];
      const G_avg = countyAverages[attr].curr / countyAverages[attr].prev;

      if (G_n <= 0 || G_avg <= 0) {
        valid = false;
        break;
      }

      scoreSum += Math.log(G_n) - Math.log(G_avg);
    }

    if (!valid) continue;

    // Special handling for education (flipped log difference)
    const attr = 'education';
    const G_n = tract[attr] / prev[attr];
    const G_avg = countyAverages[attr].curr / countyAverages[attr].prev;

    if (G_n <= 0 || G_avg <= 0) continue;

    const educationComponent = Math.log(G_avg) - Math.log(G_n);
    const M = (scoreSum + educationComponent) / 5;

    results.push({ tractId: tract.tractId, score: M });
  }

  return results;
}
