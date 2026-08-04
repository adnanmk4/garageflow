export interface ServiceLineClient {
  id: string;
  templateId?: string | null;
  name: string;
  translationKey?: string | null;
}

export interface PartLineClient {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface LaborLineClient {
  id: string;
  name: string;
  amount: number;
}

export interface JobFormState {
  regNumber: string;
  showCustomerDetails: boolean;
  customerName: string;
  phone: string;
  vehicleBrand: string;
  vehicleModel: string;
  mileage: string;
  services: ServiceLineClient[];
  parts: PartLineClient[];
  labor: LaborLineClient[];
  discount: number;
  paidAmount: number;
}

export const emptyJobForm: JobFormState = {
  regNumber: "",
  showCustomerDetails: false,
  customerName: "",
  phone: "",
  vehicleBrand: "",
  vehicleModel: "",
  mileage: "",
  services: [],
  parts: [],
  labor: [],
  discount: 0,
  paidAmount: 0,
};

let idCounter = 0;
export function nextClientId() {
  idCounter += 1;
  return `c${Date.now()}_${idCounter}`;
}
