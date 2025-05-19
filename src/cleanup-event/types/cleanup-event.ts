interface Region {
  name: string;
  latitude: number;
  longitude: number;
}

interface Settlement {
  name: string;
  latitude: number;
  longitude: number;
  region: Region;
}

interface CleanupEventLocation {
  latitude: number;
  longitude: number;
}

interface TakePart {
  id: string;
  user: {
    name: string;
  };
}

export interface CleanupEvent {
  id: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  status: string;
  imageUrl: string;
  settlementId: string;
  organizerId: string;
  createdAt: Date;
  updatedAt: Date;
  settlement: Settlement;
  location: CleanupEventLocation;
  takePart: TakePart[];
}
