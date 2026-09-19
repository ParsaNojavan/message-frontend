export interface SendOtpResponse {
  message: string;
  success: boolean;
  expiresIn?: number;
}