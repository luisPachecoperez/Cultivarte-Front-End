export interface Sessions {
   session_id: string;
   user_id: string;
   user_email: string;
   user_name: string;
   user_picture: string;
   ip: string;
   ua: string;
   created_at: Date;
   last_access: Date;
   expires_at: Date;
   revoked: boolean;
   user_uuid: string;
   syncStatus: string;
}
