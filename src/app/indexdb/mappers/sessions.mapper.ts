import { Sessions } from '../interfaces/sessions';

export class SessionsMapper {
  static toDomain(row: any): Sessions {
    return {
      session_id: row.session_id,
      user_id: row.user_id,
      user_email: row.user_email,
      user_name: row.user_name,
      user_picture: row.user_picture,
      ip: row.ip,
      ua: row.ua,
      created_at: row.created_at,
      last_access: row.last_access,
      expires_at: row.expires_at,
      revoked: row.revoked,
      user_uuid: row.user_uuid
    } as Sessions;
  }

  static toPersistence(entity: Sessions): any {
    return {
      session_id: entity.session_id,
      user_id: entity.user_id,
      user_email: entity.user_email,
      user_name: entity.user_name,
      user_picture: entity.user_picture,
      ip: entity.ip,
      ua: entity.ua,
      created_at: entity.created_at,
      last_access: entity.last_access,
      expires_at: entity.expires_at,
      revoked: entity.revoked,
      user_uuid: entity.user_uuid
    };
  }
}
