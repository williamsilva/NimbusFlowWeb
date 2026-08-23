export interface PaymentOrderCandidateModel {
  id: string;
  projectName: string;
  workName: string;
  number: number;
  amount: number;
  dueDate: string;
  releasedAt: string | null;
}

export interface SendPaymentOrderResultModel {
  installmentId: string;
  orderCount: number;
  totalAmount: number;
}
