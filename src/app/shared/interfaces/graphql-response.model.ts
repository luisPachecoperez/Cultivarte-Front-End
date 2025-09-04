export interface GraphQLResponse<T = void> {
  exitoso: string;
  mensaje: string;
  data?: T;
}
