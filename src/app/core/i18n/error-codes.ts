export type GlobalErrorCode =
  | 'GENERIC_ERROR'
  | 'NETWORK_ERROR'
  | 'ACCESS_DENIED'
  | 'SESSION_EXPIRED'
  | 'NOT_FOUND'
  // Users
  | 'USER_NOT_FOUND'
  | 'USER_DOCUMENT_ALREADY_EXISTS'
  | 'USER_USERNAME_ALREADY_EXISTS'
  | 'USER_DELETE_NOT_ALLOWED'
  | 'USER_UPDATE_NOT_ALLOWED'
  | 'GROUP_NAME_ALREADY_EXISTS'
  | 'GROUP_DELETE_SUPPORT_NOT_ALLOWED'
  | 'GROUP_DELETE_IN_USE'
  | 'PERMISSION_NOT_FOUND';

export type FieldErrorCode =
  | 'required'
  | 'email'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'duplicate'
  | 'invalid';

export type UserFieldName = 'userName' | 'name' | 'document' | 'status' | 'groupIds';
export type FieldNameOrWildcard<TField extends string> = TField | '*';
