export interface RoomMuteResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: {
    roomId: string;
    muted: string | null;
  };
}