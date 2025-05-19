type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  [key: string]: any;
};

export type NominatimResponse = {
  address?: NominatimAddress;
};
