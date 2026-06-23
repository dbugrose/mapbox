"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Open_Sans } from "next/font/google";
import Image from 'next/image'

mapboxgl.accessToken =
  process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "YOUR_MAPBOX_TOKEN";


  const openSans = Open_Sans({
    variable: "--font-open-sans",
    subsets: ["latin"],
  });
interface CountyData {
  fips: string;
  Region: string;
  County: string;
  Point: string;
  Role: string;
  Class: string;
  Address: string;
  Url: string;
  Districts: string;
  Charters: string;
  ADA: string;
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

  useMemo(() => {
    const lookup = countyJsonData.reduce(
      (acc, curr) => {
        const fipsKey = curr.fips || (curr as any).FIPS;
        if (fipsKey) {
          const normalizedFips = String(fipsKey).padStart(5, "0");
          acc[normalizedFips] = curr;
        }
        return acc;
      },
      {} as Record<string, CountyData>,
    );

    fipsLookupRef.current = lookup;
  }, [countyJsonData]);

  useEffect(() => {
    fetch("/mapdata.json")
      .then((res) => res.json())
      .then((data) => setCountyJsonData(data))
      .catch((err) => console.error("JSON Load Error:", err));
  }, []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-119.4179, 36.7783],
      zoom: 5.2,
    });
    mapRef.current = map;

    map.on("load", async () => {
      const res = await fetch(
        "https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json",
      );
      const geojson = await res.json();

      const layers = map.getStyle().layers;

      if (layers) {
        layers.forEach((layer) => {
          const isException =
            layer.id === "county-regions" ||
            layer.id === "county-outline" ||
            layer.id === "county-labels" ||
            layer.type === "background";

          if (!isException) {
            map.setLayoutProperty(layer.id, "visibility", "none");
          }
        });
      }
const regionColorMap: Record<string, [string, string]> = {
  "06015": ["#c9db2a", "Del Norte"],
  "06023": ["#c9db2a", "Humboldt"],
  "06045": ["#c9db2a", "Mendocino"],
  "06033": ["#c9db2a", "Lake"],
  "06097": ["#c9db2a", "Sonoma"],
  "06093": ["#0099b5", "Siskiyou"],
  "06049": ["#0099b5", "Modoc"],
  "06089": ["#0099b5", "Shasta"],
  "06035": ["#0099b5", "Lassen"],
  "06103": ["#0099b5", "Tehama"],
  "06063": ["#0099b5", "Plumas"],
  "06007": ["#0099b5", "Butte"],
  "06021": ["#0099b5", "Glenn"],
  "06105": ["#0099b5", "Trinity"],
  "06011": ["#8cd7f4", "Colusa"],
  "06113": ["#8cd7f4", "Yolo"],
  "06101": ["#8cd7f4", "Sutter"],
  "06067": ["#8cd7f4", "Sacramento"],
  "06115": ["#8cd7f4", "Yuba"],
  "06091": ["#8cd7f4", "Sierra"],
  "06057": ["#8cd7f4", "Nevada"],
  "06061": ["#8cd7f4", "Placer"],
  "06017": ["#8cd7f4", "El Dorado"],
  "06003": ["#8cd7f4", "Alpine"],
  "06081": ["#f79520", "San Mateo"],
  "06055": ["#f79520", "Napa"],
  "06095": ["#f79520", "Solano"],
  "06013": ["#f79520", "Contra Costa"],
  "06041": ["#f79520", "Marin"],
  "06075": ["#f79520", "San Francisco"],
  "06001": ["#f79520", "Alameda"],
  "06087": ["#65be4f", "Santa Cruz"],
  "06085": ["#65be4f", "Santa Clara"],
  "06069": ["#65be4f", "San Benito"],
  "06053": ["#65be4f", "Monterey"],
  "06005": ["#e92a39", "Amador"],
  "06009": ["#e92a39", "Calaveras"],
  "06109": ["#e92a39", "Tuolumne"],
  "06077": ["#e92a39", "San Joaquin"],
  "06099": ["#e92a39", "Stanislaus"],
  "06047": ["#fcc216", "Merced"],
  "06043": ["#fcc216", "Mariposa"],
  "06039": ["#fcc216", "Madera"],
  "06019": ["#fcc216", "Fresno"],
  "06031": ["#fcc216", "Kings"],
  "06107": ["#fcc216", "Tulare"],
  "06079": ["#0a8070", "San Luis Obispo"],
  "06029": ["#0a8070", "Kern"],
  "06083": ["#0a8070", "Santa Barbara"],
  "06111": ["#0a8070", "Ventura"],
  "06073": ["#c51883", "San Diego"],
  "06025": ["#c51883", "Imperial"],
  "06059": ["#c51883", "Orange"],
  "06051": ["#69308e", "Mono"],
  "06027": ["#69308e", "Inyo"],
  "06071": ["#69308e", "San Bernardino"],
  "06065": ["#69308e", "Riverside"],
  "06037": ["#00528a", "Los Angeles"],
};

      geojson.features.forEach((f: any) => {
        f.properties.color = regionColorMap[f.id] ? regionColorMap[f.id][0] : "#cccccc";
        f.properties.name = regionColorMap[f.id] ? regionColorMap[f.id][1] : "";
        f.properties.fips = f.id;
      });

      map.addSource("counties", {
        type: "geojson",
        data: geojson,
        promoteId: "fips",
      });

      map.addLayer({
        id: "county-regions",
        type: "fill",
        source: "counties",
        filter: ["!=", ["get", "color"], "#cccccc"],
        paint: {
          "fill-color": ["get", "color"],
          "fill-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1,
            0.6,
          ],
        },
      });

      map.addLayer({
        id: "county-outline",
        type: "line",
        source: "counties",
        paint: {
          "line-color": "#fff",
          "line-width": 2.5,
        },
        filter: ["==", ["get", "fips"], ""],
      });

      map.addLayer({
        id: "county-labels",
        type: "symbol",
        source: "counties",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#000000",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1,
        },
      });
    });

    return () => map.remove();
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const onMouseMove = (e: mapboxgl.MapLayerMouseEvent) => {
      if (e.features && e.features.length > 0) {
        const fips = e.features[0].properties?.fips;

        if (fips && fipsLookupRef.current[fips]) {
          map.getCanvas().style.cursor = "pointer";

          if (fips !== lastHoveredFips.current) {
            if (lastHoveredFips.current) {
              map.setFeatureState(
                { source: "counties", id: lastHoveredFips.current },
                { hover: false },
              );
            }

            lastHoveredFips.current = fips;

            map.setFeatureState(
              { source: "counties", id: fips },
              { hover: true },
            );

            if (!selectedFipsRef.current) {
              setHoveredData(fipsLookupRef.current[fips]);
            }
          }
        } else {
          onMouseLeave();
        }
      }
    };

    const onMouseLeave = () => {
      map.getCanvas().style.cursor = "";
      if (lastHoveredFips.current) {
        map.setFeatureState(
          { source: "counties", id: lastHoveredFips.current },
          { hover: false },
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
        map.setFilter("county-outline", ["==", ["get", "fips"], ""]);
      } else {
        selectedFipsRef.current = fips;
        setSelectedFips(fips);
        setHoveredData(fipsLookupRef.current[fips]);
        map.setFilter("county-outline", ["==", ["get", "fips"], fips]);
      }
      (e.originalEvent as any)._handled = true;
    };

    const onMapClick = (e: mapboxgl.MapMouseEvent) => {
      if (!(e.originalEvent as any)._handled) {
        selectedFipsRef.current = null;
        setSelectedFips(null);
        setHoveredData(null);
        map.setFilter("county-outline", ["==", ["get", "fips"], ""]);
      }
    };

    map.on("mousemove", "county-regions", onMouseMove);
    map.on("mouseleave", "county-regions", onMouseLeave);
    map.on("click", "county-regions", onClick);
    map.on("click", onMapClick);

    return () => {
      map.off("mousemove", "county-regions", onMouseMove);
      map.off("mouseleave", "county-regions", onMouseLeave);
      map.off("click", "county-regions", onClick);
      map.off("click", onMapClick);
    };
  }, [countyJsonData]);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full overflow-hidden">
      <div ref={mapContainer} className="flex-1 md:flex-3 w-full" />
      <div className="p-6 text-[#002856] bg-white overflow-y-auto flex flex-col items-center h-auto max-h-[500px] md:max-h-none md:flex-1 border-t md:border-t-0 md:border-l border-[#ddd] shadow-[0_-2px_10px_rgba(0,0,0,0.05)] md:shadow-none">
        <picture className="flex place-items-center place-self-center justify-center">
      <source media="(min-width: 768px)" srcSet="/California-County-Superintendents---Secondary-Logo.png" />
      <source media="(max-width: 767px)" srcSet="/California-County-Superintendents---Primary-Logo.png" />
     <Image
        src="/"
        alt="California County Superintendents Logo "
        width={200}
        height={200}
        className="bg-cover flex place-items-center place-self-center justify-center"
        style={{height: "auto"}}
        loading="eager"
      />
    </picture>

        {hoveredData ? (
          <div className="text-center openSans">
            <h3 className="text-lg font-extrabold mt-2 border-t-[#FFC600] border-t-2 pt-2">{hoveredData.Region}</h3>
            <p className="text-[#002856] text-md font-bold pb-2 border-b-2 border-b-[#FFC600]">{hoveredData.County}</p>
            <div className="space-y-3 text-sm">
              <p className="text-sm mt-5 text-[#002856]">
                {hoveredData.Point}, {hoveredData.Role} <br/>
               <b>{hoveredData.Class}</b> | <b>Charters:</b> {hoveredData.Charters} | <b>Districts:</b> {hoveredData.Districts}
              </p>
              <p><b>ADA: </b>{hoveredData.ADA}</p>
              <p>
                {hoveredData.Address}
              </p>
            </div>

            <div className="mt-5 flex flex-col items-center gap-3">
              {/* <a
  href={hoveredData.Url}
  target="_blank"
  rel="noopener noreferrer"
  className="bg-[#002856] text-white px-4 py-2 rounded shadow hover:bg-[#003d66] transition-colors inline-block w-full max-w-[200px]">
  Official Website
</a> */}

<button  onClick={() => {
    window.open(hoveredData.Url, "_blank", "noopener,noreferrer");
  }}
  className="bg-[#002856] text-white px-4 py-2 rounded shadow hover:bg-[#003d66] transition-colors inline-block w-full max-w-[200px]">Official Website</button>

              {selectedFips && (
                <button
                  onClick={() => {
                    selectedFipsRef.current = null;
                    setSelectedFips(null);
                    setHoveredData(null);
                    mapRef.current?.setFilter("county-outline", [
                      "==",
                      ["get", "fips"],
                      "",
                    ]);
                  }}
                  className="text-[#002856] text-xs underline cursor-pointer"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>
        ) : (
          <p className="text-[#002856] text-center mt-8 text-sm">
            Hover over a county or click to lock details.
          </p>
        )}
      </div>
    </div>
  );
}
