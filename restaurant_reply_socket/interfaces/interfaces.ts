export interface ReservationInfoApiObject {
    customerId: number;
    status: ReservationStatus;
}

export interface ReservationWithId {
    id: number;
    customerName: string;
    customerId: number;
    restaurantId: number;
    restaurantName: string;
    timeOfArrival: Date;
    amountOfGuests: number;
    status: ReservationStatus;
}

export enum ReservationStatus{
    WAITING = "waiting",
    APPROVED = "approved",
    DECLINED = "declined"
}
