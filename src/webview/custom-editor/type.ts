export interface DocumentRequest {
  id: number;
  method: string;
  args?: any[];
}
export interface DocumentResponse {
  id: number;
  method: string;
  data: any;
}
