'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'TOBEFILLED';

export default function Page() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-119.5, 37.2],
      zoom: 5.5
    });

    mapRef.current = map;

    map.on('load', async () => {
      const res = await fetch(
        'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json'
      );
      const geojson = await res.json();

      const regionColors: Record<string, string> = {
        // Region 1
        '06015':'#c9db2a','06023':'#c9db2a','06045':'#c9db2a','06033':'#c9db2a','06097':'#c9db2a',


        '06093':'#0099b5','06049':'#0099b5','06089':'#0099b5','06035':'#0099b5','06103':'#0099b5','06063':'#0099b5','06007':'#0099b5','06021':'#0099b5','06105':'#0099b5',

        // Region 3
        '06011':'#8cd7f4','06113':'#8cd7f4','06101':'#8cd7f4','06067':'#8cd7f4','06115':'#8cd7f4','06091':'#8cd7f4','06057':'#8cd7f4','06061':'#8cd7f4','06017':'#8cd7f4','06003':'#8cd7f4',

        // Region 4
        '06081':'#f79520', '06055':'#f79520','06095':'#f79520','06013':'#f79520','06041':'#f79520','06075':'#f79520','06001':'#f79520',


        '06087':'#65be4f','06085':'#65be4f','06069':'#65be4f','06053':'#65be4f',

        // Region 6
        '06005':'#e92a39','06009':'#e92a39','06109':'#e92a39','06077':'#e92a39','06099':'#e92a39',

        // Region 7
        '06047':'#fcc216','06043':'#fcc216','06039':'#fcc216','06019':'#fcc216','06031':'#fcc216','06107':'#fcc216',

        // Region 8
        '06079':'#0a8070','06029':'#0a8070','06083':'#0a8070','06111':'#0a8070',

        // Region 9
        '06073':'#c51883','06025':'#c51883','06059':'#c51883',

        // Region 10
        '06051':'#69308e','06027':'#69308e','06071':'#69308e','06065':'#69308e',

        // Region 11
        '06037':'#00528a'
      };

      geojson.features.forEach((f: any) => {
        const fips = f.id as string;
        f.properties = f.properties || {};
        f.properties.color = regionColors[fips] || '#cccccc';
      });

      map.addSource('counties', {
        type: 'geojson',
        data: geojson
      });

      map.addLayer({
        id: 'county-regions',
        type: 'fill',
        source: 'counties',
        paint: {
          'fill-color': ['get', 'color'],
          'fill-opacity': 0.7,
          'fill-outline-color': '#333'
        }
      });
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{ position: 'absolute', height: '100%', width: '100%' }}
    />
  );
}