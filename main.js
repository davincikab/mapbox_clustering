mapboxgl.accessToken = 'pk.eyJ1IjoiZGF1ZGk5NyIsImEiOiJjanJtY3B1bjYwZ3F2NGFvOXZ1a29iMmp6In0.9ZdvuGInodgDk7cv-KlujA';
var map = new mapboxgl.Map({
    container: 'map',
    zoom: 4,
    center: [-98.47602380565712, 38.71095244108048],
    style: 'mapbox://styles/mapbox/light-v10',
    minZoom:3.4
});
 
map.addControl(new mapboxgl.NavigationControl());
 
// filters for classifying earthquakes into five categories based on valuenitude
var value1 = ['<', ['get', 'value'], 2];
var value2 = ['all', ['>=', ['get', 'value'], 2], ['<', ['get', 'value'], 3]];
var value3 = ['all', ['>=', ['get', 'value'], 3], ['<', ['get', 'value'], 4]];
var value4 = ['all', ['>=', ['get', 'value'], 4], ['<', ['get', 'value'], 5]];
var value5 = ['>=', ['get', 'value'], 5];
 
// colors to use for the categories
var colors = ['#fed976', '#feb24c', '#fd8d3c', '#fc4e2a', '#e31a1c'];
 
map.on('load', function() {
    // add a clustered GeoJSON source for a sample set of earthquakes
    map.addSource('sampleData', {
    'type': 'geojson',
    'data':'points.geojson',
    'cluster': true,
    'clusterRadius': 80,
    'clusterProperties': {
        // keep separate counts for each valuenitude category in a cluster
        'value1': ['+', ['case', value1, 1, 0]],
        'value2': ['+', ['case', value2, 1, 0]],
        'value3': ['+', ['case', value3, 1, 0]],
        'value4': ['+', ['case', value4, 1, 0]],
        'value5': ['+', ['case', value5, 1, 0]]
        }
    });

    // circle and symbol layers for rendering individual earthquakes (unclustered points)
    map.addLayer({
        'id': 'point_circle',
        'type': 'circle',
        'source': 'sampleData',
        'filter': ['!=', 'cluster', true],
        'paint': {
        'circle-color':'#63D4D8',
        'circle-opacity': 0.6,
        'circle-radius': ['get', 'value']
        }
    });

    map.addLayer({
        'id': 'point_label',
        'type': 'symbol',
        'source': 'sampleData',
        'filter': ['!=', 'cluster', true],
        'paint':{
            'text-halo-color':'#fff',
            'text-halo-blur':2
        },
        'layout': {
            'text-field': [
            'number-format',
                ['get', 'value'],
                { 'min-fraction-digits': 1, 'max-fraction-digits': 1 }
            ],
            'text-font': ['Open Sans Semibold', 'Arial Unicode MS Bold'],
            'text-size':  [
                'case',
                ['<', ['get', 'value'], 10],
                8,
                10
            ],
        },
        'paint': {
        'text-color': [
            'case',
            ['<', ['get', 'value'], 3],
            'black',
            '#2e2e2e'
        ]
        }
    });

    // objects for caching and keeping track of HTML marker objects (for performance)
    var markers = {};
    var markersOnScreen = {};
    
    function updateMarkers() {
        var newMarkers = {};
        var features = map.querySourceFeatures('sampleData');
        
        // for every cluster on the screen, create an HTML marker for it (if we didn't yet),
        // and add it to the map if it's not there already
        for (var i = 0; i < features.length; i++) {
            var coords = features[i].geometry.coordinates;
            var props = features[i].properties;
            props.coordinates = coords

            if (!props.cluster) continue;
            var id = props.cluster_id;
            
            var marker = markers[id];
            if (!marker) {
                var el = createCustomChart(props);
                marker = markers[id] = new mapboxgl.Marker({    
                element: el
                }).setLngLat(coords);
            }

            newMarkers[id] = marker;
            
            if (!markersOnScreen[id]) marker.addTo(map);
        }
        // for every marker we've added previously, remove those that are no longer visible
        for (id in markersOnScreen) {
            if (!newMarkers[id]) markersOnScreen[id].remove();
        }
        markersOnScreen = newMarkers;
    }
    
    // after the GeoJSON data is loaded, update markers on the screen and do so on every map move/moveend
    map.on('data', function(e) {
        if (e.sourceId !== 'sampleData' || !e.isSourceLoaded) return;
        
        map.on('move', updateMarkers);
        map.on('moveend', updateMarkers);
        map.on('zoomend', updateMarkers);
        updateMarkers();
    });

});

function zoomToCluster(e, id) {
    let element = document.getElementById(id.toString());
    console.log(eval(element.getAttribute('data-coord')));

    var clusterId = id;
    map.getSource('sampleData').getClusterExpansionZoom(
        clusterId,
        function(err, zoom) {
            if (err) return;
            
            map.easeTo({
                center: eval(element.getAttribute('data-coord')),
                zoom: zoom
            });
        }
    );
}

function createCustomChart(props) {
    console.log(props);
    let element = document.createElement('div');
    element.classList.add('custom-cluster');
    element.setAttribute('id', props.cluster_id);
    element.setAttribute('data-coord', "["+props.coordinates+"]");

    element.style.width = element.style.height = getSize(props.point_count) + "px";

    // calculate the fonts and border width
    element.style.fontSize = getFontSize(props.point_count) + "em";
    element.style.borderWidth =  getBorderWidth(props.point_count) + "px";

    function getSize(pointCount) {
        if(pointCount < 20) {
            return 25;
        }
        return pointCount * 0.8;
    }

    function getFontSize(pointCount) {
        return pointCount < 30 ? 0.75 : pointCount < 50 ? 0.85 : 1;
    }

    function getBorderWidth(pointCount) {
        return pointCount < 20 ? 5 : pointCount < 50 ? 6 : 7;
    }

    element.innerHTML = props.point_count;

    // add event listener
    element.addEventListener('click' , function(e) {
        zoomToCluster(e,props.cluster_id);
    });

    return element;
}


//  TODO: sort reclustering bug 