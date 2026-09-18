export interface Transaction {
  id: string;
  amount: number;
  item_note?: string;
  status: 'PENDING' | 'SUCCESS' | 'FRAUD' | 'STANDBY';
  live_input?: string;
  created_at?: string;
}

export interface BlueprintData {
  product: string;
  audience: string;
  costs: string;
  registered: string;
}

export interface GrantScheme {
  id: string;
  title: string;
  amount: string;
  criteria: string;
  matchScore: number;
  focusArea: string;
  registrationRequired: boolean;
  maxFunding: string;
}

export interface BillItem {
  id: string;
  name: string;
  hindiName?: string;
  price: number;
  quantity: number;
  category?: string;
  hsn?: string;
}

export type DashboardTab = 'treasurer' | 'fraud' | 'gst' | 'blueprint' | 'grants' | 'copilot';

export interface MerchantProfile {
  businessType: string;
  primaryOfferings: string;
  targetCustomer: string;
  typicalTicket: string;
  goalsAndWants: string[];
  customNotes: string;
  aiLearnedInsights: string[];
  languagePreference: 'hindi' | 'hinglish' | 'english';
}

export interface CopilotChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  learnedInsight?: string;
}

