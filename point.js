mapboxgl.accessToken = 'pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA';
var map = new mapboxgl.Map({
    container: 'map',
    zoom: 4,
    center: [-98.47602380565712, 38.71095244108048],
    style: 'mapbox://styles/daudi97/ckcyd36dz1neo1ikdd63oacbu',
    minZoom:3.4
});
 
map.addControl(new mapboxgl.NavigationControl());
  
map.on('load', function() {
    // add a clustered GeoJSON source for a sample set of earthquakes
    map.addSource('sampleData', {
    'type': 'geojson',
    'data':'points.geojson',
    });

    // circle and symbol layers for rendering individual earthquakes (unclustered points)
    map.addLayer({
        'id': 'point_circle',
        'type': 'circle',
        'source': 'sampleData',
        'filter': ['!=', 'cluster', true],
        'paint': {
            'circle-color':'#6CE2DE',
            'circle-opacity': 0.7,
            'circle-radius': ['*', ['get', 'value'], 0.5],
            'circle-stroke-color':'#48918d',
            'circle-stroke-width':0.9
        }
    });

});


