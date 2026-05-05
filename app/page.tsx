'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'YOUR_MAPBOX_TOKEN';

interface CountyData {
  fips: string;
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
  const fipsLookupRef = useRef<Record<string, any>>({});
  const lastHoveredFips = useRef<string | null>(null);

// 1. Build Lookup Table (Fixed for lowercase "fips")
useMemo(() => {
  const lookup = countyJsonData.reduce((acc, curr) => {
    // Check for "fips" or "FIPS" to be safe
    const fipsKey = curr.fips || (curr as any).FIPS; 
    if (fipsKey) {
      const normalizedFips = String(fipsKey).padStart(5, '0');
      acc[normalizedFips] = curr;
    }
    return acc;
  }, {} as Record<string, CountyData>);
  
  fipsLookupRef.current = lookup;
}, [countyJsonData]);

  // 2. Fetch Sidebar Data
  useEffect(() => {
    fetch('/mapdata.json')
      .then(res => res.json())
      .then(data => setCountyJsonData(data))
      .catch(err => console.error("JSON Load Error:", err));
  }, []);

  // 3. Initialize Map
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
        '06093': '#0099b5', '06049': '#0099b5', '06089': '#0099b5', '06035': '#0099b5', '06103': '#0099b5', 
        '06063': '#0099b5', '06007': '#0099b5', '06021': '#0099b5', '06105': '#0099b5', '06011': '#8cd7f4', 
        '06113': '#8cd7f4', '06101': '#8cd7f4', '06067': '#8cd7f4', '06115': '#8cd7f4', '06091': '#8cd7f4', 
        '06057': '#8cd7f4', '06061': '#8cd7f4', '06017': '#8cd7f4', '06003': '#8cd7f4', '06081': '#f79520', 
        '06055': '#f79520', '06095': '#f79520', '06013': '#f79520', '06041': '#f79520', '06075': '#f79520', 
        '06001': '#f79520', '06087': '#65be4f', '06085': '#65be4f', '06069': '#65be4f', '06053': '#65be4f',
        '06005': '#e92a39', '06009': '#e92a39', '06109': '#e92a39', '06077': '#e92a39', '06099': '#e92a39',
        '06047': '#fcc216', '06043': '#fcc216', '06039': '#fcc216', '06019': '#fcc216', '06031': '#fcc216', 
        '06107': '#fcc216', '06079': '#0a8070', '06029': '#0a8070', '06083': '#0a8070', '06111': '#0a8070',
        '06073': '#c51883', '06025': '#c51883', '06059': '#c51883', '06051': '#69308e', '06027': '#69308e', 
        '06071': '#69308e', '06065': '#69308e', '06037': '#00528a'
      };

      geojson.features.forEach((f: any) => {
        f.properties.color = regionColorMap[f.id] || '#cccccc';
        // Add a fips property explicitly if missing to ensure promoteId works
        f.properties.fips = f.id; 
      });

      map.addSource('counties', { 
        type: 'geojson', 
        data: geojson, 
        promoteId: 'fips' 
      });

      map.addLayer({
        id: 'county-regions',
        type: 'fill',
        source: 'counties',
        paint: {
          'fill-color': ['get', 'color'],
          // This case makes the hover effect VISIBLE
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false], 1,
            0.6
          ]
        }
      });

      map.addLayer({
        id: 'county-outline',
        type: 'line',
        source: 'counties',
        paint: { 
          'line-color': '#000', 
          'line-width': 2.5 
        },
        filter: ['==', ['get', 'fips'], ''] 
      });
    });

    return () => map.remove();
  }, []);

  // 4. Interaction logic
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = 'pointer';
        const fips = e.features[0].properties?.fips;

        if (fips && fips !== lastHoveredFips.current) {
          // Clear previous state
          if (lastHoveredFips.current) {
            map.setFeatureState(
              { source: 'counties', id: lastHoveredFips.current },
              { hover: false }
            );
          }
          
          lastHoveredFips.current = fips;
          
          // Set new state
          map.setFeatureState(
            { source: 'counties', id: fips },
            { hover: true }
          );

          if (!selectedFipsRef.current) {
            setHoveredData(fipsLookupRef.current[fips] || null);
          }
        }
      }
    };

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = '';
      if (lastHoveredFips.current) {
        map.setFeatureState(
          { source: 'counties', id: lastHoveredFips.current },
          { hover: false }
        );
      }
      lastHoveredFips.current = null;
      if (!selectedFipsRef.current) setHoveredData(null);
    };

    const onClick = (e: mapboxgl.MapLayerMouseEvent) => {
      const fips = e.features?.[0].properties?.fips;
      if (!fips) return;

      if (selectedFipsRef.current === fips) {
        selectedFipsRef.current = null;
        setSelectedFips(null);
        map.setFilter('county-outline', ['==', ['get', 'fips'], '']);
      } else {
        selectedFipsRef.current = fips;
        setSelectedFips(fips);
        setHoveredData(fipsLookupRef.current[fips]);
        map.setFilter('county-outline', ['==', ['get', 'fips'], fips]);
      }
      (e.originalEvent as any)._handled = true;
    };

    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!(e.originalEvent as any)._handled) {
        selectedFipsRef.current = null;
        setSelectedFips(null);
        setHoveredData(null);
        map.setFilter('county-outline', ['==', ['get', 'fips'], '']);
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
  }, [countyJsonData]);

  return (
  <div className='flex flex-col md:flex-row h-screen w-full overflow-hidden'>
    

    <div 
      ref={mapContainer} 
      className="flex-1 md:flex-[3] w-full" 
    />

    <div
      style={{
        padding: "24px",
        background: "#f9f9f9",
        overflowY: "auto",
      }}
      className="flex-none h-auto max-h-[500px] md:max-h-none md:flex-1 border-t md:border-t-0 md:border-l border-[#ddd] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:shadow-none"
    >
      <h2 className='text-[#333333] border-b-2 border-b-blue-950 text-center font-bold pb-2'>
        County Details {selectedFips && "📍"}
      </h2>

      {hoveredData ? (
        <div className="text-black text-center mt-4">
          <h3 className="text-lg font-bold" style={{ margin: "0 0 5px 0" }}>
            {hoveredData.County}
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            {hoveredData.Region}
          </p>
          <hr className="my-3" />
          
          <div className="space-y-3 text-sm">
            <p>
              <strong className="block text-xs uppercase text-gray-500">{hoveredData.Role}</strong>
              {hoveredData.Point}
            </p>
            <p>
              <strong className="block text-xs uppercase text-gray-500">Address</strong>
              {hoveredData.Address}
            </p>
            <p>
              <strong className="block text-xs uppercase text-gray-500">Class</strong> {hoveredData.Class}
            </p>
          </div>

          <div className="mt-5 flex flex-col items-center gap-3">
            <a
              href={hoveredData.Url}
              target="_blank"
              rel="noreferrer"
              className="bg-[#00528a] text-white px-4 py-2 rounded shadow hover:bg-[#003d66] transition-colors inline-block w-full max-w-[200px]"
            >
              Official Website
            </a>
            
            {selectedFips && (
              <button
                onClick={() => {
                  selectedFipsRef.current = null;
                  setSelectedFips(null);
                  setHoveredData(null);
                  mapRef.current?.setFilter("county-outline", ["==", ["get", "fips"], ""]);
                }}
                className="text-gray-500 text-xs underline hover:text-black cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center mt-8 italic text-sm">
          Hover over a county or click to lock details.
        </p>
      )}
    </div>
  </div>
);
}