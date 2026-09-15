import React from "react";
import { TileLayer } from "react-leaflet";
import { OSM_ATTRIBUTION, OSM_TILE_URL } from "./osm";

/** OpenStreetMap tiles with the attribution their licence requires. See ./osm.js. */
const OsmTileLayer = () => <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />;

export default OsmTileLayer;
