export interface ReservationInfoApiObject {
    customerId: number;
    status: ReservationStatus;
}

export enum ReservationStatus{
    WAITING = "waiting",
    APPROVED = "approved",
    DECLINED = "declined"
}
