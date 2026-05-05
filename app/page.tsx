'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

interface CountyData {
 FIPS: string;
 Region: string;
 County: string;
 Point: string;
 Role: string;
 Class: string;
 Address: string;
 Url: string;
}

export default function Page() {
 const mapContainer = useRef<HTMLDivElement | null>(null);
 const mapRef = useRef<mapboxgl.Map | null>(null);
 const [hoveredData, setHoveredData] = useState<CountyData | null>(null);
 const [selectedFips, setSelectedFips] = useState<string | null>(null);
 const [countyJsonData, setCountyJsonData] = useState<CountyData[]>([]);
 const selectedFipsRef = useRef<string | null>(null); 

 const fipsLookup = useMemo(() => {
  return countyJsonData.reduce((acc, curr) => {
   acc[curr.FIPS] = curr;
   return acc;
  }, {} as Record<string, CountyData>);
 }, [countyJsonData]);

 useEffect(() => {
  const fetchMapData = async () => {
   try {
    const response = await fetch('/mapdata.json');
    if (!response.ok) throw new Error('Failed to fetch map data');
    const data = await response.json();
    setCountyJsonData(data);
   } catch (error) {
    console.error("Error loading JSON:", error);
   }
  };
  fetchMapData();
 }, []);

 useEffect(() => {
  if (!mapContainer.current || mapRef.current) return;

  const map = new mapboxgl.Map({
   container: mapContainer.current,
   style: 'mapbox://styles/mapbox/light-v11',
   center: [-119.4179, 36.7783],
   zoom: 5.2
  });

  mapRef.current = map;

  map.on('load', async () => {
   const res = await fetch('https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json');
   const geojson = await res.json();

   const regionColorMap: Record<string, string> = {
    '06015': '#c9db2a', '06023': '#c9db2a', '06045': '#c9db2a', '06033': '#c9db2a', '06097': '#c9db2a',
    '06093': '#0099b5', '06049': '#0099b5', '06089': '#0099b5', '06035': '#0099b5', '06103': '#0099b5', '06063': '#0099b5', '06007': '#0099b5', '06021': '#0099b5', '06105': '#0099b5',
    '06011': '#8cd7f4', '06113': '#8cd7f4', '06101': '#8cd7f4', '06067': '#8cd7f4', '06115': '#8cd7f4', '06091': '#8cd7f4', '06057': '#8cd7f4', '06061': '#8cd7f4', '06017': '#8cd7f4', '06003': '#8cd7f4',
    '06081': '#f79520', '06055': '#f79520', '06095': '#f79520', '06013': '#f79520', '06041': '#f79520', '06075': '#f79520', '06001': '#f79520',
    '06087': '#65be4f', '06085': '#65be4f', '06069': '#65be4f', '06053': '#65be4f',
    '06005': '#e92a39', '06009': '#e92a39', '06109': '#e92a39', '06077': '#e92a39', '06099': '#e92a39',
    '06047': '#fcc216', '06043': '#fcc216', '06039': '#fcc216', '06019': '#fcc216', '06031': '#fcc216', '06107': '#fcc216',
    '06079': '#0a8070', '06029': '#0a8070', '06083': '#0a8070', '06111': '#0a8070',
    '06073': '#c51883', '06025': '#c51883', '06059': '#c51883',
    '06051': '#69308e', '06027': '#69308e', '06071': '#69308e', '06065': '#69308e',
    '06037': '#00528a'
   };

   geojson.features.forEach((f: any) => {
    f.properties.color = regionColorMap[f.id] || '#cccccc';
   });

   map.addSource('counties', { type: 'geojson', data: geojson, promoteId: 'id'});
   
   map.addLayer({
    id: 'county-regions',
    type: 'fill',
    source: 'counties',
    paint: {
     'fill-color': ['get', 'color'],
     'fill-opacity': 0.7,
     'fill-outline-color': '#fff'
    }
   });

   map.addLayer({
    id: 'county-outline',
    type: 'line',
    source: 'counties',
    paint: { 'line-color': '#333', 'line-width': 2.5 },
    filter: ['==', ['id'], ''] 
   });
  });

  return () => map.remove();
 }, []);

useEffect(() => {
  const map = mapRef.current;
  if (!map) return;

const getFipsFromFeature = (feature: any) => {
    const rawId = feature.id ?? feature.properties?.id ?? feature.properties?.fips;
    return rawId ? String(rawId).padStart(5, '0') : null;
  };

  const onMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
    if (e.features && e.features.length > 0) {
      map.getCanvas().style.cursor = 'pointer';
      

      if (!selectedFipsRef.current) {
        const fips = getFipsFromFeature(e.features[0]);
        const match = fips ? fipsLookup[fips] : null;
        if (match) setHoveredData(match);
      }
    }
  };

  const onClick = (e: mapboxgl.MapLayerMouseEvent) => {
    const feature = e.features?.[0];
    if (feature && map.getLayer('county-outline')) {
      const fips = getFipsFromFeature(feature);
      const match = fips ? fipsLookup[fips] : null;


      if (selectedFipsRef.current === fips) {
        selectedFipsRef.current = null;
        setSelectedFips(null);
        map.setFilter('county-outline', ['==', ['id'], '']);
      } else if (match && fips) {
        selectedFipsRef.current = fips;
        setSelectedFips(fips);
        setHoveredData(match);
        map.setFilter('county-outline', ['==', ['id'], feature.id]);
      }
      
      (e.originalEvent as any)._handledByLayer = true; 
    }
  };

  const onMouseLeave = () => {
    map.getCanvas().style.cursor = '';
    if (!selectedFipsRef.current) {
      setHoveredData(null);
    }
  };

  const onMapClick = (e: mapboxgl.MapMouseEvent) => {
    if (!(e.originalEvent as any)._handledByLayer) {
      selectedFipsRef.current = null;
      setSelectedFips(null);
      setHoveredData(null);
      if (map.getLayer('county-outline')) {
        map.setFilter('county-outline', ['==', ['id'], '']);
      }
    }
  };

  map.on('mousemove', 'county-regions', onMouseMove);
  map.on('mouseleave', 'county-regions', onMouseLeave);
  map.on('click', 'county-regions', onClick);
  map.on('click', onMapClick);

  return () => {
    map.off('mousemove', 'county-regions', onMouseMove);
    map.off('mouseleave', 'county-regions', onMouseLeave);
    map.off('click', 'county-regions', onClick);
    map.off('click', onMapClick);
  };
}, [fipsLookup]);

 return (
  <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif' }}>
   <div ref={mapContainer} style={{ flex: 3 }} />
   <div style={{ flex: 1, padding: '24px', borderLeft: '1px solid #ddd', background: '#f9f9f9', overflowY: 'auto' }}>
    <h2 style={{ color: '#333', borderBottom: '2px solid #00528a' }}>
     County Details {selectedFips && "📍"}
    </h2>
    
    {hoveredData ? (
     <div className='text-black'>
      <h3 style={{ margin: '10px 0 5px 0' }}>{hoveredData.County}</h3>
      <p style={{ color: 'black', fontSize: '0.9rem' }}>{hoveredData.Region}</p>
      <hr />
      <p><strong>{hoveredData.Role}:</strong><br />{hoveredData.Point}</p>
      <p><strong>Address:</strong><br />{hoveredData.Address}</p>
      <p><strong>Class:</strong> {hoveredData.Class}</p>
      <a href={hoveredData.Url} target="_blank" rel="noreferrer" 
       style={{ display: 'inline-block', padding: '10px 15px', background: '#00528a', color: '#fff', textDecoration: 'none', borderRadius: '4px' }}>
       Official Website
      </a>
      {selectedFips && (
  <button 
    onClick={() => {
      selectedFipsRef.current = null;
      
      setSelectedFips(null);
      setHoveredData(null);
      
      mapRef.current?.setFilter('county-outline', ['==', ['id'], '']);
    }}
    style={{ 
      display: 'block', 
      marginTop: '20px', 
      background: 'none', 
      border: '1px solid #ccc', 
      cursor: 'pointer', 
      padding: '5px 10px' 
    }}
  >
    Clear Selection
  </button>
)}
     </div>
    ) : (
     <p style={{ color: 'black' }}>Hover over a county (or click to lock) to view info.</p>
    )}
   </div>
  </div>
 );
}
