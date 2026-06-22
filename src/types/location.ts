interface AccountLocation {
    lat: number;
    lng: number;
    label: string;
    updatedAt: string;
}

interface HomeLocation {
    lat: number;
    lng: number;
    address: string;
}

export type {
  AccountLocation,
  HomeLocation,
}
