export interface CustomerMessage {
    customerId: number;
}

export enum ReservationStatus{
    WAITING = "waiting",
    APPROVED = "approved",
    DECLINED = "declined"
}

