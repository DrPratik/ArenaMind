/**
 * Function-calling tool declarations for Gemini.
 * These map 1:1 to the rules resolution layer functions.
 */
export const toolDeclarations = [
  {
    name: 'getGateStatus',
    description: 'Get the current status and crowd level of a specific gate. Returns the gate details and, if the gate is busy, suggests an alternative less-crowded gate.',
    parameters: {
      type: 'object' as const,
      properties: {
        gateId: {
          type: 'number' as const,
          description: 'The gate number (1-8)',
        },
      },
      required: ['gateId'],
    },
  },
  {
    name: 'getRoute',
    description: 'Get walking directions between two locations in the stadium. Locations can be gates or amenities.',
    parameters: {
      type: 'object' as const,
      properties: {
        fromId: {
          type: 'number' as const,
          description: 'The ID of the starting location',
        },
        toId: {
          type: 'number' as const,
          description: 'The ID of the destination',
        },
        fromType: {
          type: 'string' as const,
          description: 'Type of starting location: "gate" or "amenity"',
          enum: ['gate', 'amenity'],
        },
        toType: {
          type: 'string' as const,
          description: 'Type of destination: "gate" or "amenity"',
          enum: ['gate', 'amenity'],
        },
        mode: {
          type: 'string' as const,
          description: 'Route mode: "standard", "wheelchair", "fastest", or "less_crowded"',
          enum: ['standard', 'wheelchair', 'fastest', 'less_crowded'],
        },
      },
      required: ['fromId', 'toId'],
    },
  },
  {
    name: 'getFoodQueue',
    description: 'Get current queue wait times for food stalls. Can query a specific stall or all stalls.',
    parameters: {
      type: 'object' as const,
      properties: {
        stallId: {
          type: 'number' as const,
          description: 'Optional: specific stall ID. If omitted, returns all stalls sorted by shortest queue.',
        },
        tags: {
          type: 'array' as const,
          items: { type: 'string' as const },
          description: 'Optional: dietary preferences to filter by (e.g., "veg", "halal", "gluten_free")',
        },
      },
    },
  },
  {
    name: 'getCrowdForecast',
    description: 'Get crowd level forecast for a specific gate, predicting the crowd level N minutes into the future based on historical trends.',
    parameters: {
      type: 'object' as const,
      properties: {
        gateId: {
          type: 'number' as const,
          description: 'The gate number (1-8)',
        },
        minutesAhead: {
          type: 'number' as const,
          description: 'How many minutes ahead to forecast (default: 20)',
        },
      },
      required: ['gateId'],
    },
  },
  {
    name: 'fileIncident',
    description: 'File a new incident report. Priority and department are auto-assigned based on type.',
    parameters: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string' as const,
          description: 'Incident type',
          enum: ['medical', 'security', 'maintenance', 'crowd', 'lost_child', 'other'],
        },
        location: {
          type: 'string' as const,
          description: 'Where the incident occurred (e.g., "West Concourse near Gate 8")',
        },
        gateId: {
          type: 'number' as const,
          description: 'Nearest gate ID (1-8)',
        },
        note: {
          type: 'string' as const,
          description: 'Description of the incident',
        },
      },
      required: ['type', 'location', 'gateId', 'note'],
    },
  },
  {
    name: 'searchLostFound',
    description: 'Search the lost and found database for items matching a description.',
    parameters: {
      type: 'object' as const,
      properties: {
        description: {
          type: 'string' as const,
          description: 'Description of the lost item to search for',
        },
      },
      required: ['description'],
    },
  },
  {
    name: 'findNearestAmenity',
    description: 'Find the nearest amenity of a given type (restroom, medical, prayer_room, nursing_room, food, info_desk) to a specific gate.',
    parameters: {
      type: 'object' as const,
      properties: {
        gateId: {
          type: 'number' as const,
          description: 'The gate number to search near (1-8)',
        },
        amenityType: {
          type: 'string' as const,
          description: 'Type of amenity to find',
          enum: ['restroom', 'medical', 'prayer_room', 'nursing_room', 'food', 'info_desk'],
        },
      },
      required: ['gateId', 'amenityType'],
    },
  },
  {
    name: 'getOverloadRisk',
    description: 'Get a list of all gates at risk of reaching critical capacity. Returns trend data and estimated time to critical for each at-risk gate.',
    parameters: {
      type: 'object' as const,
      properties: {},
    },
  },
];
