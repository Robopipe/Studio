export type Endpoint = string;
export interface EndpointGroup {
  [key: string]: Endpoint | EndpointGroup;
}

export type ApiConfig = {
  baseUrl: string;
  endpoints: EndpointGroup;
};
