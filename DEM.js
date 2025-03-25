var ROI = ee.FeatureCollection("projects/ee-nokml/assets/Soummam_watershed");

// Clip the DEM image to the region of interest (ROI)
var srtm = ee.Image("USGS/SRTMGL1_003").clip(ROI);

// Add layers to the map
Map.addLayer(ROI, {}, 'ROI');
Map.addLayer(srtm, {min: -50, max: 3000}, 'DEM');

// Export Image to Drive
Export.image.toDrive({
  image: srtm,
  description: 'Free_state',
  region: ROI,
  folder: 'earthengine',
  scale: 30,
  maxPixels: 1e13
});