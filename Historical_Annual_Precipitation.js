// Step 1: Define the Area of Interest (Soummam watershed)
var geometry = ee.FeatureCollection('projects/ee-nokml/assets/Soummam_watershed').geometry();

// Display the watershed boundary
Map.centerObject(geometry, 8);
Map.addLayer(geometry, {color: 'black'}, 'Watershed');

// Step 2: Load the precipitation data
var collection = ee.ImageCollection('NASA/GDDP-CMIP6')
  .filter(ee.Filter.date('2000-01-01', '2023-12-31')) // Adjust date range
  .filter(ee.Filter.eq('model', 'ACCESS-CM2')) // Specific model
  .select('pr');

// Step 3: Compute annual precipitation maps
var years = ee.List.sequence(2000, 2023);
var annualPrecipitation = ee.ImageCollection(
  years.map(function(year) {
    var startDate = ee.Date.fromYMD(year, 1, 1);
    var endDate = ee.Date.fromYMD(year, 12, 31);
    var annualMean = collection
      .filter(ee.Filter.date(startDate, endDate))
      .mean()
      .multiply(86400) // Convert from kg/m²/s to mm/day
      .clip(geometry) // Clip to the area of interest
      .set('year', year);
    return annualMean;
  })
);

// Initialize lists to store min/max values for CSV export
var csvData = ee.List([]);

// Step 4: Add annual precipitation maps to the map and calculate min/max values
years.getInfo().forEach(function(year) {
  var img = annualPrecipitation.filter(ee.Filter.eq('year', year)).first();
  
  // Calculate min and max values for the image
  var stats = img.reduceRegion({
    reducer: ee.Reducer.minMax(),
    geometry: geometry,
    scale: 1000,
    bestEffort: true
  });
  
  var minValue = stats.get('pr_min').getInfo();
  var maxValue = stats.get('pr_max').getInfo();
  print('Year: ' + year, 'Min:', minValue, 'Max:', maxValue);

  // Add data to CSV list
  csvData = csvData.add(ee.Dictionary({
    year: year,
    min: minValue,
    max: maxValue
  }));
  
  // Add the image to the map with specific min/max values
  Map.addLayer(
    img, 
    {min: minValue, max: maxValue, palette: ['blue', 'green', 'yellow', 'red']}, 
    'Precipitation ' + year
  );

  // Export each annual map as a GeoTIFF
  Export.image.toDrive({
    image: img,
    description: 'Precipitation_' + year,
    folder: 'Annual_Precipitation_Maps',
    fileNamePrefix: 'Precipitation_' + year,
    scale: 1000,
    region: geometry,
    maxPixels: 1e13
  });
});

// Step 5: Export min/max values to CSV
var csvFeatureCollection = ee.FeatureCollection(
  csvData.map(function(d) {
    d = ee.Dictionary(d);
    return ee.Feature(null, d);
  })
);

Export.table.toDrive({
  collection: csvFeatureCollection,
  description: 'Precipitation_MinMax_Values',
  folder: 'Annual_Precipitation_Stats',
  fileNamePrefix: 'Precipitation_MinMax_2000_2023',
  fileFormat: 'CSV'
});

// Step 6: Generate a time series chart
var chart = ui.Chart.image.seriesByRegion({
  imageCollection: annualPrecipitation,
  regions: geometry,
  reducer: ee.Reducer.mean(),
  scale: 1000,
  xProperty: 'year'
}).setOptions({
  title: 'Annual Precipitation Time Series',
  hAxis: {title: 'Year'},
  vAxis: {title: 'Precipitation (mm/day)'},
  series: {0: {color: 'blue'}}
});
print(chart);

