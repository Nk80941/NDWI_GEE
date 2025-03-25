// Define the Area of Interest
var geometry = ee.FeatureCollection('projects/ee-nokml/assets/Soummam_watershed');

// Load Landsat 7 Image Collection and Filter by Date and Area
var S2 = ee.ImageCollection("LANDSAT/LE07/C02/T1_L2")
  .filterDate('2001-01-01', '2001-12-30')
  .filterBounds(geometry)
  .median();

// Define Bands  
var NIR = S2.select('SR_B4');  // Near-Infrared
var RED = S2.select('SR_B3');  // Red
var GREEN = S2.select('SR_B2'); // Corrected Green band

// Calculate NDWI
var ndwi = GREEN.subtract(NIR).divide(GREEN.add(NIR)).rename('NDWI');
var NDWI = ndwi.clip(geometry);

// Display Results
var ndwiparam = {min: -1, max: 1, palette: ['white', 'blue']};
Map.addLayer(NDWI, ndwiparam, 'NDWI');

// Export Results
Export.image.toDrive({ 
  image: NDWI.toFloat(), 
  description: 'New_NDWI_2001_Landsat7', 
  scale: 30, 
  region: geometry.geometry().bounds(), 
  maxPixels: 1e13 
});
