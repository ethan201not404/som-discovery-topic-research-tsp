let map;
let routeSegments = [];
let currentSegment = 0;
let lastPokeStopToSchool;

// Coordinates for your school (e.g mine is on Harbord Street and Shaw Street)
const schoolCoord = [43.6571, -79.4211]; // Replace with your school's actual coordinates

// Define coordinates for PokéStops and Gym arranged around Harbord Street and Shaw Street
const pokestopCoords = [
  [43.6571, -79.4011], // Replace with your school's actual
  [43.6371, -79.43], // Replace with actual coordinates
  [43.6471, -79.4011], // Replace with actual coordinates
  // [43.6371, -79.4231], // Replace with actual coordinates
];

function calculateDistance(coord1, coord2) {
  const lat1 = coord1[0];
  const lon1 = coord1[1];
  const lat2 = coord2[0];
  const lon2 = coord2[1];
  const radlat1 = (Math.PI * lat1) / 180;
  const radlat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  dist = dist * 1.609344; // Convert to kilometers
  return dist.toFixed(2); // Return the distance as a fixed decimal number
}

function createOptimizedRoute(coords) {
  let optimizedRoute = [coords[0]];
  const remainingCoords = [...coords];
  remainingCoords.shift();

  while (remainingCoords.length > 0) {
    const lastCoord = optimizedRoute[optimizedRoute.length - 1];
    let shortestDistance = Number.MAX_VALUE;
    let nearestNeighbor = null;
    for (const coord of remainingCoords) {
      const dist = calculateDistance(lastCoord, coord);
      if (dist < shortestDistance) {
        shortestDistance = dist;
        nearestNeighbor = coord;
      }
    }
    if (nearestNeighbor) {
      optimizedRoute.push(nearestNeighbor);
      remainingCoords.splice(remainingCoords.indexOf(nearestNeighbor), 1);
    } else {
      // No more valid neighbors, break the loop.
      break;
    }
  }

  return optimizedRoute;
}

function createLinesAndDistances(coords) {
  const labelOffsets = new Map(); // Store offsets for each label position

  for (let i = 0; i < coords.length; i++) {
    for (let j = i + 1; j < coords.length; j++) {
      const startPoint = coords[i];
      const endPoint = coords[j];
      const distance = calculateDistance(startPoint, endPoint);

      // Calculate the middle point for displaying the distance label
      const middleLatLng = L.latLng(
        (startPoint[0] + endPoint[0]) / 2,
        (startPoint[1] + endPoint[1]) / 2
      );

      // Check for existing labels at or close to the middle point
      let labelOffset = 0;
      const existingOffset = labelOffsets.get(middleLatLng.toString());

      if (existingOffset !== undefined) {
        // If an offset is already assigned to this point, use it
        labelOffset = existingOffset;
      } else {
        // Check for overlapping labels
        while (
          labelOffsets.has(middleLatLng.toString()) ||
          labelOffsets.has(
            L.latLng(
              middleLatLng.lat + labelOffset,
              middleLatLng.lng + labelOffset
            ).toString()
          )
        ) {
          labelOffset += 0.0001; // Adjust this value based on your map's scale
        }

        // Store the offset for this label position
        labelOffsets.set(middleLatLng.toString(), labelOffset);
      }

      // Adjust the middle point based on the offset
      const adjustedLatLng = L.latLng(
        middleLatLng.lat + labelOffset,
        middleLatLng.lng + labelOffset
      );

      // Add a line connecting each pair of points
      const line = L.polyline([startPoint, endPoint], {
        color: "grey", // Change the color to your preference
        opacity: 0.7,
        weight: 2,
      }).addTo(map);

      routeSegments.push(line);

      // Display the distance label on the line
      const distanceLabel = L.divIcon({
        className: "distance-label",
        html: `<span style="color: Crimson; font-size: 16px;">${distance} km</span>`,
        html: `<span style="color: Crimson; font-size: 16px;">${distance} km</span>`,
        iconSize: [30, 10],
        iconAnchor: [25, 0],
      });

      // Add the label to the adjusted middle point
      L.marker(adjustedLatLng, { icon: distanceLabel }).addTo(map);
    }
  }
}

function createMapAndRoute() {
  map = L.map("map").setView([43.6571, -79.4211], 15);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // Create a custom marker for your school
  L.marker(schoolCoord, {
    icon: L.icon({
      iconUrl: "school.png", // Replace with your custom school marker icon URL
      iconSize: [32, 32],    // Adjust icon size as needed
      iconAnchor: [16, 32],  // Adjust icon anchor point as needed
    }),
  }).addTo(map);

  // Create custom markers for PokéStops and Gym using your own icons
  pokestopCoords.forEach((coord, index) => {
    L.marker(coord, {
      icon: L.icon({
        iconUrl: "pokestop.png", // Replace with your custom PokéStop icon URL
        iconSize: [32, 32],      // Adjust icon size as needed
        iconAnchor: [16, 32],    // Adjust icon anchor point as needed
      }),
    }).addTo(map);
    }).addTo(map);
  });

  // Create an optimized route using the nearest neighbor approach
  const coords = [schoolCoord, ...pokestopCoords];
  const optimizedRoute = createOptimizedRoute(coords);

  routeSegments = [];
  for (let i = 0; i < optimizedRoute.length - 1; i++) {
    const startPoint = optimizedRoute[i];
    const endPoint = optimizedRoute[i + 1];
    const distance = calculateDistance(startPoint, endPoint);

    // Add a line connecting each pair of points
    const line = L.polyline([startPoint, endPoint], {
      color: "blue",
      opacity: 0.7,
      weight: 3,
    }).addTo(map);

    routeSegments.push(line);

    // Calculate the middle point for displaying the distance label
    const middleLatLng = L.latLng(
      (startPoint[0] + endPoint[0]) / 2,
      (startPoint[1] + endPoint[1]) / 2
    );

    // Display the distance label on the line
    if (distance !== "0.00") {
      const distanceLabel = L.divIcon({
        className: "distance-label",
        html: `<span style="color: Crimson; font-size: 16px;">${distance} km</span>`,
        iconSize: [50, 20],
        iconAnchor: [25, 0],
      });
      L.marker(middleLatLng, { icon: distanceLabel }).addTo(map);
    }
  }

  // Add a line connecting the last PokeStop to your school (origin)
  const lastPokeStop = optimizedRoute[optimizedRoute.length - 1];
  lastPokeStopToSchool = L.polyline([lastPokeStop, schoolCoord], {
    color: "grey",
    opacity: 0.7,
    weight: 3,
  }).addTo(map);

  // Display the distance label for the last leg
  const lastPokeStopDistance = calculateDistance(lastPokeStop, schoolCoord);
  if (lastPokeStopDistance !== "0.00") {
    const lastPokeStopDistanceLabel = L.divIcon({
      className: "distance-label",
      html: `<span style="color: Crimson; font-size: 16px;">${lastPokeStopDistance} km</span>`,
      iconSize: [50, 20],
      iconAnchor: [25, 0],
    });
    const lastPokeStopMidpoint = L.latLng(
      (lastPokeStop[0] + schoolCoord[0]) / 2,
      (lastPokeStop[1] + schoolCoord[1]) / 2
    );
    L.marker(lastPokeStopMidpoint, { icon: lastPokeStopDistanceLabel }).addTo(
      map
    );
  }

  // Create lines connecting each pair of points with distances
  createLinesAndDistances(coords);

  // Fit the map to show all markers and polylines
  const bounds = L.latLngBounds([...pokestopCoords, schoolCoord]);
  map.fitBounds(bounds);
}

function toggleNextSegment() {
  currentSegment++;
  if (currentSegment < routeSegments.length) {
    const segment = routeSegments[currentSegment];
    segment.addTo(map);
  } else {
    if (lastPokeStopToSchool) {
      lastPokeStopToSchool.addTo(map);
    } else {
      lastPokeStopToSchool = L.polyline(
        [
          routeSegments[routeSegments.length - 1].getLatLngs()[1],
          routeSegments[0].getLatLngs()[0],
        ],
        {
          color: "grey",
          opacity: 0.7,
          weight: 3,
        }
      );
      lastPokeStopToSchool.addTo(map);
    }
  }
}

function createDistanceMatrix(coords) {
  const matrix = [];
  for (let i = 0; i < coords.length; i++) {
    matrix[i] = [];
    for (let j = 0; j < coords.length; j++) {
      if (i === j) {
        matrix[i][j] = 0; // Distance from a point to itself is 0
      } else {
        const distance = calculateDistance(coords[i], coords[j]);
        matrix[i][j] = distance;
      }
    }
  }
  return matrix;
}

function displayDistanceMatrix(matrix, coords) {
  const matrixContainer = document.createElement("div");
  matrixContainer.className = "distance-matrix";
  matrixContainer.style.position = "absolute";
  matrixContainer.style.top = "20px";
  matrixContainer.style.right = "20px";
  matrixContainer.style.backgroundColor = "white";
  matrixContainer.style.padding = "10px";
  matrixContainer.style.zIndex = "1000";

  const table = document.createElement("table");

  const headerRow = document.createElement("tr");

  const emptyHeaderCell = document.createElement("th");
  headerRow.appendChild(emptyHeaderCell);

  for (let i = 0; i < coords.length; i++) {
    const headerCell = document.createElement("th");
    headerCell.textContent = `Point ${i + 1}`;
    headerRow.appendChild(headerCell);
  }
  table.appendChild(headerRow);

  for (let i = 0; i < coords.length; i++) {
    const row = document.createElement("tr");

    const rowHeader = document.createElement("th");
    rowHeader.textContent = `Point ${i + 1}`;
    row.appendChild(rowHeader);

    for (let j = 0; j < coords.length; j++) {
      const cell = document.createElement("td");
      cell.textContent = matrix[i][j];
      row.appendChild(cell);
    }
    table.appendChild(row);
  }

  matrixContainer.appendChild(table);
  document.body.appendChild(matrixContainer);
}

function adjustMapPosition() {
  const mapContainer = document.getElementById("map");
  mapContainer.style.marginTop = "30px"; // Adjust the margin as needed
}

function initMap() {
  createMapAndRoute();
  const header = document.createElement("h1");
  document.body.insertBefore(header, document.getElementById("map"));
  const coords = [schoolCoord, ...pokestopCoords];
  const distanceMatrix = createDistanceMatrix(coords);
  displayDistanceMatrix(distanceMatrix, coords);
  adjustMapPosition(); // Adjust map position after rendering the matrix
}

window.onload = initMap;
