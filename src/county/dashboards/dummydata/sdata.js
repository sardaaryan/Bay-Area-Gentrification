// Dummy streamgraph dataset for 10 census tracts, 2010–2023
const streamData = Array.from({ length: 10 }, (_, tractIndex) => {
  const tractId = `06075010${100 + tractIndex}`;
  return {
    tract: tractId,
    yearly: Array.from({ length: 14 }, (_, yearIndex) => {
      const year = 2010 + yearIndex;

      // Vary the scale per tract to simulate real differences
      const factor = 1 + tractIndex * 0.1;

      return {
        year,
        home_value: 50 + yearIndex * 2 * factor + Math.random() * 5,
        income: 45 + yearIndex * 1.5 * factor + Math.random() * 4,
        rent: 30 + yearIndex * 1.2 * factor + Math.random() * 3,
        education: 20 + yearIndex * 1.0 * factor + Math.random() * 2,
        occupancy: 10 + yearIndex * 0.7 * factor + Math.random() * 1.5,
        population: 15 + yearIndex * 0.9 * factor + Math.random() * 2.5
      };
    })
  };
});
