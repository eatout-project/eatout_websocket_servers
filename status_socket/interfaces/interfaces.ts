export interface CustomerMessage {
    customerId: number;
}

export enum ReservationStatus{
    WAITING = "waiting",
    APPROVED = "approved",
    DECLINED = "declined"
}

export interface MessageApiObject {
    id: number,
    customerName: string,
    customerId: number,
    restaurantId: number,
    restaurantName: string,
    timeOfArrival: string,
    amountOfGuests: number,
    status: string
}
